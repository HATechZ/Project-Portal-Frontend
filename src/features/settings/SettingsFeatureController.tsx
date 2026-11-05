import { ExistingMemberSelector } from '@/components/member/ExistingMemberSelector';
import { TablePagination } from '@/components/ui/TablePagination';
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Check, Plus, Search, X } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { settingsQueryKeys } from '@/features/settings/queryKeys';
import { RolesSection } from '@/features/settings/roles/RolesSection';
import { isPermissionCompatible, scopedDependencies } from '@/utils/permissionScope';
import { CargoVesselTabs, LocationCodeTabs } from '@/features/settings/referenceData/ReferenceDataTabs';
import { DocumentCodeTabs } from '@/features/settings/documentCodes/DocumentCodeTabs';
import { useMembers } from '@/features/settings/members/useMembers';
import { MembersSection } from '@/features/settings/members/MembersSection';
import { useDivisions } from '@/features/settings/divisions/useDivisions';
import { DivisionsSection } from '@/features/settings/divisions/DivisionsSection';
import { useTeams } from '@/features/settings/teams/useTeams';
import { TeamsSection } from '@/features/settings/teams/TeamsSection';
import { useSettingsWorkspace } from '@/features/settings/useSettingsWorkspace';
import { WorkspaceLoadingState } from '@/components/ui/LoadingState';
import {
  createPolCode,
  deactivatePolCode,
  getPolCode,
  getPolCodes,
  getDeactivatedPolCodes,
  reactivatePolCode,
  updatePolCode,
  type PolCode,
} from '@/services/polCodeService';
import {
  createPodCode,
  deactivatePodCode,
  getPodCode,
  getPodCodes,
  getDeactivatedPodCodes,
  reactivatePodCode,
  updatePodCode,
  type PodCode,
} from '@/services/podCodeService';
import {
  createCargoCode,
  deactivateCargoCode,
  getCargoCode,
  getCargoCodes,
  getDeactivatedCargoCodes,
  reactivateCargoCode,
  updateCargoCode,
  type CargoCode,
} from '@/services/cargoCodeService';
import {
  createVesselCode,
  deactivateVesselCode,
  getVesselCode,
  getVesselCodes,
  getDeactivatedVesselCodes,
  reactivateVesselCode,
  updateVesselCode,
  type VesselCode,
} from '@/services/vesselCodeService';
import {
  createGeneralDocumentCode,
  deactivateGeneralDocumentCode,
  getDeactivatedGeneralDocumentCodes,
  getGeneralDocumentCode,
  getGeneralDocumentCodes,
  reactivateGeneralDocumentCode,
  updateGeneralDocumentCode,
  type GeneralDocumentCode,
} from '@/services/generalDocumentCodeService';
import {
  createProjectManagementOperationDocumentCode,
  deactivateProjectManagementOperationDocumentCode,
  getDeactivatedProjectManagementOperationDocumentCodes,
  getProjectManagementOperationDocumentCode,
  getProjectManagementOperationDocumentCodes,
  reactivateProjectManagementOperationDocumentCode,
  updateProjectManagementOperationDocumentCode,
  type ProjectManagementOperationDocumentCode,
} from '@/services/projectManagementOperationDocumentCodeService';
import {
  createMarketingDocumentCode,
  deactivateMarketingDocumentCode,
  getDeactivatedMarketingDocumentCodes,
  getMarketingDocumentCode,
  getMarketingDocumentCodes,
  reactivateMarketingDocumentCode,
  updateMarketingDocumentCode,
  type MarketingDocumentCode,
} from '@/services/marketingDocumentCodeService';
import {
  createEtcDocumentCode,
  deactivateEtcDocumentCode,
  getDeactivatedEtcDocumentCodes,
  getEtcDocumentCode,
  getEtcDocumentCodes,
  reactivateEtcDocumentCode,
  updateEtcDocumentCode,
  type EtcDocumentCode,
} from '@/services/etcDocumentCodeService';
import {
  createEngineeringDocumentCode,
  deactivateEngineeringDocumentCode,
  getDeactivatedEngineeringDocumentCodes,
  getEngineeringDocumentCode,
  getEngineeringDocumentCodes,
  reactivateEngineeringDocumentCode,
  updateEngineeringDocumentCode,
  type EngineeringDocumentCode,
} from '@/services/engineeringDocumentCodeService';
import {
  createDesignation,
  deleteDesignation,
  getDesignation,
  getDesignations,
  updateDesignation,
  type Designation,
} from '@/services/designationService';
import { getEligibleMembers, type EligibleMember, type Member } from '@/services/memberService';
import { getDivisionLead, setDivisionLead, type Division } from '@/services/divisionService';
import { BidsPanel } from '@/features/dashboard/BidsPanel';
import { ProjectsPanel } from '@/features/dashboard/ProjectsPanel';
import { WorkRequestsPage } from '@/pages/WorkRequestsPage';
import { addTeamMember, getTeamMembers, setTeamLead, type Team } from '@/services/teamService';
import { CreateDivisionModal } from '@/components/ui/CreateDivisionModal';
import { DashboardWorkspace } from '@/features/dashboard/DashboardWorkspace';
import { TeamPage } from '@/pages/TeamPage';
import { assignUserRole, getUserRoleHistory, getUserRoleOptions, getUserRoles, reassignUserRole, readableApiError, revokeUserRole, type Permission } from '@/services/roleService';

const { polCodes: polCodesQueryKey, deactivatedPolCodes: deactivatedPolCodesQueryKey, podCodes: podCodesQueryKey, deactivatedPodCodes: deactivatedPodCodesQueryKey, cargoCodes: cargoCodesQueryKey, deactivatedCargoCodes: deactivatedCargoCodesQueryKey, vesselCodes: vesselCodesQueryKey, deactivatedVesselCodes: deactivatedVesselCodesQueryKey, generalDocumentCodes: generalDocumentCodesQueryKey, deactivatedGeneralDocumentCodes: deactivatedGeneralDocumentCodesQueryKey, projectManagementOperationDocumentCodes: projectManagementOperationDocumentCodesQueryKey, deactivatedProjectManagementOperationDocumentCodes: deactivatedProjectManagementOperationDocumentCodesQueryKey, marketingDocumentCodes: marketingDocumentCodesQueryKey, deactivatedMarketingDocumentCodes: deactivatedMarketingDocumentCodesQueryKey, etcDocumentCodes: etcDocumentCodesQueryKey, deactivatedEtcDocumentCodes: deactivatedEtcDocumentCodesQueryKey, engineeringDocumentCodes: engineeringDocumentCodesQueryKey, deactivatedEngineeringDocumentCodes: deactivatedEngineeringDocumentCodesQueryKey, designations: designationsQueryKey } = settingsQueryKeys;

type IncompatiblePermission = { id: string | null; label: string };
type RoleScopeValidation = { incompatiblePermissions: IncompatiblePermission[]; affectedBindings: string[] };
type RoleScopeValidationContextValue = { validation: RoleScopeValidation | null; onRemoveIncompatible: () => void; catalogue: Permission[]; retryPermissions: () => void; catalogueError: boolean };
const RoleScopeValidationContext = createContext<RoleScopeValidationContextValue>({ validation: null, onRemoveIncompatible: () => undefined, catalogue: [], retryPermissions: () => undefined, catalogueError: false });

function DivisionLeadModal({ division, members, currentLeadId, loadingLead, saving, value, onChange, onClose, onSave }: { division: Division; members: Member[]; currentLeadId: string | null; loadingLead: boolean; saving: boolean; value: string; onChange: (value: string) => void; onClose: () => void; onSave: () => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal division-lead-modal" role="dialog"><div className="division-modal__head"><div><strong>Assign Division Lead</strong><span>{division.name} ({division.abbr})</span></div><button aria-label="Close division lead dialog" disabled={saving} onClick={onClose} type="button">X</button></div><div className="division-form"><ExistingMemberSelector disabled={loadingLead || saving} members={members.filter((member) => member.isActive).map((member) => ({ id: member.id, name: member.name, email: member.email, designation: member.designation ?? member.roleTitle }))} onChange={onChange} value={value} />{currentLeadId ? <p className="division-form__hint">Choosing another member replaces the current division lead.</p> : null}<div className="division-form__actions"><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={!value || loadingLead || saving} onClick={onSave} type="button">{saving ? 'Assigning...' : 'Assign Lead'}</button></div></div></section></div>;
}

function WorkspaceRosterModal({ title, lead, members, loading, onClose }: { title: string; lead: { name: string; email?: string } | null; members: Array<{ id: string; name: string; email?: string; designation?: string; roleTitle?: string }>; loading: boolean; onClose: () => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal division-modal--wide" role="dialog"><div className="division-modal__head"><div><strong>{title}</strong><span>Lead and members</span></div><button aria-label="Close roster dialog" onClick={onClose} type="button">X</button></div><div className="division-form"><div className="workspace-roster"><strong>Lead</strong><div className="workspace-roster__table"><div><span>Name</span><span>Email</span></div>{loading ? <p>Loading lead...</p> : lead ? <div><span>{lead.name}</span><span>{lead.email ?? '—'}</span></div> : <p>No lead assigned.</p>}</div><strong>Members</strong><div className="workspace-roster__table"><div><span>Name</span><span>Designation</span><span>Email</span></div>{loading ? <p>Loading members...</p> : members.length ? members.map((member) => <div key={member.id}><span>{member.name}</span><span>{member.designation ?? member.roleTitle ?? '—'}</span><span>{member.email ?? '—'}</span></div>) : <p>No members assigned.</p>}</div></div><div className="division-form__actions"><button onClick={onClose} type="button">Done</button></div></div></section></div>;
}

function TeamAssignmentModal({ title, team, members, saving, value, onChange, onClose, onSave, submitLabel }: { title: string; team: Team; members: Member[]; saving: boolean; value: string; onChange: (value: string) => void; onClose: () => void; onSave: () => void; submitLabel: string }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{title}</strong><span>{team.name}</span></div><button aria-label={`Close ${title} dialog`} disabled={saving} onClick={onClose} type="button">X</button></div><div className="division-form"><ExistingMemberSelector disabled={saving} members={members.filter((member) => member.isActive).map((member) => ({ id: member.id, name: member.name, email: member.email, designation: member.designation ?? member.roleTitle }))} onChange={onChange} value={value} /><div className="division-form__actions"><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={!value || saving} onClick={onSave} type="button">{saving ? 'Saving...' : submitLabel}</button></div></div></section></div>;
}

function eligibleMemberNote(member: EligibleMember) {
  const label = (team: string | { id?: string; name?: string; code?: string }) => typeof team === 'string' ? team : team.code ?? team.name ?? team.id ?? 'Unnamed team';
  const notes = [member.activeTeamMemberships.length ? `Already in Team: ${member.activeTeamMemberships.map(label).join(', ')}` : '', member.isTeamLead && member.ledTeams.length ? `Team Lead: ${member.ledTeams.map(label).join(', ')}` : ''].filter(Boolean);
  return notes.join(' · ');
}

function EligibleMemberAssignmentModal({ title, subtitle, members, loading, error, saving, value, onChange, onClose, onSave, submitLabel }: { title: string; subtitle: string; members: EligibleMember[]; loading: boolean; error: boolean; saving: boolean; value: string; onChange: (value: string) => void; onClose: () => void; onSave: () => void; submitLabel: string }) {
  const selected = members.find((member) => member.memberId === value);
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal eligible-member-assignment-modal" role="dialog"><div className="division-modal__head"><div><strong>{title}</strong><span>{subtitle}</span></div><button aria-label={`Close ${title} dialog`} disabled={saving} onClick={onClose} type="button">X</button></div><div className="division-form"><ExistingMemberSelector disabled={loading || error || saving || !members.length} members={members.map((member) => ({ id: member.memberId, name: member.name, email: member.email, badges: eligibleMemberNote(member) ? [eligibleMemberNote(member)] : [] }))} onChange={onChange} value={value} />{selected && eligibleMemberNote(selected) ? <small className="eligible-member-assignment-modal__note">{eligibleMemberNote(selected)}</small> : null}{!loading && !error && !members.length ? <div className="division-empty">No eligible members are available in this division.</div> : null}{error ? <p className="role-form-error">Unable to load eligible members. Please try again.</p> : null}<div className="division-form__actions"><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={!value || loading || error || saving} onClick={onSave} type="button">{saving ? 'Saving...' : submitLabel}</button></div></div></section></div>;
}

void DivisionLeadModal;
void TeamAssignmentModal;

function TableFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const { can } = usePermissions();
  const create = label === 'Filter divisions' ? { text: 'Create Division', target: 'division' } : label === 'Filter members' ? { text: 'Create Member', target: 'member' } : label === 'Filter bids' ? { text: 'Create Bid', target: 'bid' } : label === 'Filter projects' ? { text: 'Create Project', target: 'project' } : label === 'Filter work requests' ? { text: 'Create Work Request', target: 'work-request' } : label === 'Filter teams' ? { text: 'Create Team', target: 'team' } : null;
  const permission = create?.target === 'division' ? 'CREATE_DIVISION' : create?.target === 'member' ? 'CREATE_MEMBER' : create?.target === 'team' ? 'CREATE_TEAM' : create?.target === 'bid' ? 'CREATE_BID' : create?.target === 'project' ? 'CREATE_PROJECT' : create?.target === 'work-request' ? 'CREATE_WORK_REQUEST' : '';
  return <div className="settings-table-filter"><label><span>Filter</span><input aria-label={label} onChange={(event) => onChange(event.target.value)} placeholder={label} type="search" value={value} /></label>{create && can(permission) ? <button onClick={() => window.dispatchEvent(new CustomEvent('workspace-create', { detail: create.target }))} type="button">{create.text}</button> : null}</div>;
}

function WorkspacePanelFilter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <div className="settings-panel-filter"><TableFilter label={label} value={value} onChange={onChange} />{children}</div>;
}

function SettingsTableToolbar({ title, count, searchPlaceholder, searchValue, onSearchChange, statusFilter, onStatusChange, onCreate, createLabel, onSecondaryAction, secondaryLabel }: { title: string; count: string; searchPlaceholder: string; searchValue: string; onSearchChange: (value: string) => void; statusFilter?: 'all' | 'active' | 'inactive'; onStatusChange?: (value: 'all' | 'active' | 'inactive') => void; onCreate?: () => void; createLabel?: string; onSecondaryAction?: () => void; secondaryLabel?: string }) {
  const { can } = usePermissions();
  const createPermission = createLabel === 'Create Role' ? 'CREATE_ROLE' : createLabel?.includes('POL') ? 'CREATE_POL_CODE' : createLabel?.includes('POD') ? 'CREATE_POD_CODE' : createLabel?.includes('Cargo') ? 'CREATE_CARGO_CODE' : createLabel?.includes('Vessel') ? 'CREATE_VESSEL_CODE' : createLabel?.includes('Designation') ? 'CREATE_DESIGNATION' : 'CREATE_DOCUMENT_CODE';
  return <div className="settings-table-toolbar"><div className="settings-table-toolbar__title"><strong>{title}</strong><span>{count}</span></div><div className="settings-table-toolbar__controls"><input aria-label={`Search ${title}`} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} type="search" value={searchValue} />{statusFilter && onStatusChange ? <select aria-label={`Filter ${title} by status`} onChange={(event) => onStatusChange(event.target.value as 'all' | 'active' | 'inactive')} value={statusFilter}><option value="active">Active</option><option value="inactive">Deactivated</option><option value="all">All</option></select> : null}{onSecondaryAction && secondaryLabel && (can('ASSIGN_ROLES') || can('REVOKE_ROLES')) ? <button className="settings-table-toolbar__secondary" onClick={onSecondaryAction} type="button">{secondaryLabel}</button> : null}{onCreate && createLabel && can(createPermission) ? <button className="settings-table-toolbar__create" onClick={onCreate} type="button">{createLabel}</button> : null}</div></div>;
}

function pageItems<T>(items: T[], page: number, pageSize = 10) { return items.slice((page - 1) * pageSize, page * pageSize); }

/**
 * The existing feature implementation remains here while the settings entry
 * point composes it. This keeps the public page boundary free of feature data.
 */
export function SettingsFeatureController() {
  const queryClient = useQueryClient();
  const [editingCode, setEditingCode] = useState<PolCode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [editingPodCode, setEditingPodCode] = useState<PodCode | null>(null);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [podName, setPodName] = useState('');
  const [editingCargoCode, setEditingCargoCode] = useState<CargoCode | null>(null);
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [cargoName, setCargoName] = useState('');
  const [cargoCode, setCargoCode] = useState('');
  const [editingVesselCode, setEditingVesselCode] = useState<VesselCode | null>(null);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [vesselName, setVesselName] = useState('');
  const [vesselCode, setVesselCode] = useState('');
  const [editingGeneralDocumentCode, setEditingGeneralDocumentCode] = useState<GeneralDocumentCode | null>(null);
  const [isGeneralDocumentCodeModalOpen, setIsGeneralDocumentCodeModalOpen] = useState(false);
  const [generalDocumentCodeName, setGeneralDocumentCodeName] = useState('');
  const [generalDocumentCodeValue, setGeneralDocumentCodeValue] = useState('');
  const [generalDocumentCodeDescription, setGeneralDocumentCodeDescription] = useState('');
  const [editingProjectManagementOperationDocumentCode, setEditingProjectManagementOperationDocumentCode] = useState<ProjectManagementOperationDocumentCode | null>(null);
  const [isProjectManagementOperationDocumentCodeModalOpen, setIsProjectManagementOperationDocumentCodeModalOpen] = useState(false);
  const [projectManagementOperationDocumentCodeName, setProjectManagementOperationDocumentCodeName] = useState('');
  const [projectManagementOperationDocumentCodeValue, setProjectManagementOperationDocumentCodeValue] = useState('');
  const [projectManagementOperationDocumentCodeDescription, setProjectManagementOperationDocumentCodeDescription] = useState('');
  const [editingMarketingDocumentCode, setEditingMarketingDocumentCode] = useState<MarketingDocumentCode | null>(null);
  const [isMarketingDocumentCodeModalOpen, setIsMarketingDocumentCodeModalOpen] = useState(false);
  const [marketingDocumentCodeName, setMarketingDocumentCodeName] = useState('');
  const [marketingDocumentCodeValue, setMarketingDocumentCodeValue] = useState('');
  const [marketingDocumentCodeDescription, setMarketingDocumentCodeDescription] = useState('');
  const [editingEtcDocumentCode, setEditingEtcDocumentCode] = useState<EtcDocumentCode | null>(null);
  const [isEtcDocumentCodeModalOpen, setIsEtcDocumentCodeModalOpen] = useState(false);
  const [etcDocumentCodeName, setEtcDocumentCodeName] = useState('');
  const [etcDocumentCodeValue, setEtcDocumentCodeValue] = useState('');
  const [etcDocumentCodeDescription, setEtcDocumentCodeDescription] = useState('');
  const [editingEngineeringDocumentCode, setEditingEngineeringDocumentCode] = useState<EngineeringDocumentCode | null>(null);
  const [isEngineeringDocumentCodeModalOpen, setIsEngineeringDocumentCodeModalOpen] = useState(false);
  const [engineeringDocumentCodeName, setEngineeringDocumentCodeName] = useState('');
  const [engineeringDocumentCodeValue, setEngineeringDocumentCodeValue] = useState('');
  const [engineeringDocumentCodeDescription, setEngineeringDocumentCodeDescription] = useState('');
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [isDesignationModalOpen, setIsDesignationModalOpen] = useState(false);
  const [designationName, setDesignationName] = useState('');
  const [divisionLeadTarget, setDivisionLeadTarget] = useState<Division | null>(null);
  const [divisionLeadMemberId, setDivisionLeadMemberId] = useState('');
  const [divisionTeamTarget, setDivisionTeamTarget] = useState<Division | null>(null);
  const [divisionRosterTarget, setDivisionRosterTarget] = useState<Division | null>(null);
  const [divisionLeadIds, setDivisionLeadIds] = useState<Record<string, string>>({});
  void divisionLeadIds;
  const [teamLeadTarget, setTeamLeadTarget] = useState<Team | null>(null);
  const [teamLeadMemberId, setTeamLeadMemberId] = useState('');
  const [teamMemberTarget, setTeamMemberTarget] = useState<Team | null>(null);
  const [teamMemberId, setTeamMemberId] = useState('');
  const [teamRosterTarget, setTeamRosterTarget] = useState<Team | null>(null);
  const [memberRoleTarget, setMemberRoleTarget] = useState<Member | null>(null);
  const [settingsCategory, setSettingsCategory] = useState<'access' | 'location' | 'cargo' | 'documents' | 'organization' | 'workspace'>('access');
  const [locationTab, setLocationTab] = useState<'pol' | 'pod'>('pol');
  const [cargoVesselTab, setCargoVesselTab] = useState<'cargo' | 'vessel'>('cargo');
  const [documentTab, setDocumentTab] = useState<'general' | 'operation' | 'marketing' | 'etc' | 'engineering'>('general');
  const [workspaceTab, setWorkspaceTab] = useState<'divisions' | 'members' | 'bids' | 'projects' | 'workRequests' | 'teams'>('divisions');
  const [bidFilter, setBidFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [workRequestFilter, setWorkRequestFilter] = useState('');
  const [documentPage, setDocumentPage] = useState(1);
  const { settingsSearch, setSettingsSearch, statusFilter, setStatusFilter, settingsPage, setSettingsPage, statusConfirmation, setStatusConfirmation, requestStatusChange } = useSettingsWorkspace();
  const [designationDeleteConfirmation, setDesignationDeleteConfirmation] = useState<Designation | null>(null);
  const [workspaceCreate, setWorkspaceCreate] = useState<{ type: 'division' | 'member' | 'bid' | 'project' | 'work-request' | 'team'; id: number; divisionId?: string } | null>(null);
  useEffect(() => { const open = (event: Event) => { const type = (event as CustomEvent<typeof workspaceCreate extends { type: infer T } ? T : never>).detail; if (type) setWorkspaceCreate({ type, id: Date.now() }); }; window.addEventListener('workspace-create', open); return () => window.removeEventListener('workspace-create', open); }, []);

  const polCodesQuery = useQuery({ queryKey: polCodesQueryKey, queryFn: getPolCodes });
  const deactivatedPolCodesQuery = useQuery({ queryKey: deactivatedPolCodesQueryKey, queryFn: getDeactivatedPolCodes });
  const codeDetailsQuery = useQuery({
    queryKey: ['pol-codes', editingCode?.id],
    queryFn: () => getPolCode(editingCode!.id),
    enabled: Boolean(editingCode),
  });
  const podCodesQuery = useQuery({ queryKey: podCodesQueryKey, queryFn: getPodCodes });
  const deactivatedPodCodesQuery = useQuery({ queryKey: deactivatedPodCodesQueryKey, queryFn: getDeactivatedPodCodes });
  const podCodeDetailsQuery = useQuery({
    queryKey: ['pod-codes', editingPodCode?.id],
    queryFn: () => getPodCode(editingPodCode!.id),
    enabled: Boolean(editingPodCode),
  });
  const cargoCodesQuery = useQuery({ queryKey: cargoCodesQueryKey, queryFn: getCargoCodes });
  const deactivatedCargoCodesQuery = useQuery({ queryKey: deactivatedCargoCodesQueryKey, queryFn: getDeactivatedCargoCodes });
  const cargoCodeDetailsQuery = useQuery({ queryKey: ['cargo-codes', editingCargoCode?.id], queryFn: () => getCargoCode(editingCargoCode!.id), enabled: Boolean(editingCargoCode) });
  const vesselCodesQuery = useQuery({ queryKey: vesselCodesQueryKey, queryFn: getVesselCodes });
  const deactivatedVesselCodesQuery = useQuery({ queryKey: deactivatedVesselCodesQueryKey, queryFn: getDeactivatedVesselCodes });
  const vesselCodeDetailsQuery = useQuery({ queryKey: ['vessel-codes', editingVesselCode?.id], queryFn: () => getVesselCode(editingVesselCode!.id), enabled: Boolean(editingVesselCode) });
  const generalDocumentCodesQuery = useQuery({ queryKey: generalDocumentCodesQueryKey, queryFn: getGeneralDocumentCodes });
  const deactivatedGeneralDocumentCodesQuery = useQuery({ queryKey: deactivatedGeneralDocumentCodesQueryKey, queryFn: getDeactivatedGeneralDocumentCodes });
  const generalDocumentCodeDetailsQuery = useQuery({ queryKey: ['general-document-codes', editingGeneralDocumentCode?.id], queryFn: () => getGeneralDocumentCode(editingGeneralDocumentCode!.id), enabled: Boolean(editingGeneralDocumentCode) });
  const projectManagementOperationDocumentCodesQuery = useQuery({ queryKey: projectManagementOperationDocumentCodesQueryKey, queryFn: getProjectManagementOperationDocumentCodes });
  const deactivatedProjectManagementOperationDocumentCodesQuery = useQuery({ queryKey: deactivatedProjectManagementOperationDocumentCodesQueryKey, queryFn: getDeactivatedProjectManagementOperationDocumentCodes });
  const projectManagementOperationDocumentCodeDetailsQuery = useQuery({ queryKey: ['project-management-operation-document-codes', editingProjectManagementOperationDocumentCode?.id], queryFn: () => getProjectManagementOperationDocumentCode(editingProjectManagementOperationDocumentCode!.id), enabled: Boolean(editingProjectManagementOperationDocumentCode) });
  const marketingDocumentCodesQuery = useQuery({ queryKey: marketingDocumentCodesQueryKey, queryFn: getMarketingDocumentCodes });
  const deactivatedMarketingDocumentCodesQuery = useQuery({ queryKey: deactivatedMarketingDocumentCodesQueryKey, queryFn: getDeactivatedMarketingDocumentCodes });
  const marketingDocumentCodeDetailsQuery = useQuery({ queryKey: ['marketing-document-codes', editingMarketingDocumentCode?.id], queryFn: () => getMarketingDocumentCode(editingMarketingDocumentCode!.id), enabled: Boolean(editingMarketingDocumentCode) });
  const etcDocumentCodesQuery = useQuery({ queryKey: etcDocumentCodesQueryKey, queryFn: getEtcDocumentCodes });
  const deactivatedEtcDocumentCodesQuery = useQuery({ queryKey: deactivatedEtcDocumentCodesQueryKey, queryFn: getDeactivatedEtcDocumentCodes });
  const etcDocumentCodeDetailsQuery = useQuery({ queryKey: ['etc-document-codes', editingEtcDocumentCode?.id], queryFn: () => getEtcDocumentCode(editingEtcDocumentCode!.id), enabled: Boolean(editingEtcDocumentCode) });
  const engineeringDocumentCodesQuery = useQuery({ queryKey: engineeringDocumentCodesQueryKey, queryFn: getEngineeringDocumentCodes });
  const deactivatedEngineeringDocumentCodesQuery = useQuery({ queryKey: deactivatedEngineeringDocumentCodesQueryKey, queryFn: getDeactivatedEngineeringDocumentCodes });
  const engineeringDocumentCodeDetailsQuery = useQuery({ queryKey: ['engineering-document-codes', editingEngineeringDocumentCode?.id], queryFn: () => getEngineeringDocumentCode(editingEngineeringDocumentCode!.id), enabled: Boolean(editingEngineeringDocumentCode) });
  const designationsQuery = useQuery({ queryKey: designationsQueryKey, queryFn: getDesignations });
  const designationDetailsQuery = useQuery({ queryKey: ['designations', editingDesignation?.id], queryFn: () => getDesignation(editingDesignation!.id), enabled: Boolean(editingDesignation) });
  const workspaceDivisionsQuery = useDivisions(settingsCategory === 'workspace');
  const divisionLeadQueries = useQueries({ queries: (workspaceDivisionsQuery.data?.items ?? []).map((division) => ({ queryKey: ['division-lead', division.id], queryFn: () => getDivisionLead(division.id), enabled: settingsCategory === 'workspace' && workspaceTab === 'divisions' })) });
  const divisionRosterMembersQuery = useMembers(Boolean(divisionRosterTarget));
  const workspaceTeamsQuery = useTeams(settingsCategory === 'workspace' && workspaceTab === 'teams');
  const divisionLeadQuery = useQuery({ queryKey: ['division-lead', divisionLeadTarget?.id], queryFn: () => getDivisionLead(divisionLeadTarget!.id), enabled: Boolean(divisionLeadTarget) });
  const eligibleDivisionLeadMembersQuery = useQuery({ queryKey: ['members', 'eligible', 'division', divisionLeadTarget?.id], queryFn: () => getEligibleMembers({ divisionId: divisionLeadTarget!.id }), enabled: Boolean(divisionLeadTarget) });
  const eligibleTeamTarget = teamLeadTarget ?? teamMemberTarget;
  const eligibleTeamMembersQuery = useQuery({ queryKey: ['members', 'eligible', 'team', eligibleTeamTarget?.id], queryFn: () => getEligibleMembers({ teamId: eligibleTeamTarget!.id }), enabled: Boolean(eligibleTeamTarget) });
  const divisionRosterLeadQuery = useQuery({ queryKey: ['division-lead', divisionRosterTarget?.id], queryFn: () => getDivisionLead(divisionRosterTarget!.id), enabled: Boolean(divisionRosterTarget) });
  const teamRosterMembersQuery = useQuery({ queryKey: ['teams', teamRosterTarget?.id, 'members'], queryFn: () => getTeamMembers(teamRosterTarget!.id), enabled: Boolean(teamRosterTarget) });
  const setDivisionLeadMutation = useMutation({
    mutationFn: ({ divisionId, memberId }: { divisionId: string; memberId: string }) => setDivisionLead(divisionId, memberId),
    onSuccess: (assignment) => {
      toast.success('Division lead assigned successfully.');
      setDivisionLeadIds((current) => ({ ...current, [assignment.division.id]: assignment.member.id }));
      void queryClient.invalidateQueries({ queryKey: ['division-lead'] });
      setDivisionLeadTarget(null);
      setDivisionLeadMemberId('');
    },
    onError: () => toast.error('Unable to assign the division lead.'),
  });
  const setTeamLeadMutation = useMutation({ mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) => setTeamLead(teamId, memberId), onSuccess: () => { toast.success('Team lead assigned successfully.'); void queryClient.invalidateQueries({ queryKey: ['teams'] }); setTeamLeadTarget(null); setTeamLeadMemberId(''); }, onError: () => toast.error('Unable to assign the team lead.') });
  const addTeamMemberMutation = useMutation({ mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) => addTeamMember(teamId, memberId), onSuccess: () => { toast.success('Member added to team successfully.'); void queryClient.invalidateQueries({ queryKey: ['teams'] }); setTeamMemberTarget(null); setTeamMemberId(''); }, onError: () => toast.error('Unable to add the team member.') });

  useEffect(() => {
    if (window.location.hash === '#workspace') setSettingsCategory('workspace');
  }, []);
  useEffect(() => {
    if (divisionLeadQuery.data?.member.id) setDivisionLeadMemberId(divisionLeadQuery.data.member.id);
  }, [divisionLeadQuery.data]);
  useEffect(() => {
    setDivisionLeadIds((current) => {
      const next = { ...current };
      let changed = false;
      (workspaceDivisionsQuery.data?.items ?? []).forEach((division, index) => {
        const leadId = divisionLeadQueries[index]?.data?.member.id;
        if (leadId && next[division.id] !== leadId) {
          next[division.id] = leadId;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [divisionLeadQueries, workspaceDivisionsQuery.data]);

  useEffect(() => {
    if (editingCode && codeDetailsQuery.data) setName(codeDetailsQuery.data.name);
  }, [editingCode, codeDetailsQuery.data]);

  useEffect(() => {
    if (editingPodCode && podCodeDetailsQuery.data) setPodName(podCodeDetailsQuery.data.name);
  }, [editingPodCode, podCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingCargoCode && cargoCodeDetailsQuery.data) {
      setCargoName(cargoCodeDetailsQuery.data.name);
      setCargoCode(cargoCodeDetailsQuery.data.code);
    }
  }, [editingCargoCode, cargoCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingVesselCode && vesselCodeDetailsQuery.data) {
      setVesselName(vesselCodeDetailsQuery.data.name);
      setVesselCode(vesselCodeDetailsQuery.data.code);
    }
  }, [editingVesselCode, vesselCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingGeneralDocumentCode && generalDocumentCodeDetailsQuery.data) {
      setGeneralDocumentCodeName(generalDocumentCodeDetailsQuery.data.name);
      setGeneralDocumentCodeValue(generalDocumentCodeDetailsQuery.data.code);
      setGeneralDocumentCodeDescription(generalDocumentCodeDetailsQuery.data.description ?? '');
    }
  }, [editingGeneralDocumentCode, generalDocumentCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingProjectManagementOperationDocumentCode && projectManagementOperationDocumentCodeDetailsQuery.data) {
      setProjectManagementOperationDocumentCodeName(projectManagementOperationDocumentCodeDetailsQuery.data.name);
      setProjectManagementOperationDocumentCodeValue(projectManagementOperationDocumentCodeDetailsQuery.data.code);
      setProjectManagementOperationDocumentCodeDescription(projectManagementOperationDocumentCodeDetailsQuery.data.description ?? '');
    }
  }, [editingProjectManagementOperationDocumentCode, projectManagementOperationDocumentCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingMarketingDocumentCode && marketingDocumentCodeDetailsQuery.data) {
      setMarketingDocumentCodeName(marketingDocumentCodeDetailsQuery.data.name);
      setMarketingDocumentCodeValue(marketingDocumentCodeDetailsQuery.data.code);
      setMarketingDocumentCodeDescription(marketingDocumentCodeDetailsQuery.data.description ?? '');
    }
  }, [editingMarketingDocumentCode, marketingDocumentCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingEtcDocumentCode && etcDocumentCodeDetailsQuery.data) {
      setEtcDocumentCodeName(etcDocumentCodeDetailsQuery.data.name);
      setEtcDocumentCodeValue(etcDocumentCodeDetailsQuery.data.code);
      setEtcDocumentCodeDescription(etcDocumentCodeDetailsQuery.data.description ?? '');
    }
  }, [editingEtcDocumentCode, etcDocumentCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingEngineeringDocumentCode && engineeringDocumentCodeDetailsQuery.data) {
      setEngineeringDocumentCodeName(engineeringDocumentCodeDetailsQuery.data.name);
      setEngineeringDocumentCodeValue(engineeringDocumentCodeDetailsQuery.data.code);
      setEngineeringDocumentCodeDescription(engineeringDocumentCodeDetailsQuery.data.description ?? '');
    }
  }, [editingEngineeringDocumentCode, engineeringDocumentCodeDetailsQuery.data]);

  useEffect(() => {
    if (editingDesignation && designationDetailsQuery.data) setDesignationName(designationDetailsQuery.data.name);
  }, [editingDesignation, designationDetailsQuery.data]);

  const refreshPolCodes = () => Promise.all([queryClient.invalidateQueries({ queryKey: polCodesQueryKey }), queryClient.invalidateQueries({ queryKey: deactivatedPolCodesQueryKey })]);
  const refreshPodCodes = () => Promise.all([queryClient.invalidateQueries({ queryKey: podCodesQueryKey }), queryClient.invalidateQueries({ queryKey: deactivatedPodCodesQueryKey })]);
  const refreshCargoCodes = () => Promise.all([queryClient.invalidateQueries({ queryKey: cargoCodesQueryKey }), queryClient.invalidateQueries({ queryKey: deactivatedCargoCodesQueryKey })]);
  const refreshVesselCodes = () => Promise.all([queryClient.invalidateQueries({ queryKey: vesselCodesQueryKey }), queryClient.invalidateQueries({ queryKey: deactivatedVesselCodesQueryKey })]);
  const refreshGeneralDocumentCodes = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: generalDocumentCodesQueryKey }),
    queryClient.invalidateQueries({ queryKey: deactivatedGeneralDocumentCodesQueryKey }),
  ]);
  const refreshProjectManagementOperationDocumentCodes = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: projectManagementOperationDocumentCodesQueryKey }),
    queryClient.invalidateQueries({ queryKey: deactivatedProjectManagementOperationDocumentCodesQueryKey }),
  ]);
  const refreshMarketingDocumentCodes = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: marketingDocumentCodesQueryKey }),
    queryClient.invalidateQueries({ queryKey: deactivatedMarketingDocumentCodesQueryKey }),
  ]);
  const refreshEtcDocumentCodes = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: etcDocumentCodesQueryKey }),
    queryClient.invalidateQueries({ queryKey: deactivatedEtcDocumentCodesQueryKey }),
  ]);
  const refreshEngineeringDocumentCodes = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: engineeringDocumentCodesQueryKey }),
    queryClient.invalidateQueries({ queryKey: deactivatedEngineeringDocumentCodesQueryKey }),
  ]);
  const refreshDesignations = () => queryClient.invalidateQueries({ queryKey: designationsQueryKey });

  const saveMutation = useMutation({
    mutationFn: (value: string) => editingCode ? updatePolCode(editingCode.id, { name: value }) : createPolCode({ name: value }),
    onSuccess: () => {
      toast.success(editingCode ? 'POL Code updated successfully.' : 'POL Code created successfully.');
      void refreshPolCodes();
      closeModal();
    },
    onError: () => toast.error('Unable to save the POL Code. Please try again.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<PolCode, 'id' | 'isActive'>) => isActive ? deactivatePolCode(id) : reactivatePolCode(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'POL Code deactivated successfully.' : 'POL Code reactivated successfully.');
      void refreshPolCodes();
    },
    onError: () => toast.error('Unable to update the POL Code status. Please try again.'),
  });

  const savePodMutation = useMutation({
    mutationFn: (value: string) => editingPodCode ? updatePodCode(editingPodCode.id, { name: value }) : createPodCode({ name: value }),
    onSuccess: () => {
      toast.success(editingPodCode ? 'POD Code updated successfully.' : 'POD Code created successfully.');
      void refreshPodCodes();
      closePodModal();
    },
    onError: () => toast.error('Unable to save the POD Code. Please try again.'),
  });

  const podStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<PodCode, 'id' | 'isActive'>) => isActive ? deactivatePodCode(id) : reactivatePodCode(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'POD Code deactivated successfully.' : 'POD Code reactivated successfully.');
      void refreshPodCodes();
    },
    onError: () => toast.error('Unable to update the POD Code status. Please try again.'),
  });

  const saveCargoMutation = useMutation({
    mutationFn: (payload: { name: string; code: string }) => editingCargoCode ? updateCargoCode(editingCargoCode.id, payload) : createCargoCode(payload),
    onSuccess: () => {
      toast.success(editingCargoCode ? 'Cargo Code updated successfully.' : 'Cargo Code created successfully.');
      void refreshCargoCodes();
      closeCargoModal();
    },
    onError: () => toast.error('Unable to save the Cargo Code. Please try again.'),
  });

  const cargoStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<CargoCode, 'id' | 'isActive'>) => isActive ? deactivateCargoCode(id) : reactivateCargoCode(id),
    onSuccess: (_, variables) => { toast.success(variables.isActive ? 'Cargo Code deactivated successfully.' : 'Cargo Code reactivated successfully.'); void refreshCargoCodes(); },
    onError: () => toast.error('Unable to update the Cargo Code status. Please try again.'),
  });

  const saveVesselMutation = useMutation({
    mutationFn: (payload: { name: string; code: string }) => editingVesselCode ? updateVesselCode(editingVesselCode.id, payload) : createVesselCode(payload),
    onSuccess: () => {
      toast.success(editingVesselCode ? 'Vessel Code updated successfully.' : 'Vessel Code created successfully.');
      void refreshVesselCodes();
      closeVesselModal();
    },
    onError: () => toast.error('Unable to save the Vessel Code. Please try again.'),
  });

  const vesselStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<VesselCode, 'id' | 'isActive'>) => isActive ? deactivateVesselCode(id) : reactivateVesselCode(id),
    onSuccess: (_, variables) => { toast.success(variables.isActive ? 'Vessel Code deactivated successfully.' : 'Vessel Code reactivated successfully.'); void refreshVesselCodes(); },
    onError: () => toast.error('Unable to update the Vessel Code status. Please try again.'),
  });

  const saveGeneralDocumentCodeMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description: string }) => {
      const normalizedPayload = { ...payload, description: payload.description || null };
      return editingGeneralDocumentCode
        ? updateGeneralDocumentCode(editingGeneralDocumentCode.id, normalizedPayload)
        : createGeneralDocumentCode(normalizedPayload);
    },
    onSuccess: () => {
      toast.success(editingGeneralDocumentCode ? 'General Document Code updated successfully.' : 'General Document Code created successfully.');
      void refreshGeneralDocumentCodes();
      closeGeneralDocumentCodeModal();
    },
    onError: () => toast.error('Unable to save the General Document Code. Please try again.'),
  });

  const generalDocumentCodeStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<GeneralDocumentCode, 'id' | 'isActive'>) => isActive ? deactivateGeneralDocumentCode(id) : reactivateGeneralDocumentCode(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'General Document Code deactivated successfully.' : 'General Document Code reactivated successfully.');
      void refreshGeneralDocumentCodes();
    },
    onError: () => toast.error('Unable to update the General Document Code status. Please try again.'),
  });

  const saveProjectManagementOperationDocumentCodeMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description: string }) => {
      const normalizedPayload = { ...payload, description: payload.description || null };
      return editingProjectManagementOperationDocumentCode
        ? updateProjectManagementOperationDocumentCode(editingProjectManagementOperationDocumentCode.id, normalizedPayload)
        : createProjectManagementOperationDocumentCode(normalizedPayload);
    },
    onSuccess: () => {
      toast.success(editingProjectManagementOperationDocumentCode ? 'PM & Operation Document Code updated successfully.' : 'PM & Operation Document Code created successfully.');
      void refreshProjectManagementOperationDocumentCodes();
      closeProjectManagementOperationDocumentCodeModal();
    },
    onError: () => toast.error('Unable to save the PM & Operation Document Code. Please try again.'),
  });

  const projectManagementOperationDocumentCodeStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<ProjectManagementOperationDocumentCode, 'id' | 'isActive'>) => isActive ? deactivateProjectManagementOperationDocumentCode(id) : reactivateProjectManagementOperationDocumentCode(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'PM & Operation Document Code deactivated successfully.' : 'PM & Operation Document Code reactivated successfully.');
      void refreshProjectManagementOperationDocumentCodes();
    },
    onError: () => toast.error('Unable to update the PM & Operation Document Code status. Please try again.'),
  });

  const saveMarketingDocumentCodeMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description: string }) => {
      const normalizedPayload = { ...payload, description: payload.description || null };
      return editingMarketingDocumentCode ? updateMarketingDocumentCode(editingMarketingDocumentCode.id, normalizedPayload) : createMarketingDocumentCode(normalizedPayload);
    },
    onSuccess: () => {
      toast.success(editingMarketingDocumentCode ? 'Marketing Document Code updated successfully.' : 'Marketing Document Code created successfully.');
      void refreshMarketingDocumentCodes();
      closeMarketingDocumentCodeModal();
    },
    onError: () => toast.error('Unable to save the Marketing Document Code. Please try again.'),
  });

  const marketingDocumentCodeStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<MarketingDocumentCode, 'id' | 'isActive'>) => isActive ? deactivateMarketingDocumentCode(id) : reactivateMarketingDocumentCode(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Marketing Document Code deactivated successfully.' : 'Marketing Document Code reactivated successfully.');
      void refreshMarketingDocumentCodes();
    },
    onError: () => toast.error('Unable to update the Marketing Document Code status. Please try again.'),
  });

  const saveEtcDocumentCodeMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description: string }) => {
      const normalizedPayload = { ...payload, description: payload.description || null };
      return editingEtcDocumentCode ? updateEtcDocumentCode(editingEtcDocumentCode.id, normalizedPayload) : createEtcDocumentCode(normalizedPayload);
    },
    onSuccess: () => {
      toast.success(editingEtcDocumentCode ? 'ETC Document Code updated successfully.' : 'ETC Document Code created successfully.');
      void refreshEtcDocumentCodes();
      closeEtcDocumentCodeModal();
    },
    onError: () => toast.error('Unable to save the ETC Document Code. Please try again.'),
  });

  const etcDocumentCodeStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<EtcDocumentCode, 'id' | 'isActive'>) => isActive ? deactivateEtcDocumentCode(id) : reactivateEtcDocumentCode(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'ETC Document Code deactivated successfully.' : 'ETC Document Code reactivated successfully.');
      void refreshEtcDocumentCodes();
    },
    onError: () => toast.error('Unable to update the ETC Document Code status. Please try again.'),
  });

  const saveEngineeringDocumentCodeMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description: string }) => {
      const normalizedPayload = { ...payload, description: payload.description || null };
      return editingEngineeringDocumentCode ? updateEngineeringDocumentCode(editingEngineeringDocumentCode.id, normalizedPayload) : createEngineeringDocumentCode(normalizedPayload);
    },
    onSuccess: () => {
      toast.success(editingEngineeringDocumentCode ? 'Engineering Document Code updated successfully.' : 'Engineering Document Code created successfully.');
      void refreshEngineeringDocumentCodes();
      closeEngineeringDocumentCodeModal();
    },
    onError: () => toast.error('Unable to save the Engineering Document Code. Please try again.'),
  });

  const engineeringDocumentCodeStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: Pick<EngineeringDocumentCode, 'id' | 'isActive'>) => isActive ? deactivateEngineeringDocumentCode(id) : reactivateEngineeringDocumentCode(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Engineering Document Code deactivated successfully.' : 'Engineering Document Code reactivated successfully.');
      void refreshEngineeringDocumentCodes();
    },
    onError: () => toast.error('Unable to update the Engineering Document Code status. Please try again.'),
  });

  const saveDesignationMutation = useMutation({
    mutationFn: (name: string) => editingDesignation ? updateDesignation(editingDesignation.id, { name }) : createDesignation({ name }),
    onSuccess: () => {
      toast.success(editingDesignation ? 'Designation updated successfully.' : 'Designation created successfully.');
      void refreshDesignations();
      closeDesignationModal();
    },
    onError: () => toast.error('Unable to save the designation. Please try again.'),
  });

  const deleteDesignationMutation = useMutation({
    mutationFn: deleteDesignation,
    onSuccess: () => {
      toast.success('Designation deleted successfully.');
      void refreshDesignations();
    },
    onError: () => toast.error('Unable to delete this designation. It may be assigned to one or more members.'),
  });

  function openCreate() {
    setEditingCode(null);
    setName('');
    setIsModalOpen(true);
  }

  function openEdit(code: PolCode) {
    setEditingCode(code);
    setName(code.name);
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingCode(null);
    setName('');
    setIsModalOpen(false);
  }

  function openCreatePodCode() {
    setEditingPodCode(null);
    setPodName('');
    setIsPodModalOpen(true);
  }

  function openEditPodCode(code: PodCode) {
    setEditingPodCode(code);
    setPodName(code.name);
    setIsPodModalOpen(true);
  }

  function closePodModal() {
    setEditingPodCode(null);
    setPodName('');
    setIsPodModalOpen(false);
  }

  function openCreateCargoCode() { setEditingCargoCode(null); setCargoName(''); setCargoCode(''); setIsCargoModalOpen(true); }
  function openEditCargoCode(value: CargoCode) { setEditingCargoCode(value); setCargoName(value.name); setCargoCode(value.code); setIsCargoModalOpen(true); }
  function closeCargoModal() { setEditingCargoCode(null); setCargoName(''); setCargoCode(''); setIsCargoModalOpen(false); }
  function openCreateVesselCode() { setEditingVesselCode(null); setVesselName(''); setVesselCode(''); setIsVesselModalOpen(true); }
  function openEditVesselCode(value: VesselCode) { setEditingVesselCode(value); setVesselName(value.name); setVesselCode(value.code); setIsVesselModalOpen(true); }
  function closeVesselModal() { setEditingVesselCode(null); setVesselName(''); setVesselCode(''); setIsVesselModalOpen(false); }
  function openCreateGeneralDocumentCode() { setEditingGeneralDocumentCode(null); setGeneralDocumentCodeName(''); setGeneralDocumentCodeValue(''); setGeneralDocumentCodeDescription(''); setIsGeneralDocumentCodeModalOpen(true); }
  function openEditGeneralDocumentCode(value: GeneralDocumentCode) { setEditingGeneralDocumentCode(value); setGeneralDocumentCodeName(value.name); setGeneralDocumentCodeValue(value.code); setGeneralDocumentCodeDescription(value.description ?? ''); setIsGeneralDocumentCodeModalOpen(true); }
  function closeGeneralDocumentCodeModal() { setEditingGeneralDocumentCode(null); setGeneralDocumentCodeName(''); setGeneralDocumentCodeValue(''); setGeneralDocumentCodeDescription(''); setIsGeneralDocumentCodeModalOpen(false); }
  function openCreateProjectManagementOperationDocumentCode() { setEditingProjectManagementOperationDocumentCode(null); setProjectManagementOperationDocumentCodeName(''); setProjectManagementOperationDocumentCodeValue(''); setProjectManagementOperationDocumentCodeDescription(''); setIsProjectManagementOperationDocumentCodeModalOpen(true); }
  function openEditProjectManagementOperationDocumentCode(value: ProjectManagementOperationDocumentCode) { setEditingProjectManagementOperationDocumentCode(value); setProjectManagementOperationDocumentCodeName(value.name); setProjectManagementOperationDocumentCodeValue(value.code); setProjectManagementOperationDocumentCodeDescription(value.description ?? ''); setIsProjectManagementOperationDocumentCodeModalOpen(true); }
  function closeProjectManagementOperationDocumentCodeModal() { setEditingProjectManagementOperationDocumentCode(null); setProjectManagementOperationDocumentCodeName(''); setProjectManagementOperationDocumentCodeValue(''); setProjectManagementOperationDocumentCodeDescription(''); setIsProjectManagementOperationDocumentCodeModalOpen(false); }
  function openCreateMarketingDocumentCode() { setEditingMarketingDocumentCode(null); setMarketingDocumentCodeName(''); setMarketingDocumentCodeValue(''); setMarketingDocumentCodeDescription(''); setIsMarketingDocumentCodeModalOpen(true); }
  function openEditMarketingDocumentCode(value: MarketingDocumentCode) { setEditingMarketingDocumentCode(value); setMarketingDocumentCodeName(value.name); setMarketingDocumentCodeValue(value.code); setMarketingDocumentCodeDescription(value.description ?? ''); setIsMarketingDocumentCodeModalOpen(true); }
  function closeMarketingDocumentCodeModal() { setEditingMarketingDocumentCode(null); setMarketingDocumentCodeName(''); setMarketingDocumentCodeValue(''); setMarketingDocumentCodeDescription(''); setIsMarketingDocumentCodeModalOpen(false); }
  function openCreateEtcDocumentCode() { setEditingEtcDocumentCode(null); setEtcDocumentCodeName(''); setEtcDocumentCodeValue(''); setEtcDocumentCodeDescription(''); setIsEtcDocumentCodeModalOpen(true); }
  function openEditEtcDocumentCode(value: EtcDocumentCode) { setEditingEtcDocumentCode(value); setEtcDocumentCodeName(value.name); setEtcDocumentCodeValue(value.code); setEtcDocumentCodeDescription(value.description ?? ''); setIsEtcDocumentCodeModalOpen(true); }
  function closeEtcDocumentCodeModal() { setEditingEtcDocumentCode(null); setEtcDocumentCodeName(''); setEtcDocumentCodeValue(''); setEtcDocumentCodeDescription(''); setIsEtcDocumentCodeModalOpen(false); }
  function openCreateEngineeringDocumentCode() { setEditingEngineeringDocumentCode(null); setEngineeringDocumentCodeName(''); setEngineeringDocumentCodeValue(''); setEngineeringDocumentCodeDescription(''); setIsEngineeringDocumentCodeModalOpen(true); }
  function openEditEngineeringDocumentCode(value: EngineeringDocumentCode) { setEditingEngineeringDocumentCode(value); setEngineeringDocumentCodeName(value.name); setEngineeringDocumentCodeValue(value.code); setEngineeringDocumentCodeDescription(value.description ?? ''); setIsEngineeringDocumentCodeModalOpen(true); }
  function closeEngineeringDocumentCodeModal() { setEditingEngineeringDocumentCode(null); setEngineeringDocumentCodeName(''); setEngineeringDocumentCodeValue(''); setEngineeringDocumentCodeDescription(''); setIsEngineeringDocumentCodeModalOpen(false); }
  function openCreateDesignation() { setEditingDesignation(null); setDesignationName(''); setIsDesignationModalOpen(true); }
  function openEditDesignation(value: Designation) { setEditingDesignation(value); setDesignationName(value.name); setIsDesignationModalOpen(true); }
  function closeDesignationModal() { setEditingDesignation(null); setDesignationName(''); setIsDesignationModalOpen(false); }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName) saveMutation.mutate(normalizedName);
  }

  function handlePodSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = podName.trim();
    if (normalizedName) savePodMutation.mutate(normalizedName);
  }

  function handleCargoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = cargoName.trim();
    const code = cargoCode.trim();
    if (name && code) saveCargoMutation.mutate({ name, code });
  }

  function handleVesselSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = vesselName.trim();
    const code = vesselCode.trim();
    if (name && code) saveVesselMutation.mutate({ name, code });
  }

  function handleGeneralDocumentCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = generalDocumentCodeName.trim();
    const code = generalDocumentCodeValue.trim();
    if (name && code) saveGeneralDocumentCodeMutation.mutate({ name, code, description: generalDocumentCodeDescription.trim() });
  }

  function handleProjectManagementOperationDocumentCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectManagementOperationDocumentCodeName.trim();
    const code = projectManagementOperationDocumentCodeValue.trim();
    if (name && code) saveProjectManagementOperationDocumentCodeMutation.mutate({ name, code, description: projectManagementOperationDocumentCodeDescription.trim() });
  }

  function handleMarketingDocumentCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = marketingDocumentCodeName.trim();
    const code = marketingDocumentCodeValue.trim();
    if (name && code) saveMarketingDocumentCodeMutation.mutate({ name, code, description: marketingDocumentCodeDescription.trim() });
  }

  function handleEtcDocumentCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = etcDocumentCodeName.trim();
    const code = etcDocumentCodeValue.trim();
    if (name && code) saveEtcDocumentCodeMutation.mutate({ name, code, description: etcDocumentCodeDescription.trim() });
  }

  function handleEngineeringDocumentCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = engineeringDocumentCodeName.trim();
    const code = engineeringDocumentCodeValue.trim();
    if (name && code) saveEngineeringDocumentCodeMutation.mutate({ name, code, description: engineeringDocumentCodeDescription.trim() });
  }

  function handleDesignationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = designationName.trim();
    if (name) saveDesignationMutation.mutate(name);
  }

  function handleDeleteDesignation(value: Designation) {
    setDesignationDeleteConfirmation(value);
  }

  const uniqueSorted = <T extends { id: string; sortOrder: number; name: string }>(values: T[]) => values.filter((value, index, all) => all.findIndex((item) => item.id === value.id) === index).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const polCodes = uniqueSorted([...(polCodesQuery.data ?? []), ...(deactivatedPolCodesQuery.data ?? [])]);
  const podCodes = uniqueSorted([...(podCodesQuery.data ?? []), ...(deactivatedPodCodesQuery.data ?? [])]);
  const cargoCodes = uniqueSorted([...(cargoCodesQuery.data ?? []), ...(deactivatedCargoCodesQuery.data ?? [])]);
  const vesselCodes = uniqueSorted([...(vesselCodesQuery.data ?? []), ...(deactivatedVesselCodesQuery.data ?? [])]);
  const generalDocumentCodes = [...(generalDocumentCodesQuery.data ?? []), ...(deactivatedGeneralDocumentCodesQuery.data ?? [])]
    .filter((value, index, all) => all.findIndex((item) => item.id === value.id) === index)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const projectManagementOperationDocumentCodes = [...(projectManagementOperationDocumentCodesQuery.data ?? []), ...(deactivatedProjectManagementOperationDocumentCodesQuery.data ?? [])]
    .filter((value, index, all) => all.findIndex((item) => item.id === value.id) === index)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const marketingDocumentCodes = [...(marketingDocumentCodesQuery.data ?? []), ...(deactivatedMarketingDocumentCodesQuery.data ?? [])]
    .filter((value, index, all) => all.findIndex((item) => item.id === value.id) === index)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const etcDocumentCodes = [...(etcDocumentCodesQuery.data ?? []), ...(deactivatedEtcDocumentCodesQuery.data ?? [])]
    .filter((value, index, all) => all.findIndex((item) => item.id === value.id) === index)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const engineeringDocumentCodes = [...(engineeringDocumentCodesQuery.data ?? []), ...(deactivatedEngineeringDocumentCodesQuery.data ?? [])]
    .filter((value, index, all) => all.findIndex((item) => item.id === value.id) === index)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const designations = designationsQuery.data?.items ?? [];
  const matchesSettingsSearch = (name: string, code = '') => !settingsSearch.trim() || `${name} ${code}`.toLowerCase().includes(settingsSearch.trim().toLowerCase());
  const matchesStatus = (isActive: boolean) => statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);
  let visiblePolCodes = polCodes.filter((value) => matchesSettingsSearch(value.name) && matchesStatus(value.isActive));
  let visiblePodCodes = podCodes.filter((value) => matchesSettingsSearch(value.name) && matchesStatus(value.isActive));
  let visibleCargoCodes = cargoCodes.filter((value) => matchesSettingsSearch(value.name, value.code) && matchesStatus(value.isActive));
  let visibleVesselCodes = vesselCodes.filter((value) => matchesSettingsSearch(value.name, value.code) && matchesStatus(value.isActive));
  const filteredGeneralDocumentCodes = generalDocumentCodes.filter((value) => matchesSettingsSearch(value.name, value.code) && matchesStatus(value.isActive));
  const filteredProjectManagementOperationDocumentCodes = projectManagementOperationDocumentCodes.filter((value) => matchesSettingsSearch(value.name, value.code) && matchesStatus(value.isActive));
  const filteredMarketingDocumentCodes = marketingDocumentCodes.filter((value) => matchesSettingsSearch(value.name, value.code) && matchesStatus(value.isActive));
  const filteredEtcDocumentCodes = etcDocumentCodes.filter((value) => matchesSettingsSearch(value.name, value.code) && matchesStatus(value.isActive));
  const filteredEngineeringDocumentCodes = engineeringDocumentCodes.filter((value) => matchesSettingsSearch(value.name, value.code) && matchesStatus(value.isActive));
  const documentTotalRows = documentTab === 'general' ? filteredGeneralDocumentCodes.length : documentTab === 'operation' ? filteredProjectManagementOperationDocumentCodes.length : documentTab === 'marketing' ? filteredMarketingDocumentCodes.length : documentTab === 'etc' ? filteredEtcDocumentCodes.length : filteredEngineeringDocumentCodes.length;
  const documentTotalPages = Math.max(1, Math.ceil(documentTotalRows / 10));
  const safeDocumentPage = Math.min(documentPage, documentTotalPages);
  const visibleGeneralDocumentCodes = pageItems(filteredGeneralDocumentCodes, safeDocumentPage);
  const visibleProjectManagementOperationDocumentCodes = pageItems(filteredProjectManagementOperationDocumentCodes, safeDocumentPage);
  const visibleMarketingDocumentCodes = pageItems(filteredMarketingDocumentCodes, safeDocumentPage);
  const visibleEtcDocumentCodes = pageItems(filteredEtcDocumentCodes, safeDocumentPage);
  const visibleEngineeringDocumentCodes = pageItems(filteredEngineeringDocumentCodes, safeDocumentPage);
  const pagedEngineeringDocumentCodes = visibleEngineeringDocumentCodes;
  useEffect(() => { setDocumentPage(1); }, [settingsSearch, statusFilter, documentTab]);
  let visibleDesignations = designations.filter((value) => matchesSettingsSearch(value.name));
  const settingsTotalRows = settingsCategory === 'location' ? (locationTab === 'pol' ? visiblePolCodes.length : visiblePodCodes.length) : settingsCategory === 'cargo' ? (cargoVesselTab === 'cargo' ? visibleCargoCodes.length : visibleVesselCodes.length) : settingsCategory === 'organization' ? visibleDesignations.length : 0;
  const settingsTotalPages = Math.max(1, Math.ceil(settingsTotalRows / 10));
  const safeSettingsPage = Math.min(settingsPage, settingsTotalPages);
  visiblePolCodes = pageItems(visiblePolCodes, safeSettingsPage); visiblePodCodes = pageItems(visiblePodCodes, safeSettingsPage); visibleCargoCodes = pageItems(visibleCargoCodes, safeSettingsPage); visibleVesselCodes = pageItems(visibleVesselCodes, safeSettingsPage); visibleDesignations = pageItems(visibleDesignations, safeSettingsPage);
  useEffect(() => { setSettingsPage(1); }, [settingsCategory, locationTab, cargoVesselTab, settingsSearch, statusFilter, setSettingsPage]);
  const workspaceDivisionNames = new Map((workspaceDivisionsQuery.data?.items ?? []).map((division) => [division.id, division.name]));
  const settingsSearchPlaceholder = settingsCategory === 'location' ? `Search ${locationTab.toUpperCase()} codes...` : settingsCategory === 'cargo' ? `Search ${cargoVesselTab} codes...` : settingsCategory === 'documents' ? `Search ${documentTab === 'operation' ? 'PM & Operation' : documentTab} document codes...` : settingsCategory === 'access' ? 'Search roles...' : settingsCategory === 'workspace' ? 'Search workspace records...' : 'Search designations...';
  const activeSettingsToolbar = settingsCategory === 'location' && locationTab === 'pol' ? { title: 'POL Codes', count: `${polCodes.length} records`, createLabel: 'Add POL Code', onCreate: openCreate } : settingsCategory === 'location' ? { title: 'POD Codes', count: `${podCodes.length} records`, createLabel: 'Add POD Code', onCreate: openCreatePodCode } : settingsCategory === 'cargo' && cargoVesselTab === 'cargo' ? { title: 'Cargo Codes', count: `${cargoCodes.length} records`, createLabel: 'Create Cargo Code', onCreate: openCreateCargoCode } : settingsCategory === 'cargo' ? { title: 'Vessel Codes', count: `${vesselCodes.length} records`, createLabel: 'Create Vessel Code', onCreate: openCreateVesselCode } : settingsCategory === 'documents' && documentTab === 'general' ? { title: 'General Document Codes', count: `${generalDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateGeneralDocumentCode } : settingsCategory === 'documents' && documentTab === 'operation' ? { title: 'PM & Operation Codes', count: `${projectManagementOperationDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateProjectManagementOperationDocumentCode } : settingsCategory === 'documents' && documentTab === 'marketing' ? { title: 'Marketing Codes', count: `${marketingDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateMarketingDocumentCode } : settingsCategory === 'documents' && documentTab === 'etc' ? { title: 'ETC Document Codes', count: `${etcDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateEtcDocumentCode } : settingsCategory === 'documents' ? { title: 'Engineering Document Codes', count: `${engineeringDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateEngineeringDocumentCode } : settingsCategory === 'organization' ? { title: 'Designations', count: `${designations.length} records`, createLabel: 'Create Designation', onCreate: openCreateDesignation } : null;
  const settingsLoading = settingsCategory === 'access' ? false : settingsCategory === 'location' ? (locationTab === 'pol' ? polCodesQuery.isLoading || deactivatedPolCodesQuery.isLoading : podCodesQuery.isLoading || deactivatedPodCodesQuery.isLoading) : settingsCategory === 'cargo' ? (cargoVesselTab === 'cargo' ? cargoCodesQuery.isLoading : vesselCodesQuery.isLoading) : settingsCategory === 'documents' ? (documentTab === 'general' ? generalDocumentCodesQuery.isLoading || deactivatedGeneralDocumentCodesQuery.isLoading : documentTab === 'operation' ? projectManagementOperationDocumentCodesQuery.isLoading || deactivatedProjectManagementOperationDocumentCodesQuery.isLoading : documentTab === 'marketing' ? marketingDocumentCodesQuery.isLoading || deactivatedMarketingDocumentCodesQuery.isLoading : documentTab === 'etc' ? etcDocumentCodesQuery.isLoading || deactivatedEtcDocumentCodesQuery.isLoading : engineeringDocumentCodesQuery.isLoading || deactivatedEngineeringDocumentCodesQuery.isLoading) : settingsCategory === 'organization' ? designationsQuery.isLoading : workspaceTab === 'divisions' ? workspaceDivisionsQuery.isLoading : workspaceTab === 'teams' ? workspaceTeamsQuery.isLoading : false;
  if (settingsLoading) return <div className="dash-page settings-center"><WorkspaceLoadingState description="Preparing settings, configuration records, and access controls." title={`Loading ${activeSettingsToolbar?.title ?? 'Settings'}`} /></div>;
  return (
    <div className="dash-page settings-center">
      {workspaceCreate ? <div className="workspace-create-modal-layer">{workspaceCreate.type === 'division' ? <CreateDivisionModal onClose={() => setWorkspaceCreate(null)} /> : <DashboardWorkspace createRequest={workspaceCreate.id} createType={workspaceCreate.type} modalOnly preselectedDivisionId={workspaceCreate.divisionId} />}</div> : null}
      <header className="dash-heading settings-center__header">
        <div>
          <h1>Settings</h1>
          <span>Configuration</span>
          <small>Manage system configuration, roles, codes and organizational settings.</small>
        </div>
      </header>
      <nav aria-label="Settings categories" className="settings-category-tabs">
        <button className={settingsCategory === 'access' ? 'is-active' : ''} onClick={() => setSettingsCategory('access')} type="button">Access &amp; Permissions</button>
        <button className={settingsCategory === 'location' ? 'is-active' : ''} onClick={() => setSettingsCategory('location')} type="button">Location Codes</button>
        <button className={settingsCategory === 'cargo' ? 'is-active' : ''} onClick={() => setSettingsCategory('cargo')} type="button">Cargo &amp; Vessel</button>
        <button className={settingsCategory === 'documents' ? 'is-active' : ''} onClick={() => setSettingsCategory('documents')} type="button">Document Codes</button>
        <button className={settingsCategory === 'organization' ? 'is-active' : ''} onClick={() => setSettingsCategory('organization')} type="button">Organization</button>
        <button className={settingsCategory === 'workspace' ? 'is-active' : ''} onClick={() => setSettingsCategory('workspace')} type="button">Workspace Records</button>
      </nav>
      {settingsCategory === 'location' ? <LocationCodeTabs onChange={setLocationTab} value={locationTab} /> : null}
      {settingsCategory === 'cargo' ? <CargoVesselTabs onChange={setCargoVesselTab} value={cargoVesselTab} /> : null}
      {settingsCategory === 'documents' ? <DocumentCodeTabs onChange={setDocumentTab} value={documentTab} /> : null}
      {activeSettingsToolbar ? <SettingsTableToolbar {...activeSettingsToolbar} onSearchChange={setSettingsSearch} searchPlaceholder={settingsSearchPlaceholder} searchValue={settingsSearch} statusFilter={settingsCategory === 'organization' || settingsCategory === 'access' ? undefined : statusFilter} onStatusChange={setStatusFilter} /> : null}
      {settingsCategory === 'access' ? <RolesSection /> : null}
      {settingsCategory === 'location' && locationTab === 'pol' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>POL Codes <small>Port of Loading</small></strong><span>{polCodesQuery.isLoading || deactivatedPolCodesQuery.isLoading ? 'Loading POL Codes' : `${polCodes.length} POL Code records`}</span><button onClick={openCreate} type="button">Add POL Code</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Sort order</span><span>Updated</span><span>Status</span><span>Actions</span></div>
          {polCodesQuery.isLoading || deactivatedPolCodesQuery.isLoading ? <div className="division-empty">Loading POL Codes...</div> : null}
          {polCodesQuery.isError || deactivatedPolCodesQuery.isError ? <div className="division-empty">Unable to load POL Codes.</div> : null}
          {!polCodesQuery.isLoading && !polCodesQuery.isError && !polCodes.length ? <div className="division-empty">No POL Codes available. Create the first one to get started.</div> : null}
          {!polCodesQuery.isLoading && !polCodesQuery.isError && polCodes.length > 0 && !visiblePolCodes.length ? <div className="division-empty">No matching records found. Try adjusting your search.</div> : null}
          {visiblePolCodes.map((code) => <div className="division-grid" key={code.id}><span><strong>{code.name}</strong></span><span>{code.sortOrder}</span><span>{formatDate(code.updatedAt)}</span><span><em className={code.isActive ? 'division-status division-status--active' : 'division-status'}>{code.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEdit(code)} type="button">Edit</button><button disabled={statusMutation.isPending && statusMutation.variables?.id === code.id} onClick={() => requestStatusChange(code.name, code.isActive, () => statusMutation.mutate({ id: code.id, isActive: code.isActive }))} type="button">{statusMutation.isPending && statusMutation.variables?.id === code.id ? 'Saving...' : code.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'cargo' && cargoVesselTab === 'cargo' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>Cargo Codes</strong><span>{cargoCodesQuery.isLoading ? 'Loading Cargo Codes' : `${cargoCodes.length} Cargo Code records`}</span><button onClick={openCreateCargoCode} type="button">Create Cargo Code</button></div>
        <div className="division-table"><div className="division-grid division-grid--head"><span>Name</span><span>Code</span><span>Sort order</span><span>Status</span><span>Actions</span></div>{cargoCodesQuery.isLoading ? <div className="division-empty">Loading Cargo Codes...</div> : null}{cargoCodesQuery.isError ? <div className="division-empty">Unable to load Cargo Codes.</div> : null}{!cargoCodesQuery.isLoading && !cargoCodesQuery.isError && !cargoCodes.length ? <div className="division-empty">No Cargo Codes available. Create the first one to get started.</div> : null}{!cargoCodesQuery.isLoading && !cargoCodesQuery.isError && cargoCodes.length > 0 && !visibleCargoCodes.length ? <div className="division-empty">No matching records found. Try adjusting your search.</div> : null}{visibleCargoCodes.map((value) => <div className="division-grid" key={value.id}><span><strong>{value.name}</strong></span><span>{value.code}</span><span>{value.sortOrder}</span><span><em className={value.isActive ? 'division-status division-status--active' : 'division-status'}>{value.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditCargoCode(value)} type="button">Edit</button><button disabled={cargoStatusMutation.isPending && cargoStatusMutation.variables?.id === value.id} onClick={() => requestStatusChange(value.name, value.isActive, () => cargoStatusMutation.mutate({ id: value.id, isActive: value.isActive }))} type="button">{cargoStatusMutation.isPending && cargoStatusMutation.variables?.id === value.id ? 'Saving...' : value.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}</div>
      </section> : null}
      {settingsCategory === 'cargo' && cargoVesselTab === 'vessel' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>Vessel Codes</strong><span>{vesselCodesQuery.isLoading ? 'Loading Vessel Codes' : `${vesselCodes.length} Vessel Code records`}</span><button onClick={openCreateVesselCode} type="button">Create Vessel Code</button></div>
        <div className="division-table"><div className="division-grid division-grid--head"><span>Name</span><span>Code</span><span>Sort order</span><span>Status</span><span>Actions</span></div>{vesselCodesQuery.isLoading ? <div className="division-empty">Loading Vessel Codes...</div> : null}{vesselCodesQuery.isError ? <div className="division-empty">Unable to load Vessel Codes.</div> : null}{!vesselCodesQuery.isLoading && !vesselCodesQuery.isError && !vesselCodes.length ? <div className="division-empty">No Vessel Codes available. Create the first one to get started.</div> : null}{!vesselCodesQuery.isLoading && !vesselCodesQuery.isError && vesselCodes.length > 0 && !visibleVesselCodes.length ? <div className="division-empty">No matching records found. Try adjusting your search.</div> : null}{visibleVesselCodes.map((value) => <div className="division-grid" key={value.id}><span><strong>{value.name}</strong></span><span>{value.code}</span><span>{value.sortOrder}</span><span><em className={value.isActive ? 'division-status division-status--active' : 'division-status'}>{value.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditVesselCode(value)} type="button">Edit</button><button disabled={vesselStatusMutation.isPending && vesselStatusMutation.variables?.id === value.id} onClick={() => requestStatusChange(value.name, value.isActive, () => vesselStatusMutation.mutate({ id: value.id, isActive: value.isActive }))} type="button">{vesselStatusMutation.isPending && vesselStatusMutation.variables?.id === value.id ? 'Saving...' : value.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}</div>
      </section> : null}
      {settingsCategory === 'location' && locationTab === 'pod' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>POD Codes <small>Port of Discharge</small></strong><span>{podCodesQuery.isLoading || deactivatedPodCodesQuery.isLoading ? 'Loading POD Codes' : `${podCodes.length} POD Code records`}</span><button onClick={openCreatePodCode} type="button">Add POD Code</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Sort order</span><span>Updated</span><span>Status</span><span>Actions</span></div>
          {podCodesQuery.isLoading || deactivatedPodCodesQuery.isLoading ? <div className="division-empty">Loading POD Codes...</div> : null}
          {podCodesQuery.isError || deactivatedPodCodesQuery.isError ? <div className="division-empty">Unable to load POD Codes.</div> : null}
          {!podCodesQuery.isLoading && !podCodesQuery.isError && !podCodes.length ? <div className="division-empty">No POD Codes available. Create the first one to get started.</div> : null}
          {!podCodesQuery.isLoading && !podCodesQuery.isError && podCodes.length > 0 && !visiblePodCodes.length ? <div className="division-empty">No matching records found. Try adjusting your search.</div> : null}
          {visiblePodCodes.map((code) => <div className="division-grid" key={code.id}><span><strong>{code.name}</strong></span><span>{code.sortOrder}</span><span>{formatDate(code.updatedAt)}</span><span><em className={code.isActive ? 'division-status division-status--active' : 'division-status'}>{code.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditPodCode(code)} type="button">Edit</button><button disabled={podStatusMutation.isPending && podStatusMutation.variables?.id === code.id} onClick={() => requestStatusChange(code.name, code.isActive, () => podStatusMutation.mutate({ id: code.id, isActive: code.isActive }))} type="button">{podStatusMutation.isPending && podStatusMutation.variables?.id === code.id ? 'Saving...' : code.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'documents' && documentTab === 'general' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>General Document Codes</strong><span>{generalDocumentCodesQuery.isLoading || deactivatedGeneralDocumentCodesQuery.isLoading ? 'Loading General Document Codes' : `${generalDocumentCodes.length} General Document Code records`}</span><button onClick={openCreateGeneralDocumentCode} type="button">Create General Document Code</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Code</span><span>Sort order</span><span>Status</span><span>Actions</span></div>
          {generalDocumentCodesQuery.isLoading || deactivatedGeneralDocumentCodesQuery.isLoading ? <div className="division-empty">Loading General Document Codes...</div> : null}
          {generalDocumentCodesQuery.isError || deactivatedGeneralDocumentCodesQuery.isError ? <div className="division-empty">Unable to load General Document Codes.</div> : null}
          {!generalDocumentCodesQuery.isLoading && !deactivatedGeneralDocumentCodesQuery.isLoading && !generalDocumentCodesQuery.isError && !deactivatedGeneralDocumentCodesQuery.isError && !generalDocumentCodes.length ? <div className="division-empty">No General Document Codes available. Create the first one to get started.</div> : null}
          {visibleGeneralDocumentCodes.map((value) => <div className="division-grid" key={value.id}><span><strong>{value.name}</strong>{value.description ? <small>{value.description}</small> : null}</span><span>{value.code}</span><span>{value.sortOrder}</span><span><em className={value.isActive ? 'division-status division-status--active' : 'division-status'}>{value.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditGeneralDocumentCode(value)} type="button">Edit</button><button disabled={generalDocumentCodeStatusMutation.isPending && generalDocumentCodeStatusMutation.variables?.id === value.id} onClick={() => requestStatusChange(value.name, value.isActive, () => generalDocumentCodeStatusMutation.mutate({ id: value.id, isActive: value.isActive }))} type="button">{generalDocumentCodeStatusMutation.isPending && generalDocumentCodeStatusMutation.variables?.id === value.id ? 'Saving...' : value.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'documents' && documentTab === 'operation' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>PM &amp; Operation Document Codes</strong><span>{projectManagementOperationDocumentCodesQuery.isLoading || deactivatedProjectManagementOperationDocumentCodesQuery.isLoading ? 'Loading PM & Operation Document Codes' : `${projectManagementOperationDocumentCodes.length} PM & Operation Document Code records`}</span><button onClick={openCreateProjectManagementOperationDocumentCode} type="button">Create PM &amp; Operation Document Code</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Code</span><span>Sort order</span><span>Status</span><span>Actions</span></div>
          {projectManagementOperationDocumentCodesQuery.isLoading || deactivatedProjectManagementOperationDocumentCodesQuery.isLoading ? <div className="division-empty">Loading PM &amp; Operation Document Codes...</div> : null}
          {projectManagementOperationDocumentCodesQuery.isError || deactivatedProjectManagementOperationDocumentCodesQuery.isError ? <div className="division-empty">Unable to load PM &amp; Operation Document Codes.</div> : null}
          {!projectManagementOperationDocumentCodesQuery.isLoading && !deactivatedProjectManagementOperationDocumentCodesQuery.isLoading && !projectManagementOperationDocumentCodesQuery.isError && !deactivatedProjectManagementOperationDocumentCodesQuery.isError && !projectManagementOperationDocumentCodes.length ? <div className="division-empty">No PM &amp; Operation Document Codes available. Create the first one to get started.</div> : null}
          {visibleProjectManagementOperationDocumentCodes.map((value) => <div className="division-grid" key={value.id}><span><strong>{value.name}</strong>{value.description ? <small>{value.description}</small> : null}</span><span>{value.code}</span><span>{value.sortOrder}</span><span><em className={value.isActive ? 'division-status division-status--active' : 'division-status'}>{value.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditProjectManagementOperationDocumentCode(value)} type="button">Edit</button><button disabled={projectManagementOperationDocumentCodeStatusMutation.isPending && projectManagementOperationDocumentCodeStatusMutation.variables?.id === value.id} onClick={() => requestStatusChange(value.name, value.isActive, () => projectManagementOperationDocumentCodeStatusMutation.mutate({ id: value.id, isActive: value.isActive }))} type="button">{projectManagementOperationDocumentCodeStatusMutation.isPending && projectManagementOperationDocumentCodeStatusMutation.variables?.id === value.id ? 'Saving...' : value.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'documents' && documentTab === 'marketing' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>Marketing Document Codes</strong><span>{marketingDocumentCodesQuery.isLoading || deactivatedMarketingDocumentCodesQuery.isLoading ? 'Loading Marketing Document Codes' : `${marketingDocumentCodes.length} Marketing Document Code records`}</span><button onClick={openCreateMarketingDocumentCode} type="button">Create Marketing Document Code</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Code</span><span>Sort order</span><span>Status</span><span>Actions</span></div>
          {marketingDocumentCodesQuery.isLoading || deactivatedMarketingDocumentCodesQuery.isLoading ? <div className="division-empty">Loading Marketing Document Codes...</div> : null}
          {marketingDocumentCodesQuery.isError || deactivatedMarketingDocumentCodesQuery.isError ? <div className="division-empty">Unable to load Marketing Document Codes.</div> : null}
          {!marketingDocumentCodesQuery.isLoading && !deactivatedMarketingDocumentCodesQuery.isLoading && !marketingDocumentCodesQuery.isError && !deactivatedMarketingDocumentCodesQuery.isError && !marketingDocumentCodes.length ? <div className="division-empty">No Marketing Document Codes available. Create the first one to get started.</div> : null}
          {visibleMarketingDocumentCodes.map((value) => <div className="division-grid" key={value.id}><span><strong>{value.name}</strong>{value.description ? <small>{value.description}</small> : null}</span><span>{value.code}</span><span>{value.sortOrder}</span><span><em className={value.isActive ? 'division-status division-status--active' : 'division-status'}>{value.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditMarketingDocumentCode(value)} type="button">Edit</button><button disabled={marketingDocumentCodeStatusMutation.isPending && marketingDocumentCodeStatusMutation.variables?.id === value.id} onClick={() => requestStatusChange(value.name, value.isActive, () => marketingDocumentCodeStatusMutation.mutate({ id: value.id, isActive: value.isActive }))} type="button">{marketingDocumentCodeStatusMutation.isPending && marketingDocumentCodeStatusMutation.variables?.id === value.id ? 'Saving...' : value.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'documents' && documentTab === 'etc' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>ETC Document Codes</strong><span>{etcDocumentCodesQuery.isLoading || deactivatedEtcDocumentCodesQuery.isLoading ? 'Loading ETC Document Codes' : `${etcDocumentCodes.length} ETC Document Code records`}</span><button onClick={openCreateEtcDocumentCode} type="button">Create ETC Document Code</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Code</span><span>Sort order</span><span>Status</span><span>Actions</span></div>
          {etcDocumentCodesQuery.isLoading || deactivatedEtcDocumentCodesQuery.isLoading ? <div className="division-empty">Loading ETC Document Codes...</div> : null}
          {etcDocumentCodesQuery.isError || deactivatedEtcDocumentCodesQuery.isError ? <div className="division-empty">Unable to load ETC Document Codes.</div> : null}
          {!etcDocumentCodesQuery.isLoading && !deactivatedEtcDocumentCodesQuery.isLoading && !etcDocumentCodesQuery.isError && !deactivatedEtcDocumentCodesQuery.isError && !etcDocumentCodes.length ? <div className="division-empty">No ETC Document Codes available. Create the first one to get started.</div> : null}
          {visibleEtcDocumentCodes.map((value) => <div className="division-grid" key={value.id}><span><strong>{value.name}</strong>{value.description ? <small>{value.description}</small> : null}</span><span>{value.code}</span><span>{value.sortOrder}</span><span><em className={value.isActive ? 'division-status division-status--active' : 'division-status'}>{value.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditEtcDocumentCode(value)} type="button">Edit</button><button disabled={etcDocumentCodeStatusMutation.isPending && etcDocumentCodeStatusMutation.variables?.id === value.id} onClick={() => requestStatusChange(value.name, value.isActive, () => etcDocumentCodeStatusMutation.mutate({ id: value.id, isActive: value.isActive }))} type="button">{etcDocumentCodeStatusMutation.isPending && etcDocumentCodeStatusMutation.variables?.id === value.id ? 'Saving...' : value.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'documents' && documentTab === 'engineering' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>Engineering Document Codes</strong><span>{engineeringDocumentCodesQuery.isLoading || deactivatedEngineeringDocumentCodesQuery.isLoading ? 'Loading Engineering Document Codes' : `${engineeringDocumentCodes.length} Engineering Document Code records`}</span><button onClick={openCreateEngineeringDocumentCode} type="button">Create Engineering Document Code</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Code</span><span>Sort order</span><span>Status</span><span>Actions</span></div>
          {engineeringDocumentCodesQuery.isLoading || deactivatedEngineeringDocumentCodesQuery.isLoading ? <div className="division-empty">Loading Engineering Document Codes...</div> : null}
          {engineeringDocumentCodesQuery.isError || deactivatedEngineeringDocumentCodesQuery.isError ? <div className="division-empty">Unable to load Engineering Document Codes.</div> : null}
          {!engineeringDocumentCodesQuery.isLoading && !deactivatedEngineeringDocumentCodesQuery.isLoading && !engineeringDocumentCodesQuery.isError && !deactivatedEngineeringDocumentCodesQuery.isError && !engineeringDocumentCodes.length ? <div className="division-empty">No Engineering Document Codes available. Create the first one to get started.</div> : null}
          {pagedEngineeringDocumentCodes.map((value) => <div className="division-grid" key={value.id}><span><strong>{value.name}</strong>{value.description ? <small>{value.description}</small> : null}</span><span>{value.code}</span><span>{value.sortOrder}</span><span><em className={value.isActive ? 'division-status division-status--active' : 'division-status'}>{value.isActive ? '● Active' : '● Inactive'}</em></span><span className="division-actions"><button onClick={() => openEditEngineeringDocumentCode(value)} type="button">Edit</button><button disabled={engineeringDocumentCodeStatusMutation.isPending && engineeringDocumentCodeStatusMutation.variables?.id === value.id} onClick={() => requestStatusChange(value.name, value.isActive, () => engineeringDocumentCodeStatusMutation.mutate({ id: value.id, isActive: value.isActive }))} type="button">{engineeringDocumentCodeStatusMutation.isPending && engineeringDocumentCodeStatusMutation.variables?.id === value.id ? 'Saving...' : value.isActive ? 'Deactivate' : 'Reactivate'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'documents' ? <TablePagination onPageChange={setDocumentPage} page={safeDocumentPage} total={documentTotalRows} totalPages={documentTotalPages} /> : null}
      {settingsCategory === 'organization' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><strong>Designations</strong><span>{designationsQuery.isLoading ? 'Loading designations' : `${designations.length} designation records`}</span><button onClick={openCreateDesignation} type="button">Create Designation</button></div>
        <div className="division-table">
          <div className="division-grid division-grid--head"><span>Name</span><span>Created</span><span>Updated</span><span /><span>Actions</span></div>
          {designationsQuery.isLoading ? <div className="division-empty">Loading designations...</div> : null}
          {designationsQuery.isError ? <div className="division-empty">Unable to load designations.</div> : null}
          {!designationsQuery.isLoading && !designationsQuery.isError && !designations.length ? <div className="division-empty">No designations available. Create the first one to get started.</div> : null}
          {visibleDesignations.map((designation) => <div className="division-grid" key={designation.id}><span><strong>{designation.name}</strong></span><span>{formatDate(designation.createdAt)}</span><span>{formatDate(designation.updatedAt)}</span><span /><span className="division-actions division-actions--destructive"><button onClick={() => openEditDesignation(designation)} type="button">Edit</button><button disabled={deleteDesignationMutation.isPending && deleteDesignationMutation.variables === designation.id} onClick={() => handleDeleteDesignation(designation)} type="button">{deleteDesignationMutation.isPending && deleteDesignationMutation.variables === designation.id ? 'Deleting...' : 'Delete'}</button></span></div>)}
        </div>
      </section> : null}
      {settingsCategory === 'workspace' ? <div className="settings-workspace-records" id="workspace">
        <nav aria-label="Workspace record types" className="settings-sub-tabs settings-workspace-tabs"><button className={workspaceTab === 'divisions' ? 'is-active' : ''} onClick={() => setWorkspaceTab('divisions')} type="button">Divisions</button><button className={workspaceTab === 'members' ? 'is-active' : ''} onClick={() => setWorkspaceTab('members')} type="button">Members</button><button className={workspaceTab === 'bids' ? 'is-active' : ''} onClick={() => setWorkspaceTab('bids')} type="button">Bids</button><button className={workspaceTab === 'projects' ? 'is-active' : ''} onClick={() => setWorkspaceTab('projects')} type="button">Projects</button><button className={workspaceTab === 'workRequests' ? 'is-active' : ''} onClick={() => setWorkspaceTab('workRequests')} type="button">Work Requests</button><button className={workspaceTab === 'teams' ? 'is-active' : ''} onClick={() => setWorkspaceTab('teams')} type="button">Teams</button></nav>
        {workspaceTab === 'divisions' ? <DivisionsSection onCreateMember={(divisionId) => setWorkspaceCreate({ type: 'member', id: Date.now(), divisionId })} onCreateTeam={(divisionId) => setWorkspaceCreate({ type: 'team', id: Date.now(), divisionId })} /> : null}
        {workspaceTab === 'members' ? <MembersSection divisionNames={workspaceDivisionNames} onManageRole={setMemberRoleTarget} /> : null}
        {workspaceTab === 'bids' ? <WorkspacePanelFilter label="Filter bids" value={bidFilter} onChange={setBidFilter}><BidsPanel filterText={bidFilter} /></WorkspacePanelFilter> : null}
        {workspaceTab === 'projects' ? <WorkspacePanelFilter label="Filter projects" value={projectFilter} onChange={setProjectFilter}><ProjectsPanel filterText={projectFilter} /></WorkspacePanelFilter> : null}
        {workspaceTab === 'workRequests' ? <WorkspacePanelFilter label="Filter work requests" value={workRequestFilter} onChange={setWorkRequestFilter}><WorkRequestsPage embedded filterText={workRequestFilter} /></WorkspacePanelFilter> : null}
        {workspaceTab === 'teams' ? <TeamsSection divisionNames={workspaceDivisionNames} onAddMember={(team) => { setTeamMemberTarget(team); setTeamMemberId(''); }} onAssignLead={(team, memberId) => { setTeamLeadTarget(team); setTeamLeadMemberId(memberId); }} /> : null}
      </div> : null}
      {settingsCategory !== 'documents' && settingsCategory !== 'workspace' ? <TablePagination onPageChange={setSettingsPage} page={safeSettingsPage} total={settingsTotalRows} totalPages={settingsTotalPages} /> : null}
      {designationDeleteConfirmation ? <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="delete-designation-title" aria-modal="true" className="division-modal status-confirmation-dialog" role="dialog"><div className="division-modal__head"><div><strong id="delete-designation-title">Delete designation?</strong><span>This action cannot be undone. Members using this designation may need to be updated.</span></div><button aria-label="Close delete confirmation" onClick={() => setDesignationDeleteConfirmation(null)} type="button">X</button></div><div className="status-confirmation-dialog__body"><p><strong>{designationDeleteConfirmation.name}</strong></p><p>Do you want to continue?</p></div><div className="division-form__actions"><button onClick={() => setDesignationDeleteConfirmation(null)} type="button">Cancel</button><button className="status-confirmation-dialog__deactivate" disabled={deleteDesignationMutation.isPending} onClick={() => { const designation = designationDeleteConfirmation; setDesignationDeleteConfirmation(null); deleteDesignationMutation.mutate(designation.id); }} type="button">{deleteDesignationMutation.isPending ? 'Deleting...' : 'Delete'}</button></div></section></div> : null}
      {statusConfirmation ? <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="status-confirmation-title" aria-modal="true" className="division-modal status-confirmation-dialog" role="dialog"><div className="division-modal__head"><div><strong id="status-confirmation-title">{statusConfirmation.isActive ? 'Deactivate configuration item?' : 'Reactivate configuration item?'}</strong><span>{statusConfirmation.isActive ? 'This item will no longer be available for new selections.' : 'This item will become available for new selections again.'}</span></div><button aria-label="Close confirmation dialog" onClick={() => setStatusConfirmation(null)} type="button">X</button></div><div className="status-confirmation-dialog__body"><p><strong>{statusConfirmation.name}</strong></p><p>Do you want to continue?</p></div><div className="division-form__actions"><button onClick={() => setStatusConfirmation(null)} type="button">Cancel</button><button className={statusConfirmation.isActive ? 'status-confirmation-dialog__deactivate' : 'status-confirmation-dialog__reactivate'} onClick={() => { const confirmation = statusConfirmation; setStatusConfirmation(null); confirmation.onConfirm(); }} type="button">{statusConfirmation.isActive ? 'Deactivate' : 'Reactivate'}</button></div></section></div> : null}
      {divisionLeadTarget ? <EligibleMemberAssignmentModal error={eligibleDivisionLeadMembersQuery.isError} loading={eligibleDivisionLeadMembersQuery.isLoading} members={eligibleDivisionLeadMembersQuery.data ?? []} onChange={setDivisionLeadMemberId} onClose={() => { setDivisionLeadTarget(null); setDivisionLeadMemberId(''); }} onSave={() => setDivisionLeadMutation.mutate({ divisionId: divisionLeadTarget.id, memberId: divisionLeadMemberId })} saving={setDivisionLeadMutation.isPending} submitLabel="Assign Lead" subtitle={`${divisionLeadTarget.name} (${divisionLeadTarget.abbr})`} title="Assign Division Lead" value={divisionLeadMemberId} /> : null}
      {divisionTeamTarget ? <DivisionTeamManagementModal division={divisionTeamTarget} onClose={() => setDivisionTeamTarget(null)} onCreateTeam={() => setWorkspaceCreate({ type: 'team', id: Date.now(), divisionId: divisionTeamTarget.id })} /> : null}
      {divisionRosterTarget ? <WorkspaceRosterModal lead={divisionRosterLeadQuery.data?.member ?? null} loading={divisionRosterLeadQuery.isLoading} members={(divisionRosterMembersQuery.data?.items ?? []).filter((member) => member.divisionId === divisionRosterTarget.id && member.id !== divisionRosterLeadQuery.data?.member.id)} onClose={() => setDivisionRosterTarget(null)} title={`${divisionRosterTarget.name} Division`} /> : null}
      {teamLeadTarget ? <EligibleMemberAssignmentModal error={eligibleTeamMembersQuery.isError} loading={eligibleTeamMembersQuery.isLoading} members={eligibleTeamMembersQuery.data ?? []} onChange={setTeamLeadMemberId} onClose={() => { setTeamLeadTarget(null); setTeamLeadMemberId(''); }} onSave={() => setTeamLeadMutation.mutate({ teamId: teamLeadTarget.id, memberId: teamLeadMemberId })} saving={setTeamLeadMutation.isPending} submitLabel="Set team lead" subtitle={teamLeadTarget.name} title="Assign Team Lead" value={teamLeadMemberId} /> : null}
      {teamMemberTarget ? <EligibleMemberAssignmentModal error={eligibleTeamMembersQuery.isError} loading={eligibleTeamMembersQuery.isLoading} members={eligibleTeamMembersQuery.data ?? []} onChange={setTeamMemberId} onClose={() => { setTeamMemberTarget(null); setTeamMemberId(''); }} onSave={() => addTeamMemberMutation.mutate({ teamId: teamMemberTarget.id, memberId: teamMemberId })} saving={addTeamMemberMutation.isPending} submitLabel="Add member" subtitle={teamMemberTarget.name} title="Add Team Member" value={teamMemberId} /> : null}
      {teamRosterTarget ? <WorkspaceRosterModal lead={teamRosterTarget.leadMember ?? teamRosterTarget.lead ?? null} loading={teamRosterMembersQuery.isLoading} members={teamRosterMembersQuery.data ?? []} onClose={() => setTeamRosterTarget(null)} title={`${teamRosterTarget.name} Team`} /> : null}
      {memberRoleTarget ? <ManageMemberRoleModal member={memberRoleTarget} onClose={() => setMemberRoleTarget(null)} /> : null}
      {isModalOpen ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editingCode ? 'Update POL Code' : 'Create POL Code'}</strong></div><button aria-label="Close POL Code dialog" onClick={closeModal} type="button">X</button></div><form className="division-form" onSubmit={handleSubmit}><label className="division-form__full"><span>POL Code name</span><input autoFocus maxLength={160} onChange={(event) => setName(event.target.value)} placeholder="Enter POL Code name" required value={name} /></label><div className="division-form__actions"><button onClick={closeModal} type="button">Cancel</button><button disabled={saveMutation.isPending || (Boolean(editingCode) && codeDetailsQuery.isLoading)} type="submit">{saveMutation.isPending ? 'Saving...' : editingCode ? 'Update POL Code' : 'Create POL Code'}</button></div></form></section></div> : null}
      {isPodModalOpen ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editingPodCode ? 'Update POD Code' : 'Create POD Code'}</strong></div><button aria-label="Close POD Code dialog" onClick={closePodModal} type="button">X</button></div><form className="division-form" onSubmit={handlePodSubmit}><label className="division-form__full"><span>POD Code name</span><input autoFocus maxLength={160} onChange={(event) => setPodName(event.target.value)} placeholder="Enter POD Code name" required value={podName} /></label><div className="division-form__actions"><button onClick={closePodModal} type="button">Cancel</button><button disabled={savePodMutation.isPending || (Boolean(editingPodCode) && podCodeDetailsQuery.isLoading)} type="submit">{savePodMutation.isPending ? 'Saving...' : editingPodCode ? 'Update POD Code' : 'Create POD Code'}</button></div></form></section></div> : null}
      {isCargoModalOpen ? <CodeModal code={cargoCode} editing={Boolean(editingCargoCode)} loadingDetails={cargoCodeDetailsQuery.isLoading} name={cargoName} onClose={closeCargoModal} onCodeChange={setCargoCode} onNameChange={setCargoName} onSubmit={handleCargoSubmit} saving={saveCargoMutation.isPending} title="Cargo" /> : null}
      {isVesselModalOpen ? <CodeModal code={vesselCode} editing={Boolean(editingVesselCode)} loadingDetails={vesselCodeDetailsQuery.isLoading} name={vesselName} onClose={closeVesselModal} onCodeChange={setVesselCode} onNameChange={setVesselName} onSubmit={handleVesselSubmit} saving={saveVesselMutation.isPending} title="Vessel" /> : null}
      {isGeneralDocumentCodeModalOpen ? <GeneralDocumentCodeModal code={generalDocumentCodeValue} description={generalDocumentCodeDescription} editing={Boolean(editingGeneralDocumentCode)} loadingDetails={generalDocumentCodeDetailsQuery.isLoading} name={generalDocumentCodeName} onClose={closeGeneralDocumentCodeModal} onCodeChange={setGeneralDocumentCodeValue} onDescriptionChange={setGeneralDocumentCodeDescription} onNameChange={setGeneralDocumentCodeName} onSubmit={handleGeneralDocumentCodeSubmit} saving={saveGeneralDocumentCodeMutation.isPending} /> : null}
      {isProjectManagementOperationDocumentCodeModalOpen ? <ProjectManagementOperationDocumentCodeModal code={projectManagementOperationDocumentCodeValue} description={projectManagementOperationDocumentCodeDescription} editing={Boolean(editingProjectManagementOperationDocumentCode)} loadingDetails={projectManagementOperationDocumentCodeDetailsQuery.isLoading} name={projectManagementOperationDocumentCodeName} onClose={closeProjectManagementOperationDocumentCodeModal} onCodeChange={setProjectManagementOperationDocumentCodeValue} onDescriptionChange={setProjectManagementOperationDocumentCodeDescription} onNameChange={setProjectManagementOperationDocumentCodeName} onSubmit={handleProjectManagementOperationDocumentCodeSubmit} saving={saveProjectManagementOperationDocumentCodeMutation.isPending} /> : null}
      {isMarketingDocumentCodeModalOpen ? <MarketingDocumentCodeModal code={marketingDocumentCodeValue} description={marketingDocumentCodeDescription} editing={Boolean(editingMarketingDocumentCode)} loadingDetails={marketingDocumentCodeDetailsQuery.isLoading} name={marketingDocumentCodeName} onClose={closeMarketingDocumentCodeModal} onCodeChange={setMarketingDocumentCodeValue} onDescriptionChange={setMarketingDocumentCodeDescription} onNameChange={setMarketingDocumentCodeName} onSubmit={handleMarketingDocumentCodeSubmit} saving={saveMarketingDocumentCodeMutation.isPending} /> : null}
      {isEtcDocumentCodeModalOpen ? <EtcDocumentCodeModal code={etcDocumentCodeValue} description={etcDocumentCodeDescription} editing={Boolean(editingEtcDocumentCode)} loadingDetails={etcDocumentCodeDetailsQuery.isLoading} name={etcDocumentCodeName} onClose={closeEtcDocumentCodeModal} onCodeChange={setEtcDocumentCodeValue} onDescriptionChange={setEtcDocumentCodeDescription} onNameChange={setEtcDocumentCodeName} onSubmit={handleEtcDocumentCodeSubmit} saving={saveEtcDocumentCodeMutation.isPending} /> : null}
      {isEngineeringDocumentCodeModalOpen ? <EngineeringDocumentCodeModal code={engineeringDocumentCodeValue} description={engineeringDocumentCodeDescription} editing={Boolean(editingEngineeringDocumentCode)} loadingDetails={engineeringDocumentCodeDetailsQuery.isLoading} name={engineeringDocumentCodeName} onClose={closeEngineeringDocumentCodeModal} onCodeChange={setEngineeringDocumentCodeValue} onDescriptionChange={setEngineeringDocumentCodeDescription} onNameChange={setEngineeringDocumentCodeName} onSubmit={handleEngineeringDocumentCodeSubmit} saving={saveEngineeringDocumentCodeMutation.isPending} /> : null}
      {isDesignationModalOpen ? <DesignationModal editing={Boolean(editingDesignation)} loadingDetails={designationDetailsQuery.isLoading} name={designationName} onClose={closeDesignationModal} onNameChange={setDesignationName} onSubmit={handleDesignationSubmit} saving={saveDesignationMutation.isPending} /> : null}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function CreateRoleModal({ mode, name, description, scope, scopes, scopesLoading, permissions, permissionIds, categories: selectedCategories, permissionsLoading, permissionsError, saving, onNameChange, onDescriptionChange, onScopeChange, onCategoriesChange, onTogglePermission, onToggleGroup, onSubmit, onClose }: { mode: 'create' | 'permissions'; name: string; description: string; scope: string; scopes: string[]; scopesLoading: boolean; permissions: Permission[]; permissionIds: string[]; categories: string[]; permissionsLoading: boolean; permissionsError: boolean; saving: boolean; onNameChange: (value: string) => void; onDescriptionChange: (value: string) => void; onScopeChange: (value: string) => void; onCategoriesChange: (values: string[]) => void; onTogglePermission: (id: string) => void; onToggleGroup: (ids: string[]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const categories = [...new Set(permissions.map((permission) => permission.category?.trim() || 'Uncategorized'))].sort();
  const matchesSearch = (permission: Permission) => !search.trim() || [permission.displayName, permission.code, permission.description ?? ''].some((value) => value.toLowerCase().includes(search.trim().toLowerCase()));
  const groupedPermissions: Array<[string, Permission[]]> = selectedCategories.map((category) => [category, permissions.filter((permission) => (permission.category?.trim() || 'Uncategorized') === category && matchesSearch(permission))]);
  // Keep every selected permission visible and submit it regardless of which
  // category is currently open.
  const selectedPermissions = permissions
    .filter((permission) => permissionIds.includes(permission.id))
    .sort((a, b) => (a.category || 'Uncategorized').localeCompare(b.category || 'Uncategorized') || (a.displayName || a.code).localeCompare(b.displayName || b.code))
    .map((permission) => ({ ...permission, displayName: permission.displayName || permission.name || permission.code }));
  const isCreate = mode === 'create';
  // Categories are a focused view: switching to a new one keeps its saved
  // permissions, but hides the previous category until the user returns to it.
  const toggleCategory = (category: string) => onCategoriesChange(selectedCategories.includes(category) ? [] : [category]);

  if (typeof window !== 'undefined') return <RolePermissionEditor categories={categories} description={description} isCreate={isCreate} name={name} onCategoriesChange={onCategoriesChange} onClose={onClose} onDescriptionChange={onDescriptionChange} onNameChange={onNameChange} onScopeChange={onScopeChange} onSubmit={onSubmit} onToggleGroup={onToggleGroup} onTogglePermission={onTogglePermission} permissionIds={permissionIds} permissions={permissions} permissionsError={permissionsError} permissionsLoading={permissionsLoading} saving={saving} scope={scope} scopes={scopes} scopesLoading={scopesLoading} selectedCategories={selectedCategories} />;

  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="role-editor-title" aria-modal="true" className="role-create-dialog" role="dialog"><header className="role-create-dialog__header"><div><h2 id="role-editor-title">{isCreate ? 'Create Role' : `Manage ${name} Permissions`}</h2><p>{isCreate ? 'Define an access role and choose the permissions it should include.' : 'Choose one or more categories, then update the permissions for this role.'}</p></div><button aria-label="Close role dialog" onClick={onClose} type="button">×</button></header><form className="role-create-form" onSubmit={onSubmit}><div className="role-create-dialog__body"><div className="role-create-fields">{isCreate ? <><label><span>Role name <b aria-hidden="true">*</b></span><input autoFocus maxLength={100} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. HR Coordinator" required value={name} /><small>Use a clear, recognizable access role name.</small></label><label className="role-create-fields__full"><span>Description <em>Optional</em></span><input maxLength={250} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Briefly describe this role’s responsibility" value={description} /></label></> : null}<label><span>Scope</span><select disabled={scopesLoading || !scopes.length} onChange={(event) => onScopeChange(event.target.value)} required value={scope}><option value="">{scopesLoading ? 'Loading scopes...' : scopes.length ? 'Select scope' : 'No scopes available'}</option>{scopes.map((value) => <option key={value} value={value}>{value}</option>)}</select><small>{isCreate ? 'Select the scope.' : 'Changing scope reloads the permissions available for this role.'}</small></label></div><section aria-labelledby="role-permissions-title" className="role-permission-selector"><div className="role-permission-selector__heading"><div><h3 id="role-permissions-title">Permissions</h3><p>Select one or more categories to keep all of their permission options visible.</p></div><strong>{permissionIds.length} permission{permissionIds.length === 1 ? '' : 's'} selected</strong></div><div className="role-category-picker"><div><strong>Permission categories</strong><span>Choose every category you need. Click again to remove it from view.</span></div><div className="role-category-picker__options">{categories.map((category) => <button aria-pressed={selectedCategories.includes(category)} className={selectedCategories.includes(category) ? 'is-selected' : ''} disabled={!scope || permissionsLoading} key={category} onClick={() => toggleCategory(category)} type="button"><span aria-hidden="true">{selectedCategories.includes(category) ? '✓' : '+'}</span>{category}</button>)}</div></div>{selectedCategories.length ? <div className="role-permission-search"><label><span>Search selected categories</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions" type="search" value={search} /></label></div> : null}<div className="role-permission-groups">{!scope ? <p className="role-permission-state">Select a scope to load permission categories.</p> : null}{permissionsLoading ? <p className="role-permission-state">Loading available permissions...</p> : null}{permissionsError ? <p className="role-form-error">We could not load the available permissions. Close this dialog and try again.</p> : null}{scope && !permissionsLoading && !permissionsError && !selectedCategories.length ? <p className="role-permission-state">Choose one or more categories above to see their permission options.</p> : null}{groupedPermissions.map(([category, categoryPermissions]) => categoryPermissions.length ? <section className="role-permission-group" key={category}><header><h4>{category}</h4><button onClick={() => onToggleGroup(categoryPermissions.map((permission) => permission.id))} type="button">{categoryPermissions.every((permission) => permissionIds.includes(permission.id)) ? 'Clear all' : 'Select all'}</button></header><div>{categoryPermissions.map((permission) => <label key={permission.id} title={permission.description || permission.code}><input checked={permissionIds.includes(permission.id)} onChange={() => onTogglePermission(permission.id)} type="checkbox" /><span>{permission.displayName || permission.name || permission.code}</span></label>)}</div></section> : <p className="role-permission-state" key={category}>No permissions in {category} match your search.</p>)}</div>{selectedPermissions.length ? <div className="role-selected-permissions"><strong>Selected permissions</strong><div>{selectedPermissions.map((permission) => <button key={permission.id} onClick={() => onTogglePermission(permission.id)} title={`Remove ${permission.displayName || permission.code}`} type="button">{permission.displayName || permission.name || permission.code} ×</button>)}</div></div> : null}</section></div><footer className="role-create-dialog__footer"><button onClick={onClose} type="button">Cancel</button><button disabled={!scope || !permissionIds.length || permissionsLoading || saving} type="submit">{saving ? (isCreate ? 'Creating role...' : 'Saving permissions...') : isCreate ? 'Create Role' : 'Save Permissions'}</button></footer></form></section></div>;
}

function RolePermissionEditor({ categories, description, isCreate, name, onCategoriesChange, onClose, onDescriptionChange, onNameChange, onScopeChange, onSubmit, onToggleGroup, onTogglePermission, permissionIds, permissions, permissionsError, permissionsLoading, saving, scope, scopes, scopesLoading, selectedCategories }: { categories: string[]; description: string; isCreate: boolean; name: string; onCategoriesChange: (values: string[]) => void; onClose: () => void; onDescriptionChange: (value: string) => void; onNameChange: (value: string) => void; onScopeChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onToggleGroup: (ids: string[]) => void; onTogglePermission: (id: string) => void; permissionIds: string[]; permissions: Permission[]; permissionsError: boolean; permissionsLoading: boolean; saving: boolean; scope: string; scopes: string[]; scopesLoading: boolean; selectedCategories: string[] }) {
  const [search, setSearch] = useState('');
  const matchesSearch = (permission: Permission) => !search.trim() || [permission.displayName, permission.code, permission.description ?? ''].some((value) => value.toLowerCase().includes(search.trim().toLowerCase()));
  const visibleGroups: Array<[string, Permission[]]> = selectedCategories.map((category) => [category, permissions.filter((permission) => (permission.category?.trim() || 'Uncategorized') === category && matchesSearch(permission))]);
  const selectedGroups = permissions.filter((permission) => permissionIds.includes(permission.id)).reduce<Record<string, Permission[]>>((groups, permission) => {
    const category = permission.category?.trim() || 'Uncategorized';
    (groups[category] ??= []).push(permission);
    return groups;
  }, {});
  const toggleCategory = (category: string) => onCategoriesChange(selectedCategories.includes(category) ? [] : [category]);

  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="role-editor-title" aria-modal="true" className="role-create-dialog" role="dialog"><header className="role-create-dialog__header"><div><h2 id="role-editor-title">{isCreate ? 'Create Role' : `Manage ${name} Permissions`}</h2><p>{isCreate ? 'Define an access role and choose the permissions it should include.' : 'Choose one or more categories, then update the permissions for this role.'}</p></div><button aria-label="Close role dialog" onClick={onClose} type="button">×</button></header><form className="role-create-form" onSubmit={onSubmit}><div className="role-create-dialog__body"><div className="role-create-fields">{isCreate ? <><label><span>Role name <b aria-hidden="true">*</b></span><input autoFocus maxLength={100} onChange={(event) => onNameChange(event.target.value)} required value={name} /></label><label className="role-create-fields__full"><span>Description <em>Optional</em></span><input maxLength={250} onChange={(event) => onDescriptionChange(event.target.value)} value={description} /></label></> : null}<label><span>Scope</span><select disabled={scopesLoading || !scopes.length} onChange={(event) => onScopeChange(event.target.value)} required value={scope}><option value="">{scopesLoading ? 'Loading scopes...' : scopes.length ? 'Select scope' : 'No scopes available'}</option>{scopes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><section aria-labelledby="role-permissions-title" className="role-permission-selector"><div className="role-permission-selector__heading"><div><h3 id="role-permissions-title">Permissions</h3><p>Select permission categories, then choose the actions this role can perform.</p></div><strong>{permissionIds.length} selected</strong></div><div className="role-category-picker"><div><strong>Permission categories</strong><span>Choose a category to view its permissions.</span></div><div className="role-category-picker__options">{categories.map((category) => <button aria-pressed={selectedCategories.includes(category)} className={selectedCategories.includes(category) ? 'is-selected' : ''} disabled={!scope || permissionsLoading} key={category} onClick={() => toggleCategory(category)} type="button"><span aria-hidden="true">{selectedCategories.includes(category) ? '✓' : '+'}</span>{category}</button>)}</div></div>{selectedCategories.length ? <div className="role-permission-search"><label><span>Search selected category</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions" type="search" value={search} /></label></div> : null}<div className="role-permission-groups">{!scope ? <p className="role-permission-state">Select a scope to load permission categories.</p> : null}{permissionsLoading ? <p className="role-permission-state">Loading available permissions...</p> : null}{permissionsError ? <p className="role-form-error">We could not load the available permissions. Close this dialog and try again.</p> : null}{scope && !permissionsLoading && !permissionsError && !selectedCategories.length ? <p className="role-permission-state">Choose a category above to see its permission options.</p> : null}{visibleGroups.map(([category, categoryPermissions]) => <section className="role-permission-group" key={category}><header><h4>{category}</h4><button onClick={() => onToggleGroup(categoryPermissions.map((permission) => permission.id))} type="button">{categoryPermissions.length && categoryPermissions.every((permission) => permissionIds.includes(permission.id)) ? 'Clear all' : 'Select all'}</button></header><div>{categoryPermissions.map((permission) => <label key={permission.id} title={permission.description || permission.code}><input checked={permissionIds.includes(permission.id)} onChange={() => onTogglePermission(permission.id)} type="checkbox" /><span>{permission.displayName || permission.name || permission.code}</span></label>)}</div></section>)}</div>{Object.keys(selectedGroups).length ? <div className="role-selected-permissions"><strong>Selected permissions</strong><div>{Object.entries(selectedGroups).sort(([left], [right]) => left.localeCompare(right)).map(([category, categoryPermissions]) => <section className="role-selected-permission-group" key={category}><h4>{category}</h4><div>{categoryPermissions.sort((left, right) => (left.displayName || left.code).localeCompare(right.displayName || right.code)).map((permission) => <button aria-label={`Remove ${permission.displayName || permission.code}`} key={permission.id} onClick={() => onTogglePermission(permission.id)} title={`Remove ${permission.displayName || permission.code}`} type="button"><span>{permission.displayName || permission.name || permission.code}</span><b aria-hidden="true">×</b></button>)}</div></section>)}</div></div> : null}</section></div><footer className="role-create-dialog__footer"><button onClick={onClose} type="button">Cancel</button><button disabled={!scope || !permissionIds.length || permissionsLoading || saving} type="submit">{saving ? (isCreate ? 'Creating role...' : 'Saving permissions...') : isCreate ? 'Create Role' : 'Save Permissions'}</button></footer></form></section></div>;
}

void CreateRoleModal;

function CompactRolePermissionModal({ mode, name, description, scope, scopes, scopesLoading, permissions, permissionIds, categories: selectedCategories, permissionsLoading, permissionsError, saving, onCategoriesChange, onScopeChange, onTogglePermission, onToggleGroup, onSubmit, onClose, onNameChange, onDescriptionChange }: { mode: 'create' | 'permissions'; name: string; description: string; scope: string; scopes: string[]; scopesLoading: boolean; permissions: Permission[]; permissionIds: string[]; categories: string[]; permissionsLoading: boolean; permissionsError: boolean; saving: boolean; onCategoriesChange: (values: string[]) => void; onScopeChange: (value: string) => void; onTogglePermission: (id: string) => void; onToggleGroup: (ids: string[]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void; onNameChange: (value: string) => void; onDescriptionChange: (value: string) => void }) {
  const [search, setSearch] = useState('');
  const isCreate = mode === 'create';
  const categories = [...new Set(permissions.map((permission) => permission.category?.trim() || 'Uncategorized'))].sort();
  const activeCategory = selectedCategories[0] ?? '';
  const activePermissions = permissions.filter((permission) => (permission.category?.trim() || 'Uncategorized') === activeCategory && [permission.displayName, permission.name ?? '', permission.code, permission.description ?? ''].some((value) => value.toLowerCase().includes(search.trim().toLowerCase())));
  const selectedGroups = permissions.filter((permission) => permissionIds.includes(permission.id)).reduce<Record<string, Permission[]>>((groups, permission) => {
    const category = permission.category?.trim() || 'Uncategorized';
    (groups[category] ??= []).push(permission);
    return groups;
  }, {});
  const allActiveSelected = activePermissions.length > 0 && activePermissions.every((permission) => permissionIds.includes(permission.id));
  const selectCategory = (category: string) => { onCategoriesChange(activeCategory === category ? [] : [category]); setSearch(''); };

  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="role-editor-title" aria-modal="true" className="role-create-dialog compact-role-dialog" role="dialog"><header className="compact-role-dialog__header"><div><h2 id="role-editor-title">{isCreate ? 'Create Role' : `Manage ${name} Permissions`}</h2><p>{isCreate ? 'Configure the role and its permissions.' : 'Configure role permissions and scope.'}</p><small>{permissionIds.length} permission{permissionIds.length === 1 ? '' : 's'} selected</small></div><div className="compact-role-dialog__header-actions"><label><span>Scope</span><select disabled={scopesLoading || !scopes.length || saving} onChange={(event) => onScopeChange(event.target.value)} value={scope}><option value="">{scopesLoading ? 'Loading…' : 'Select scope'}</option>{scopes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button aria-label="Close role dialog" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div></header><form className="role-create-form" onSubmit={onSubmit}>{isCreate ? <div className="compact-role-dialog__fields"><label><span>Role name</span><input autoFocus maxLength={100} onChange={(event) => onNameChange(event.target.value)} required value={name} /></label><label><span>Description <em>Optional</em></span><input maxLength={250} onChange={(event) => onDescriptionChange(event.target.value)} value={description} /></label></div> : null}<nav aria-label="Permission categories" className="compact-role-categories"><span>Categories</span><div>{categories.map((category) => <button aria-pressed={activeCategory === category} className={activeCategory === category ? 'is-active' : ''} disabled={!scope || permissionsLoading} key={category} onClick={() => selectCategory(category)} type="button">{activeCategory === category ? <Check aria-hidden="true" size={13} /> : <Plus aria-hidden="true" size={13} />}{category}</button>)}</div></nav><div className="compact-role-workspace"><section className="compact-role-active"><header><div><h3>{activeCategory || 'Active Category'}</h3><p>{activeCategory ? 'Choose the permissions for this category.' : 'Choose a category to view its permissions.'}</p></div><button disabled={!activePermissions.length || permissionsLoading} onClick={() => onToggleGroup(activePermissions.map((permission) => permission.id))} type="button">{allActiveSelected ? 'Clear all' : 'Select all'}</button></header>{activeCategory ? <label className="compact-role-search"><Search aria-hidden="true" size={15} /><span className="sr-only">Search permissions</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions..." type="search" value={search} /></label> : null}<div className="compact-role-permission-list">{permissionsLoading ? <p>Loading permissions…</p> : null}{permissionsError ? <p className="role-form-error">We could not load available permissions.</p> : null}{activeCategory && !permissionsLoading && !permissionsError && !activePermissions.length ? <p>No permissions match this search.</p> : null}{activePermissions.map((permission) => <label key={permission.id}><input checked={permissionIds.includes(permission.id)} onChange={() => onTogglePermission(permission.id)} type="checkbox" /><span>{permission.displayName || permission.name || permission.code}</span></label>)}</div></section><aside className="compact-role-selected"><header><h3>Selected Permissions</h3><strong>{permissionIds.length}</strong></header>{Object.keys(selectedGroups).length ? <div>{Object.entries(selectedGroups).sort(([left], [right]) => left.localeCompare(right)).map(([category, items]) => <section key={category}><h4>{category}</h4><div>{items.sort((left, right) => (left.displayName || left.code).localeCompare(right.displayName || right.code)).map((permission) => <button aria-label={`Remove ${permission.displayName || permission.code}`} key={permission.id} onClick={() => onTogglePermission(permission.id)} type="button"><span>{permission.displayName || permission.name || permission.code}</span><X aria-hidden="true" size={13} /></button>)}</div></section>)}</div> : <p>No permissions selected yet.</p>}</aside></div><footer className="compact-role-dialog__footer"><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={!scope || !permissionIds.length || permissionsLoading || saving} type="submit">{saving ? (isCreate ? 'Creating role...' : 'Saving permissions...') : isCreate ? 'Create Role' : 'Save Permissions'}</button></footer></form></section></div>;
}

void CompactRolePermissionModal;

function RolePermissionWorkspace({ mode, name, description, scope, scopes, scopesLoading, permissions, permissionIds, categories: selectedCategories, permissionsLoading, permissionsError, saving, onCategoriesChange, onScopeChange, onTogglePermission, onToggleGroup, onSubmit, onClose, onNameChange, onDescriptionChange }: { mode: 'create' | 'permissions'; name: string; description: string; scope: string; scopes: string[]; scopesLoading: boolean; permissions: Permission[]; permissionIds: string[]; categories: string[]; permissionsLoading: boolean; permissionsError: boolean; saving: boolean; onCategoriesChange: (values: string[]) => void; onScopeChange: (value: string) => void; onTogglePermission: (id: string) => void; onToggleGroup: (ids: string[]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void; onNameChange: (value: string) => void; onDescriptionChange: (value: string) => void }) {
  const [search, setSearch] = useState('');
  const [selectedExpanded, setSelectedExpanded] = useState(false);
  const isCreate = mode === 'create';
  const categories = [...new Set(permissions.map((permission) => permission.module?.trim() || 'General'))].sort();
  const activeCategory = selectedCategories[0] ?? '';
  const activePermissions = permissions.filter((permission) => (permission.module?.trim() || 'General') === activeCategory && [permission.displayName, permission.name ?? '', permission.code, permission.description ?? ''].some((value) => value.toLowerCase().includes(search.trim().toLowerCase())));
  const groups = permissions.filter((permission) => permissionIds.includes(permission.id)).reduce<Record<string, Permission[]>>((result, permission) => { const module = permission.module?.trim() || 'General'; (result[module] ??= []).push(permission); return result; }, {});
  const allSelected = activePermissions.length > 0 && activePermissions.every((permission) => permissionIds.includes(permission.id));
  const setCategory = (category: string) => { onCategoriesChange([category]); setSearch(''); };
  useEffect(() => {
    if (!activeCategory && categories[0]) onCategoriesChange([categories[0]]);
  }, [activeCategory, categories, onCategoriesChange]);
  return <RolePermissionWorkspaceContent {...{ mode, name, description, scope, scopes, scopesLoading, permissions, permissionIds, categories: selectedCategories, permissionsLoading, permissionsError, saving, onCategoriesChange, onScopeChange, onTogglePermission, onToggleGroup, onSubmit, onClose, onNameChange, onDescriptionChange }} />;
  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="workspace-title" aria-modal="true" className="permission-workspace" role="dialog"><header className="permission-workspace__header"><div><h2 id="workspace-title">{isCreate ? 'Create Role' : `Manage ${name} Permissions`}</h2><p>Configure permissions for this role.</p><strong>{permissionIds.length} selected</strong></div><div><label><span>Scope</span><select disabled={scopesLoading || !scopes.length || saving} onChange={(event) => onScopeChange(event.target.value)} value={scope}><option value="">{scopesLoading ? 'Loading…' : 'Select scope'}</option>{scopes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button aria-label="Close role dialog" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div></header><form className="permission-workspace__form" onSubmit={onSubmit}>{isCreate ? <div className="permission-workspace__role-fields"><input aria-label="Role name" autoFocus maxLength={100} onChange={(event) => onNameChange(event.target.value)} placeholder="Role name" required value={name} /><input aria-label="Description" maxLength={250} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Description (optional)" value={description} /></div> : null}<main className="permission-workspace__body"><nav aria-label="Permission modules" className="permission-workspace__categories"><h3>Modules</h3><div>{categories.map((category) => { const count = permissions.filter((permission) => permissionIds.includes(permission.id) && (permission.module?.trim() || 'General') === category).length; return <button aria-pressed={activeCategory === category} className={activeCategory === category ? 'is-active' : ''} disabled={!scope || permissionsLoading} key={category} onClick={() => setCategory(category)} type="button"><span>{category}</span>{count ? <b>{count}</b> : activeCategory === category ? <Check aria-hidden="true" size={13} /> : null}</button>; })}</div></nav><section className="permission-workspace__active"><header><h3>{activeCategory || 'Permissions'}</h3><button disabled={!activePermissions.length || permissionsLoading} onClick={() => onToggleGroup(activePermissions.map((permission) => permission.id))} type="button">{allSelected ? 'Clear all' : 'Select all'}</button></header><label className="permission-workspace__search"><Search aria-hidden="true" size={15} /><span className="sr-only">Search permissions</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions..." type="search" value={search} />{search ? <button aria-label="Clear search" onClick={() => setSearch('')} type="button"><X aria-hidden="true" size={13} /></button> : null}</label><div className="permission-workspace__permission-grid">{permissionsLoading ? <p>Loading permissions…</p> : null}{permissionsError ? <p className="role-form-error">We could not load the available permissions.</p> : null}{!activeCategory && !permissionsLoading ? <p>Choose a module to view permissions.</p> : null}{activeCategory && !permissionsLoading && !permissionsError && !activePermissions.length ? <p>No permissions match this search.</p> : null}{activePermissions.map((permission) => <label className={permissionIds.includes(permission.id) ? 'is-selected' : ''} key={permission.id}><input checked={permissionIds.includes(permission.id)} onChange={() => onTogglePermission(permission.id)} type="checkbox" /><span>{permission.displayName || permission.name || permission.code}</span></label>)}</div></section><aside className={selectedExpanded ? 'permission-workspace__selected is-expanded' : 'permission-workspace__selected'}><header><h3>Selected</h3><button aria-expanded={selectedExpanded} onClick={() => setSelectedExpanded((value) => !value)} type="button">{permissionIds.length} permission{permissionIds.length === 1 ? '' : 's'}</button></header>{Object.keys(groups).length ? <div>{Object.entries(groups).sort(([left], [right]) => left.localeCompare(right)).map(([module, items]) => <section key={module}><h4>{module} <span>{items.length}</span></h4><div>{items.sort((left, right) => (left.displayName || left.code).localeCompare(right.displayName || right.code)).map((permission) => <button aria-label={`Remove ${permission.displayName || permission.code}`} key={permission.id} onClick={() => onTogglePermission(permission.id)} type="button"><span>{permission.displayName || permission.name || permission.code}</span><X aria-hidden="true" size={12} /></button>)}</div></section>)}</div> : <p>No permissions selected yet.</p>}</aside></main><footer><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={!scope || !permissionIds.length || permissionsLoading || saving} type="submit">{saving ? (isCreate ? 'Creating role...' : 'Saving permissions...') : isCreate ? 'Create Role' : 'Save Permissions'}</button></footer></form></section></div>;
}

void RolePermissionWorkspace;

function ManageMemberRoleModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const queryClient = useQueryClient();
  const userId = member.userId?.trim() || null;
  const [historyVisible, setHistoryVisible] = useState(false);
  const [replacementRoleIds, setReplacementRoleIds] = useState<Record<string, string>>({});
  const [removalTarget, setRemovalTarget] = useState<{ id: string; name: string } | null>(null);
  const rolesQuery = useQuery({ queryKey: ['user-roles', userId], queryFn: () => getUserRoles(userId!), enabled: Boolean(userId) });
  const optionsQuery = useQuery({ queryKey: ['user-role-options', userId], queryFn: () => getUserRoleOptions(userId!), enabled: Boolean(userId) });
  const historyQuery = useQuery({ queryKey: ['user-role-history', userId], queryFn: () => getUserRoleHistory(userId!), enabled: Boolean(userId) && historyVisible });
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['user-roles', userId] }),
    queryClient.invalidateQueries({ queryKey: ['user-role-options', userId] }),
    queryClient.invalidateQueries({ queryKey: ['user-role-history', userId] }),
    queryClient.invalidateQueries({ queryKey: ['members'] }),
  ]);
  const assignMutation = useMutation({
    mutationFn: (roleId: string) => assignUserRole(userId!, { roleId }),
    onSuccess: () => { toast.success(`Role assigned to ${member.name}.`); void refresh(); },
    onError: (error) => toast.error(readableApiError(error, 'We could not assign that role. Please try again.')),
  });
  const removeMutation = useMutation({
    mutationFn: (roleId: string) => revokeUserRole(userId!, roleId),
    onSuccess: () => { toast.success(`Role removed from ${member.name}.`); setRemovalTarget(null); void refresh(); },
    onError: (error) => toast.error(readableApiError(error, 'We could not remove that role. Please try again.')),
  });
  const reassignMutation = useMutation({
    mutationFn: ({ oldRoleId, newRoleId }: { oldRoleId: string; newRoleId: string }) => reassignUserRole(userId!, oldRoleId, newRoleId),
    onSuccess: () => { toast.success(`Role reassigned for ${member.name}.`); setReplacementRoleIds({}); void refresh(); },
    onError: (error) => toast.error(readableApiError(error, 'We could not reassign that role. Please try again.')),
  });

  if (!userId) return null;
  const assignments = rolesQuery.data ?? [];
  const options = optionsQuery.data ?? [];
  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="manage-member-role-title" aria-modal="true" className="division-modal role-modal manage-member-role-modal" role="dialog"><div className="division-modal__head"><div><strong id="manage-member-role-title">Manage Role</strong><span>{member.name} {member.email ? `â€” ${member.email}` : ''}</span></div><button aria-label="Close manage role dialog" onClick={onClose} type="button">X</button></div><div className="division-form"><div className="role-assignment"><strong>Current roles</strong>{rolesQuery.isLoading ? <p>Loading current roles...</p> : null}{rolesQuery.isError ? <p className="role-form-error">{readableApiError(rolesQuery.error, 'Unable to load this member’s current roles.')}</p> : null}{assignments.length ? assignments.map((assignment) => { const replacementRoleId = replacementRoleIds[assignment.id] ?? ''; const availableReplacements = options.filter((role) => role.id !== assignment.role.id); return <div className="role-assignment__row manage-member-role-modal__current" key={assignment.id}><span><strong>{assignment.role.name}</strong><small>{assignment.role.scope} scope Â· assigned {formatDate(assignment.assignedAt)}</small></span><div className="manage-member-role-modal__actions"><select aria-label={`New role for ${assignment.role.name}`} disabled={!availableReplacements.length || reassignMutation.isPending} onChange={(event) => setReplacementRoleIds((current) => ({ ...current, [assignment.id]: event.target.value }))} value={replacementRoleId}><option value="">Reassign to…</option>{availableReplacements.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button disabled={!replacementRoleId || reassignMutation.isPending} onClick={() => reassignMutation.mutate({ oldRoleId: assignment.role.id, newRoleId: replacementRoleId })} type="button">{reassignMutation.isPending && reassignMutation.variables?.oldRoleId === assignment.role.id ? 'Reassigning...' : 'Reassign'}</button><button disabled={removeMutation.isPending} onClick={() => setRemovalTarget({ id: assignment.role.id, name: assignment.role.name })} type="button">Remove</button></div></div>; }) : !rolesQuery.isLoading ? <p>No roles are assigned yet.</p> : null}</div><div className="role-assignment"><strong>Assignable roles</strong>{optionsQuery.isLoading ? <p>Loading roles that can be assigned...</p> : null}{optionsQuery.isError ? <p className="role-form-error">{readableApiError(optionsQuery.error, 'Unable to load role options for this member.')}</p> : null}{options.map((role) => <div className="role-assignment__row" key={role.id}><span><strong>{role.name}</strong><small>{role.scope} scope</small></span><button disabled={assignMutation.isPending} onClick={() => assignMutation.mutate(role.id)} type="button">{assignMutation.isPending && assignMutation.variables === role.id ? 'Assigning...' : 'Assign'}</button></div>)}{!optionsQuery.isLoading && !optionsQuery.isError && !options.length ? <p>No roles are currently assignable.</p> : null}</div><div className="role-assignment manage-member-role-modal__history"><button aria-expanded={historyVisible} onClick={() => setHistoryVisible((visible) => !visible)} type="button">{historyVisible ? 'Hide history' : 'History'}</button>{historyVisible ? <div>{historyQuery.isLoading ? <p>Loading role history...</p> : null}{historyQuery.isError ? <p className="role-form-error">{readableApiError(historyQuery.error, 'Unable to load role history.')}</p> : null}{(historyQuery.data ?? []).map((assignment) => <div className="role-assignment__row" key={assignment.id}><span><strong>{assignment.role.name}</strong><small>{assignment.revokedAt ? `Revoked ${formatDate(assignment.revokedAt)}` : 'Active'} Â· assigned {formatDate(assignment.assignedAt)}</small></span></div>)}{!historyQuery.isLoading && !historyQuery.isError && !(historyQuery.data ?? []).length ? <p>No role history is available.</p> : null}</div> : null}</div><div className="division-form__actions"><button onClick={onClose} type="button">Done</button></div></div></section>{removalTarget ? <div className="division-modal-backdrop manage-member-role-modal__confirmation" role="presentation"><section aria-labelledby="remove-member-role-title" aria-modal="true" className="division-modal status-confirmation-dialog" role="dialog"><div className="division-modal__head"><div><strong id="remove-member-role-title">Remove role?</strong><span>This will revoke the role from {member.name}.</span></div><button aria-label="Close remove role confirmation" disabled={removeMutation.isPending} onClick={() => setRemovalTarget(null)} type="button">X</button></div><div className="status-confirmation-dialog__body"><p><strong>{removalTarget.name}</strong></p><p>Do you want to continue?</p></div><div className="division-form__actions"><button disabled={removeMutation.isPending} onClick={() => setRemovalTarget(null)} type="button">Cancel</button><button className="status-confirmation-dialog__deactivate" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(removalTarget.id)} type="button">{removeMutation.isPending ? 'Removing...' : 'Remove role'}</button></div></section></div> : null}</div>;
}

function DivisionTeamManagementModal({ division, onClose, onCreateTeam }: { division: Division; onClose: () => void; onCreateTeam: () => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal division-team-management-modal" role="dialog"><div className="division-modal__head"><div><strong>Manage Team</strong><span>{division.name} ({division.abbr})</span></div><button aria-label="Close team management dialog" onClick={onClose} type="button">X</button></div><TeamPage divisionId={division.id} embedded modalPresentation onCreateTeam={onCreateTeam} /><div className="division-team-management-modal__footer"><button onClick={onClose} type="button">Done</button></div></section></div>;
}

type RolePermissionWorkspaceContentProps = {
  mode: 'create' | 'permissions'; name: string; description: string; scope: string; scopes: string[]; scopesLoading: boolean; permissions: Permission[]; permissionIds: string[]; categories: string[]; permissionsLoading: boolean; permissionsError: boolean; saving: boolean;
  onCategoriesChange: (values: string[]) => void; onScopeChange: (value: string) => void; onTogglePermission: (id: string) => void; onToggleGroup: (ids: string[]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void; onNameChange: (value: string) => void; onDescriptionChange: (value: string) => void;
};

function RolePermissionWorkspaceContent({ mode, name, description, scope, scopes, scopesLoading, permissions, permissionIds, categories: selectedCategories, permissionsLoading, permissionsError, saving, onCategoriesChange, onScopeChange, onTogglePermission, onToggleGroup, onSubmit, onClose, onNameChange, onDescriptionChange }: RolePermissionWorkspaceContentProps) {
  const { validation, onRemoveIncompatible, catalogue, retryPermissions, catalogueError } = useContext(RoleScopeValidationContext);
  const [search, setSearch] = useState('');
  const [selectedExpanded, setSelectedExpanded] = useState(false);
  const isCreate = mode === 'create';
  const categories = [...new Set(permissions.map((permission) => permission.module?.trim() || 'General'))].sort();
  const activeCategory = selectedCategories[0] ?? '';
  const incompatibleIds = new Set((validation?.incompatiblePermissions ?? []).flatMap((permission) => permission.id ? [permission.id] : []));
  const activePermissions = permissions.filter((permission) => (permission.module?.trim() || 'General') === activeCategory && [permission.displayName, permission.name ?? '', permission.code, permission.description ?? ''].some((value) => value.toLowerCase().includes(search.trim().toLowerCase())));
  const selectable = (permission: Permission) => isPermissionCompatible(permission, scope) && (!isCreate || (!incompatibleIds.has(permission.id) && scopedDependencies([permission.id], catalogue, scope).rejected.length === 0));
  const selectablePermissions = activePermissions.filter(selectable);
  const validPermissionIds = isCreate ? permissionIds.filter((id) => !incompatibleIds.has(id)) : permissionIds;
  const selectedGroups = permissions.filter((permission) => permissionIds.includes(permission.id)).reduce<Record<string, Permission[]>>((groups, permission) => { const module = permission.module?.trim() || 'General'; (groups[module] ??= []).push(permission); return groups; }, {});
  const selectCategory = (category: string) => { onCategoriesChange([category]); setSearch(''); };
  const focusIncompatible = (permissionId: string | null) => { const permission = permissions.find((item) => item.id === permissionId); if (permission) selectCategory(permission.module?.trim() || 'General'); };
  useEffect(() => { if (!activeCategory && categories[0]) onCategoriesChange([categories[0]]); }, [activeCategory, categories, onCategoriesChange]);

  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="workspace-title" aria-modal="true" className="permission-workspace" role="dialog">
    <header className="permission-workspace__header"><div><h2 id="workspace-title">{isCreate ? 'Create Role' : `Manage ${name} Permissions`}</h2><p>Configure permissions for this role.</p><strong>{validPermissionIds.length} selected</strong></div><div><label><span>Scope</span><select disabled={scopesLoading || !scopes.length || saving} onChange={(event) => onScopeChange(event.target.value)} value={scope}><option value="">{scopesLoading ? 'Loading…' : 'Select scope'}</option>{scopes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button aria-label="Close role dialog" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div></header>
    <form className="permission-workspace__form" onSubmit={onSubmit}>
      {isCreate ? <div className="permission-workspace__role-fields"><input aria-label="Role name" autoFocus maxLength={100} onChange={(event) => onNameChange(event.target.value)} placeholder="Role name" required value={name} /><input aria-label="Description" maxLength={250} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Description (optional)" value={description} /></div> : null}
      {validation ? <section className="role-scope-validation" role="alert"><strong>Scope change cannot be saved yet.</strong>{validation.incompatiblePermissions.length ? <><span>These permissions are not compatible with the selected scope:</span><ul>{validation.incompatiblePermissions.map((permission) => <li key={permission.id ?? permission.label}><button onClick={() => focusIncompatible(permission.id)} type="button">{permission.label}</button></li>)}</ul><button className="role-scope-validation__remove" onClick={onRemoveIncompatible} type="button">Remove incompatible permissions</button><span>Review the remaining permissions, then save again.</span></> : null}{validation.affectedBindings.length ? <><span>Existing role or user bindings prevent this scope change:</span><ul>{validation.affectedBindings.map((binding) => <li key={binding}>{binding}</li>)}</ul></> : null}</section> : null}
      <main className="permission-workspace__body">
        <nav aria-label="Permission modules" className="permission-workspace__categories"><h3>Modules</h3><div>{categories.map((category) => { const count = permissions.filter((permission) => validPermissionIds.includes(permission.id) && (permission.module?.trim() || 'General') === category).length; return <button aria-pressed={activeCategory === category} className={activeCategory === category ? 'is-active' : ''} disabled={!scope} key={category} onClick={() => selectCategory(category)} type="button"><span>{category}</span>{count ? <b>{count}</b> : null}</button>; })}</div></nav>
        <section className="permission-workspace__active"><header><h3>{activeCategory || 'Permissions'}</h3><button disabled={!selectablePermissions.length || permissionsLoading || permissionsError} onClick={() => onToggleGroup(selectablePermissions.map((permission) => permission.id))} type="button">{selectablePermissions.length && selectablePermissions.every((permission) => permissionIds.includes(permission.id)) ? 'Clear all' : 'Select all'}</button></header><label className="permission-workspace__search"><Search aria-hidden="true" size={15} /><span className="sr-only">Search permissions</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions..." type="search" value={search} />{search ? <button aria-label="Clear search" onClick={() => setSearch('')} type="button"><X aria-hidden="true" size={13} /></button> : null}</label><div className="permission-workspace__permission-grid">{permissionsLoading ? <p>Loading permissions…</p> : null}{permissionsError ? <p className="role-form-error" role="alert">We could not load the available permissions. <button onClick={retryPermissions} type="button">Retry</button></p> : null}{catalogueError && !permissionsLoading && !permissionsError ? <p className="role-form-error" role="status">Some dependency information could not be loaded. <button onClick={retryPermissions} type="button">Retry</button></p> : null}{!activeCategory && !permissionsLoading ? <p>Choose a module to view permissions.</p> : null}{activeCategory && !permissionsLoading && !permissionsError && !activePermissions.length ? <p>No permissions match this search.</p> : null}{!permissionsLoading && !permissionsError ? activePermissions.map((permission) => <label className={`${permissionIds.includes(permission.id) ? 'is-selected' : ''}${incompatibleIds.has(permission.id) ? ' is-incompatible' : ''}`} key={permission.id}><input checked={permissionIds.includes(permission.id)} disabled={permissionsLoading || permissionsError || !selectable(permission)} onChange={() => onTogglePermission(permission.id)} title={!selectable(permission) ? "Unavailable for this scope or a required permission is incompatible." : undefined} type="checkbox" /><span>{permission.displayName || permission.name || permission.code}</span>{incompatibleIds.has(permission.id) ? <em>Incompatible</em> : null}</label>) : null}</div></section>
        <aside className={selectedExpanded ? 'permission-workspace__selected is-expanded' : 'permission-workspace__selected'}><header><h3>Selected</h3><button aria-expanded={selectedExpanded} onClick={() => setSelectedExpanded((value) => !value)} type="button">{validPermissionIds.length} permission{validPermissionIds.length === 1 ? '' : 's'}</button></header>{Object.keys(selectedGroups).length ? <div>{Object.entries(selectedGroups).sort(([left], [right]) => left.localeCompare(right)).map(([module, items]) => <section key={module}><h4>{module} <span>{items.filter((item) => validPermissionIds.includes(item.id)).length}</span></h4><div>{items.sort((left, right) => (left.displayName || left.code).localeCompare(right.displayName || right.code)).map((permission) => <button aria-label={`Remove ${permission.displayName || permission.code}`} className={incompatibleIds.has(permission.id) ? 'is-incompatible' : ''} key={permission.id} onClick={() => onTogglePermission(permission.id)} type="button"><span>{permission.displayName || permission.name || permission.code}</span>{incompatibleIds.has(permission.id) ? <i>Incompatible</i> : <X aria-hidden="true" size={12} />}</button>)}</div></section>)}</div> : <p>No permissions selected yet.</p>}</aside>
      </main>
      <footer><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={!scope || !validPermissionIds.length || (isCreate && Boolean(validation?.incompatiblePermissions.length)) || permissionsLoading || permissionsError || saving} type="submit">{saving ? (isCreate ? 'Creating role...' : 'Saving permissions...') : isCreate ? 'Create Role' : 'Save Permissions'}</button></footer>
    </form>
  </section></div>;
}

function CodeModal({ title, editing, name, code, saving, loadingDetails, onNameChange, onCodeChange, onClose, onSubmit }: { title: string; editing: boolean; name: string; code: string; saving: boolean; loadingDetails: boolean; onNameChange: (value: string) => void; onCodeChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editing ? `Update ${title} Code` : `Create ${title} Code`}</strong></div><button aria-label={`Close ${title} Code dialog`} onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label><span>{title} Code name</span><input autoFocus maxLength={160} onChange={(event) => onNameChange(event.target.value)} placeholder={`Enter ${title} Code name`} required value={name} /></label><label><span>Code</span><input maxLength={100} onChange={(event) => onCodeChange(event.target.value)} placeholder={`Enter ${title} Code`} required value={code} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={saving || (editing && loadingDetails)} type="submit">{saving ? 'Saving...' : editing ? `Update ${title} Code` : `Create ${title} Code`}</button></div></form></section></div>;
}

function GeneralDocumentCodeModal({ editing, name, code, description, saving, loadingDetails, onNameChange, onCodeChange, onDescriptionChange, onClose, onSubmit }: { editing: boolean; name: string; code: string; description: string; saving: boolean; loadingDetails: boolean; onNameChange: (value: string) => void; onCodeChange: (value: string) => void; onDescriptionChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editing ? 'Update General Document Code' : 'Create General Document Code'}</strong></div><button aria-label="Close General Document Code dialog" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label><span>Name</span><input autoFocus maxLength={160} onChange={(event) => onNameChange(event.target.value)} placeholder="Enter document code name" required value={name} /></label><label><span>Code</span><input maxLength={100} onChange={(event) => onCodeChange(event.target.value)} placeholder="Enter document code" required value={code} /></label><label><span>Description <em>Optional</em></span><textarea maxLength={500} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Describe this document code" rows={3} value={description} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={saving || (editing && loadingDetails)} type="submit">{saving ? 'Saving...' : editing ? 'Update General Document Code' : 'Create General Document Code'}</button></div></form></section></div>;
}

function ProjectManagementOperationDocumentCodeModal({ editing, name, code, description, saving, loadingDetails, onNameChange, onCodeChange, onDescriptionChange, onClose, onSubmit }: { editing: boolean; name: string; code: string; description: string; saving: boolean; loadingDetails: boolean; onNameChange: (value: string) => void; onCodeChange: (value: string) => void; onDescriptionChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editing ? 'Update PM & Operation Document Code' : 'Create PM & Operation Document Code'}</strong></div><button aria-label="Close PM and Operation Document Code dialog" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label><span>Name</span><input autoFocus maxLength={160} onChange={(event) => onNameChange(event.target.value)} placeholder="Enter document code name" required value={name} /></label><label><span>Code</span><input maxLength={100} onChange={(event) => onCodeChange(event.target.value)} placeholder="Enter document code" required value={code} /></label><label><span>Description <em>Optional</em></span><textarea maxLength={500} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Describe this document code" rows={3} value={description} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={saving || (editing && loadingDetails)} type="submit">{saving ? 'Saving...' : editing ? 'Update PM & Operation Document Code' : 'Create PM & Operation Document Code'}</button></div></form></section></div>;
}

function MarketingDocumentCodeModal({ editing, name, code, description, saving, loadingDetails, onNameChange, onCodeChange, onDescriptionChange, onClose, onSubmit }: { editing: boolean; name: string; code: string; description: string; saving: boolean; loadingDetails: boolean; onNameChange: (value: string) => void; onCodeChange: (value: string) => void; onDescriptionChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editing ? 'Update Marketing Document Code' : 'Create Marketing Document Code'}</strong></div><button aria-label="Close Marketing Document Code dialog" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label><span>Name</span><input autoFocus maxLength={160} onChange={(event) => onNameChange(event.target.value)} placeholder="Enter document code name" required value={name} /></label><label><span>Code</span><input maxLength={100} onChange={(event) => onCodeChange(event.target.value)} placeholder="Enter document code" required value={code} /></label><label><span>Description <em>Optional</em></span><textarea maxLength={500} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Describe this document code" rows={3} value={description} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={saving || (editing && loadingDetails)} type="submit">{saving ? 'Saving...' : editing ? 'Update Marketing Document Code' : 'Create Marketing Document Code'}</button></div></form></section></div>;
}

function EtcDocumentCodeModal({ editing, name, code, description, saving, loadingDetails, onNameChange, onCodeChange, onDescriptionChange, onClose, onSubmit }: { editing: boolean; name: string; code: string; description: string; saving: boolean; loadingDetails: boolean; onNameChange: (value: string) => void; onCodeChange: (value: string) => void; onDescriptionChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editing ? 'Update ETC Document Code' : 'Create ETC Document Code'}</strong></div><button aria-label="Close ETC Document Code dialog" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label><span>Name</span><input autoFocus maxLength={160} onChange={(event) => onNameChange(event.target.value)} placeholder="Enter document code name" required value={name} /></label><label><span>Code</span><input maxLength={100} onChange={(event) => onCodeChange(event.target.value)} placeholder="Enter document code" required value={code} /></label><label><span>Description <em>Optional</em></span><textarea maxLength={500} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Describe this document code" rows={3} value={description} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={saving || (editing && loadingDetails)} type="submit">{saving ? 'Saving...' : editing ? 'Update ETC Document Code' : 'Create ETC Document Code'}</button></div></form></section></div>;
}

function EngineeringDocumentCodeModal({ editing, name, code, description, saving, loadingDetails, onNameChange, onCodeChange, onDescriptionChange, onClose, onSubmit }: { editing: boolean; name: string; code: string; description: string; saving: boolean; loadingDetails: boolean; onNameChange: (value: string) => void; onCodeChange: (value: string) => void; onDescriptionChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editing ? 'Update Engineering Document Code' : 'Create Engineering Document Code'}</strong></div><button aria-label="Close Engineering Document Code dialog" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label><span>Name</span><input autoFocus maxLength={160} onChange={(event) => onNameChange(event.target.value)} placeholder="Enter document code name" required value={name} /></label><label><span>Code</span><input maxLength={100} onChange={(event) => onCodeChange(event.target.value)} placeholder="Enter document code" required value={code} /></label><label><span>Description <em>Optional</em></span><textarea maxLength={500} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Describe this document code" rows={3} value={description} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={saving || (editing && loadingDetails)} type="submit">{saving ? 'Saving...' : editing ? 'Update Engineering Document Code' : 'Create Engineering Document Code'}</button></div></form></section></div>;
}

function DesignationModal({ editing, name, saving, loadingDetails, onNameChange, onClose, onSubmit }: { editing: boolean; name: string; saving: boolean; loadingDetails: boolean; onNameChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editing ? 'Update Designation' : 'Create Designation'}</strong></div><button aria-label="Close designation dialog" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={onSubmit}><label className="division-form__full"><span>Designation name</span><input autoFocus maxLength={140} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. Software Developer" required value={name} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={saving || (editing && loadingDetails)} type="submit">{saving ? 'Saving...' : editing ? 'Update Designation' : 'Create Designation'}</button></div></form></section></div>;
}
