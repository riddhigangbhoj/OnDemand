import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

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
