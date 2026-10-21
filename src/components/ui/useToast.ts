import { useEffect, useState } from 'react';

const TOAST_DURATION = 3000;

/** Message du « Toast » de l'écran, effacé après 3 s. */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), TOAST_DURATION);
    return () => clearTimeout(id);
  }, [message]);

  return { message, show: setMessage, hide: () => setMessage(null) };
}

export type ToastState = ReturnType<typeof useToast>;
