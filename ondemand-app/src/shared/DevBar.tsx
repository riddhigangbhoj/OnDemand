import {
  MessageCircle,
  Hash,
  RotateCcw,
  Clock,
  Sunset,
  Sunrise,
  Monitor,
  Smartphone,
  LayoutDashboard,
} from 'lucide-react';
import { useStore } from '../store/store';
import { usePanes } from './panes';
import { fmtClock } from '../store/clock';
import { cn } from './ui';
import type { Role } from '../store/types';

const roles: Array<{ id: Role; label: string; icon: typeof Monitor }> = [
  { id: 'site', label: 'Site', icon: Smartphone },
  { id: 'panel', label: 'Panel', icon: LayoutDashboard },
  { id: 'trainer', label: 'Trainer', icon: Monitor },
];

export function DevBar() {
  const { state, dispatch } = useStore();
  const { toggle, pane } = usePanes();

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 bg-[#141310] px-3 py-2 text-white sm:px-4">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded bg-pine-500 text-[11px] font-black">KA</span>
        <span className="text-xs font-semibold tracking-wide text-white/70">
          Kinetic Age <span className="text-white/30">· prototype</span>
        </span>
      </div>

      {/* role switch */}
      <div className="flex rounded-lg bg-white/5 p-0.5">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => dispatch({ t: 'SET_ROLE', role: r.id })}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
              state.role === r.id ? 'bg-white text-ink' : 'text-white/60 hover:text-white',
            )}
          >
            <r.icon size={13} />
            {r.label}
          </button>
        ))}
      </div>

      {state.role === 'trainer' && (
        <select
          value={state.activeTrainerId}
          onChange={(e) => dispatch({ t: 'SET_TRAINER', id: e.target.value })}
          className="rounded-lg bg-white/5 px-2 py-1.5 text-xs font-medium text-white outline-none"
        >
          {state.trainers.map((t) => (
            <option key={t.id} value={t.id} className="text-ink">
              {t.name}
            </option>
          ))}
        </select>
      )}

      {/* clock */}
      <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5">
        <Clock size={13} className="text-pine-500" />
        <span className="font-mono text-xs tabular-nums text-white/90">{fmtClock(state.now)}</span>
      </div>
      <div className="flex items-center gap-1">
        {(['15m', '1h', '1d'] as const).map((k) => (
          <button
            key={k}
            onClick={() => dispatch({ t: 'ADVANCE', kind: k })}
            className="rounded-md bg-white/5 px-2 py-1.5 font-mono text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            +{k}
          </button>
        ))}
        <button
          onClick={() => dispatch({ t: 'JUMP', preset: 'evening' })}
          title="Jump to 21:00"
          className="rounded-md bg-white/5 p-1.5 text-white/80 hover:bg-white/10"
        >
          <Sunset size={14} />
        </button>
        <button
          onClick={() => dispatch({ t: 'JUMP', preset: 'next_morning' })}
          title="Jump to next 08:00"
          className="rounded-md bg-white/5 p-1.5 text-white/80 hover:bg-white/10"
        >
          <Sunrise size={14} />
        </button>
      </div>

      {/* panes + reset */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => toggle('whatsapp')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold',
            pane === 'whatsapp' ? 'bg-[#128c7e] text-white' : 'bg-white/5 text-white/80 hover:bg-white/10',
          )}
        >
          <MessageCircle size={13} /> WhatsApp
        </button>
        <button
          onClick={() => toggle('slack')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold',
            pane === 'slack' ? 'bg-[#4a154b] text-white' : 'bg-white/5 text-white/80 hover:bg-white/10',
          )}
        >
          <Hash size={13} /> Slack
        </button>
        <button
          onClick={() => dispatch({ t: 'RESET' })}
          className="flex items-center gap-1.5 rounded-md bg-coral-500/90 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-coral-600"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>
    </div>
  );
}
