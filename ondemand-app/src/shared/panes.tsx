import { createContext, useContext, useState, type ReactNode } from 'react';

type Pane = 'whatsapp' | 'slack' | null;

interface PanesCtx {
  pane: Pane;
  customerId: string | null;
  openWhatsApp: (customerId?: string | null) => void;
  openSlack: () => void;
  toggle: (p: 'whatsapp' | 'slack') => void;
  close: () => void;
  setCustomer: (id: string | null) => void;
}

const Ctx = createContext<PanesCtx | null>(null);

export function PanesProvider({ children }: { children: ReactNode }) {
  const [pane, setPane] = useState<Pane>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const value: PanesCtx = {
    pane,
    customerId,
    openWhatsApp: (id) => {
      if (id !== undefined) setCustomerId(id);
      setPane('whatsapp');
    },
    openSlack: () => setPane('slack'),
    toggle: (p) => setPane((cur) => (cur === p ? null : p)),
    close: () => setPane(null),
    setCustomer: setCustomerId,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePanes() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePanes outside provider');
  return ctx;
}
