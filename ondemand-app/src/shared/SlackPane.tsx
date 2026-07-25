import { Hash, X } from 'lucide-react';
import { useStore } from '../store/store';
import { usePanes } from './panes';
import { fmtTime, fmtDay } from '../store/clock';
import type { SlackKind } from '../store/types';

const kindMeta: Record<SlackKind, { label: string; dot: string; ring: string }> = {
  new_lead: { label: 'lead', dot: '#2eb67d', ring: 'border-l-[#2eb67d]' },
  unconfirmed: { label: 'unconfirmed', dot: '#ecb22e', ring: 'border-l-[#ecb22e]' },
  not_started: { label: 'not started', dot: '#e01e5a', ring: 'border-l-[#e01e5a]' },
};

export function SlackPane() {
  const { state } = useStore();
  const { close } = usePanes();
  const alerts = [...state.slack].sort((a, b) => a.at - b.at);

  return (
    <aside className="animate-slide fixed right-0 top-0 z-40 flex h-full w-full flex-col bg-[#1a1d21] text-[#d1d2d3] shadow-2xl sm:w-[400px]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Hash size={18} className="text-white/60" />
        <div className="flex-1">
          <div className="font-semibold text-white">ondemand-leads</div>
          <div className="text-xs text-white/40">{alerts.length} messages · ops channel</div>
        </div>
        <button onClick={close}><X size={18} className="text-white/60" /></button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {alerts.length === 0 && (
          <p className="mt-10 text-center text-sm text-white/30">Channel is quiet.</p>
        )}
        {alerts.map((a) => {
          const meta = kindMeta[a.kind];
          return (
            <div key={a.id} className="rounded-md px-3 py-2 hover:bg-white/[0.03]">
              <div className="flex items-baseline gap-2">
                <div
                  className="grid h-6 w-6 place-items-center rounded text-[10px] font-bold text-white"
                  style={{ background: meta.dot }}
                >
                  KA
                </div>
                <span className="text-sm font-bold text-white">Kinetic Bot</span>
                <span
                  className="rounded px-1.5 py-px text-[10px] font-semibold uppercase text-black"
                  style={{ background: meta.dot }}
                >
                  {meta.label}
                </span>
                <span className="text-xs text-white/40" title={fmtDay(a.at)}>
                  {fmtTime(a.at)}
                </span>
              </div>
              <p className={`ml-8 mt-0.5 border-l-2 ${meta.ring} pl-2 text-[13.5px] leading-snug`}>
                {a.body}
              </p>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 px-4 py-3 text-center text-xs text-white/30">
        Simulated Slack · #ondemand-leads
      </div>
    </aside>
  );
}
