import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

/**
 * Component that manages React Query cache based on authentication state.
 * Clears all cache when user logs out or switches accounts to prevent
 * showing stale data from previous user.
 */
export const CacheManager = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const token = useAuthStore((state) => state.token);
  const previousUserIdRef = useRef<string | undefined>(userId);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount to avoid clearing cache on app load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousUserIdRef.current = userId;
      return;
    }

    const currentUserId = userId;

    // If user logged out (token is null but we had a previous user)
    if (!token && previousUserIdRef.current !== undefined) {
      // Cancel all in-flight queries and clear cache on logout
      queryClient.cancelQueries();
      queryClient.clear();
      previousUserIdRef.current = undefined;
      return;
    }

    // If user logged in or switched accounts
    if (currentUserId && currentUserId !== previousUserIdRef.current) {
      // Cancel all in-flight queries and clear cache when switching users
      // This prevents showing old account's data even if queries are in progress
      queryClient.cancelQueries();
      queryClient.clear();
      previousUserIdRef.current = currentUserId;
    } else if (currentUserId) {
      // Just update the ref if same user
      previousUserIdRef.current = currentUserId;
    }
  }, [userId, token, queryClient]);

  return null;
};

