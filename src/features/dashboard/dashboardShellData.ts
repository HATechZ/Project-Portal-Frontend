export type WorkflowStatus = 'action' | 'neutral' | 'info' | 'blocked' | 'ok';

export const metricCards = [
  { label: 'Active projects', value: '14', caption: '3 new this month' },
  { label: 'Active bids', value: '9', caption: '2 closing this week' },
  { label: 'Awaiting my action', value: '6', caption: 'oldest 5 days', active: true },
  { label: 'Overdue', value: '4', caption: 'across 3 divisions' },
  { label: 'Listed this month', value: '31', caption: 'HML registered' },
];

export const actionRows = [
  { ref: 'BID-21128', title: 'DEME Offshore Cargo Coordination - Crane', client: 'DEME', stage: 'Bid sign-off', days: '1 day', due: '25-08-2026', action: 'Sign off' },
  { ref: 'WR-001', title: 'Cargo CRA lifting arrangement - vessel CA2', client: 'DEME', stage: 'Engineering lead review', days: '5 days', due: '24-08-2026', action: 'Review' },
  { ref: 'WR-006', title: 'Shipment 01 stowage plan', client: 'DEME', stage: 'Client revision requested', days: '2 days', due: '27-08-2026', action: 'Open panel' },
  { ref: 'WR-004', title: 'Seafastening calculation pack - CRA', client: 'Boskalis', stage: 'Returned to division', days: '4 days', due: '23-08-2026', action: 'Reassign' },
  { ref: 'WR-002', title: 'Crane boom rest weld detail', client: 'DEME', stage: 'Approval review', days: '2 days', due: '28-08-2026', action: 'Approve' },
];

export const pipelineStages = [
  { label: 'Division', value: '12', caption: '1 overdue', tone: 'blocked' },
  { label: 'PM', value: '8', caption: '', tone: 'info' },
  { label: 'TMS drawing', value: '17', caption: '2 overdue', tone: 'blocked' },
  { label: 'Checking', value: '9', caption: '1 overdue', tone: 'blocked' },
  { label: 'Approval', value: '6', caption: '', tone: 'info' },
  { label: 'Engineering', value: '4', caption: '', tone: 'info' },
  { label: 'Marketing', value: '3', caption: '', tone: 'info' },
  { label: 'Client', value: '7', caption: '', tone: 'info' },
  { label: 'Listed', value: '129', caption: '', tone: 'ok' },
];

export const workRows: Array<{
  ref: string;
  title: string;
  stage: string;
  owner: string;
  due: string;
  status: WorkflowStatus;
}> = [
  { ref: 'BID-21128', title: 'DEME Offshore ...', stage: 'Bid sign-off', owner: 'Nayeem Rahman', due: '25-08-2026', status: 'action' },
  { ref: 'WR-001', title: 'Cargo CRA liftin...', stage: 'Engineering lead review', owner: 'Nayeem Rahman', due: '24-08-2026', status: 'action' },
  { ref: 'WR-002', title: 'Crane boom res...', stage: 'Approval review', owner: 'Nayeem Rahman', due: '28-08-2026', status: 'action' },
  { ref: 'WR-003', title: 'Crane pedestal ...', stage: 'Approval review', owner: 'Nayeem Rahman', due: '26-08-2026', status: 'action' },
  { ref: 'WR-004', title: 'Seafastening ca...', stage: 'Returned to division', owner: 'Imran Kabir', due: '23-08-2026', status: 'action' },
  { ref: 'WR-005', title: 'Shipment 01 la...', stage: 'Drawing in progress', owner: 'Sarah Lee', due: '30-08-2026', status: 'info' },
  { ref: 'WR-006', title: 'Shipment 01 st...', stage: 'Client revision requested', owner: 'Rafiq Hossain', due: '27-08-2026', status: 'action' },
  { ref: 'WR-8412', title: 'Newbuild 8412...', stage: 'Forwarded to CCR', owner: 'Sarah Lee', due: '04-09-2026', status: 'neutral' },
  { ref: 'BID-21094', title: 'Boskalis heavy l...', stage: 'Info requested from client', owner: 'Imran Kabir', due: '29-08-2026', status: 'blocked' },
];

export const riskItems = [
  { ref: 'WR-004', badge: 'Overdue', due: '23-08-2026', title: 'Seafastening calculation pack - CRA', owner: 'Imran Kabir - division_lead' },
  { ref: 'WR-001', badge: 'Stalled 5d', due: '24-08-2026', title: 'Cargo CRA lifting arrangement - CA2', owner: 'Nayeem Rahman - prime_consultant' },
  { ref: 'BID-21128', badge: 'Due 2d', due: '25-08-2026', title: 'DEME Offshore Cargo Coordination - Crane', owner: 'Nayeem Rahman - prime_consultant' },
  { ref: 'WR-003', badge: 'Due 3d', due: '26-08-2026', title: 'Crane pedestal load-out sequence', owner: 'Sarah Lee - tms_approval' },
  { ref: 'WR-006', badge: 'Due 4d', due: '27-08-2026', title: 'Shipment 01 stowage plan', owner: 'Rafiq Hossain - division_member' },
  { ref: 'WR-005', badge: 'Due 7d', due: '30-08-2026', title: 'Shipment 01 lashing schedule', owner: 'Sarah Lee - tms_drawing' },
];

export const activityItems = [
  { initials: 'SL', text: 'Sarah Lee submitted v3 of HBI-14-GA-001.dwg', date: '23-08-2026 08:14' },
  { initials: 'IK', text: 'Imran Kabir requested client info on WR-004', date: '23-08-2026 07:52' },
  { initials: 'RH', text: 'Rafiq Hossain uploaded 2 documents to WR-006', date: '22-08-2026 17:31' },
  { initials: 'DL', text: 'DEME (client) requested revision on WR-006', date: '22-08-2026 16:08' },
  { initials: 'NR', text: 'Nayeem Rahman approved WR-002 Rev A', date: '22-08-2026 14:45' },
  { initials: 'SL', text: 'Sarah Lee assigned checker on WR-003', date: '22-08-2026 11:28' },
  { initials: 'CC', text: 'CCR Coordinator listed on HML WR-2026-0391', date: '22-08-2026 09:03' },
  { initials: 'IK', text: 'Imran Kabir created BID-21128', date: '21-08-2026 15:48' },
];
