import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

/** UI guard only. The API remains the authorization boundary. */
export function PermissionRoute({ children, permissions }: { children: ReactNode; permissions: readonly string[] }) {
  const { canAny } = usePermissions();
  const location = useLocation();

  if (canAny(permissions)) return <>{children}</>;
  return <Navigate replace state={{ unavailablePath: location.pathname }} to="/dashboard" />;
}
