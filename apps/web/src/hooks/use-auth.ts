'use client';

import { useAuthContext } from '@/lib/auth/context';

/**
 * Convenience hook that exposes auth state and actions.
 * Wraps AuthContext for simpler consumption in components.
 */
export function useAuth() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuthContext();

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
