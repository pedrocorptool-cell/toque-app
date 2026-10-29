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
  let image: string | null = null;
  let sourceUrl: string | null = null;
  if (body.kind === 'url' && typeof body.url === 'string') {
    const page = await readPage(body.url).catch(() => null);
    if (!page) return fail('page_unreachable', 422);
    image = page.image;
    sourceUrl = page.url;
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
    return json({
      title: recipe.title,
      creator: recipe.creator || null,
      duration: recipe.duration,
      servings: Math.max(1, recipe.servings),
      kcal: recipe.kcal,
      categories: recipe.categories,
      ingredients: recipe.ingredients.map((i: { qty: number | null; name: string }) =>
        i.qty == null ? { name: i.name } : { qty: i.qty, name: i.name },
      ),
      steps: recipe.steps.map((s: { text: string; timer: number | null }) =>
        s.timer ? { text: s.text, timer: s.timer } : { text: s.text },
      ),
      tip: recipe.tip || null,
      image,
      url: sourceUrl,
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
    'title : le nom du plat, court, sans emoji.',
    'creator : l’auteur, le compte ou le site (« Marmiton », « Jow », un pseudo Instagram…), vide si inconnu.',
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
      ? `categories : les identifiants qui conviennent parmi ${categories.map((c) => `${c.id} (${c.label})`).join(', ')}.`
      : 'categories : liste vide.',
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
      'categories',
      'ingredients',
      'steps',
      'tip',
    ],
    properties: {
      is_recipe: { type: 'boolean' },
      title: { type: 'string' },
      creator: { type: 'string' },
      duration: { type: 'integer' },
      servings: { type: 'integer' },
      kcal: { type: 'integer' },
      categories: {
        type: 'array',
        items: categoryIds.length ? { type: 'string', enum: categoryIds } : { type: 'string' },
      },
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
  const visible = decode(
    html
      .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  ).slice(0, jsonLd ? 8_000 : 30_000);

  const ogImage = meta('og:image') ?? meta('twitter:image');
  const parts = [
    `Titre : ${decode(meta('og:title') ?? html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? '')}`,
    `Site : ${decode(meta('og:site_name') ?? url.hostname)}`,
    `Description : ${decode(meta('og:description') ?? meta('description') ?? '')}`,
    jsonLd && `Données de recette (JSON-LD) :\n${jsonLd}`,
    `Texte de la page :\n${visible}`,
  ];
  return {
    url: res.url,
    image: ogImage ? new URL(decode(ogImage), res.url).href : null,
    text: parts.filter(Boolean).join('\n\n'),
  };
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
