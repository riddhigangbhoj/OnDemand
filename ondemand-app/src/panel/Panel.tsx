import { useState } from 'react';
import { Search, Hash } from 'lucide-react';
import { useStore } from '../store/store';
import { usePanes } from '../shared/panes';
import { ActiveTab } from './ActiveTab';
import { PastTab } from './PastTab';
import { cn } from '../shared/ui';

export function Panel() {
  const { state } = useStore();
  const { openSlack } = usePanes();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [query, setQuery] = useState('');

  const slackToday = state.slack.filter(
    (a) => new Date(a.at).toDateString() === new Date(state.now).toDateString(),
  ).length;

  return (
    <div className="min-h-full bg-[#f4f5f6]">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-pine-600 text-[13px] font-black text-white">KA</span>
            <div>
              <div className="font-display text-[15px] font-semibold leading-none text-ink">On-demand desk</div>
              <div className="text-[11px] text-ink-soft">Ops admin panel</div>
            </div>
          </div>

          <div className="relative ml-4 max-w-md flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search client, physio, area…"
              className="w-full rounded-xl border border-line bg-paper py-2 pl-9 pr-3 text-sm outline-none focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
            />
          </div>

          <button onClick={openSlack} className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-[#4a154b] hover:bg-paper">
            <Hash size={15} /> {slackToday} today
          </button>

          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-paper">RI</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink">Riddhi</div>
              <div className="text-[11px] text-ink-soft">Admin</div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-1">
          {(['active', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                tab === t ? 'bg-pine-600 text-white' : 'text-ink-soft hover:bg-black/5',
              )}
            >
              {t === 'active' ? 'Active' : 'Past clients'}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {tab === 'active' ? <ActiveTab query={query} /> : <PastTab query={query} />}
      </div>
    </div>
  );
}
