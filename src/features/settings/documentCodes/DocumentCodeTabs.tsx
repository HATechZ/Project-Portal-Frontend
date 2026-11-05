export type DocumentCodeTab = 'general' | 'operation' | 'marketing' | 'etc' | 'engineering';

export function DocumentCodeTabs({ value, onChange }: { value: DocumentCodeTab; onChange: (value: DocumentCodeTab) => void }) {
  return <nav aria-label="Document code types" className="settings-sub-tabs"><button className={value === 'general' ? 'is-active' : ''} onClick={() => onChange('general')} type="button">General</button><button className={value === 'operation' ? 'is-active' : ''} onClick={() => onChange('operation')} type="button">PM &amp; Operation</button><button className={value === 'marketing' ? 'is-active' : ''} onClick={() => onChange('marketing')} type="button">Marketing</button><button className={value === 'etc' ? 'is-active' : ''} onClick={() => onChange('etc')} type="button">ETC</button><button className={value === 'engineering' ? 'is-active' : ''} onClick={() => onChange('engineering')} type="button">Engineering</button></nav>;
}
