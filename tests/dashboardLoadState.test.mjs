import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/features/dashboard/dashboardLoadState.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { hasDashboardOutage, dashboardMetricValue, retryFailedDashboardQueries } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);
const success = { failed: false, network: false, succeeded: true };
const network = { failed: true, network: true, succeeded: false };
const apiError = { failed: true, network: false, succeeded: false };

test('an offline backend with multiple failed requests produces one outage state', () => {
  assert.equal(hasDashboardOutage([network, network, network]), true);
  assert.equal(hasDashboardOutage([network]), true);
});

test('an isolated bids failure with other successful sections remains local', () => {
  assert.equal(hasDashboardOutage([apiError, success, success]), false);
  assert.equal(hasDashboardOutage([network, success, success]), false);
});

test('zero is displayed only when its request succeeded', () => {
  assert.equal(dashboardMetricValue(0, false, false), 0);
  assert.equal(dashboardMetricValue(0, false, true), null);
  assert.equal(dashboardMetricValue(0, true, false), null);
});

test('retry targets only failed queries and reflects successful and failed retries', () => {
  let calls = 0;
  const queries = [{ isError: true, refetch: () => { calls += 1; } }, { isError: false, refetch: () => { throw Error('successful query must not be retried'); } }];
  retryFailedDashboardQueries(queries);
  assert.equal(calls, 1);
  assert.equal(hasDashboardOutage([success, success]), false);
  assert.equal(hasDashboardOutage([network, network]), true);
});
