import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { downloadDocumentVersion, downloadWorkRequestDocuments, previewDocumentVersion } from '@/services/workRequestService';
import type { ApiRecord } from './documentData';
import { documentId, documentLabel, documentMimeType, documentVersionId, versionLabel } from './documentData';

type Props = { workRequestId: string; documents: ApiRecord[]; selectedDocumentId: string | null; onDocumentChange: (id: string) => void; onAdd: () => void; versions: ApiRecord[]; versionsLoading: boolean; error?: boolean };

export function WorkRequestDocumentPreview({ workRequestId, documents, selectedDocumentId, onDocumentChange, onAdd, versions, versionsLoading, error }: Props) {
  const [selectedForDownload, setSelectedForDownload] = useState<string[]>([]);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const selectedIndex = Math.max(0, documents.findIndex((document) => documentId(document) === selectedDocumentId));
  const selectedDocument = documents[selectedIndex] ?? null;
  const currentVersion = versions[0] ?? selectedDocument;
  const versionId = documentVersionId(currentVersion) ?? documentVersionId(selectedDocument);
  const label = documentLabel(selectedDocument);
  const mimeType = documentMimeType(currentVersion) || documentMimeType(selectedDocument);
  const previewKind = previewType(label, mimeType);
  const previewQuery = useQuery({ queryKey: ['document-version', versionId, 'preview'], queryFn: () => previewDocumentVersion(versionId!), enabled: Boolean(versionId) && previewKind !== 'unsupported' });
  const versionByDocumentId = useMemo(() => new Map(documents.flatMap((document) => { const id = documentId(document); const currentVersionId = documentVersionId(document); return id && currentVersionId ? [[id, currentVersionId] as const] : []; })), [documents]);
  const availableSelectionIds = useMemo(() => [...versionByDocumentId.keys()], [versionByDocumentId]);
  useEffect(() => setSelectedForDownload((ids) => { const next = ids.filter((id) => versionByDocumentId.has(id)); return next.length === ids.length ? ids : next; }), [versionByDocumentId]);
  useEffect(() => {
    const nextUrl = previewQuery.data ? URL.createObjectURL(previewQuery.data.blob) : null;
    setObjectUrl(nextUrl);
    return () => { if (nextUrl) URL.revokeObjectURL(nextUrl); };
  }, [previewQuery.data]);

  const singleDownload = useMutation({ mutationFn: () => downloadDocumentVersion(versionId!), onSuccess: (response) => triggerDownload(response.blob, response.filename ?? label), onError: () => toast.error('Unable to download this document. Please try again.') });
  const bulkDownload = useMutation({ mutationFn: (documentIds: string[]) => downloadWorkRequestDocuments(workRequestId, documentIds.map((id) => versionByDocumentId.get(id)).filter((id): id is string => Boolean(id))), onSuccess: (response) => triggerDownload(response.blob, response.filename ?? 'work-request-documents.zip'), onError: () => toast.error('Unable to create the document ZIP download. Please try again.') });
  const toggle = (id: string) => setSelectedForDownload((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  const selectAt = (index: number) => { const id = documentId(documents[index]); if (id) onDocumentChange(id); };
  const busy = singleDownload.isPending || bulkDownload.isPending;
  const revision = versionLabel(currentVersion);

  return <section className="work-request-preview-card">
    <header className="work-request-preview-card__toolbar"><span>Document Preview</span><button className="work-request-documents__add" onClick={onAdd} type="button">Add Document</button>{documents.length ? <div className="work-request-preview-card__controls"><select aria-label="Select document" onChange={(event) => onDocumentChange(event.target.value)} value={selectedDocumentId ?? ''}>{documents.map((document) => { const id = documentId(document); return id ? <option key={id} value={id}>{documentLabel(document)}</option> : null; })}</select><small>{selectedIndex + 1} / {documents.length}</small><button aria-label="Previous document" disabled={selectedIndex === 0} onClick={() => selectAt(selectedIndex - 1)} type="button">←</button><button aria-label="Next document" disabled={selectedIndex === documents.length - 1} onClick={() => selectAt(selectedIndex + 1)} type="button">→</button>{revision ? <em>{revision}</em> : null}{versionId ? <button aria-label={`Download ${label}`} className="work-request-preview-card__download" disabled={busy} onClick={() => singleDownload.mutate()} type="button"><Download size={14} /><b>{singleDownload.isPending ? 'Downloading…' : 'Download'}</b></button> : null}</div> : null}</header>
    {documents.length > 1 ? <><div className="work-request-preview-card__download-toolbar"><span>{selectedForDownload.length} selected</span><button disabled={busy || !availableSelectionIds.length || selectedForDownload.length === availableSelectionIds.length} onClick={() => setSelectedForDownload(availableSelectionIds)} type="button">Select All</button><button disabled={busy || !selectedForDownload.length} onClick={() => setSelectedForDownload([])} type="button">Clear Selection</button><button disabled={busy || !selectedForDownload.length} onClick={() => bulkDownload.mutate(selectedForDownload)} type="button">{bulkDownload.isPending ? 'Preparing ZIP…' : 'Download Selected'}</button><button disabled={busy || !availableSelectionIds.length} onClick={() => bulkDownload.mutate([])} type="button">Download All</button></div><div aria-label="Documents available for download" className="work-request-preview-card__document-list">{documents.map((document) => { const id = documentId(document); const selectable = Boolean(id && versionByDocumentId.has(id)); return <label key={id ?? documentLabel(document)}><input checked={Boolean(id && selectedForDownload.includes(id))} disabled={!selectable || busy} onChange={() => id && toggle(id)} type="checkbox" /><span>{documentLabel(document)}</span>{!selectable ? <small>Version unavailable</small> : null}</label>; })}</div></> : null}
    {error ? <EmptyPreview title="Documents unavailable" copy="Documents could not be loaded." /> : !documents.length ? <EmptyPreview title="No documents available" copy="Upload a workflow document to preview it here." /> : versionsLoading ? <EmptyPreview title={label} copy="Loading document revision…" /> : !versionId ? <UnsupportedPreview label={label} mimeType={mimeType} copy="No document version is available for preview or download." /> : previewKind === 'pdf' && objectUrl ? <iframe className="work-request-preview-card__frame" src={objectUrl} title={label} /> : previewKind === 'image' && objectUrl ? <div className="work-request-preview-card__image"><img alt={label} src={objectUrl} /></div> : previewQuery.isLoading ? <EmptyPreview title={label} copy="Loading preview…" /> : previewQuery.isError ? <UnsupportedPreview label={label} mimeType={mimeType} copy="Preview unavailable. You can still download this file." /> : <UnsupportedPreview label={label} mimeType={mimeType} copy="This file type cannot be previewed in the browser. Use Download to open it locally." />}
  </section>;
}

function previewType(fileName: string, mimeType: string | null) { const extension = fileName.split('.').pop()?.toLowerCase(); if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf'; if (mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'].includes(extension ?? '')) return 'image'; return 'unsupported'; }
function triggerDownload(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = filename; window.document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0); }
function UnsupportedPreview({ label, mimeType, copy }: { label: string; mimeType: string | null; copy: string }) { return <div className="work-request-preview-card__empty"><ImageIcon size={43} /><strong>{label}</strong><p>{mimeType ? `${mimeType}. ` : ''}{copy}</p></div>; }
function EmptyPreview({ title, copy }: { title: string; copy: string }) { return <div className="work-request-preview-card__empty"><FileText size={43} /><strong>{title}</strong><p>{copy}</p></div>; }
