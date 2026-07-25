import { seedNow, MIN } from './clock';
import { renderMessage } from './templates';
import type {
  Booking,
  Customer,
  Message,
  SlackAlert,
  StoreState,
  Trainer,
} from './types';

const NOW = seedNow();

function day(offset: number, hour: number, min = 0): number {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, min, 0, 0);
  return d.getTime();
}

const trainers: Trainer[] = [
  { id: 'tr1', name: 'Dr. Neha Sharma', qualification: 'BPT', years: 6, services: ['physiotherapy'] },
  { id: 'tr2', name: 'Dr. Rajan Iyer', qualification: 'MPT (Ortho)', years: 9, services: ['physiotherapy'] },
  { id: 'tr3', name: 'Arjun Menon', qualification: 'CSCS', years: 5, services: ['training'] },
  { id: 'tr4', name: 'Dr. Kavya Rao', qualification: 'BPT, Strength Cert', years: 7, services: ['physiotherapy', 'training'] },
];

const customers: Customer[] = [
  { id: 'c1', name: 'Aman Verma', phone: '+91 98450 11234', age: 34, address: '12, 4th Cross, Indiranagar, Bengaluru 560038' },
  { id: 'c2', name: 'Priya Nair', phone: '+91 99805 22456', age: 29, address: '402, Prestige Acropolis, Koramangala, Bengaluru 560034' },
  { id: 'c3', name: 'Rohit Shetty', phone: '+91 97400 33678', age: 41, address: '88, Sarjapur Road, Bengaluru 560103' },
  { id: 'c4', name: 'Sneha Reddy', phone: '+91 90360 44890', age: 36, address: '27, HSR Layout Sector 2, Bengaluru 560102' },
  { id: 'c5', name: 'Vikram Rao', phone: '+91 88670 55012', age: 52, address: '5, Jayanagar 4th Block, Bengaluru 560011' },
  { id: 'c6', name: 'Ananya Iyer', phone: '+91 95910 66234', age: 27, address: '19, Whitefield Main Road, Bengaluru 560066' },
  { id: 'c7', name: 'Karthik Menon', phone: '+91 98860 77456', age: 45, address: '301, JP Nagar 6th Phase, Bengaluru 560076' },
  { id: 'c8', name: 'Divya Kulkarni', phone: '+91 99165 88678', age: 31, address: '7, Koramangala 8th Block, Bengaluru 560095' },
  { id: 'c9', name: 'Suresh Babu', phone: '+91 94480 99890', age: 58, address: '44, BTM 2nd Stage, Bengaluru 560068' },
];

let seq = 0;
const bid = () => `b${++seq}`;

interface Draft {
  id?: string;
  customerId: string;
  trainerId: string;
  service: Booking['service'];
  type: string;
  condition: string;
  scheduledAt: number;
  createdAt: number;
  amount?: number;
  status: Booking['status'];
  opsConfirmed?: boolean;
  trainerConfirmed?: boolean;
  confirmedAt?: number;
  startedAt?: number;
  endedAt?: number;
  rescheduledFrom?: number;
  cancelReason?: string;
  cancelledBy?: string;
  goal?: string;
  recommendation?: 'more_sessions' | 'single_sufficient';
  note?: string;
}

function make(d: Draft): Booking {
  const id = d.id ?? bid();
  const c = customers.find((x) => x.id === d.customerId)!;
  const t = trainers.find((x) => x.id === d.trainerId)!;
  const amount = d.amount ?? (d.service === 'physiotherapy' ? 1299 : 1099);
  const audit: Booking['auditLog'] = [
    { at: d.createdAt, actor: 'system', action: 'lead created' },
  ];
  if (d.confirmedAt) {
    audit.push({ at: d.confirmedAt - 40 * MIN, actor: t.name, action: 'confirmed lead' });
    audit.push({ at: d.confirmedAt, actor: 'Riddhi (ops)', action: 'confirmed lead' });
  }
  if (d.rescheduledFrom) audit.push({ at: d.createdAt + 60 * MIN, actor: 'Riddhi (ops)', action: 'rescheduled' });
  if (d.startedAt) audit.push({ at: d.startedAt, actor: t.name, action: 'started session' });
  if (d.cancelReason) audit.push({ at: (d.scheduledAt - 30 * MIN), actor: 'Riddhi (ops)', action: `cancelled: ${d.cancelReason}` });

  const completed = d.status === 'completed';
  return {
    id,
    customerId: d.customerId,
    trainerId: d.trainerId,
    service: d.service,
    type: d.type,
    condition: d.condition,
    address: c.address,
    note: d.note,
    amount,
    scheduledAt: d.scheduledAt,
    createdAt: d.createdAt,
    status: d.status,
    opsConfirmed: d.opsConfirmed ?? false,
    trainerConfirmed: d.trainerConfirmed ?? false,
    confirmedAt: d.confirmedAt,
    startedAt: d.startedAt,
    endedAt: d.endedAt,
    rescheduledFrom: d.rescheduledFrom,
    cancelReason: d.cancelReason,
    cancelledBy: d.cancelledBy,
    feedbackToken: `fb-${id}`,
    assessment: completed
      ? { goal: d.goal ?? 'Reduce pain and restore range', musclePower: '4/5', painLevel: '3/10', specialTests: 'SLR negative' }
      : undefined,
    sessionLog: completed
      ? { exercises: ['Glute bridge', 'Bird dog', 'Cat–cow'], equipment: ['Yoga mat', 'Resistance band, medium'], handsOn: ['Soft-tissue release'] }
      : undefined,
    closure: completed
      ? {
          conclusion: 'Responded well, cleared to progress load gradually.',
          recommendation: d.recommendation ?? 'more_sessions',
          recommendationReason:
            d.recommendation === 'single_sufficient'
              ? 'Single visit resolved the acute complaint.'
              : 'Needs 3–4 more sessions to consolidate strength gains.',
        }
      : undefined,
    auditLog: audit,
  };
}

/* ---- active today ---- */
const active: Booking[] = [
  make({ customerId: 'c2', trainerId: 'tr1', service: 'physiotherapy', type: 'Orthopaedic', condition: 'back-pain', scheduledAt: day(0, 9, 30), createdAt: day(-1, 14), status: 'in_progress', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-1, 16), startedAt: day(0, 9, 30), note: 'Lower back stiff since a long drive.' }),
  make({ customerId: 'c1', trainerId: 'tr2', service: 'physiotherapy', type: 'Spine', condition: 'sciatica-flare', scheduledAt: day(0, 9), createdAt: day(-1, 12), status: 'in_progress', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-1, 15), startedAt: day(0, 9, 8), note: 'Shooting pain down the right leg.' }),
  make({ customerId: 'c4', trainerId: 'tr4', service: 'physiotherapy', type: 'Orthopaedic', condition: 'knee-pain', scheduledAt: day(0, 9, 45), createdAt: day(-1, 19), status: 'confirmed', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-1, 20), note: 'Knee gives way on stairs.' }),
  make({ customerId: 'c6', trainerId: 'tr3', service: 'training', type: 'Form & Technique', condition: 'form-check', scheduledAt: day(0, 14), createdAt: day(0, 9, 30), status: 'placed', opsConfirmed: false, trainerConfirmed: true, note: 'Want a check on my squat and deadlift.' }),
  make({ customerId: 'c3', trainerId: 'tr1', service: 'physiotherapy', type: 'Orthopaedic', condition: 'neck-desk', scheduledAt: day(0, 16), createdAt: NOW - 130 * MIN, status: 'placed', note: 'Neck locks up by afternoon at my desk.' }),
  make({ customerId: 'c5', trainerId: 'tr2', service: 'physiotherapy', type: 'Orthopaedic', condition: 'shoulder-pain', scheduledAt: day(1, 11), createdAt: day(-1, 18), status: 'placed', rescheduledFrom: day(1, 9), note: 'Cannot lift arm overhead.' }),
];

/* ---- past: Suresh (c9) 7-session arthritis history ---- */
const suresh: Booking[] = [28, 24, 20, 16, 12, 8, 4].map((d, i) =>
  make({
    customerId: 'c9', trainerId: 'tr2', service: 'physiotherapy', type: 'Chronic', condition: 'arthritis',
    scheduledAt: day(-d, 11), createdAt: day(-d - 1, 15), status: 'completed',
    opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-d - 1, 17),
    startedAt: day(-d, 11), endedAt: day(-d, 11, 48),
    goal: 'Manage knee arthritis, maintain walking distance',
    recommendation: i === 6 ? 'more_sessions' : 'more_sessions',
    note: 'Both knees ache in the mornings.',
  }),
);

/* ---- other past ---- */
const otherPast: Booking[] = [
  make({ customerId: 'c1', trainerId: 'tr1', service: 'physiotherapy', type: 'Orthopaedic', condition: 'back-pain', scheduledAt: day(-6, 10), createdAt: day(-7, 12), status: 'completed', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-7, 14), startedAt: day(-6, 10, 3), endedAt: day(-6, 10, 53), recommendation: 'single_sufficient' }),
  make({ customerId: 'c2', trainerId: 'tr1', service: 'physiotherapy', type: 'Orthopaedic', condition: 'neck-desk', scheduledAt: day(-9, 15), createdAt: day(-10, 9), status: 'completed', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-10, 11), startedAt: day(-9, 15, 22), endedAt: day(-9, 16, 7), recommendation: 'more_sessions' }),
  make({ customerId: 'c7', trainerId: 'tr4', service: 'physiotherapy', type: 'Orthopaedic', condition: 'spasm', scheduledAt: day(-3, 18), createdAt: day(-4, 20), status: 'completed', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-4, 21), startedAt: day(-3, 18), endedAt: day(-3, 18, 22), recommendation: 'single_sufficient' }),
  make({ customerId: 'c8', trainerId: 'tr4', service: 'physiotherapy', type: 'Orthopaedic', condition: 'knee-pain', scheduledAt: day(-5, 12), createdAt: day(-6, 10), status: 'cancelled', opsConfirmed: true, trainerConfirmed: true, cancelReason: 'no show', cancelledBy: 'Riddhi (ops)' }),
  make({ customerId: 'c6', trainerId: 'tr3', service: 'training', type: 'Assessment', condition: 'mobility-screen', scheduledAt: day(-7, 17), createdAt: day(-8, 13), status: 'cancelled', opsConfirmed: false, trainerConfirmed: true, cancelReason: 'customer request', cancelledBy: 'Riddhi (ops)' }),
  make({ customerId: 'c4', trainerId: 'tr2', service: 'physiotherapy', type: 'Orthopaedic', condition: 'shoulder-pain', scheduledAt: day(-11, 9), createdAt: day(-13, 14), status: 'completed', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-13, 16), startedAt: day(-11, 9, 4), endedAt: day(-11, 9, 52), rescheduledFrom: day(-12, 9), recommendation: 'more_sessions' }),
  make({ customerId: 'c3', trainerId: 'tr3', service: 'training', type: 'Form & Technique', condition: 'form-check', scheduledAt: day(-2, 8), createdAt: day(-3, 19), status: 'completed', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-3, 20), startedAt: day(-2, 8, 2), endedAt: day(-2, 8, 57), recommendation: 'single_sufficient' }),
  make({ customerId: 'c5', trainerId: 'tr4', service: 'training', type: 'Beginner', condition: 'first-workout', scheduledAt: day(-8, 19), createdAt: day(-9, 11), status: 'completed', opsConfirmed: true, trainerConfirmed: true, confirmedAt: day(-9, 13), startedAt: day(-8, 19, 1), endedAt: day(-8, 19, 41), recommendation: 'more_sessions' }),
];

const bookings = [...active, ...suresh, ...otherPast];

/* ---- seed messages & slack for active bookings ---- */
const messages: Message[] = [];
const slack: SlackAlert[] = [];
let mseq = 0;
let sseq = 0;

for (const b of active) {
  const c = customers.find((x) => x.id === b.customerId)!;
  const t = trainers.find((x) => x.id === b.trainerId)!;
  const placed = renderMessage('booking_placed', { booking: b, trainer: t, customer: c });
  messages.push({ id: `m${++mseq}`, bookingId: b.id, customerId: b.customerId, at: b.createdAt, template: 'booking_placed', body: placed.body });

  const area = b.address.split(',').slice(-2, -1)[0]?.trim() ?? 'Bengaluru';
  slack.push({
    id: `s${++sseq}`,
    bookingId: b.id,
    at: b.createdAt,
    kind: 'new_lead',
    body: `New on-demand lead: ${c.name}, ${b.service === 'training' ? 'training' : 'physio'} ${b.type}, ${new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${new Date(b.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}, ${area}, ₹${b.amount.toLocaleString('en-IN')}`,
  });

  if (b.opsConfirmed && b.trainerConfirmed && b.confirmedAt) {
    const conf = renderMessage('booking_confirmed', { booking: b, trainer: t, customer: c });
    messages.push({ id: `m${++mseq}`, bookingId: b.id, customerId: b.customerId, at: b.confirmedAt, template: 'booking_confirmed', body: conf.body });
  }
  if (b.status === 'in_progress' && b.startedAt) {
    const otp = renderMessage('start_otp', { booking: b, trainer: t, customer: c, code: '482913' });
    messages.push({ id: `m${++mseq}`, bookingId: b.id, customerId: b.customerId, at: b.startedAt, template: 'start_otp', body: otp.body, otp: '482913' });
  }
}

export function makeSeedState(): StoreState {
  return {
    now: NOW,
    role: 'site',
    activeTrainerId: 'tr1',
    cookieCustomerId: null,
    customers,
    trainers,
    bookings,
    messages,
    slack,
    probes: [],
    unconfirmedFiredAt: {},
    notStartedFired: {},
    seq: 1000,
  };
}
