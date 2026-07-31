import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Clock, Home as HomeIcon, ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import { cardBySlug, conditionBySlug, PRICE, SERVICE_META, SYMPTOMS, BENEFITS } from '../store/catalog';
import { Button, Modal } from '../shared/ui';
import { asset } from '../shared/asset';
import { useStore } from '../store/store';
import { LoginProfile } from './LoginProfile';

function HeroImg({ slug, alt }: { slug: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="tile-placeholder relative grid aspect-[4/3] w-full place-items-center overflow-hidden lg:aspect-square">
        <div className="grain-dark" />
        <ImageIcon size={40} className="relative text-surface/40" />
      </div>
    );
  }
  return (
    <img
      src={asset(`conditions/${slug}.jpg`)}
      alt={alt}
      className="aspect-[4/3] w-full object-cover lg:aspect-square"
      onError={() => setBroken(true)}
    />
  );
}

export function Occasion() {
  const { condition } = useParams();
  const navigate = useNavigate();
  const { state } = useStore();
  const c = condition ? conditionBySlug(condition) : undefined;

  const loggedIn = !!state.cookieCustomerId;
  const [showLogin, setShowLogin] = useState(false);
  // Ad traffic lands here directly — nudge a login after a few seconds.
  useEffect(() => {
    if (loggedIn) return;
    const t = setTimeout(() => setShowLogin(true), 3000);
    return () => clearTimeout(t);
  }, [loggedIn]);

  if (!c) return <Navigate to="/" replace />;

  const isTraining = c.service === 'training';
  const price = PRICE[c.service];
  const meta = SERVICE_META[c.service];
  const symptoms = SYMPTOMS[c.slug];
  const benefits = BENEFITS[c.slug];
  const heading = cardBySlug(c.slug)?.label ?? c.label;
  const slug = c.slug;
  const oneLiner = isTraining
    ? 'A guided, at-home training session built around your goals and your space.'
    : 'A hands-on, at-home physiotherapy session to ease your pain and get you moving.';
  const book = () => navigate('/book', { state: { service: c.service, condition: c.slug, type: c.type } });

  const faqs = [
    { q: 'How soon can someone come?', a: 'Same day. Book now and we confirm your professional and time on WhatsApp.' },
    { q: 'Who visits me?', a: 'A licensed, background-checked professional, verified before their first visit.' },
    { q: 'What does it cost?', a: `Flat ₹${price.toLocaleString('en-IN')}, prepaid, for one home session. No packages.` },
    { q: 'Can I reschedule or cancel?', a: 'Yes — reach us on WhatsApp any time and we will sort it out for you.' },
  ];

  const trustRow = [
    { i: HomeIcon, t: 'At your home' },
    { i: Clock, t: 'Same-day, 8am–8pm' },
    { i: ShieldCheck, t: 'Verified professional' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16">
      <nav className="flex items-center gap-2 text-fine font-medium text-ink-soft">
        <Link to={`/${meta.path}`} className="transition hover:text-ink">{meta.title}</Link>
        <ChevronRight size={14} />
        <span className="text-ink">{heading}</span>
      </nav>

      {/* hero */}
      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="animate-rise">
          <h1 className="font-display text-heading font-medium leading-[1.02] tracking-tight text-ink sm:text-display lg:text-display">
            {heading}
          </h1>
          <p className="mt-5 max-w-md text-body leading-relaxed text-ink-soft">{oneLiner}</p>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {trustRow.map((r) => (
              <span key={r.t} className="flex items-center gap-2 text-fine font-medium text-ink">
                <r.i size={17} className="text-forest-600" /> {r.t}
              </span>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-heading font-semibold text-ink">₹{price.toLocaleString('en-IN')}</span>
              <span className="text-body text-ink-soft">/ session</span>
            </div>
            <Button variant="clay" className="px-9 py-3.5" onClick={book}>
              Book this session <ArrowUpRight size={18} />
            </Button>
          </div>
        </div>

        <div className="animate-slide overflow-hidden rounded-[2rem] border border-line shadow-[0_28px_60px_-36px_rgba(26,38,33,0.5)]" style={{ animationDelay: '0.1s' }}>
          <HeroImg slug={slug} alt={heading} />
        </div>
      </div>

      {/* symptoms */}
      {symptoms && (
        <div className="relative mt-16 overflow-hidden rounded-[2rem] border border-forest-100 bg-forest-50/70 p-8 lg:mt-20 lg:p-12">
          <div className="grain-light" />
          <div className="relative">
            <h2 className="font-display text-title font-medium text-ink lg:text-heading">You might have noticed</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2">
              {symptoms.map((s, i) => (
                <li key={s} className="flex items-start gap-4 text-body leading-snug text-ink">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-600 font-display text-body font-semibold text-surface">{i + 1}</span>
                  <span className="pt-1">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* benefits */}
      {benefits && (
        <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-clay-100 bg-clay-50/70 p-8 lg:p-12">
          <div className="grain-light" />
          <div className="relative">
            <h2 className="font-display text-title font-medium text-ink lg:text-heading">What you’ll get</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2">
              {benefits.map((b, i) => (
                <li key={b} className="flex items-start gap-4 text-body leading-snug text-ink">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-clay-500 font-display text-body font-semibold text-surface">{i + 1}</span>
                  <span className="pt-1">{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-16 lg:mt-20">
        <h2 className="font-display text-title font-medium text-ink lg:text-heading">People also ask</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-3xl border border-line bg-surface p-7 transition hover:border-forest-200">
              <div className="font-display text-title font-medium text-ink">{f.q}</div>
              <div className="mt-2 text-body leading-relaxed text-ink-soft">{f.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* final CTA */}
      <div className="relative mt-16 flex flex-col gap-6 overflow-hidden rounded-[2rem] bg-forest-800 p-8 text-surface lg:mt-20 lg:flex-row lg:items-center lg:justify-between lg:p-14">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 text-clay-500/20 glow" aria-hidden />
        <div className="relative">
          <div className="font-display text-title font-medium lg:text-heading">Ready when you are</div>
          <div className="mt-2 text-body text-forest-50/75">Flat ₹{price.toLocaleString('en-IN')}, at your home, the same day.</div>
        </div>
        <button
          onClick={book}
          className="relative inline-flex items-center justify-center gap-2 rounded-full bg-surface px-9 py-4 text-body font-semibold text-forest-800 transition hover:bg-clay-50 active:scale-[0.98]"
        >
          Book this session <ArrowUpRight size={18} />
        </button>
      </div>

      {!loggedIn && (
        <Modal open={showLogin} onClose={() => setShowLogin(false)}>
          <LoginProfile heading="Log in to continue" sub="Book a same-day home visit in a minute." cta="Continue" onDone={() => setShowLogin(false)} />
        </Modal>
      )}
    </div>
  );
}
