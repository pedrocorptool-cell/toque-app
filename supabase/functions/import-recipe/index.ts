// Toqué : lit une recette (lien web ou photo) avec Claude et la renvoie dans le format de l'app.
// À coller dans Supabase > Edge Functions > Deploy a new function > Via Editor, nom « import-recipe ».
// Secret requis : ANTHROPIC_API_KEY (Edge Functions > Secrets).
import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0';
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

type Body =
  | { kind: 'url'; url: string; categories?: { id: string; label: string }[] }
  | { kind: 'image'; data: string; mediaType: string; categories?: { id: string; label: string }[] };

/** Codes lus par l'app pour choisir son écran d'erreur. */
type ErrorCode = 'unauthorized' | 'bad_request' | 'not_a_recipe' | 'page_unreachable' | 'no_credits' | 'ai_failed';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const fail = (error: ErrorCode, status: number) => json({ error }, status);

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('bad_request', 405);

  // Seuls les téléphones rattachés à un espace Toqué peuvent dépenser les crédits.
  const auth = req.headers.get('Authorization');
  const key = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!auth) return fail('unauthorized', 401);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, key, { global: { headers: { Authorization: auth } } });
  const { data: space, error: spaceError } = await db.rpc('my_space');
  if (spaceError || !space) return fail('unauthorized', 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail('bad_request', 400);
  }

  let content: Anthropic.Beta.BetaContentBlockParam[];
  let page: Awaited<ReturnType<typeof readPage>> | null = null;
  if (body.kind === 'url' && typeof body.url === 'string') {
    page = await readPage(body.url).catch(() => null);
    if (!page) return fail('page_unreachable', 422);
    content = [{ type: 'text', text: `Page : ${page.url}\n\n${page.text}` }];
  } else if (body.kind === 'image' && typeof body.data === 'string') {
    const mediaType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(body.mediaType)
      ? (body.mediaType as 'image/jpeg')
      : 'image/jpeg';
    content = [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: body.data } }];
  } else {
    return fail('bad_request', 400);
  }

  const categories = (body.categories ?? []).filter((c) => c && typeof c.id === 'string').slice(0, 30);
  content.push({ type: 'text', text: instructions(categories) });

  try {
    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: schema(categories.map((c) => c.id)) } },
      messages: [{ role: 'user', content }],
    });
    if (response.stop_reason === 'refusal') return fail('ai_failed', 502);
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const recipe = JSON.parse(text);
    if (!recipe.is_recipe || !recipe.steps?.length) return fail('not_a_recipe', 422);
    console.log('import ok', { space, kind: body.kind, usage: response.usage });

    // Images copiées dans le stockage de l'espace : les liens des réseaux sociaux expirent au bout de quelques
    // jours, et une photo prise sur le téléphone devient visible partout.
    const store = (url: string | null) => (url ? storeImage(db, space, url) : Promise.resolve(null));
    const [image, avatar] = await Promise.all([
      body.kind === 'image'
        ? storeImage(db, space, `data:${body.mediaType || 'image/jpeg'};base64,${body.data}`)
        : store(page!.image),
      body.kind === 'url' ? findAvatar(page!, recipe.creator_handle).then(store) : Promise.resolve(null),
    ]);
    return json({
      title: recipe.title,
      creator: recipe.creator || null,
      duration: recipe.duration,
      servings: Math.max(1, recipe.servings),
      kcal: recipe.kcal,
      categories: recipe.category ? [recipe.category] : [],
      ingredients: recipe.ingredients.map((i: { qty: number | null; name: string }) =>
        i.qty == null ? { name: i.name } : { qty: i.qty, name: i.name },
      ),
      steps: recipe.steps.map((s: { text: string; timer: number | null }) =>
        s.timer ? { text: s.text, timer: s.timer } : { text: s.text },
      ),
      tip: recipe.tip || null,
      estimated: Boolean(recipe.estimated),
      image,
      avatar,
      url: page?.url ?? null,
    });
  } catch (error) {
    console.error('import failed', error);
    // Crédits épuisés : Anthropic répond 400 « Your credit balance is too low… ».
    if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) {
      return fail('no_credits', 402);
    }
    return fail('ai_failed', 502);
  }
});

function instructions(categories: { id: string; label: string }[]) {
  return [
    'Extrais la recette de ce contenu (page web, publication de réseau social ou photo) pour l’app de cuisine Toqué.',
    'Réponds en français, même si la source est dans une autre langue, et reste fidèle à la recette d’origine.',
    'Si le contenu ne contient pas de recette, mets is_recipe à false et laisse les listes vides.',
    'Quand les ingrédients sont écrits dans le contenu, recopie exactement leurs quantités (« 160 g d’œufs (= 3 ' +
      'gros œufs) » reste tel quel) et mets estimated à false.',
    'Si le plat est identifiable mais que ses ingrédients ou leurs quantités ne sont pas écrits (recette seulement ' +
      'dans la vidéo ou en commentaire), propose une recette classique et fiable de ce plat, en t’appuyant sur ce ' +
      'que montre le contenu, et mets estimated à true.',
    'Si les ingrédients sont écrits mais pas les étapes, déduis des étapes courtes et simples à partir d’eux.',
    'title : le nom du plat, court, sans emoji.',
    'creator : l’auteur, le compte ou le site (« Marmiton », « Jow », un pseudo Instagram…), vide si inconnu.',
    'creator_handle : pour une publication de réseau social, le pseudo du compte qui l’a publiée, sans @ ; sinon vide.',
    'duration : le temps total en minutes (préparation et cuisson), estimé si absent.',
    'servings : le nombre de parts pour lequel les quantités sont écrites.',
    'kcal : une estimation des calories par part.',
    'ingredients : qty est le nombre seul, pour servings parts (null si aucun : « Sel, poivre ») ; name est le texte ' +
      'après la quantité, unité comprise : { qty: 200, name: "g de farine" }, { qty: 2, name: "œufs" }, ' +
      '{ qty: 10, name: "cl de crème" }.',
    'steps : une action par étape, phrase courte à l’infinitif. timer : la durée en secondes quand l’étape demande ' +
      'd’attendre (cuisson, repos), sinon null.',
    'tip : une astuce donnée par la source, ou null.',
    categories.length
      ? `category : la catégorie qui convient le mieux, une seule, parmi ${categories.map((c) => `${c.id} (${c.label})`).join(', ')} ; null si aucune ne convient.`
      : 'category : null.',
  ].join('\n');
}

function schema(categoryIds: string[]) {
  const nullable = (type: string) => ({ anyOf: [{ type }, { type: 'null' }] });
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'is_recipe',
      'title',
      'creator',
      'duration',
      'servings',
      'kcal',
      'category',
      'ingredients',
      'steps',
      'tip',
      'estimated',
    ],
    properties: {
      is_recipe: { type: 'boolean' },
      title: { type: 'string' },
      creator: { type: 'string' },
      creator_handle: { type: 'string' },
      duration: { type: 'integer' },
      servings: { type: 'integer' },
      kcal: { type: 'integer' },
      // Une seule catégorie par recette importée.
      category: categoryIds.length
        ? { anyOf: [{ type: 'string', enum: categoryIds }, { type: 'null' }] }
        : { type: 'null' },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['qty', 'name'],
          properties: { qty: nullable('number'), name: { type: 'string' } },
        },
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['text', 'timer'],
          properties: { text: { type: 'string' }, timer: nullable('integer') },
        },
      },
      tip: nullable('string'),
      estimated: { type: 'boolean' },
    },
  };
}

const SOCIAL = /(^|\.)(instagram\.com|tiktok\.com|facebook\.com|fb\.watch)$/i;
const BROWSER_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/** Récupère la page et n'en garde que ce qui sert : données de recette, balises de partage et texte visible. */
async function readPage(input: string) {
  const url = new URL(input);
  if (!/^https?:$/.test(url.protocol)) throw new Error('protocol');
  // Les réseaux sociaux ne montrent la légende qu'aux robots d'aperçu de liens.
  const ua = SOCIAL.test(url.hostname) ? 'facebookexternalhit/1.1' : BROWSER_UA;
  const res = await fetch(url, {
    headers: { 'User-Agent': ua, 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const html = (await res.text()).slice(0, 2_000_000);

  const meta = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, 'i'))?.[1] ??
    null;
  const jsonLd = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1].trim())
    .filter((block) => /recipe/i.test(block))
    .join('\n')
    .slice(0, 30_000);
  const visible = textOf(html.replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, ' ')).slice(
    0,
    jsonLd ? 8_000 : 30_000,
  );
  // La page d'une publication ne montre qu'un extrait de la légende : la légende complète vient à part.
  const post = await postOf(res.url).catch(() => null);
  const caption = post?.caption;

  const ogImage = meta('og:image') ?? meta('twitter:image');
  // Logo du site : l'icône d'écran d'accueil, sinon la plus grande icône PNG (les .ico et .svg ne s'affichent pas
  // dans l'app).
  const icons = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /rel=["'][^"']*icon[^"']*["']/i.test(tag))
    .map((tag) => ({
      href: tag.match(/href=["']([^"']+)["']/i)?.[1] ?? '',
      apple: /apple-touch-icon/i.test(tag),
      size: Number(tag.match(/sizes=["'](\d+)/i)?.[1] ?? 0),
    }))
    .filter((icon) => icon.href && !/\.(ico|svg)(\?|$)/i.test(icon.href))
    .sort((a, b) => Number(b.apple) - Number(a.apple) || b.size - a.size);
  const parts = [
    `Titre : ${decode(meta('og:title') ?? html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? '')}`,
    `Site : ${decode(meta('og:site_name') ?? url.hostname)}`,
    `Description : ${decode(meta('og:description') ?? meta('description') ?? '')}`,
    caption && `Légende complète de la publication :\n${caption}`,
    jsonLd && `Données de recette (JSON-LD) :\n${jsonLd}`,
    `Texte de la page :\n${visible}`,
  ];
  return {
    url: res.url,
    image: ogImage ? new URL(decode(ogImage), res.url).href : null,
    logo: icons[0] ? new URL(decode(icons[0].href), res.url).href : null,
    host: new URL(res.url).hostname,
    avatar: post?.avatar ?? null,
    text: parts.filter(Boolean).join('\n\n'),
  };
}

/** Avatar du compte pour une publication Instagram ou TikTok (photo de profil), logo du site sinon. */
async function findAvatar(
  page: { url: string; host: string; logo: string | null; avatar: string | null },
  handle: string,
) {
  // Photo de profil lue sur la page d'intégration du post : la page du profil demande souvent de se connecter.
  if (page.avatar) return page.avatar;
  const name = handle.replace(/^@/, '').trim();
  const profile = /^[\w.]+$/.test(name)
    ? /(^|\.)instagram\.com$/i.test(page.host)
      ? `https://www.instagram.com/${name}/`
      : /(^|\.)tiktok\.com$/i.test(page.host)
        ? `https://www.tiktok.com/@${name}`
        : null
    : null;
  if (profile) {
    const avatar = await readPage(profile)
      .then((p) => p.image)
      .catch(() => null);
    if (avatar) return avatar;
  }
  return SOCIAL.test(page.host) ? null : page.logo;
}

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Copie l'image dans le bucket public `recipe-images`, dans le dossier de l'espace. Garde le lien d'origine en cas
 *  d'échec. */
// deno-lint-ignore no-explicit-any
async function storeImage(db: any, space: string, url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(15000) });
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
    if (!res.ok || !IMAGE_TYPES[type]) return url.startsWith('data:') ? null : url;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > 6_000_000) return url.startsWith('data:') ? null : url;
    const path = `${space}/${crypto.randomUUID()}.${IMAGE_TYPES[type]}`;
    const { error } = await db.storage.from('recipe-images').upload(path, bytes, { contentType: type });
    if (error) throw error;
    return db.storage.from('recipe-images').getPublicUrl(path).data.publicUrl;
  } catch (error) {
    console.error('store image failed', error);
    return url.startsWith('data:') ? null : url;
  }
}

/** Texte visible d'un morceau de HTML, en gardant les retours à la ligne des listes et paragraphes. */
function textOf(html: string) {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|div|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n'),
  );
}

/** Légende entière d'une publication Instagram (page d'intégration) ou TikTok (oEmbed), et pour Instagram la photo
 *  de profil du compte. */
async function postOf(url: string): Promise<{ caption: string | null; avatar?: string | null } | null> {
  const insta = url.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([\w-]+)/i);
  if (insta) {
    const res = await fetch(`https://www.instagram.com/p/${insta[1]}/embed/captioned/`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const block =
      html.match(/<div class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments"/i)?.[1] ??
      html.match(/<div class="Caption"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)?.[1];
    const avatar = html.match(/class="Avatar[^"]*"[\s\S]{0,400}?<img[^>]*src="([^"]+)"/i)?.[1];
    console.log('instagram embed', { caption: Boolean(block), avatar: Boolean(avatar) });
    return { caption: block ? textOf(block).slice(0, 15_000) : null, avatar: avatar ? decode(avatar) : null };
  }
  if (/tiktok\.com/i.test(url)) {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const caption =
      [data.author_unique_id && `Compte : ${data.author_unique_id}`, data.title].filter(Boolean).join('\n') || null;
    return { caption };
  }
  return null;
}

function decode(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}
