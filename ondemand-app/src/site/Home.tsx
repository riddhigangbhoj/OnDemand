import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, Dumbbell, BadgeCheck,
  Star, Clock, Quote, ChevronDown, ArrowUpRight, ArrowRight,
  Phone, Check, X, Home as HomeIcon, CalendarClock, ChevronRight, Image as ImageIcon,
  MapPin, ShieldCheck,
} from 'lucide-react';
import { useStore } from '../store/store';
import { cardBySlug, SERVICE_CARDS } from '../store/catalog';
import { fmtDay, fmtTime } from '../store/clock';
import { Pill } from '../shared/ui';
import { asset } from '../shared/asset';

const FROM_PRICE = 499;
const PHONE = '+918047181299';
const SHELL = 'mx-auto w-full px-6 lg:px-12';

const paths = [
  { icon: Stethoscope, to: '/physiotherapy', kicker: 'In pain or recovering?', title: 'Physiotherapy at home', body: 'Back pain, knee pain, and more.', cta: 'Explore physiotherapy' },
  { icon: Dumbbell, to: '/physical-training', kicker: 'Want to get fit?', title: 'Personal training at home', body: 'Weight loss, strength, general fitness.', cta: 'Explore physical training' },
];

// The shared promise, one flow for both services.
const flow = [
  { t: 'Book in 2 minutes', d: 'Pick a slot that suits you and confirm.' },
  { t: 'Our professional at your home', d: 'Certified and background checked.' },
  { t: 'A quick assessment', d: 'Short assessment.' },
  { t: 'Report after session', d: 'A simple summary of your session.' },
];

const metrics = [
  { v: '10,000+', l: 'Home visits delivered' },
  { v: '98%', l: 'Would recommend us' },
  { v: '4.9★', l: 'Average visit rating' },
  { v: '2 hrs', l: 'Average arrival time' },
];

// Breadth strips mirror the condition hubs exactly — the hub is the single
// source of truth for what we actually treat and offer.
const physioChips = SERVICE_CARDS.physiotherapy;
const trainingChips = SERVICE_CARDS.training;

const standard = [
  'Our licensed physiotherapists (BPT/MPT) and certified trainers',
  'Background-verified',
  'Trained for home visits',
];

// Home vs clinic vs gym — the value comparison across three columns.
const compare = [
  { home: 'Our professional comes to you', clinic: 'You travel there, in pain', gym: 'You commute to the gym' },
  { home: 'Full 1-on-1 in your space', clinic: 'Shared, often rushed', gym: 'Crowded, little guidance' },
  { home: 'Your slot, no waiting', clinic: 'Queues and appointments', gym: 'Peak-hour crowds' },
  { home: 'Pay per visit, no lock-in', clinic: 'Package often required', gym: 'Membership required' },
];

// PLACEHOLDER RESULTS — replace with real, consented reviews before launch.
// On-demand voice: fast arrival, a single session, no package required.
const results = [
  { q: 'Woke up with a locked back on a Sunday. Booked at noon, a physiotherapist was at my door by 2 — no clinic, no waiting.', a: 'Placeholder, 34' },
  { q: 'Just wanted one session with a trainer before my trip. Loved that I could book a single visit, not a whole package.', a: 'Placeholder, 29' },
  { q: 'A trainer came home and took me through a proper workout — that easy. No membership, I just pay when I need it.', a: 'Placeholder, 41' },
];

const faqs = [
  { q: 'Do you offer both physiotherapy and personal training?', a: 'Yes, our licensed physiotherapists for recovery and pain, and our certified trainers for fitness, both at your home.' },
  { q: 'Are your professionals qualified and safe?', a: 'Every one of our professionals is licensed or certified, background-verified.' },
  { q: 'How soon can someone come?', a: 'Usually within about 2 hours. Our professional comes to your home the same day you book.' },
  { q: 'Do I have to buy a package?', a: 'No. You pay per visit with no lock-in.' },
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

// A sliding card for the breadth strips: photo space on top, condition name below.
function ConditionCard({ to, img, label }: { to: string; img: string; label: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <Link to={to} className="group w-56 shrink-0 sm:w-64">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-canvas shadow-[0_1px_2px_rgba(26,38,33,0.04),0_16px_36px_-30px_rgba(26,38,33,0.35)] transition group-hover:-translate-y-1 group-hover:border-forest-200">
        {broken ? (
          <div className="tile-placeholder relative grid aspect-[4/3] w-full place-items-center overflow-hidden">
            <div className="grain-dark" />
            <ImageIcon size={26} className="relative text-surface/40" />
          </div>
        ) : (
          <img
            src={asset(img)}
            alt={label}
            className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <div className="mt-2.5 px-0.5 font-display text-fine font-medium leading-snug text-ink transition group-hover:text-forest-700">{label}</div>
    </Link>
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
      <section className="mesh-forest dotgrid contours relative overflow-hidden border-b border-forest-900/40 text-surface">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -left-40 top-1/4 h-[30rem] w-[30rem] text-clay-500/20 glow floaty" aria-hidden />
        <div className="pointer-events-none absolute -right-52 -top-32 h-[38rem] w-[38rem] text-forest-400/25 glow" aria-hidden />
        <div className={`${SHELL} stagger relative z-10 grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28`}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-surface/15 bg-surface/10 px-4 py-1.5 text-fine font-semibold text-forest-50 backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-butter/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-butter" />
              </span>
              <MapPin size={15} className="text-butter" /> Currently serving in Bengaluru
            </span>
            <h1 className="mt-6 font-display text-heading font-medium leading-[1.02] tracking-tight text-surface sm:text-display lg:text-display">
              Physiotherapy &amp; personal training at your home.{' '}
              <span className="relative inline-block italic text-clay-300">
                At ₹{FROM_PRICE} in 2 hrs.
                <svg className="absolute -bottom-1 left-0 h-3 w-full text-clay-400/70" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 8 Q 60 2 100 6 T 198 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-body leading-relaxed text-forest-50/80">
              Our verified professionals come to your home to help you recover from pain or reach your fitness goal.
            </p>
            <div className="mt-8 inline-flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-surface/12 bg-surface/[0.06] px-5 py-3 text-fine font-semibold text-surface backdrop-blur">
              <span className="inline-flex items-center gap-2"><Clock size={18} className="text-butter" /> Arrives in ~2 hrs</span>
              <span className="hidden h-4 w-px bg-surface/20 sm:block" />
              <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-butter" /> Verified providers</span>
              <span className="hidden h-4 w-px bg-surface/20 sm:block" />
              <span className="inline-flex items-center gap-2"><Star size={18} className="fill-butter text-butter" /> 4.9 rated</span>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/physiotherapy" className="sheen cta-pulse group inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-8 py-4 text-body font-semibold text-surface transition hover:bg-clay-600 active:scale-[0.98]">
                Book a home visit
                <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mr-0 lg:max-w-lg">
            {/* warm accent halo behind the art */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_70%_20%,rgba(231,196,111,0.22),transparent_70%),radial-gradient(60%_60%_at_20%_90%,rgba(199,107,65,0.22),transparent_70%)] blur-xl" aria-hidden />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-surface/20 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.75)]">
              <HeroImg />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-900/45 via-transparent to-transparent" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-surface/10" />
            </div>

            {/* floating trust card — top left */}
            <div className="drift absolute -left-4 top-8 flex items-center gap-3 rounded-2xl border border-surface/15 bg-forest-900/70 px-4 py-3 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md sm:-left-8">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-butter/15 text-butter"><ShieldCheck size={22} /></span>
              <div className="leading-tight">
                <div className="text-fine font-semibold text-surface">Verified pro</div>
                <div className="text-fine text-forest-50/70">Background-checked</div>
              </div>
            </div>

            {/* floating rating card — bottom right */}
            <div className="drift-slow absolute -right-4 bottom-8 rounded-2xl border border-surface/15 bg-forest-900/70 px-5 py-4 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md sm:-right-8">
              <div className="flex items-center gap-2">
                <span className="font-display text-title font-semibold text-surface">4.9</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((n) => <Star key={n} size={14} className="fill-butter text-butter" />)}
                </div>
              </div>
              <div className="mt-1 text-fine text-forest-50/70">from 10,000+ visits</div>
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
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">What brings you here?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {paths.map((p) => (
            <Link key={p.to} to={p.to} className="group flex flex-col rounded-[2rem] border border-line bg-surface p-8 shadow-[0_1px_2px_rgba(26,38,33,0.04),0_24px_50px_-34px_rgba(26,38,33,0.3)] transition hover:-translate-y-1 hover:border-forest-200 lg:p-10">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-600 transition group-hover:bg-forest-600 group-hover:text-surface"><p.icon size={26} strokeWidth={1.7} /></span>
                <div className="text-fine font-semibold uppercase tracking-[0.14em] text-clay-600">{p.kicker}</div>
              </div>
              <h3 className="mt-6 font-display text-title font-medium text-ink lg:text-heading">{p.title}</h3>
              <p className="mt-2 flex-1 text-body text-ink-soft">{p.body}</p>
              <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-fine font-semibold text-canvas transition group-hover:bg-forest-900">
                {p.cta} <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3 · How it works + stats (side by side) ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* how it works — left: connected timeline */}
          <div className="rounded-[2.5rem] border border-line bg-surface p-8 shadow-[0_1px_2px_rgba(26,38,33,0.04),0_28px_60px_-42px_rgba(26,38,33,0.35)] sm:p-10 lg:p-12">
            <span className="inline-flex items-center gap-2 text-fine font-semibold uppercase tracking-[0.14em] text-clay-600">
              <span className="h-px w-6 bg-clay-500/60" /> The process
            </span>
            <h2 className="mt-3 font-display text-title font-medium tracking-tight text-ink lg:text-heading">How it works</h2>
            <ol className="relative mt-9 space-y-7">
              {flow.map((s, i) => (
                <li key={s.t} className="group relative flex gap-4">
                  {i < flow.length - 1 && (
                    <span aria-hidden className="absolute left-[1.375rem] top-12 -bottom-7 w-px -translate-x-1/2 bg-line-strong" />
                  )}
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest-50 font-display text-title font-semibold text-forest-600 ring-1 ring-forest-100 transition duration-300 group-hover:bg-forest-600 group-hover:text-surface group-hover:ring-forest-600">{i + 1}</span>
                  <div className="pt-1">
                    <h3 className="font-display text-title font-medium leading-snug text-ink transition-colors group-hover:text-forest-700">{s.t}</h3>
                    <p className="mt-1 text-fine leading-relaxed text-ink-soft">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* stats band — right: structured quadrant */}
          <div className="mesh-forest dotgrid relative flex flex-col overflow-hidden rounded-[2.5rem] p-8 text-surface sm:p-10 lg:p-12">
            <div className="grain-dark" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 text-clay-500/25 glow" aria-hidden />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-fine font-semibold uppercase tracking-[0.14em] text-forest-50/70">
                <span className="h-px w-6 bg-butter/60" /> By the numbers
              </span>
              <h2 className="mt-3 font-display text-title font-medium tracking-tight text-surface lg:text-heading">Trusted across Bengaluru</h2>
            </div>
            <div className="relative z-10 mt-8 grid flex-1 grid-cols-2 place-content-center">
              {metrics.map((m, i) => (
                <div
                  key={m.l}
                  className={`flex flex-col items-center py-8 text-center border-surface/12 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''}`}
                >
                  <div className="font-display text-display font-semibold leading-none">
                    {m.v.replace('★', '')}
                    {m.v.includes('★') && <span className="text-butter">★</span>}
                  </div>
                  <div className="mt-2 text-fine text-forest-50/70">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 · What we help with (sliding condition cards) ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">What we help with</h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {[
            { icon: Stethoscope, title: 'Physiotherapy', base: '/physiotherapy', items: physioChips, reverse: false },
            { icon: Dumbbell, title: 'Personal training', base: '/physical-training', items: trainingChips, reverse: true },
          ].map((col) => (
            <div key={col.title} className="overflow-hidden rounded-[2rem] border border-line bg-surface p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-50 text-forest-600"><col.icon size={22} strokeWidth={1.7} /></span>
                <h3 className="font-display text-title font-medium text-ink">{col.title}</h3>
              </div>
              <div
                className="mt-7 overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
                }}
              >
                <div className={`animate-marquee flex w-max gap-5 ${col.reverse ? '[animation-direction:reverse]' : ''}`} style={{ animationDuration: '95s' }}>
                  {[...col.items, ...col.items].map((c, idx) => (
                    <ConditionCard key={idx} to={`${col.base}/${c.slug}`} img={c.img} label={c.label} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6 · Verified professionals + home-vs-clinic (side by side) ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
          {/* verified professionals */}
          <div className="mesh-forest contours relative flex flex-col overflow-hidden rounded-[2.5rem] p-8 text-surface lg:p-12">
            <div className="grain-dark" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 text-clay-500/25 glow" aria-hidden />
            <div className="relative">
              <div className="flex items-start gap-4">
                <BadgeCheck size={30} className="shrink-0 text-butter" strokeWidth={1.6} />
                <h2 className="font-display text-title font-medium leading-snug tracking-tight lg:text-heading">
                  Every one of our professionals is verified before they reach your door.
                </h2>
              </div>
              <ol className="mt-8 grid gap-4">
                {standard.map((s, i) => (
                  <li key={s} className="flex items-start gap-4 text-body text-forest-50/90">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface/10 font-display text-fine font-semibold text-butter">{i + 1}</span>
                    <span className="pt-1">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* home vs clinic / gym */}
          <div className="flex flex-col rounded-[2.5rem] border border-line bg-surface p-8 shadow-[0_1px_2px_rgba(26,38,33,0.04),0_22px_46px_-34px_rgba(26,38,33,0.3)] lg:p-12">
            <h2 className="font-display text-title font-medium tracking-tight text-ink lg:text-heading">
              <span className="text-clay-600">Home</span> <span className="text-ink-soft">vs</span> <span className="text-clay-600">a clinic or gym</span>
            </h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-line">
              <div className="grid grid-cols-3 border-b border-line bg-forest-50/50">
                <span className="flex items-center gap-1.5 px-4 py-3 font-display text-body font-semibold text-forest-700"><BadgeCheck size={17} className="shrink-0" /> Home</span>
                <span className="border-l border-line px-4 py-3 font-display text-body font-medium text-ink-soft">Clinic</span>
                <span className="border-l border-line px-4 py-3 font-display text-body font-medium text-ink-soft">Gym</span>
              </div>
              {compare.map((row, i) => (
                <div key={row.home} className={`grid grid-cols-3 border-t border-line ${i % 2 ? 'bg-canvas/40' : ''}`}>
                  <span className="flex items-start gap-1.5 px-4 py-4 text-fine text-ink"><Check size={16} className="mt-1 shrink-0 text-forest-600" /> {row.home}</span>
                  <span className="flex items-start gap-1.5 border-l border-line px-4 py-4 text-fine text-ink-soft"><X size={16} className="mt-1 shrink-0 text-clay-400" /> {row.clinic}</span>
                  <span className="flex items-start gap-1.5 border-l border-line px-4 py-4 text-fine text-ink-soft"><X size={16} className="mt-1 shrink-0 text-clay-400" /> {row.gym}</span>
                </div>
              ))}
            </div>
          </div>
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
                <Star size={18} className="fill-butter text-butter" /> 4.9 average · 10,000+ home visits
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
                {open && <p className="animate-rise px-6 pb-6 text-body leading-relaxed text-ink-soft lg:px-8">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 12 · Final CTA ── */}
      <section className="mesh-forest dotgrid contours relative mt-20 overflow-hidden py-16 text-surface lg:mt-28 lg:py-24">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 text-clay-500/25 glow floaty" aria-hidden />
        <div className={`${SHELL} relative z-10 flex flex-col items-center gap-5 text-center`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-surface/15 bg-surface/10 px-4 py-1.5 text-fine font-semibold text-forest-50 backdrop-blur">
            <MapPin size={15} className="text-butter" /> Serving all of Bengaluru
          </span>
          <h2 className="max-w-2xl font-display text-heading font-medium tracking-tight lg:text-display">Care that comes to you</h2>
          <p className="max-w-md text-body text-forest-50/80">A verified physiotherapist or trainer at your door in about 2 hours, at ₹{FROM_PRICE}.</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <Link to="/physiotherapy" className="sheen cta-pulse group inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-8 py-4 text-body font-semibold text-surface transition hover:bg-clay-600 active:scale-[0.98]">
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
