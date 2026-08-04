import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

// TODO: set the WhatsApp business link (e.g. https://wa.me/<number>) before launch.
export const WHATSAPP_HELP = '#';

export function WhatsAppIcon({ size = 17, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.06 8.06 0 0 1 2.37 5.73c0 4.47-3.64 8.11-8.11 8.11a8.08 8.08 0 0 1-4.12-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.05 8.05 0 0 1-1.24-4.29c0-4.47 3.64-8.11 8.11-8.11Zm-2.7 4.35c-.15 0-.4.06-.6.28-.21.22-.79.77-.79 1.88s.81 2.18.92 2.33c.11.15 1.57 2.4 3.81 3.36.53.23.95.37 1.27.47.53.17 1.02.15 1.4.09.43-.06 1.31-.54 1.5-1.06.19-.52.19-.96.13-1.06-.06-.09-.21-.15-.44-.26-.23-.11-1.31-.65-1.51-.72-.2-.07-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.17-.48.06-.23-.11-.95-.35-1.81-1.11-.67-.6-1.12-1.33-1.25-1.56-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.21-.69-1.66-.18-.44-.37-.38-.5-.39-.13-.01-.28-.01-.43-.01Z" />
    </svg>
  );
}

type Variant = 'primary' | 'clay' | 'ghost' | 'danger' | 'soft' | 'dark';
const variants: Record<Variant, string> = {
  primary: 'bg-forest-700 text-surface hover:bg-forest-800 shadow-[0_8px_24px_-12px_rgba(20,51,39,0.6)]',
  clay: 'bg-clay-500 text-surface hover:bg-clay-600 shadow-[0_8px_24px_-12px_rgba(176,85,47,0.7)]',
  ghost: 'bg-transparent text-ink border border-line-strong hover:border-forest-500 hover:bg-forest-50/50',
  danger: 'bg-rust-500 text-surface hover:bg-rust-600',
  soft: 'bg-forest-50 text-forest-700 hover:bg-forest-100 border border-forest-100',
  dark: 'bg-ink text-canvas hover:bg-forest-900',
};

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'group/btn inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-body font-semibold tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-line bg-surface shadow-[0_1px_2px_rgba(26,38,33,0.04),0_18px_40px_-28px_rgba(26,38,33,0.22)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type Tone = 'forest' | 'clay' | 'sage' | 'neutral' | 'ink' | 'rust';
const tones: Record<Tone, string> = {
  forest: 'bg-forest-50 text-forest-700 ring-forest-100',
  clay: 'bg-clay-50 text-clay-700 ring-clay-100',
  sage: 'bg-sage-100 text-forest-700 ring-sage-200',
  neutral: 'bg-surface-2 text-ink-soft ring-line-strong',
  ink: 'bg-ink text-canvas ring-ink',
  rust: 'bg-rust-50 text-rust-600 ring-rust-500/25',
};

export function Pill({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-fine font-semibold uppercase tracking-[0.14em] ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  className,
  ...rest
}: { label?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-fine font-semibold uppercase tracking-[0.1em] text-ink-soft">{label}</span>}
      <input
        className={cn(
          'w-full rounded-2xl border border-line-strong bg-surface px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-soft/45 focus:border-forest-500 focus:ring-4 focus:ring-forest-500/12',
          className,
        )}
        {...rest}
      />
      {hint && <span className="mt-1.5 block text-fine text-ink-soft">{hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  className,
  ...rest
}: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-fine font-semibold uppercase tracking-[0.1em] text-ink-soft">{label}</span>}
      <textarea
        className={cn(
          'w-full resize-none rounded-2xl border border-line-strong bg-surface px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-soft/45 focus:border-forest-500 focus:ring-4 focus:ring-forest-500/12',
          className,
        )}
        {...rest}
      />
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-forest-900/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className={cn(
          'animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-7 py-5 backdrop-blur">
            <h3 className="font-display text-title font-medium text-ink">{title}</h3>
            <button onClick={onClose} className="rounded-full p-2 text-ink-soft transition hover:bg-surface-2 hover:text-ink">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-10 rounded-full bg-surface/80 p-2 text-ink-soft transition hover:bg-surface-2 hover:text-ink"
          >
            <X size={18} />
          </button>
        )}
        <div className="p-7 sm:p-9">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name, tone }: { name: string; tone?: string }) {
  const initials = name
    .replace(/^Dr\.?\s*/, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const palette = ['#23553f', '#b0552f', '#2f6b4f', '#8f4526', '#5d675f', '#1a4231'];
  const bg = tone ?? palette[initials.charCodeAt(0) % palette.length];
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-body font-semibold text-surface"
      style={{ background: bg }}
    >
      {initials}
    </span>
  );
}
