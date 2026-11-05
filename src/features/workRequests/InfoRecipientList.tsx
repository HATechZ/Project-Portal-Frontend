import { isCurrentRequester, recipientPresentation } from './recipientPresentation';
import type { WorkRequestInfoRequestRecipient } from '@/services/workRequestService';

type Props = {
  recipients: WorkRequestInfoRequestRecipient[];
  currentActorId?: string | null;
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
  loading: boolean;
  error: string | null;
};

export function InfoRecipientList({ recipients, currentActorId, selectedId, onSelect, disabled, loading, error }: Props) {
  const eligible = recipients.filter((recipient) => !isCurrentRequester(recipient, currentActorId));
  const selected = eligible.find((recipient) => recipient.actorId === selectedId);
  return <section className="info-recipients">
    <label><span>Recipient</span><select disabled={disabled || loading || Boolean(error) || !eligible.length} onChange={(event) => onSelect(event.target.value)} required value={selectedId}>
      <option value="">{loading ? 'Loading eligible recipients...' : 'Select a recipient'}</option>
      {eligible.map((recipient) => { const display = recipientPresentation(recipient); return <option key={recipient.actorId} value={recipient.actorId}>{[display.displayName, ...display.details, display.email].filter(Boolean).join(' - ')}</option>; })}
    </select></label>
    {error ? <p className="role-form-error" role="alert">{error}</p> : null}
    {!loading && !error && !eligible.length ? <p>No eligible recipients are available yet.</p> : null}
    {selected && recipientPresentation(selected).replyNote ? <p>{recipientPresentation(selected).replyNote}</p> : null}
  </section>;
}
