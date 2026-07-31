import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, Dumbbell, CalendarCheck, BadgeCheck, ClipboardList, FileText,
  Users, ThumbsUp, Star, Clock, Quote, ChevronDown, ArrowUpRight, ArrowRight,
  Phone, Check, X, Home as HomeIcon, CalendarClock, ChevronRight, Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../store/store';
import { cardBySlug } from '../store/catalog';
import { fmtDay, fmtTime } from '../store/clock';
import { Pill } from '../shared/ui';
import { asset } from '../shared/asset';

const FROM_PRICE = 499;
const PHONE = '+918047181299';
const SHELL = 'mx-auto w-full px-6 lg:px-12';

const paths = [
  { icon: Stethoscope, to: '/physiotherapy', kicker: 'In pain or recovering?', title: 'Physiotherapy at home', body: 'Back, knee, post-surgery, and more.', cta: 'Explore physiotherapy' },
  { icon: Dumbbell, to: '/physical-training', kicker: 'Want to get fit?', title: 'Personal training at home', body: 'Weight loss, strength, general fitness.', cta: 'Explore training' },
];

// The shared promise, one flow for both services.
const flow = [
  { i: CalendarCheck, t: 'Book in 2 minutes', d: 'Pick a slot that suits you and confirm.' },
  { i: BadgeCheck, t: 'A verified professional comes to you', d: 'Certified and background checked.' },
  { i: ClipboardList, t: 'A quick assessment before your session', d: 'A short check first, then your session begins.' },
  { i: FileText, t: 'A clear report after every visit', d: 'A simple summary of your session.' },
];

const metrics = [
  { i: Users, v: '1,000+', l: 'Home visits delivered' },
  { i: ThumbsUp, v: '98%', l: 'Would recommend us' },
  { i: Star, v: '4.8★', l: 'Average visit rating' },
  { i: Clock, v: '2 hrs', l: 'Average arrival time' },
];

// Breadth strips — every chip links to a real, bookable page.
const physioChips = [
  { slug: 'back-pain', label: 'Back pain' },
  { slug: 'knee-pain', label: 'Knee pain' },
  { slug: 'neck-desk', label: 'Neck & cervical' },
  { slug: 'sciatica-flare', label: 'Sciatica' },
  { slug: 'shoulder-pain', label: 'Shoulder pain' },
  { slug: 'frozen-shoulder', label: 'Frozen shoulder' },
  { slug: 'post-surgery', label: 'Post-surgery recovery' },
  { slug: 'arthritis', label: 'Arthritis' },
  { slug: 'disc-pain', label: 'Disc-related pain' },
  { slug: 'postnatal', label: 'Pregnancy & post-natal' },
];
const trainingChips = [
  { slug: 'weight-loss', label: 'Weight loss' },
  { slug: 'strength', label: 'Strength & muscle' },
  { slug: 'general-fitness', label: 'General fitness' },
  { slug: 'post-pregnancy', label: 'Post-pregnancy fitness' },
  { slug: 'senior-fitness', label: 'Senior fitness' },
  { slug: 'sports-endurance', label: 'Sports & endurance' },
  { slug: 'flexibility', label: 'Flexibility & mobility' },
];

const standard = [
  'Licensed physios (BPT/MPT) and certified trainers',
  'Background-verified',
  'Trained for home visits',
  'Rated by clients after every session',
];

// Home vs a clinic or gym — the value comparison.
const compare = [
  { k: 'Getting there', home: 'The professional comes to you', out: 'You commute, in pain or after work' },
  { k: 'Attention', home: 'Full 1-on-1, in your space', out: 'Shared, often rushed or crowded' },
  { k: 'Waiting', home: 'Your chosen time slot', out: 'Queues and delays' },
  { k: 'Commitment', home: 'Pay per visit, no lock-in', out: 'Package or membership required' },
];

// PLACEHOLDER RESULTS — replace with real, consented reviews before launch.
const results = [
  { q: 'Couldn’t get out of bed with back pain. Walking to the market again after 4 home sessions.', a: 'Placeholder, 62' },
  { q: 'Lost 8 kg in 12 weeks, training in my living room before work.', a: 'Placeholder, 31' },
  { q: 'Booked it for my mother after surgery, they came home and she recovered faster than we expected.', a: 'Placeholder, booked for a parent' },
];

const faqs = [
  { q: 'Do you offer both physiotherapy and personal training?', a: 'Yes, licensed physios for recovery and pain, and certified trainers for fitness, both at your home.' },
  { q: 'Are your professionals qualified and safe?', a: 'Every one is licensed or certified, background-verified, and rated after each visit. You get their name and details before they arrive.' },
  { q: 'How soon can someone come?', a: 'In most areas, the same day. You’ll see the earliest slot for your pincode when you book.' },
  { q: 'Do I have to buy a package?', a: 'No. You pay per visit with no lock-in and continue only if you want to.' },
  { q: 'Can I book for a family member?', a: 'Yes, add their details and address when booking.' },
  { q: 'Which areas do you serve?', a: 'We cover all of Bengaluru, right across the city.' },
];

function HeroImg() {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="tile-placeholder relative grid aspect-[4/5] w-full place-items-center overflow-hidden">
        <div className="grain-dark" />
        <ImageIcon size={44} className="relative text-surface/40" />
      </div>
    );
  }
  return (
    <img
      src={asset('/back-pain.jpg')}
      alt="A verified professional treating a client at home"
      className="aspect-[4/5] w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function Home() {
  const { state } = useStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const upcoming = state.cookieCustomerId
    ? state.bookings
        .filter((b) => b.customerId === state.cookieCustomerId && b.status !== 'cancelled' && b.status !== 'completed')
        .sort((a, b) => a.scheduledAt - b.scheduledAt)[0]
    : undefined;

  return (
    <div className="pb-4">
      {/* ── 1 · Hero (umbrella) ── */}
      <section className="relative overflow-hidden border-b border-forest-900/40 bg-forest-800 text-surface">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -left-40 top-1/4 h-[30rem] w-[30rem] text-clay-500/20 glow" aria-hidden />
        <div className="pointer-events-none absolute -right-40 -top-24 h-[34rem] w-[34rem] text-forest-500/30 glow floaty" aria-hidden />
        <div className={`${SHELL} relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24`}>
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-surface/15 bg-surface/10 px-4 py-1.5 text-fine font-semibold text-forest-50">
              <BadgeCheck size={16} className="text-butter" /> Bengaluru’s home health &amp; fitness service
            </span>
            <h1 className="mt-6 font-display text-heading font-medium leading-[1.02] tracking-tight text-surface sm:text-display lg:text-display">
              Physiotherapy &amp; personal training at your home.{' '}
              <span className="italic text-clay-300">At ₹{FROM_PRICE} in 2 hrs.</span>
            </h1>
            <p className="mt-5 max-w-lg text-body leading-relaxed text-forest-50/80">
              Verified professionals come to you, to recover from pain or reach your fitness goal.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-fine font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><Clock size={17} className="text-butter" /> Arrives in ~2 hrs</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><BadgeCheck size={17} className="text-butter" /> Verified professionals</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><Star size={17} className="fill-butter text-butter" /> 4.8★</span>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/physiotherapy" className="group inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-8 py-4 text-body font-semibold text-surface shadow-[0_16px_40px_-16px_rgba(199,107,65,0.95)] transition hover:bg-clay-600 active:scale-[0.98]">
                Book a home visit
                <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 rounded-full border border-surface/25 bg-surface/10 px-7 py-4 text-body font-semibold text-surface transition hover:border-surface/50 hover:bg-surface/15">
                <Phone size={18} className="text-butter" /> Call us
              </a>
            </div>
          </div>

          <div className="animate-slide relative mx-auto w-full max-w-md lg:mr-0" style={{ animationDelay: '0.1s' }}>
            <div className="relative overflow-hidden rounded-[2.25rem] border border-surface/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
              <HeroImg />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-900/25 to-transparent" />
            </div>
            <div className="floaty absolute -left-5 top-12 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-xl">
              <div className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">From</div>
              <div className="font-display text-title font-semibold text-forest-700">₹{FROM_PRICE}<span className="text-fine font-medium text-ink-soft"> / visit</span></div>
            </div>
            <div className="absolute -bottom-5 right-3 flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 shadow-xl">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-50 text-forest-600"><BadgeCheck size={18} /></span>
              <div className="text-fine font-semibold leading-tight text-ink">Verified<br />pro</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── returning-user upcoming session ── */}
      {upcoming && (
        <div className={`${SHELL} pt-8`}>
          <Link to="/account" className="group flex items-center justify-between gap-4 rounded-3xl border border-forest-200 bg-forest-50/60 p-6 transition hover:border-forest-500">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-600 text-surface"><CalendarClock size={22} /></span>
              <div className="min-w-0">
                <div className="text-fine font-semibold uppercase tracking-[0.14em] text-forest-600">Your upcoming session</div>
                <div className="mt-0.5 truncate font-display text-title font-medium text-ink">{cardBySlug(upcoming.condition)?.label ?? upcoming.type}</div>
                <div className="text-fine text-ink-soft">{fmtDay(upcoming.scheduledAt)} · {fmtTime(upcoming.scheduledAt)}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Pill tone="forest">Confirmed</Pill>
              <ChevronRight size={20} className="text-ink-soft transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      )}

      {/* ── 2 · Two paths (the router) ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">Which brings you here?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {paths.map((p) => (
            <Link key={p.to} to={p.to} className="group flex flex-col rounded-[2rem] border border-line bg-surface p-8 shadow-[0_1px_2px_rgba(26,38,33,0.04),0_24px_50px_-34px_rgba(26,38,33,0.3)] transition hover:-translate-y-1 hover:border-forest-200 lg:p-10">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest-50 text-forest-600 transition group-hover:bg-forest-600 group-hover:text-surface"><p.icon size={26} strokeWidth={1.7} /></span>
              <div className="mt-6 text-fine font-semibold uppercase tracking-[0.14em] text-clay-600">{p.kicker}</div>
              <h3 className="mt-2 font-display text-title font-medium text-ink lg:text-heading">{p.title}</h3>
              <p className="mt-2 flex-1 text-body text-ink-soft">{p.body}</p>
              <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-fine font-semibold text-canvas transition group-hover:bg-forest-900">
                {p.cta} <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3 · How it works ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">How it works</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map((s, i) => (
            <div key={s.t} className="group flex flex-col rounded-[1.75rem] border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(26,38,33,0.04),0_22px_46px_-32px_rgba(26,38,33,0.3)] transition hover:-translate-y-1 hover:border-forest-200">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-600 ring-1 ring-forest-100 transition group-hover:bg-forest-600 group-hover:text-surface"><s.i size={22} strokeWidth={1.7} /></span>
                <span className="font-display text-heading font-semibold text-clay-500/25">{i + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-title font-medium leading-snug text-ink">{s.t}</h3>
              <p className="mt-2.5 text-fine leading-relaxed text-ink-soft">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-body font-medium text-forest-700">That’s it, your session is booked and confirmed.</p>
      </section>

      {/* ── 4 · Stats band ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-forest-800 p-8 text-surface sm:p-10 lg:p-16">
          <div className="grain-dark" />
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-80 w-80 -translate-x-1/2 text-clay-500/20 glow" aria-hidden />
          <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.l} className="flex flex-col items-center text-center">
                <m.i size={26} className="text-butter" strokeWidth={1.7} />
                <div className="mt-3 font-display text-display font-semibold">{m.v}</div>
                <div className="mt-1.5 text-fine text-forest-50/75">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 · What we help with (breadth strips) ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">What we help with</h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {[
            { icon: Stethoscope, title: 'Physiotherapy', base: '/physiotherapy', items: physioChips },
            { icon: Dumbbell, title: 'Personal training', base: '/physical-training', items: trainingChips },
          ].map((col) => (
            <div key={col.title} className="rounded-[2rem] border border-line bg-surface p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-50 text-forest-600"><col.icon size={22} strokeWidth={1.7} /></span>
                <h3 className="font-display text-title font-medium text-ink">{col.title}</h3>
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {col.items.map((c) => (
                  <Link key={c.slug} to={`${col.base}/${c.slug}`} className="rounded-full border border-line-strong bg-canvas/50 px-4 py-2 text-fine font-semibold text-ink transition hover:border-forest-500 hover:bg-forest-50">
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6 · Why Kine (verification) ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-forest-800 p-8 text-surface lg:p-14">
          <div className="grain-dark" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 text-clay-500/20 glow" aria-hidden />
          <div className="relative">
            <div className="flex items-start gap-4">
              <BadgeCheck size={30} className="shrink-0 text-butter" strokeWidth={1.6} />
              <h2 className="max-w-2xl font-display text-heading font-medium leading-snug tracking-tight">
                Every professional is verified before they reach your door.
              </h2>
            </div>
            <ol className="mt-9 grid gap-4 sm:grid-cols-2">
              {standard.map((s, i) => (
                <li key={s} className="flex items-start gap-4 text-body text-forest-50/90">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface/10 font-display text-fine font-semibold text-butter">{i + 1}</span>
                  <span className="pt-1">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 flex items-start gap-3 text-fine leading-relaxed text-forest-50/80">
              <Check size={20} className="mt-0.5 shrink-0 text-butter" />
              Before the visit, you get their name and details in advance.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {['Licensed / Certified', 'Background-checked', 'Home-visit trained', '4.8★ rated'].map((b) => (
                <span key={b} className="rounded-full bg-surface/10 px-3.5 py-1.5 text-fine font-semibold text-forest-50/90 ring-1 ring-inset ring-surface/15">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 · Home vs clinic & gym ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">Home vs a clinic or gym</h2>
        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_2px_rgba(26,38,33,0.04),0_22px_46px_-34px_rgba(26,38,33,0.3)]">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr] items-center gap-4 border-b border-line bg-forest-50/50 px-6 py-4 sm:grid lg:px-8">
            <span className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">Compare</span>
            <span className="flex items-center gap-2 font-display text-body font-semibold text-forest-700"><BadgeCheck size={18} /> Kine at home</span>
            <span className="font-display text-body font-medium text-ink-soft">Clinic / gym</span>
          </div>
          {compare.map((row, i) => (
            <div key={row.k} className={`grid grid-cols-1 gap-2 border-t border-line px-6 py-4 sm:grid-cols-[1.1fr_1fr_1fr] sm:items-center sm:gap-4 sm:border-t-0 lg:px-8 ${i % 2 ? 'sm:bg-canvas/40' : ''}`}>
              <span className="font-display text-body font-semibold text-ink sm:font-sans sm:text-fine">{row.k}</span>
              <span className="flex items-center gap-2 text-fine text-ink"><Check size={17} className="shrink-0 text-forest-600" /> {row.home}</span>
              <span className="flex items-center gap-2 text-fine text-ink-soft"><X size={17} className="shrink-0 text-clay-400" /> {row.out}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8 · Results ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-forest-100 bg-forest-50/60 p-8 lg:p-14">
          <div className="grain-light" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 text-clay-500/12 glow" aria-hidden />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-heading font-medium tracking-tight text-ink">Results</h2>
              <span className="inline-flex items-center gap-2 text-fine font-semibold text-forest-700">
                <Star size={18} className="fill-butter text-butter" /> 4.8 average · 1,000+ home visits
              </span>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {results.map((t) => (
                <div key={t.a} className="flex flex-col rounded-[1.75rem] border border-line bg-surface p-8 shadow-[0_2px_4px_rgba(26,38,33,0.05),0_30px_56px_-28px_rgba(26,38,33,0.42)] transition hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <Quote size={30} className="text-clay-500" fill="currentColor" />
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((n) => <Star key={n} size={15} className="fill-butter text-butter" />)}
                    </div>
                  </div>
                  <p className="mt-5 flex-1 font-display text-title font-medium leading-relaxed text-ink">“{t.q}”</p>
                  <p className="mt-6 text-fine font-semibold uppercase tracking-[0.1em] text-forest-600">{t.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 11 · FAQ ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">People also ask</h2>
        <div className="mt-8 divide-y divide-line overflow-hidden rounded-[1.75rem] border border-line bg-surface">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left transition hover:bg-forest-50/40 lg:px-8"
                >
                  <span className="font-display text-title font-medium text-ink">{f.q}</span>
                  <ChevronDown size={22} className={`shrink-0 text-forest-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <p className="px-6 pb-6 text-body leading-relaxed text-ink-soft lg:px-8">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 12 · Final CTA ── */}
      <section className="relative mt-20 overflow-hidden bg-forest-800 py-16 text-surface lg:mt-28 lg:py-24">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 text-clay-500/20 glow floaty" aria-hidden />
        <div className={`${SHELL} relative flex flex-col items-center gap-5 text-center`}>
          <h2 className="max-w-2xl font-display text-heading font-medium tracking-tight lg:text-display">Care that comes to you</h2>
          <p className="max-w-md text-body text-forest-50/80">A verified physio or trainer at your door in about 2 hours. From ₹{FROM_PRICE}, no lock-in.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/physiotherapy" className="group inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-8 py-4 text-body font-semibold text-surface shadow-[0_16px_40px_-16px_rgba(199,107,65,0.95)] transition hover:bg-clay-600 active:scale-[0.98]">
              Book a home visit
              <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 rounded-full border border-surface/25 px-7 py-4 text-body font-semibold text-surface transition hover:border-surface/60 hover:bg-surface/5">
              <Phone size={18} /> Call us
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-fine font-medium text-forest-50/85">
            <span className="inline-flex items-center gap-2"><Clock size={16} className="text-butter" /> Arrives in ~2 hrs</span>
            <span className="hidden h-3.5 w-px bg-surface/25 sm:block" />
            <span className="inline-flex items-center gap-2"><HomeIcon size={16} className="text-butter" /> Verified professionals</span>
          </div>
        </div>
      </section>
    </div>
  );
}
