import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';
import React from 'react';

const output = await build({ entryPoints: ['src/features/workRequests/WorkRequestActionBar.tsx'], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', '@tanstack/react-query', 'lucide-react', 'react-toastify', '@/services/*', '@/utils/*', '@/components/*'], logLevel: 'silent' });
const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL('../src/pages/WorkRequestDetailsPage.tsx', import.meta.url), 'utf8');
const actionSource = await readFile(new URL('../src/features/workRequests/WorkRequestActionBar.tsx', import.meta.url), 'utf8');

function harness(actions, memberSteps = []) {
  let state = []; let cursor = 0; let pending; const calls = [];
  const fakeReact = { ...React, useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], (value) => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; }, useMemo(fn) { return fn(); } };
  const query = { useQuery({ queryKey }) { return { data: queryKey.includes('internal-cycle') ? { teamSteps: [{ id: 'team-step', memberSteps }], routeStep: {} } : undefined }; }, useMutation(options) { return { isPending: false, mutate() { pending = Promise.resolve().then(() => options.mutationFn()).then(options.onSuccess); }, mutateAsync: async (...args) => { const result = await options.mutationFn(...args); await options.onSuccess(); return result; } }; } };
  const service = new Proxy({}, { get(_target, name) { return (...args) => { calls.push([name, ...args]); return Promise.resolve(); }; } });
  const module = { exports: {} };
  const requireMock = (name) => name === 'react' ? fakeReact : name === '@tanstack/react-query' ? query : name === 'react-toastify' ? { toast: { success() {}, warning() {}, error() {} } } : name.startsWith('@/services/') ? service : name.startsWith('@/utils/') || name.startsWith('@/components/') ? {} : nativeRequire(name);
  new Function('module', 'exports', 'require', output.outputFiles[0].text)(module, module.exports, requireMock);
  const props = { workRequestId: 'request', actions, workflowContext: { currentDivisionCycleId: 'cycle', currentTeamStepId: 'team-step', hasResolvedContext: true }, onActionSuccess: async () => { calls.push(['refresh']); }, onContextRequired: async () => {}, route: { projection: { routeStepId: 'route-step' } } };
  function render() { cursor = 0; return module.exports.WorkRequestActionBar(props); }
  return { render, calls, wait: () => pending };
}

function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  return [element, ...React.Children.toArray(element.props?.children).flatMap(nodes)];
}
const action = (code, label) => ({ code, label, targetKind: '' });
const button = (tree, label) => nodes(tree).find((node) => node.type === 'button' && node.props.children === label);

test('Team Submit appears only for the backend action, including an empty member sequence', () => {
  assert.ok(button(harness([action('COMPLETE_TEAM_STEP', 'Complete Team step')], []).render(), 'Submit'));
  assert.equal(button(harness([action('FORWARD_ROUTE', 'Forward')], []).render(), 'Submit'), undefined);
  assert.ok(button(harness([action('FORWARD_ROUTE', 'Forward')]).render(), 'Forward'));
});

test('Team submission calls the existing completion mutation and refreshes without forwarding or activating a team', async () => {
  for (const members of [[], [{ id: 'member', member: { name: 'Member' } }]]) {
    const ui = harness([action('COMPLETE_TEAM_STEP', 'Complete Team step')], members);
    button(ui.render(), 'Submit').props.onClick();
    const form = nodes(ui.render()).find((node) => node.type === 'form');
    form.props.onSubmit({ preventDefault() {} });
    await ui.wait();
    assert.deepEqual(ui.calls, [['completeWorkRequestTeamStep', 'request', 'team-step'], ['refresh']]);
  }
});

test('action success uses the existing scoped workflow refresh for member, team and forward actions', () => {
  assert.match(source, /onActionSuccess=\{refreshWorkflow\}/);
  for (const key of ["['work-request', id]", "['work-request', id, 'route']", "['work-request', id, 'available-actions']", "['work-request', id, 'internal-cycles']"]) assert.ok(source.includes(`invalidateQueries({ queryKey: ${key} })`));
  assert.match(actionSource, /action === 'SUBMIT_MEMBER_STEP'[\s\S]*?await onActionSuccess\(\)/);
  assert.doesNotMatch(actionSource, /(?:role|teamName)\s*===/i);
});
