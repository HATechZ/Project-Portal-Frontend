import { useQuery } from '@tanstack/react-query';
import { getAccessRole, getPermissions } from '@/services/roleService';

type RoleModalMode = 'create' | 'permissions' | null;

/** Keeps role-detail and permission-catalogue queries coupled to the role editor. */
export function useRolePermissions(roleModal: RoleModalMode, roleId: string | undefined, scope: string) {
  const roleDetailsQuery = useQuery({
    queryKey: ['access-role', roleId],
    queryFn: () => getAccessRole(roleId!),
    enabled: roleModal === 'permissions' && Boolean(roleId),
  });
  const permissionsQuery = useQuery({
    queryKey: ['permissions', scope],
    queryFn: () => getPermissions(scope),
    enabled: roleModal !== null && Boolean(scope),
  });
  const permissionCatalogueQuery = useQuery({
    queryKey: ['permissions', 'catalogue'],
    queryFn: () => getPermissions(),
    enabled: roleModal !== null,
  });

  return { roleDetailsQuery, permissionsQuery, permissionCatalogueQuery };
}
