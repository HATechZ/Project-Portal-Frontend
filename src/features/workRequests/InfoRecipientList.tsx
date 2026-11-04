import { isCurrentRequester, recipientPresentation } from './recipientPresentation';
import type { WorkRequestInfoRecipientStatus, WorkRequestInfoRequestRecipient } from '@/services/workRequestService';

type Props = {
  recipients: WorkRequestInfoRequestRecipient[];
  unavailableContacts: WorkRequestInfoRecipientStatus['unavailableContacts'];
  currentActorId?: string | null;
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
  loading: boolean;
  error: string | null;
};

export function InfoRecipientList({ recipients, unavailableContacts, currentActorId, selectedId, onSelect, disabled, loading, error }: Props) {
  const eligible = recipients.filter((recipient) => !isCurrentRequester(recipient, currentActorId));
  return <section aria-labelledby="info-recipient-heading" className="info-recipients">
    <strong id="info-recipient-heading">Recipients</strong>
    {loading ? <p>Loading eligible recipients...</p> : null}
    {error ? <p className="role-form-error" role="alert">{error}</p> : null}
    {!loading && !error && !eligible.length ? <p>No eligible recipients are available yet.</p> : null}
    <div className="info-recipients__list" role="radiogroup" aria-labelledby="info-recipient-heading">
      {eligible.map((recipient) => {
        const display = recipientPresentation(recipient);
        return <label className="info-recipient" key={recipient.actorId}>
          <input checked={selectedId === recipient.actorId} disabled={disabled} name="info-recipient" onChange={() => onSelect(recipient.actorId)} type="radio" />
          <span className="info-recipient__copy"><strong>{display.displayName}</strong>{display.details.map((detail) => <span key={detail}>{detail}</span>)}{display.email ? <span>{display.email}</span> : null}{display.replyNote ? <small>{display.replyNote}</small> : null}</span>
        </label>;
      })}
    </div>
    {unavailableContacts.length ? <div className="info-recipients__list">{unavailableContacts.map((contact) => {
      const display = recipientPresentation(contact);
      return <div className="info-recipient info-recipient--unavailable" key={contact.contactId}><span className="info-recipient__copy"><strong>{display.displayName}</strong>{display.details.map((detail) => <span key={detail}>{detail}</span>)}{display.email ? <span>{display.email}</span> : null}<small>Unavailable — portal access/profile not configured</small></span></div>;
    })}</div> : null}
  </section>;
}
