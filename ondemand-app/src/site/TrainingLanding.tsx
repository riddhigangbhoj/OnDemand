import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Star, Dumbbell, Users, ThumbsUp, Clock, Quote, ChevronDown, ArrowRight, ArrowUpRight,
  BadgeCheck, Check, X, Phone, CalendarCheck, Home as HomeIcon,
  ClipboardList, FileText, HeartHandshake, TrendingUp,
} from 'lucide-react';
import { asset } from '../shared/asset';

const FROM_PRICE = 499;
const PHONE = '+918047181299';
const SHELL = 'mx-auto w-full px-6 lg:px-12';

// Goal swaps the hero line to match the ad; unknown/missing goals fall back to "get fit".
const GOALS: Record<string, { q: string; g: string }> = {
  'weight-loss': { q: 'Want to lose weight?', g: 'weight loss' },
  strength: { q: 'Ready to get stronger?', g: 'strength and muscle' },
  'general-fitness': { q: 'Want to get fit?', g: 'general fitness' },
  'post-pregnancy': { q: 'Rebuilding after pregnancy?', g: 'post-pregnancy fitness' },
  'senior-fitness': { q: 'Want to stay strong and mobile?', g: 'senior fitness and mobility' },
  'sports-endurance': { q: 'Training for your sport?', g: 'sports and endurance' },
  toning: { q: 'Want to tone up?', g: 'toning' },
  flexibility: { q: 'Want to move better?', g: 'flexibility and mobility' },
};
const DEFAULT_GOAL = { q: 'Want to get fit?', g: 'your fitness goal' };

// How we work, with trainer certification folded into card 2 (mirrors the physio page).
const flow = [
  { i: CalendarCheck, t: 'Book in 2 minutes', d: 'Pick a slot that suits you and confirm.' },
  { i: BadgeCheck, t: 'A certified trainer comes to you', d: 'Certified and experience-vetted.' },
  { i: ClipboardList, t: 'A quick assessment before your session', d: 'A fitness check first, then your session begins.' },
  { i: FileText, t: 'A clear plan after every session', d: 'A simple summary and what comes next.' },
];

const metrics = [
  { i: Users, v: '1,000+', l: 'Sessions delivered' },
  { i: ThumbsUp, v: '98%', l: 'Would recommend us' },
  { i: Star, v: '4.8★', l: 'Average session rating' },
  { i: Clock, v: '2 hrs', l: 'Average arrival time' },
];

// Home training vs the gym — the value comparison. The Commitment row carries the anti-package message.
const compare = [
  { k: 'Getting there', home: 'The trainer comes to you', gym: 'You commute to the gym' },
  { k: 'Attention', home: 'Full 1-on-1, every session', gym: 'Shared floor, no personal attention' },
  { k: 'The session', home: 'A plan built for your goal', gym: 'Generic, one-size-fits-all' },
  { k: 'Privacy', home: 'Train in your own space', gym: 'Working out in front of others' },
  { k: 'Commitment', home: 'Pay per session, no lock-in', gym: 'Long-term membership contract' },
];

// Cross-sell goal cards (current goal filtered out per page). Keep only real programs.
const goalChips = [
  { slug: 'weight-loss', label: 'Weight loss' },
  { slug: 'strength', label: 'Strength & muscle' },
  { slug: 'general-fitness', label: 'General fitness' },
  { slug: 'post-pregnancy', label: 'Post-pregnancy fitness' },
  { slug: 'senior-fitness', label: 'Senior fitness & mobility' },
  { slug: 'sports-endurance', label: 'Sports & endurance' },
  { slug: 'toning', label: 'Toning' },
  { slug: 'flexibility', label: 'Flexibility & mobility' },
];

// PLACEHOLDER RESULTS — replace with real, consented client results before launch.
const results = [
  { q: 'Lost 8 kg in 12 weeks, training in my living room before work.', a: 'Placeholder, 31, [area]' },
  { q: 'Went from zero push-ups to real strength. Never had to step into a gym.', a: 'Placeholder, 27, [area]' },
  { q: 'My trainer worked around my knee and got me moving again at 58.', a: 'Placeholder, 58, [area]' },
];

const included = [
  'A certified trainer at your home',
  'A plan built for your goal',
  'Progress tracked every session',
];

const faqs = [
  { q: 'Do I need equipment or a gym setup at home?', a: 'No. Your trainer brings what’s needed and can build effective workouts using your body weight and small space.' },
  { q: 'Are your trainers actually certified?', a: 'Yes, certified fitness professionals, experience-checked, and rated by clients after every session. You get your trainer’s details before they arrive.' },
  { q: 'I’m a complete beginner. Is this for me?', a: 'Especially for you. Your plan starts at your level and builds up at a safe, doable pace.' },
  { q: 'Will I get a plan made for my goal?', a: 'Yes. After a quick fitness assessment, your trainer builds a plan for you, not a generic routine.' },
  { q: 'How often should I train?', a: 'Your trainer recommends a schedule for your goal. Most people start 2 to 3 sessions a week.' },
  { q: 'Can I train if I have an injury or a health condition?', a: 'Tell us upfront. For most conditions we adapt safely; if something needs medical clearance or physiotherapy first, we’ll tell you honestly.' },
  { q: 'Do I have to buy a package?', a: 'No. You pay per session with no lock-in and continue only if you want to.' },
  { q: 'Can I train with my partner or a family member?', a: 'Yes, ask about home sessions for two.' },
];

function HeroImg({ slug, alt }: { slug: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="tile-placeholder relative grid aspect-[4/5] w-full place-items-center overflow-hidden">
        <div className="grain-dark" />
        <Dumbbell size={46} className="relative text-surface/40" />
      </div>
    );
  }
  return (
    <img
      src={asset(`conditions/${slug}.jpg`)}
      alt={alt}
      className="aspect-[4/5] w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

function TrainCard({ slug, label }: { slug: string; label: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="group w-64 shrink-0 overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-[0_1px_2px_rgba(26,38,33,0.04),0_18px_40px_-30px_rgba(26,38,33,0.3)]">
      <div className="relative overflow-hidden">
        {broken ? (
          <div className="tile-placeholder relative grid aspect-[4/3] w-full place-items-center overflow-hidden px-4">
            <div className="grain-dark" />
            <span className="relative text-center font-display text-body font-medium leading-tight text-surface/90">{label}</span>
          </div>
        ) : (
          <img
            src={asset(`conditions/${slug}.jpg`)}
            alt={label}
            className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-5">
        <span className="font-display text-body font-medium text-ink">{label}</span>
        <Link
          to={`/physical-training/${slug}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-forest-50 px-3.5 py-2 text-fine font-semibold text-forest-700 transition hover:bg-forest-600 hover:text-surface"
        >
          See more <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/** Physical-training goal landing. `:goal` swaps the hero line; everything else stays identical. */
export function TrainingLanding() {
  const navigate = useNavigate();
  const { goal: goalParam } = useParams();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const goalKey = goalParam && GOALS[goalParam] ? goalParam : 'general-fitness';
  const goal = GOALS[goalKey] ?? DEFAULT_GOAL;
  const chips = goalChips.filter((c) => c.slug !== goalKey);

  const book = () =>
    navigate('/book', { state: { service: 'training', condition: 'first-workout', type: 'Personal training', amount: FROM_PRICE } });

  const CTA = ({ className }: { className?: string }) => (
    <button
      onClick={book}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-8 py-4 text-body font-semibold text-surface shadow-[0_16px_40px_-16px_rgba(199,107,65,0.95)] transition hover:bg-clay-600 active:scale-[0.98] ${className ?? ''}`}
    >
      Book a session
      <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );

  return (
    <div className="pb-4">
      {/* ── Announcement bar ── */}
      <div className="relative overflow-hidden border-b border-forest-900/40 bg-forest-800 text-surface">
        <div className="grain-dark" />
        <div className={`${SHELL} relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2.5 text-fine`}>
          <span className="inline-flex items-center gap-2 font-semibold"><Dumbbell size={15} className="text-butter" /> Home personal training in Bengaluru</span>
          <span className="hidden h-3.5 w-px bg-surface/25 sm:block" />
          <span className="inline-flex items-center gap-2 text-forest-50/90"><BadgeCheck size={15} className="text-butter" /> Certified &amp; vetted trainers</span>
          <span className="hidden h-3.5 w-px bg-surface/25 sm:block" />
          <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 font-semibold transition hover:text-butter"><Phone size={14} /> Talk to us</a>
        </div>
      </div>

      {/* ── 1 · Hero ── */}
      <section className="relative overflow-hidden border-b border-forest-900/40 bg-forest-800 text-surface">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -left-40 top-1/4 h-[30rem] w-[30rem] text-clay-500/20 glow" aria-hidden />
        <div className="pointer-events-none absolute -right-40 -top-24 h-[34rem] w-[34rem] text-forest-500/30 glow floaty" aria-hidden />
        <div className={`${SHELL} relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24`}>
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-surface/15 bg-surface/10 px-4 py-1.5 text-fine font-semibold text-forest-50">
              <Dumbbell size={16} className="text-butter" /> Bengaluru’s home personal training
            </span>
            <h1 className="mt-6 font-display text-heading font-medium leading-[1.02] tracking-tight text-surface sm:text-display lg:text-display">
              {goal.q} Get a trainer home in <span className="italic text-clay-300">2 hours.</span>
            </h1>
            <p className="mt-5 max-w-lg text-body leading-relaxed text-forest-50/80">
              Certified trainers build a plan around your goal and train you at home, no gym, no commute.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-fine font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><Clock size={17} className="text-butter" /> Arrives in ~2 hrs</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><BadgeCheck size={17} className="text-butter" /> Certified trainers</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><Star size={17} className="fill-butter text-butter" /> 4.8★</span>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <CTA />
              <a
                href={`tel:${PHONE}`}
                className="inline-flex items-center gap-2 rounded-full border border-surface/25 bg-surface/10 px-7 py-4 text-body font-semibold text-surface transition hover:border-surface/50 hover:bg-surface/15"
              >
                <Phone size={18} className="text-butter" /> Call us
              </a>
            </div>
            <div className="mt-3 text-fine font-medium text-forest-50/75">from ₹{FROM_PRICE} a session</div>
          </div>

          {/* framed art + floating chips */}
          <div className="animate-slide relative mx-auto w-full max-w-md lg:mr-0" style={{ animationDelay: '0.1s' }}>
            <div className="relative overflow-hidden rounded-[2.25rem] border border-surface/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
              <HeroImg slug={goalKey} alt={`Personal training for ${goal.g} at home`} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-900/25 to-transparent" />
            </div>
            <div className="floaty absolute -left-5 top-12 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-xl">
              <div className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">From</div>
              <div className="font-display text-title font-semibold text-forest-700">₹{FROM_PRICE}<span className="text-fine font-medium text-ink-soft"> / session</span></div>
            </div>
            <div className="absolute -bottom-5 right-3 flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 shadow-xl">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-50 text-forest-600"><BadgeCheck size={18} /></span>
              <div className="text-fine font-semibold leading-tight text-ink">Certified<br />trainer</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · How we work ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">How we work</h2>
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

      {/* ── 3 · Stats band ── */}
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

      {/* ── 4 · Home training vs the gym ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">Home training vs the gym</h2>
        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_2px_rgba(26,38,33,0.04),0_22px_46px_-34px_rgba(26,38,33,0.3)]">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr] items-center gap-4 border-b border-line bg-forest-50/50 px-6 py-4 sm:grid lg:px-8">
            <span className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">Compare</span>
            <span className="flex items-center gap-2 font-display text-body font-semibold text-forest-700"><BadgeCheck size={18} /> Kine home training</span>
            <span className="font-display text-body font-medium text-ink-soft">Typical gym</span>
          </div>
          {compare.map((row, i) => (
            <div key={row.k} className={`grid grid-cols-1 gap-2 border-t border-line px-6 py-4 sm:grid-cols-[1.1fr_1fr_1fr] sm:items-center sm:gap-4 sm:border-t-0 lg:px-8 ${i % 2 ? 'sm:bg-canvas/40' : ''}`}>
              <span className="font-display text-body font-semibold text-ink sm:font-sans sm:text-fine">{row.k}</span>
              <span className="flex items-center gap-2 text-fine text-ink"><Check size={17} className="shrink-0 text-forest-600" /> {row.home}</span>
              <span className="flex items-center gap-2 text-fine text-ink-soft"><X size={17} className="shrink-0 text-clay-400" /> {row.gym}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5 · We also train for (marquee cards) ── */}
      <section className="relative mt-20 overflow-hidden border-y border-line bg-surface/60 py-16 lg:mt-28 lg:py-20">
        <div className={SHELL}>
          <h2 className="font-display text-heading font-medium tracking-tight text-ink">We also train for:</h2>
        </div>
        <div
          className="mt-10 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
          }}
        >
          <div className="animate-marquee flex w-max gap-6 px-6">
            {[...chips, ...chips].map((c, idx) => (
              <TrainCard key={idx} slug={c.slug} label={c.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 · Results ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-forest-100 bg-forest-50/60 p-8 lg:p-14">
          <div className="grain-light" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 text-clay-500/12 glow" aria-hidden />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-heading font-medium tracking-tight text-ink">Results</h2>
              <span className="inline-flex items-center gap-2 text-fine font-semibold text-forest-700">
                <TrendingUp size={18} className="text-forest-600" /> Real progress, trained at home
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

      {/* ── 7 · Pricing (per-session price TBD) ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">Pay per session, no lock-in</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col justify-center rounded-[2rem] bg-gradient-to-br from-forest-700 to-forest-900 p-8 text-surface lg:p-10">
            <span className="text-fine font-semibold uppercase tracking-[0.14em] text-butter">A session</span>
            <div className="mt-3 font-display text-display font-semibold">from ₹{FROM_PRICE}</div>
            <p className="mt-2 text-body text-forest-50/80">No packages forced. Pay per session, continue only if you want to.</p>
          </div>
          <div className="rounded-[2rem] border border-line bg-surface p-8 lg:p-10">
            <span className="text-fine font-semibold uppercase tracking-[0.14em] text-ink-soft">What’s included</span>
            <ul className="mt-6 space-y-4">
              {included.map((t) => (
                <li key={t} className="flex items-start gap-3 text-body text-ink">
                  <Check size={20} className="mt-0.5 shrink-0 text-forest-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 8 · No-lock-in promise ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-clay-100 bg-clay-50/60 p-8 lg:p-14">
          <div className="grain-light" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface text-clay-600 ring-1 ring-clay-100"><HeartHandshake size={26} strokeWidth={1.7} /></span>
            <div>
              <h2 className="font-display text-heading font-medium tracking-tight text-ink">One session at a time. You decide after.</h2>
              <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-soft">
                Book a single session with no package and no commitment. If it’s not for you, you don’t continue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9 · FAQ ── */}
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

      {/* ── 10 · Final CTA ── */}
      <section className="relative mt-20 overflow-hidden bg-forest-800 py-16 text-surface lg:mt-28 lg:py-24">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 text-clay-500/20 glow floaty" aria-hidden />
        <div className={`${SHELL} relative flex flex-col items-center gap-5 text-center`}>
          <h2 className="max-w-2xl font-display text-heading font-medium tracking-tight lg:text-display">Ready when you are</h2>
          <p className="max-w-md text-body text-forest-50/80">A certified trainer at your door in about 2 hours. From ₹{FROM_PRICE} a session, no lock-in.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTA />
            <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 rounded-full border border-surface/25 px-7 py-4 text-body font-semibold text-surface transition hover:border-surface/60 hover:bg-surface/5">
              <Phone size={18} /> Call us
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-fine font-medium text-forest-50/85">
            <span className="inline-flex items-center gap-2"><Clock size={16} className="text-butter" /> Arrives in ~2 hrs</span>
            <span className="hidden h-3.5 w-px bg-surface/25 sm:block" />
            <span className="inline-flex items-center gap-2"><HomeIcon size={16} className="text-butter" /> No gym, no commute</span>
          </div>
        </div>
      </section>
    </div>
  );
}
