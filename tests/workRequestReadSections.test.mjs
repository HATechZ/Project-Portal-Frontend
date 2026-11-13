import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';
import React from 'react';
const { QueryClient, QueryClientProvider } = createRequire(import.meta.url)('@tanstack/react-query');
import { renderToStaticMarkup } from 'react-dom/server';

const output = await build({ entryPoints: ['src/features/workRequests/WorkRequestReadSections.tsx'], bundle: true, alias: { '@': './src' }, define: { 'import.meta.env': '{}' }, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'lucide-react', '@tanstack/react-query'], logLevel: 'silent' });
const module = { exports: {} };
new Function('module', 'exports', 'require', output.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
const { WorkRequestInformationReads } = module.exports;
const state = (data) => ({ data, loading: false, error: false, retry() {} });
const recipients = [
  { actorId: 'marketing', displayName: 'Hasan Al Mahadi', divisionName: 'Marketing Division', designationName: 'Marketing Lead', canReceive: true },
  { actorId: 'engineering', displayName: 'Engineering Lead', divisionName: 'Engineering Division', designationName: 'Division Lead', canReceive: true },
  { actorId: 'pmd1', displayName: 'Hasan Khan Alex', divisionName: 'Project Management Division', teamNames: ['PMD-1'], designationName: 'Team Lead', canReceive: true },
  { actorId: 'pmd2', displayName: 'Second Team Lead', divisionName: 'Project Management Division', teamNames: ['PMD-2'], designationName: 'Team Lead', canReceive: true },
  { actorId: 'denied', displayName: 'Denied Recipient', canReceive: false },
];
const render = (history = [], extra = {}) => renderToStaticMarkup(React.createElement(QueryClientProvider, { client: new QueryClient() }, React.createElement(WorkRequestInformationReads, { currentActorProfileId: 'me', documents: [], history: state(history), recipients: state(recipients), onClose() {}, onReplySuccess: async () => {}, workRequestId: 'request', ...extra })));

test('shows every authorized division and team lead with backend labels, excluding denied recipients', () => {
  const html = render();
  for (const value of ['Hasan Al Mahadi', 'Marketing Division', 'Marketing Lead', 'Engineering Lead', 'Engineering Division', 'Hasan Khan Alex', 'Project Management Division · PMD-1', 'PMD-2', 'Second Team Lead', 'Team Lead']) assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, /Denied Recipient/);
  assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 4);
});

test('existing resolved or open conversations and workflow state do not shrink recipients', () => {
  const history = [{ id: 'old', message: 'Old', status: 'RESOLVED', requestedAt: '2026-01-01', requester: { actorId: 'me' }, target: { actorId: 'marketing' }, responses: [] }, { id: 'open', message: 'Open', status: 'OPEN', requestedAt: '2026-01-02', requester: { actorId: 'pmd1' }, target: { actorId: 'me' }, responses: [] }];
  for (const workflowState of ['INITIAL', 'COMPLETED']) {
    const html = render(history, { workflowState, currentActorRole: 'Unrelated role' });
    for (const recipient of recipients.filter((item) => item.canReceive)) assert.ok(html.includes(recipient.displayName));
    assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 4);
  }
});

test('does not exclude recipients when the current actor is unavailable', () => {
  assert.equal((render([], { currentActorProfileId: undefined }).match(/aria-pressed="false"/g) ?? []).length, 4);
});
