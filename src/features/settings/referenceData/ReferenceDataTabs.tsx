type LocationTab = 'pol' | 'pod';
type CargoVesselTab = 'cargo' | 'vessel';

export function LocationCodeTabs({ value, onChange }: { value: LocationTab; onChange: (value: LocationTab) => void }) {
  return <nav aria-label="Location code types" className="settings-sub-tabs"><button className={value === 'pol' ? 'is-active' : ''} onClick={() => onChange('pol')} type="button">POL — Port of Loading</button><button className={value === 'pod' ? 'is-active' : ''} onClick={() => onChange('pod')} type="button">POD — Port of Discharge</button></nav>;
}

export function CargoVesselTabs({ value, onChange }: { value: CargoVesselTab; onChange: (value: CargoVesselTab) => void }) {
  return <nav aria-label="Cargo and vessel code types" className="settings-sub-tabs"><button className={value === 'cargo' ? 'is-active' : ''} onClick={() => onChange('cargo')} type="button">Cargo Codes</button><button className={value === 'vessel' ? 'is-active' : ''} onClick={() => onChange('vessel')} type="button">Vessel Codes</button></nav>;
}
