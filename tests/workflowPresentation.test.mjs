import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['src/features/workRequests/workflowPresentation.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent' });
const module = { exports: {} };
new Function('module', 'exports', 'require', output.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
const { getWorkflowPresentation } = module.exports;
const serviceSource = await readFile(new URL('../src/services/workRequestService.ts', import.meta.url), 'utf8');

const route = (canViewMainWorkflow, memberStepId = null) => ({
  projection: { divisionCycleId: 'cycle-1', memberStepId },
  steps: [],
  workflowVisibility: { canViewMainWorkflow },
});
const internalWorkflow = (divisionName, divisionCycleId) => ({
  divisionId: divisionName.toLowerCase(), divisionName, divisionCycleId, currentTeamStepId: null,
  steps: [{ kind: 'division-start', divisionId: divisionName.toLowerCase(), divisionName, state: 'completed' }, { kind: 'division-end', divisionId: divisionName.toLowerCase(), divisionName, state: 'completed' }],
});
const presentation = (routeData, internalWorkflows, internalWorkflowsError = null) => getWorkflowPresentation({ routeData, internalWorkflows, internalWorkflowsError, internalWorkflowsLoading: false });

test('originating actor keeps Main Workflow when the Internal Workflow collection is forbidden', () => {
  const view = presentation(route(true), undefined, { status: 403 });
  assert.equal(view.canViewMainWorkflow, true);
  assert.deepEqual(view.internalWorkflows, []);
  assert.equal(view.showInternalWorkflowError, false);
});

test('originating Division sees its authorized Marketing cycle, not the current PM cycle', () => {
  const marketing = internalWorkflow('Marketing', 'marketing-cycle');
  const view = presentation(route(true), [marketing]);
  assert.equal(view.canViewMainWorkflow, true);
  assert.deepEqual(view.internalWorkflows, [marketing]);
  assert.doesNotMatch(JSON.stringify(view.internalWorkflows), /Project Management/);
});

test('current Division sees Main Workflow and its authorized PM Internal Workflow', () => {
  const pm = internalWorkflow('Project Management', 'pm-cycle');
  const view = presentation(route(true), [pm]);
  assert.equal(view.canViewMainWorkflow, true);
  assert.deepEqual(view.internalWorkflows, [pm]);
});

test('Team-level and Member actors retain the Internal Workflow without Main Workflow', () => {
  for (const actor of ['Team-level', 'Member']) {
    const ownWorkflow = internalWorkflow(actor, `${actor}-cycle`);
    const view = presentation(route(false), [ownWorkflow]);
    assert.equal(view.canViewMainWorkflow, false, actor);
    assert.deepEqual(view.internalWorkflows, [ownWorkflow], actor);
  }
});

test('tenant super admin keeps every authorized Internal Workflow independent', () => {
  const marketing = internalWorkflow('Marketing', 'marketing-cycle');
  const engineering = internalWorkflow('Engineering', 'engineering-cycle');
  const view = presentation(route(true), [marketing, engineering]);
  assert.equal(view.canViewMainWorkflow, true);
  assert.deepEqual(view.internalWorkflows.map((workflow) => workflow.divisionCycleId), ['marketing-cycle', 'engineering-cycle']);
});

test('a completed historical cycle and a null memberStepId remain visible', () => {
  const completedMarketing = internalWorkflow('Marketing', 'completed-marketing-cycle');
  const view = presentation(route(true, null), [completedMarketing]);
  assert.equal(view.canViewMainWorkflow, true);
  assert.deepEqual(view.internalWorkflows, [completedMarketing]);
});

test('an empty collection produces no Internal Workflow error state', () => {
  const view = presentation(route(true), []);
  assert.deepEqual(view.internalWorkflows, []);
  assert.equal(view.showInternalWorkflowError, false);
});

test('a malformed or stale collection value cannot break Internal Workflow rendering', () => {
  const view = presentation(route(true), { cycles: [internalWorkflow('Marketing', 'marketing-cycle')] });
  assert.deepEqual(view.internalWorkflows, []);
});

test('collection endpoint unwraps its collection envelope before the page renders', () => {
  assert.match(serviceSource, /getWorkRequestInternalCycles\(id: string\)/);
  assert.match(serviceSource, /normalizeInternalWorkflowCollection\(response\.data\)/);
  assert.match(serviceSource, /Object\.values\(value\)\.find\(Array\.isArray\)/);
  assert.match(serviceSource, /cycle as \{ internalWorkflow\?: unknown \}/);
});

test('only unexpected Internal Workflow collection failures show the scoped error state', () => {
  assert.equal(presentation(route(true), undefined, { status: 403 }).showInternalWorkflowError, false);
  assert.equal(presentation(route(true), undefined, new Error('network unavailable')).showInternalWorkflowError, true);
});
