import { useMemo, useSyncExternalStore } from 'react';
import { readActorProfileSwitching, readStoredUser, subscribeToAuthSession } from '@/services/authSession';

/** Effective permissions returned by the authentication response and persisted at sign-in. */
export function usePermissions() {
  const user = useSyncExternalStore(subscribeToAuthSession, readStoredUser, () => null);
  const isActorProfileSwitching = useSyncExternalStore(subscribeToAuthSession, readActorProfileSwitching, () => false);
  return useMemo(() => {
    const permissions = new Set(Array.isArray(user?.permissions) ? user.permissions.filter((value): value is string => typeof value === 'string').map((value) => value.trim().toUpperCase()) : []);
    const scopes = Array.isArray(user?.roleScopes) ? user.roleScopes.filter((value): value is string => typeof value === 'string') : [];
    return {
      user,
      // A persisted profile alone is not enough: it must be accompanied by a
      // current access token before any protected shell can render.
      isAuthenticated: Boolean(user && localStorage.getItem('accessToken')),
      isActorProfileSwitching,
      permissions,
      scopes,
      can: (permission: string) => permissions.has(permission.trim().toUpperCase()),
      canAny: (permissionCodes: readonly string[]) => permissionCodes.some((permission) => permissions.has(permission.trim().toUpperCase())),
    };
  }, [isActorProfileSwitching, user]);
}
