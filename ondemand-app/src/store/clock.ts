import {
  addDays,
  addHours,
  addMinutes,
  format,
  set,
  startOfDay,
  isSameDay,
} from 'date-fns';

export const WORK_START = 8;
export const WORK_END = 20;

/** Seed: an upcoming weekday at 10:00. Fixed date so demos are reproducible. */
export function seedNow(): number {
  // Monday, 11 May 2026, 10:00 local
  return new Date(2026, 4, 11, 10, 0, 0, 0).getTime();
}

export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export function advance(now: number, kind: '15m' | '1h' | '1d'): number {
  const d = new Date(now);
  if (kind === '15m') return addMinutes(d, 15).getTime();
  if (kind === '1h') return addHours(d, 1).getTime();
  return addDays(d, 1).getTime();
}

export function jumpTo(now: number, preset: 'evening' | 'next_morning'): number {
  const d = new Date(now);
  if (preset === 'evening') return set(d, { hours: 21, minutes: 0, seconds: 0, milliseconds: 0 }).getTime();
  // next morning 08:00
  return set(addDays(d, 1), { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }).getTime();
}

export function isAfterHours(now: number): boolean {
  const h = new Date(now).getHours();
  return h >= WORK_END || h < WORK_START;
}

export function isWorkingHours(now: number): boolean {
  return !isAfterHours(now);
}

export function dayStart(t: number): number {
  return startOfDay(new Date(t)).getTime();
}

export function sameDay(a: number, b: number): boolean {
  return isSameDay(new Date(a), new Date(b));
}

export const fmtTime = (t: number) => format(new Date(t), 'HH:mm');
export const fmtClock = (t: number) => format(new Date(t), 'EEE d MMM, HH:mm');
export const fmtDay = (t: number) => format(new Date(t), 'EEE, d MMM');
export const fmtDayLong = (t: number) => format(new Date(t), 'EEEE, d MMMM yyyy');
export const fmtDateShort = (t: number) => format(new Date(t), 'd MMM');
export const fmtTileDay = (t: number) => format(new Date(t), 'EEE');
export const fmtTileDate = (t: number) => format(new Date(t), 'd MMM');
