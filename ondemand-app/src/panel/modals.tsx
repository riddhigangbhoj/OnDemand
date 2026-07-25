import { useState } from 'react';
import {
  MapPin, CalendarClock, UserCog, XCircle, FileText, Paperclip,
  Plus, ExternalLink, Check, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/store';
import { Modal, Button, TextField, Pill, cn } from '../shared/ui';
import { fmtDay, fmtTime } from '../store/clock';
import { getDateTiles, getSlots, trainerFreeAt, pastLabel, durationMin, isShort } from '../store/rules';
import { conditionBySlug } from '../store/catalog';
import type { Booking } from '../store/types';

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const mapLink = (addr: string) => `https://maps.google.com/?q=${encodeURIComponent(addr)}`;

/* ============ Manage session ============ */

export function ManageSessionModal({ booking: b, onClose }: { booking: Booking; onClose: () => void }) {
  const { state } = useStore();
  const [view, setView] = useState<'main' | 'reschedule' | 'reassign' | 'cancel'>('main');
  const trainer = state.trainers.find((t) => t.id === b.trainerId)!;
  const cond = conditionBySlug(b.condition);

  const title =
    view === 'main' ? 'Manage session'
      : view === 'reschedule' ? 'Reschedule session'
        : view === 'reassign' ? 'Reassign physio' : 'Cancel session';

  return (
    <Modal open onClose={onClose} title={title} wide={view === 'main'}>
      {view === 'main' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Service" value={b.service === 'training' ? 'Physical training' : 'Physiotherapy'} />
            <Info label="Type" value={b.type} />
            <Info label="Date" value={fmtDay(b.scheduledAt)} />
            <Info label="Time" value={fmtTime(b.scheduledAt)} />
            <Info label="System-assigned" value={`${trainer.name}, ${trainer.qualification}`} />
            <Info label="Amount" value={`${money(b.amount)} · Paid`} />
          </div>

          <div className="rounded-xl border border-line bg-white p-3">
            <div className="flex items-start gap-2 text-[13px] text-ink-soft">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              <span className="flex-1">{b.address}</span>
              <a href={mapLink(b.address)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-pine-600">
                Map <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {(b.note || cond) && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">Description</div>
              <p className="mt-1 text-[14px] text-ink">{b.note ?? cond?.blurb}</p>
            </div>
          )}

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">Customer attachments</div>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-soft"><Paperclip size={13} /> scan-report.pdf</span>
              <button className="flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-[13px] font-semibold text-pine-600 hover:bg-pine-50"><Plus size={14} /> Add documents</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => setView('reschedule')}><CalendarClock size={15} /> Reschedule</Button>
            <Button variant="ghost" onClick={() => setView('reassign')}><UserCog size={15} /> Reassign</Button>
            <Button variant="danger" onClick={() => setView('cancel')}><XCircle size={15} /> Cancel</Button>
          </div>
        </div>
      )}

      {view === 'reschedule' && <Reschedule booking={b} onDone={onClose} onBack={() => setView('main')} />}
      {view === 'reassign' && <Reassign booking={b} onDone={onClose} onBack={() => setView('main')} />}
      {view === 'cancel' && <Cancel booking={b} onDone={onClose} onBack={() => setView('main')} />}
    </Modal>
  );
}

function Reschedule({ booking: b, onDone, onBack }: { booking: Booking; onDone: () => void; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const tiles = getDateTiles(state.now).filter((t) => t.bookable);
  const [date, setDate] = useState<number>(tiles[0].date);
  const [slot, setSlot] = useState<number | null>(null);
  const [trainerId, setTrainerId] = useState(b.trainerId);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const slots = getSlots(state.now, date);

  if (confirming) {
    return (
      <div className="space-y-4">
        <p className="text-[14px] text-ink">Confirm new slot: <b>{fmtDay(slot!)}, {fmtTime(slot!)}</b>{trainerId !== b.trainerId && ' with a new physio'}. This resets both confirmations and issues a fresh trainer card.</p>
        <TextField label="Reason (required)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>Back</Button>
          <Button className="flex-1" disabled={!reason.trim()}
            onClick={() => { dispatch({ t: 'RESCHEDULE', id: b.id, scheduledAt: slot!, trainerId, reason }); onDone(); }}>
            Confirm reschedule
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-[13px] font-semibold text-ink">New date</div>
        <div className="grid grid-cols-3 gap-2">
          {tiles.map((t) => (
            <button key={t.date} onClick={() => { setDate(t.date); setSlot(null); }}
              className={cn('rounded-xl border px-2 py-2 text-sm font-semibold', date === t.date ? 'border-pine-600 bg-pine-50 text-pine-700' : 'border-line bg-white')}>
              {fmtDay(t.date)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[13px] font-semibold text-ink">New time</div>
        <div className="grid grid-cols-4 gap-2">
          {slots.map((s) => (
            <button key={s.at} onClick={() => setSlot(s.at)}
              className={cn('rounded-lg border py-2 text-[13px] font-semibold', slot === s.at ? 'border-pine-600 bg-pine-600 text-white' : 'border-line bg-white')}>
              {fmtTime(s.at)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[13px] font-semibold text-ink">Physio (optional change)</div>
        <div className="space-y-1.5">
          {state.trainers.filter((t) => t.services.includes(b.service)).map((t) => {
            const free = slot ? trainerFreeAt(t, b.service, slot, state.bookings, b.id) : true;
            return (
              <button key={t.id} disabled={!free && t.id !== b.trainerId} onClick={() => setTrainerId(t.id)}
                className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left', trainerId === t.id ? 'border-pine-600 bg-pine-50' : 'border-line bg-white', !free && t.id !== b.trainerId && 'opacity-40')}>
                <span className="text-[14px] font-medium text-ink">{t.name} <span className="text-ink-soft">· {t.qualification}</span></span>
                {slot ? <Pill tone={free ? 'pine' : 'coral'}>{free ? 'Free' : 'Busy'}</Pill> : trainerId === t.id && <Check size={16} className="text-pine-600" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1" disabled={slot == null} onClick={() => setConfirming(true)}>Confirm</Button>
      </div>
    </div>
  );
}

function Reassign({ booking: b, onDone, onBack }: { booking: Booking; onDone: () => void; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-white p-3 text-[13px] text-ink-soft">
        Slot stays fixed: <b className="text-ink">{fmtDay(b.scheduledAt)}, {fmtTime(b.scheduledAt)}</b>. Pick a physio free for it.
      </div>
      <div className="space-y-1.5">
        {state.trainers.filter((t) => t.services.includes(b.service)).map((t) => {
          const free = trainerFreeAt(t, b.service, b.scheduledAt, state.bookings, b.id);
          const isCurrent = t.id === b.trainerId;
          return (
            <button key={t.id} disabled={!free || isCurrent} onClick={() => setTrainerId(t.id)}
              className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left', trainerId === t.id ? 'border-pine-600 bg-pine-50' : 'border-line bg-white', (!free || isCurrent) && 'opacity-40')}>
              <span className="text-[14px] font-medium text-ink">{t.name} <span className="text-ink-soft">· {t.qualification}</span></span>
              {isCurrent ? <Pill tone="neutral">Current</Pill> : <Pill tone={free ? 'pine' : 'coral'}>{free ? 'Free' : 'Busy'}</Pill>}
            </button>
          );
        })}
      </div>
      <TextField label="Reason (required)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1" disabled={!trainerId || !reason.trim()}
          onClick={() => { dispatch({ t: 'REASSIGN', id: b.id, trainerId: trainerId!, reason }); onDone(); }}>
          Reassign
        </Button>
      </div>
    </div>
  );
}

function Cancel({ booking: b, onDone, onBack }: { booking: Booking; onDone: () => void; onBack: () => void }) {
  const { dispatch } = useStore();
  const [reason, setReason] = useState('');
  const quick = ['no show', 'customer request', 'trainer unavailable', 'other'];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button key={q} onClick={() => setReason(q)}
            className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium capitalize', reason === q ? 'border-coral-500 bg-coral-50 text-coral-600' : 'border-line bg-white text-ink-soft')}>
            {q}
          </button>
        ))}
      </div>
      <TextField label="Reason (required)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this session being cancelled?" />
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onBack}>Back</Button>
        <Button variant="danger" className="flex-1" disabled={!reason.trim()}
          onClick={() => { dispatch({ t: 'CANCEL', id: b.id, reason }); onDone(); }}>
          Cancel session
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper-2 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/60">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-medium text-ink">{value}</div>
    </div>
  );
}

/* ============ Session details ============ */

export function SessionDetailsModal({ booking: b, onClose }: { booking: Booking; onClose: () => void }) {
  const { state } = useStore();
  const trainer = state.trainers.find((t) => t.id === b.trainerId)!;
  const cond = conditionBySlug(b.condition);
  const dur = durationMin(b);
  const label = pastLabel(b);
  const prev = state.bookings
    .filter((x) => x.customerId === b.customerId && x.id !== b.id && (x.status === 'completed' || x.status === 'cancelled'))
    .sort((a, c) => c.scheduledAt - a.scheduledAt);

  return (
    <Modal open onClose={onClose} title="Session details" wide>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Pill tone={label === 'Cancelled' ? 'coral' : label === 'Delayed' ? 'amber' : label === 'Rescheduled' ? 'blue' : 'pine'}>{label}</Pill>
          {isShort(b) && <Pill tone="amber">Short</Pill>}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Info label="Service" value={b.service === 'training' ? 'Training' : 'Physiotherapy'} />
          <Info label="Type" value={b.type} />
          <Info label="Physio" value={trainer.name} />
          <Info label="Date" value={fmtDay(b.scheduledAt)} />
          <Info label="Amount" value={`${money(b.amount)} · Paid`} />
          <Info label="Duration" value={dur != null ? `${dur} min` : '—'} />
        </div>

        {(b.startedAt || b.endedAt) && (
          <div className="flex gap-6 rounded-xl bg-paper-2 px-4 py-2.5 text-[13px]">
            <span><span className="text-ink-soft">Start </span><b>{b.startedAt ? fmtTime(b.startedAt) : '—'}</b></span>
            <span><span className="text-ink-soft">End </span><b>{b.endedAt ? fmtTime(b.endedAt) : '—'}</b></span>
            <span><span className="text-ink-soft">Scheduled </span><b>{fmtTime(b.scheduledAt)}</b></span>
          </div>
        )}

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">Description</div>
          <p className="mt-1 text-[14px] text-ink">{b.note ?? cond?.blurb}</p>
        </div>

        {b.cancelReason && (
          <div className="rounded-xl bg-coral-50 px-3 py-2 text-[13px] text-coral-600">Cancelled: {b.cancelReason}</div>
        )}

        {b.closure && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">Physio report</div>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
              <FileText size={18} className="text-coral-500" />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-ink">session-report-{b.id}.pdf</div>
                <div className="text-[12px] text-ink-soft">{b.closure.recommendation === 'more_sessions' ? 'More sessions recommended' : 'Single session sufficient'}</div>
              </div>
              <Button variant="ghost" className="px-3 py-1.5 text-[13px]">Open</Button>
            </div>
            <div className="mt-2 space-y-1 rounded-xl bg-paper-2 p-3 text-[13px] text-ink">
              <p><span className="text-ink-soft">Conclusion: </span>{b.closure.conclusion}</p>
              <p><span className="text-ink-soft">Reason: </span>{b.closure.recommendationReason}</p>
              {b.assessment && <p><span className="text-ink-soft">Goal: </span>{b.assessment.goal}</p>}
              {b.sessionLog && <p><span className="text-ink-soft">Exercises: </span>{b.sessionLog.exercises.join(', ')}</p>}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">Customer documents</div>
          <span className="flex w-fit items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-soft"><Paperclip size={13} /> scan-report.pdf</span>
        </div>

        {prev.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">Previous sessions · {prev.length}</div>
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
              {prev.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="text-[13px]">
                    <span className="font-medium text-ink">{fmtDay(p.scheduledAt)}</span>
                    <span className="text-ink-soft"> · {conditionBySlug(p.condition)?.label ?? p.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={pastLabel(p) === 'Cancelled' ? 'coral' : 'neutral'}>{pastLabel(p)}</Pill>
                    <ChevronRight size={15} className="text-ink-soft/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
