import type { ImageSourcePropType } from 'react-native';

import type { Category, CreatorId, Recipe, SourceId } from './recipes';
import { supabase } from './supabase';

/** Réseaux proposés par « Importer via » (Figma : « Bottom Sheet/ Import/ RS »). */
export type SocialId = Extract<SourceId, 'instagram' | 'facebook' | 'tiktok'>;
export const SOCIALS: SocialId[] = ['instagram', 'facebook', 'tiktok'];

/** Ouverture de l'app du réseau, avec repli sur son site quand l'app n'est pas installée. */
export const SOCIAL_LINKS: Record<SocialId, { app: string; web: string }> = {
  instagram: { app: 'instagram://', web: 'https://www.instagram.com' },
  facebook: { app: 'fb://', web: 'https://www.facebook.com' },
  tiktok: { app: 'snssdk1233://', web: 'https://www.tiktok.com' },
};

const SOCIAL_CREATOR: Record<SocialId, CreatorId> = { instagram: 'whoogys', facebook: 'jow', tiktok: 'etchebest' };

export type ImportRequest =
  /** Sans `url` : prototype hors ligne, la publication partagée est simulée. */
  | { method: 'social'; network: SocialId; url?: string }
  | { method: 'web'; url: string }
  | { method: 'photo'; uri: string; base64?: string; mimeType?: string };

/**
 * Prototype sans serveur : un import ne peut pas vraiment échouer. Un lien contenant « erreur » simule l'échec,
 * pour voir l'écran « Import impossible ».
 */
export const simulatedFailure = (request: ImportRequest) => request.method === 'web' && request.url.includes('erreur');

/** Accepte « marmiton.org/… » comme « https://… » ; renvoie null si ce n'est pas une adresse web. */
export function normalizeUrl(input: string): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return /^https?:\/\/[^/.]+\.[^/]{2,}/i.test(url) ? url : null;
}

/**
 * Prototype : pas de vraie lecture de recette. Chaque mode d'import produit une recette de démo,
 * avec la photo choisie comme vignette pour l'import par photo.
 */
export function importedRecipe(request: ImportRequest): Recipe {
  const id = `import-${Date.now()}`;
  if (request.method === 'photo') {
    return { ...GRATIN, id, image: { uri: request.uri }, source: 'photo' };
  }
  if (request.method === 'web') return { ...RIGATONI, id, source: 'web' };
  return { ...NAAN_EXPRESS, id, source: request.network, creator: SOCIAL_CREATOR[request.network] };
}

const GRATIN: Omit<Recipe, 'id' | 'image'> = {
  title: 'Gratin dauphinois de mamie',
  duration: 75,
  categories: ['plat', 'vege'],
  creator: 'jow',
  source: 'photo',
  kcal: 520,
  servings: 4,
  ingredients: [
    { qty: 1, name: 'kg de pommes de terre' },
    { qty: 50, name: 'cl de crème entière' },
    { qty: 25, name: 'cl de lait' },
    { qty: 2, name: 'gousses d’ail' },
    { name: 'Noix de muscade' },
    { name: 'Sel, poivre' },
  ],
  steps: [
    { text: 'Préchauffer le four à 160 °C et frotter le plat avec une gousse d’ail coupée.' },
    { text: 'Éplucher les pommes de terre et les couper en fines rondelles, sans les rincer.' },
    { text: 'Porter le lait, la crème, l’ail écrasé, le sel, le poivre et la muscade à frémissement.' },
    { text: 'Ajouter les pommes de terre et cuire à feu doux en remuant délicatement.', timer: 600 },
    { text: 'Verser dans le plat et enfourner jusqu’à ce que le dessus soit bien doré.', timer: 3600 },
  ],
  tip: 'Laisse reposer 10 minutes à la sortie du four : le gratin se tient mieux au service.',
};

const RIGATONI: Omit<Recipe, 'id'> = {
  title: 'Rigatoni crème de poivrons',
  image: require('@/assets/images/demo/pasta.jpg') as ImageSourcePropType,
  duration: 25,
  categories: ['plat', 'vege'],
  creator: 'marmiton',
  source: 'web',
  kcal: 610,
  servings: 2,
  ingredients: [
    { qty: 200, name: 'g de rigatoni' },
    { qty: 2, name: 'poivrons rouges' },
    { qty: 1, name: 'gousse d’ail' },
    { qty: 10, name: 'cl de crème' },
    { qty: 30, name: 'g de parmesan râpé' },
    { name: 'Huile d’olive' },
  ],
  steps: [
    { text: 'Faire rôtir les poivrons au four jusqu’à ce que la peau noircisse.', timer: 1200 },
    { text: 'Les peler, puis les mixer avec l’ail, la crème et le parmesan.' },
    { text: 'Cuire les rigatoni al dente.', timer: 660 },
    { text: 'Mélanger les pâtes à la sauce avec un peu d’eau de cuisson.' },
  ],
};

const NAAN_EXPRESS: Omit<Recipe, 'id'> = {
  title: 'Naan express au fromage',
  image: require('@/assets/images/demo/naan.jpg') as ImageSourcePropType,
  duration: 20,
  categories: ['cheat'],
  creator: 'whoogys',
  source: 'instagram',
  kcal: 480,
  servings: 4,
  ingredients: [
    { qty: 250, name: 'g de farine' },
    { qty: 1, name: 'yaourt nature' },
    { qty: 1, name: 'c. à c. de levure chimique' },
    { qty: 4, name: 'portions de fromage fondu' },
    { name: 'Beurre à l’ail' },
  ],
  steps: [
    { text: 'Mélanger la farine, le yaourt et la levure jusqu’à obtenir une pâte souple.' },
    { text: 'Diviser en 4, étaler chaque boule et y enfermer une portion de fromage.' },
    { text: 'Cuire à la poêle bien chaude, à sec, 3 minutes de chaque côté.', timer: 360 },
    { text: 'Badigeonner de beurre à l’ail à la sortie de la poêle.' },
  ],
};

/** Pourquoi un import a échoué, pour l'écran d'erreur. */
export type ImportFailure = 'unreachable' | 'not_a_recipe' | 'no_credits' | 'failed';
export class ImportFailed extends Error {
  constructor(readonly reason: ImportFailure) {
    super(reason);
  }
}

/** Le lien vient-il d'un réseau social ? La recette importée prend alors son logo comme source. */
export function socialOf(url: string): SocialId | null {
  const host = url
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .toLowerCase();
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
  if (/(^|\.)(facebook\.com|fb\.watch)$/.test(host)) return 'facebook';
  return null;
}

type ReadRecipe = Pick<Recipe, 'title' | 'duration' | 'servings' | 'kcal' | 'ingredients' | 'steps' | 'categories'> & {
  creator: string | null;
  tip: string | null;
  image: string | null;
  avatar: string | null;
  url: string | null;
};

const PLACEHOLDER = require('@/assets/images/demo/pasta.jpg') as ImageSourcePropType;

/**
 * Lit la recette avec l'IA, par la fonction Supabase `import-recipe` (voir `supabase/functions`). La clé
 * Anthropic reste côté Supabase.
 */
export async function importRecipe(request: ImportRequest, categories: Category[]): Promise<Recipe> {
  if (!supabase) throw new ImportFailed('failed');
  const url = request.method === 'photo' ? null : request.url;
  let page: { kind: 'url'; url: string } | { kind: 'image'; data: string; mediaType?: string };
  if (url) page = { kind: 'url', url };
  else if (request.method === 'photo' && request.base64)
    page = { kind: 'image', data: request.base64, mediaType: request.mimeType };
  else throw new ImportFailed('failed');
  const body = { ...page, categories: categories.map((c) => ({ id: c.id, label: c.label })) };
  const { data, error } = await supabase.functions.invoke<ReadRecipe>('import-recipe', { body });
  if (error || !data) throw new ImportFailed(await failureOf(error));

  const source: SourceId = request.method === 'photo' ? 'photo' : (socialOf(url!) ?? 'web');
  return {
    id: `import-${Date.now()}`,
    title: data.title,
    // Image copiée dans le stockage de l'espace (photo prise ou image de la page) ; à défaut, la photo locale ou une
    // vignette par défaut.
    image: data.image ? { uri: data.image } : request.method === 'photo' ? { uri: request.uri } : PLACEHOLDER,
    duration: data.duration,
    categories: data.categories,
    creator: data.creator ?? (source === 'photo' ? 'Photo' : 'Web'),
    source,
    kcal: data.kcal,
    servings: data.servings,
    ingredients: data.ingredients,
    steps: data.steps,
    ...(data.tip ? { tip: data.tip } : {}),
    ...(data.avatar ? { creatorAvatar: data.avatar } : {}),
    ...(data.url ? { url: data.url } : url ? { url } : {}),
  };
}

/** Le code renvoyé par la fonction (`no_credits`, `not_a_recipe`…), ou une coupure réseau. */
async function failureOf(error: unknown): Promise<ImportFailure> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.json !== 'function') return 'unreachable';
  const code = await context
    .json()
    .then((body: { error?: string }) => body.error)
    .catch(() => undefined);
  if (code === 'no_credits') return 'no_credits';
  if (code === 'not_a_recipe') return 'not_a_recipe';
  if (code === 'page_unreachable') return 'unreachable';
  return 'failed';
}
