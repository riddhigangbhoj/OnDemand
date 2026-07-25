import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Check, ChevronRight, Search, Navigation,
  MessageCircle, Pencil, Lock, CalendarClock, ShieldCheck, CreditCard,
} from 'lucide-react';
import { useStore } from '../../store/store';
import { usePanes } from '../../shared/panes';
import { Button, Card, Field, TextField, Pill, cn } from '../../shared/ui';
import { CONDITIONS, PRICE, SERVED_PINCODES, cardBySlug, conditionBySlug } from '../../store/catalog';
import { getDateTiles, getDaySlots } from '../../store/rules';
import { fmtTileDay, fmtTileDate, fmtDay, fmtTime, sameDay } from '../../store/clock';
import { LoginProfile } from '../LoginProfile';
import type { Service } from '../../store/types';

type Nav = { service: Service; condition: string; type: string };

const LABEL: Record<string, string> = {
  address: 'Add your address', when: 'Date & time', review: 'Review', identity: 'Log in', pay: 'Pay',
};

export function BookingFlow() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { openWhatsApp } = usePanes();
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
  const amount = PRICE[service];

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
    return <Placed onWhatsApp={() => openWhatsApp(state.cookieCustomerId)} onAccount={() => navigate('/account')} amount={amount} scheduledAt={scheduledAt!} service={service} />;

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
    <div className="flex min-h-full flex-col bg-white">
      <div className="border-b border-ink bg-paper/90">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-3 lg:max-w-7xl lg:px-10">
          <Link to="/" className="flex items-baseline">
            <span className="font-display text-[19px] lg:text-[26px] font-bold tracking-tight text-ink">KINE<span className="text-orange-500">.</span></span>
          </Link>
          <span className="flex items-center gap-1.5 text-[12px] lg:text-[26px] font-medium text-ink"><Lock size={13} /> Secure checkout</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-4 lg:max-w-7xl lg:px-10 lg:pt-10">
        {/* header + progress — spans the full width of both boxes */}
        <div className="sticky top-0 z-10 -mx-5 bg-paper/95 px-5 pb-3 pt-3.5 backdrop-blur lg:mx-0 lg:px-0">
          <div className="flex items-center gap-3">
            <button onClick={back} className="rounded-full p-1.5 text-ink hover:bg-black/5" disabled={key === 'pay'}>
              {key !== 'pay' && <ArrowLeft size={20} />}
            </button>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink lg:text-[26px]">
                Step {idx + 1} of {total} · {label}
              </div>
              <div className="font-display text-lg font-semibold text-ink lg:text-[1.7rem]">{LABEL[key]}</div>
            </div>
          </div>
          <div className="mt-6 flex gap-2 lg:mt-10 lg:gap-3">
            {stepKeys.map((_, i) => (
              <div key={i} className={cn('h-1.5 flex-1 rounded-full lg:h-2', i <= idx ? 'bg-pine-600' : 'bg-line')} />
            ))}
          </div>
        </div>

        <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-16">
        <div className="lg:min-w-0">
        <div className="py-6 lg:pt-0">
          {/* Address */}
          {key === 'address' && (
            <div className="space-y-4">
              {blocked ? (
                <Card className="p-6 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral-50 text-coral-600"><MapPin size={26} /></span>
                  <h2 className="mt-4 font-display text-xl font-semibold text-ink">We’re not in {pincode} yet</h2>
                  <p className="mt-2 text-[14px] lg:text-[26px] text-ink">On-demand visits are live across central and south-east Bengaluru. We’re expanding, try a nearby pincode.</p>
                  <Button variant="ghost" className="mt-4 w-full" onClick={() => setBlocked(false)}>Try another pincode</Button>
                </Card>
              ) : (
                <>
                  <Card className="p-6 lg:p-8">
                    <span className="mb-2.5 block text-sm lg:text-[26px] font-semibold text-ink">Find your location</span>
                    <div className="flex gap-2.5">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                        placeholder="Search area, street or landmark"
                        className="w-full rounded-xl border border-ink bg-white px-3.5 py-2.5 text-[15px] lg:py-4 lg:text-[26px] text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
                      />
                      <Button variant="ghost" className="shrink-0 px-4" onClick={runSearch}><Search size={16} className="lg:h-6 lg:w-6" /> Search</Button>
                    </div>
                    <div className="my-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-ink/15" />
                      <span className="text-sm lg:text-[26px] font-medium text-ink">or</span>
                      <span className="h-px flex-1 bg-ink/15" />
                    </div>
                    <button onClick={useMap} className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-pine-600 bg-pine-50 py-7 text-[13px] lg:text-[26px] font-semibold text-pine-700 transition hover:bg-pine-100">
                      <Navigation size={18} className="text-pine-600 lg:h-7 lg:w-7" /> Select on map
                    </button>

                    <div className="mt-7 space-y-5 border-t border-ink pt-7">
                      <Field label="Building / flat / property" placeholder="Flat 4B, Lakeview Residency" value={building} onChange={(e) => setBuilding(e.target.value)} />
                      <Field label="Street / locality / area" placeholder="12th Main, Indiranagar" value={street} onChange={(e) => setStreet(e.target.value)} />
                      <Field label="Pincode" placeholder="e.g. 560034" value={pincode} maxLength={6}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        hint="Serviced: central & south-east Bengaluru" />
                      <TextField label="Entry instructions (optional)" rows={2} placeholder="Gate code, landmark, which floor…" value={entry} onChange={(e) => setEntry(e.target.value)} />
                    </div>
                  </Card>

                  <Button className="w-full py-3 lg:py-5" disabled={pincode.length !== 6 || !building.trim() || !street.trim()}
                    onClick={() => (SERVED_PINCODES.includes(pincode) ? go(1) : setBlocked(true))}>
                    Continue
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Date & time */}
          {key === 'when' && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-xs lg:text-[26px] font-semibold uppercase tracking-wide text-ink">Choose a day</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {tiles.map((tile) => {
                    const selected = targetDate === tile.date;
                    return (
                      <button key={tile.date}
                        onClick={() => { setTargetDate(tile.date); setScheduledAt(null); }}
                        className={cn('rounded-xl border px-3 py-2 text-left transition',
                          selected ? 'border-pine-600 bg-pine-50 ring-2 ring-pine-500/20' : 'border-ink bg-white')}>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink lg:text-[26px]">{tile.isToday ? 'Today' : fmtTileDay(tile.date)}</div>
                        <div className="font-display text-[15px] font-semibold text-ink lg:text-[26px]">{fmtTileDate(tile.date)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isToday && (
                <p className="rounded-xl bg-orange-50 px-3 py-2.5 text-[13px] font-medium text-orange-700 lg:text-[26px]">
                  Today is fully booked. Pick another day for your session.
                </p>
              )}

              {targetDate && groups.map((g) => (
                <div key={g.label}>
                  <div className="mb-2 text-xs lg:text-[26px] font-semibold uppercase tracking-wide text-ink">{g.label}</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {g.slots.map((at) => (
                      <button key={at} disabled={isToday} onClick={() => setScheduledAt(at)}
                        className={cn('rounded-xl border py-2.5 text-sm lg:text-[26px] font-semibold transition',
                          isToday ? 'cursor-not-allowed border-line bg-paper-2 text-ink/40 line-through'
                            : scheduledAt === at ? 'border-pine-600 bg-pine-600 text-white'
                              : 'border-ink bg-white text-ink hover:border-pine-300')}>
                        {fmtTime(at)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <Button className="w-full py-3" disabled={scheduledAt == null} onClick={() => go(1)}>Continue</Button>
            </div>
          )}

          {/* Review */}
          {key === 'review' && (
            <div className="space-y-3">
              <ReviewRow label="Service" value={`${service === 'training' ? 'Physical training' : 'Physiotherapy'} · ${label}`} onEdit={() => {}} noEdit />
              <ReviewRow label="Address" value={`${fullAddress}, ${pincode}`} onEdit={() => jump('address')} />
              <ReviewRow label="When" value={`${fmtDay(scheduledAt!)} · ${fmtTime(scheduledAt!)}`} onEdit={() => jump('when')} />
              <div className="rounded-2xl border border-ink bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink lg:text-[26px]">Note for the professional (optional)</div>
                <TextField rows={3} className="mt-2 text-[14px] lg:text-[26px]" placeholder="e.g. It started three days ago, worse in the mornings…" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <ReviewRow label="Amount" value={`₹${amount.toLocaleString('en-IN')} · prepaid`} onEdit={() => {}} noEdit />
              <Button className="mt-2 w-full py-3" onClick={() => go(1)}>{requiresIdentity ? 'Continue' : 'Continue to pay'}</Button>
            </div>
          )}

          {/* Identity (only when not already logged in) */}
          {key === 'identity' && (
            <LoginProfile heading="Log in to finish" sub="We verify you by phone before payment." cta="Continue to pay" onDone={() => go(1)} />
          )}

          {/* Pay */}
          {key === 'pay' && (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-ink lg:text-[26px]">{label}</span>
                  <span className="font-semibold text-ink">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-ink pt-2">
                  <span className="text-[15px] font-semibold text-ink lg:text-[26px]">Total, prepaid</span>
                  <span className="font-display text-xl font-semibold text-ink lg:text-[1.75rem]">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              </Card>
              <p className="text-center text-[12.5px] lg:text-[26px] text-ink">Single prepaid session · no packages · simulated payment</p>
              <Button className="w-full py-3.5 text-base" onClick={pay}><Lock size={16} /> Pay ₹{amount.toLocaleString('en-IN')}</Button>
              <button onClick={() => jump('review')} className="mx-auto block text-[13px] lg:text-[26px] font-medium text-ink">Back to review</button>
            </div>
          )}
        </div>
        </div>

        {/* summary sidebar — desktop */}
        <aside className="hidden lg:flex lg:items-center">
          <div className="grain w-full rounded-none border-2 border-pine-300 bg-pine-50 p-8">
            <div className="text-[13px] lg:text-[26px] font-semibold uppercase tracking-wide text-pine-700">Your booking</div>
            <div className="mt-3 font-display text-[24px] font-semibold text-ink">{cardBySlug(cond.slug)?.label ?? cond.label}</div>
            <div className="mt-0.5 text-[16px] lg:text-[26px] font-medium text-ink">{service === 'training' ? 'Physical training' : 'Physiotherapy'}</div>

            <div className="mt-5 flex items-baseline gap-2 border-t border-pine-300 pt-5">
              <span className="font-display text-[32px] font-semibold text-ink">₹{amount.toLocaleString('en-IN')}</span>
              <span className="text-[15px] lg:text-[26px] font-medium text-ink">/ session, prepaid</span>
            </div>

            {(scheduledAt || building || street) && (
              <div className="mt-5 space-y-2 border-t border-pine-300 pt-5 text-[15px] lg:text-[26px] text-ink">
                {scheduledAt && <div><span className="font-semibold">When: </span>{fmtDay(scheduledAt)}, {fmtTime(scheduledAt)}</div>}
                {(building || street) && <div><span className="font-semibold">Where: </span>{[building, street].filter(Boolean).join(', ')}{pincode ? `, ${pincode}` : ''}</div>}
              </div>
            )}

            <ul className="mt-6 space-y-3 border-t border-pine-300 pt-6">
              {[
                'Home visit at your address',
                'Same-day, 8am to 8pm',
                'Verified, screened professional',
                'One prepaid session, no packages',
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[15px] lg:text-[26px] font-medium text-ink">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pine-600 lg:mt-4 lg:h-2.5 lg:w-2.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, onEdit, noEdit }: { label: string; value: string; onEdit: () => void; noEdit?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-ink bg-white p-4">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink lg:text-[26px]">{label}</div>
        <div className="mt-0.5 text-[14px] font-medium text-ink lg:text-[26px]">{value}</div>
      </div>
      {!noEdit && (
        <button onClick={onEdit} className="flex shrink-0 items-center gap-1 text-[13px] lg:text-[26px] font-semibold text-pine-600">
          <Pencil size={13} /> Edit
        </button>
      )}
    </div>
  );
}

function Placed({
  onWhatsApp, onAccount, amount, scheduledAt, service,
}: {
  onWhatsApp: () => void; onAccount: () => void; amount: number; scheduledAt: number; service: Service;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-paper px-6 py-16 text-center">
      <span className="animate-pop grid h-20 w-20 place-items-center rounded-full bg-pine-600 text-white"><Check size={40} /></span>
      <h1 className="mt-6 font-display text-[1.9rem] font-semibold text-ink lg:text-[2.75rem]">Your session is confirmed</h1>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-ink lg:max-w-md lg:text-[26px]">
        Your {service === 'training' ? 'training' : 'physiotherapy'} session for{' '}
        <span className="font-semibold text-ink">{fmtDay(scheduledAt)}, {fmtTime(scheduledAt)}</span> is confirmed.
        We’ll send the details on WhatsApp.
      </p>
      <Pill tone="pine" className="mt-4">Confirmed</Pill>
      <div className="mt-8 w-full max-w-xs space-y-2">
        <Button className="w-full py-3" onClick={onWhatsApp}><MessageCircle size={17} /> Open WhatsApp</Button>
        <Button variant="ghost" className="w-full py-3" onClick={onAccount}>View my bookings <ChevronRight size={16} /></Button>
      </div>
    </div>
  );
}
