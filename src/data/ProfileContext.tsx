import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { color } from '@/theme/tokens';

import type { Avatar, TimerSoundId } from './profile';

type Account = { name: string; email: string };

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

// Prototype : pas de compte, une identité de démo, en mémoire comme le reste.
const DEMO_ACCOUNT: Account = { name: 'Florent Outan', email: 'florent.outan@exemple.fr' };

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState(DEMO_ACCOUNT);
  const [avatar, setAvatar] = useState<Avatar>({ kind: 'toque', id: 'onion', background: color.accentCreme });
  const [defaultServings, setDefaultServings] = useState(2);
  const [timerSound, setTimerSound] = useState<TimerSoundId>('timer');
  const [onboarded, setOnboarded] = useState(false);

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
