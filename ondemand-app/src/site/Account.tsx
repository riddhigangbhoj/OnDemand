import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, RotateCw } from 'lucide-react';
import { useStore } from '../store/store';
import { usePanes } from '../shared/panes';
import { Button, Card, Field, cn } from '../shared/ui';
import { fmtDay, fmtTime } from '../store/clock';
import { cardBySlug, conditionBySlug } from '../store/catalog';
import type { Booking } from '../store/types';

export function Account() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { openWhatsApp } = usePanes();
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
      <div className="mx-auto w-full max-w-md px-5 py-16 lg:max-w-lg lg:py-24">
        <h1 className="font-display text-3xl font-semibold text-ink lg:text-[2.6rem]">Your bookings</h1>
        <p className="mt-1 text-[15px] text-ink lg:mt-2 lg:text-[26px]">Enter the phone number you booked with.</p>
        <Card className="mt-6 space-y-3 p-6">
          <Field label="Phone number" placeholder="+91 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Field label="OTP" placeholder="6 digits" value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} hint="Any 6 digits, use 123456" />
          {err && <p className="text-[13px] lg:text-[26px] text-coral-600">{err}</p>}
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
    <div className="mx-auto w-full max-w-4xl px-5 py-10 lg:max-w-5xl lg:px-8 lg:py-16">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink lg:text-[2.6rem]">Your bookings</h1>
        <p className="text-[15px] text-ink lg:text-[26px]">{customer.name} · {customer.phone}</p>
      </div>

      <Card className="mt-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[14px] font-medium text-ink lg:text-[26px]">Need help with a booking?</div>
        <div className="flex gap-2">
          <Button className="flex-1 sm:flex-none" onClick={() => openWhatsApp(customer.id)}>
            <MessageCircle size={16} /> Chat on WhatsApp
          </Button>
          <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => { window.location.href = 'tel:+918047181299'; }}>
            <Phone size={16} /> Call
          </Button>
        </div>
      </Card>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink lg:text-[26px]">Upcoming</h2>
          <div className="grid gap-4">
            {upcoming.map((b) => (
              <AccountCard key={b.id} booking={b} onRebook={() => rebook(b)} />
            ))}
            {upcoming.length === 0 && (
              <Card className="p-8 text-center text-sm lg:text-[26px] text-ink sm:col-span-2">No upcoming sessions.</Card>
            )}
          </div>
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink lg:text-[26px]">Past sessions · last 3 months</h2>
            <div className="grid gap-4">
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
  const { openWhatsApp } = usePanes();
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
    <Card className={cn('grain flex flex-col p-6 lg:p-9', cancelled ? 'border-2 border-coral-500/40 bg-coral-50' : 'border-2 border-pine-300 bg-pine-50')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[19px] font-semibold text-ink lg:text-[2rem]">{label}</div>
          <div className="mt-0.5 text-[13px] font-semibold text-pine-700 lg:mt-1 lg:text-[24px]">{serviceLabel} · {b.type}</div>
        </div>
        <span className={cn('inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white lg:px-6 lg:py-2.5 lg:text-[22px]', cancelled ? 'bg-coral-500' : 'bg-pine-600')}>
          {cancelled ? 'Cancelled' : b.status === 'completed' ? 'Completed' : 'Confirmed'}
        </span>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-4 border-t-2 border-pine-300 pt-5 sm:grid-cols-2 lg:mt-6 lg:gap-y-5 lg:pt-7">
        {rows.map((r) => (
          <div key={r.k}>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-pine-700 lg:text-[18px]">{r.k}</dt>
            <dd className="mt-0.5 text-[14px] font-medium text-ink lg:mt-1 lg:text-[24px]">{r.v}</dd>
          </div>
        ))}
      </dl>

      {showTrainer && trainer && (
        <div className="mt-4 text-[14px] text-ink lg:mt-5 lg:text-[24px]">
          <span className="font-bold text-pine-700">{b.status === 'completed' ? 'Seen by' : 'Professional'}: </span>
          {trainer.name}, {trainer.qualification}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row lg:mt-7 lg:gap-3">
        <Button className="flex-1" onClick={() => openWhatsApp(b.customerId)}>
          <MessageCircle size={16} /> Chat on WhatsApp
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => { window.location.href = 'tel:+918047181299'; }}>
          <Phone size={16} /> Call
        </Button>
        {isPast && (
          <Button variant="soft" className="flex-1" onClick={onRebook}>
            <RotateCw size={16} /> Rebook
          </Button>
        )}
      </div>
    </Card>
  );
}
