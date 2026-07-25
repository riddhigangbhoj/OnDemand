import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Phone, Video, X } from 'lucide-react';
import { useStore } from '../store/store';
import { usePanes } from './panes';
import { fmtTime, fmtDay } from '../store/clock';

export function WhatsAppPane() {
  const { state, dispatch } = useStore();
  const { customerId, setCustomer, close } = usePanes();
  const navigate = useNavigate();

  const cid = customerId ?? state.cookieCustomerId ?? state.customers[0]?.id ?? null;
  const customer = state.customers.find((c) => c.id === cid);
  const msgs = state.messages
    .filter((m) => m.customerId === cid)
    .sort((a, b) => a.at - b.at);

  const openFeedback = (link: string) => {
    dispatch({ t: 'SET_ROLE', role: 'site' });
    close();
    navigate(link);
  };

  return (
    <aside className="animate-slide fixed right-0 top-0 z-40 flex h-full w-full flex-col bg-[#0b141a] shadow-2xl sm:w-[380px]">
      {/* header */}
      <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3 text-white">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#128c7e] text-sm font-bold">
          {customer?.name.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? 'KA'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative">
            <select
              value={cid ?? ''}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full appearance-none bg-transparent pr-6 text-[15px] font-semibold text-white outline-none"
            >
              {state.customers.map((c) => (
                <option key={c.id} value={c.id} className="text-ink">
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-0 top-1.5 text-white/60" />
          </div>
          <div className="truncate text-xs text-white/60">Kinetic Age · online</div>
        </div>
        <Video size={18} className="text-white/70" />
        <Phone size={17} className="text-white/70" />
        <button onClick={close}><X size={18} className="text-white/70" /></button>
      </div>

      {/* chat body */}
      <div
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4"
        style={{
          background:
            '#0b141a url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.03\'/%3E%3C/svg%3E")',
        }}
      >
        {msgs.length === 0 && (
          <p className="mt-10 text-center text-sm text-white/40">No messages yet.</p>
        )}
        <div className="mx-auto mb-2 w-fit rounded-md bg-[#182229] px-3 py-1 text-[11px] text-white/50">
          Messages are simulated
        </div>
        {msgs.map((m) => (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 text-[13.5px] leading-snug text-white shadow">
              <p className="whitespace-pre-wrap">{m.body}</p>
              {m.otp && (
                <div className="mt-1.5 rounded bg-black/25 px-2 py-1 text-center font-mono text-lg font-bold tracking-[0.3em]">
                  {m.otp}
                </div>
              )}
              {m.link && (
                <button
                  onClick={() => openFeedback(m.link!)}
                  className="mt-1 block font-medium text-[#8fd6ff] underline"
                >
                  {m.template === 'report' ? 'Open your report' : 'Give feedback'}
                </button>
              )}
              <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/50">
                <span title={fmtDay(m.at)}>{fmtTime(m.at)}</span>
                <Check size={12} className="text-[#53bdeb]" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#202c33] px-4 py-3 text-center text-xs text-white/40">
        Customer phone · read only
      </div>
    </aside>
  );
}
