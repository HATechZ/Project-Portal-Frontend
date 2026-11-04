type Recipient = Record<string, unknown>;

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function record(value: unknown): Recipient | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Recipient : undefined;
}

function contextLabel(value: unknown, fallbackType: unknown): string | undefined {
  const context = record(value);
  const name = text(context?.name) ?? (typeof value === 'string' ? text(value) : undefined);
  const kind = text(context?.kind) ?? text(fallbackType);
  const role = kind === 'DIVISION_LEAD' ? 'Division Lead' : kind === 'CLIENT_CONTACT' ? 'Client Contact' : undefined;
  return [name, role].filter(Boolean).join(' · ') || undefined;
}

export function recipientPresentation(recipient: Recipient) {
  const contexts = Array.isArray(recipient.contexts) && recipient.contexts.length ? recipient.contexts : [recipient.context];
  const details = contexts.map((context) => contextLabel(context, recipient.contextType)).filter((value): value is string => Boolean(value));
  return {
    displayName: text(recipient.displayName) ?? text(recipient.name) ?? text(recipient.label) ?? 'Recipient',
    details: [...new Set(details)],
    email: text(recipient.email),
    replyNote: recipient.canRespond === false ? 'Reply permission not currently assigned' : undefined,
  };
}

export function isCurrentRequester(recipient: Recipient, activeActorProfileId: string | null | undefined) {
  return Boolean(activeActorProfileId && (recipient.actorId === activeActorProfileId || recipient.actorProfileId === activeActorProfileId));
}
