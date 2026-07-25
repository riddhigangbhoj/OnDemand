import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { advance, jumpTo, MIN, seedNow } from './clock';
import { makeSeedState } from './seed';
import { renderMessage } from './templates';
import { isConfirmed, slackEmissions, trainerFreeAt } from './rules';
import type {
  Assessment,
  Booking,
  Closure,
  Feedback,
  Message,
  MessageTemplate,
  Role,
  SessionLog,
  SlackAlert,
  StoreState,
} from './types';

type Action =
  | { t: 'ADVANCE'; kind: '15m' | '1h' | '1d' }
  | { t: 'JUMP'; preset: 'evening' | 'next_morning' }
  | { t: 'RESET' }
  | { t: 'SET_ROLE'; role: Role }
  | { t: 'SET_TRAINER'; id: string }
  | { t: 'SET_COOKIE'; id: string | null }
  | { t: 'ADD_PROBE'; condition: string; service: Booking['service'] }
  | { t: 'CREATE_PROFILE'; phone: string; name: string }
  | {
      t: 'CREATE_BOOKING';
      address: string;
      service: Booking['service'];
      type: string;
      condition: string;
      scheduledAt: number;
      amount: number;
      note?: string;
      entryInstructions?: string;
    }
  | { t: 'OPS_CONFIRM'; id: string }
  | { t: 'TRAINER_CONFIRM'; id: string }
  | { t: 'RESCHEDULE'; id: string; scheduledAt: number; trainerId?: string; reason: string }
  | { t: 'REASSIGN'; id: string; trainerId: string; reason: string }
  | { t: 'CANCEL'; id: string; reason: string }
  | { t: 'START_OTP'; id: string }
  | { t: 'VERIFY_START'; id: string; code: string }
  | { t: 'SAVE_ASSESSMENT'; id: string; assessment: Assessment }
  | { t: 'SAVE_LOG'; id: string; log: SessionLog }
  | { t: 'CLOSE'; id: string; closure: Closure }
  | { t: 'FEEDBACK'; token: string; feedback: Feedback };

const OPS = 'Riddhi (ops)';

function pushMessage(
  s: StoreState,
  b: Booking,
  template: MessageTemplate,
  extra?: { reason?: string; code?: string },
): Message {
  const t = s.trainers.find((x) => x.id === b.trainerId)!;
  const c = s.customers.find((x) => x.id === b.customerId)!;
  const r = renderMessage(template, { booking: b, trainer: t, customer: c, ...extra });
  return {
    id: `m${s.seq++}`,
    bookingId: b.id,
    customerId: b.customerId,
    at: s.now,
    template,
    body: r.body,
    link: r.link,
    otp: r.otp,
  };
}

function slackNewLead(s: StoreState, b: Booking): SlackAlert {
  const c = s.customers.find((x) => x.id === b.customerId)!;
  const area = b.address.split(',').slice(-2, -1)[0]?.trim() ?? 'Bengaluru';
  return {
    id: `s${s.seq++}`,
    bookingId: b.id,
    at: s.now,
    kind: 'new_lead',
    body: `New on-demand lead: ${c.name}, ${b.service === 'training' ? 'training' : 'physio'} ${b.type}, ${new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${new Date(b.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}, ${area}, ₹${b.amount.toLocaleString('en-IN')}`,
  };
}

/** Re-evaluate time-driven emissions after the clock moves. */
function tick(s: StoreState): StoreState {
  const emit = slackEmissions(s, s.now);
  const newSlack: SlackAlert[] = emit.alerts.map((a) => ({
    id: `s${s.seq++}`,
    bookingId: a.bookingId,
    at: a.at,
    kind: a.kind,
    body: a.body,
  }));

  // reminder_1h — fire once per booking, deduped by existing message
  const reminders: Message[] = [];
  for (const b of s.bookings) {
    if (b.status === 'cancelled' || b.status === 'completed' || b.startedAt) continue;
    if (s.now >= b.scheduledAt - 60 * MIN && s.now < b.scheduledAt) {
      const has = s.messages.some((m) => m.bookingId === b.id && m.template === 'reminder_1h');
      if (!has) reminders.push(pushMessage(s, b, 'reminder_1h'));
    }
  }

  return {
    ...s,
    slack: [...s.slack, ...newSlack],
    messages: [...s.messages, ...reminders],
    unconfirmedFiredAt: emit.unconfirmedFiredAt,
    notStartedFired: emit.notStartedFired,
  };
}

function assignTrainer(s: StoreState, service: Booking['service'], slot: number): string {
  const pool = s.trainers.filter((t) => t.services.includes(service));
  const free = pool.find((t) => trainerFreeAt(t, service, slot, s.bookings));
  return (free ?? pool[0]).id;
}

function mapBooking(s: StoreState, id: string, fn: (b: Booking) => Booking): Booking[] {
  return s.bookings.map((b) => (b.id === id ? fn(b) : b));
}

function reducer(s: StoreState, a: Action): StoreState {
  switch (a.t) {
    case 'ADVANCE':
      return tick({ ...s, now: advance(s.now, a.kind) });
    case 'JUMP':
      return tick({ ...s, now: jumpTo(s.now, a.preset) });
    case 'RESET':
      return makeSeedState();
    case 'SET_ROLE':
      return { ...s, role: a.role };
    case 'SET_TRAINER':
      return { ...s, activeTrainerId: a.id };
    case 'SET_COOKIE':
      return { ...s, cookieCustomerId: a.id };
    case 'ADD_PROBE':
      return {
        ...s,
        probes: [...s.probes, { id: `p${s.seq}`, at: s.now, condition: a.condition, service: a.service }],
        seq: s.seq + 1,
      };

    case 'CREATE_PROFILE': {
      const digits = a.phone.replace(/\D/g, '').slice(-10);
      const existing = s.customers.find((c) => c.phone.replace(/\D/g, '').endsWith(digits) && digits.length === 10);
      if (existing) return { ...s, cookieCustomerId: existing.id };
      const cid = `c${s.seq}`;
      const customer = { id: cid, name: a.name, phone: a.phone, age: 0, address: '' };
      return { ...s, customers: [...s.customers, customer], cookieCustomerId: cid, seq: s.seq + 1 };
    }

    case 'CREATE_BOOKING': {
      const cid = s.cookieCustomerId!;
      const next = {
        ...s,
        customers: s.customers.map((c) => (c.id === cid ? { ...c, address: a.address } : c)),
      };
      const trainerId = assignTrainer(next, a.service, a.scheduledAt);
      const booking: Booking = {
        id: `b${next.seq++}`,
        customerId: cid,
        trainerId,
        service: a.service,
        type: a.type,
        condition: a.condition,
        address: a.address,
        note: a.note,
        entryInstructions: a.entryInstructions,
        amount: a.amount,
        scheduledAt: a.scheduledAt,
        createdAt: s.now,
        status: 'placed',
        opsConfirmed: false,
        trainerConfirmed: false,
        feedbackToken: `fb-b${next.seq}`,
        auditLog: [{ at: s.now, actor: 'system', action: 'lead created' }],
      };
      const withB = { ...next, bookings: [...next.bookings, booking] };
      const msg = pushMessage(withB, booking, 'booking_placed');
      const sl = slackNewLead(withB, booking);
      return { ...withB, messages: [...withB.messages, msg], slack: [...withB.slack, sl] };
    }

    case 'OPS_CONFIRM':
    case 'TRAINER_CONFIRM': {
      const actor = a.t === 'OPS_CONFIRM' ? OPS : s.trainers.find((t) => t.id === s.bookings.find((b) => b.id === a.id)!.trainerId)!.name;
      let confirmedBooking: Booking | null = null;
      const bookings = mapBooking(s, a.id, (b) => {
        const updated: Booking = {
          ...b,
          opsConfirmed: a.t === 'OPS_CONFIRM' ? true : b.opsConfirmed,
          trainerConfirmed: a.t === 'TRAINER_CONFIRM' ? true : b.trainerConfirmed,
          auditLog: [...b.auditLog, { at: s.now, actor, action: 'confirmed lead' }],
        };
        if (!isConfirmed(b) && isConfirmed(updated)) {
          updated.status = 'confirmed';
          updated.confirmedAt = s.now;
          confirmedBooking = updated;
        }
        return updated;
      });
      let next = { ...s, bookings };
      if (confirmedBooking) {
        const msg = pushMessage(next, confirmedBooking, 'booking_confirmed');
        next = { ...next, messages: [...next.messages, msg] };
      }
      return next;
    }

    case 'RESCHEDULE': {
      let changed: Booking | null = null;
      const bookings = mapBooking(s, a.id, (b) => {
        changed = {
          ...b,
          scheduledAt: a.scheduledAt,
          trainerId: a.trainerId ?? b.trainerId,
          rescheduledFrom: b.scheduledAt,
          status: 'placed',
          opsConfirmed: false,
          trainerConfirmed: false,
          confirmedAt: undefined,
          auditLog: [...b.auditLog, { at: s.now, actor: OPS, action: `rescheduled: ${a.reason}` }],
        };
        return changed;
      });
      let next = { ...s, bookings };
      next = { ...next, messages: [...next.messages, pushMessage(next, changed!, 'provider_changed', { reason: a.reason })] };
      return next;
    }

    case 'REASSIGN': {
      let changed: Booking | null = null;
      const bookings = mapBooking(s, a.id, (b) => {
        changed = {
          ...b,
          trainerId: a.trainerId,
          status: 'placed',
          opsConfirmed: false,
          trainerConfirmed: false,
          confirmedAt: undefined,
          auditLog: [...b.auditLog, { at: s.now, actor: OPS, action: `reassigned physio: ${a.reason}` }],
        };
        return changed;
      });
      let next = { ...s, bookings };
      next = { ...next, messages: [...next.messages, pushMessage(next, changed!, 'provider_changed', { reason: a.reason })] };
      return next;
    }

    case 'CANCEL': {
      let changed: Booking | null = null;
      const bookings = mapBooking(s, a.id, (b) => {
        changed = {
          ...b,
          status: 'cancelled',
          cancelReason: a.reason,
          cancelledBy: OPS,
          auditLog: [...b.auditLog, { at: s.now, actor: OPS, action: `cancelled: ${a.reason}` }],
        };
        return changed;
      });
      let next = { ...s, bookings };
      next = { ...next, messages: [...next.messages, pushMessage(next, changed!, 'cancelled', { reason: a.reason })] };
      return next;
    }

    case 'START_OTP': {
      const b = s.bookings.find((x) => x.id === a.id)!;
      const code = String(100000 + ((s.seq * 7919) % 900000));
      const msg = pushMessage(s, b, 'start_otp', { code });
      return { ...s, seq: s.seq + 1, messages: [...s.messages, msg] };
    }

    case 'VERIFY_START': {
      const universal = a.code === '999999';
      const bookings = mapBooking(s, a.id, (b) => ({
        ...b,
        status: 'in_progress',
        startedAt: s.now,
        universalOtpUsed: universal,
        auditLog: [
          ...b.auditLog,
          {
            at: s.now,
            actor: s.trainers.find((t) => t.id === b.trainerId)!.name,
            action: universal ? 'started (universal OTP)' : 'started session',
          },
        ],
      }));
      return { ...s, bookings };
    }

    case 'SAVE_ASSESSMENT':
      return { ...s, bookings: mapBooking(s, a.id, (b) => ({ ...b, assessment: a.assessment })) };

    case 'SAVE_LOG':
      return { ...s, bookings: mapBooking(s, a.id, (b) => ({ ...b, sessionLog: a.log })) };

    case 'CLOSE': {
      let closed: Booking | null = null;
      const bookings = mapBooking(s, a.id, (b) => {
        closed = {
          ...b,
          status: 'completed',
          endedAt: s.now,
          closure: a.closure,
          auditLog: [...b.auditLog, { at: s.now, actor: s.trainers.find((t) => t.id === b.trainerId)!.name, action: 'closed session' }],
        };
        return closed;
      });
      let next = { ...s, bookings };
      const report = pushMessage(next, closed!, 'report');
      const fb = pushMessage(next, closed!, 'feedback_link');
      return { ...next, messages: [...next.messages, report, fb] };
    }

    case 'FEEDBACK':
      return {
        ...s,
        bookings: s.bookings.map((b) =>
          b.feedbackToken === a.token ? { ...b, feedback: a.feedback } : b,
        ),
      };
  }
}

interface Ctx {
  state: StoreState;
  dispatch: React.Dispatch<Action>;
}
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, makeSeedState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}

export { seedNow };
