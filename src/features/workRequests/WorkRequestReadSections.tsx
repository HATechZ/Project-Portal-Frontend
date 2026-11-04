import { ClipboardList, Users } from 'lucide-react';
import type { WorkRequestAssignment, WorkRequestInfoRecipientStatus, WorkRequestInfoRequest, WorkRequestInfoRequestRecipient } from '@/services/workRequestService';
import { recipientPresentation } from './recipientPresentation';
import { formatDateTime } from './workflowPresentation';

type ReadState<T> = { data?: T; loading: boolean; error: boolean; retry: () => void };

export function WorkRequestDivisionAssignment({ state, divisionNames }: { state: ReadState<WorkRequestAssignment[]>; divisionNames: Map<string, string> }) {
  const assignment = state.data?.find((item) => item.level === 'DIVISION' && !item.unassignedAt && !item.replacedAt);
  return <section className="work-request-side-card">
    <header><Users size={17} /><h2>Current Division assignment</h2></header>
    {state.loading ? <div className="work-request-side-card__empty">Loading assignment...</div> : state.error ? <ReadError message="Division assignment could not be loaded." retry={state.retry} /> : assignment ? <div className="work-request-read-content">
      <strong>{(assignment.divisionId && divisionNames.get(assignment.divisionId)) || assignment.divisionId || 'Division unavailable'}</strong>
      <span>Responsible Division Lead{(assignment.responsibleRecipients?.length ?? 0) === 1 ? '' : 's'}: {(assignment.responsibleRecipients ?? []).map((lead) => lead.displayName || lead.label).join(', ') || 'None returned'}</span>
    </div> : <div className="work-request-side-card__empty">No current Division assignment.</div>}
  </section>;
}

export function WorkRequestInformationReads({ history, recipients, status }: {
  history: ReadState<WorkRequestInfoRequest[]>;
  recipients: ReadState<WorkRequestInfoRequestRecipient[]>;
  status: ReadState<WorkRequestInfoRecipientStatus>;
}) {
  const reads = [history, recipients, status];
  const hasError = reads.some((read) => read.error);
  const names = new Map((recipients.data ?? []).map((recipient) => [recipient.actorId, recipientPresentation(recipient).displayName]));
  const actor = (id: string) => names.get(id) ?? id;
  return <section className="work-request-side-card">
    <header><ClipboardList size={17} /><h2>Information requests</h2></header>
    {hasError ? <ReadError message="Some information request data could not be loaded." retry={() => reads.filter((read) => read.error).forEach((read) => read.retry())} /> : null}
    <div className="work-request-read-content">
      <strong>History</strong>
      {history.loading ? <span>Loading history...</span> : history.data ? history.data.length ? history.data.map((item) => <article className="work-request-read-item" key={item.id}>
        <strong>{item.message}</strong><span>{actor(item.requester.actorId)} → {actor(item.target.actorId)}</span><span>{item.status} · {formatDateTime(item.requestedAt)}</span>
        {(item.attachments?.length ?? 0) > 0 ? <span>{item.attachments!.length} attachment(s)</span> : null}
        {item.responses?.map((response) => <div className="work-request-read-response" key={response.id}><strong>Response</strong><span>{response.message}</span><span>{actor(response.responder.actorId)} · {formatDateTime(response.respondedAt)}</span></div>)}
      </article>) : <span>No information requests yet.</span> : null}
      <strong>Eligible recipients</strong>
      {recipients.loading ? <span>Loading recipients...</span> : recipients.data ? recipients.data.length ? recipients.data.map((recipient) => {
        const display = recipientPresentation(recipient);
        return <div className="work-request-read-item" key={recipient.actorId}><strong>{display.displayName}</strong>{display.details.map((detail) => <span key={detail}>{detail}</span>)}{display.email ? <span>{display.email}</span> : null}{display.replyNote ? <span>{display.replyNote}</span> : null}</div>;
      }) : <span>No eligible recipients are available yet.</span> : null}
      {status.loading ? <span>Loading recipient availability...</span> : status.data?.unavailableContacts.map((contact) => {
        const display = recipientPresentation(contact);
        return <div className="work-request-read-item" key={contact.contactId}><strong>{display.displayName}</strong>{display.details.map((detail) => <span key={detail}>{detail}</span>)}<span>Unavailable — portal access/profile not configured</span></div>;
      })}
    </div>
  </section>;
}

function ReadError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="work-request-side-card__empty" role="status">{message} <button type="button" onClick={retry}>Retry</button></div>;
}
