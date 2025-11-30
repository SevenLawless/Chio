import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export const useHydratedAuth = () => {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

  return isHydrated;
};

