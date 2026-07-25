import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Activity, MapPin, ExternalLink, Phone, Check, X,
  Settings2, ArrowRight,
} from 'lucide-react';
import { useStore } from '../store/store';
import { Card, Pill, Button, Avatar, cn } from '../shared/ui';
import { fmtDay, fmtTime, fmtDayLong, sameDay, MIN } from '../store/clock';
import { activeAlerts, attentionRatio, isConfirmed } from '../store/rules';
import { conditionBySlug } from '../store/catalog';
import { ManageSessionModal } from './modals';
import type { Booking } from '../store/types';

const mapLink = (a: string) => `https://maps.google.com/?q=${encodeURIComponent(a)}`;

export function ActiveTab({ query }: { query: string }) {
  const { state } = useStore();
  const alertsRef = useRef<HTMLDivElement>(null);
  const ongoingRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const nameOf = (id: string) => state.customers.find((c) => c.id === id)?.name ?? '';
  const match = (b: Booking) =>
    !q ||
    nameOf(b.customerId).toLowerCase().includes(q) ||
    b.address.toLowerCase().includes(q) ||
    state.trainers.find((t) => t.id === b.trainerId)?.name.toLowerCase().includes(q);

  const alerts = activeAlerts(state.now, state.bookings).filter((a) => match(a.booking));
  const ongoing = state.bookings.filter((b) => b.status === 'in_progress' && match(b));
  const upcoming = state.bookings
    .filter((b) => (b.status === 'placed' || b.status === 'confirmed') && match(b))
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  const ratio = attentionRatio(state.now, state.bookings);
  const slackToday = state.slack.filter((a) => sameDay(a.at, state.now)).length;

  const scrollTo = (r: React.RefObject<HTMLDivElement>) => r.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-6">
      {/* attention banner */}
      <div className={cn('overflow-hidden rounded-2xl px-6 py-5 text-white', ratio.numerator > 0 ? 'bg-coral-500' : 'bg-pine-600')}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{fmtDayLong(state.now)}</div>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              {ratio.numerator > 0 ? `${ratio.numerator} session${ratio.numerator > 1 ? 's' : ''} need your attention` : 'All clear right now'}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => scrollTo(alertsRef)} className="rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold hover:bg-white/25">
                {alerts.length} Alerts →
              </button>
              <button onClick={() => scrollTo(ongoingRef)} className="rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold hover:bg-white/25">
                {ongoing.length} Ongoing →
              </button>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold">{slackToday} Sent to Slack today</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-semibold tabular-nums">
              {ratio.numerator}<span className="text-2xl text-white/60"> / {ratio.denominator}</span>
            </div>
            <div className="text-xs text-white/70">attention / total today</div>
          </div>
        </div>
      </div>

      {/* alerts */}
      <section ref={alertsRef}>
        <SectionHead icon={AlertTriangle} title="Alerts" count={alerts.length} />
        {alerts.length === 0 ? (
          <Empty>No active alerts.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {alerts.map((a) => <AlertCard key={a.booking.id} alert={a} />)}
          </div>
        )}
      </section>

      {/* ongoing */}
      <section ref={ongoingRef}>
        <SectionHead icon={Activity} title="Ongoing sessions" count={ongoing.length} />
        {ongoing.length === 0 ? (
          <Empty>No sessions in progress.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {ongoing.map((b) => <OngoingCard key={b.id} booking={b} />)}
          </div>
        )}
      </section>

      {/* upcoming */}
      <UpcomingSection bookings={upcoming} />
    </div>
  );
}

function SectionHead({ icon: Icon, title, count }: { icon: typeof Activity; title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={17} className="text-ink-soft" />
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-paper">{count}</span>
    </div>
  );
}
const Empty = ({ children }: { children: React.ReactNode }) => (
  <Card className="p-6 text-center text-sm text-ink-soft">{children}</Card>
);

function CardMeta({ booking: b }: { booking: Booking }) {
  const { state } = useStore();
  const trainer = state.trainers.find((t) => t.id === b.trainerId)!;
  const cond = conditionBySlug(b.condition);
  return (
    <div className="mt-3 space-y-1.5 text-[13px] text-ink-soft">
      <div>{cond?.label ?? b.type} · <span className="text-ink">{trainer.name}</span></div>
      <div>{fmtDay(b.scheduledAt)} · {fmtTime(b.scheduledAt)}</div>
      <div className="flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0" /> {b.address}</div>
    </div>
  );
}

function AlertCard({ alert }: { alert: ReturnType<typeof activeAlerts>[number] }) {
  const { state } = useStore();
  const b = alert.booking;
  const c = state.customers.find((x) => x.id === b.customerId)!;
  const critical = alert.severity === 'critical';
  return (
    <Card className={cn('overflow-hidden border-l-4 p-4', critical ? 'border-l-coral-500' : 'border-l-amber-note')}>
      <div className="flex items-center justify-between">
        <Pill tone={critical ? 'coral' : 'amber'}>{critical ? 'Critical' : 'Moderate'}</Pill>
        <span className={cn('text-[12px] font-semibold', critical ? 'text-coral-600' : 'text-[#b4700f]')}>
          {alert.kind === 'not_started' ? `Not started · ${alert.minutesLate} min late`
            : alert.kind === 'not_closed' ? 'Running over 90 min'
              : `Unconfirmed · ${Math.floor((alert.elapsedMin ?? 0) / 60)}h ${(alert.elapsedMin ?? 0) % 60}m`}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2.5">
        <Avatar name={c.name} />
        <div>
          <div className="text-[15px] font-semibold text-ink">{c.name}</div>
          <div className="text-[12.5px] text-ink-soft">
            {alert.kind === 'not_started' ? 'Session not started' : alert.kind === 'not_closed' ? 'Session not closed' : 'Not confirmed by any provider'}
          </div>
        </div>
      </div>
      <CardMeta booking={b} />
      {alert.kind === 'unconfirmed' && (
        <div className="mt-3 flex gap-2">
          <GateChip label="Panel" ok={b.opsConfirmed} />
          <GateChip label="Trainer app" ok={b.trainerConfirmed} />
        </div>
      )}
    </Card>
  );
}

function GateChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={cn('flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold', ok ? 'bg-pine-50 text-pine-700' : 'bg-coral-50 text-coral-600')}>
      {label} {ok ? <Check size={12} /> : <X size={12} />}
    </span>
  );
}

function OngoingCard({ booking: b }: { booking: Booking }) {
  const { state } = useStore();
  const c = state.customers.find((x) => x.id === b.customerId)!;
  const late = b.startedAt != null && b.startedAt > b.scheduledAt + 10 * MIN;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Pill tone={late ? 'amber' : 'pine'}>{late ? 'Late' : 'On time'}</Pill>
        <span className="text-[12px] font-semibold text-ink-soft">Session in progress</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2.5">
        <Avatar name={c.name} />
        <div className="text-[15px] font-semibold text-ink">{c.name}</div>
      </div>
      <CardMeta booking={b} />
      <div className="mt-3 border-t border-line pt-2 text-[12.5px] text-ink-soft">
        Scheduled {fmtTime(b.scheduledAt)} · Started {b.startedAt ? fmtTime(b.startedAt) : '—'}
      </div>
    </Card>
  );
}

/* ---- Upcoming ---- */

function UpcomingSection({ bookings }: { bookings: Booking[] }) {
  const { state } = useStore();
  const [time, setTime] = useState<'all' | 'today' | 'tomorrow'>('all');
  const [service, setService] = useState<'all' | 'physiotherapy' | 'training'>('all');
  const [manage, setManage] = useState<string | null>(null);

  const tomorrow = new Date(state.now); tomorrow.setDate(tomorrow.getDate() + 1);

  const filtered = bookings.filter((b) => {
    if (time === 'today' && !sameDay(b.scheduledAt, state.now)) return false;
    if (time === 'tomorrow' && !sameDay(b.scheduledAt, tomorrow.getTime())) return false;
    if (service !== 'all' && b.service !== service) return false;
    return true;
  });
  const managed = manage ? state.bookings.find((b) => b.id === manage) : null;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SectionHead icon={ArrowRight} title="Upcoming sessions" count={filtered.length} />
        <div className="flex gap-2">
          <Sel value={time} onChange={(v) => setTime(v as any)} opts={[['all', 'All dates'], ['today', 'Today'], ['tomorrow', 'Tomorrow']]} />
          <Sel value={service} onChange={(v) => setService(v as any)} opts={[['all', 'All services'], ['physiotherapy', 'Physiotherapy'], ['training', 'Training']]} />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((b) => <UpcomingCard key={b.id} booking={b} onManage={() => setManage(b.id)} />)}
        {filtered.length === 0 && <Empty>No upcoming sessions match these filters.</Empty>}
      </div>
      {managed && <ManageSessionModal booking={managed} onClose={() => setManage(null)} />}
    </section>
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

function UpcomingCard({ booking: b, onManage }: { booking: Booking; onManage: () => void }) {
  const { state, dispatch } = useStore();
  const c = state.customers.find((x) => x.id === b.customerId)!;
  const trainer = state.trainers.find((t) => t.id === b.trainerId)!;
  const cond = conditionBySlug(b.condition);
  const confirmed = isConfirmed(b);

  return (
    <Card className={cn('overflow-hidden p-4', confirmed && 'ring-1 ring-pine-500/30')}>
      {/* lead confirmation */}
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line">
        <button
          onClick={() => !b.opsConfirmed && dispatch({ t: 'OPS_CONFIRM', id: b.id })}
          disabled={b.opsConfirmed}
          className={cn('flex flex-col gap-0.5 border-r border-line px-3 py-2.5 text-left transition', b.opsConfirmed ? 'bg-pine-50' : 'bg-white hover:bg-pine-50/50')}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/70">Panel · Ops</span>
          <span className={cn('flex items-center gap-1 text-[13px] font-semibold', b.opsConfirmed ? 'text-pine-700' : 'text-ink')}>
            {b.opsConfirmed ? <><Check size={14} /> Confirmed</> : 'Tap to confirm'}
          </span>
        </button>
        <div className={cn('flex flex-col gap-0.5 px-3 py-2.5', b.trainerConfirmed ? 'bg-pine-50' : 'bg-white')}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/70">Trainer app</span>
          <span className={cn('flex items-center gap-1 text-[13px] font-semibold', b.trainerConfirmed ? 'text-pine-700' : 'text-coral-600')}>
            {b.trainerConfirmed ? <><Check size={14} /> Confirmed</> : <><X size={14} /> Not confirmed</>}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} />
          <div>
            <div className="text-[15px] font-semibold text-ink">{c.name}{c.age ? `, ${c.age}` : ''}</div>
            <div className="text-[12.5px] text-ink-soft">{cond?.label ?? b.type}</div>
          </div>
        </div>
        {b.rescheduledFrom ? (
          <Pill tone="blue">
            <span className="line-through opacity-60">{fmtTime(b.rescheduledFrom)}</span>&nbsp;→&nbsp;{fmtTime(b.scheduledAt)}
          </Pill>
        ) : confirmed ? <Pill tone="pine">Confirmed</Pill> : <Pill tone="neutral">Scheduled</Pill>}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-ink-soft">
        <div className="col-span-2 flex items-start gap-1.5">
          <MapPin size={13} className="mt-0.5 shrink-0" /> <span className="flex-1">{b.address}</span>
          <a href={mapLink(b.address)} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 font-semibold text-pine-600">Map <ExternalLink size={11} /></a>
        </div>
        <div><span className="text-ink-soft/60">When </span><span className="text-ink">{fmtDay(b.scheduledAt)}, {fmtTime(b.scheduledAt)}</span></div>
        <div><span className="text-ink-soft/60">Physio </span><span className="text-ink">{trainer.name}</span></div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onManage}><Settings2 size={15} /> Manage session</Button>
        <Button variant="soft" className="flex-1"><Phone size={15} /> Call client</Button>
      </div>
    </Card>
  );
}
