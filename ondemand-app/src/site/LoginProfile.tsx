import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Field, cn } from '../shared/ui';

/**
 * Phone + OTP login followed by a one-field profile (name).
 * On completion it creates/attaches the customer (cookie) and calls onDone.
 */
export function LoginProfile({
  heading,
  sub,
  cta = 'Continue',
  onDone,
}: {
  heading: string;
  sub?: string;
  cta?: string;
  onDone: () => void;
}) {
  const { dispatch } = useStore();
  const [phase, setPhase] = useState<'login' | 'name'>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');

  const phoneOk = phone.replace(/\D/g, '').length >= 10;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Dot on />
        <Dot on={phase === 'name'} />
      </div>

      {phase === 'login' ? (
        <>
          <div>
            <h2 className="font-display text-title font-medium leading-tight text-ink">{heading}</h2>
            {sub && <p className="mt-3 text-body leading-relaxed text-ink-soft">{sub}</p>}
          </div>
          <Field label="Phone number" placeholder="+91 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phoneOk && (
            <Field
              label="Enter OTP"
              placeholder="6 digits"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="text-center text-body font-semibold tracking-[0.4em]"
            />
          )}
          <Button className="w-full" disabled={otp.length !== 6} onClick={() => setPhase('name')}>
            Verify &amp; continue
          </Button>
        </>
      ) : (
        <>
          <button onClick={() => setPhase('login')} className="flex items-center gap-1.5 text-fine font-semibold text-ink-soft transition hover:text-ink">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="font-display text-title font-medium leading-tight text-ink">Almost there</h2>
          </div>
          <Field label="Name" placeholder="e.g. Aman Verma" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            className="w-full"
            disabled={!name.trim()}
            onClick={() => {
              dispatch({ t: 'CREATE_PROFILE', phone, name: name.trim() });
              onDone();
            }}
          >
            {cta}
          </Button>
        </>
      )}
    </div>
  );
}

const Dot = ({ on }: { on?: boolean }) => (
  <div className={cn('h-1.5 flex-1 rounded-full transition-colors duration-500', on ? 'bg-forest-600' : 'bg-line-strong')} />
);
