import { useMemo, useState } from 'react';
import { MapPin, FileText } from 'lucide-react';
import { useStore } from '../store/store';
import { Card, Pill, Button, Avatar } from '../shared/ui';
import { fmtDay, fmtTime } from '../store/clock';
import { pastLabel, durationMin, isShort } from '../store/rules';
import { conditionBySlug } from '../store/catalog';
import { SessionDetailsModal } from './modals';
import type { Booking, PastLabel } from '../store/types';

const labelTone: Record<PastLabel, 'pine' | 'coral' | 'amber' | 'blue'> = {
  Completed: 'pine', Cancelled: 'coral', Delayed: 'amber', Rescheduled: 'blue',
};

export function PastTab({ query }: { query: string }) {
  const { state } = useStore();
  const [status, setStatus] = useState('all');
  const [service, setService] = useState('all');
  const [physio, setPhysio] = useState('all');
  const [sort, setSort] = useState<'recent' | 'oldest'>('recent');
  const [details, setDetails] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const nameOf = (id: string) => state.customers.find((c) => c.id === id)?.name ?? '';
  const countByCustomer = useMemo(() => {
    const m: Record<string, number> = {};
    state.bookings.forEach((b) => {
      if (b.status === 'completed' || b.status === 'cancelled') m[b.customerId] = (m[b.customerId] ?? 0) + 1;
    });
    return m;
  }, [state.bookings]);

  const past = state.bookings
    .filter((b) => b.status === 'completed' || b.status === 'cancelled')
    .filter((b) => (status === 'all' ? true : pastLabel(b) === status))
    .filter((b) => (service === 'all' ? true : b.service === service))
    .filter((b) => (physio === 'all' ? true : b.trainerId === physio))
    .filter((b) => !q || nameOf(b.customerId).toLowerCase().includes(q) || b.address.toLowerCase().includes(q))
    .sort((a, b) => (sort === 'recent' ? b.scheduledAt - a.scheduledAt : a.scheduledAt - b.scheduledAt));

  const clients = new Set(past.map((b) => b.customerId)).size;
  const detailBooking = details ? state.bookings.find((b) => b.id === details) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Past clients</h1>
          <p className="text-sm text-ink-soft">{clients} clients · {past.length} sessions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Sel value={status} onChange={setStatus} opts={[['all', 'All status'], ['Completed', 'Completed'], ['Delayed', 'Delayed'], ['Rescheduled', 'Rescheduled'], ['Cancelled', 'Cancelled']]} />
          <Sel value={service} onChange={setService} opts={[['all', 'All services'], ['physiotherapy', 'Physiotherapy'], ['training', 'Training']]} />
          <Sel value={physio} onChange={setPhysio} opts={[['all', 'All physios'], ...state.trainers.map((t) => [t.id, t.name] as [string, string])]} />
          <Sel value={sort} onChange={(v) => setSort(v as any)} opts={[['recent', 'Most recent'], ['oldest', 'Oldest']]} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {past.map((b) => <PastCard key={b.id} booking={b} sessionCount={countByCustomer[b.customerId]} onDetails={() => setDetails(b.id)} />)}
        {past.length === 0 && <Card className="p-6 text-center text-sm text-ink-soft">No past sessions match these filters.</Card>}
      </div>

      {detailBooking && <SessionDetailsModal booking={detailBooking} onClose={() => setDetails(null)} />}
    </div>
  );
}

function PastCard({ booking: b, sessionCount, onDetails }: { booking: Booking; sessionCount: number; onDetails: () => void }) {
  const { state } = useStore();
  const c = state.customers.find((x) => x.id === b.customerId)!;
  const trainer = state.trainers.find((t) => t.id === b.trainerId)!;
  const cond = conditionBySlug(b.condition);
  const label = pastLabel(b);
  const dur = durationMin(b);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-ink">{c.name}{c.age ? `, ${c.age}` : ''}</span>
              <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">{sessionCount} sessions</span>
            </div>
            <div className="text-[12.5px] text-ink-soft">{cond?.label ?? b.type}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isShort(b) && <Pill tone="amber">Short</Pill>}
          <Pill tone={labelTone[label]}>{label}</Pill>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-ink-soft">
        <div className="col-span-2 flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0" /> {b.address}</div>
        <div><span className="text-ink-soft/60">Service </span><span className="text-ink">{b.service === 'training' ? 'Training' : 'Physiotherapy'} · {b.type}</span></div>
        <div><span className="text-ink-soft/60">Physio </span><span className="text-ink">{trainer.name}</span></div>
        <div><span className="text-ink-soft/60">When </span><span className="text-ink">{fmtDay(b.scheduledAt)}, {fmtTime(b.scheduledAt)}</span></div>
      </div>

      {b.status !== 'cancelled' && (
        <div className="mt-3 flex gap-6 rounded-xl bg-paper-2 px-4 py-2 text-[12.5px]">
          <span><span className="text-ink-soft">Start </span><b>{b.startedAt ? fmtTime(b.startedAt) : '—'}</b></span>
          <span><span className="text-ink-soft">End </span><b>{b.endedAt ? fmtTime(b.endedAt) : '—'}</b></span>
          <span><span className="text-ink-soft">Duration </span><b>{dur != null ? `${dur} min` : '—'}</b></span>
        </div>
      )}

      <div className="mt-3">
        <Button variant="ghost" className="w-full" onClick={onDetails}><FileText size={15} /> Session details</Button>
      </div>
    </Card>
  );
}

function Sel({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink outline-none">
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
