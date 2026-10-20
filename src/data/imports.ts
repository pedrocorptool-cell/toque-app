import type { ImageSourcePropType } from 'react-native';

import type { CreatorId, Recipe, SourceId } from './recipes';

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
  | { method: 'social'; network: SocialId }
  | { method: 'web'; url: string }
  | { method: 'photo'; uri: string };

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
