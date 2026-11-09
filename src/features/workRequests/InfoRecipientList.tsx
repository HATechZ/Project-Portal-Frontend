import { recipientPresentation } from './recipientPresentation';
import type { WorkRequestInfoRequestRecipient } from '@/services/workRequestService';

type Props = {
  recipients: WorkRequestInfoRequestRecipient[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
  loading: boolean;
  error: string | null;
};

/** Renders every recipient returned by the backend, including reciprocal recipients. */
export function InfoRecipientList({ recipients, selectedId, onSelect, disabled, loading, error }: Props) {
  const selected = recipients.find((recipient) => recipient.actorId === selectedId);
  const selectedDisplay = selected ? recipientPresentation(selected) : null;
  return <section className="info-recipients">
    <label><span>Recipient</span><select disabled={disabled || loading || Boolean(error) || !recipients.length} onChange={(event) => onSelect(event.target.value)} required value={selectedId}>
      <option value="">{loading ? 'Loading eligible recipients...' : 'Select a recipient'}</option>
      {recipients.map((recipient) => { const display = recipientPresentation(recipient); return <option key={recipient.actorId} value={recipient.actorId}>{[display.displayName, ...display.details, display.email].filter(Boolean).join(' - ')}</option>; })}
    </select></label>
    {error ? <p className="role-form-error" role="alert">{error}</p> : null}
    {!loading && !error && !recipients.length ? <p>No eligible recipients are available yet.</p> : null}
    {selectedDisplay ? <div className="info-recipient__copy"><strong>{selectedDisplay.displayName}</strong>{selectedDisplay.email ? <span>{selectedDisplay.email}</span> : null}{selectedDisplay.details.map((item) => <small key={item}>{item}</small>)}</div> : null}
  </section>;
}
