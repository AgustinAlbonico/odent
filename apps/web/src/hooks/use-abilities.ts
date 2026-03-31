'use client';

import { useMemo } from 'react';
import { useAuthContext } from '@/lib/auth/context';
import { Action, Module, Scope } from '@sistema-odontologico/permissions';

/**
 * Hook for checking user abilities (permissions).
 * Uses the abilities loaded by AuthContext.
 */
export function useAbilities() {
  const { abilities } = useAuthContext();

  const hasAbility = useMemo(
    () => (module: Module, action: Action) => {
      return abilities.some(
        (ability) =>
          ability.module === module &&
          ability.action === action &&
          ability.scope !== Scope.NONE,
      );
    },
    [abilities],
  );

  const canView = useMemo(
    () => (module: Module) => {
      return hasAbility(module, Action.VIEW_MODULE);
    },
    [hasAbility],
  );

  const canOperate = useMemo(
    () => (module: Module, action: Action) => {
      return hasAbility(module, action);
    },
    [hasAbility],
  );

  const getScope = useMemo(
    () => (module: Module): Scope | null => {
      const ability = abilities.find((a) => a.module === module);
      return ability?.scope ?? null;
    },
    [abilities],
  );

  return { abilities, hasAbility, canView, canOperate, getScope };
}
