import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/permissionDependencies.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { resolvePermissionDependencies, toggleExplicitPermission } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

const catalogue = [
  { id: 'perm-bid-view', code: 'VIEW_BID', requiredPermissionIds: [] },
  { id: 'perm-bid-update', code: 'UPDATE_BID', requiredPermissionIds: ['perm-bid-view'] },
  { id: 'perm-bid-archive', code: 'ARCHIVE_BID', requiredPermissionIds: ['perm-bid-update'] },
  { id: 'perm-document-view', code: 'VIEW_DOCUMENT', requiredPermissionIds: [] },
  { id: 'perm-document-update', code: 'UPDATE_DOCUMENT', requiredPermissionIds: ['perm-document-view', 'perm-bid-view'] },
  { id: 'perm-bid-comment', code: 'COMMENT_BID', requiredPermissionIds: ['perm-bid-view'] },
  { id: 'perm-cycle-a', code: 'CYCLE_A', requiredPermissionIds: ['perm-cycle-b'] },
  { id: 'perm-cycle-b', code: 'CYCLE_B', requiredPermissionIds: ['perm-cycle-a'] },
];

const resolved = (ids) => new Set(resolvePermissionDependencies(ids, catalogue));

test('resolves direct, recursive, and cross-module dependencies', () => {
  assert.deepEqual(resolved(['perm-bid-update']), new Set(['perm-bid-update', 'perm-bid-view']));
  assert.deepEqual(resolved(['perm-bid-archive']), new Set(['perm-bid-archive', 'perm-bid-update', 'perm-bid-view']));
  assert.deepEqual(resolved(['perm-document-update']), new Set(['perm-document-update', 'perm-document-view', 'perm-bid-view']));
});

test('Select All and save payload include the effective dependency set', () => {
  const effective = resolved(['perm-bid-update', 'perm-document-update']);
  assert.deepEqual(effective, new Set(['perm-bid-update', 'perm-bid-view', 'perm-document-update', 'perm-document-view']));
});

test('a required dependency remains selected while a dependent remains explicit', () => {
  const explicit = ['perm-bid-update']; // Removing auto-selected VIEW_BID does not change this explicit set.
  const effective = [...resolved(explicit)];
  assert.deepEqual(toggleExplicitPermission(explicit, effective, 'perm-bid-view'), explicit);
  assert.ok(resolved(explicit).has('perm-bid-view'));
});

test('a shared dependency remains after one dependent is removed', () => {
  const explicit = ['perm-bid-update', 'perm-bid-comment'];
  const afterRemovingUpdate = explicit.filter((id) => id !== 'perm-bid-update');
  assert.ok(resolved(afterRemovingUpdate).has('perm-bid-view'));
});

test('circular dependencies terminate safely', () => {
  assert.deepEqual(resolved(['perm-cycle-a']), new Set(['perm-cycle-a', 'perm-cycle-b']));
});
