import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { usePageTitle } from '@/hooks/usePageTitle';
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
import { getMembers, type Member } from '@/services/memberService';
import { getDivisions } from '@/services/divisionService';
import { BidsPanel } from '@/features/dashboard/BidsPanel';
import { ProjectsPanel } from '@/features/dashboard/ProjectsPanel';
import { WorkRequestsPage } from '@/pages/WorkRequestsPage';
import { TeamPage } from '@/pages/TeamPage';
import { CreateDivisionModal } from '@/components/ui/CreateDivisionModal';
import { DashboardWorkspace } from '@/features/dashboard/DashboardWorkspace';
import {
  assignUserRole,
  createAccessRole,
  getAccessRole,
  getAccessRoles,
  getPermissions,
  getUserRoleOptions,
  getUserRoles,
  readableApiError,
  revokeUserRole,
  updateRolePermissions,
  type AccessRole,
  type Permission,
} from '@/services/roleService';

const polCodesQueryKey = ['pol-codes'] as const;
const deactivatedPolCodesQueryKey = ['pol-codes', 'deactivated'] as const;
const podCodesQueryKey = ['pod-codes'] as const;
const deactivatedPodCodesQueryKey = ['pod-codes', 'deactivated'] as const;
const cargoCodesQueryKey = ['cargo-codes'] as const;
const deactivatedCargoCodesQueryKey = ['cargo-codes', 'deactivated'] as const;
const vesselCodesQueryKey = ['vessel-codes'] as const;
const deactivatedVesselCodesQueryKey = ['vessel-codes', 'deactivated'] as const;
const generalDocumentCodesQueryKey = ['general-document-codes'] as const;
const deactivatedGeneralDocumentCodesQueryKey = ['general-document-codes', 'deactivated'] as const;
const projectManagementOperationDocumentCodesQueryKey = ['project-management-operation-document-codes'] as const;
const deactivatedProjectManagementOperationDocumentCodesQueryKey = ['project-management-operation-document-codes', 'deactivated'] as const;
const marketingDocumentCodesQueryKey = ['marketing-document-codes'] as const;
const deactivatedMarketingDocumentCodesQueryKey = ['marketing-document-codes', 'deactivated'] as const;
const etcDocumentCodesQueryKey = ['etc-document-codes'] as const;
const deactivatedEtcDocumentCodesQueryKey = ['etc-document-codes', 'deactivated'] as const;
const engineeringDocumentCodesQueryKey = ['engineering-document-codes'] as const;
const deactivatedEngineeringDocumentCodesQueryKey = ['engineering-document-codes', 'deactivated'] as const;
const designationsQueryKey = ['designations'] as const;
const accessRolesQueryKey = ['access-roles'] as const;
const customRoleScopes = ['company'];

function TableFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const create = label === 'Filter divisions' ? { text: 'Create Division', target: 'division' } : label === 'Filter members' ? { text: 'Create Member', target: 'member' } : label === 'Filter bids' ? { text: 'Create Bid', target: 'bid' } : label === 'Filter projects' ? { text: 'Create Project', target: 'project' } : label === 'Filter work requests' ? { text: 'Create Work Request', target: 'work-request' } : label === 'Filter teams' ? { text: 'Create Team', target: 'team' } : null;
  return <div className="settings-table-filter"><label><span>Filter</span><input aria-label={label} onChange={(event) => onChange(event.target.value)} placeholder={label} type="search" value={value} /></label>{create ? <button onClick={() => window.dispatchEvent(new CustomEvent('workspace-create', { detail: create.target }))} type="button">{create.text}</button> : null}</div>;
}

function WorkspacePanelFilter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <div className="settings-panel-filter"><TableFilter label={label} value={value} onChange={onChange} />{children}</div>;
}

function SettingsTableToolbar({ title, count, searchPlaceholder, searchValue, onSearchChange, statusFilter, onStatusChange, onCreate, createLabel, onSecondaryAction, secondaryLabel }: { title: string; count: string; searchPlaceholder: string; searchValue: string; onSearchChange: (value: string) => void; statusFilter?: 'all' | 'active' | 'inactive'; onStatusChange?: (value: 'all' | 'active' | 'inactive') => void; onCreate?: () => void; createLabel?: string; onSecondaryAction?: () => void; secondaryLabel?: string }) {
  return <div className="settings-table-toolbar"><div className="settings-table-toolbar__title"><strong>{title}</strong><span>{count}</span></div><div className="settings-table-toolbar__controls"><input aria-label={`Search ${title}`} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} type="search" value={searchValue} />{statusFilter && onStatusChange ? <select aria-label={`Filter ${title} by status`} onChange={(event) => onStatusChange(event.target.value as 'all' | 'active' | 'inactive')} value={statusFilter}><option value="active">Active</option><option value="inactive">Deactivated</option><option value="all">All</option></select> : null}{onSecondaryAction && secondaryLabel ? <button className="settings-table-toolbar__secondary" onClick={onSecondaryAction} type="button">{secondaryLabel}</button> : null}{onCreate && createLabel ? <button className="settings-table-toolbar__create" onClick={onCreate} type="button">{createLabel}</button> : null}</div></div>;
}

function TablePagination({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  if (total < 2) return null;
  return <nav aria-label="Table pagination" className="settings-pagination"><span>Page {page} of {total}</span><div><button disabled={page === 1} onClick={() => onPageChange(page - 1)} type="button">Previous</button><button disabled={page === total} onClick={() => onPageChange(page + 1)} type="button">Next</button></div></nav>;
}

function pageItems<T>(items: T[], page: number, pageSize = 10) { return items.slice((page - 1) * pageSize, page * pageSize); }

export function SettingsPage() {
  usePageTitle('Settings');
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
  const [roleModal, setRoleModal] = useState<'create' | 'permissions' | null>(null);
  const [selectedRole, setSelectedRole] = useState<AccessRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleScope, setRoleScope] = useState('');
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [accessUser, setAccessUser] = useState<Member | null>(null);
  const [settingsCategory, setSettingsCategory] = useState<'access' | 'location' | 'cargo' | 'documents' | 'organization' | 'workspace'>('access');
  const [locationTab, setLocationTab] = useState<'pol' | 'pod'>('pol');
  const [cargoVesselTab, setCargoVesselTab] = useState<'cargo' | 'vessel'>('cargo');
  const [documentTab, setDocumentTab] = useState<'general' | 'operation' | 'marketing' | 'etc' | 'engineering'>('general');
  const [workspaceTab, setWorkspaceTab] = useState<'divisions' | 'members' | 'bids' | 'projects' | 'workRequests' | 'teams'>('divisions');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [bidFilter, setBidFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [workRequestFilter, setWorkRequestFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [settingsSearch, setSettingsSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [documentPage, setDocumentPage] = useState(1);
  const [settingsPage, setSettingsPage] = useState(1);
  const [statusConfirmation, setStatusConfirmation] = useState<{ name: string; isActive: boolean; onConfirm: () => void } | null>(null);
  const [designationDeleteConfirmation, setDesignationDeleteConfirmation] = useState<Designation | null>(null);
  const [workspaceCreate, setWorkspaceCreate] = useState<{ type: 'division' | 'member' | 'bid' | 'project' | 'work-request' | 'team'; id: number } | null>(null);
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
  const accessRolesQuery = useQuery({ queryKey: accessRolesQueryKey, queryFn: getAccessRoles });
  const roleDetailsQuery = useQuery({ queryKey: ['access-role', selectedRole?.id], queryFn: () => getAccessRole(selectedRole!.id), enabled: roleModal === 'permissions' && Boolean(selectedRole?.id) });
  const permissionsQuery = useQuery({ queryKey: ['permissions', roleScope], queryFn: () => getPermissions(roleScope), enabled: roleModal !== null && Boolean(roleScope) });
  const membersForAccessQuery = useQuery({ queryKey: ['members'], queryFn: getMembers, enabled: Boolean(accessUser) });
  const workspaceDivisionsQuery = useQuery({ queryKey: ['divisions'], queryFn: getDivisions, enabled: settingsCategory === 'workspace' });
  const workspaceMembersQuery = useQuery({ queryKey: ['members'], queryFn: getMembers, enabled: settingsCategory === 'workspace' });

  useEffect(() => {
    if (window.location.hash === '#workspace') setSettingsCategory('workspace');
  }, []);
  const userRolesQuery = useQuery({ queryKey: ['user-roles', accessUser?.userId], queryFn: () => getUserRoles(accessUser!.userId!), enabled: Boolean(accessUser?.userId) });
  const roleOptionsQuery = useQuery({ queryKey: ['user-role-options', accessUser?.userId], queryFn: () => getUserRoleOptions(accessUser!.userId!), enabled: Boolean(accessUser?.userId) });

  // The role API expects UUIDs. The create checklist keeps permission codes for
  // stable checkbox grouping, so resolve either a code or an already-selected ID.
  function resolvePermissionIds(values: string[]) {
    return [...new Set(values.map((value) => permissionsQuery.data?.find((permission) => permission.id === value || permission.code === value)?.id ?? value))];
  }

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

  useEffect(() => {
    if (roleModal === 'permissions' && roleDetailsQuery.data) {
      setSelectedRole(roleDetailsQuery.data);
      setRoleScope(roleDetailsQuery.data.scope);
      setPermissionIds(roleDetailsQuery.data.permissions.map((permission) => permission.id));
    }
  }, [roleModal, roleDetailsQuery.data]);

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
  const refreshAccessRoles = () => queryClient.invalidateQueries({ queryKey: accessRolesQueryKey });
  const refreshUserRoles = () => accessUser?.userId && queryClient.invalidateQueries({ queryKey: ['user-roles', accessUser.userId] });

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

  const createRoleMutation = useMutation({
    mutationFn: () => createAccessRole({ name: roleName.trim(), description: roleDescription.trim() || null, scope: roleScope, permissionIds: resolvePermissionIds(permissionIds) }),
    onSuccess: () => { toast.success(`Role “${roleName.trim()}” was created with ${permissionIds.length} permission${permissionIds.length === 1 ? '' : 's'}.`); void refreshAccessRoles(); closeRoleModal(); },
    onError: (error) => toast.error(readableApiError(error, 'We could not create this role. Please try again.')),
  });
  const updatePermissionsMutation = useMutation({
    mutationFn: () => updateRolePermissions(selectedRole!.id, { scope: roleScope, permissionIds: resolvePermissionIds(permissionIds) }),
    onSuccess: () => { toast.success(`Permissions for “${selectedRole?.name}” have been updated.`); void refreshAccessRoles(); closeRoleModal(); },
    onError: (error) => toast.error(readableApiError(error, 'We could not update role permissions. Please try again.')),
  });
  const assignRoleMutation = useMutation({
    mutationFn: (roleId: string) => assignUserRole(accessUser!.userId!, { roleId }),
    onSuccess: () => { toast.success(`Role assigned to ${accessUser?.name}.`); void refreshUserRoles(); void queryClient.invalidateQueries({ queryKey: ['user-role-options', accessUser?.userId] }); },
    onError: (error) => toast.error(readableApiError(error, 'We could not assign that role. Please try again.')),
  });
  const revokeRoleMutation = useMutation({
    mutationFn: (roleId: string) => revokeUserRole(accessUser!.userId!, roleId),
    onSuccess: () => { toast.success(`Role removed from ${accessUser?.name}.`); void refreshUserRoles(); void queryClient.invalidateQueries({ queryKey: ['user-role-options', accessUser?.userId] }); },
    onError: (error) => toast.error(readableApiError(error, 'We could not remove that role. Please try again.')),
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
  function openCreateRole() {
    setSelectedRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleScope(customRoleScopes[0]);
    setPermissionIds([]);
    setRoleModal('create');
  }
  function openPermissions(role: AccessRole) { setSelectedRole(role); setRoleName(role.name); setRoleDescription(role.description ?? ''); setRoleScope(role.scope); setPermissionIds(role.permissions.map((permission) => permission.id)); setRoleModal('permissions'); }
  function closeRoleModal() { setRoleModal(null); setSelectedRole(null); setPermissionIds([]); }
  function changeRoleScope(scope: string) { setRoleScope(scope); setPermissionIds([]); }
  function togglePermission(id: string) { setPermissionIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  function togglePermissionGroup(ids: string[]) { setPermissionIds((current) => ids.every((id) => current.includes(id)) ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]); }
  function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roleName.trim()) { toast.error('Enter a role name so users can identify this access level.'); return; }
    if (!roleScope) { toast.error('Select a role scope before saving.'); return; }
    if (!permissionIds.length) { toast.error('Select at least one permission before saving this role.'); return; }
    if (roleModal === 'create') createRoleMutation.mutate(); else updatePermissionsMutation.mutate();
  }
  function handleRevokeRole(role: AccessRole) {
    if (window.confirm(`Remove “${role.name}” from ${accessUser?.name}? They will lose the permissions granted by this role.`)) revokeRoleMutation.mutate(role.id);
  }

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

  function requestStatusChange(name: string, isActive: boolean, onConfirm: () => void) {
    setStatusConfirmation({ name, isActive, onConfirm });
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
  let visibleRoles = (accessRolesQuery.data ?? []).filter((value) => matchesSettingsSearch(value.name, value.code));
  const settingsTotalRows = settingsCategory === 'access' ? visibleRoles.length : settingsCategory === 'location' ? (locationTab === 'pol' ? visiblePolCodes.length : visiblePodCodes.length) : settingsCategory === 'cargo' ? (cargoVesselTab === 'cargo' ? visibleCargoCodes.length : visibleVesselCodes.length) : settingsCategory === 'organization' ? visibleDesignations.length : 0;
  const settingsTotalPages = Math.max(1, Math.ceil(settingsTotalRows / 10));
  const safeSettingsPage = Math.min(settingsPage, settingsTotalPages);
  visiblePolCodes = pageItems(visiblePolCodes, safeSettingsPage); visiblePodCodes = pageItems(visiblePodCodes, safeSettingsPage); visibleCargoCodes = pageItems(visibleCargoCodes, safeSettingsPage); visibleVesselCodes = pageItems(visibleVesselCodes, safeSettingsPage); visibleDesignations = pageItems(visibleDesignations, safeSettingsPage); visibleRoles = pageItems(visibleRoles, safeSettingsPage);
  useEffect(() => { setSettingsPage(1); }, [settingsCategory, locationTab, cargoVesselTab, settingsSearch, statusFilter]);
  const availableRoleScopes = customRoleScopes;
  const workspaceDivisionNames = new Map((workspaceDivisionsQuery.data?.items ?? []).map((division) => [division.id, division.name]));
  const memberDivisionName = (member: Member) => member.division?.name ?? workspaceDivisionNames.get(member.divisionId) ?? 'Not assigned';
  const settingsSearchPlaceholder = settingsCategory === 'location' ? `Search ${locationTab.toUpperCase()} codes...` : settingsCategory === 'cargo' ? `Search ${cargoVesselTab} codes...` : settingsCategory === 'documents' ? `Search ${documentTab === 'operation' ? 'PM & Operation' : documentTab} document codes...` : settingsCategory === 'access' ? 'Search roles...' : settingsCategory === 'workspace' ? 'Search workspace records...' : 'Search designations...';
  const activeSettingsToolbar = settingsCategory === 'access' ? { title: 'Roles & Permissions', count: accessRolesQuery.isLoading ? 'Loading roles' : `${(accessRolesQuery.data ?? []).length} records`, createLabel: 'Create Role', onCreate: openCreateRole, secondaryLabel: 'Manage User Access', onSecondaryAction: () => setAccessUser({ id: '', userId: null, companyId: '', divisionId: '', name: '', email: '', isActive: true, createdAt: '', updatedAt: '' }) } : settingsCategory === 'location' && locationTab === 'pol' ? { title: 'POL Codes', count: `${polCodes.length} records`, createLabel: 'Add POL Code', onCreate: openCreate } : settingsCategory === 'location' ? { title: 'POD Codes', count: `${podCodes.length} records`, createLabel: 'Add POD Code', onCreate: openCreatePodCode } : settingsCategory === 'cargo' && cargoVesselTab === 'cargo' ? { title: 'Cargo Codes', count: `${cargoCodes.length} records`, createLabel: 'Create Cargo Code', onCreate: openCreateCargoCode } : settingsCategory === 'cargo' ? { title: 'Vessel Codes', count: `${vesselCodes.length} records`, createLabel: 'Create Vessel Code', onCreate: openCreateVesselCode } : settingsCategory === 'documents' && documentTab === 'general' ? { title: 'General Document Codes', count: `${generalDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateGeneralDocumentCode } : settingsCategory === 'documents' && documentTab === 'operation' ? { title: 'PM & Operation Codes', count: `${projectManagementOperationDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateProjectManagementOperationDocumentCode } : settingsCategory === 'documents' && documentTab === 'marketing' ? { title: 'Marketing Codes', count: `${marketingDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateMarketingDocumentCode } : settingsCategory === 'documents' && documentTab === 'etc' ? { title: 'ETC Document Codes', count: `${etcDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateEtcDocumentCode } : settingsCategory === 'documents' ? { title: 'Engineering Document Codes', count: `${engineeringDocumentCodes.length} records`, createLabel: 'Create Code', onCreate: openCreateEngineeringDocumentCode } : settingsCategory === 'organization' ? { title: 'Designations', count: `${designations.length} records`, createLabel: 'Create Designation', onCreate: openCreateDesignation } : null;
  return (
    <div className="dash-page settings-center">
      {workspaceCreate?.type === 'division' ? <CreateDivisionModal onClose={() => setWorkspaceCreate(null)} /> : workspaceCreate ? <DashboardWorkspace createRequest={workspaceCreate.id} createType={workspaceCreate.type} modalOnly /> : null}
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
      {settingsCategory === 'location' ? <nav aria-label="Location code types" className="settings-sub-tabs"><button className={locationTab === 'pol' ? 'is-active' : ''} onClick={() => setLocationTab('pol')} type="button">POL — Port of Loading</button><button className={locationTab === 'pod' ? 'is-active' : ''} onClick={() => setLocationTab('pod')} type="button">POD — Port of Discharge</button></nav> : null}
      {settingsCategory === 'cargo' ? <nav aria-label="Cargo and vessel code types" className="settings-sub-tabs"><button className={cargoVesselTab === 'cargo' ? 'is-active' : ''} onClick={() => setCargoVesselTab('cargo')} type="button">Cargo Codes</button><button className={cargoVesselTab === 'vessel' ? 'is-active' : ''} onClick={() => setCargoVesselTab('vessel')} type="button">Vessel Codes</button></nav> : null}
      {settingsCategory === 'documents' ? <nav aria-label="Document code types" className="settings-sub-tabs"><button className={documentTab === 'general' ? 'is-active' : ''} onClick={() => setDocumentTab('general')} type="button">General</button><button className={documentTab === 'operation' ? 'is-active' : ''} onClick={() => setDocumentTab('operation')} type="button">PM &amp; Operation</button><button className={documentTab === 'marketing' ? 'is-active' : ''} onClick={() => setDocumentTab('marketing')} type="button">Marketing</button><button className={documentTab === 'etc' ? 'is-active' : ''} onClick={() => setDocumentTab('etc')} type="button">ETC</button><button className={documentTab === 'engineering' ? 'is-active' : ''} onClick={() => setDocumentTab('engineering')} type="button">Engineering</button></nav> : null}
      {activeSettingsToolbar ? <SettingsTableToolbar {...activeSettingsToolbar} onSearchChange={setSettingsSearch} searchPlaceholder={settingsSearchPlaceholder} searchValue={settingsSearch} statusFilter={settingsCategory === 'organization' || settingsCategory === 'access' ? undefined : statusFilter} onStatusChange={setStatusFilter} /> : null}
      {settingsCategory === 'access' ? <section className="dash-panel division-panel settings-configuration-panel">
        <div className="dash-section-title"><div><strong>Roles & Permissions</strong><span>{accessRolesQuery.isLoading ? 'Loading roles' : `${(accessRolesQuery.data ?? []).length} role records`}</span></div><button onClick={() => setAccessUser({ id: '', userId: null, companyId: '', divisionId: '', name: '', email: '', isActive: true, createdAt: '', updatedAt: '' })} type="button">Manage User Access</button><button onClick={openCreateRole} type="button">Create Role</button></div>
        <div className="division-table">
          <div className="role-grid role-grid--head"><span>Role</span><span>Scope</span><span>Permissions</span><span>Type</span><span>Actions</span></div>
          {accessRolesQuery.isLoading ? <div className="division-empty">Loading roles and permissions...</div> : null}
          {accessRolesQuery.isError ? <div className="division-empty">Unable to load roles. Refresh the page to try again.</div> : null}
          {!accessRolesQuery.isLoading && !accessRolesQuery.isError && !(accessRolesQuery.data ?? []).length ? <div className="division-empty">No roles are available. Create a role to define access for your team.</div> : null}
          {!accessRolesQuery.isLoading && !accessRolesQuery.isError && !(visibleRoles).length && (accessRolesQuery.data ?? []).length ? <div className="division-empty">No matching roles found. Try adjusting your search.</div> : null}
          {visibleRoles.map((role) => <div className="role-grid" key={role.id}><span><strong>{role.name}</strong><small>{role.description || role.code}</small></span><span>{role.scope || 'Not specified'}</span><span>{role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}</span><span><em className={role.isSystemRole ? 'division-status' : 'division-status division-status--active'}>{role.isSystemRole ? 'System' : 'Custom'}</em></span><span className="division-actions"><button onClick={() => openPermissions(role)} type="button">Manage Permissions</button></span></div>)}
        </div>
      </section> : null}
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
      {settingsCategory === 'documents' ? <TablePagination onPageChange={setDocumentPage} page={safeDocumentPage} total={documentTotalPages} /> : null}
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
        {workspaceTab === 'divisions' ? <section className="dash-panel division-panel settings-configuration-panel"><div className="dash-section-title"><div><strong>Available Divisions</strong><span>{workspaceDivisionsQuery.isLoading ? 'Loading divisions' : `${(workspaceDivisionsQuery.data?.items ?? []).length} division records`}</span></div><TableFilter label="Filter divisions" value={divisionFilter} onChange={setDivisionFilter} /></div><div className="settings-workspace-table"><div className="division-grid division-grid--head"><span>Division</span><span>Abbreviation</span><span>Type</span><span>Status</span><span /></div>{(workspaceDivisionsQuery.data?.items ?? []).filter((division) => `${division.name} ${division.abbr} ${division.divisionType?.name ?? ''}`.toLowerCase().includes(divisionFilter.toLowerCase())).map((division) => <div className="division-grid" key={division.id}><span><strong>{division.name}</strong></span><span>{division.abbr}</span><span>{division.divisionType?.name ?? 'Not assigned'}</span><span><em className={division.isActive ? 'division-status division-status--active' : 'division-status'}>{division.isActive ? 'Active' : 'Inactive'}</em></span><span /></div>)}{!workspaceDivisionsQuery.isLoading && !(workspaceDivisionsQuery.data?.items ?? []).length ? <div className="division-empty">No divisions are available.</div> : null}</div></section> : null}
        {workspaceTab === 'members' ? <section className="dash-panel division-panel settings-configuration-panel"><div className="dash-section-title"><div><strong>Members</strong><span>{workspaceMembersQuery.isLoading ? 'Loading members' : `${(workspaceMembersQuery.data?.items ?? []).length} member records`}</span></div><TableFilter label="Filter members" value={memberFilter} onChange={setMemberFilter} /></div><div className="settings-workspace-table"><div className="division-grid division-grid--head"><span>Member</span><span>Designation</span><span>Division</span><span>Status</span><span /></div>{(workspaceMembersQuery.data?.items ?? []).filter((member) => `${member.name} ${member.email} ${member.designation ?? member.roleTitle ?? ''} ${memberDivisionName(member)}`.toLowerCase().includes(memberFilter.toLowerCase())).map((member) => <div className="division-grid" key={member.id}><span><strong>{member.name}</strong><small>{member.email}</small></span><span>{member.designation ?? member.roleTitle ?? 'Not assigned'}</span><span>{memberDivisionName(member)}</span><span><em className={member.isActive ? 'division-status division-status--active' : 'division-status'}>{member.isActive ? 'Active' : 'Inactive'}</em></span><span /></div>)}{!workspaceMembersQuery.isLoading && !(workspaceMembersQuery.data?.items ?? []).length ? <div className="division-empty">No members are available.</div> : null}</div></section> : null}
        {workspaceTab === 'bids' ? <WorkspacePanelFilter label="Filter bids" value={bidFilter} onChange={setBidFilter}><BidsPanel filterText={bidFilter} /></WorkspacePanelFilter> : null}
        {workspaceTab === 'projects' ? <WorkspacePanelFilter label="Filter projects" value={projectFilter} onChange={setProjectFilter}><ProjectsPanel filterText={projectFilter} /></WorkspacePanelFilter> : null}
        {workspaceTab === 'workRequests' ? <WorkspacePanelFilter label="Filter work requests" value={workRequestFilter} onChange={setWorkRequestFilter}><WorkRequestsPage embedded filterText={workRequestFilter} /></WorkspacePanelFilter> : null}
        {workspaceTab === 'teams' ? <WorkspacePanelFilter label="Filter teams" value={teamFilter} onChange={setTeamFilter}><TeamPage embedded filterText={teamFilter} /></WorkspacePanelFilter> : null}
      </div> : null}
      {settingsCategory !== 'documents' && settingsCategory !== 'workspace' ? <TablePagination onPageChange={setSettingsPage} page={safeSettingsPage} total={settingsTotalPages} /> : null}
      {designationDeleteConfirmation ? <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="delete-designation-title" aria-modal="true" className="division-modal status-confirmation-dialog" role="dialog"><div className="division-modal__head"><div><strong id="delete-designation-title">Delete designation?</strong><span>This action cannot be undone. Members using this designation may need to be updated.</span></div><button aria-label="Close delete confirmation" onClick={() => setDesignationDeleteConfirmation(null)} type="button">X</button></div><div className="status-confirmation-dialog__body"><p><strong>{designationDeleteConfirmation.name}</strong></p><p>Do you want to continue?</p></div><div className="division-form__actions"><button onClick={() => setDesignationDeleteConfirmation(null)} type="button">Cancel</button><button className="status-confirmation-dialog__deactivate" disabled={deleteDesignationMutation.isPending} onClick={() => { const designation = designationDeleteConfirmation; setDesignationDeleteConfirmation(null); deleteDesignationMutation.mutate(designation.id); }} type="button">{deleteDesignationMutation.isPending ? 'Deleting...' : 'Delete'}</button></div></section></div> : null}
      {statusConfirmation ? <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="status-confirmation-title" aria-modal="true" className="division-modal status-confirmation-dialog" role="dialog"><div className="division-modal__head"><div><strong id="status-confirmation-title">{statusConfirmation.isActive ? 'Deactivate configuration item?' : 'Reactivate configuration item?'}</strong><span>{statusConfirmation.isActive ? 'This item will no longer be available for new selections.' : 'This item will become available for new selections again.'}</span></div><button aria-label="Close confirmation dialog" onClick={() => setStatusConfirmation(null)} type="button">X</button></div><div className="status-confirmation-dialog__body"><p><strong>{statusConfirmation.name}</strong></p><p>Do you want to continue?</p></div><div className="division-form__actions"><button onClick={() => setStatusConfirmation(null)} type="button">Cancel</button><button className={statusConfirmation.isActive ? 'status-confirmation-dialog__deactivate' : 'status-confirmation-dialog__reactivate'} onClick={() => { const confirmation = statusConfirmation; setStatusConfirmation(null); confirmation.onConfirm(); }} type="button">{statusConfirmation.isActive ? 'Deactivate' : 'Reactivate'}</button></div></section></div> : null}
      {roleModal === 'create' ? <CreateRoleModal description={roleDescription} name={roleName} onClose={closeRoleModal} onDescriptionChange={setRoleDescription} onNameChange={setRoleName} onScopeChange={changeRoleScope} onSubmit={submitRole} onToggleGroup={togglePermissionGroup} onTogglePermission={togglePermission} permissionCodes={permissionIds} permissions={permissionsQuery.data ?? []} permissionsError={permissionsQuery.isError} permissionsLoading={permissionsQuery.isLoading} saving={createRoleMutation.isPending} scope={roleScope} scopes={availableRoleScopes} scopesLoading={false} /> : null}
      {roleModal === 'permissions' ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal role-modal" role="dialog"><div className="division-modal__head"><div><strong>{`Manage ${selectedRole?.name} Permissions`}</strong><span>Changes take effect for everyone assigned to this role.</span></div><button aria-label="Close role dialog" onClick={closeRoleModal} type="button">X</button></div><form className="division-form" onSubmit={submitRole}><fieldset className="role-permissions"><legend>Permissions <small>Select at least one permission.</small></legend>{permissionsQuery.isLoading ? <p>Loading available permissions...</p> : null}{permissionsQuery.isError ? <p className="role-form-error">We could not load the available permissions. Close this dialog and try again.</p> : null}{(permissionsQuery.data ?? []).map((permission) => <PermissionChecklistItem checked={permissionIds.includes(permission.id)} key={permission.id} name={permission.displayName || permission.code} onChange={() => togglePermission(permission.id)} title={permission.description || permission.code} />)}</fieldset><div className="division-form__actions"><button onClick={closeRoleModal} type="button">Cancel</button><button disabled={permissionsQuery.isLoading || updatePermissionsMutation.isPending} type="submit">{updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}</button></div></form></section></div> : null}
      {accessUser ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal role-modal" role="dialog"><div className="division-modal__head"><div><strong>Manage User Access</strong><span>Select a user, then assign or remove roles.</span></div><button aria-label="Close user access dialog" onClick={() => setAccessUser(null)} type="button">X</button></div><div className="division-form"><label><span>User</span><select onChange={(event) => { const member = (membersForAccessQuery.data?.items ?? []).find((value) => value.id === event.target.value); setAccessUser(member ?? accessUser); }} value={accessUser.id}><option value="">Select a user</option>{(membersForAccessQuery.data?.items ?? []).filter((member) => member.userId && member.isActive).map((member) => <option key={member.id} value={member.id}>{member.name} — {member.email}</option>)}</select></label>{!membersForAccessQuery.isLoading && !(membersForAccessQuery.data?.items ?? []).filter((member) => member.userId).length ? <p className="role-form-error">No active portal users are available. Create a member with a linked user account first.</p> : null}{accessUser.userId ? <><div className="role-assignment"><strong>Assigned roles</strong>{userRolesQuery.isLoading ? <p>Loading assigned roles...</p> : null}{userRolesQuery.isError ? <p className="role-form-error">Unable to load this user’s roles. Please try again.</p> : null}{(userRolesQuery.data ?? []).length ? (userRolesQuery.data ?? []).map((assignment) => <div className="role-assignment__row" key={assignment.id}><span><strong>{assignment.role.name}</strong><small>{assignment.role.scope} scope · assigned {formatDate(assignment.assignedAt)}</small></span><button disabled={revokeRoleMutation.isPending} onClick={() => handleRevokeRole(assignment.role)} type="button">{revokeRoleMutation.isPending && revokeRoleMutation.variables === assignment.role.id ? 'Removing...' : 'Remove'}</button></div>) : !userRolesQuery.isLoading ? <p>No roles are assigned yet.</p> : null}</div><div className="role-assignment"><strong>Available roles</strong>{roleOptionsQuery.isLoading ? <p>Loading roles that can be assigned...</p> : null}{roleOptionsQuery.isError ? <p className="role-form-error">Unable to load role options for this user.</p> : null}{(roleOptionsQuery.data ?? []).map((role) => <div className="role-assignment__row" key={role.id}><span><strong>{role.name}</strong><small>{role.scope} scope</small></span><button disabled={assignRoleMutation.isPending} onClick={() => assignRoleMutation.mutate(role.id)} type="button">{assignRoleMutation.isPending && assignRoleMutation.variables === role.id ? 'Assigning...' : 'Assign'}</button></div>)}</div></> : <p>Select a user to view role assignments and available roles.</p>}<div className="division-form__actions"><button onClick={() => setAccessUser(null)} type="button">Done</button></div></div></section></div> : null}
      {isModalOpen ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editingCode ? 'Update POL Code' : 'Create POL Code'}</strong></div><button aria-label="Close POL Code dialog" onClick={closeModal} type="button">X</button></div><form className="division-form" onSubmit={handleSubmit}><label className="division-form__full"><span>POL Code name</span><input autoFocus maxLength={160} onChange={(event) => setName(event.target.value)} placeholder="Enter POL Code name" required value={name} /></label><div className="division-form__actions"><button onClick={closeModal} type="button">Cancel</button><button disabled={saveMutation.isPending || (Boolean(editingCode) && codeDetailsQuery.isLoading)} type="submit">{saveMutation.isPending ? 'Saving...' : editingCode ? 'Update POL Code' : 'Create POL Code'}</button></div></form></section></div> : null}
      {isPodModalOpen ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{editingPodCode ? 'Update POD Code' : 'Create POD Code'}</strong></div><button aria-label="Close POD Code dialog" onClick={closePodModal} type="button">X</button></div><form className="division-form" onSubmit={handlePodSubmit}><label><span>POD Code name</span><input autoFocus maxLength={160} onChange={(event) => setPodName(event.target.value)} placeholder="Enter POD Code name" required value={podName} /></label><div className="division-form__actions"><button onClick={closePodModal} type="button">Cancel</button><button disabled={savePodMutation.isPending || (Boolean(editingPodCode) && podCodeDetailsQuery.isLoading)} type="submit">{savePodMutation.isPending ? 'Saving...' : editingPodCode ? 'Update POD Code' : 'Create POD Code'}</button></div></form></section></div> : null}
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

function PermissionChecklistItem({ checked, name, title, onChange }: { checked: boolean; name: string; title: string; onChange: () => void }) {
  return <label className="permission-checklist-item" title={title}>
    <input aria-label={`Select ${name}`} checked={checked} onChange={onChange} type="checkbox" />
    <span className="permission-checklist-item__name">{name}</span>
  </label>;
}

function CreateRoleModal({ name, description, scope, scopes, scopesLoading, permissions, permissionCodes, permissionsLoading, permissionsError, saving, onNameChange, onDescriptionChange, onScopeChange, onTogglePermission, onToggleGroup, onSubmit, onClose }: { name: string; description: string; scope: string; scopes: string[]; scopesLoading: boolean; permissions: Permission[]; permissionCodes: string[]; permissionsLoading: boolean; permissionsError: boolean; saving: boolean; onNameChange: (value: string) => void; onDescriptionChange: (value: string) => void; onScopeChange: (value: string) => void; onTogglePermission: (code: string) => void; onToggleGroup: (codes: string[]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const groups = groupPermissions(permissions, search);

  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="create-role-title" aria-modal="true" className="role-create-dialog" role="dialog"><header className="role-create-dialog__header"><div><h2 id="create-role-title">Create Role</h2><p>Define an access role and choose the permissions it should include.</p></div><button aria-label="Close create role dialog" onClick={onClose} type="button">×</button></header><form className="role-create-form" onSubmit={onSubmit}><div className="role-create-dialog__body"><div className="role-create-fields"><label><span>Role name <b aria-hidden="true">*</b></span><input autoFocus maxLength={100} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. HR Coordinator" required value={name} /><small>Use a clear, recognizable access role name.</small></label><label><span>Scope</span><select disabled={scopesLoading || !scopes.length} onChange={(event) => onScopeChange(event.target.value)} required value={scope}><option value="">{scopesLoading ? 'Loading scopes...' : scopes.length ? 'Select scope' : 'No scopes available'}</option>{scopes.map((value) => <option key={value} value={value}>{value}</option>)}</select><small>Available scopes are supplied by the role API.</small></label><label className="role-create-fields__full"><span>Description <em>Optional</em></span><input maxLength={250} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Briefly describe this role’s responsibility" value={description} /></label></div><section aria-labelledby="role-permissions-title" className="role-permission-selector"><div className="role-permission-selector__heading"><div><h3 id="role-permissions-title">Permissions</h3><p>Select the actions this role can perform.</p></div><strong>{permissionCodes.length} permission{permissionCodes.length === 1 ? '' : 's'} selected</strong></div><label className="role-permission-search"><span>Search permissions</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions" type="search" value={search} /></label><div className="role-permission-groups">{!scope ? <p className="role-permission-state">Select a scope to load its permissions.</p> : null}{permissionsLoading ? <p className="role-permission-state">Loading available permissions...</p> : null}{permissionsError ? <p className="role-form-error">We could not load the available permissions. Close this dialog and try again.</p> : null}{scope && !permissionsLoading && !permissionsError && !groups.length ? <p className="role-permission-state">No permissions match your search.</p> : null}{groups.map(([category, groupPermissions]) => { const codes = groupPermissions.map((permission) => permission.code); const allSelected = codes.every((code) => permissionCodes.includes(code)); return <section className="role-permission-group" key={category}><header><h4>{category}</h4><button onClick={() => onToggleGroup(codes)} type="button">{allSelected ? 'Clear all' : 'Select all'}</button></header><div>{groupPermissions.map((permission) => <label key={permission.id} title={permission.description || permission.code}><input checked={permissionCodes.includes(permission.code)} onChange={() => onTogglePermission(permission.code)} type="checkbox" /><span>{permission.name || permission.code}</span></label>)}</div></section>; })}</div></section></div><footer className="role-create-dialog__footer"><button onClick={onClose} type="button">Cancel</button><button disabled={!scope || permissionsLoading || saving} type="submit">{saving ? 'Creating role...' : 'Create Role'}</button></footer></form></section></div>;
}

function groupPermissions(permissions: Permission[], search: string): Array<[string, Permission[]]> {
  const query = search.trim().toLowerCase();
  const grouped = new Map<string, Permission[]>();
  permissions.filter((permission) => !query || [permission.displayName, permission.code, permission.description ?? ''].some((value) => value.toLowerCase().includes(query))).forEach((permission) => {
    const code = permission.code.toUpperCase();
    const category = code.includes('COMPANY') ? 'Company' : /DIVISION|TEAM|POD|POL|CARGO|VESSEL/.test(code) ? 'Organization' : /MEMBER|USER/.test(code) ? 'Members' : code.includes('BID') ? 'Bid' : /PROJECT|TASK/.test(code) ? 'Project' : /REQUEST|REVISION|INFO/.test(code) ? 'Work Request' : /DOCUMENT|FILE|ATTACHMENT/.test(code) ? 'Documents' : 'Settings';
    grouped.set(category, [...(grouped.get(category) ?? []), permission]);
  });
  const order = ['Company', 'Organization', 'Members', 'Bid', 'Project', 'Work Request', 'Documents', 'Settings'];
  return [...grouped.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
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
