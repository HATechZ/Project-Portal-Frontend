type Recipient = Record<string, unknown>;

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function record(value: unknown): Recipient | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Recipient : undefined;
}

function humanize(value: unknown): string | undefined {
  const source = text(value);
  if (!source) return undefined;
  return source.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function named(value: unknown): string | undefined {
  const item = record(value);
  const result = text(item?.name) ?? text(item?.label) ?? (typeof value === 'string' ? text(value) : undefined);
  return result && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result) ? result : undefined;
}

function detail(label: string, value: unknown) {
  const readable = named(value) ?? humanize(value);
  return readable ? `${label}: ${readable}` : undefined;
}

/** Formats metadata supplied by the backend without deriving recipient eligibility. */
export function recipientPresentation(recipient: Recipient) {
  const context = record(recipient.context);
  const contexts = Array.isArray(recipient.contexts) && recipient.contexts.length ? recipient.contexts : [recipient.context].filter(Boolean);
  const contextRecords = contexts.map(record).filter((item): item is Recipient => Boolean(item));
  const division = named(recipient.divisionName ?? recipient.division ?? context?.divisionName ?? context?.division) ?? contextRecords.map((item) => named(item.divisionName ?? item.division ?? (item.kind === 'DIVISION_LEAD' ? item : undefined))).find(Boolean);
  const designation = named(recipient.designationName ?? recipient.designation ?? recipient.jobTitle ?? recipient.roleTitle ?? context?.designationName ?? context?.designation) ?? contextRecords.map((item) => named(item.designationName ?? item.designation ?? item.jobTitle ?? item.roleTitle)).find(Boolean);
  const teamValues = [...(Array.isArray(recipient.teamNames) ? recipient.teamNames : []), recipient.team, recipient.teamName, ...(Array.isArray(recipient.teams) ? recipient.teams : []), ...contextRecords.flatMap((item) => [item.team, item.teamName, ...(Array.isArray(item.teams) ? item.teams : [])])];
  const teams = [...new Set(teamValues.map(named).filter((value): value is string => Boolean(value)))];
  const details = [
    ...contexts.map((item) => detail('Context', item)),
    detail('Division', division),
    detail('Designation', designation),
    detail('Team', recipient.team ?? recipient.teamName ?? context?.team ?? context?.teamName),
    detail('Recipient type', recipient.recipientType ?? recipient.type ?? recipient.actorType ?? recipient.profileType ?? recipient.contextType ?? context?.type ?? context?.kind),
  ].filter((value): value is string => Boolean(value));
  return {
    displayName: text(recipient.displayName) ?? text(recipient.name) ?? text(recipient.label) ?? 'Recipient',
    division,
    designation,
    teams,
    details: [...new Set(details)],
    email: text(recipient.email),
  };
}
