import { useState } from 'react';
import { BidsPanel } from '@/features/dashboard/BidsPanel';
import { usePageTitle } from '@/hooks/usePageTitle';

export function BidsPage() {
  usePageTitle('Bids');
  const [search, setSearch] = useState('');
  const [createRequest, setCreateRequest] = useState(0);

  return <div className="page-stack resource-page">
    <section className="page-heading resource-page__heading">
      <div><p>Commercial</p><h1>All Bids</h1><span>Review, create, and maintain every bid in one place.</span></div>
      <button onClick={() => setCreateRequest((value) => value + 1)} type="button">Create Bid</button>
    </section>
    <section className="resource-page__toolbar" aria-label="Bid filters">
      <label><span>Search bids</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search by bid, number, shipment, or status" type="search" value={search} /></label>
      {search ? <button onClick={() => setSearch('')} type="button">Clear search</button> : null}
    </section>
    <BidsPanel createRequest={createRequest} filterText={search} />
  </div>;
}
