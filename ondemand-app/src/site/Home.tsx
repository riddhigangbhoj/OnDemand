import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, ChevronRight, CalendarClock } from 'lucide-react';
import { useStore } from '../store/store';
import { cardBySlug } from '../store/catalog';
import { fmtDay, fmtTime } from '../store/clock';
import { Pill } from '../shared/ui';
import { asset } from '../shared/asset';

/** Loads /conditions/<slug>.jpg; falls back to a clean placeholder tile until the photo exists. */
function CondImg({ slug, alt }: { slug: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="grid h-full w-full place-items-center bg-paper-2">
        <ImageIcon size={18} className="text-ink/30" />
      </div>
    );
  }
  return (
    <img
      src={asset(`conditions/${slug}.jpg`)}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

const services = [
  {
    to: '/physiotherapy',
    title: 'Physiotherapy',
    body: 'Get instant pain relief at home.',
    accent: 'text-pine-700',
    btn: 'bg-pine-600 hover:bg-pine-700',
    items: [
      { slug: 'back-pain', label: 'Back pain' },
      { slug: 'neck-desk', label: 'Neck pain' },
      { slug: 'knee-pain', label: 'Knee pain' },
      { slug: 'shoulder-pain', label: 'Shoulder' },
    ],
  },
  {
    to: '/physical-training',
    title: 'Physical Training',
    body: 'Get instant guided home exercise.',
    accent: 'text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
    items: [
      { slug: 'form-check', label: 'Form check' },
      { slug: 'mobility-screen', label: 'Mobility exercise' },
      { slug: 'stretch-routine', label: 'Stretching exercise' },
      { slug: 'bodyweight', label: 'Bodyweight exercise' },
    ],
  },
];

const treats = [
  {
    to: '/physiotherapy/back-pain',
    slug: 'back-pain',
    title: 'Long-sitting back pain',
    body: 'Desk-bound all day? A physio eases the ache and fixes your setup, same day at home.',
  },
  {
    to: '/physical-training/form-check',
    slug: 'form-check',
    title: 'At-home form correction',
    body: 'A trainer watches your lifts and corrects your form in your own space, today.',
  },
  {
    to: '/physiotherapy/sports-injury',
    slug: 'sports-injury',
    title: 'Sports injury',
    body: 'Sprain, strain or a tweak from play, assessed and treated at home the same day.',
  },
];

export function Home() {
  const { state } = useStore();
  const upcoming = state.cookieCustomerId
    ? state.bookings
        .filter((b) => b.customerId === state.cookieCustomerId && b.status !== 'cancelled' && b.status !== 'completed')
        .sort((a, b) => a.scheduledAt - b.scheduledAt)[0]
    : undefined;

  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden bg-pine-700 text-white">
        <div className="pointer-events-none absolute -right-24 -top-28 hidden h-80 w-80 rounded-full bg-pine-500/40 blur-3xl lg:block" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 hidden h-72 w-72 rounded-full bg-blue-600/20 blur-3xl lg:block" aria-hidden />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-24">
          <h1 className="max-w-2xl font-display text-[1.7rem] font-semibold leading-[1.12] sm:text-[2.1rem] lg:max-w-6xl lg:text-[4.25rem] lg:leading-[1.02] xl:text-[4.9rem]">
            Get a physio or fitness trainer at your home in Bengaluru.{' '}
            <span className="text-orange-100">Same day.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] font-medium leading-relaxed text-white sm:text-[16px] lg:mt-7 lg:max-w-2xl lg:text-[27px]">
            Book one visit. Starts from ₹499 per session.
          </p>
        </div>
      </section>

      {/* upcoming booking */}
      {upcoming && (
        <section className="mx-auto w-full max-w-7xl px-5 pt-6 lg:px-8">
          <Link to="/account" className="flex items-center justify-between gap-4 rounded-3xl border border-ink bg-white p-5 transition hover:border-pine-300">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pine-50 text-pine-600"><CalendarClock size={22} /></span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-pine-700 lg:text-[26px]">Your upcoming session</div>
                <div className="mt-0.5 truncate font-display text-lg font-semibold text-ink lg:text-2xl">{cardBySlug(upcoming.condition)?.label ?? upcoming.type}</div>
                <div className="text-[13px] text-ink lg:text-[26px]">{fmtDay(upcoming.scheduledAt)} · {fmtTime(upcoming.scheduledAt)}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Pill tone="pine">Confirmed</Pill>
              <ChevronRight size={18} className="text-ink" />
            </div>
          </Link>
        </section>
      )}

      {/* choose service type */}
      <section className="mx-auto w-full max-w-7xl px-5 pt-8 lg:px-8">
        <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl lg:text-[2.6rem]">Choose service type</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:mt-7 lg:gap-6">
          {services.map((s) => (
            <div key={s.to} className="rounded-3xl border border-ink bg-white p-5 sm:p-6 lg:p-7">
              <div className={`font-display text-xl font-semibold lg:text-[1.9rem] ${s.accent}`}>{s.title}</div>
              <div className="mt-1 text-[14px] font-medium text-ink lg:mt-2 lg:text-[26px]">{s.body}</div>

              {/* one-row grid of condition photos */}
              <div className="mt-4 grid grid-cols-4 gap-2.5 lg:mt-5 lg:gap-3">
                {s.items.map((it) => (
                  <Link key={it.slug} to={`${s.to}/${it.slug}`} className="group">
                    <div className="aspect-square overflow-hidden rounded-xl border border-ink transition group-hover:brightness-95">
                      <CondImg slug={it.slug} alt={it.label} />
                    </div>
                    <div className="mt-2 text-center text-[13px] font-bold leading-tight text-ink lg:mt-2.5 lg:min-h-[2.5em] lg:text-[26px]">{it.label}</div>
                  </Link>
                ))}
              </div>

              <Link to={s.to} className={`mt-5 flex w-full items-center justify-center rounded-2xl px-5 py-3 text-[14px] font-bold text-white transition lg:mt-7 lg:py-4 lg:text-[26px] ${s.btn}`}>
                Book &amp; see all conditions
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* what we treat */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-5 pt-8 lg:px-8">
          <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl lg:text-[2.6rem]">What we treat</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:mt-7 lg:gap-5">
            {treats.map((t) => (
              <Link key={t.to} to={t.to} className="group flex flex-col rounded-3xl border border-ink bg-white p-4 transition hover:border-pine-300 lg:p-5">
                <div className="font-display text-xl font-semibold text-ink lg:min-h-[2.4em] lg:text-[1.9rem] lg:leading-[1.15]">{t.title}</div>
                <div className="mt-3 overflow-hidden rounded-2xl border border-ink">
                  <div className="aspect-[5/4]">
                    <CondImg slug={t.slug} alt={t.title} />
                  </div>
                </div>
                <p className="mt-3 flex-1 text-[14px] font-medium leading-relaxed text-ink lg:mt-4 lg:text-[26px]">{t.body}</p>
                <span className="mt-4 inline-flex w-fit items-center justify-center rounded-xl bg-orange-500 px-5 py-2.5 text-[13.5px] font-bold text-white transition group-hover:bg-orange-600 lg:mt-5 lg:px-6 lg:py-3.5 lg:text-[26px]">
                  Book today
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <span className="font-display text-[15px] font-bold text-ink lg:text-[26px]">and many more</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-6xl px-5 pt-8 pb-4 lg:px-8 lg:pt-16">
        <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl lg:text-[2.6rem]">People also ask</h2>
        <div className="mt-5 grid gap-3 lg:mt-8 lg:grid-cols-2 lg:gap-5">
          {[
            { q: 'How soon can someone come?', a: 'Same day. Book now and we confirm your professional and time on WhatsApp.' },
            { q: 'Who visits me?', a: 'A licensed, background-checked physio or trainer, verified before their first visit.' },
            { q: 'What does it cost?', a: 'A flat, prepaid price per home session — from ₹499. No packages, no commitment.' },
            { q: 'Can I reschedule or cancel?', a: 'Yes, reach us on WhatsApp any time and we’ll sort it out for you.' },
          ].map((f) => (
            <div key={f.q} className="rounded-2xl border-l-4 border-l-pine-600 border-y border-r border-ink bg-white p-5 lg:p-7">
              <div className="text-[15px] font-bold text-pine-700 lg:text-[26px]">{f.q}</div>
              <div className="mt-1 text-[14px] leading-relaxed text-ink lg:mt-2 lg:text-[26px]">{f.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
