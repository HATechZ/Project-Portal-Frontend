import { useMemo, useSyncExternalStore } from 'react';
import { readStoredUser, subscribeToAuthSession } from '@/services/authSession';

/** Effective permissions returned by the authentication response and persisted at sign-in. */
export function usePermissions() {
  const user = useSyncExternalStore(subscribeToAuthSession, readStoredUser, () => null);
  return useMemo(() => {
    const permissions = new Set(Array.isArray(user?.permissions) ? user.permissions.filter((value): value is string => typeof value === 'string') : []);
    const scopes = Array.isArray(user?.roleScopes) ? user.roleScopes.filter((value): value is string => typeof value === 'string') : [];
    return {
      permissions,
      scopes,
      can: (permission: string) => permissions.has(permission),
      canAny: (permissionCodes: readonly string[]) => permissionCodes.some((permission) => permissions.has(permission)),
    };
  }, [user]);
}
