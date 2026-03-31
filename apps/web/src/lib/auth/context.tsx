'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAbilities,
  login as apiLogin,
  logout as apiLogout,
  type Ability,
  type AbilitiesResponse,
  type AuthUser,
  type LoginResponse,
} from './api';
import { clearAuthRoutingSnapshot, persistAuthRoutingSnapshot, resolveContextualLandingPath } from './routing';

/* ------------------------------------------------------------------ */
/* Context types                                                       */
/* ------------------------------------------------------------------ */

interface AuthState {
  user: AuthUser | null;
  abilities: Ability[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    abilities: [],
    isLoading: true,
    isAuthenticated: false,
  });

  const loadAbilities = useCallback(async (): Promise<AbilitiesResponse | null> => {
    try {
      const data = await getAbilities();
      persistAuthRoutingSnapshot(data.user, data.abilities);
      setState({
        user: data.user,
        abilities: data.abilities,
        isLoading: false,
        isAuthenticated: true,
      });
      return data;
    } catch {
      clearAuthRoutingSnapshot();
      setState({
        user: null,
        abilities: [],
        isLoading: false,
        isAuthenticated: false,
      });
      return null;
    }
  }, []);

  useEffect(() => {
    loadAbilities();
  }, [loadAbilities]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiLogin(email, password);

      if (result.requiresPasswordChange) {
        clearAuthRoutingSnapshot();
        setState({
          user: result.user,
          abilities: [],
          isLoading: false,
          isAuthenticated: true,
        });
        return result;
      }

      const data = await loadAbilities();
      return {
        ...result,
        landingPath: data
          ? resolveContextualLandingPath(data.user.role, data.abilities)
          : undefined,
      };
    },
    [loadAbilities],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    clearAuthRoutingSnapshot();
    setState({
      user: null,
      abilities: [],
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await loadAbilities();
  }, [loadAbilities]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
