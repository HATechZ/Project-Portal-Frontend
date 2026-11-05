import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export type ExistingMemberOption = { id: string; name: string; email?: string; designation?: string; highlightDesignation?: boolean; badges?: string[]; disabled?: boolean };

type Props = { members: ExistingMemberOption[]; value: string; onChange: (value: string) => void; label?: string; placeholder?: string; emptyMessage?: string; disabled?: boolean };

export function ExistingMemberSelector({ members, value, onChange, label = 'Member', placeholder = 'Select a member', emptyMessage = 'No members available.', disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const valueId = useId();
  const listId = useId();
  const selected = members.find((member) => member.id === value);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (!open) { setOpen(true); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)')?.focus()); return; }
    const options = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []);
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowDown' ? Math.min(index + 1, options.length - 1) : index < 0 ? options.length - 1 : Math.max(index - 1, 0);
    options[next]?.focus();
  }
  return <div className="existing-member-selector" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={keys} ref={root}><span className="existing-member-selector__label" id={labelId}>{label}</span><button aria-controls={open ? listId : undefined} aria-expanded={open} aria-haspopup="listbox" aria-labelledby={`${labelId} ${valueId}`} className="existing-member-selector__trigger" disabled={disabled} onClick={() => setOpen((current) => !current)} ref={trigger} type="button"><span id={valueId}>{selected?.name ?? placeholder}</span><span aria-hidden="true">▾</span></button>{open && !disabled ? <div aria-labelledby={labelId} className="existing-member-selector__list" id={listId} role="listbox">{members.length ? members.map((member) => <button aria-selected={member.id === value} className="existing-member-selector__option" disabled={member.disabled} key={member.id} onClick={() => { onChange(member.id); setOpen(false); trigger.current?.focus(); }} role="option" type="button"><span className="existing-member-selector__heading"><strong>{member.name}</strong>{member.highlightDesignation && member.designation ? <span className="existing-member-selector__division-lead">{member.designation}</span> : null}{member.badges?.length ? <span className="existing-member-selector__badges">{member.badges.map((badge, index) => <span key={`${badge}-${index}`}>{badge}</span>)}</span> : null}</span>{member.email || member.designation ? <small>{member.email}{member.email && member.designation && !member.highlightDesignation ? ' \u00b7 ' : null}{!member.highlightDesignation ? member.designation : null}</small> : null}</button>) : <p>{emptyMessage}</p>}</div> : null}</div>;
}
