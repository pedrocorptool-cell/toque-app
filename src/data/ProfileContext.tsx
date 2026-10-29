import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { color } from '@/theme/tokens';

import type { Avatar, TimerSoundId } from './profile';
import type { Snapshot } from './SpaceContext';
import { useProfileSync, useSpace } from './SpaceContext';

/** Pseudo et ID de l'espace Toqué, saisis à l'onboarding ; vides tant que le téléphone n'a pas d'espace. */
export type Account = { name: string; toqueId: string };

type ProfileState = {
  account: Account;
  setAccount: (account: Account) => void;
  avatar: Avatar;
  setAvatar: (avatar: Avatar) => void;
  /** Nombre de parts avec lequel s'ouvrent les fiches recette. */
  defaultServings: number;
  setDefaultServings: (count: number) => void;
  timerSound: TimerSoundId;
  setTimerSound: (id: TimerSoundId) => void;
  /** Présentation de l'app vue : l'onboarding ne s'ouvre qu'au premier lancement. */
  onboarded: boolean;
  setOnboarded: (onboarded: boolean) => void;
};

const ProfileContext = createContext<ProfileState | null>(null);

const DEFAULT_AVATAR: Avatar = { kind: 'toque', id: 'onion', background: color.accentCreme };

const accountOf = (snapshot: Snapshot): Account => ({ name: snapshot.profile.name ?? '', toqueId: snapshot.code });

/** Réglages enregistrés avec l'espace, avec l'onboarding terminé pour ne pas le refaire à une reconnexion. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { snapshot } = useSpace();
  const { profile } = snapshot;
  const [account, setAccount] = useState(accountOf(snapshot));
  const [avatar, setAvatar] = useState<Avatar>(profile.avatar ?? DEFAULT_AVATAR);
  const [defaultServings, setDefaultServings] = useState(profile.defaultServings ?? 2);
  const [timerSound, setTimerSound] = useState<TimerSoundId>(profile.timerSound ?? 'timer');
  const [onboarded, setOnboarded] = useState(snapshot.onboarded);

  useEffect(() => {
    setAccount(accountOf(snapshot));
    setAvatar(snapshot.profile.avatar ?? DEFAULT_AVATAR);
    setDefaultServings(snapshot.profile.defaultServings ?? 2);
    setTimerSound(snapshot.profile.timerSound ?? 'timer');
    setOnboarded(snapshot.onboarded);
  }, [snapshot]);

  const stored = useMemo(
    () => ({ name: account.name, avatar, defaultServings, timerSound, onboarded }),
    [account.name, avatar, defaultServings, timerSound, onboarded],
  );
  useProfileSync(stored);

  const value = useMemo<ProfileState>(
    () => ({
      account,
      setAccount,
      avatar,
      setAvatar,
      defaultServings,
      setDefaultServings,
      timerSound,
      setTimerSound,
      onboarded,
      setOnboarded,
    }),
    [account, avatar, defaultServings, timerSound, onboarded],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const state = useContext(ProfileContext);
  if (!state) throw new Error('useProfile doit être utilisé sous <ProfileProvider>');
  return state;
}
