export type Service = 'physiotherapy' | 'training';

export type SessionStatus =
  | 'placed'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PastLabel = 'Completed' | 'Delayed' | 'Rescheduled' | 'Cancelled';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  age: number;
  address: string;
}

export interface Trainer {
  id: string;
  name: string;
  qualification: string;
  years: number;
  services: Service[];
}

export interface Assessment {
  goal: string;
  musclePower?: string;
  painLevel?: string;
  additionalFindings?: string;
  specialTests?: string;
}

export interface SessionLog {
  exercises: string[];
  equipment?: string[];
  handsOn?: string[];
}

export interface Closure {
  conclusion: string;
  recommendation: 'more_sessions' | 'single_sufficient';
  recommendationReason: string;
}

export interface Feedback {
  onTime: boolean;
  explainedClearly: boolean;
  feltHeard: boolean;
  text?: string;
}

export interface AuditEntry {
  at: number;
  actor: string;
  action: string;
}

export interface Booking {
  id: string;
  customerId: string;
  trainerId: string;
  service: Service;
  type: string;
  condition: string;
  address: string;
  note?: string;
  entryInstructions?: string;
  attachments?: string[];
  amount: number;

  scheduledAt: number;
  createdAt: number;

  status: SessionStatus;
  opsConfirmed: boolean;
  trainerConfirmed: boolean;
  confirmedAt?: number;

  startedAt?: number;
  endedAt?: number;
  universalOtpUsed?: boolean;

  rescheduledFrom?: number;
  cancelReason?: string;
  cancelledBy?: string;

  feedbackToken: string;

  assessment?: Assessment;
  sessionLog?: SessionLog;
  closure?: Closure;
  feedback?: Feedback;
  auditLog: AuditEntry[];
}

export type MessageTemplate =
  | 'booking_placed'
  | 'booking_confirmed'
  | 'provider_changed'
  | 'reminder_1h'
  | 'start_otp'
  | 'report'
  | 'feedback_link'
  | 'cancelled';

export interface Message {
  id: string;
  bookingId: string;
  customerId: string;
  at: number;
  template: MessageTemplate;
  body: string;
  link?: string;
  otp?: string;
}

export type SlackKind = 'new_lead' | 'unconfirmed' | 'not_started';

export interface SlackAlert {
  id: string;
  bookingId: string;
  at: number;
  kind: SlackKind;
  body: string;
}

export interface DemandProbe {
  id: string;
  at: number;
  condition: string;
  service: Service;
}

export type Role = 'site' | 'panel' | 'trainer';

export interface StoreState {
  now: number;
  role: Role;
  activeTrainerId: string;
  cookieCustomerId: string | null;
  customers: Customer[];
  trainers: Trainer[];
  bookings: Booking[];
  messages: Message[];
  slack: SlackAlert[];
  probes: DemandProbe[];
  /** bookingId -> last epoch an unconfirmed slack alert was emitted (repeat clock) */
  unconfirmedFiredAt: Record<string, number>;
  notStartedFired: Record<string, boolean>;
  seq: number;
}
