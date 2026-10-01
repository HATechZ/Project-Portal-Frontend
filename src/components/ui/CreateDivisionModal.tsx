import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createDivision, type DivisionPayload } from '@/services/divisionService';

const emptyForm: DivisionPayload = { name: '', abbr: '', divisionTypeId: '' };

export function CreateDivisionModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DivisionPayload>(emptyForm);
  const save = useMutation({ mutationFn: createDivision, onSuccess: () => { toast.success('Division created successfully'); void queryClient.invalidateQueries({ queryKey: ['divisions'] }); onClose(); }, onError: () => toast.error('Something went wrong. Please try again.') });
  const change = (field: keyof DivisionPayload, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); save.mutate(form); };
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>Create Division</strong></div><button aria-label="Close division modal" onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={submit}><label className="division-form__full"><span>Name</span><input autoFocus maxLength={180} onChange={(event) => change('name', event.target.value)} placeholder="Engineering" required value={form.name} /></label><label><span>Abbr</span><input maxLength={30} onChange={(event) => change('abbr', event.target.value.toUpperCase())} placeholder="ENG" required value={form.abbr} /></label><label><span>Division Type ID</span><input onChange={(event) => change('divisionTypeId', event.target.value)} placeholder="Optional UUID" value={form.divisionTypeId} /></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={save.isPending} type="submit">{save.isPending ? 'Saving...' : 'Create Division'}</button></div></form></section></div>;
}
