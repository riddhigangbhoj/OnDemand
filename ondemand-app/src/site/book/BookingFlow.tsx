import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Check, ChevronRight, Search, Navigation,
  Pencil, Lock, ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../../store/store';
import { Button, Card, Field, TextField, Pill, cn } from '../../shared/ui';
import { CONDITIONS, PRICE, SERVED_PINCODES, cardBySlug, conditionBySlug } from '../../store/catalog';
import { getDateTiles, getDaySlots } from '../../store/rules';
import { fmtTileDay, fmtTileDate, fmtDay, fmtTime, sameDay } from '../../store/clock';
import { LoginProfile } from '../LoginProfile';
import type { Service } from '../../store/types';

type Nav = { service: Service; condition: string; type: string; amount?: number };

const LABEL: Record<string, string> = {
  address: 'Add your address', when: 'Date & time', review: 'Review', identity: 'Log in', pay: 'Pay',
};

export function BookingFlow() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const loc = useLocation();
  const nav = loc.state as Nav | null;

  // step list is fixed at mount so logging in mid-flow doesn't reshuffle indices
  const [requiresIdentity] = useState(() => !state.cookieCustomerId);
  const stepKeys = requiresIdentity
    ? ['address', 'when', 'review', 'identity', 'pay']
    : ['address', 'when', 'review', 'pay'];
  const total = stepKeys.length;
  const [idx, setIdx] = useState(0);
  const key = stepKeys[idx];
  const go = (d: number) => setIdx((i) => Math.max(0, Math.min(total - 1, i + d)));
  const jump = (k: string) => setIdx(stepKeys.indexOf(k));

  const [placed, setPlaced] = useState(false);

  const service = nav?.service ?? 'physiotherapy';
  const cond = conditionBySlug(nav?.condition ?? '') ?? CONDITIONS[0];
  const label = cardBySlug(cond.slug)?.label ?? cond.label;
  const amount = nav?.amount ?? PRICE[service];

  const [pincode, setPincode] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [search, setSearch] = useState('');
  const [entry, setEntry] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const tiles = useMemo(() => getDateTiles(state.now), [state.now]);
  const groups = useMemo(() => (targetDate ? getDaySlots(targetDate) : []), [targetDate]);
  const isToday = targetDate != null && sameDay(targetDate, state.now);

  const fullAddress = `${building.trim()}, ${street.trim()}`;

  if (placed)
    return <Placed onAccount={() => navigate('/account')} amount={amount} scheduledAt={scheduledAt!} service={service} />;

  const back = () => (idx === 0 ? navigate(-1) : go(-1));

  // Simulated location tools that prefill the locality block.
  const runSearch = () => search.trim() && setStreet(search.trim());
  const useMap = () => { setStreet('Pinned on map, near MG Road'); setPincode('560001'); };

  const pay = () => {
    dispatch({
      t: 'CREATE_BOOKING',
      address: `${fullAddress}${pincode ? ` ${pincode}` : ''}`,
      service,
      type: nav?.type ?? cond.type,
      condition: cond.slug,
      scheduledAt: scheduledAt!,
      amount,
      note: note || undefined,
      entryInstructions: entry || undefined,
    });
    setPlaced(true);
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* checkout bar */}
      <div className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="font-display text-title font-semibold tracking-tight text-ink">
            Kine<span className="text-clay-500">.</span>
          </Link>
          <span className="flex items-center gap-1.5 text-fine font-medium text-ink-soft">
            <Lock size={14} className="text-forest-600" /> Secure checkout
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-8 lg:px-10 lg:pt-12">
        {/* header + progress */}
        <div className="flex items-center gap-4">
          <button
            onClick={back}
            className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-ink transition hover:border-forest-500 disabled:opacity-0"
            disabled={key === 'pay'}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="text-fine font-semibold uppercase tracking-[0.16em] text-clay-600">
              Step {idx + 1} of {total} · {label}
            </div>
            <div className="mt-0.5 font-display text-title font-medium text-ink">{LABEL[key]}</div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          {stepKeys.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-500', i <= idx ? 'bg-forest-600' : 'bg-line-strong')} />
          ))}
        </div>

        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-14">
          <div className="min-w-0">
            {/* Address */}
            {key === 'address' && (
              <div className="animate-rise space-y-5">
                {blocked ? (
                  <Card className="p-8 text-center">
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rust-50 text-rust-500"><MapPin size={28} /></span>
                    <h2 className="mt-5 font-display text-title font-medium text-ink">We’re not in {pincode} yet</h2>
                    <p className="mt-2 text-body leading-relaxed text-ink-soft">On-demand visits are live across central and south-east Bengaluru. We’re expanding — try a nearby pincode.</p>
                    <Button variant="ghost" className="mt-5 w-full" onClick={() => setBlocked(false)}>Try another pincode</Button>
                  </Card>
                ) : (
                  <>
                    <Card className="p-7 lg:p-8">
                      <span className="mb-3 block text-fine font-semibold uppercase tracking-[0.1em] text-ink-soft">Find your location</span>
                      <div className="flex gap-2.5">
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                          placeholder="Search area, street or landmark"
                          className="w-full rounded-2xl border border-line-strong bg-surface px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-soft/45 focus:border-forest-500 focus:ring-4 focus:ring-forest-500/12"
                        />
                        <Button variant="ghost" className="shrink-0 px-5" onClick={runSearch}><Search size={16} /></Button>
                      </div>
                      <div className="my-6 flex items-center gap-3">
                        <span className="h-px flex-1 bg-line" />
                        <span className="text-fine font-medium text-ink-soft">or</span>
                        <span className="h-px flex-1 bg-line" />
                      </div>
                      <button onClick={useMap} className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-forest-200 bg-forest-50/60 py-6 text-body font-semibold text-forest-700 transition hover:border-forest-500 hover:bg-forest-50">
                        <Navigation size={18} className="text-forest-600" /> Select on map
                      </button>

                      <div className="mt-7 space-y-5 border-t border-line pt-7">
                        <Field label="Building / flat / property" placeholder="Flat 4B, Lakeview Residency" value={building} onChange={(e) => setBuilding(e.target.value)} />
                        <Field label="Street / locality / area" placeholder="12th Main, Indiranagar" value={street} onChange={(e) => setStreet(e.target.value)} />
                        <Field label="Pincode" placeholder="e.g. 560034" value={pincode} maxLength={6}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          hint="Serviced: central & south-east Bengaluru" />
                        <TextField label="Entry instructions (optional)" rows={2} placeholder="Gate code, landmark, which floor…" value={entry} onChange={(e) => setEntry(e.target.value)} />
                      </div>
                    </Card>

                    <Button className="w-full" disabled={pincode.length !== 6 || !building.trim() || !street.trim()}
                      onClick={() => (SERVED_PINCODES.includes(pincode) ? go(1) : setBlocked(true))}>
                      Continue <ChevronRight size={17} />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Date & time */}
            {key === 'when' && (
              <div className="animate-rise space-y-7">
                <div>
                  <div className="mb-3 text-fine font-semibold uppercase tracking-[0.1em] text-ink-soft">Choose a day</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {tiles.map((tile) => {
                      const selected = targetDate === tile.date;
                      return (
                        <button key={tile.date}
                          onClick={() => { setTargetDate(tile.date); setScheduledAt(null); }}
                          className={cn('rounded-2xl border px-4 py-3.5 text-left transition',
                            selected ? 'border-forest-600 bg-forest-50 ring-4 ring-forest-500/12' : 'border-line-strong bg-surface hover:border-forest-300')}>
                          <div className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">{tile.isToday ? 'Today' : fmtTileDay(tile.date)}</div>
                          <div className="mt-0.5 font-display text-body font-medium text-ink">{fmtTileDate(tile.date)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isToday && (
                  <p className="rounded-2xl bg-clay-50 px-4 py-3 text-fine font-medium text-clay-700 ring-1 ring-clay-100">
                    Today is fully booked. Pick another day for your session.
                  </p>
                )}

                {targetDate && groups.map((g) => (
                  <div key={g.label}>
                    <div className="mb-3 text-fine font-semibold uppercase tracking-[0.1em] text-ink-soft">{g.label}</div>
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {g.slots.map((at) => (
                        <button key={at} disabled={isToday} onClick={() => setScheduledAt(at)}
                          className={cn('rounded-2xl border py-3 text-body font-semibold transition',
                            isToday ? 'cursor-not-allowed border-line bg-surface-2 text-ink-soft/40 line-through'
                              : scheduledAt === at ? 'border-forest-600 bg-forest-600 text-surface'
                                : 'border-line-strong bg-surface text-ink hover:border-forest-400')}>
                          {fmtTime(at)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <Button className="w-full" disabled={scheduledAt == null} onClick={() => go(1)}>Continue <ChevronRight size={17} /></Button>
              </div>
            )}

            {/* Review */}
            {key === 'review' && (
              <div className="animate-rise space-y-3.5">
                <ReviewRow label="Service" value={`${service === 'training' ? 'Physical training' : 'Physiotherapy'} · ${label}`} onEdit={() => {}} noEdit />
                <ReviewRow label="Address" value={`${fullAddress}, ${pincode}`} onEdit={() => jump('address')} />
                <ReviewRow label="When" value={`${fmtDay(scheduledAt!)} · ${fmtTime(scheduledAt!)}`} onEdit={() => jump('when')} />
                <div className="rounded-3xl border border-line bg-surface p-5">
                  <div className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">Note for the professional (optional)</div>
                  <TextField rows={3} className="mt-2.5" placeholder="e.g. It started three days ago, worse in the mornings…" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <ReviewRow label="Amount" value={`₹${amount.toLocaleString('en-IN')} · prepaid`} onEdit={() => {}} noEdit />
                <Button className="mt-2 w-full" onClick={() => go(1)}>{requiresIdentity ? 'Continue' : 'Continue to pay'} <ChevronRight size={17} /></Button>
              </div>
            )}

            {/* Identity */}
            {key === 'identity' && (
              <div className="animate-rise">
                <LoginProfile heading="Log in to finish" sub="We verify you by phone before payment." cta="Continue to pay" onDone={() => go(1)} />
              </div>
            )}

            {/* Pay */}
            {key === 'pay' && (
              <div className="animate-rise space-y-5">
                <Card className="p-6">
                  <div className="flex items-center justify-between text-body">
                    <span className="text-ink-soft">{label}</span>
                    <span className="font-semibold text-ink">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-body font-semibold text-ink">Total, prepaid</span>
                    <span className="font-display text-title font-semibold text-ink">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                </Card>
                <p className="text-center text-fine text-ink-soft">Single prepaid session · no packages · simulated payment</p>
                <Button variant="clay" className="w-full py-4 text-body" onClick={pay}><Lock size={16} /> Pay ₹{amount.toLocaleString('en-IN')}</Button>
                <button onClick={() => jump('review')} className="mx-auto block text-fine font-medium text-ink-soft transition hover:text-ink">Back to review</button>
              </div>
            )}
          </div>

          {/* summary sidebar */}
          <aside className="mt-10 lg:sticky lg:top-28 lg:mt-0">
            <div className="relative overflow-hidden rounded-[2rem] bg-forest-800 p-8 text-surface shadow-[0_28px_60px_-36px_rgba(20,51,39,0.7)]">
              <div className="grain-dark" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 text-clay-500/20 glow" aria-hidden />
              <div className="relative">
                <div className="text-fine font-semibold uppercase tracking-[0.16em] text-butter">Your booking</div>
                <div className="mt-3 font-display text-title font-medium leading-tight">{cardBySlug(cond.slug)?.label ?? cond.label}</div>
                <div className="mt-1 text-body text-forest-50/70">{service === 'training' ? 'Physical training' : 'Physiotherapy'}</div>

                <div className="mt-6 flex items-baseline gap-2 border-t border-surface/15 pt-6">
                  <span className="font-display text-heading font-semibold">₹{amount.toLocaleString('en-IN')}</span>
                  <span className="text-fine text-forest-50/70">/ session, prepaid</span>
                </div>

                {(scheduledAt || building || street) && (
                  <div className="mt-6 space-y-3 border-t border-surface/15 pt-6 text-fine text-forest-50/80">
                    {scheduledAt && <div><span className="font-semibold text-surface">When · </span>{fmtDay(scheduledAt)}, {fmtTime(scheduledAt)}</div>}
                    {(building || street) && <div><span className="font-semibold text-surface">Where · </span>{[building, street].filter(Boolean).join(', ')}{pincode ? `, ${pincode}` : ''}</div>}
                  </div>
                )}

                <ul className="mt-7 space-y-3 border-t border-surface/15 pt-7">
                  {[
                    'Home visit at your address',
                    'Same-day, 8am to 8pm',
                    'Verified, screened professional',
                    'One prepaid session, no packages',
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-fine text-forest-50/80">
                      <Check size={17} className="mt-0.5 shrink-0 text-butter" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, onEdit, noEdit }: { label: string; value: string; onEdit: () => void; noEdit?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-3xl border border-line bg-surface p-5">
      <div className="min-w-0">
        <div className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">{label}</div>
        <div className="mt-1 text-body font-medium text-ink">{value}</div>
      </div>
      {!noEdit && (
        <button onClick={onEdit} className="flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-1.5 text-fine font-semibold text-forest-700 transition hover:border-forest-500">
          <Pencil size={13} /> Edit
        </button>
      )}
    </div>
  );
}

function Placed({
  onAccount, amount, scheduledAt, service,
}: {
  onAccount: () => void; amount: number; scheduledAt: number; service: Service;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-forest-800 px-6 py-16 text-center text-surface">
      <div className="grain-dark" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 text-clay-500/20 glow floaty" aria-hidden />
      <div className="relative">
        <span className="animate-pop mx-auto grid h-20 w-20 place-items-center rounded-full bg-surface text-forest-700"><Check size={40} /></span>
        <h1 className="mt-8 font-display text-heading font-medium tracking-tight lg:text-heading">Your session is confirmed</h1>
        <p className="mx-auto mt-4 max-w-md text-body leading-relaxed text-forest-50/80">
          Your {service === 'training' ? 'training' : 'physiotherapy'} session for{' '}
          <span className="font-semibold text-surface">{fmtDay(scheduledAt)}, {fmtTime(scheduledAt)}</span> is confirmed.
          You paid ₹{amount.toLocaleString('en-IN')}.
        </p>
        <div className="mt-6 flex justify-center">
          <Pill tone="sage">Confirmed</Pill>
        </div>
        <button
          onClick={onAccount}
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-surface px-8 py-3.5 text-body font-semibold text-forest-800 transition hover:bg-clay-50"
        >
          View my bookings <ArrowUpRight size={17} />
        </button>
      </div>
    </div>
  );
}
