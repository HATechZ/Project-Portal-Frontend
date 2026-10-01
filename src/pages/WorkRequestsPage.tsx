import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getBids } from '@/services/bidService';
import { getGeneralDocumentCodes } from '@/services/generalDocumentCodeService';
import { getProjects } from '@/services/projectService';
import {
  createWorkRequest,
  getWorkRequest,
  getWorkRequestAvailableActions,
  getWorkRequestDocumentVersions,
  getWorkRequestDocuments,
  getWorkRequestEvents,
  getWorkRequests,
  updateWorkRequest,
  type CreateWorkRequestPayload,
  type WorkRequest,
  type WorkRequestPriority,
} from '@/services/workRequestService';
import { readableApiError } from '@/services/roleService';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AttachmentUpload } from '@/components/ui/AttachmentUpload';

type FormValues = CreateWorkRequestPayload;
type Modal = 'create' | 'edit' | 'details' | null;
const priorities: WorkRequestPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const emptyForm: FormValues = { bidId: '', projectId: '', title: '', priority: 'Low', notes: '', attachments: [] };

export function WorkRequestsPage({ createRequest = 0, embedded = false, modalOnly = false, filterText = '' }: { createRequest?: number; embedded?: boolean; modalOnly?: boolean; filterText?: string }) {
  usePageTitle(embedded ? 'Dashboard' : 'Work Requests');
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<Modal>(() => !embedded && new URLSearchParams(window.location.search).has('create') ? 'create' : null);
  const [selected, setSelected] = useState<WorkRequest | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const requestsQuery = useQuery({ queryKey: ['work-requests'], queryFn: getWorkRequests });
  const detailQuery = useQuery({ queryKey: ['work-requests', selected?.id], queryFn: () => getWorkRequest(selected!.id), enabled: Boolean(selected) && modal !== 'create' });
  const bidsQuery = useQuery({ queryKey: ['bids'], queryFn: getBids, enabled: modal === 'create' });
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: getProjects, enabled: modal === 'create' });
  const documentCodesQuery = useQuery({ queryKey: ['general-document-codes'], queryFn: getGeneralDocumentCodes, enabled: modal === 'create' });
  const documentsQuery = useQuery({ queryKey: ['work-requests', selected?.id, 'documents'], queryFn: () => getWorkRequestDocuments(selected!.id), enabled: modal === 'details' && Boolean(selected) });
  const eventsQuery = useQuery({ queryKey: ['work-requests', selected?.id, 'events'], queryFn: () => getWorkRequestEvents(selected!.id), enabled: modal === 'details' && Boolean(selected) });
  const actionsQuery = useQuery({ queryKey: ['work-requests', selected?.id, 'available-actions'], queryFn: () => getWorkRequestAvailableActions(selected!.id), enabled: modal === 'details' && Boolean(selected) });
  const [versionsDocumentId, setVersionsDocumentId] = useState<string | null>(null);
  const versionsQuery = useQuery({ queryKey: ['work-requests', selected?.id, 'documents', versionsDocumentId, 'versions'], queryFn: () => getWorkRequestDocumentVersions(selected!.id, versionsDocumentId!), enabled: Boolean(selected) && Boolean(versionsDocumentId) });

  useEffect(() => {
    if (modal === 'edit' && detailQuery.data) {
      setForm({ bidId: getReferenceId(detailQuery.data.bidId), projectId: getReferenceId(detailQuery.data.projectId), title: detailQuery.data.title, priority: normalizePriority(detailQuery.data.priority), notes: typeof detailQuery.data.notes === 'string' ? detailQuery.data.notes : '', attachments: [] });
    }
  }, [modal, detailQuery.data]);

  useEffect(() => {
    if (embedded && createRequest > 0) {
      setSelected(null);
      setVersionsDocumentId(null);
      setForm(emptyForm);
      setModal('create');
    }
  }, [createRequest, embedded]);

  const close = () => { if (!embedded) window.history.replaceState(null, '', '/work-requests'); setModal(null); setSelected(null); setForm(emptyForm); setVersionsDocumentId(null); };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['work-requests'] });
  const createMutation = useMutation({ mutationFn: createWorkRequest, onSuccess: () => { toast.success('Work request created successfully.'); void refresh(); close(); }, onError: (error) => toast.error(readableApiError(error, 'Unable to create the work request.')) });
  const updateMutation = useMutation({ mutationFn: (payload: { id: string; title: string; priority: WorkRequestPriority; notes: string | null }) => updateWorkRequest(payload.id, payload), onSuccess: () => { toast.success('Work request updated successfully.'); void refresh(); close(); }, onError: (error) => toast.error(readableApiError(error, 'Unable to update the work request.')) });
  const requests = (requestsQuery.data?.items ?? []).filter((request) => `${request.title} ${request.priority} ${request.currentState}`.toLowerCase().includes(filterText.trim().toLowerCase()));
  const documents = toArray(documentsQuery.data ?? detailQuery.data?.documents ?? []);
  const optionsLoading = bidsQuery.isLoading || projectsQuery.isLoading || documentCodesQuery.isLoading;

  function setField<K extends keyof Omit<FormValues, 'attachments'>>(field: K, value: FormValues[K]) { setForm((current) => ({ ...current, [field]: value })); }
  function setFiles(action: { type: 'add'; files: File[] } | { type: 'remove'; index: number }) { setForm((current) => action.type === 'add' ? ({ ...current, attachments: [...current.attachments, ...action.files.map((file) => ({ file, documentCodeId: '' }))] }) : ({ ...current, attachments: current.attachments.filter((_, index) => index !== action.index) })); }
  function openCreate() { if (embedded) { setSelected(null); setVersionsDocumentId(null); setForm(emptyForm); setModal('create'); return; } window.location.assign('/work-requests?create=1'); }
  function submitCreate(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const title = form.title.trim(); if (!title) return; if (form.attachments.some((item) => !item.documentCodeId)) { toast.error('Choose a document code for every selected file.'); return; } createMutation.mutate({ ...form, title, notes: form.notes?.trim() }); }
  function submitEdit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!selected || !form.title.trim()) return; updateMutation.mutate({ id: selected.id, title: form.title.trim(), priority: form.priority, notes: form.notes?.trim() || null }); }

  if (modalOnly) return modal === 'create' ? <WorkRequestForm form={form} loading={optionsLoading} title="Create Work Request" bids={bidsQuery.data?.items ?? []} projects={projectsQuery.data?.items ?? []} codes={(documentCodesQuery.data ?? []).filter((code) => code.isActive)} onClose={close} onCodeChange={(index, documentCodeId) => setForm((current) => ({ ...current, attachments: current.attachments.map((item, itemIndex) => itemIndex === index ? { ...item, documentCodeId } : item) }))} onFieldChange={setField} onFiles={setFiles} onSubmit={submitCreate} saving={createMutation.isPending} /> : null;

  return <div className={embedded ? 'work-requests-page work-requests-page--embedded' : 'page-stack work-requests-page'}>{!embedded ? <section className="page-heading work-requests-page__heading"><div><p>Execution</p><h1>Work Requests</h1></div><button onClick={openCreate} type="button">Create Work Request</button></section> : null}<section className="dash-panel division-panel work-requests-panel"><div className="dash-section-title"><strong>{embedded ? 'Work Requests' : 'All Work Requests'}</strong><span>{requestsQuery.isLoading ? 'Loading work requests' : `${requests.length} work request records`}</span></div><div className="division-table"><div className="division-grid division-grid--head"><span>Title</span><span>Priority</span><span>State</span><span>Created</span><span>Actions</span></div>{requestsQuery.isLoading ? <div className="division-empty">Loading work requests...</div> : null}{requestsQuery.isError ? <div className="division-empty">Unable to load work requests.</div> : null}{!requestsQuery.isLoading && !requestsQuery.isError && !requests.length ? <div className="division-empty">No work requests available. Create the first one to get started.</div> : null}{requests.map((request) => <div className="division-grid" key={request.id}><span><strong>{request.title}</strong>{typeof request.notes === 'string' && request.notes ? <small>{request.notes}</small> : null}</span><span>{request.priority}</span><span>{request.currentState || '—'}</span><span>{formatDate(request.createdAt)}</span><span className="division-actions"><button onClick={() => { setSelected(request); setModal('edit'); }} type="button">Edit</button><button onClick={() => { setSelected(request); setModal('details'); }} type="button">Details</button></span></div>)}</div></section>{modal === 'create' ? <WorkRequestForm form={form} loading={optionsLoading} title="Create Work Request" bids={bidsQuery.data?.items ?? []} projects={projectsQuery.data?.items ?? []} codes={(documentCodesQuery.data ?? []).filter((code) => code.isActive)} onClose={close} onCodeChange={(index, documentCodeId) => setForm((current) => ({ ...current, attachments: current.attachments.map((item, itemIndex) => itemIndex === index ? { ...item, documentCodeId } : item) }))} onFieldChange={setField} onFiles={setFiles} onSubmit={submitCreate} saving={createMutation.isPending} /> : null}{modal === 'edit' ? <WorkRequestForm form={form} loading={detailQuery.isLoading} title="Update Work Request" bids={[]} projects={[]} codes={[]} onClose={close} onCodeChange={() => undefined} onFieldChange={setField} onFiles={() => undefined} onSubmit={submitEdit} saving={updateMutation.isPending} editing /> : null}{modal === 'details' && selected ? <DetailsModal actions={actionsQuery.data} documents={documents} events={eventsQuery.data} loading={detailQuery.isLoading || documentsQuery.isLoading || eventsQuery.isLoading || actionsQuery.isLoading} onClose={close} onVersions={(documentId) => setVersionsDocumentId(documentId)} request={detailQuery.data ?? selected} versions={versionsQuery.data} versionsDocumentId={versionsDocumentId} versionsLoading={versionsQuery.isLoading} /> : null}</div>;
}

function WorkRequestForm({ title, form, bids, projects, codes, loading, saving, editing = false, onFieldChange, onFiles, onCodeChange, onSubmit, onClose }: { title: string; form: FormValues; bids: Array<{ id: string; name: string; biddingNumber: string }>; projects: Array<{ id: string; name: string }>; codes: Array<{ id: string; name: string; code: string }>; loading: boolean; saving: boolean; editing?: boolean; onFieldChange: <K extends keyof Omit<FormValues, 'attachments'>>(field: K, value: FormValues[K]) => void; onFiles: (action: { type: 'add'; files: File[] } | { type: 'remove'; index: number }) => void; onCodeChange: (index: number, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <div className="division-modal-backdrop"><section aria-modal="true" className={!editing ? 'division-modal division-modal--wide' : 'division-modal'} role="dialog"><div className="division-modal__head"><div><strong>{title}</strong><span>{editing ? 'Update work request information.' : 'Capture request details and attachments.'}</span></div><button aria-label="Close" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><div className="division-form__section"><h3>Request Details</h3><div className="division-form__grid"><label><span>Title</span><input autoFocus disabled={loading} onChange={(event) => onFieldChange('title', event.target.value)} required value={form.title} /></label><label><span>Priority</span><select disabled={loading} onChange={(event) => onFieldChange('priority', event.target.value as WorkRequestPriority)} value={form.priority}>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>{!editing ? <><label><span>Bid <em>Optional</em></span><select disabled={loading} onChange={(event) => onFieldChange('bidId', event.target.value)} value={form.bidId ?? ''}><option value="">No bid selected</option>{bids.map((bid) => <option key={bid.id} value={bid.id}>{bid.biddingNumber} — {bid.name}</option>)}</select></label><label><span>Project <em>Optional</em></span><select disabled={loading} onChange={(event) => onFieldChange('projectId', event.target.value)} value={form.projectId ?? ''}><option value="">No project selected</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label></> : null}</div></div><label className="division-form__full"><span>Notes <em>Optional</em></span><textarea disabled={loading} onChange={(event) => onFieldChange('notes', event.target.value)} rows={3} value={form.notes ?? ''} /></label>{!editing ? <AttachmentUpload attachments={form.attachments} codes={codes} disabled={loading || saving} onAdd={(files) => onFiles({ type: 'add', files })} onDocumentCodeChange={onCodeChange} onRemove={(index) => onFiles({ type: 'remove', index })} /> : null}<div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={loading || saving} type="submit">{saving ? 'Saving...' : editing ? 'Update Work Request' : 'Create Work Request'}</button></div></form></section></div>;
}

function DetailsModal({ request, documents, events, actions, versionsDocumentId, versions, loading, versionsLoading, onVersions, onClose }: { request: WorkRequest; documents: Array<Record<string, unknown>>; events: unknown; actions: unknown; versionsDocumentId: string | null; versions: unknown; loading: boolean; versionsLoading: boolean; onVersions: (id: string) => void; onClose: () => void }) {
  return <div className="division-modal-backdrop"><section aria-modal="true" className="division-modal role-modal" role="dialog"><div className="division-modal__head"><div><strong>{request.title}</strong><span>{request.currentState || 'Work request details'}</span></div><button onClick={onClose} type="button">X</button></div><div className="division-form">{loading ? <p>Loading work request details...</p> : <><p><strong>Priority:</strong> {request.priority}</p><p><strong>Notes:</strong> {typeof request.notes === 'string' && request.notes ? request.notes : '—'}</p><strong>Documents</strong>{!documents.length ? <p>No documents are attached.</p> : documents.map((document, index) => { const id = typeof document.id === 'string' ? document.id : ''; return <div className="bid-document-row" key={id || index}><strong>{documentName(document, index)}</strong>{id ? <button onClick={() => onVersions(id)} type="button">Versions</button> : null}</div>; })}{versionsDocumentId ? <><strong>Document versions</strong>{versionsLoading ? <p>Loading versions...</p> : <JsonValue value={versions} />}</> : null}<strong>Events</strong><JsonValue value={events} /><strong>Available actions</strong><JsonValue value={actions} /></>}<div className="division-form__actions"><button onClick={onClose} type="button">Done</button></div></div></section></div>;
}

function JsonValue({ value }: { value: unknown }) { return <pre className="work-request-json">{JSON.stringify(value ?? [], null, 2)}</pre>; }
function toArray(value: unknown): Array<Record<string, unknown>> { if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object'); if (value && typeof value === 'object') { const candidate = (value as Record<string, unknown>).items ?? (value as Record<string, unknown>).documents; return Array.isArray(candidate) ? candidate.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : []; } return []; }
function getReferenceId(value: WorkRequest['bidId']): string { if (typeof value === 'string') return value; if (value && typeof value === 'object') { const id = value.id; return typeof id === 'string' ? id : ''; } return ''; }
function normalizePriority(value: string): WorkRequestPriority { return priorities.includes(value as WorkRequestPriority) ? value as WorkRequestPriority : 'Low'; }
function documentName(document: Record<string, unknown>, index: number) { return typeof document.originalFileName === 'string' ? document.originalFileName : typeof document.name === 'string' ? document.name : `Document ${index + 1}`; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(); }
