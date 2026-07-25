const faqs = [
  { q: 'When will my session be confirmed?', a: 'After payment your booking is placed. Our ops team and the assigned physio each confirm it, you get a WhatsApp message the moment both are done.' },
  { q: 'Can I book for today?', a: 'Same-day isn’t available yet. The earliest slot is tomorrow. Tapping today lets us know you needed it sooner.' },
  { q: 'How do I know the right person arrived?', a: 'You’ll get a 6-digit code on WhatsApp when your session starts. Share it with the professional at your door.' },
  { q: 'What are the working hours?', a: 'Sessions run from 8:00am to 8:00pm. Book late at night and the next morning starts from 12:00pm.' },
  { q: 'How do refunds work?', a: 'If a session is cancelled, a refund follows per our terms. Reach out on WhatsApp and ops will help.' },
];

export function Help() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 lg:max-w-3xl lg:py-16">
      <h1 className="font-display text-3xl font-semibold text-ink lg:text-[2.5rem]">Help</h1>
      <div className="mt-6 space-y-3">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-2xl border border-ink bg-white p-4 lg:p-6">
            <div className="text-sm font-semibold text-ink lg:text-[26px]">{f.q}</div>
            <div className="mt-1 text-[13px] leading-relaxed text-ink lg:mt-2 lg:text-[26px]">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
