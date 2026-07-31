import { useState } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import {
  Star, Clock, Users, ThumbsUp, Quote, ChevronDown, ArrowRight, ArrowUpRight,
  Image as ImageIcon, BadgeCheck, ShieldCheck, Check, X,
  Phone, Stethoscope, CalendarCheck, FileText,
} from 'lucide-react';
import { asset } from '../shared/asset';
import { conditionBySlug, cardBySlug } from '../store/catalog';

const FROM_PRICE = 499;
const PHONE = '+918047181299';
const SHELL = 'mx-auto w-full px-6 lg:px-12';

// How we work, booking flow + verification, in steps.
const flow = [
  { i: CalendarCheck, t: 'Book in 2 minutes', d: 'Pick a slot that suits you and confirm.' },
  { i: ShieldCheck, t: 'A verified physio comes to you', d: 'Licensed (BPT/MPT) and background-checked.' },
  { i: Stethoscope, t: 'A quick assessment before your session', d: 'A short diagnosis first, then treatment begins.' },
  { i: FileText, t: 'A clear report after every visit', d: 'A simple summary of your session.' },
];

const metrics = [
  { i: Users, v: '1,000+', l: 'Home visits delivered' },
  { i: ThumbsUp, v: '98%', l: 'Would recommend us' },
  { i: Star, v: '4.8★', l: 'Average visit rating' },
  { i: Clock, v: '2 hrs', l: 'Average arrival time' },
];

// Home visit vs the clinic, the value comparison.
const compare = [
  { k: 'Getting there', home: 'The physio comes to you', clinic: 'You commute in pain' },
  { k: 'Waiting', home: 'Your chosen time slot', clinic: 'Queues and delays' },
  { k: 'The session', home: 'Full 1-on-1, in your space', clinic: 'Shared and often rushed' },
  { k: 'Commitment', home: 'One visit, no package', clinic: 'Upfront package pressure' },
];

// Other physiotherapy conditions shown in the marquee (current one filtered out per page).
const alsoTreat = [
  { slug: 'back-pain', label: 'Back pain' },
  { slug: 'knee-pain', label: 'Knee pain' },
  { slug: 'neck-desk', label: 'Neck & cervical' },
  { slug: 'sciatica-flare', label: 'Sciatica' },
  { slug: 'shoulder-pain', label: 'Shoulder pain' },
  { slug: 'disc-pain', label: 'Disc-related pain' },
  { slug: 'sports-injury', label: 'Sports injury' },
  { slug: 'ankle-sprain', label: 'Ankle pain' },
  { slug: 'elbow', label: 'Elbow pain' },
  { slug: 'wrist-typing', label: 'Wrist pain' },
];

// PLACEHOLDER COPY, sample single-session stories, replace before launch.
const testimonials = [
  { q: 'I pulled my back lifting a suitcase and needed help fast. A physio came within two hours, one session and I could stand straight again.', a: 'Placeholder · quick help, same day' },
  { q: 'My regular therapist was travelling, so I just booked a slot to tide me over. A single home visit gave me exactly what I needed, no strings.', a: 'Placeholder · one-off booking' },
  { q: 'Just a stiff shoulder from sleeping wrong. Booked one session and the physio sorted it out right there.', a: 'Placeholder · minor issue, one visit' },
];

const faqs = [
  { q: 'How soon can a physio come?', a: 'In most areas a physio reaches you within about 2 hours.' },
  { q: 'What happens in the first visit?', a: 'A qualified physio assesses your condition, explains what’s causing the pain, and starts your session. Home visits start from ₹499.' },
  { q: 'Are your physios actually qualified?', a: 'Yes, licensed physiotherapists (BPT/MPT), background-verified, and trained for home visits. Every one is rated by patients after each visit.' },
  { q: 'Is it safe to have someone come to my home?', a: 'We share the physio’s name and verification details before they arrive, so you know who’s coming. Every physio is background-checked and rated.' },
  { q: 'Do I have to buy a package?', a: 'No. You start with a single home visit from ₹499.' },
  { q: 'Can I book for my parent or someone else?', a: 'Yes, you can book on behalf of a family member. Just add their details and address.' },
];

function HeroImg({ slug, alt }: { slug: string; alt: string }) {
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
      src={asset(`conditions/${slug}.jpg`)}
      alt={alt}
      className="aspect-[4/5] w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

function TreatCard({ slug, label }: { slug: string; label: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="group w-64 shrink-0 overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-[0_1px_2px_rgba(26,38,33,0.04),0_18px_40px_-30px_rgba(26,38,33,0.3)]">
      <div className="relative overflow-hidden">
        {broken ? (
          <div className="tile-placeholder relative grid aspect-[4/3] w-full place-items-center overflow-hidden">
            <div className="grain-dark" />
            <span className="relative font-display text-body font-medium text-surface/90">{label}</span>
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
          to={`/physiotherapy/${slug}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-forest-50 px-3.5 py-2 text-fine font-semibold text-forest-700 transition hover:bg-forest-600 hover:text-surface"
        >
          See more <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/** One shared landing layout for every physiotherapy condition — the slug swaps the title, image and booking target; everything else stays identical. */
export function ConditionLanding() {
  const navigate = useNavigate();
  const { condition } = useParams();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cond = condition ? conditionBySlug(condition) : undefined;
  if (!cond || cond.service !== 'physiotherapy') return <Navigate to="/physiotherapy" replace />;

  const slug = cond.slug;
  const label = cardBySlug(slug)?.label ?? cond.label;
  const others = alsoTreat.filter((c) => c.slug !== slug);

  const book = () =>
    navigate('/book', { state: { service: 'physiotherapy', condition: slug, type: cond.type, amount: FROM_PRICE } });

  const CTA = ({ className }: { className?: string }) => (
    <button
      onClick={book}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-clay-500 px-8 py-4 text-body font-semibold text-surface shadow-[0_16px_40px_-16px_rgba(199,107,65,0.95)] transition hover:bg-clay-600 active:scale-[0.98] ${className ?? ''}`}
    >
      Book a home visit
      <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );

  return (
    <div className="pb-4">
      {/* ── Announcement bar (full-bleed) ── */}
      <div className="relative overflow-hidden border-b border-forest-900/40 bg-forest-800 text-surface">
        <div className="grain-dark" />
        <div className={`${SHELL} relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2.5 text-fine`}>
          <span className="inline-flex items-center gap-2 font-semibold"><Clock size={15} className="text-butter" /> Same-day slots open in Bengaluru</span>
          <span className="hidden h-3.5 w-px bg-surface/25 sm:block" />
          <span className="inline-flex items-center gap-2 text-forest-50/90"><BadgeCheck size={15} className="text-butter" /> Licensed physios · BPT / MPT</span>
          <span className="hidden h-3.5 w-px bg-surface/25 sm:block" />
          <span className="inline-flex items-center gap-2 text-forest-50/90"><ShieldCheck size={15} className="text-butter" /> Background-verified</span>
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
              <BadgeCheck size={16} className="text-butter" /> Bengaluru’s home physiotherapy service
            </span>
            <h1 className="mt-6 font-display text-heading font-medium leading-[1.02] tracking-tight text-surface sm:text-display lg:text-display">
              {label}? Get a physio home in <span className="italic text-clay-300">2 hours.</span>
            </h1>
            <p className="mt-5 max-w-lg text-body leading-relaxed text-forest-50/80">
              Expert physiotherapy for {label.toLowerCase()}, in the comfort of your home.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-fine font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><Clock size={17} className="text-butter" /> Arrives in ~2 hours</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-surface"><ShieldCheck size={17} className="text-butter" /> Verified physios</span>
            </div>
            <div className="mt-10">
              <CTA />
              <div className="mt-3 text-fine font-medium text-forest-50/75">from ₹{FROM_PRICE}</div>
            </div>
          </div>

          {/* framed art + floating credential badges */}
          <div className="animate-slide relative mx-auto w-full max-w-md lg:mr-0" style={{ animationDelay: '0.1s' }}>
            <div className="relative overflow-hidden rounded-[2.25rem] border border-surface/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
              <HeroImg slug={slug} alt={`Physiotherapy for ${label} at home`} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-900/25 to-transparent" />
            </div>
            <div className="floaty absolute -left-5 top-12 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-xl">
              <div className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">From</div>
              <div className="font-display text-title font-semibold text-forest-700">₹{FROM_PRICE}<span className="text-fine font-medium text-ink-soft"> / visit</span></div>
            </div>
            <div className="absolute -bottom-5 right-3 flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 shadow-xl">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-50 text-forest-600"><BadgeCheck size={18} /></span>
              <div className="text-fine font-semibold leading-tight text-ink">Verified<br />physio</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · How we work ── */}
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
      </section>

      {/* ── 5 · Metrics band ── */}
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

      {/* ── 6 · Home visit vs clinic ── */}
      <section className={`${SHELL} pt-20 lg:pt-28`}>
        <h2 className="font-display text-heading font-medium tracking-tight text-ink">Home visit vs the clinic</h2>
        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_2px_rgba(26,38,33,0.04),0_22px_46px_-34px_rgba(26,38,33,0.3)]">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr] items-center gap-4 border-b border-line bg-forest-50/50 px-6 py-4 sm:grid lg:px-8">
            <span className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">Compare</span>
            <span className="flex items-center gap-2 font-display text-body font-semibold text-forest-700"><BadgeCheck size={18} /> Kine home visit</span>
            <span className="font-display text-body font-medium text-ink-soft">Typical clinic</span>
          </div>
          {compare.map((row, i) => (
            <div key={row.k} className={`grid grid-cols-1 gap-2 border-t border-line px-6 py-4 sm:grid-cols-[1.1fr_1fr_1fr] sm:items-center sm:gap-4 sm:border-t-0 lg:px-8 ${i % 2 ? 'sm:bg-canvas/40' : ''}`}>
              <span className="font-display text-body font-semibold text-ink sm:font-sans sm:text-fine">{row.k}</span>
              <span className="flex items-center gap-2 text-fine text-ink"><Check size={17} className="shrink-0 text-forest-600" /> {row.home}</span>
              <span className="flex items-center gap-2 text-fine text-ink-soft"><X size={17} className="shrink-0 text-clay-400" /> {row.clinic}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7 · We also treat (marquee) ── */}
      <section className="relative mt-20 overflow-hidden border-y border-line bg-surface/60 py-16 lg:mt-28 lg:py-20">
        <div className={SHELL}>
          <h2 className="font-display text-heading font-medium tracking-tight text-ink">See what all conditions we treat</h2>
        </div>
        <div
          className="mt-10 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
          }}
        >
          <div className="animate-marquee flex w-max gap-6 px-6">
            {[...others, ...others].map((c, idx) => (
              <TreatCard key={idx} slug={c.slug} label={c.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 · Results (highlighted) ── */}
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
              {testimonials.map((t) => (
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

      {/* ── 12 · FAQ ── */}
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

      {/* ── 13 · Final CTA (full-bleed) ── */}
      <section className="relative mt-20 overflow-hidden bg-forest-800 py-16 text-surface lg:mt-28 lg:py-24">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 text-clay-500/20 glow floaty" aria-hidden />
        <div className={`${SHELL} relative flex flex-col items-center gap-6 text-center`}>
          <h2 className="max-w-2xl font-display text-heading font-medium tracking-tight lg:text-display">Ready when you are</h2>
          <p className="max-w-md text-body text-forest-50/80">A verified physio at your door in about 2 hours. From ₹{FROM_PRICE}, one visit, no packages.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTA />
            <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 rounded-full border border-surface/25 px-7 py-4 text-body font-semibold text-surface transition hover:border-surface/60 hover:bg-surface/5">
              <Phone size={18} /> Call us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
