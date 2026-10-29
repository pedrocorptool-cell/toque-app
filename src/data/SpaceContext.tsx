import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { CATEGORIES, RECIPES } from './recipes';
import { DEMO_SHOPPING } from './shopping';
import {
  joinSpace,
  leaveSpace,
  pushRows,
  remember,
  restoreSpace,
  saveProfile,
  toRow,
  withTimeout,
  type Row,
  type SpaceData,
  type StoredProfile,
  type Table,
} from './space';
import { supabase } from './supabase';

/** Ce que les écrans reprennent au chargement de l'espace ; `version` change à chaque rattachement. */
export type Snapshot = Omit<SpaceData, 'spaceId'> & {
  spaceId: string | null;
  /** Espace retrouvé au lancement : l'onboarding est déjà fait. */
  onboarded: boolean;
  version: number;
};

type SpaceState = {
  ready: boolean;
  snapshot: Snapshot;
  /** Lève une `JoinError` si l'ID ne rattache pas le téléphone. Renvoie true si l'onboarding avait déjà été fait
   *  dans cet espace : l'avatar est alors retrouvé. */
  join: (code: string, name: string) => Promise<boolean>;
  leave: () => Promise<void>;
};

const SpaceContext = createContext<SpaceState | null>(null);

// Hors ligne (aperçus web, pas de `.env`) : les recettes de démo, comme avant la base.
const OFFLINE: Snapshot = {
  spaceId: null,
  code: '',
  profile: {},
  recipes: RECIPES,
  categories: CATEGORIES,
  shopping: DEMO_SHOPPING,
  onboarded: false,
  version: 0,
};
// Avec la base, un téléphone sans espace n'a rien : tout arrive au rattachement.
const EMPTY: Snapshot = { ...OFFLINE, recipes: [], categories: [], shopping: [] };

export function SpaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!supabase);
  const [snapshot, setSnapshot] = useState(supabase ? EMPTY : OFFLINE);

  useEffect(() => {
    if (!supabase) return;
    // Garde-fou : même si la session locale ne répond pas, l'app s'ouvre (sur l'onboarding).
    withTimeout(restoreSpace(), 8000)
      .then((space) => space && setSnapshot({ ...space, onboarded: true, version: 1 }))
      .catch((error) => console.warn('[Toqué] restoreSpace', error))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<SpaceState>(
    () => ({
      ready,
      snapshot,
      join: async (code, name) => {
        const space = supabase ? await joinSpace(code, name) : { ...OFFLINE, code, profile: { name }, spaceId: null };
        const profile: StoredProfile = space.profile;
        // Les espaces créés avant le drapeau `onboarded` comptent comme configurés s'ils ont un avatar.
        const returning = profile.onboarded ?? Boolean(profile.avatar);
        setSnapshot((current) => ({ ...space, onboarded: returning, version: current.version + 1 }));
        return returning;
      },
      leave: async () => {
        if (supabase) await leaveSpace();
        setSnapshot((current) => ({ ...(supabase ? EMPTY : OFFLINE), version: current.version + 1 }));
      },
    }),
    [ready, snapshot],
  );

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace() {
  const state = useContext(SpaceContext);
  if (!state) throw new Error('useSpace doit être utilisé sous <SpaceProvider>');
  return state;
}

const SYNC_DELAY = 500;

/**
 * Enregistre une liste dans la base, 500 ms après la dernière modification, en n'envoyant que les lignes changées.
 * `initial` est la liste chargée avec l'espace : le fournisseur la reprend dans un effet à chaque rattachement,
 * ce qui annule l'envoi programmé entre-temps avec l'ancienne liste.
 */
export function useRowSync<T extends { id: string }>(
  table: Table,
  items: T[],
  initial: T[],
  encode: (item: T) => unknown = (item) => item,
) {
  const { snapshot } = useSpace();
  const { spaceId, version } = snapshot;
  const saved = useRef<Row[]>([]);

  useEffect(() => {
    saved.current = initial.map((item, i) => toRow({ ...(encode(item) as T), id: item.id }, i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useEffect(() => {
    if (!spaceId) return;
    const timer = setTimeout(() => {
      const next = items.map((item, i) => toRow({ ...(encode(item) as T), id: item.id }, i));
      pushRows(table, spaceId, next, saved.current)
        .then(() => {
          saved.current = next;
          remember({ spaceId, [CACHE_FIELD[table]]: items });
        })
        .catch((error) => console.warn(`[Toqué] sync ${table}`, error));
    }, SYNC_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, spaceId]);
}

const CACHE_FIELD = { recipes: 'recipes', categories: 'categories', shopping_items: 'shopping' } as const;

/** Même principe pour les réglages du profil, enregistrés avec l'espace. */
export function useProfileSync(profile: StoredProfile) {
  const { snapshot } = useSpace();
  const { spaceId, version } = snapshot;
  const saved = useRef('');

  useEffect(() => {
    saved.current = JSON.stringify({ ...snapshot.profile, seeded: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useEffect(() => {
    if (!spaceId) return;
    const next = { ...profile, seeded: true };
    const json = JSON.stringify(next);
    if (json === saved.current) return;
    const timer = setTimeout(() => {
      saveProfile(spaceId, next)
        .then(() => {
          saved.current = json;
          remember({ spaceId, profile: next });
        })
        .catch((error) => console.warn('[Toqué] sync profil', error));
    }, SYNC_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, spaceId]);
}
