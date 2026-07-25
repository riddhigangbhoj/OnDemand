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
    <div className="space-y-5">
      <div className="flex gap-1.5">
        <Dot on />
        <Dot on={phase === 'name'} />
      </div>

      {phase === 'login' ? (
        <>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink lg:text-[2.7rem] lg:leading-[1.05]">{heading}</h2>
            {sub && <p className="mt-3 text-[15px] text-ink lg:mt-4 lg:text-[26px]">{sub}</p>}
          </div>
          <Field label="Phone number" placeholder="+91 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phoneOk && (
            <Field
              label="Enter OTP"
              placeholder="6 digits"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="lg:text-center lg:text-[26px] lg:font-semibold lg:tracking-[0.4em]"
            />
          )}
          <Button className="w-full py-3 lg:py-4 lg:text-[26px]" disabled={otp.length !== 6} onClick={() => setPhase('name')}>
            Verify &amp; continue
          </Button>
        </>
      ) : (
        <>
          <button onClick={() => setPhase('login')} className="flex items-center gap-1.5 text-[15px] font-semibold text-ink lg:gap-2 lg:text-[26px]">
            <ArrowLeft size={16} className="lg:h-6 lg:w-6" /> Back
          </button>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink lg:text-[2.7rem] lg:leading-[1.05]">Almost there</h2>
            <p className="mt-3 text-[15px] text-ink lg:mt-4 lg:text-[26px]">What should we call you?</p>
          </div>
          <Field label="Full name" placeholder="e.g. Aman Verma" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            className="w-full py-3"
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
  <div className={cn('h-1.5 flex-1 rounded-full', on ? 'bg-pine-600' : 'bg-line')} />
);
