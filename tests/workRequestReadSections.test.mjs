import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const output = await build({ entryPoints: ['src/features/workRequests/WorkRequestReadSections.tsx'], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'lucide-react'], logLevel: 'silent' });
const module = { exports: {} };
new Function('module', 'exports', 'require', output.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
const { WorkRequestDivisionAssignment, WorkRequestInformationReads } = module.exports;
const state = (data, error = false) => ({ data, loading: false, error, retry() {} });

test('renders the current assignment and backend responsible Lead without a member or role check', () => {
  const assignments = [{ id: 'old', level: 'DIVISION', divisionId: 'division', replacedAt: '2025-01-01', responsibleRecipients: [{ actorId: 'old', label: 'Old lead' }] }, { id: 'new', level: 'DIVISION', divisionId: 'division', unassignedAt: null, replacedAt: null, responsibleRecipients: [{ actorId: 'lead', label: 'Profile', displayName: 'Tanvir Zain' }] }];
  const html = renderToStaticMarkup(React.createElement(WorkRequestDivisionAssignment, { state: state(assignments), divisionNames: new Map([['division', 'Project Management']]) }));
  assert.match(html, /Project Management/);
  assert.match(html, /Tanvir Zain/);
  assert.doesNotMatch(html, /Old lead/);
});

test('renders information history, eligible recipients and unavailable contacts from successful reads', () => {
  const history = [{ id: 'request', message: 'Please clarify', status: 'OPEN', requestedAt: '2026-01-01T00:00:00Z', requester: { actorId: 'sender' }, target: { actorId: 'recipient' }, responses: [{ id: 'response', message: 'More details', respondedAt: '2026-01-02T00:00:00Z', responder: { actorId: 'recipient' } }] }];
  const recipients = [{ actorId: 'recipient', displayName: 'Tanvir', contextType: 'DIVISION_LEAD', context: { name: 'Engineering' } }];
  const status = { unavailableContacts: [{ contactId: 'contact', displayName: 'Arif', contextType: 'CLIENT_CONTACT', context: { name: 'Meridian' } }] };
  const html = renderToStaticMarkup(React.createElement(WorkRequestInformationReads, { history: state(history), recipients: state(recipients), status: state(status) }));
  for (const value of ['Please clarify', 'More details', 'Tanvir', 'Engineering', 'Arif', 'Meridian', 'Unavailable']) assert.ok(html.includes(value));
});

test('combines read failures into one section error while retaining successful data', () => {
  const html = renderToStaticMarkup(React.createElement(WorkRequestInformationReads, { history: state(undefined, true), recipients: state([{ actorId: 'a', displayName: 'Available' }]), status: state(undefined, true) }));
  assert.equal((html.match(/Some information request data could not be loaded/g) ?? []).length, 1);
  assert.match(html, /Available/);
});
