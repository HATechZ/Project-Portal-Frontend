import { apiClient } from '@/services/apiClient';

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
  | 'RESPOND_WORKFLOW_INFO';

export type WorkflowTargetKind =
  | 'division'
  | 'team'
  | 'member'
  | 'submit'
  | 'workflow'
  | 'info-request'
  | 'info-response';

export type AvailableWorkflowAction = {
  code: WorkflowActionCode;
  label: string;
  targetKind: WorkflowTargetKind;
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

export type CreateWorkRequestInput = {
  parentType: 'BID' | 'PROJECT';
  bidId?: string;
  projectId?: string;
  title: string;
  priority: WorkRequestPriority;
  notes?: string;
  originatingDivisionId: string;
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
  return apiClient<ApiResponse<WorkRequestList>>('/work-requests?page=1&limit=100').then((response) => response.data);
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
  return apiClient<ApiResponse<AvailableWorkflowAction[]>>(`${requestPath(id)}/available-actions`).then((response) => response.data);
}

function assignmentHeaders(requestId: string) {
  return { 'x-request-id': requestId };
}

export function assignWorkRequestDivision(id: string, payload: AssignWorkRequestDivisionPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestAssignmentCommandResult>>(`${requestPath(id)}/assignments/division`, {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function assignWorkRequestTeam(id: string, payload: AssignWorkRequestTeamPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestAssignmentCommandResult>>(`${requestPath(id)}/assignments/team`, {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function assignWorkRequestMember(id: string, payload: AssignWorkRequestMemberPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestAssignmentCommandResult>>(`${requestPath(id)}/assignments/member`, {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function submitWorkRequest(id: string, payload: WorkRequestWorkflowNotePayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestWorkflowCommandResult>>(requestPath(id) + '/submit', {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function applyWorkRequestWorkflowAction(id: string, payload: WorkRequestWorkflowActionPayload, requestId: string) {
  return apiClient<ApiResponse<WorkRequestWorkflowCommandResult>>(requestPath(id) + '/actions', {
    method: 'POST',
    headers: assignmentHeaders(requestId),
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}
