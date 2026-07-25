import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Clock, Home as HomeIcon } from 'lucide-react';
import { cardBySlug, conditionBySlug, PRICE, SERVICE_META, SYMPTOMS, BENEFITS } from '../store/catalog';
import { Button, Modal } from '../shared/ui';
import { asset } from '../shared/asset';
import { useStore } from '../store/store';
import { LoginProfile } from './LoginProfile';

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
  const img = cardBySlug(c.slug)?.img ?? '/back-pain.jpg';
  const oneLiner = isTraining
    ? 'Get an at-home guided training session for your goals.'
    : 'Get an at-home guided physiotherapy session for your pain.';
  const book = () => navigate('/book', { state: { service: c.service, condition: c.slug, type: c.type } });

  const faqs = [
    { q: 'How soon can someone come?', a: 'Same day. Book now and we confirm your professional and time on WhatsApp.' },
    { q: 'Who visits me?', a: 'A licensed, background-checked professional, verified before their first visit.' },
    { q: 'What does it cost?', a: `Flat ₹${price.toLocaleString('en-IN')}, prepaid, for one home session. No packages.` },
    { q: 'Can I reschedule or cancel?', a: 'Yes, reach us on WhatsApp any time and we will sort it out for you.' },
  ];

  const trust = [
    { i: HomeIcon, t: 'At your home' },
    { i: Clock, t: 'Same-day, 8am to 8pm' },
    { i: ShieldCheck, t: 'Verified professional' },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-16">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink lg:text-[26px]">
        <Link to={`/${meta.path}`} className="hover:text-ink">{meta.title}</Link>
        <ChevronRight size={13} className="lg:h-6 lg:w-6" />
        <span className="text-ink">{heading}</span>
      </nav>

      {/* hero — text + picture */}
      <div className="mt-6 grid gap-8 lg:mt-10 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] text-ink sm:text-[2.75rem] lg:text-[3.6rem]">
            {heading}
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink sm:text-[17px] lg:mt-5 lg:text-[26px]">{oneLiner}</p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 lg:mt-8">
            {trust.map((r) => (
              <span key={r.t} className="flex items-center gap-2 text-[14px] font-medium text-ink lg:text-[22px]">
                <r.i size={18} className="text-pine-600 lg:h-7 lg:w-7" /> {r.t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-baseline gap-2 lg:mt-8">
            <span className="font-display text-4xl font-semibold text-ink lg:text-[3.4rem]">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-sm text-ink lg:text-[26px]">/ session</span>
          </div>
          <Button className="mt-5 w-full py-3.5 text-base sm:w-auto sm:px-12 lg:mt-6 lg:py-5 lg:text-[26px]" onClick={book}>Book this session</Button>
        </div>

        {/* picture block */}
        <div className="overflow-hidden rounded-3xl border border-ink">
          <img src={asset(img)} alt={heading} className="aspect-[4/3] w-full object-cover lg:aspect-square" />
        </div>
      </div>

      {/* you might have noticed */}
      {symptoms && (
        <div className="grain mt-10 rounded-3xl border-2 border-pine-200 bg-pine-50 p-6 lg:mt-16 lg:p-10">
          <h2 className="font-display text-xl font-semibold text-pine-700 lg:text-[2.4rem]">You might have noticed</h2>
          <ol className="mt-4 space-y-4 lg:mt-7 lg:space-y-6">
            {symptoms.map((s, i) => (
              <li key={s} className="flex items-start gap-3 text-[15px] leading-snug text-ink lg:gap-5 lg:text-[26px] lg:leading-snug">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pine-600 text-[14px] font-bold text-white lg:h-14 lg:w-14 lg:text-[26px]">{i + 1}</span>
                <span className="pt-0.5 lg:pt-2.5">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {benefits && (
        <div className="grain mt-10 rounded-3xl border-2 border-blue-100 bg-blue-50 p-6 lg:mt-16 lg:p-10">
          <h2 className="font-display text-xl font-semibold text-blue-700 lg:text-[2.4rem]">What you’ll get</h2>
          <ol className="mt-4 space-y-4 lg:mt-7 lg:space-y-6">
            {benefits.map((b, i) => (
              <li key={b} className="flex items-start gap-3 text-[15px] leading-snug text-ink lg:gap-5 lg:text-[26px] lg:leading-snug">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-[14px] font-bold text-white lg:h-14 lg:w-14 lg:text-[26px]">{i + 1}</span>
                <span className="pt-0.5 lg:pt-2.5">{b}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-10 lg:mt-16">
        <h2 className="font-display text-xl font-semibold text-ink lg:text-[2.4rem]">People also ask</h2>
        <div className="mt-4 space-y-3 lg:mt-7 lg:space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border-l-4 border-l-pine-600 border-y border-r border-ink bg-white p-5 lg:p-7">
              <div className="text-[15px] font-bold text-pine-700 lg:text-[26px]">{f.q}</div>
              <div className="mt-1 text-[14px] leading-relaxed text-ink lg:mt-2 lg:text-[26px]">{f.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* final CTA */}
      <div className="grain-light mt-10 flex flex-col gap-4 overflow-hidden rounded-3xl bg-pine-700 p-6 text-white lg:mt-16 lg:p-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-2xl font-semibold lg:text-[2.6rem]">Ready when you are</div>
          <div className="mt-1 text-[14px] text-white/90 lg:mt-2 lg:text-[26px]">Flat ₹{price.toLocaleString('en-IN')}, at your home, same day.</div>
        </div>
        <button onClick={book} className="w-full rounded-xl bg-white px-5 py-3.5 text-base font-bold text-pine-700 transition hover:bg-pine-100 active:scale-[0.98] sm:w-auto sm:px-12 lg:py-5 lg:text-[26px]">Book this session</button>
      </div>

      {!loggedIn && (
        <Modal open={showLogin} onClose={() => setShowLogin(false)}>
          <LoginProfile heading="Login to continue" sub="Book a same-day home visit in a minute." cta="Continue" onDone={() => setShowLogin(false)} />
        </Modal>
      )}
    </div>
  );
}
