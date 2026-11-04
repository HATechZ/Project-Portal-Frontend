import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/features/workRequests/recipientPresentation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { recipientPresentation, isCurrentRequester } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

test('displays route divisions and a neutral reply permission note without raw recipient type', () => {
  const result = recipientPresentation({ actorId: 'actor-1', displayName: 'Amina', recipientType: 'INTERNAL_MEMBER', contextType: 'DIVISION_LEAD', contexts: [{ kind: 'DIVISION_LEAD', name: 'Project Management Division' }, { kind: 'DIVISION_LEAD', name: 'Engineering Division' }], email: 'amina@example.com', canRespond: false });
  assert.deepEqual(result, { displayName: 'Amina', details: ['Project Management Division · Division Lead', 'Engineering Division · Division Lead'], email: 'amina@example.com', replyNote: 'Reply permission not currently assigned' });
});

test('renders unavailable client contact context returned by status', () => {
  const result = recipientPresentation({ contactId: 'contact-1', displayName: 'Arif', recipientType: 'EXTERNAL_CLIENT_CONTACT', contextType: 'CLIENT_CONTACT', context: { name: 'Meridian' }, canRespond: false });
  assert.equal(result.displayName, 'Arif');
  assert.deepEqual(result.details, ['Meridian · Client Contact']);
});

test('excludes only the active requester profile when known', () => {
  assert.equal(isCurrentRequester({ actorId: 'actor-1' }, 'actor-1'), true);
  assert.equal(isCurrentRequester({ actorProfileId: 'actor-1' }, 'actor-2'), false);
  assert.equal(isCurrentRequester({ actorId: 'actor-1' }, null), false);
});
