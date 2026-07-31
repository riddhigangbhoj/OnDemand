import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, RotateCw, CalendarClock } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Card, Field, cn } from '../shared/ui';
import { fmtDay, fmtTime } from '../store/clock';
import { cardBySlug, conditionBySlug } from '../store/catalog';
import type { Booking } from '../store/types';

const CALL = 'tel:+918047181299';

export function Account() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');

  const customer = state.customers.find((c) => c.id === state.cookieCustomerId);

  if (!customer) {
    const verify = () => {
      const digits = phone.replace(/\D/g, '');
      const match = state.customers.find((c) => c.phone.replace(/\D/g, '').endsWith(digits.slice(-10)));
      if (digits.length < 10 || otp.length !== 6 || !match) {
        setErr('No bookings found for that number. Try a number you booked with, or place a booking first.');
        return;
      }
      dispatch({ t: 'SET_COOKIE', id: match.id });
    };
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 lg:py-28">
        <h1 className="font-display text-heading font-medium tracking-tight text-ink">Your bookings</h1>
        <p className="mt-3 text-body leading-relaxed text-ink-soft">Enter the phone number you booked with.</p>
        <Card className="mt-8 space-y-4 p-7">
          <Field label="Phone number" placeholder="+91 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Field label="OTP" placeholder="6 digits" value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} hint="Prototype — any 6 digits, e.g. 123456" />
          {err && <p className="text-fine leading-relaxed text-rust-600">{err}</p>}
          <Button className="w-full" onClick={verify}>View my bookings</Button>
        </Card>
      </div>
    );
  }

  const now = state.now;
  const THREE_MONTHS = 90 * 86_400_000;
  const mine = state.bookings.filter((b) => b.customerId === customer.id);
  const upcoming = mine.filter((b) => b.scheduledAt >= now).sort((a, b) => a.scheduledAt - b.scheduledAt);
  const past = mine
    .filter((b) => b.scheduledAt < now && now - b.scheduledAt <= THREE_MONTHS)
    .sort((a, b) => b.scheduledAt - a.scheduledAt);
  const rebook = (b: Booking) => navigate('/book', { state: { service: b.service, condition: b.condition, type: b.type } });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14 lg:px-10 lg:py-20">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-heading font-medium tracking-tight text-ink lg:text-heading">Your bookings</h1>
          <p className="mt-2 text-body text-ink-soft">{customer.name} · {customer.phone}</p>
        </div>
        <Button variant="ghost" onClick={() => { window.location.href = CALL; }}>
          <Phone size={16} className="text-forest-600" /> Need help? Call us
        </Button>
      </div>

      <div className="mt-12 space-y-12">
        <section>
          <h2 className="mb-5 text-fine font-semibold uppercase tracking-[0.16em] text-ink-soft">Upcoming</h2>
          <div className="grid gap-5">
            {upcoming.map((b) => (
              <AccountCard key={b.id} booking={b} onRebook={() => rebook(b)} />
            ))}
            {upcoming.length === 0 && (
              <Card className="flex flex-col items-center gap-3 p-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-forest-50 text-forest-500"><CalendarClock size={26} /></span>
                <p className="text-body text-ink-soft">No upcoming sessions.</p>
              </Card>
            )}
          </div>
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-5 text-fine font-semibold uppercase tracking-[0.16em] text-ink-soft">Past sessions · last 3 months</h2>
            <div className="grid gap-5">
              {past.map((b) => (
                <AccountCard key={b.id} booking={b} onRebook={() => rebook(b)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AccountCard({ booking: b, onRebook }: { booking: Booking; onRebook: () => void }) {
  const { state } = useStore();
  const trainer = state.trainers.find((t) => t.id === b.trainerId);
  const customer = state.customers.find((c) => c.id === b.customerId);
  const cond = conditionBySlug(b.condition);
  const label = cardBySlug(b.condition)?.label ?? cond?.label ?? b.type;
  const isPast = b.status === 'completed' || b.status === 'cancelled';
  const cancelled = b.status === 'cancelled';
  const serviceLabel = b.service === 'training' ? 'Physical training' : 'Physiotherapy';
  const showTrainer = b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'completed';

  const rows = [
    { k: 'When', v: `${fmtDay(b.scheduledAt)} · ${fmtTime(b.scheduledAt)}` },
    { k: 'Where', v: b.address },
    { k: 'Name', v: customer?.name ?? '' },
    { k: 'Phone', v: customer?.phone ?? '' },
  ];

  return (
    <Card className={cn('overflow-hidden p-0', cancelled ? 'border-rust-500/30' : 'border-forest-200')}>
      <div className={cn('flex items-start justify-between gap-3 px-7 py-6', cancelled ? 'bg-rust-50/60' : 'bg-forest-50/60')}>
        <div>
          <div className="font-display text-title font-medium text-ink">{label}</div>
          <div className="mt-1 text-fine font-semibold uppercase tracking-[0.12em] text-forest-600">{serviceLabel} · {b.type}</div>
        </div>
        <span className={cn('inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-fine font-semibold uppercase tracking-[0.12em] text-surface', cancelled ? 'bg-rust-500' : 'bg-forest-600')}>
          {cancelled ? 'Cancelled' : b.status === 'completed' ? 'Completed' : 'Confirmed'}
        </span>
      </div>

      <div className="px-7 py-6">
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.k}>
              <dt className="text-fine font-semibold uppercase tracking-[0.12em] text-ink-soft">{r.k}</dt>
              <dd className="mt-1 text-body font-medium text-ink">{r.v}</dd>
            </div>
          ))}
        </dl>

        {showTrainer && trainer && (
          <div className="mt-6 border-t border-line pt-5 text-body text-ink">
            <span className="font-semibold text-forest-700">{b.status === 'completed' ? 'Seen by' : 'Professional'}: </span>
            {trainer.name}, {trainer.qualification}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button className="flex-1" onClick={() => { window.location.href = CALL; }}>
            <Phone size={16} /> Call
          </Button>
          {isPast && (
            <Button variant="soft" className="flex-1" onClick={onRebook}>
              <RotateCw size={16} /> Rebook
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
