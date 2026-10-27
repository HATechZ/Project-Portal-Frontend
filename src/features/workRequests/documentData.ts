export type ApiRecord = Record<string, unknown>;

export function recordList(value: unknown, collectionKeys: string[]) {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of collectionKeys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }
  return [];
}

export function stringValue(record: ApiRecord | null | undefined, keys: string[]) {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return null;
}

export function documentId(document: ApiRecord) {
  return stringValue(document, ['id', 'documentId']);
}

export function documentLabel(document: ApiRecord) {
  return stringValue(document, ['originalFileName', 'generatedFileName', 'name', 'fileName', 'documentCode']) || 'Untitled document';
}

/** The server owns this timestamp; legacy projections may nest it in latestVersion. */
export function documentLastUpdatedAt(document: ApiRecord) {
  const direct = stringValue(document, ['lastUpdatedAt']);
  if (direct) return direct;
  return isRecord(document.latestVersion) ? stringValue(document.latestVersion, ['uploadedAt']) : null;
}

export function versionLabel(version: ApiRecord | null | undefined) {
  const value = stringValue(version, ['revisionCode', 'revision', 'version', 'versionNumber', 'code']);
  return value ? `REV ${value}` : null;
}

export function versionTimestamp(version: ApiRecord | null | undefined) {
  return stringValue(version, ['uploadedAt', 'createdAt', 'updatedAt']);
}

export function versionActor(version: ApiRecord | null | undefined) {
  if (!version) return null;
  const actor = version.uploadedBy ?? version.createdBy;
  if (isRecord(actor)) return stringValue(actor, ['label', 'name', 'email']);
  return null;
}

export function previewUrl(record: ApiRecord | null | undefined) {
  return stringValue(record, ['previewUrl', 'downloadUrl', 'fileUrl', 'url']);
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
