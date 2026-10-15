import { FileText } from 'lucide-react';
import type { ApiRecord } from './documentData';
import { documentId, documentLabel, previewUrl, versionLabel } from './documentData';

type WorkRequestDocumentPreviewProps = {
  documents: ApiRecord[];
  selectedDocumentId: string | null;
  onDocumentChange: (id: string) => void;
  versions: ApiRecord[];
  versionsLoading: boolean;
};

export function WorkRequestDocumentPreview({ documents, selectedDocumentId, onDocumentChange, versions, versionsLoading }: WorkRequestDocumentPreviewProps) {
  const selectedDocument = documents.find((document) => documentId(document) === selectedDocumentId) ?? null;
  const latestVersion = versions[0] ?? null;
  const revision = versionLabel(latestVersion);
  const url = previewUrl(latestVersion) || previewUrl(selectedDocument);

  return <section className="work-request-preview-card">
    <header className="work-request-preview-card__toolbar">
      <div><span>Document Preview</span>{documents.length > 1 ? <select aria-label="Select document" onChange={(event) => onDocumentChange(event.target.value)} value={selectedDocumentId ?? ''}>{documents.map((document) => { const id = documentId(document); return id ? <option key={id} value={id}>{documentLabel(document)}</option> : null; })}</select> : null}</div>
      {revision ? <em>{revision}</em> : null}
    </header>
    {!documents.length ? <div className="work-request-preview-card__empty"><FileText size={43} /><strong>No uploaded document</strong><p>Upload a workflow document to preview it here.</p></div> : <div className="work-request-preview-card__body">
      <div className="work-request-preview-card__documents">{documents.map((document) => { const id = documentId(document); return id ? <button className={id === selectedDocumentId ? 'is-selected' : ''} key={id} onClick={() => onDocumentChange(id)} type="button"><FileText size={15} /><span>{documentLabel(document)}</span></button> : null; })}</div>
      {url ? <iframe className="work-request-preview-card__frame" sandbox="allow-same-origin" src={url} title={documentLabel(selectedDocument!)} /> : <div className="work-request-preview-card__empty"><FileText size={43} /><strong>{documentLabel(selectedDocument!)}</strong><p>{versionsLoading ? 'Loading document revisions…' : 'A browser preview is unavailable for this document.'}</p></div>}
    </div>}
  </section>;
}
