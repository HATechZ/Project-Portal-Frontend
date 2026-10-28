import { FileText } from 'lucide-react';
import type { ApiRecord } from './documentData';
import { documentId, documentLabel, previewUrl, versionLabel } from './documentData';

type WorkRequestDocumentPreviewProps = {
  documents: ApiRecord[];
  selectedDocumentId: string | null;
  onDocumentChange: (id: string) => void;
  onAdd: () => void;
  versions: ApiRecord[];
  versionsLoading: boolean;
  error?: boolean;
};

export function WorkRequestDocumentPreview({ documents, selectedDocumentId, onDocumentChange, onAdd, versions, versionsLoading, error }: WorkRequestDocumentPreviewProps) {
  const selectedIndex = Math.max(0, documents.findIndex((document) => documentId(document) === selectedDocumentId));
  const selectedDocument = documents[selectedIndex] ?? null;
  const revision = versionLabel(versions[0]);
  const url = previewUrl(versions[0]) || previewUrl(selectedDocument);
  const selectDocumentAt = (index: number) => {
    const id = documentId(documents[index]);
    if (id) onDocumentChange(id);
  };

  return <section className="work-request-preview-card">
    <header className="work-request-preview-card__toolbar">
      <span>Document Preview</span>
      <button className="work-request-documents__add" onClick={onAdd} type="button">Add Document</button>
      {documents.length ? <div className="work-request-preview-card__controls">
        <select aria-label="Select document" onChange={(event) => onDocumentChange(event.target.value)} value={selectedDocumentId ?? ''}>
          {documents.map((document) => {
            const id = documentId(document);
            return id ? <option key={id} value={id}>{documentLabel(document)}</option> : null;
          })}
        </select>
        <small>{selectedIndex + 1} / {documents.length}</small>
        <button aria-label="Previous document" disabled={selectedIndex === 0} onClick={() => selectDocumentAt(selectedIndex - 1)} type="button">←</button>
        <button aria-label="Next document" disabled={selectedIndex === documents.length - 1} onClick={() => selectDocumentAt(selectedIndex + 1)} type="button">→</button>
        {revision ? <em>{revision}</em> : null}
      </div> : null}
    </header>
    {error
      ? <EmptyPreview title="Documents unavailable" copy="Documents could not be loaded." />
      : !documents.length
        ? <EmptyPreview title="No documents available" copy="Upload a workflow document to preview it here." />
        : url
          ? <iframe className="work-request-preview-card__frame" sandbox="allow-same-origin" src={url} title={documentLabel(selectedDocument)} />
          : <EmptyPreview title={documentLabel(selectedDocument)} copy={versionsLoading ? 'Loading document revisions…' : 'A browser preview is unavailable for this document.'} />}
  </section>;
}

function EmptyPreview({ title, copy }: { title: string; copy: string }) {
  return <div className="work-request-preview-card__empty"><FileText size={43} /><strong>{title}</strong><p>{copy}</p></div>;
}
