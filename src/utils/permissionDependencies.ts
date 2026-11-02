export type PermissionDependencyNode = {
  id: string;
  requiredPermissionIds: readonly string[];
};

/** Builds the effective permission set from explicit selections and backend-declared dependencies. */
export function resolvePermissionDependencies(explicitIds: readonly string[], catalogue: readonly PermissionDependencyNode[]) {
  const byId = new Map(catalogue.map((permission) => [permission.id, permission]));
  const resolved = new Set<string>();

  const visit = (id: string) => {
    if (resolved.has(id)) return;
    resolved.add(id);
    byId.get(id)?.requiredPermissionIds.forEach(visit);
  };

  explicitIds.forEach(visit);
  return [...resolved];
}

/** Updates explicit intent without allowing an auto-required dependency to be removed on its own. */
export function toggleExplicitPermission(explicitIds: readonly string[], effectiveIds: readonly string[], id: string) {
  if (explicitIds.includes(id)) return explicitIds.filter((value) => value !== id);
  if (effectiveIds.includes(id)) return [...explicitIds];
  return [...explicitIds, id];
}
