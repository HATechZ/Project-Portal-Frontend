import { apiClient, apiClientBlob } from '@/services/apiClient';

export const WORK_REQUEST_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type WorkRequestPriority = (typeof WORK_REQUEST_PRIORITIES)[number];

export type WorkflowActionCode =
  | 'WR_ASSIGN_DIVISION'
  | 'WR_ASSIGN_TEAM'
  | 'WR_ASSIGN_MEMBER'
  | 'WR_SUBMIT'
  | 'WR_CHECKING_APPROVE'
  | 'WR_APPROVAL_APPROVE'
  | 'WR_REQUEST_REVISION'
  | 'WR_FINAL_RELEASE'
  | 'REQUEST_WORKFLOW_INFO'
  | 'RESPOND_WORKFLOW_INFO'
  | 'RESPOND_TO_INFO_REQUEST';

export type RouteWorkflowActionCode =
  | 'DEFINE_TEAM_SEQUENCE'
  | 'DEFINE_MEMBER_SEQUENCE'
  | 'APPEND_MEMBER_STEP'
  | 'SUBMIT_MEMBER_STEP'
  | 'COMPLETE_TEAM_STEP'
  | 'FORWARD_ROUTE'
  | 'SUBMIT_CLIENT_PACKAGE'
  | 'REQUEST_WORKFLOW_INFO';

export type WorkflowTargetKind =
  | 'division'
  | 'team'
  | 'member'
  | 'submit'
  | 'workflow'
  | 'info-request'
  | 'info-response';

export type AvailableWorkflowAction = {
  code: string;
  label: string;
  targetKind: string;
};

export type WorkRequestAssignment = {
  id: string;
  level: string;
  divisionId: string | null;
  teamId: string | null;
  memberId: string | null;
  assignee: { id: string; label: string } | null;
  assignedAt: string;
  unassignedAt: string | null;
  replacedAt: string | null;
  note: string | null;
  assignedBy: { id: string; label: string };
  responsibleRecipients?: Array<{ actorId: string; memberId: string; label: string; displayName?: string }>;
};

export type WorkRequestEvent = {
  id: string;
  action: string;
  priorState: string | null;
  resultingState: string;
  responsibilityLevel: string | null;
  note: string | null;
  occurredAt: string;
  performedBy: { id: string; label: string };
};

export type WorkRequestEventsResponse = {
  items: WorkRequestEvent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type WorkRequestDocument = {
  id: string;
  documentCodeId?: string;
  originalFileName?: string;
  generatedFileName?: string;
  name?: string;
  [key: string]: unknown;
};

export type WorkRequest = {
  id: string;
  bidId: string | Record<string, unknown> | null;
  projectId: string | Record<string, unknown> | null;
  shipmentNumber?: string | null;
  title: string;
  priority: WorkRequestPriority | string;
  notes: string | Record<string, unknown> | null;
  creator: Record<string, unknown> | null;
  currentState: string;
  documents: WorkRequestDocument[];
  availableActions: AvailableWorkflowAction[];
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkRequestDocumentInput = {
  documentCodeId: string;
  file: File;
  description?: string;
  shipmentNumber?: string;
};

export type WorkRequestRouteStep = {
  id: string;
  ordinal: number;
  kind: string;
  divisionId: string | null;
  division?: { id?: string; name?: string | null } | null;
  divisionName?: string | null;
  activatedAt: string | null;
  completedAt: string | null;
  /** Server-owned lifecycle state for this route occurrence. */
  status?: string | null;
};

export type WorkRequestRouteProjection = {
  routeVersionId: string | null;
  routeStepId: string | null;
  updatedAt: string;
  divisionCycleId: string | null;
  teamStepId?: string | null;
  memberStepId?: string | null;
};

export type WorkRequestRouteEvent = {
  id: string;
  action: string;
  occurredAt: string;
  routeStepId: string | null;
  divisionCycleId: string | null;
  teamStepId: string | null;
  memberStepId: string | null;
};

export type WorkRequestRouteHistory = {
  projection: WorkRequestRouteProjection | null;
  steps: WorkRequestRouteStep[];
  events?: WorkRequestRouteEvent[];
};

export type WorkRequestInternalCycle = {
  id: string;
  routeStep: { divisionId: string | null };
  teamSteps: Array<{
    id: string;
    team: { id: string; name: string; leadMemberId: string | null };
    memberSteps: Array<{ id: string; memberId: string; member: { id: string; name: string } }>;
  }>;
  availableActions: string[];
};

export type WorkRequestRouteRecipient = { id: string; label?: string; name?: string; email?: string };
/** Backend-owned recipient target. Its identifier is returned by the recipients endpoint and is sent back unchanged. */
/** Backend-authorized Request Info target. `actorId` is posted back unchanged as `targetActorId`. */
export type WorkRequestInfoRequestRecipient = { actorId: string; actorProfileId?: string; label?: string; displayName?: string; memberId?: string | null; email?: string | null; divisionId?: string | null; divisionName?: string | null; designationId?: string | null; designationName?: string | null; teamIds?: string[]; teamNames?: string[]; relationshipContexts?: unknown[]; [key: string]: unknown };
export type WorkRequestInfoRecipientStatus = {
  activeContacts: number;
  contactsWithActiveDefaultProfile: number;
  unavailableContacts: Array<{ contactId: string; displayName: string; email?: string; context?: { name?: string }; [key: string]: unknown }>;
};
export type WorkRequestInfoActor = { actorId: string; type?: string; displayName?: string; name?: string; email?: string | null; [key: string]: unknown };
export type WorkRequestInfoAttachment = { documentVersionId: string; originalFileName?: string; fileName?: string; mimeType?: string; size?: number; [key: string]: unknown };
export type WorkRequestInfoRequest = {
  id: string; message: string; status: string; requestedAt: string;
  target: WorkRequestInfoActor; requester: WorkRequestInfoActor;
  attachments?: WorkRequestInfoAttachment[];
  responses?: Array<{ id: string; message: string; respondedAt: string; responder: WorkRequestInfoActor; attachments?: WorkRequestInfoAttachment[] }>;
};

export type CreateWorkRequestInput = {
  parentType: 'BID' | 'PROJECT';
  bidId?: string;
  projectId?: string;
  title: string;
  priority: WorkRequestPriority;
  notes?: string;
  originatingDivisionId: string;
  responsibleOriginatingDivisionLeadId?: string;
  intermediateDivisionIds: string[];
  documents: CreateWorkRequestDocumentInput[];
};

export type CreateWorkRequestDocumentResponse = {
  id: string;
  documentCodeId: string | null;
  documentCode: string | null;
  description: string | null;
  shipmentNumber: string | null;
  originalFileName: string;
  generatedFileName: string | null;
  mimeType: string;
  size: number;
  lastUpdatedAt: string;
};

export type WorkRequestDocumentUploadResponse = {
  documentId: string;
  owner: unknown;
  documentCode: string | null;
  originalFileName: string;
  description: string | null;
  shipmentNumber: string | null;
  lastUpdatedAt: string;
  latestVersion: unknown;
};

export type AvailableDocumentCode = {
  id: string;
  code: string;
  name: string;
  [key: string]: unknown;
};

export type CreateWorkRequestResponseData = {
  id: string;
  bidId: string | null;
  projectId: string | null;
  shipmentNumber: string | null;
  title: string;
  priority: WorkRequestPriority;
  notes: string | null;
  creator: { id: string; label: string } | null;
  currentState: string;
  documents: CreateWorkRequestDocumentResponse[];
  availableActions: unknown[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateWorkRequestPayload = {
  title: string;
  priority: WorkRequestPriority;
  notes: string | null;
};

export type WorkRequestAssignmentCommand = {
  note?: string;
};

export type AssignWorkRequestDivisionPayload = WorkRequestAssignmentCommand & {
  divisionId: string;
};

export type AssignWorkRequestTeamPayload = WorkRequestAssignmentCommand & {
  teamId: string;
};

export type AssignWorkRequestMemberPayload = WorkRequestAssignmentCommand & {
  memberId: string;
};

export type WorkRequestAssignmentCommandResult = {
  id: string;
  level: string;
  divisionId: string | null;
  teamId: string | null;
  memberId: string | null;
  assignedAt: string;
  currentState: string;
};

export type WorkRequestWorkflowNotePayload = {
  note?: string;
};

export type WorkRequestWorkflowActionPayload = WorkRequestWorkflowNotePayload & {
  actionCode: Extract<WorkflowActionCode, 'WR_CHECKING_APPROVE' | 'WR_APPROVAL_APPROVE' | 'WR_REQUEST_REVISION' | 'WR_FINAL_RELEASE'>;
};

export type WorkRequestWorkflowCommandResult = {
  eventId: string;
  action: string;
  currentState: string;
  occurredAt: string;
};

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
export type ApiSuccessResponse<T> = { success: true; message: string; data: T; timestamp: string };
export type WorkRequestList = { items: WorkRequest[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };

const requestPath = (id: string) => `/work-requests/${encodeURIComponent(id)}`;

export function getWorkRequests() {
  return getWorkRequestsPage({ page: 1, limit: 100 });
}

export function getWorkRequestsPage({ page, limit }: { page: number; limit: number }) {
  return apiClient<ApiResponse<WorkRequestList>>(`/work-requests?page=${page}&limit=${limit}`).then((response) => response.data);
}

export function getWorkRequest(id: string) {
  return apiClient<ApiResponse<WorkRequest>>(requestPath(id)).then((response) => response.data);
}

export function createWorkRequest(input: CreateWorkRequestInput, requestId: string) {
  const formData = new FormData();
  if (input.parentType === 'BID' && input.bidId) formData.append('bidId', input.bidId);
  if (input.parentType === 'PROJECT' && input.projectId) formData.append('projectId', input.projectId);
  formData.append('title', input.title.trim());
  formData.append('priority', input.priority);
  const notes = input.notes?.trim();
  if (notes) formData.append('notes', notes);
  formData.append('originatingDivisionId', input.originatingDivisionId);
  if (input.responsibleOriginatingDivisionLeadId) formData.append('responsibleOriginatingDivisionLeadId', input.responsibleOriginatingDivisionLeadId);
  input.intermediateDivisionIds.forEach((divisionId) => formData.append('intermediateDivisionIds', divisionId));
  input.documents.forEach(({ documentCodeId, file, description, shipmentNumber }) => {
    formData.append('documentCodeIds', documentCodeId);
    formData.append('files', file);
    formData.append('descriptions', description?.trim() ?? '');
    formData.append('shipmentNumbers', shipmentNumber?.trim() ?? '');
  });

  return apiClient<ApiSuccessResponse<CreateWorkRequestResponseData>>('/work-requests', {
    method: 'POST',
    headers: { 'x-request-id': requestId },
    body: formData,
  });
}

export function updateWorkRequest(id: string, payload: UpdateWorkRequestPayload) {
  return apiClient<ApiResponse<WorkRequest>>(requestPath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function getWorkRequestDocuments(id: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/documents`).then((response) => response.data);
}

/** Context-aware selector. The backend enforces upload permission and route context. */
export function getWorkRequestAvailableDocumentCodes(id: string) {
  return apiClient<ApiResponse<AvailableDocumentCode[]>>(`${requestPath(id)}/documents/available-document-codes`).then((response) => response.data);
}

export function getWorkRequestCreationAvailableDocumentCodes(originatingDivisionId: string) {
  const params = new URLSearchParams({ originatingDivisionId });
  return apiClient<ApiResponse<AvailableDocumentCode[]>>(`/work-requests/creation/available-document-codes?${params.toString()}`).then((response) => response.data);
}

export function uploadWorkRequestDocuments(id: string, documents: CreateWorkRequestDocumentInput[], requestId: string) {
  const formData = new FormData();
  documents.forEach(({ file, documentCodeId, description, shipmentNumber }) => {
    formData.append('files', file);
    formData.append('documentCodeIds', documentCodeId);
    formData.append('descriptions', description?.trim() ?? '');
    formData.append('shipmentNumbers', shipmentNumber?.trim() ?? '');
  });

  return apiClient<ApiSuccessResponse<WorkRequestDocumentUploadResponse[]>>(`${requestPath(id)}/documents`, {
    method: 'POST',
    headers: { 'x-request-id': requestId },
    body: formData,
  });
}

export function getWorkRequestDocumentVersions(id: string, documentId: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/documents/${encodeURIComponent(documentId)}/versions`).then((response) => response.data);
}

export function getWorkRequestAssignments(id: string) {
  return apiClient<ApiResponse<WorkRequestAssignment[]>>(`${requestPath(id)}/assignments`).then((response) => response.data);
}

export function getWorkRequestEvents(id: string, page = 1, limit = 20) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiClient<ApiResponse<WorkRequestEventsResponse>>(`${requestPath(id)}/events?${query}`).then((response) => response.data);
}

export function getWorkRequestAvailableActions(id: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/available-actions`).then((response) => normalizeAvailableWorkflowActions(response.data));
}

export function previewDocumentVersion(versionId: string) {
  return apiClientBlob(`/document-versions/${encodeURIComponent(versionId)}/preview`);
}

export function downloadDocumentVersion(versionId: string) {
  return apiClientBlob(`/document-versions/${encodeURIComponent(versionId)}/download`);
}

export function downloadWorkRequestDocuments(id: string, documentVersionIds: string[]) {
  return apiClientBlob(`${requestPath(id)}/documents/download`, { method: 'POST', body: JSON.stringify({ documentVersionIds }) });
}

/** The backend owns workflow availability; this only normalizes its response envelope. */
function normalizeAvailableWorkflowActions(value: unknown): AvailableWorkflowAction[] {
  const records = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? (value as { availableActions?: unknown; actions?: unknown; items?: unknown; data?: unknown }).availableActions
        ?? (value as { actions?: unknown }).actions
        ?? (value as { items?: unknown }).items
        ?? (value as { data?: unknown }).data
        ?? []
      : [];

  if (!Array.isArray(records)) return [];
  return records.flatMap((item) => {
    if (typeof item === 'string' && item) return [{ code: item, label: workflowActionLabel(item), targetKind: '' }];
    if (!item || typeof item !== 'object') return [];
    const action = item as Partial<AvailableWorkflowAction> & { actionCode?: unknown; action?: unknown; displayName?: unknown; name?: unknown };
    const code = typeof action.code === 'string' && action.code
      ? action.code
      : typeof action.actionCode === 'string' && action.actionCode
        ? action.actionCode
        : typeof action.action === 'string' && action.action
          ? action.action
          : null;
    return code
      ? [{ code, label: typeof action.label === 'string' && action.label ? action.label : typeof action.displayName === 'string' && action.displayName ? action.displayName : typeof action.name === 'string' && action.name ? action.name : workflowActionLabel(code), targetKind: typeof action.targetKind === 'string' ? action.targetKind : '' }]
      : [];
  });
}

/** Display text only. Availability and authorization remain entirely backend-owned. */
function workflowActionLabel(code: string) {
  const labels: Record<string, string> = {
    DEFINE_TEAM_SEQUENCE: 'Define Team Sequence',
    REQUEST_WORKFLOW_INFO: 'Request Information',
  };
  return labels[code] ?? code;
}

export function getWorkRequestRoute(id: string) {
  return apiClient<ApiResponse<WorkRequestRouteHistory>>(`${requestPath(id)}/route`).then((response) => response.data);
}

export function getWorkRequestInternalHistory(id: string) {
  return apiClient<ApiResponse<WorkRequestRouteHistory>>(`${requestPath(id)}/internal-history`).then((response) => response.data);
}

export function getWorkRequestInternalCycle(id: string, cycleId: string) {
  return apiClient<ApiResponse<WorkRequestInternalCycle>>(`${requestPath(id)}/internal-cycles/${encodeURIComponent(cycleId)}`).then((response) => response.data);
}

export function defineWorkRequestTeamSequence(id: string, cycleId: string, teamIds: string[]) {
  return apiClient<ApiResponse<WorkRequestInternalCycle>>(`${requestPath(id)}/division-cycles/${encodeURIComponent(cycleId)}/team-sequence`, { method: 'POST', body: JSON.stringify({ teamIds }) }).then((response) => response.data);
}

export function defineWorkRequestMemberSequence(id: string, teamStepId: string, memberIds: string[]) {
  return apiClient<ApiResponse<WorkRequestInternalCycle>>(`${requestPath(id)}/team-steps/${encodeURIComponent(teamStepId)}/member-sequence`, { method: 'POST', body: JSON.stringify({ memberIds }) }).then((response) => response.data);
}

export function appendWorkRequestMemberStep(id: string, teamStepId: string, memberId: string) {
  return apiClient<ApiResponse<WorkRequestInternalCycle>>(`${requestPath(id)}/team-steps/${encodeURIComponent(teamStepId)}/member-steps`, { method: 'POST', body: JSON.stringify({ memberId }) }).then((response) => response.data);
}

export function submitWorkRequestMemberStep(id: string, memberStepId: string) {
  return apiClient<ApiResponse<WorkRequestInternalCycle>>(`${requestPath(id)}/member-steps/${encodeURIComponent(memberStepId)}/submit`, { method: 'POST' }).then((response) => response.data);
}

export function completeWorkRequestTeamStep(id: string, teamStepId: string) {
  return apiClient<ApiResponse<WorkRequestInternalCycle>>(`${requestPath(id)}/team-steps/${encodeURIComponent(teamStepId)}/complete`, { method: 'POST' }).then((response) => response.data);
}

export function forwardWorkRequestRoute(id: string, routeStepId: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/route-steps/${encodeURIComponent(routeStepId)}/forward`, { method: 'POST' }).then((response) => response.data);
}

export function submitWorkRequestClientPackage(id: string, documentVersionIds: string[]) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/client-submissions`, { method: 'POST', body: JSON.stringify({ documentVersionIds }) }).then((response) => response.data);
}

export function getWorkRequestCommunicationRecipients(id: string) {
  return apiClient<ApiResponse<WorkRequestRouteRecipient[]>>(`${requestPath(id)}/communication-recipients`).then((response) => response.data);
}

export function sendWorkRequestRouteMessage(id: string, recipientActorIds: string[], message: string, documentVersionIds?: string[]) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/conversations/messages`, { method: 'POST', body: JSON.stringify({ recipientActorIds, message, ...(documentVersionIds?.length ? { documentVersionIds } : {}) }) }).then((response) => response.data);
}

export function getWorkRequestInfoRequests(id: string) {
  return apiClient<ApiResponse<WorkRequestInfoRequest[]>>(`${requestPath(id)}/info-requests`).then((response) => response.data);
}

export function getWorkRequestInfoRequestRecipients(id: string) {
  return apiClient<ApiResponse<WorkRequestInfoRequestRecipient[]>>(`${requestPath(id)}/info-requests/recipients`).then((response) => response.data);
}

export function getWorkRequestInfoRecipientStatus(id: string) {
  return apiClient<ApiResponse<WorkRequestInfoRecipientStatus>>(`${requestPath(id)}/info-requests/recipients/status`).then((response) => response.data);
}

export function createWorkRequestInfoRequest(id: string, targetActorId: string, message: string, documentVersionIds: string[]) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/info-requests`, {
    method: 'POST',
    body: JSON.stringify({ targetActorId, message, ...(documentVersionIds.length ? { documentVersionIds } : {}) }),
  }).then((response) => response.data);
}

export function respondToWorkRequestInfo(id: string, infoRequestId: string, message: string, documentVersionIds?: string[]) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/info-requests/${encodeURIComponent(infoRequestId)}/respond`, { method: 'POST', body: JSON.stringify({ message, ...(documentVersionIds?.length ? { documentVersionIds } : {}) }) }).then((response) => response.data);
}

function assignmentHeaders(requestId: string) {
  return { 'x-request-id': requestId };
}

export function assignWorkRequestDivision(id: string, payload: AssignWorkRequestDivisionPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestAssignmentCommandResult>>(`${requestPath(id)}/assignments/division`, {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  });
}

export function assignWorkRequestTeam(id: string, payload: AssignWorkRequestTeamPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestAssignmentCommandResult>>(`${requestPath(id)}/assignments/team`, {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  });
}

export function assignWorkRequestMember(id: string, payload: AssignWorkRequestMemberPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestAssignmentCommandResult>>(`${requestPath(id)}/assignments/member`, {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  });
}

export function submitWorkRequest(id: string, payload: WorkRequestWorkflowNotePayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestWorkflowCommandResult>>(requestPath(id) + '/submit', {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  });
}

export function applyWorkRequestWorkflowAction(id: string, payload: WorkRequestWorkflowActionPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestWorkflowCommandResult>>(requestPath(id) + '/actions', {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  });
}
