import {
  WORK_START,
  WORK_END,
  MIN,
  HOUR,
  isAfterHours,
  isWorkingHours,
  dayStart,
  sameDay,
} from './clock';
import type { Booking, PastLabel, SlackAlert, Trainer, StoreState } from './types';

/* ---------- Slots & dates ---------- */

export interface DateTile {
  date: number; // start-of-day epoch
  bookable: boolean;
  isToday: boolean;
}

export function getDateTiles(now: number): DateTile[] {
  const base = dayStart(now);
  return [0, 1, 2, 3].map((offset) => ({
    date: base + offset * 86_400_000,
    bookable: offset !== 0,
    isToday: offset === 0,
  }));
}

export interface Slot {
  at: number;
  hour: number;
  popular: boolean;
}

/** Slot start times for a target day, respecting working hours & after-hours rule. */
export function getSlots(now: number, targetDate: number): Slot[] {
  const base = dayStart(targetDate);
  if (sameDay(base, now)) return []; // today never bookable

  const nextDay = dayStart(now) + 86_400_000;
  const isImmediateNext = sameDay(base, nextDay);
  const start = isAfterHours(now) && isImmediateNext ? 12 : WORK_START;

  const weekday = new Date(base).getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  const slots: Slot[] = [];
  for (let h = start; h < WORK_END; h++) {
    const popular = isWeekend || h < 10 || h >= 17;
    slots.push({ at: base + h * 3_600_000, hour: h, popular });
  }
  return slots;
}

export function groupSlots(slots: Slot[]) {
  return {
    popular: slots.filter((s) => s.popular),
    all: slots.filter((s) => !s.popular),
  };
}

/** Booking-flow day slots: full 8am–8pm window, bucketed into Morning / Noon / Evening. */
export interface SlotGroup {
  label: string;
  slots: number[]; // slot start epochs
}

const SLOT_BUCKETS: { label: string; from: number; to: number }[] = [
  { label: 'Morning', from: 8, to: 12 },
  { label: 'Noon', from: 12, to: 17 },
  { label: 'Evening', from: 17, to: 21 },
];

export function getDaySlots(targetDate: number): SlotGroup[] {
  const base = dayStart(targetDate);
  return SLOT_BUCKETS.map(({ label, from, to }) => ({
    label,
    slots: Array.from({ length: to - from }, (_, i) => base + (from + i) * HOUR),
  }));
}

/* ---------- Confirmation gate ---------- */

export const isConfirmed = (b: Booking) => b.opsConfirmed && b.trainerConfirmed;

/* ---------- Alerts (pure, for panel display) ---------- */

export type AlertKind = 'not_started' | 'unconfirmed' | 'not_closed';
export type Severity = 'critical' | 'moderate';

export interface ActiveAlert {
  booking: Booking;
  kind: AlertKind;
  severity: Severity;
  minutesLate?: number;
  elapsedMin?: number;
}

export function activeAlerts(now: number, bookings: Booking[]): ActiveAlert[] {
  const out: ActiveAlert[] = [];
  for (const b of bookings) {
    if (b.status === 'cancelled' || b.status === 'completed') continue;

    if (b.status === 'confirmed' && now >= b.scheduledAt + 10 * MIN) {
      out.push({
        booking: b,
        kind: 'not_started',
        severity: 'critical',
        minutesLate: Math.floor((now - b.scheduledAt) / MIN),
      });
      continue;
    }
    if (b.status === 'in_progress' && b.startedAt && now > b.startedAt + 90 * MIN) {
      out.push({ booking: b, kind: 'not_closed', severity: 'critical' });
      continue;
    }
    if (
      (b.status === 'placed') &&
      !isConfirmed(b) &&
      now - b.createdAt >= 120 * MIN
    ) {
      out.push({
        booking: b,
        kind: 'unconfirmed',
        severity: 'moderate',
        elapsedMin: Math.floor((now - b.createdAt) / MIN),
      });
    }
  }
  // critical first
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
}

/* ---------- Slack emission (stateful stacking) ---------- */

function next8am(t: number): number {
  const d = new Date(t);
  const at8 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), WORK_START, 0, 0, 0).getTime();
  return at8 > t ? at8 : at8 + 86_400_000;
}

export interface SlackEmitResult {
  alerts: Array<Omit<SlackAlert, 'id'> & { customerName: string }>;
  unconfirmedFiredAt: Record<string, number>;
  notStartedFired: Record<string, boolean>;
}

/** Given the new `now`, compute Slack alerts to append and the updated fire-clocks. */
export function slackEmissions(state: StoreState, now: number): SlackEmitResult {
  const unconfirmedFiredAt = { ...state.unconfirmedFiredAt };
  const notStartedFired = { ...state.notStartedFired };
  const alerts: SlackEmitResult['alerts'] = [];
  const nameOf = (id: string) => state.customers.find((c) => c.id === id)?.name ?? 'Client';
  const trainerOf = (id: string) => state.trainers.find((t) => t.id === id)?.name ?? 'Physio';

  for (const b of state.bookings) {
    if (b.status === 'cancelled' || b.status === 'completed') continue;

    // UNCONFIRMED
    if (b.status === 'placed' && !isConfirmed(b)) {
      const threshold = b.createdAt + 120 * MIN;
      let last = unconfirmedFiredAt[b.id];
      const emit = (at: number) => {
        const panel = b.opsConfirmed ? 'Confirmed' : 'Not confirmed';
        const trn = b.trainerConfirmed ? 'Confirmed' : 'Not confirmed';
        const el = Math.floor((at - b.createdAt) / MIN);
        alerts.push({
          bookingId: b.id,
          at,
          kind: 'unconfirmed',
          customerName: nameOf(b.customerId),
          body: `Unconfirmed ${Math.floor(el / 60)}h ${el % 60}m after lead: ${nameOf(
            b.customerId,
          )}. Panel: ${panel}. Trainer: ${trn}`,
        });
      };
      if (last == null) {
        if (now >= threshold) {
          emit(threshold);
          last = threshold;
        }
      }
      if (last != null) {
        let guard = 0;
        while (guard++ < 64) {
          const nextAt = last + 30 * MIN;
          if (now < nextAt) break;
          if (isWorkingHours(nextAt)) {
            emit(nextAt);
            last = nextAt;
          } else {
            emit(nextAt);
            last = next8am(nextAt);
          }
        }
        unconfirmedFiredAt[b.id] = last;
      }
    }

    // NOT_STARTED
    if (b.status === 'confirmed' && now >= b.scheduledAt + 10 * MIN && !notStartedFired[b.id]) {
      const late = Math.floor((now - b.scheduledAt) / MIN);
      alerts.push({
        bookingId: b.id,
        at: b.scheduledAt + 10 * MIN,
        kind: 'not_started',
        customerName: nameOf(b.customerId),
        body: `Not started: ${nameOf(b.customerId)}, scheduled ${fmtHM(
          b.scheduledAt,
        )}, ${late} min late. Physio: ${trainerOf(b.trainerId)}`,
      });
      notStartedFired[b.id] = true;
    }
  }
  return { alerts, unconfirmedFiredAt, notStartedFired };
}

const fmtHM = (t: number) =>
  new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/* ---------- Past status label ---------- */

export function pastLabel(b: Booking): PastLabel {
  if (b.status === 'cancelled') return 'Cancelled';
  if (b.rescheduledFrom != null) return 'Rescheduled';
  if (b.startedAt != null && b.startedAt > b.scheduledAt + 10 * MIN) return 'Delayed';
  return 'Completed';
}

export function durationMin(b: Booking): number | null {
  if (b.startedAt == null || b.endedAt == null) return null;
  return Math.round((b.endedAt - b.startedAt) / MIN);
}

export const isShort = (b: Booking) => {
  const d = durationMin(b);
  return d != null && d < 30;
};

/* ---------- Attention ratio ---------- */

export function attentionRatio(now: number, bookings: Booking[]) {
  const today = bookings.filter((b) => sameDay(b.scheduledAt, now));
  const alerted = new Set(activeAlerts(now, today).map((a) => a.booking.id));
  const ongoing = today.filter((b) => b.status === 'in_progress');
  ongoing.forEach((b) => alerted.add(b.id));
  return { numerator: alerted.size, denominator: today.length };
}

/* ---------- Trainer availability for a slot ---------- */

export function trainerFreeAt(
  trainer: Trainer,
  service: Booking['service'],
  slot: number,
  bookings: Booking[],
  ignoreBookingId?: string,
): boolean {
  if (!trainer.services.includes(service)) return false;
  return !bookings.some(
    (b) =>
      b.id !== ignoreBookingId &&
      b.trainerId === trainer.id &&
      b.status !== 'cancelled' &&
      Math.abs(b.scheduledAt - slot) < 60 * MIN,
  );
}
