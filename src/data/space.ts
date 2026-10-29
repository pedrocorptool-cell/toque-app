import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Avatar, TimerSoundId } from './profile';
import { BUNDLED_IMAGES, CATEGORIES, LEGACY_CATEGORIES, type Category, type Recipe } from './recipes';
import type { ShoppingItem } from './shopping';
import { supabase } from './supabase';

/** Réglages du profil, enregistrés avec l'espace. `seeded` : catégories de départ déjà créées. */
export type StoredProfile = {
  name?: string;
  avatar?: Avatar;
  defaultServings?: number;
  timerSound?: TimerSoundId;
  /** Onboarding terminé (avatar choisi) : une reconnexion le saute. */
  onboarded?: boolean;
  seeded?: boolean;
};

/** Contenu d'un espace au moment où le téléphone le charge. */
export type SpaceData = {
  spaceId: string;
  code: string;
  profile: StoredProfile;
  recipes: Recipe[];
  categories: Category[];
  shopping: ShoppingItem[];
};

export type Table = 'recipes' | 'categories' | 'shopping_items';

/** Pourquoi un ID n'a pas rattaché le téléphone, pour le message de la sheet. */
export type JoinErrorKind = 'not_found' | 'too_many' | 'offline' | 'unknown';
export class JoinError extends Error {
  constructor(readonly kind: JoinErrorKind) {
    super(kind);
  }
}

const CACHE_KEY = 'toque.space';

/** Rejette après `ms` : un réseau qui ne répond pas ne doit pas bloquer l'app. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('network timeout')), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

function db() {
  if (!supabase) throw new Error('Supabase non configuré');
  return supabase;
}

const isNetworkError = (error: { message?: string; status?: number } | null) =>
  !!error && (error.status === 0 || /fetch|network/i.test(error.message ?? ''));

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw result.error;
  return result.data;
}

// Une vignette livrée avec l'app est un numéro de module : on l'enregistre par son nom.
type StoredRecipe = Omit<Recipe, 'image'> & { image: { bundled: string } | { uri: string } };

export function encodeRecipe(recipe: Recipe): StoredRecipe {
  const { image } = recipe;
  if (typeof image === 'number') {
    const bundled = Object.keys(BUNDLED_IMAGES).find((name) => BUNDLED_IMAGES[name] === image) ?? 'pasta';
    return { ...recipe, image: { bundled } };
  }
  const uri = Array.isArray(image) ? image[0]?.uri : image.uri;
  return { ...recipe, image: { uri: uri ?? '' } };
}

function decodeRecipe(stored: StoredRecipe): Recipe {
  const { image } = stored;
  return { ...stored, image: 'bundled' in image ? (BUNDLED_IMAGES[image.bundled] ?? BUNDLED_IMAGES.pasta) : image };
}

async function rows<T>(table: Table, spaceId: string): Promise<T[]> {
  const data = check(await db().from(table).select('data').eq('space_id', spaceId).order('position'));
  return (data ?? []).map((row: { data: T }) => row.data);
}

/** Charge tout l'espace ; un espace neuf reçoit les catégories de départ, sans recette ni article. */
async function loadSpace(spaceId: string): Promise<SpaceData> {
  const space = check(await db().from('spaces').select('code, profile').eq('id', spaceId).single()) as {
    code: string;
    profile: StoredProfile | null;
  };
  const profile = space.profile ?? {};
  const [recipes, categories, shopping] = await Promise.all([
    rows<StoredRecipe>('recipes', spaceId),
    rows<Category>('categories', spaceId),
    rows<ShoppingItem>('shopping_items', spaceId),
  ]);
  const data: SpaceData = {
    spaceId,
    code: space.code,
    profile,
    recipes: recipes.map(decodeRecipe),
    categories,
    shopping,
  };
  if (!profile.seeded) {
    await pushRows('categories', spaceId, CATEGORIES.map(toRow), []);
    data.profile = { ...profile, seeded: true };
    data.categories = CATEGORIES;
    await saveProfile(spaceId, data.profile);
  } else if (categories.some((c) => LEGACY_CATEGORIES.includes(c.id))) {
    // Espace créé avec Végé et Cheat Meal : passage à Entrée, Plat, Dessert, Cocktail, en gardant les catégories
    // créées par l'utilisateur.
    const custom = categories.filter(
      (c) => !LEGACY_CATEGORIES.includes(c.id) && !CATEGORIES.some((d) => d.id === c.id),
    );
    data.categories = [...CATEGORIES, ...custom];
    await pushRows('categories', spaceId, data.categories.map(toRow), categories.map(toRow));
    const kept = recipes.map((r) => ({ ...r, categories: r.categories.filter((c) => !LEGACY_CATEGORIES.includes(c)) }));
    await pushRows('recipes', spaceId, kept.map(toRow), recipes.map(toRow));
    data.recipes = kept.map(decodeRecipe);
  }
  remember(data);
  return data;
}

const RESTORE_TIMEOUT = 6000;
const JOIN_TIMEOUT = 15000;

/** Au lancement : l'espace auquel ce téléphone est rattaché, ou null s'il n'en a pas encore. */
export async function restoreSpace(): Promise<SpaceData | null> {
  const { data } = await db().auth.getSession();
  if (!data.session) return null;
  try {
    return await withTimeout(
      (async () => {
        const member = check(
          await db().from('space_members').select('space_id').eq('user_id', data.session!.user.id).maybeSingle(),
        );
        return member ? await loadSpace(member.space_id) : null;
      })(),
      RESTORE_TIMEOUT,
    );
  } catch (error) {
    // Sans réseau, on rouvre l'espace tel qu'il était au dernier chargement.
    if (!isNetworkError(error as { message?: string })) console.warn('[Toqué] restoreSpace', error);
    const cached = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
    return cached ? (JSON.parse(cached) as SpaceData) : null;
  }
}

/** Rattache ce téléphone à l'espace de cet ID d'invitation et enregistre le pseudo saisi. */
export async function joinSpace(code: string, name: string): Promise<SpaceData> {
  try {
    return await withTimeout(join(code, name), JOIN_TIMEOUT);
  } catch (error) {
    if (error instanceof JoinError) throw error;
    const err = error as { message?: string; status?: number };
    if (/too_many_attempts/.test(err.message ?? '')) throw new JoinError('too_many');
    if (isNetworkError(err)) throw new JoinError('offline');
    console.warn('[Toqué] joinSpace', error);
    throw new JoinError('unknown');
  }
}

async function join(code: string, name: string): Promise<SpaceData> {
  const auth = db().auth;
  const { data } = await auth.getSession();
  if (!data.session) {
    const { error } = await auth.signInAnonymously();
    if (error) throw error;
  }
  const { data: spaceId, error } = await db().rpc('join_space', { p_code: code });
  if (error) throw error;
  if (!spaceId) throw new JoinError('not_found');
  const space = await loadSpace(spaceId as string);
  space.profile = { ...space.profile, name };
  await saveProfile(space.spaceId, space.profile);
  remember(space);
  return space;
}

/** Détache ce téléphone de son espace : les recettes restent dans la base, retrouvables avec l'ID. */
export async function leaveSpace() {
  const { data } = await db().auth.getSession();
  if (data.session) await db().from('space_members').delete().eq('user_id', data.session.user.id);
  await AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
}

export type Row = { id: string; position: number; data: unknown };
export const toRow = <T extends { id: string }>(data: T, position: number): Row => ({ id: data.id, position, data });

/** Envoie les lignes ajoutées ou modifiées depuis `previous` et supprime celles qui ont disparu. */
export async function pushRows(table: Table, spaceId: string, next: Row[], previous: Row[]) {
  const before = new Map(previous.map((row) => [row.id, JSON.stringify(row)]));
  const changed = next.filter((row) => before.get(row.id) !== JSON.stringify(row));
  const kept = new Set(next.map((row) => row.id));
  const removed = previous.filter((row) => !kept.has(row.id)).map((row) => row.id);
  if (changed.length) {
    check(
      await db()
        .from(table)
        .upsert(
          changed.map((row) => ({ ...row, space_id: spaceId })),
          { onConflict: 'space_id,id' },
        ),
    );
  }
  if (removed.length) check(await db().from(table).delete().eq('space_id', spaceId).in('id', removed));
}

export async function saveProfile(spaceId: string, profile: StoredProfile) {
  check(await db().from('spaces').update({ profile }).eq('id', spaceId));
}

// Copie locale du dernier état connu, pour ouvrir l'app sans réseau.
let cache: SpaceData | null = null;
let cacheTimer: ReturnType<typeof setTimeout> | undefined;

export function remember(update: Partial<SpaceData> & { spaceId: string }) {
  if (!cache || cache.spaceId !== update.spaceId) {
    if (!('code' in update)) return;
    cache = update as SpaceData;
  } else cache = { ...cache, ...update };
  clearTimeout(cacheTimer);
  cacheTimer = setTimeout(() => {
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => {});
  }, 1000);
}
