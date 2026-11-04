import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/permissionScope.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { incompatibleSelections, isPermissionCompatible, permissionLoadState, scopedDependencies, readPermissionScopeValidation } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);
const permissions = [
  { id: 'company', displayName: 'Company reports', compatibleScopes: ['company'], requiredPermissionIds: [] },
  { id: 'division', displayName: 'Division reports', compatibleScopes: ['company', 'division'], requiredPermissionIds: [] },
  { id: 'view', displayName: 'View tasks', compatibleScopes: ['company', 'division', 'team'], requiredPermissionIds: [] },
  { id: 'edit', displayName: 'Edit tasks', compatibleScopes: ['company', 'division', 'team'], requiredPermissionIds: ['view'] },
  { id: 'bad', displayName: 'Manage team', compatibleScopes: ['team'], requiredPermissionIds: ['company'] },
];

test('scope transitions identify incompatible selections without changing them', () => {
  const selected = ['company', 'division', 'edit', 'view'];
  assert.deepEqual(incompatibleSelections(selected, permissions, 'division').map((p) => p.id), ['company']);
  assert.deepEqual(incompatibleSelections(selected, permissions, 'team').map((p) => p.id), ['company', 'division']);
  assert.deepEqual(selected, ['company', 'division', 'edit', 'view']);
  assert.equal(isPermissionCompatible(permissions[2], ' TEAM '), true);
  assert.equal(isPermissionCompatible(permissions[0], 'team'), false);
});

test('dependencies are selected only when the whole chain is compatible', () => {
  assert.deepEqual(new Set(scopedDependencies(['edit'], permissions, 'team').selected), new Set(['edit', 'view']));
  assert.deepEqual(scopedDependencies(['bad'], permissions, 'team'), { selected: [], rejected: ['bad'] });
  assert.match(incompatibleSelections(['bad'], permissions, 'team')[0].label, /required permission/);
  assert.deepEqual(scopedDependencies(['edit'], permissions.filter((p) => p.id !== 'view'), 'team').rejected, ['edit']);
});

test('unknown selections are blocked and backend incompatible names remain exact', () => {
  assert.deepEqual(incompatibleSelections(['missing'], permissions, 'team'), [{ id: 'missing', label: 'missing' }]);
  const error = { error: { details: { canSave: false, incompatiblePermissions: [{ id: 'company', name: 'Exact backend permission name' }], unknownPermissionIds: ['missing'], affectedBindings: [] } } };
  assert.deepEqual(readPermissionScopeValidation(error, permissions), { incompatiblePermissions: [{ id: 'company', label: 'Exact backend permission name' }, { id: 'missing', label: 'missing' }], affectedBindings: [] });
});

test('role editor blocks only until the selected scope data is available', () => {
  assert.equal(permissionLoadState('', false, false), 'idle');
  assert.equal(permissionLoadState('team', false, false), 'loading');
  assert.equal(permissionLoadState('team', false, true), 'error');
  assert.equal(permissionLoadState('team', true, false), 'ready');
  assert.equal(permissionLoadState('team', true, true), 'ready');
  // A new scope has no matching cached data, even if the previous scope did.
  assert.equal(permissionLoadState('division', false, false), 'loading');
});
