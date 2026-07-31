import { fmtDay, fmtTime } from './clock';
import type { Booking, Customer, MessageTemplate, Trainer } from './types';

interface Ctx {
  booking: Booking;
  trainer: Trainer;
  customer: Customer;
  reason?: string;
  code?: string;
}

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function renderMessage(
  template: MessageTemplate,
  ctx: Ctx,
): { body: string; link?: string; otp?: string } {
  const { booking: b, trainer: t } = ctx;
  const date = fmtDay(b.scheduledAt);
  const time = fmtTime(b.scheduledAt);
  const firstName = ctx.customer.name.split(' ')[0];
  const serviceLabel = b.service === 'training' ? 'physical training' : 'physiotherapy';
  const feedbackLink = `/feedback/${b.feedbackToken}`;

  switch (template) {
    case 'booking_placed':
      return {
        body: `Hi ${firstName}, this is a confirmation message from KINE. Your ${serviceLabel} session on ${date} at ${time} is booked. We are now confirming your trainer and will update you here shortly. Please feel free to reply here for any query.`,
      };
    case 'booking_confirmed':
      return {
        body: `Confirmed. ${t.name}, ${t.qualification}, ${t.years} years, will visit on ${date} at ${time} at ${b.address}. Amount paid ${money(b.amount)}.`,
      };
    case 'provider_changed':
      return {
        body: `Update: your session is now with ${t.name} on ${date} at ${time}. Reason: ${ctx.reason ?? '—'}.`,
      };
    case 'reminder_1h':
      return { body: `Reminder: ${t.name} arrives at ${time} today.` };
    case 'start_otp':
      return {
        body: `Your session code is ${ctx.code}. Share it with ${t.name} at the door.`,
        otp: ctx.code,
      };
    case 'report':
      return { body: `Your session report is ready.`, link: feedbackLink };
    case 'feedback_link':
      return { body: `How was your session?`, link: feedbackLink };
    case 'cancelled':
      return {
        body: `Your session on ${date} at ${time} is cancelled. Reason: ${ctx.reason ?? '—'}. Refund follows per our terms.`,
      };
  }
}
