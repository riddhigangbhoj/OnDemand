const clauses = [
  {
    h: 'One prepaid session',
    b: 'Kinetic Age On-demand provides one-off home physiotherapy and physical training sessions in serviced Bengaluru pincodes. Each booking is a single prepaid session.',
  },
  {
    h: 'Confirmation',
    b: 'A placed booking is not yet confirmed. It becomes confirmed only once both our ops team and the assigned professional confirm. You will be notified on WhatsApp.',
  },
  {
    h: 'Changes',
    b: 'Any change to your session time or professional resets confirmation, and you’ll receive a fresh update.',
  },
  {
    h: 'Cancellation & refunds',
    b: 'Sessions may be cancelled by ops with a stated reason. Eligible refunds are processed to the original payment method.',
  },
];

export function Terms() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:py-20">
      <h1 className="font-display text-heading font-medium tracking-tight text-ink">Terms</h1>

      <div className="mt-10 space-y-5">
        {clauses.map((c) => (
          <div key={c.h} className="rounded-3xl border border-line bg-surface p-7">
            <h2 className="font-display text-title font-medium text-ink">{c.h}</h2>
            <p className="mt-2 text-body leading-relaxed text-ink-soft">{c.b}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-fine italic text-ink-soft">
        This is a prototype. No real payment, message, or booking is processed.
      </p>
    </div>
  );
}
