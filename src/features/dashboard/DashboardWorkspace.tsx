import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ApiClientError, isApiNetworkError } from '@/services/apiClient';
import { TeamPage } from '@/pages/TeamPage';
import { BidsPanel } from '@/features/dashboard/BidsPanel';
import { ProjectsPanel } from '@/features/dashboard/ProjectsPanel';
import { WorkRequestsPage } from '@/pages/WorkRequestsPage';
import {
  createDivision,
  getDivisions,
  updateDivision,
  type Division,
  type DivisionPayload,
} from '@/services/divisionService';
import {
  createMember,
  getMembers,
  updateMember,
  type CreateMemberPayload,
  type Member,
  type UpdateMemberPayload,
} from '@/services/memberService';
import { getDesignations, type Designation } from '@/services/designationService';
import { getBids, type Bid } from '@/services/bidService';
import { getProjects, type Project } from '@/services/projectService';
import { getClients } from '@/services/clientService';
import { getTeams } from '@/services/teamService';
import { getWorkRequests, type WorkRequest } from '@/services/workRequestService';
import { getGeneralDocumentCodes } from '@/services/generalDocumentCodeService';
import { AttachmentUpload } from '@/components/ui/AttachmentUpload';
import { usePermissions } from '@/hooks/usePermissions';
import { createPendingAttachment, type PendingAttachment } from '@/components/ui/attachmentDraft';
import { dashboardMetricValue, hasDashboardOutage, retryFailedDashboardQueries } from './dashboardLoadState';
import { AlertCircle, ArrowRight, BadgeCheck, Building2, ClipboardList, Clock3, FileCheck2, FilePlus2, FolderKanban, FolderOpen, Upload, Users, UsersRound, type LucideIcon } from 'lucide-react';

const divisionsQueryKey = ['divisions'];
const membersQueryKey = ['members'];
const designationsQueryKey = ['designations'];

function isUnavailableError(error: unknown) {
  return isApiNetworkError(error) || (error instanceof ApiClientError && [502, 503, 504].includes(error.status));
}

const emptyDivisionForm: DivisionPayload = {
  name: '',
  abbr: '',
  divisionTypeId: '',
};

type MemberForm = CreateMemberPayload & { roleId: string; isActive: boolean };

const emptyMemberForm: MemberForm = {
  name: '', email: '', password: '', roleId: '', divisionId: '', designationId: '', phone: '', isActive: true,
};

type MetricState = { loading: boolean; failed: boolean; retry: () => void; detail?: string; network?: boolean };

function SectionError({ message, onRetry, detail }: { message: string; onRetry: () => void; detail?: string }) {
  return <div className="dash-load-error" role="status"><span>{message}{detail ? ` ${detail}` : ''}</span><button onClick={onRetry} type="button">Retry</button></div>;
}

function MetricsStrip({ bids, projects, workRequests, bidState, projectState, workRequestState, globalError, canViewBid, canViewProject, canViewWorkRequest, canViewDocument }: {
  bids: Bid[]; projects: Project[]; workRequests: WorkRequest[]; bidState: MetricState; projectState: MetricState; workRequestState: MetricState; globalError: boolean; canViewBid: boolean; canViewProject: boolean; canViewWorkRequest: boolean; canViewDocument: boolean;
}) {
  const linkedDocuments = projects.reduce((total, project) => total + project.fileCount, 0) + bids.reduce((total, bid) => total + bid.fileCount, 0);
  const metrics = [
    ...(canViewProject ? [{ label: 'Active engineering projects', value: projects.length, caption: 'Current project workspaces', icon: FolderKanban, tone: 'orange', state: projectState, error: 'Unable to load projects.' }] : []),
    ...(canViewBid ? [{ label: 'Active bids / proposals', value: bids.length, caption: 'Open bid workspaces', icon: FilePlus2, tone: 'green', state: bidState, error: 'Unable to load bids.' }] : []),
    ...(canViewWorkRequest ? [{ label: 'Pending reviews', value: workRequests.length, caption: 'Requests in the workflow', icon: Clock3, tone: 'blue', state: workRequestState, error: 'Unable to load work requests.' }] : []),
    ...(canViewDocument && (canViewBid || canViewProject) ? [{ label: 'Linked documents', value: linkedDocuments, caption: 'Documents in accessible workspaces', icon: FileCheck2, tone: 'rose', state: { loading: (canViewBid && bidState.loading) || (canViewProject && projectState.loading), failed: (canViewBid && bidState.failed) || (canViewProject && projectState.failed), retry: () => { if (bidState.failed) bidState.retry(); if (projectState.failed) projectState.retry(); } }, error: 'Unable to load linked documents.' }] : []),
  ];

  return (
    <section className="dash-metrics">
      {metrics.map((metric) => (
        <article className="dash-metric dash-metric--live" key={metric.label}>
          <div className={`dash-metric__icon dash-metric__icon--${metric.tone}`}><metric.icon size={18} /></div>
          <span>{metric.label}</span>
          <strong>{dashboardMetricValue(metric.value, metric.state.loading, metric.state.failed) ?? '—'}</strong>
          {metric.state.failed && !(globalError && 'network' in metric.state && metric.state.network) && (metric.label === 'Active engineering projects' || metric.label === 'Active bids / proposals') ? <SectionError detail={'detail' in metric.state ? metric.state.detail : undefined} message={metric.error} onRetry={metric.state.retry} /> : <small>{metric.caption}</small>}
        </article>
      ))}
    </section>
  );
}

function DashboardEmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <div className="dash-empty-state"><span className="dash-empty-state__icon"><Icon size={18} /></span><div><strong>{title}</strong><p>{description}</p></div></div>;
}

function QuickAccess({ bids, projects, loading, unavailable, globalError, onRetry, errorMessage, clientNames, viewAllPath }: { bids: Bid[]; projects: Project[]; loading: boolean; unavailable: boolean; globalError: boolean; onRetry: () => void; errorMessage: string; clientNames: Map<string, string>; viewAllPath: string }) {
  const navigate = useNavigate();
  const workspaces = [
    ...bids.map((bid) => ({ id: bid.id, name: bid.name, type: 'Bid' as const, client: clientNameFromBid(bid, clientNames), status: bid.status, updatedAt: bid.updatedAt })),
    ...projects.map((project) => ({ id: project.id, name: project.name, type: 'Project' as const, client: clientNames.get(project.clientId) ?? null, status: project.status, updatedAt: project.updatedAt })),
  ].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()).slice(0, 6);
  if (unavailable && !globalError) return <section className="dash-panel dash-workspace-panel"><div className="dash-panel-head"><div><FolderOpen size={17} /><strong>Quick Access Workspace Folders</strong></div></div><SectionError message={errorMessage} onRetry={onRetry} /></section>;
  if (!loading && !workspaces.length) return <section className="dash-panel dash-workspace-panel"><div className="dash-panel-head"><div><FolderOpen size={17} /><strong>Quick Access Workspace Folders</strong></div><Link className="dash-workspace-view-all" to={viewAllPath}>View all</Link></div><div className="dash-workspace-grid dash-workspace-grid--empty"><DashboardEmptyState description="Workspace folders will appear here once projects or bids are created." icon={FolderOpen} title="No workspace folders available yet." /></div></section>;
  return <section className="dash-panel dash-workspace-panel"><div className="dash-panel-head"><div><FolderOpen size={17} /><strong>Quick Access Workspace Folders</strong></div><Link className="dash-workspace-view-all" to={viewAllPath}>View all</Link></div><div className="dash-workspace-grid">{loading ? <p>{unavailable ? 'Workspaces are unavailable.' : 'Loading workspaces...'}</p> : workspaces.length ? workspaces.map((workspace) => { const path = `/${workspace.type === 'Bid' ? 'bids' : 'projects'}/${workspace.id}`; return <article aria-label={`Open ${workspace.name}`} key={`${workspace.type}-${workspace.id}`} onClick={() => navigate(path)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(path); } }} role="link" tabIndex={0}><div className={`dash-workspace-icon dash-workspace-icon--${workspace.type.toLowerCase()}`}><FolderOpen size={18} /></div><div className="dash-workspace-copy"><div className="dash-workspace-title"><strong title={workspace.name}>{workspace.name}</strong><em>{workspace.type}</em></div><small><span title={workspace.client ?? undefined}>Client: <b>{workspace.client ?? '—'}</b></span><span title={workspace.status || undefined}>STATUS: <b>{workspace.status || '—'}</b></span></small></div><ArrowRight size={17} /></article>; }) : <p>No project or bid workspaces are available yet.</p>}</div></section>;
}

function clientNameFromBid(bid: Bid, clientNames: Map<string, string>) {
  const embeddedClient = bid.client && typeof bid.client.name === 'string' ? bid.client.name : null;
  return embeddedClient ?? clientNames.get(bid.clientId) ?? null;
}

function QuickActions({ can, unavailable, referenceFailures, referenceDetail, onRetryReference, onBid, onProject, onWorkRequest, onUpload, onDivision, onMember, onTeam, onWorkspaces, onWorkRequests, onDocuments }: { can: (permission: string) => boolean; unavailable: boolean; referenceFailures: string[]; referenceDetail?: string; onRetryReference: () => void; onBid: () => void; onProject: () => void; onWorkRequest: () => void; onUpload: () => void; onDivision: () => void; onMember: () => void; onTeam: () => void; onWorkspaces: () => void; onWorkRequests: () => void; onDocuments: () => void }) {
  const actions = [
    { label: 'Create Bid', icon: FilePlus2, onClick: onBid, include: can('CREATE_BID') },
    { label: 'Projects / Bids', icon: FolderOpen, onClick: onWorkspaces, include: can('VIEW_BID') || can('VIEW_PROJECT') },
    { label: 'Create Project', icon: FolderKanban, onClick: onProject, include: can('CREATE_PROJECT') },
    { label: 'Create Work Request', icon: ClipboardList, onClick: onWorkRequest, include: can('CREATE_WORK_REQUEST') },
    { label: 'Work Requests', icon: ClipboardList, onClick: onWorkRequests, include: can('VIEW_WORK_REQUEST') },
    { label: 'Documents', icon: FileCheck2, onClick: onDocuments, include: can('VIEW_DOCUMENT') },
    { label: 'Upload Document', icon: Upload, onClick: onUpload, include: can('UPLOAD_DOCUMENT') },
    { label: 'Create Division', icon: Building2, onClick: onDivision, include: can('CREATE_DIVISION') },
    { label: 'Create Member', icon: Users, onClick: onMember, include: can('CREATE_MEMBER') },
    { label: 'Create Team', icon: UsersRound, onClick: onTeam, include: can('CREATE_TEAM') },
  ].filter((action) => action.include);
  return <section className="dash-panel dash-actions-panel"><div className="dash-panel-head"><div><BadgeCheck size={17} /><strong>Quick actions</strong></div></div><div className={`dash-actions-grid${actions.length % 2 ? ' dash-actions-grid--odd' : ''}`}>{actions.map((action) => <button disabled={(unavailable && !['Projects / Bids', 'Work Requests', 'Documents'].includes(action.label)) || (referenceFailures.length > 0 && ((action.label === 'Create Member' && referenceFailures.some((item) => ['designations', 'divisions', 'members'].includes(item))) || (action.label === 'Create Team' && referenceFailures.includes('divisions')) || (['Create Bid', 'Create Project'].includes(action.label) && referenceFailures.includes('clients')) || (action.label === 'Create Work Request' && referenceFailures.includes('divisions'))))} title={referenceFailures.length && !unavailable ? 'Required information could not be loaded.' : undefined} key={action.label} onClick={action.onClick} type="button"><span><action.icon size={17} /></span>{action.label}</button>)}</div>{referenceFailures.length && !unavailable ? <SectionError detail={referenceDetail} message={`Unable to load ${referenceFailures.join(', ')}.`} onRetry={onRetryReference} /> : null}</section>;
}

function UploadDocumentModal({ onClose }: { onClose: () => void }) {
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const codesQuery = useQuery({ queryKey: ['general-document-codes'], queryFn: getGeneralDocumentCodes });
  const codes = (codesQuery.data ?? []).filter((code) => code.isActive);
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal division-modal--wide" role="dialog"><div className="division-modal__head"><div><strong>Upload Document</strong><span>Select files and classify each attachment.</span></div><button aria-label="Close upload dialog" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={(event) => { event.preventDefault(); onClose(); }}><AttachmentUpload attachments={attachments} codes={codes} disabled={codesQuery.isLoading} onAdd={(files) => setAttachments((current) => [...current, ...files.map(createPendingAttachment)])} onDocumentCodeChange={(id, documentCodeId) => setAttachments((current) => current.map((item) => item.id === id ? { ...item, documentCodeId } : item))} onRemove={(id) => setAttachments((current) => current.filter((item) => item.id !== id))} /><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button type="submit">Continue</button></div></form></section></div>;
}

function CriticalWork({ workRequests, loading, unavailable, globalError, onRetry, detail }: { workRequests: WorkRequest[]; loading: boolean; unavailable: boolean; globalError: boolean; onRetry: () => void; detail?: string }) {
  const requests = [...workRequests].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()).slice(0, 5);
  if (unavailable && !globalError) return <section className="dash-panel dash-critical-panel"><div className="dash-panel-head"><div><strong>Work Requests</strong></div></div><SectionError detail={detail} message="Unable to load work requests." onRetry={onRetry} /></section>;
  if (!loading && !requests.length) return <section className="dash-panel dash-critical-panel"><div className="dash-panel-head"><div><strong>Work Requests</strong></div></div><div className="dash-critical-table"><DashboardEmptyState description="Work requests will appear here once they are created or assigned to you." icon={ClipboardList} title="No work requests available yet." /></div></section>;
  return <section className="dash-panel dash-critical-panel"><div className="dash-panel-head"><div><strong>Work Requests</strong></div></div><div className="dash-critical-table"><div className="dash-critical-row dash-critical-row--head"><span>Title</span><span>Type</span><span>Ship. No</span><span>Revision</span><span>Last Update</span><span>Status</span><span>Actions</span></div>{loading ? <p>{unavailable ? 'Work requests are unavailable.' : 'Loading current work requests...'}</p> : requests.map((request) => <div className="dash-critical-row" key={request.id}><div><strong>{request.title}</strong><small>WR-{request.id.slice(0, 8).toUpperCase()}</small></div><span>{request.projectId ? 'Project' : request.bidId ? 'Bid' : 'General'}</span><span>{requestValue(request, 'shipmentNumber', 'shipmentNo') ?? '—'}</span><span>{requestValue(request, 'revision', 'revisionNumber') ?? '—'}</span><small>{formatDate(request.updatedAt)}</small><span><em>{request.currentState || '—'}</em></span><Link className="dash-critical-action" to={`/work-requests/${request.id}`}>View</Link></div>)}{!loading && !requests.length ? <p>No work requests are available yet.</p> : null}</div></section>;
}

function ActivityTrail({ bids, projects, workRequests, unavailable, loading, globalError, onRetry }: { bids: Bid[]; projects: Project[]; workRequests: WorkRequest[]; unavailable: boolean; loading: boolean; globalError: boolean; onRetry: () => void }) {
  const activity = [...workRequests.map((item) => ({ id: `wr-${item.id}`, label: item.title, type: 'Work request updated', date: item.updatedAt })), ...bids.map((item) => ({ id: `bid-${item.id}`, label: item.name, type: 'Bid updated', date: item.updatedAt })), ...projects.map((item) => ({ id: `project-${item.id}`, label: item.name, type: 'Project updated', date: item.updatedAt }))].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()).slice(0, 4);
  if (unavailable || loading) return <section className="dash-panel dash-activity-panel"><div className="dash-panel-head"><div><Clock3 size={17} /><strong>System activity</strong></div></div><div className="dash-activity-list">{unavailable && !globalError ? <SectionError message="Unable to load system activity." onRetry={onRetry} /> : <p>{unavailable ? 'Activity is unavailable.' : 'Loading activity...'}</p>}</div></section>;
  if (!activity.length) return <section className="dash-panel dash-activity-panel"><div className="dash-panel-head"><div><Clock3 size={17} /><strong>System activity</strong></div><span>Live log</span></div><div className="dash-activity-list"><DashboardEmptyState description="Updates from projects, bids, and work requests will appear here." icon={Clock3} title="No system activity available yet." /></div></section>;
  return <section className="dash-panel dash-activity-panel"><div className="dash-panel-head"><div><Clock3 size={17} /><strong>System activity</strong></div><span>Live log</span></div><div className="dash-activity-list">{activity.length ? activity.map((item) => <article key={item.id}><span><Clock3 size={15} /></span><div><strong>{item.type}</strong><p>{item.label}</p><small>{formatDate(item.date)}</small></div></article>) : <p>Recent project activity will appear here.</p>}</div></section>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function requestValue(request: WorkRequest, ...keys: string[]) {
  const source = request as unknown as Record<string, unknown>;
  const value = keys.map((key) => source[key]).find((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return value;
}


function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const data = error.data as { message?: string | string[]; error?: { message?: string | string[] } } | null;
    const message = data?.message ?? data?.error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (message) {
      return message;
    }
  }

  return 'Something went wrong. Please try again.';
}

function getApiFieldErrors(error: unknown) {
  if (!(error instanceof ApiClientError)) return {} as Record<string, string>;
  const details = (error.data as { error?: { details?: Array<{ field?: string; message?: string }> } } | null)?.error?.details;
  return Object.fromEntries((details ?? []).filter((detail) => detail.field && detail.message).map((detail) => [detail.field!, detail.message!]));
}

function MemberModal({ editingMember, form, divisions, designations, designationsLoading, isSaving, fieldErrors, onChange, onClose, onSubmit }: {
  editingMember: Member | null; form: MemberForm; divisions: Division[]; designations: Designation[]; designationsLoading: boolean; isSaving: boolean; fieldErrors: Record<string, string>;
  onChange: (field: keyof MemberForm, value: string | boolean) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const inputError = (field: string) => fieldErrors[field] ? <small className="member-field-error">{fieldErrors[field]}</small> : null;
  return <div className="division-modal-backdrop" role="presentation">
    <section aria-modal="true" className="division-modal member-modal" role="dialog">
      <div className="division-modal__head"><div><strong>{editingMember ? 'Update Member' : 'Create Member'}</strong></div><button aria-label="Close member modal" onClick={onClose} type="button">X</button></div>
      <form className="division-form member-form" onSubmit={onSubmit}>
        <label><span>Full name</span><input maxLength={160} onChange={(e) => onChange('name', e.target.value)} placeholder="e.g. Antu Das" required value={form.name} />{inputError('name')}</label>
        <label><span>Email address</span><input maxLength={255} onChange={(e) => onChange('email', e.target.value)} placeholder="e.g. antu@example.com" required type="email" value={form.email} />{inputError('email')}</label>
        {!editingMember ? <label><span>Password</span><input minLength={8} onChange={(e) => onChange('password', e.target.value)} placeholder="Minimum 8 characters" required type="password" value={form.password} />{inputError('password')}</label> : null}
        <label><span>Division</span><select onChange={(e) => onChange('divisionId', e.target.value)} required value={form.divisionId}><option value="">Select a division</option>{divisions.filter((division) => division.isActive).map((division) => <option key={division.id} value={division.id}>{division.name} ({division.abbr})</option>)}</select>{inputError('divisionId')}</label>
        <label><span>Designation</span><select disabled={designationsLoading || !designations.length} onChange={(e) => onChange('designationId', e.target.value)} required value={form.designationId}><option value="">{designationsLoading ? 'Loading designations...' : designations.length ? 'Select a designation' : 'No designations available'}</option>{designations.map((designation) => <option key={designation.id} value={designation.id}>{designation.name}</option>)}</select>{inputError('designationId')}</label>
        {!editingMember ? <label><span>Phone <em>Optional</em></span><input maxLength={60} onChange={(e) => onChange('phone', e.target.value)} placeholder="e.g. 01700000000" type="tel" value={form.phone} /></label> : null}
        {editingMember ? <label className="member-active"><input checked={form.isActive} onChange={(e) => onChange('isActive', e.target.checked)} type="checkbox" /><span>Member is active</span></label> : null}
        <div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={isSaving || !divisions.length || designationsLoading || !designations.length} type="submit">{isSaving ? 'Saving...' : editingMember ? 'Update Member' : 'Create Member'}</button></div>
      </form>
    </section>
  </div>;
}

function DivisionModal({
  editingDivision,
  form,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: {
  editingDivision: Division | null;
  form: DivisionPayload;
  isSaving: boolean;
  onChange: (field: keyof DivisionPayload, value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="division-modal-backdrop" role="presentation">
      <section aria-modal="true" className="division-modal" role="dialog">
        <div className="division-modal__head">
          <div>
            <strong>{editingDivision ? 'Update Division' : 'Create Division'}</strong>
          </div>
          <button aria-label="Close division modal" onClick={onClose} type="button">
            X
          </button>
        </div>
        <form className="division-form" onSubmit={onSubmit}>
          <label className="division-form__full">
            <span>Name</span>
            <input
              maxLength={180}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="Engineering"
              required
              value={form.name}
            />
          </label>
          <label className="division-form__full">
            <span>Abbr</span>
            <input
              maxLength={30}
              onChange={(event) => onChange('abbr', event.target.value.toUpperCase())}
              placeholder="ENG"
              required
              value={form.abbr}
            />
          </label>
          <div className="division-form__actions">
            <button onClick={onClose} type="button">
              Cancel
            </button>
            <button disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : editingDivision ? 'Update Division' : 'Create Division'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function DashboardWorkspace({ modalOnly = false, createType, createRequest = 0, preselectedDivisionId }: { modalOnly?: boolean; createType?: 'division' | 'member' | 'bid' | 'project' | 'work-request' | 'team'; createRequest?: number; preselectedDivisionId?: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [divisionForm, setDivisionForm] = useState<DivisionPayload>(emptyDivisionForm);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [memberFieldErrors, setMemberFieldErrors] = useState<Record<string, string>>({});
  const [teamCreateRequest, setTeamCreateRequest] = useState(0);
  const [bidCreateRequest, setBidCreateRequest] = useState(0);
  const [projectCreateRequest, setProjectCreateRequest] = useState(0);
  const [workRequestCreateRequest, setWorkRequestCreateRequest] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { can } = usePermissions();
  const canViewBid = can('VIEW_BID');
  const canViewProject = can('VIEW_PROJECT');
  const canViewWorkRequest = can('VIEW_WORK_REQUEST');
  const canViewDocument = can('VIEW_DOCUMENT');
  const canViewMembers = can('VIEW_MEMBERS');

  useEffect(() => {
    const create = modalOnly ? createType : new URLSearchParams(window.location.search).get('create');
    if (create === 'division') openCreateDivisionModal();
    if (create === 'member') openCreateMemberModal(preselectedDivisionId);
    if (create === 'bid') setBidCreateRequest((current) => current + 1);
    if (create === 'project') setProjectCreateRequest((current) => current + 1);
    if (create === 'work-request') setWorkRequestCreateRequest((current) => current + 1);
    if (create === 'team') setTeamCreateRequest((current) => current + 1);
    if (create && !modalOnly) window.history.replaceState(null, '', '/dashboard');
  }, [createRequest, createType, modalOnly, preselectedDivisionId]);

  const retryDashboardQuery = (count: number, error: unknown) => !isUnavailableError(error) && !(error instanceof ApiClientError && error.status >= 400 && error.status < 500) && count < 3;
  const divisionsQuery = useQuery({
    retry: retryDashboardQuery,
    queryKey: divisionsQueryKey,
    queryFn: getDivisions, enabled: can('VIEW_DIVISIONS'),
  });

  const membersQuery = useQuery({ retry: retryDashboardQuery, queryKey: membersQueryKey, queryFn: getMembers, enabled: canViewMembers });
  const designationsQuery = useQuery({ retry: retryDashboardQuery, queryKey: designationsQueryKey, queryFn: getDesignations, enabled: can('VIEW_DESIGNATIONS') });
  const bidsQuery = useQuery({ retry: retryDashboardQuery, queryKey: ['bids'], queryFn: getBids, enabled: canViewBid });
  const projectsQuery = useQuery({ retry: retryDashboardQuery, queryKey: ['projects'], queryFn: getProjects, enabled: canViewProject });
  const workRequestsQuery = useQuery({ retry: retryDashboardQuery, queryKey: ['work-requests'], queryFn: getWorkRequests, enabled: canViewWorkRequest });
  const clientsQuery = useQuery({ retry: retryDashboardQuery, queryKey: ['clients'], queryFn: getClients, enabled: can('VIEW_CLIENTS') && (canViewBid || canViewProject) });

  const teamsQuery = useQuery({ retry: retryDashboardQuery, queryKey: ['teams'], queryFn: () => getTeams({ page: 1, limit: 100 }), enabled: can('VIEW_TEAMS') || can('CREATE_TEAM') });
  const dashboardQueries = [teamsQuery, divisionsQuery, membersQuery, designationsQuery, bidsQuery, projectsQuery, workRequestsQuery, clientsQuery];
  const serverUnavailable = hasDashboardOutage(dashboardQueries.map((query) => ({ failed: query.isError, network: isUnavailableError(query.error), succeeded: query.isSuccess })));
  const retrying = dashboardQueries.some((query) => isUnavailableError(query.error) && query.isFetching);
  const retryUnavailableQueries = () => {
    retryFailedDashboardQueries(dashboardQueries);
  };
  const workspaceUnavailable = (canViewBid && bidsQuery.isError) || (canViewProject && projectsQuery.isError) || (can('VIEW_CLIENTS') && clientsQuery.isError);
  const activityUnavailable = (canViewBid && bidsQuery.isError) || (canViewProject && projectsQuery.isError) || (canViewWorkRequest && workRequestsQuery.isError);
  const activityLoading = (canViewBid && bidsQuery.isLoading) || (canViewProject && projectsQuery.isLoading) || (canViewWorkRequest && workRequestsQuery.isLoading);
  const workspaceQueries = [bidsQuery, projectsQuery, clientsQuery];
  const activityQueries = [bidsQuery, projectsQuery, workRequestsQuery];
  const retryQueries = retryFailedDashboardQueries;
  const referenceQueries = [
    { name: 'designations', query: designationsQuery }, { name: 'divisions', query: divisionsQuery },
    { name: 'members', query: membersQuery }, { name: 'clients', query: clientsQuery },
  ].filter(({ query }) => query.isError);
  const metricState = (query: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown }): MetricState => ({ loading: query.isLoading, failed: query.isError, network: isUnavailableError(query.error), retry: () => { void query.refetch(); }, detail: query.isError && query.error instanceof ApiClientError && query.error.status < 500 ? getApiErrorMessage(query.error) : undefined });

  const divisions = useMemo(() => divisionsQuery.data?.items ?? [], [divisionsQuery.data]);
  const members = useMemo(() => membersQuery.data?.items ?? [], [membersQuery.data]);
  const designations = useMemo(() => designationsQuery.data?.items ?? [], [designationsQuery.data]);
  const bids = useMemo(() => bidsQuery.data?.items ?? [], [bidsQuery.data]);
  const projects = useMemo(() => projectsQuery.data?.items ?? [], [projectsQuery.data]);
  const workRequests = useMemo(() => workRequestsQuery.data?.items ?? [], [workRequestsQuery.data]);
  const clientNames = useMemo(() => new Map((clientsQuery.data?.items ?? []).map((client) => [client.id, client.name])), [clientsQuery.data]);

  const saveDivisionMutation = useMutation({
    mutationFn: (payload: DivisionPayload) =>
      editingDivision ? updateDivision(editingDivision.id, payload) : createDivision(payload),
    onSuccess: (division) => {
      toast.success(editingDivision ? 'Division updated successfully' : 'Division created successfully');
      queryClient.invalidateQueries({ queryKey: divisionsQueryKey });
      closeDivisionModal();
      void division.id;
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const saveMemberMutation = useMutation({
    mutationFn: (form: MemberForm) => {
      if (editingMember) {
        const payload: UpdateMemberPayload = { name: form.name, email: form.email, designationId: form.designationId, divisionId: form.divisionId, isActive: form.isActive };
        return updateMember(editingMember.id, payload);
      }
      const payload: CreateMemberPayload = { name: form.name, email: form.email, password: form.password, divisionId: form.divisionId, designationId: form.designationId, phone: form.phone };
      return createMember(payload);
    },
    onSuccess: () => {
      toast.success(editingMember ? 'Member updated successfully' : 'Member created successfully');
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      closeMemberModal();
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error);
      if (error instanceof ApiClientError && error.status === 409 && !fieldErrors.email) {
        fieldErrors.email = 'A user or member with this email address already exists.';
      }
      setMemberFieldErrors(fieldErrors);
      toast.error(fieldErrors.email ?? getApiErrorMessage(error));
    },
  });

  function openCreateDivisionModal() {
    setEditingDivision(null);
    setDivisionForm(emptyDivisionForm);
    setIsDivisionModalOpen(true);
  }

  function closeDivisionModal() {
    setIsDivisionModalOpen(false);
    setEditingDivision(null);
    setDivisionForm(emptyDivisionForm);
  }

  function handleDivisionFormChange(field: keyof DivisionPayload, value: string) {
    setDivisionForm((current) => ({ ...current, [field]: value }));
  }

  function handleDivisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDivisionMutation.mutate({
      name: divisionForm.name.trim(),
      abbr: divisionForm.abbr.trim(),
      divisionTypeId: divisionForm.divisionTypeId?.trim(),
    });
  }

  function openCreateMemberModal(divisionId = '') {
    setEditingMember(null);
    setMemberForm({ ...emptyMemberForm, divisionId });
    setMemberFieldErrors({});
    setIsMemberModalOpen(true);
  }

  function closeMemberModal() {
    setIsMemberModalOpen(false);
    setEditingMember(null);
    setMemberForm(emptyMemberForm);
    setMemberFieldErrors({});
  }

  function handleMemberFormChange(field: keyof MemberForm, value: string | boolean) {
    setMemberFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setMemberForm((current) => ({ ...current, [field]: value }));
  }

  function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = { ...memberForm, name: memberForm.name.trim(), email: memberForm.email.trim(), designationId: memberForm.designationId.trim(), phone: memberForm.phone.trim() };
    const duplicateMember = members.find((member) => member.email.toLowerCase() === normalized.email.toLowerCase() && member.id !== editingMember?.id);
    if (duplicateMember) {
      const message = 'A member with this email address already exists.';
      setMemberFieldErrors({ email: message });
      toast.error(message);
      return;
    }
    saveMemberMutation.mutate(normalized);
  }

  return (
    <div className={modalOnly ? 'dashboard-modal-host' : 'dash-page'}>
      <header className="dash-heading">
        <div className="dash-heading__intro">
          <h1>Dashboard</h1>

        </div>
      </header>
      {serverUnavailable ? <div className="dash-outage" role="alert"><AlertCircle aria-hidden="true" size={20} /><div><strong>We couldn't load the dashboard</strong><p>The server is currently unavailable or the connection failed. Please try again.</p></div><button disabled={retrying} onClick={retryUnavailableQueries} type="button">{retrying ? 'Retrying...' : 'Retry'}</button></div> : null}
      <MetricsStrip bids={bids} bidState={metricState(bidsQuery)} projectState={metricState(projectsQuery)} workRequestState={metricState(workRequestsQuery)} globalError={serverUnavailable} canViewBid={canViewBid} canViewDocument={canViewDocument} canViewProject={canViewProject} canViewWorkRequest={canViewWorkRequest} projects={projects} workRequests={workRequests} />
      <div className="dash-top-grid">
        {canViewBid || canViewProject ? <QuickAccess errorMessage={clientsQuery.isError && !bidsQuery.isError && !projectsQuery.isError ? "Unable to load clients." : "Unable to load workspace folders."} globalError={serverUnavailable} onRetry={() => retryQueries(workspaceQueries)} unavailable={workspaceUnavailable} bids={bids} clientNames={clientNames} loading={bidsQuery.isLoading || projectsQuery.isLoading || clientsQuery.isLoading || workspaceUnavailable} projects={projects} viewAllPath={canViewBid ? '/bids' : '/projects'} /> : null}
        <QuickActions referenceDetail={referenceQueries.map(({ query }) => metricState(query).detail).filter(Boolean).join(' ') || undefined} referenceFailures={referenceQueries.map(({ name }) => name)} onRetryReference={() => retryQueries(referenceQueries.map(({ query }) => query))} unavailable={serverUnavailable} can={can} onBid={() => setBidCreateRequest((current) => current + 1)} onDivision={openCreateDivisionModal} onDocuments={() => navigate('/documents')} onMember={openCreateMemberModal} onProject={() => setProjectCreateRequest((current) => current + 1)} onTeam={() => setTeamCreateRequest((current) => current + 1)} onUpload={() => setIsUploadModalOpen(true)} onWorkRequest={() => setWorkRequestCreateRequest((current) => current + 1)} onWorkRequests={() => navigate('/work-requests')} onWorkspaces={() => navigate(canViewBid ? '/bids' : '/projects')} />
      </div>
      <div className="dash-bottom-grid">
        {canViewWorkRequest ? <CriticalWork detail={metricState(workRequestsQuery).detail} globalError={serverUnavailable} onRetry={() => { void workRequestsQuery.refetch(); }} unavailable={workRequestsQuery.isError} loading={workRequestsQuery.isLoading || workRequestsQuery.isError} workRequests={workRequests} /> : null}
        {canViewBid || canViewProject || canViewWorkRequest ? <ActivityTrail loading={activityLoading} globalError={serverUnavailable} onRetry={() => retryQueries(activityQueries)} unavailable={activityUnavailable} bids={bids} projects={projects} workRequests={workRequests} /> : null}
      </div>
      {canViewBid || can('CREATE_BID') ? <BidsPanel createRequest={bidCreateRequest} modalOnly /> : null}
      {canViewProject || can('CREATE_PROJECT') ? <ProjectsPanel createRequest={projectCreateRequest} modalOnly /> : null}
      {canViewWorkRequest || can('CREATE_WORK_REQUEST') ? <WorkRequestsPage createRequest={workRequestCreateRequest} embedded modalOnly /> : null}
      {can('VIEW_TEAMS') || can('CREATE_TEAM') ? <TeamPage createRequest={teamCreateRequest} embedded modalOnly preselectedDivisionId={preselectedDivisionId} /> : null}
      {isUploadModalOpen ? <UploadDocumentModal onClose={() => setIsUploadModalOpen(false)} /> : null}
      {isDivisionModalOpen ? (
        <DivisionModal
          editingDivision={editingDivision}
          form={divisionForm}
          isSaving={saveDivisionMutation.isPending}
          onChange={handleDivisionFormChange}
          onClose={closeDivisionModal}
          onSubmit={handleDivisionSubmit}
        />
      ) : null}
      {isMemberModalOpen ? <MemberModal designations={designations} designationsLoading={designationsQuery.isLoading} editingMember={editingMember} fieldErrors={memberFieldErrors} form={memberForm} isSaving={saveMemberMutation.isPending} divisions={divisions} onChange={handleMemberFormChange} onClose={closeMemberModal} onSubmit={handleMemberSubmit} /> : null}
    </div>
  );
}
