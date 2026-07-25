import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Clock, MessageSquare, Ear, Heart } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Card, TextField } from '../shared/ui';

const qualities = [
  { key: 'onTime', icon: Clock, label: 'Arrived on time' },
  { key: 'explainedClearly', icon: MessageSquare, label: 'Explained things clearly' },
  { key: 'feltHeard', icon: Ear, label: 'I felt heard' },
] as const;

export function Feedback() {
  const { token } = useParams();
  const { state, dispatch } = useStore();
  const booking = state.bookings.find((b) => b.feedbackToken === token);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  if (!booking) {
    return <div className="px-5 py-16 text-center text-ink">This feedback link is not valid.</div>;
  }

  const already = booking.feedback;

  if (done || already) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-20 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-pine-50 text-pine-600">
          <Heart size={30} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink lg:text-[2.4rem]">Thank you</h1>
        <p className="mt-2 text-[15px] text-ink lg:text-[26px]">
          Your feedback goes straight to our team. It’s private, never shown publicly.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-12 lg:max-w-xl lg:py-16">
      <h1 className="font-display text-3xl font-semibold text-ink lg:text-[2.5rem]">How was your session?</h1>
      <p className="mt-1 text-sm text-ink lg:mt-2 lg:text-[26px]">Tap what felt true. No stars, no public review.</p>

      <div className="mt-5 space-y-2.5">
        {qualities.map((q) => {
          const on = !!picked[q.key];
          return (
            <button
              key={q.key}
              onClick={() => setPicked((p) => ({ ...p, [q.key]: !on }))}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                on ? 'border-pine-500 bg-pine-50' : 'border-ink bg-white'
              }`}
            >
              <q.icon size={19} className={on ? 'text-pine-600' : 'text-ink'} />
              <span className="flex-1 text-[15px] font-medium text-ink lg:text-[26px]">{q.label}</span>
              <span
                className={`grid h-6 w-6 place-items-center rounded-full ${
                  on ? 'bg-pine-600 text-white' : 'border border-ink'
                }`}
              >
                {on && <Check size={14} />}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="mt-4 p-1">
        <TextField
          rows={3}
          placeholder="Anything else you'd like us to know? (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border-0 focus:ring-0"
        />
      </Card>

      <Button
        className="mt-4 w-full py-3"
        onClick={() => {
          dispatch({
            t: 'FEEDBACK',
            token: token!,
            feedback: {
              onTime: !!picked.onTime,
              explainedClearly: !!picked.explainedClearly,
              feltHeard: !!picked.feltHeard,
              text: text || undefined,
            },
          });
          setDone(true);
        }}
      >
        Send feedback
      </Button>
    </div>
  );
}
