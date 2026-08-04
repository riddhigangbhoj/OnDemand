import { Phone } from 'lucide-react';

const faqs = [
  { q: 'When will my session be confirmed?', a: 'After payment your booking is placed. Our ops team and the assigned physiotherapist each confirm it — you get a WhatsApp message the moment both are done.' },
  { q: 'Can I book for today?', a: 'Same-day isn’t available yet. The earliest slot is tomorrow. Tapping today lets us know you needed it sooner.' },
  { q: 'How do I know the right person arrived?', a: 'You’ll get a 6-digit code on WhatsApp when your session starts. Share it with the professional at your door.' },
  { q: 'What are the working hours?', a: 'Sessions run from 8:00am to 8:00pm. Book late at night and the next morning starts from 12:00pm.' },
  { q: 'How do refunds work?', a: 'If a session is cancelled, a refund follows per our terms. Reach out on WhatsApp and ops will help.' },
];

export function Help() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:py-20">
      <h1 className="font-display text-heading font-medium tracking-tight text-ink">How can we help?</h1>
      <p className="mt-4 max-w-xl text-body leading-relaxed text-ink-soft">
        Answers to the questions we hear most. Still stuck? We’re a message away.
      </p>

      <div className="mt-10 space-y-4">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-3xl border border-line bg-surface p-7 transition hover:border-forest-200">
            <div className="font-display text-title font-medium text-ink">{f.q}</div>
            <div className="mt-2.5 text-body leading-relaxed text-ink-soft">{f.a}</div>
          </div>
        ))}
      </div>

      <div className="relative mt-10 flex flex-col items-start gap-6 overflow-hidden rounded-[2rem] bg-forest-800 p-9 text-surface lg:flex-row lg:items-center lg:justify-between">
        <div className="grain-dark" />
        <div className="relative">
          <div className="font-display text-title font-medium">Still need a hand?</div>
          <div className="mt-1.5 text-body text-forest-50/75">Our ops team replies on WhatsApp, usually within minutes.</div>
        </div>
        <a
          href="tel:+918047181299"
          className="relative inline-flex items-center gap-2 rounded-full bg-surface px-7 py-3.5 text-body font-semibold text-forest-800 transition hover:bg-clay-50"
        >
          <Phone size={17} /> Call us
        </a>
      </div>
    </div>
  );
}
