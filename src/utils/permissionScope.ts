export type ScopedPermission = {
  id: string;
  code?: string;
  displayName?: string;
  name?: string;
  compatibleScopes: readonly string[];
  requiredPermissionIds: readonly string[];
};

export function permissionLoadState(scope: string, hasScopedData: boolean, scopedError: boolean) {
  if (!scope) return 'idle';
  if (hasScopedData) return 'ready';
  return scopedError ? 'error' : 'loading';
}

export function isPermissionCompatible(permission: ScopedPermission, scope: string) {
  const selected = scope.trim().toLowerCase();
  return Boolean(selected) && Array.isArray(permission.compatibleScopes) && permission.compatibleScopes.some((value) => value.trim().toLowerCase() === selected);
}

export function incompatibleSelections(ids: readonly string[], catalogue: readonly ScopedPermission[], scope: string) {
  const byId = new Map(catalogue.flatMap((permission) => [[permission.id, permission] as const, ...(permission.code ? [[permission.code, permission] as const] : [])]));
  return ids.flatMap((id) => {
    const permission = byId.get(id);
    const label = permission?.displayName || permission?.name || permission?.code || id;
    if (!permission || !isPermissionCompatible(permission, scope)) return [{ id, label }];
    return scopedDependencies([permission.id], catalogue, scope).rejected.length ? [{ id, label: `${label} (required permission is incompatible or unavailable)` }] : [];
  });
}

/** Reject roots with missing or incompatible dependencies, rather than silently adding invalid IDs. */
export function scopedDependencies(ids: readonly string[], catalogue: readonly ScopedPermission[], scope: string) {
  const byId = new Map(catalogue.map((permission) => [permission.id, permission]));
  const selected = new Set<string>();
  const rejected: string[] = [];
  for (const root of ids) {
    const branch = new Set<string>();
    const visit = (id: string): boolean => {
      if (branch.has(id)) return true;
      const permission = byId.get(id);
      if (!permission || !isPermissionCompatible(permission, scope)) return false;
      branch.add(id);
      return permission.requiredPermissionIds.every(visit);
    };
    if (visit(root)) branch.forEach((id) => selected.add(id));
    else rejected.push(root);
  }
  return { selected: [...selected], rejected };
}

export function readPermissionScopeValidation(data: unknown, catalogue: readonly ScopedPermission[]) {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const nested = root.error && typeof root.error === 'object' ? root.error as Record<string, unknown> : undefined;
  const details = nested?.details ?? root.details;
  if (!details || typeof details !== 'object') return null;
  const record = details as Record<string, unknown>;
  if (record.canSave !== false && !record.incompatiblePermissions && !record.unknownPermissionIds && !record.affectedBindings) return null;
  const labels = (value: unknown) => Array.isArray(value) ? value.flatMap((item) => {
    if (typeof item === 'string') return [{ id: catalogue.find((permission) => [permission.id, permission.displayName, permission.name, permission.code].includes(item))?.id ?? null, label: item }];
    if (!item || typeof item !== 'object') return [];
    const entry = item as Record<string, unknown>;
    const label = ['displayName', 'name', 'permissionName', 'roleName', 'userName', 'email', 'code', 'id'].map((key) => entry[key]).find((value): value is string => typeof value === 'string' && Boolean(value.trim()));
    if (!label) return [];
    const id = typeof entry.id === 'string' ? entry.id : catalogue.find((permission) => [permission.displayName, permission.name, permission.code].includes(label))?.id ?? null;
    return [{ id, label }];
  }) : [];
  const unknownIds = Array.isArray(record.unknownPermissionIds) ? record.unknownPermissionIds.filter((id): id is string => typeof id === 'string').map((id) => ({ id, label: id })) : [];
  return { incompatiblePermissions: [...labels(record.incompatiblePermissions), ...unknownIds], affectedBindings: labels(record.affectedBindings).map((binding) => binding.label) };
}
