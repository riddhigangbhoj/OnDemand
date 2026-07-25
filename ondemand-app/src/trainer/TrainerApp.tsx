import { useMemo, useState } from 'react';
import {
  ArrowLeft, Phone, PhoneOff, MapPin, Check, CircleCheck, Clock,
  PlayCircle, Info, ClipboardList, Dumbbell, HandHeart, Target,
} from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { useStore } from '../store/store';
import { usePanes } from '../shared/panes';
import { Button, Card, Field, TextField, Pill, Avatar, cn } from '../shared/ui';
import { fmtDay, fmtTime, MIN } from '../store/clock';
import { conditionBySlug, EXERCISE_LIBRARY, EQUIPMENT_LIBRARY, HANDSON_LIBRARY } from '../store/catalog';
import type { Booking } from '../store/types';

type Stage = 'detail' | 'otp' | 'assessment' | 'log' | 'close';

export function TrainerApp() {
  const { state } = useStore();
  const trainer = state.trainers.find((t) => t.id === state.activeTrainerId)!;
  const [openId, setOpenId] = useState<string | null>(null);

  const leads = state.bookings
    .filter((b) => b.trainerId === trainer.id && b.status !== 'cancelled' && b.status !== 'completed')
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  const open = openId ? state.bookings.find((b) => b.id === openId) : null;

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col bg-paper">
        {open ? (
          <LeadDetail booking={open} onBack={() => setOpenId(null)} />
        ) : (
          <>
            <header className="border-b border-line px-5 pb-4 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">Trainer app</p>
              <h1 className="mt-1 font-display text-[1.7rem] font-semibold text-ink">
                Welcome {trainer.name.replace(/^Dr\.?\s*/, '').split(' ')[0]}
              </h1>
              <p className="mt-0.5 text-sm text-ink-soft">{trainer.qualification} · {trainer.years} yrs</p>
            </header>
            <div className="flex-1 px-5 py-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Your leads</h2>
                <span className="text-sm text-ink-soft">{leads.length}</span>
              </div>
              <div className="space-y-3">
                {leads.length === 0 && (
                  <Card className="p-8 text-center text-sm text-ink-soft">No assigned leads right now.</Card>
                )}
                {leads.map((b) => (
                  <LeadCard key={b.id} booking={b} onOpen={() => setOpenId(b.id)} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}

function LeadCard({ booking: b, onOpen }: { booking: Booking; onOpen: () => void }) {
  const { state } = useStore();
  const c = state.customers.find((x) => x.id === b.customerId)!;
  const cond = conditionBySlug(b.condition);
  const phoneReleased = state.now >= b.scheduledAt - 60 * MIN;
  const canStart = state.now >= b.scheduledAt - 30 * MIN;

  return (
    <Card className="overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <Avatar name={c.name} />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink">{c.name}{c.age ? `, ${c.age}` : ''}</div>
          <div className="text-[13px] text-ink-soft">{cond?.label ?? b.type}</div>
        </div>
        {b.trainerConfirmed ? (
          <Pill tone="pine"><Check size={12} /> Confirmed</Pill>
        ) : b.status === 'in_progress' ? (
          <Pill tone="pine">In session</Pill>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
        <Meta label="When" value={`${fmtDay(b.scheduledAt)}, ${fmtTime(b.scheduledAt)}`} />
        <Meta label="Service" value={b.service === 'training' ? 'Training' : 'Physiotherapy'} />
      </div>
      <div className="mt-2 flex items-start gap-1.5 text-[13px] text-ink-soft">
        <MapPin size={14} className="mt-0.5 shrink-0" /> {b.address}
      </div>
      {b.note && <p className="mt-2 rounded-lg bg-paper-2 px-3 py-2 text-[13px] text-ink-soft">“{b.note}”</p>}

      <div className="mt-3 flex items-center gap-2 text-[13px]">
        {phoneReleased ? (
          <span className="flex items-center gap-1.5 font-medium text-pine-700"><Phone size={14} /> {c.phone}</span>
        ) : (
          <span className="flex items-center gap-1.5 text-ink-soft/70"><PhoneOff size={14} /> Phone released 1 hour before</span>
        )}
      </div>

      <div className="mt-3">
        {b.status === 'in_progress' ? (
          <Button className="w-full" onClick={onOpen}><PlayCircle size={16} /> Continue session</Button>
        ) : !b.trainerConfirmed ? (
          <Button className="w-full" onClick={onOpen}>Review & confirm</Button>
        ) : (
          <Button variant={canStart ? 'primary' : 'ghost'} className="w-full" onClick={onOpen}>
            {canStart ? <><PlayCircle size={16} /> Open & start</> : 'View session'}
          </Button>
        )}
      </div>
    </Card>
  );
}

function LeadDetail({ booking: b, onBack }: { booking: Booking; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const initialStage: Stage =
    b.status === 'in_progress'
      ? !b.assessment ? 'assessment' : !b.sessionLog ? 'log' : 'close'
      : 'detail';
  const [stage, setStage] = useState<Stage>(initialStage);

  const c = state.customers.find((x) => x.id === b.customerId)!;
  const cond = conditionBySlug(b.condition);
  const canStart = state.now >= b.scheduledAt - 30 * MIN;
  const phoneReleased = state.now >= b.scheduledAt - 60 * MIN;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <button onClick={onBack} className="rounded-full p-1 text-ink hover:bg-black/5"><ArrowLeft size={20} /></button>
        <div>
          <div className="font-display text-lg font-semibold text-ink">{c.name}</div>
          <div className="text-[12px] text-ink-soft">{cond?.label} · {fmtTime(b.scheduledAt)}</div>
        </div>
      </header>

      <div className="flex-1 px-5 py-5">
        {stage === 'detail' && (
          <div className="space-y-4">
            {!b.trainerConfirmed && b.status === 'placed' && (
              <Button className="w-full py-3" onClick={() => dispatch({ t: 'TRAINER_CONFIRM', id: b.id })}>
                <Check size={17} /> Confirm this lead
              </Button>
            )}
            {b.trainerConfirmed && (
              <div className="flex items-center gap-2 rounded-xl bg-pine-50 px-3 py-2.5 text-[13px] font-semibold text-pine-700">
                <CircleCheck size={16} /> You’ve confirmed this lead
              </div>
            )}

            <Card className="space-y-3 p-4">
              <Row icon={Clock} label="When" value={`${fmtDay(b.scheduledAt)}, ${fmtTime(b.scheduledAt)}`} />
              <Row icon={MapPin} label="Address" value={b.address} />
              {b.entryInstructions && <Row icon={Info} label="Entry" value={b.entryInstructions} />}
              <Row icon={phoneReleased ? Phone : PhoneOff} label="Phone"
                value={phoneReleased ? c.phone : 'Released 1 hour before the session'} />
            </Card>

            {b.note && (
              <Card className="p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">Client note</div>
                <p className="mt-1 text-[14px] text-ink">“{b.note}”</p>
              </Card>
            )}

            <div className="rounded-xl border border-line bg-white p-3 text-[13px] text-ink-soft">
              Need to cancel or move this? <span className="font-semibold text-ink">Contact ops</span> — call the
              ops desk and they’ll reassign, reschedule, or cancel from the panel. There’s no cancel here.
            </div>

            {b.trainerConfirmed && (
              <Button className="w-full py-3" disabled={!canStart}
                onClick={() => { dispatch({ t: 'START_OTP', id: b.id }); setStage('otp'); }}>
                <PlayCircle size={17} /> {canStart ? 'Start session' : 'Start opens 30 min before'}
              </Button>
            )}
          </div>
        )}

        {stage === 'otp' && <OtpStep booking={b} onDone={() => setStage('assessment')} />}
        {stage === 'assessment' && <AssessmentStep booking={b} onDone={() => setStage('log')} />}
        {stage === 'log' && <LogStep booking={b} onDone={() => setStage('close')} />}
        {stage === 'close' && <CloseStep booking={b} onDone={onBack} />}
      </div>
    </div>
  );
}

function OtpStep({ booking: b, onDone }: { booking: Booking; onDone: () => void }) {
  const { state, dispatch } = useStore();
  const [code, setCode] = useState('');
  const [err, setErr] = useState(false);
  const correct = [...state.messages].reverse().find((m) => m.bookingId === b.id && m.template === 'start_otp')?.otp;

  const verify = () => {
    if (code === correct || code === '999999') {
      dispatch({ t: 'VERIFY_START', id: b.id, code });
      onDone();
    } else setErr(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-pine-50 px-4 py-3 text-[13px] text-pine-700">
        A code was sent to the client on WhatsApp. Ask them to read it out, and enter it here.
      </div>
      <Field label="Start OTP" placeholder="6 digits" maxLength={6} value={code}
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErr(false); }}
        className="text-center font-mono text-2xl tracking-[0.4em]" />
      {err && <p className="text-[13px] text-coral-600">Incorrect code. Check WhatsApp or use the ops fallback.</p>}
      <Button className="w-full py-3" disabled={code.length !== 6} onClick={verify}>Verify & start</Button>
      <p className="text-center text-[12px] text-ink-soft/70">Ops fallback (universal): 999999</p>
    </div>
  );
}

function AssessmentStep({ booking: b, onDone }: { booking: Booking; onDone: () => void }) {
  const { dispatch } = useStore();
  const [goal, setGoal] = useState(b.assessment?.goal ?? b.note ?? '');
  const [power, setPower] = useState(b.assessment?.musclePower ?? '');
  const [pain, setPain] = useState(b.assessment?.painLevel ?? '');
  const [findings, setFindings] = useState(b.assessment?.additionalFindings ?? '');
  const [tests, setTests] = useState(b.assessment?.specialTests ?? '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-pine-700"><Target size={18} /><span className="font-display text-lg font-semibold text-ink">Assessment</span></div>
      <TextField label="Goal (required)" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Muscle power" placeholder="e.g. 4/5" value={power} onChange={(e) => setPower(e.target.value)} />
        <Field label="Pain level" placeholder="e.g. 3/10" value={pain} onChange={(e) => setPain(e.target.value)} />
      </div>
      <TextField label="Additional findings" rows={2} value={findings} onChange={(e) => setFindings(e.target.value)} />
      <Field label="Special tests" placeholder="e.g. SLR negative" value={tests} onChange={(e) => setTests(e.target.value)} />
      <Button className="w-full py-3" disabled={!goal.trim()}
        onClick={() => { dispatch({ t: 'SAVE_ASSESSMENT', id: b.id, assessment: { goal, musclePower: power || undefined, painLevel: pain || undefined, additionalFindings: findings || undefined, specialTests: tests || undefined } }); onDone(); }}>
        Save & continue
      </Button>
    </div>
  );
}

function LogStep({ booking: b, onDone }: { booking: Booking; onDone: () => void }) {
  const { dispatch } = useStore();
  const [exercises, setExercises] = useState<string[]>(b.sessionLog?.exercises ?? []);
  const [equipment, setEquipment] = useState<string[]>(b.sessionLog?.equipment ?? []);
  const [handsOn, setHandsOn] = useState<string[]>(b.sessionLog?.handsOn ?? []);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-pine-700"><ClipboardList size={18} /><span className="font-display text-lg font-semibold text-ink">Session log</span></div>
      <Picker icon={Dumbbell} title="Exercises (required)" library={EXERCISE_LIBRARY} selected={exercises} onChange={setExercises} search />
      <Picker icon={HandHeart} title="Equipment used" library={EQUIPMENT_LIBRARY} selected={equipment} onChange={setEquipment} />
      <Picker icon={HandHeart} title="Hands-on techniques" library={HANDSON_LIBRARY} selected={handsOn} onChange={setHandsOn} />
      <Button className="w-full py-3" disabled={exercises.length === 0}
        onClick={() => { dispatch({ t: 'SAVE_LOG', id: b.id, log: { exercises, equipment: equipment.length ? equipment : undefined, handsOn: handsOn.length ? handsOn : undefined } }); onDone(); }}>
        Save & continue
      </Button>
    </div>
  );
}

function CloseStep({ booking: b, onDone }: { booking: Booking; onDone: () => void }) {
  const { dispatch } = useStore();
  const [conclusion, setConclusion] = useState('');
  const [rec, setRec] = useState<'more_sessions' | 'single_sufficient' | null>(null);
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-pine-700"><Check size={18} /><span className="font-display text-lg font-semibold text-ink">Close session</span></div>
      <TextField label="Conclusion (required)" rows={3} value={conclusion} onChange={(e) => setConclusion(e.target.value)} />
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">Recommendation (required)</span>
        <div className="grid grid-cols-2 gap-2">
          {([['more_sessions', 'More sessions needed'], ['single_sufficient', 'Single session sufficient']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setRec(v)}
              className={cn('rounded-xl border p-3 text-left text-[13px] font-semibold transition',
                rec === v ? 'border-pine-600 bg-pine-50 text-pine-700' : 'border-line bg-white text-ink')}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <TextField label="Reason for recommendation (required)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      <Button className="w-full py-3" disabled={!conclusion.trim() || !rec || !reason.trim()}
        onClick={() => { dispatch({ t: 'CLOSE', id: b.id, closure: { conclusion, recommendation: rec!, recommendationReason: reason } }); onDone(); }}>
        Close & send report
      </Button>
      <p className="text-center text-[12px] text-ink-soft/70">No end OTP this phase.</p>
    </div>
  );
}

/* ---- small bits ---- */
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/60">{label}</div>
      <div className="font-medium text-ink">{value}</div>
    </div>
  );
}
function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <Icon size={16} className="mt-0.5 shrink-0 text-ink-soft" />
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/60">{label}</div>
        <div className="text-[14px] text-ink">{value}</div>
      </div>
    </div>
  );
}
function Picker({
  icon: Icon, title, library, selected, onChange, search,
}: {
  icon: typeof Dumbbell; title: string; library: string[]; selected: string[]; onChange: (v: string[]) => void; search?: boolean;
}) {
  const [q, setQ] = useState('');
  const shown = useMemo(
    () => library.filter((x) => x.toLowerCase().includes(q.toLowerCase())),
    [library, q],
  );
  const toggle = (x: string) => onChange(selected.includes(x) ? selected.filter((s) => s !== x) : [...selected, x]);
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink"><Icon size={15} className="text-ink-soft" /> {title}</div>
      {search && <Field placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-2" />}
      <div className="flex flex-wrap gap-1.5">
        {shown.slice(0, search ? 40 : 24).map((x) => {
          const on = selected.includes(x);
          return (
            <button key={x} onClick={() => toggle(x)}
              className={cn('rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition',
                on ? 'border-pine-600 bg-pine-600 text-white' : 'border-line bg-white text-ink-soft hover:border-pine-300')}>
              {on && <Check size={11} className="mr-1 inline" />}{x}
            </button>
          );
        })}
      </div>
    </div>
  );
}
