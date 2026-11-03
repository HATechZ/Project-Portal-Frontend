import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AttachmentUpload } from '@/components/ui/AttachmentUpload';
import { createPendingAttachment, type PendingAttachment } from '@/components/ui/attachmentDraft';
import { createBid, getBid, getBids, getBidCreationAvailableDocumentCodes, updateBid, type AvailableDocumentCode, type Bid, type CreateBidPayload } from '@/services/bidService';
import { getClients } from '@/services/clientService';
import { getCargoCodes } from '@/services/cargoCodeService';
import { getPolCodes } from '@/services/polCodeService';
import { getPodCodes } from '@/services/podCodeService';
import { getVesselCodes } from '@/services/vesselCodeService';
import { usePermissions } from '@/hooks/usePermissions';
import { readableApiError } from '@/services/roleService';

type Form = Omit<CreateBidPayload, 'attachments'>;
type Option = { id: string; name: string; code?: string; isActive?: boolean };
const blank: Form = { name: '', clientId: '', biddingNumber: '', polId: '', podId: '', cargoId: '', vesselId: '', shipmentNumber: '' };
const MAX_DOCUMENTS = 20;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const fileAccept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.dwg,.dxf,.jpg,.jpeg,.png,.zip';

export function BidsPanel({ createRequest = 0, modalOnly = false, filterText = '' }: { createRequest?: number; modalOnly?: boolean; filterText?: string }) {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Bid | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const canView = can('VIEW_BID');
  const canCreate = can('CREATE_BID');
  const canUpdate = can('UPDATE_BID');
  const bidsQuery = useQuery({ queryKey: ['bids'], queryFn: getBids, enabled: canView });
  const detailQuery = useQuery({ queryKey: ['bids', selected?.id], queryFn: () => getBid(selected!.id), enabled: modal === 'edit' && Boolean(selected) && canView });
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: getClients, enabled: modal === 'create' && canCreate && can('VIEW_CLIENTS') });
  const polQuery = useQuery({ queryKey: ['pol-codes'], queryFn: getPolCodes, enabled: modal === 'create' && canCreate && can('VIEW_REFERENCE_DATA') });
  const podQuery = useQuery({ queryKey: ['pod-codes'], queryFn: getPodCodes, enabled: modal === 'create' && canCreate && can('VIEW_REFERENCE_DATA') });
  const cargoQuery = useQuery({ queryKey: ['cargo-codes'], queryFn: getCargoCodes, enabled: modal === 'create' && canCreate && can('VIEW_REFERENCE_DATA') });
  const vesselQuery = useQuery({ queryKey: ['vessel-codes'], queryFn: getVesselCodes, enabled: modal === 'create' && canCreate && can('VIEW_REFERENCE_DATA') });
  const bidDocumentCodesQuery = useQuery({ queryKey: ['bids', 'creation', 'available-document-codes'], queryFn: getBidCreationAvailableDocumentCodes, enabled: modal === 'create' && canCreate });
  const close = () => { setModal(null); setSelected(null); setForm(blank); setAttachments([]); };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['bids'] });

  useEffect(() => { if (createRequest && canCreate) { setForm(blank); setAttachments([]); setModal('create'); } }, [createRequest, canCreate]);
  useEffect(() => { if (modal === 'edit' && detailQuery.data) setForm({ ...blank, name: detailQuery.data.name }); }, [modal, detailQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => createBid({ ...form, attachments }),
    onSuccess: () => { toast.success('Bid created successfully.'); void refresh(); close(); },
    onError: (error) => toast.error(readableApiError(error, 'Unable to create the bid.')),
  });
  const editMutation = useMutation({ mutationFn: () => updateBid(selected!.id, { name: form.name.trim() }), onSuccess: () => { toast.success('Bid updated successfully.'); void refresh(); close(); }, onError: (error) => toast.error(readableApiError(error, 'Unable to update the bid.')) });
  const loading = clientsQuery.isLoading || polQuery.isLoading || podQuery.isLoading || cargoQuery.isLoading || vesselQuery.isLoading;
  const bids = (bidsQuery.data?.items ?? []).filter((bid) => `${bid.name} ${bid.biddingNumber} ${bid.projectCode} ${bid.shipmentNumber} ${bid.status}`.toLowerCase().includes(filterText.trim().toLowerCase()));
  const editor = modal === 'create' ? <Create attachments={attachments} documentCodes={bidDocumentCodesQuery.data ?? []} documentCodesError={bidDocumentCodesQuery.isError} documentCodesLoading={bidDocumentCodesQuery.isLoading} form={form} loading={loading} onAttachmentsChange={setAttachments} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onClose={close} onSubmit={(event) => { event.preventDefault(); if (attachments.some((attachment) => !attachment.documentCodeId)) return void toast.error('Select a document code for every attachment.'); createMutation.mutate(); }} options={{ clients: active(clientsQuery.data?.items ?? []), pol: active(polQuery.data ?? []), pod: active(podQuery.data ?? []), cargo: active(cargoQuery.data ?? []), vessel: active(vesselQuery.data ?? []) }} saving={createMutation.isPending} /> : modal === 'edit' ? <Edit form={form} loading={detailQuery.isLoading} onChange={(name) => setForm((current) => ({ ...current, name }))} onClose={close} onSubmit={(event) => { event.preventDefault(); if (form.name.trim()) editMutation.mutate(); }} saving={editMutation.isPending} /> : null;

  if (modalOnly) return editor;
  return <section className="dash-panel division-panel"><div className="dash-section-title"><strong>Bids</strong><span>{bidsQuery.isLoading ? 'Loading bids' : `${bids.length} bid records`}</span>{canCreate ? <button onClick={() => { setForm(blank); setAttachments([]); setModal('create'); }} type="button">Create Bid</button> : null}</div><div className="division-table"><div className="division-grid division-grid--head"><span>Bid</span><span>Project code</span><span>Shipment</span><span>Status</span><span>Actions</span></div>{bids.map((bid) => <div className="division-grid" key={bid.id}><span><strong>{bid.name}</strong><small>{bid.biddingNumber} · {bid.fileCount} files</small></span><span>{bid.projectCode || '—'}</span><span>{bid.shipmentNumber || '—'}</span><span>{bid.status || 'Draft'}</span><span className="division-actions">{canUpdate && editable(bid) ? <button onClick={() => { setSelected(bid); setForm({ ...blank, name: bid.name }); setModal('edit'); }} type="button">Edit</button> : null}</span></div>)}{!bidsQuery.isLoading && !bids.length ? <div className="division-empty">No bids available.</div> : null}</div>{editor}</section>;
}

function active<T extends Option>(items: T[]) { return items.filter((item) => item.isActive !== false); }
function editable(bid: Bid) { return !['ARCHIVED', 'CANCELLED', 'CLOSED'].includes(bid.status.trim().toUpperCase()); }

function Create({ attachments, documentCodes, documentCodesError, documentCodesLoading, form, options, loading, saving, onAttachmentsChange, onChange, onClose, onSubmit }: { attachments: PendingAttachment[]; documentCodes: AvailableDocumentCode[]; documentCodesError: boolean; documentCodesLoading: boolean; form: Form; options: Record<'clients' | 'pol' | 'pod' | 'cargo' | 'vessel', Option[]>; loading: boolean; saving: boolean; onAttachmentsChange: (attachments: PendingAttachment[]) => void; onChange: (key: keyof Form, value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const field = (label: string, key: keyof Form, fieldOptions?: Option[]) => <label><span>{label}</span>{fieldOptions ? <select disabled={loading || saving} onChange={(event) => onChange(key, event.target.value)} required value={form[key]}><option value="">Select {label}</option>{fieldOptions.map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} — ${item.name}` : item.name}</option>)}</select> : <input disabled={saving} onChange={(event) => onChange(key, event.target.value)} required value={form[key]} />}</label>;
  const updateAttachment = (id: string, patch: Partial<PendingAttachment>) => onAttachmentsChange(attachments.map((attachment) => attachment.id === id ? { ...attachment, ...patch } : attachment));
  const attachmentSection = documentCodesLoading ? <p>Loading document codes for Bid attachments...</p> : documentCodesError ? <p>Unable to load document codes for Bid attachments. Please try again.</p> : documentCodes.length ? <AttachmentUpload accept={fileAccept} attachments={attachments} codes={documentCodes} disabled={saving} maxFileBytes={MAX_FILE_BYTES} maxFiles={MAX_DOCUMENTS} metadataMode="document-metadata" onAdd={(files) => onAttachmentsChange([...attachments, ...files.map(createPendingAttachment)])} onDocumentCodeChange={(id, documentCodeId) => updateAttachment(id, { documentCodeId })} onMetadataChange={(id, field, value) => updateAttachment(id, { [field]: value })} onRemove={(id) => onAttachmentsChange(attachments.filter((attachment) => attachment.id !== id))} onValidationError={(message) => toast.error(message)} /> : <div className="division-empty">No document codes are available for Bid attachments.</div>;
  return <div className="division-modal-backdrop"><section aria-modal="true" className="division-modal division-modal--wide" role="dialog"><div className="division-modal__head"><strong>Create Bid</strong><button onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><div className="division-form__grid">{field('Bid name', 'name')}{field('Client', 'clientId', options.clients)}{field('Bidding number', 'biddingNumber')}{field('Shipment number', 'shipmentNumber')}{field('POL', 'polId', options.pol)}{field('POD', 'podId', options.pod)}{field('Cargo code', 'cargoId', options.cargo)}{field('Vessel code', 'vesselId', options.vessel)}</div>{attachmentSection}<div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={loading || saving} type="submit">{saving ? 'Creating...' : 'Create Bid'}</button></div></form></section></div>;
}

function Edit({ form, loading, saving, onChange, onClose, onSubmit }: { form: Form; loading: boolean; saving: boolean; onChange: (name: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="division-modal-backdrop"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><strong>Update Bid</strong><button onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label><span>Bid name</span><input disabled={loading || saving} onChange={(event) => onChange(event.target.value)} required value={form.name} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={loading || saving || !form.name.trim()} type="submit">{saving ? 'Saving...' : 'Update Bid'}</button></div></form></section></div>; }
