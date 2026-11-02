import type { ImageSourcePropType } from 'react-native';

import type { IconName } from '@/components/icons/Icon';
import { color } from '@/theme/tokens';

/** Données fictives du prototype : rien n'est encore relié à un back-end. */

/** Catégories de départ, plus celles créées depuis la sheet « Enregistrer » (`custom-…`). */
export type CategoryId = string;
export type CreatorId = 'marmiton' | 'whoogys' | 'etchebest' | 'jow';
export type DurationId = '0-10' | '10-20' | '20-30' | '30-60' | '60+';
export type SourceId = 'instagram' | 'facebook' | 'tiktok' | 'photo' | 'web';

export type Recipe = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  /** Durée de préparation, en minutes. */
  duration: number;
  categories: CategoryId[];
  /** Un créateur de la démo (avec son avatar), ou le nom lu par l'IA : site, auteur, compte. */
  creator: CreatorId | (string & {});
  source: SourceId;
  /** Page d'origine d'une recette importée par lien. */
  url?: string;
  /** Avatar du compte (réseau social) ou logo du site, lus à l'import. */
  creatorAvatar?: string;
  kcal: number;
  /** Nombre de parts pour lequel les quantités sont écrites. */
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
  tip?: string;
  /** Recette importée dont les quantités ne figuraient pas dans la source : l'IA les a estimées. */
  estimated?: boolean;
};

export type Ingredient = {
  /** Quantité pour `servings` parts ; absente pour « Huile d'olive », « Sel »… */
  qty?: number;
  /** Texte après la quantité, unité comprise : « cl de crème ». */
  name: string;
};

export type Step = {
  text: string;
  /** Ingrédients utilisés dans l'étape (indices dans `ingredients`), lus par l'IA à l'import. */
  ingredients?: number[];
  /** Minuteur proposé dans l'étape, en secondes. */
  timer?: number;
};

const PASTA = require('@/assets/images/demo/pasta.jpg');
const NAAN = require('@/assets/images/demo/naan.jpg');

/** Vignettes livrées avec l'app, enregistrées par leur nom dans la base (une photo garde son adresse). */
export const BUNDLED_IMAGES: Record<string, number> = { pasta: PASTA, naan: NAAN };

export type Category = {
  id: CategoryId;
  label: string;
  /** Affiché sur les cartes de la home et la fiche. */
  hashtag?: string;
  /** Couleur des premières maquettes, plus affichée (Figma « V2 Sheet » 713:2413). */
  dot?: string;
};

export const CATEGORIES: Category[] = [
  { id: 'entree', label: 'Entrée', hashtag: '#Entrée', dot: color.accentGreen },
  { id: 'plat', label: 'Plat', hashtag: '#Plat', dot: color.accentBlue },
  { id: 'dessert', label: 'Dessert', hashtag: '#Dessert', dot: color.accentOrange },
  { id: 'cocktail', label: 'Cocktail', hashtag: '#Cocktail', dot: color.accentCreme },
];

/** Catégories de départ des premières versions, remplacées par Entrée et Cocktail. */
export const LEGACY_CATEGORIES = ['vege', 'cheat'];

export const CREATORS: { id: CreatorId; label: string; avatar: ImageSourcePropType }[] = [
  { id: 'marmiton', label: 'Marmiton', avatar: require('@/assets/images/demo/av_marmiton.png') },
  { id: 'whoogys', label: 'Whoogy’s', avatar: require('@/assets/images/demo/av_whoogys.png') },
  { id: 'etchebest', label: 'Phillipe Etchebest', avatar: require('@/assets/images/demo/av_etchebest.png') },
  { id: 'jow', label: 'Jow', avatar: require('@/assets/images/demo/av_jow.png') },
];

export const DURATIONS: { id: DurationId; label: string; min: number; max: number }[] = [
  { id: '0-10', label: '0 - 10 minutes', min: 0, max: 10 },
  { id: '10-20', label: '10 - 20 minutes', min: 11, max: 20 },
  { id: '20-30', label: '20 - 30 minutes', min: 21, max: 30 },
  { id: '30-60', label: '30 - 60 minutes', min: 31, max: 60 },
  { id: '60+', label: '+ 1 heure', min: 61, max: Infinity },
];

export const SOURCES: { id: SourceId; label: string; logo?: ImageSourcePropType; icon?: IconName }[] = [
  { id: 'instagram', label: 'Instagram', logo: require('@/assets/images/demo/logo_instagram.png') },
  { id: 'facebook', label: 'Facebook', logo: require('@/assets/images/demo/logo_facebook.png') },
  { id: 'tiktok', label: 'TikTok', logo: require('@/assets/images/demo/logo_tiktok.png') },
  { id: 'photo', label: 'Photo', icon: 'camera' },
  { id: 'web', label: 'Lien Web', icon: 'link' },
];

export const RECIPES: Recipe[] = [
  {
    id: 'pasta-zozzona',
    title: 'Pasta alla zozzona',
    image: PASTA,
    duration: 20,
    categories: ['plat'],
    creator: 'whoogys',
    source: 'instagram',
    kcal: 80,
    servings: 2,
    ingredients: [
      { qty: 200, name: 'g de rigatoni' },
      { qty: 200, name: 'g de champignons de Paris' },
      { qty: 1, name: 'oignon rouge' },
      { qty: 400, name: 'g de tomates pelées' },
      { qty: 2, name: 'jaunes d’œuf' },
      { qty: 40, name: 'g de pecorino râpé' },
      { name: 'Huile d’olive' },
      { name: 'Poivre noir' },
    ],
    steps: [
      { text: 'Faire chauffer une grande casserole d’eau salée.' },
      { text: 'Émincer l’oignon et les champignons, puis les faire dorer à feu vif dans l’huile d’olive.' },
      { text: 'Ajouter les tomates pelées et laisser mijoter à feu doux.', timer: 10 },
      { text: 'Cuire les rigatoni al dente en gardant une louche d’eau de cuisson.', timer: 660 },
      { text: 'Fouetter les jaunes d’œuf avec le pecorino et beaucoup de poivre.' },
      {
        text: 'Hors du feu, mélanger les pâtes à la sauce, puis ajouter le mélange œuf-pecorino et un peu d’eau de cuisson.',
      },
    ],
    tip: 'Pour accompagner ce plat, un vin rouge du Beaujolais sera parfait !',
  },
  {
    id: 'naan-tomate',
    title: 'Naan tomate mozza poivrons',
    image: NAAN,
    duration: 45,
    categories: ['plat'],
    creator: 'marmiton',
    source: 'web',
    kcal: 520,
    servings: 2,
    ingredients: [
      { qty: 2, name: 'naans nature' },
      { qty: 4, name: 'c. à s. de sauce tomate' },
      { qty: 1, name: 'boule de mozzarella' },
      { qty: 1, name: 'poivron rouge' },
      { qty: 0.5, name: 'oignon rouge' },
      { name: 'Origan séché' },
    ],
    steps: [
      { text: 'Préchauffer le four à 220 °C.' },
      { text: 'Couper le poivron en lanières et l’oignon en fines rondelles.' },
      { text: 'Étaler la sauce tomate sur les naans, puis répartir la mozzarella et les légumes.' },
      { text: 'Enfourner jusqu’à ce que le fromage soit doré.', timer: 720 },
      { text: 'Parsemer d’origan avant de servir.' },
    ],
    tip: 'Ajoute quelques feuilles de basilic frais à la sortie du four.',
  },
  {
    id: 'rigatoni-vodka',
    title: 'Rigatoni alla vodka',
    image: PASTA,
    duration: 25,
    categories: ['plat'],
    creator: 'jow',
    source: 'tiktok',
    kcal: 640,
    servings: 2,
    ingredients: [
      { qty: 200, name: 'g de rigatoni' },
      { qty: 1, name: 'échalote' },
      { qty: 2, name: 'gousses d’ail' },
      { qty: 2, name: 'c. à s. de concentré de tomate' },
      { qty: 3, name: 'cl de vodka' },
      { qty: 10, name: 'cl de crème liquide' },
      { qty: 30, name: 'g de parmesan' },
    ],
    steps: [
      { text: 'Faire revenir l’échalote et l’ail hachés dans un filet d’huile.' },
      { text: 'Ajouter le concentré de tomate et le faire caraméliser 2 minutes.' },
      { text: 'Déglacer à la vodka, puis verser la crème.' },
      { text: 'Cuire les rigatoni dans une grande casserole d’eau salée.', timer: 660 },
      { text: 'Mélanger les pâtes à la sauce avec le parmesan et un peu d’eau de cuisson.' },
    ],
  },
  {
    id: 'pizza-poele',
    title: 'Pizza à la poêle express',
    image: NAAN,
    duration: 10,
    categories: ['plat'],
    creator: 'whoogys',
    source: 'tiktok',
    kcal: 710,
    servings: 1,
    ingredients: [
      { qty: 1, name: 'grande tortilla de blé' },
      { qty: 3, name: 'c. à s. de sauce tomate' },
      { qty: 80, name: 'g de mozzarella râpée' },
      { qty: 6, name: 'tranches de chorizo' },
    ],
    steps: [
      { text: 'Chauffer une poêle à feu moyen et y déposer la tortilla.' },
      { text: 'Garnir de sauce tomate, de mozzarella et de chorizo.' },
      { text: 'Couvrir et laisser cuire jusqu’à ce que le fromage fonde.', timer: 300 },
    ],
    tip: 'Un filet de miel piquant à la fin, et c’est le paradis.',
  },
  {
    id: 'gratin-pates',
    title: 'Gratin de pâtes du chef',
    image: PASTA,
    duration: 75,
    categories: ['plat'],
    creator: 'etchebest',
    source: 'facebook',
    kcal: 820,
    servings: 4,
    ingredients: [
      { qty: 400, name: 'g de coquillettes' },
      { qty: 50, name: 'g de beurre' },
      { qty: 50, name: 'g de farine' },
      { qty: 75, name: 'cl de lait' },
      { qty: 200, name: 'g de jambon blanc' },
      { qty: 150, name: 'g de comté râpé' },
      { name: 'Noix de muscade' },
    ],
    steps: [
      { text: 'Préchauffer le four à 200 °C.' },
      { text: 'Cuire les coquillettes 2 minutes de moins que le temps indiqué.', timer: 420 },
      { text: 'Préparer une béchamel avec le beurre, la farine et le lait, puis assaisonner de muscade.' },
      { text: 'Mélanger les pâtes, la béchamel, le jambon et la moitié du comté dans un plat.' },
      { text: 'Couvrir du reste de comté et enfourner.', timer: 1800 },
    ],
    tip: 'Laisse reposer 5 minutes avant de servir : le gratin se tient mieux.',
  },
  {
    id: 'flatbread',
    title: 'Flatbread légumes rôtis',
    image: NAAN,
    duration: 35,
    categories: ['entree'],
    creator: 'jow',
    source: 'photo',
    kcal: 450,
    servings: 2,
    ingredients: [
      { qty: 2, name: 'flatbreads' },
      { qty: 1, name: 'courgette' },
      { qty: 1, name: 'poivron jaune' },
      { qty: 100, name: 'g de feta' },
      { qty: 4, name: 'c. à s. de houmous' },
      { name: 'Huile d’olive' },
    ],
    steps: [
      { text: 'Préchauffer le four à 200 °C.' },
      { text: 'Couper les légumes en dés, les arroser d’huile d’olive et les rôtir.', timer: 1200 },
      { text: 'Tartiner les flatbreads de houmous.' },
      { text: 'Garnir de légumes rôtis et de feta émiettée.' },
    ],
  },
];

export type Filters = {
  category: CategoryId[];
  creator: string[];
  duration: DurationId[];
  source: SourceId[];
};

export type FilterKey = keyof Filters;

export const EMPTY_FILTERS: Filters = { category: [], creator: [], duration: [], source: [] };

/** Quantité ajustée au nombre de parts choisi : « 1,5 », « 300 ». */
export function formatIngredient(ingredient: Ingredient, servings: number, base: number) {
  if (ingredient.qty === undefined) return ingredient.name;
  return `${scaledQty(ingredient.qty, servings, base)} ${ingredient.name}`;
}

function scaledQty(qty: number, servings: number, base: number) {
  return String(Math.round(((qty * servings) / base) * 10) / 10).replace('.', ',');
}

// Unités collées au nombre, comme dans les maquettes : « 80g », « 20cl ».
const METRIC = new Set(['g', 'kg', 'mg', 'l', 'cl', 'ml', 'dl']);

/** Quantité courte à glisser dans le texte d'une étape : « 80g », « 2 gousses », « 3 ». */
function shortQuantity(ingredient: Ingredient, servings: number, base: number) {
  const qty = scaledQty(ingredient.qty!, servings, base);
  const name = ingredient.name.trim();
  const unit = name.match(/^(.+?)\s+(?:de|d['’])\s*/i)?.[1] ?? name.split(/\s+/)[0];
  if (METRIC.has(unit.toLowerCase())) return `${qty}${unit}`;
  // Sans « de », le premier mot est l'ingrédient lui-même (« 3 œufs ») : le nombre suffit.
  return name.match(/^(.+?)\s+(?:de|d['’])\s*/i) ? `${qty} ${unit}` : qty;
}

/** Hashtags des cartes de la home. */
export function hashtagsOf(recipe: Recipe, categories: Category[] = CATEGORIES) {
  const tags = categories.filter((c) => c.hashtag && recipe.categories.includes(c.id)).map((c) => c.hashtag);
  return tags.length ? tags.sort().join(' ') : undefined;
}

/** « Cheat Meal » → « #CheatMeal ». */
export function toHashtag(label: string) {
  return `#${label
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}`;
}

/** Catégories de la recette sur la fiche, comme sur la home. */
export function savedHashtagsOf(recipe: Recipe, categories: Category[]) {
  const saved = categories.filter((c) => recipe.categories.includes(c.id));
  return saved.length
    ? saved
        .map((c) => c.hashtag ?? toHashtag(c.label))
        .sort()
        .join(' ')
    : undefined;
}

/** Avatar et nom du créateur ; sans avatar pour un créateur lu à l'import. */
export function creatorOf(recipe: Recipe): { id: string; name: string; avatar?: ImageSourcePropType } {
  const creator = CREATORS.find((c) => c.id === recipe.creator);
  return creator
    ? { id: creator.id, name: creator.label, avatar: creator.avatar }
    : {
        id: recipe.creator,
        name: recipe.creator || 'Inconnu',
        ...(recipe.creatorAvatar ? { avatar: { uri: recipe.creatorAvatar } } : {}),
      };
}

/** Créateurs des recettes enregistrées, pour le filtre « Créateur ». */
export function creatorsOf(recipes: Recipe[]) {
  const seen = new Map<string, ReturnType<typeof creatorOf>>();
  for (const recipe of recipes) if (!seen.has(recipe.creator)) seen.set(recipe.creator, creatorOf(recipe));
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/** Insensible à la casse et aux accents : « vege » trouve « Végé ». */
function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Mots qui ne désignent pas l'ingrédient lui-même : unités, mesures, liaisons.
const NOT_INGREDIENT = new Set(
  'cuillere cuilleres soupe cafe pincee pincees tranche tranches gousse gousses brin brins botte bottes sachet sachets boite boites verre verres tasse tasses morceau morceaux feuille feuilles quelques environ grosse grosses petit petite petits petites gros frais fraiche coupe coupes'.split(
    ' ',
  ),
);

/** Mots significatifs d'un nom d'ingrédient (« g de chocolat noir » → chocolat, noir), réduits à leur début pour
 *  que « œuf » trouve « œufs ». */
function ingredientWords(name: string) {
  return normalize(name.replace(/œ/g, 'oe'))
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 4 && !NOT_INGREDIENT.has(w))
    .map((w) => w.slice(0, 5));
}

/**
 * Ingrédients d'une étape, pour le mode étape par étape : ceux indiqués par l'IA à l'import, sinon ceux dont le nom
 * apparaît dans le texte de l'étape (recettes importées avant, recettes de démo).
 */
export function stepIngredients(recipe: Recipe, index: number): Ingredient[] {
  const step = recipe.steps[index];
  if (!step) return [];
  if (step.ingredients) return step.ingredients.map((i) => recipe.ingredients[i]).filter(Boolean);
  const words = normalize(step.text.replace(/œ/g, 'oe'))
    .split(/[^a-z]+/)
    .map((w) => w.slice(0, 5));
  // Seul le mot principal compte (« chocolat » dans « chocolat blanc ») : « cuire à blanc » ne fait pas venir le
  // chocolat blanc.
  return recipe.ingredients.filter((ingredient) => {
    const main = ingredientWords(ingredient.name)[0];
    return main !== undefined && words.includes(main);
  });
}

/**
 * Texte d'une étape avec la quantité de chaque ingrédient juste après sa mention : « Faire fondre le chocolat (80g) ».
 * Les ingrédients de l'étape que le texte ne nomme pas restent à part (`rest`), pour être listés sous l'étape.
 */
export function stepWithQuantities(recipe: Recipe, index: number, servings: number) {
  const step = recipe.steps[index];
  if (!step) return { text: '', rest: [] as Ingredient[] };
  const words = [...step.text.matchAll(/[\p{L}œŒ]+/gu)].map((m) => ({
    key: normalize(m[0].replace(/œ/gi, 'oe')).slice(0, 5),
    end: m.index! + m[0].length,
    start: m.index!,
  }));
  const inserts: { at: number; label: string }[] = [];
  const rest: Ingredient[] = [];
  for (const ingredient of stepIngredients(recipe, index)) {
    const own = ingredientWords(ingredient.name);
    const first = words.findIndex((w) => w.key === own[0] && !inserts.some((i) => i.at === w.end));
    if (first === -1) {
      rest.push(ingredient);
      continue;
    }
    if (ingredient.qty === undefined) continue;
    // Une quantité déjà écrite juste avant (« 200 g de farine ») n'est pas répétée.
    if (/\d/.test(step.text.slice(Math.max(0, words[first].start - 12), words[first].start))) continue;
    // « chocolat noir » : la quantité vient après le nom entier.
    let last = first;
    while (
      words[last + 1] &&
      own.includes(words[last + 1].key) &&
      step.text.slice(words[last].end, words[last + 1].start).trim() === ''
    )
      last++;
    inserts.push({ at: words[last].end, label: ` (${shortQuantity(ingredient, servings, recipe.servings)})` });
  }
  let text = step.text;
  for (const { at, label } of inserts.sort((a, b) => b.at - a.at)) text = text.slice(0, at) + label + text.slice(at);
  return { text, rest };
}

export function matchesText(label: string, query: string) {
  return normalize(label).includes(normalize(query));
}

/** Dans un même filtre les choix s'additionnent (OU), entre filtres ils se combinent (ET). */
export function filterRecipes(recipes: Recipe[], query: string, filters: Filters) {
  return recipes.filter((r) => {
    if (query && !matchesText(r.title, query)) return false;
    if (filters.category.length && !filters.category.some((c) => r.categories.includes(c))) return false;
    if (filters.creator.length && !filters.creator.includes(r.creator)) return false;
    if (filters.source.length && !filters.source.includes(r.source)) return false;
    if (
      filters.duration.length &&
      !DURATIONS.some((d) => filters.duration.includes(d.id) && r.duration >= d.min && r.duration <= d.max)
    )
      return false;
    return true;
  });
}
