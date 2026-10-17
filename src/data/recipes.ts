import type { ImageSourcePropType } from 'react-native';

import type { IconName } from '@/components/icons/Icon';
import { color } from '@/theme/tokens';

/** Données fictives du prototype : rien n'est encore relié à un back-end. */

export type CategoryId = 'plat' | 'dessert' | 'vege' | 'cheat';
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
  creator: CreatorId;
  source: SourceId;
};

const PASTA = require('@/assets/images/demo/pasta.jpg');
const NAAN = require('@/assets/images/demo/naan.jpg');

export const CATEGORIES: { id: CategoryId; label: string; hashtag?: string; dot: string }[] = [
  { id: 'plat', label: 'Plat principal', dot: color.accentBlue },
  { id: 'dessert', label: 'Dessert', hashtag: '#Dessert', dot: color.accentOrange },
  { id: 'vege', label: 'Végé', hashtag: '#Végé', dot: color.accentGreen },
  { id: 'cheat', label: 'Cheat Meal', hashtag: '#Cheatmeal', dot: color.accentCreme },
];

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
  { id: 'pasta-zozzona', title: 'Pasta alla zozzona', image: PASTA, duration: 20, categories: ['plat', 'cheat', 'vege'], creator: 'whoogys', source: 'instagram' },
  { id: 'naan-tomate', title: 'Naan tomate mozza poivrons', image: NAAN, duration: 45, categories: ['plat'], creator: 'marmiton', source: 'web' },
  { id: 'rigatoni-vodka', title: 'Rigatoni alla vodka', image: PASTA, duration: 25, categories: ['plat', 'vege'], creator: 'jow', source: 'tiktok' },
  { id: 'pizza-poele', title: 'Pizza à la poêle express', image: NAAN, duration: 10, categories: ['cheat'], creator: 'whoogys', source: 'tiktok' },
  { id: 'gratin-pates', title: 'Gratin de pâtes du chef', image: PASTA, duration: 75, categories: ['plat', 'cheat'], creator: 'etchebest', source: 'facebook' },
  { id: 'flatbread', title: 'Flatbread légumes rôtis', image: NAAN, duration: 35, categories: ['vege'], creator: 'jow', source: 'photo' },
];

export type Filters = {
  category: CategoryId[];
  creator: CreatorId[];
  duration: DurationId[];
  source: SourceId[];
};

export type FilterKey = keyof Filters;

export const EMPTY_FILTERS: Filters = { category: [], creator: [], duration: [], source: [] };

export function hashtagsOf(recipe: Recipe) {
  const tags = CATEGORIES.filter((c) => c.hashtag && recipe.categories.includes(c.id)).map((c) => c.hashtag);
  return tags.length ? tags.sort().join(' ') : undefined;
}

export function creatorOf(recipe: Recipe) {
  const creator = CREATORS.find((c) => c.id === recipe.creator)!;
  return { name: creator.label, avatar: creator.avatar };
}

/** Insensible à la casse et aux accents : « vege » trouve « Végé ». */
function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
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
