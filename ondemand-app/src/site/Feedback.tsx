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
    return <div className="px-6 py-24 text-center text-ink-soft">This feedback link is not valid.</div>;
  }

  const already = booking.feedback;

  if (done || already) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 py-20 text-center">
        <span className="animate-pop grid h-20 w-20 place-items-center rounded-full bg-clay-50 text-clay-500">
          <Heart size={34} />
        </span>
        <h1 className="mt-7 font-display text-heading font-medium tracking-tight text-ink">Thank you</h1>
        <p className="mt-3 max-w-sm text-body leading-relaxed text-ink-soft">
          Your feedback goes straight to our team. It’s private, never shown publicly.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16 lg:py-20">
      <h1 className="font-display text-heading font-medium tracking-tight text-ink">How was it?</h1>
      <p className="mt-3 text-body text-ink-soft">Tap what felt true. No stars, no public review.</p>

      <div className="mt-8 space-y-3">
        {qualities.map((q) => {
          const on = !!picked[q.key];
          return (
            <button
              key={q.key}
              onClick={() => setPicked((p) => ({ ...p, [q.key]: !on }))}
              className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${
                on ? 'border-forest-500 bg-forest-50/70' : 'border-line-strong bg-surface hover:border-forest-300'
              }`}
            >
              <q.icon size={20} className={on ? 'text-forest-600' : 'text-ink-soft'} />
              <span className="flex-1 text-body font-medium text-ink">{q.label}</span>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full transition ${
                  on ? 'bg-forest-600 text-surface' : 'border border-line-strong'
                }`}
              >
                {on && <Check size={15} />}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="mt-4 p-2">
        <TextField
          rows={3}
          placeholder="Anything else you'd like us to know? (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border-0 bg-transparent focus:ring-0"
        />
      </Card>

      <Button
        className="mt-5 w-full"
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
