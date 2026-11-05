import { useQuery } from '@tanstack/react-query';
import { getAccessRoles } from '@/services/roleService';
import { settingsQueryKeys } from '@/features/settings/queryKeys';

/** Preserves the Settings access-role query and its cache key. */
export function useRoles() {
  return useQuery({ queryKey: settingsQueryKeys.accessRoles, queryFn: getAccessRoles });
}
