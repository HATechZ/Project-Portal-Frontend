import { Eye, FileText, Plus } from 'lucide-react';
import { documentId, documentLabel, documentLastUpdatedAt, stringValue, type ApiRecord } from '@/features/workRequests/documentData';
import { formatDateTime } from '@/features/workRequests/workflowPresentation';

export function WorkRequestDocuments({ documents, onAdd, onView }: {
  documents: ApiRecord[];
  onAdd: () => void;
  onView: (documentId: string) => void;
}) {
  return <section className="work-request-panel work-request-documents">
    <header className="work-request-panel__header">
      <div><h2>Documents</h2><p>Supporting files and their document details.</p></div>
      <button className="work-request-documents__add" onClick={onAdd} type="button"><Plus aria-hidden="true" size={15} />Add Document</button>
    </header>
    {documents.length ? <div className="attachment-table-wrap work-request-documents__table"><table className="attachment-table attachment-table--work-request"><thead><tr><th>File Name</th><th>Description</th><th>Document Code</th><th>Ship. No</th><th>Last Update</th><th>Action</th></tr></thead><tbody>{documents.map((document) => {
      const id = documentId(document);
      const description = stringValue(document, ['description']) ?? '—';
      const code = documentCodeLabel(document);
      const shipmentNumber = stringValue(document, ['shipmentNumber']) ?? '—';
      const lastUpdatedAt = documentLastUpdatedAt(document);
      return <tr key={id ?? `${documentLabel(document)}-${lastUpdatedAt ?? ''}`}>
        <td><strong><FileText aria-hidden="true" size={15} />{documentLabel(document)}</strong></td>
        <td>{description}</td><td>{code}</td><td>{shipmentNumber}</td><td>{formatDateTime(lastUpdatedAt)}</td>
        <td>{id ? <button aria-label={`View ${documentLabel(document)}`} className="work-request-documents__view" onClick={() => onView(id)} title="View document" type="button"><Eye aria-hidden="true" size={16} /></button> : '—'}</td>
      </tr>;
    })}</tbody></table></div> : <p className="work-request-documents__empty">No documents have been added yet.</p>}
  </section>;
}

function documentCodeLabel(document: ApiRecord) {
  const direct = stringValue(document, ['documentCode', 'code']);
  if (direct) return direct;
  const value = document.documentCode;
  if (!isRecord(value)) return '—';
  return stringValue(value, ['code', 'name']) ?? '—';
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
