import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

type Variant = 'primary' | 'ghost' | 'danger' | 'soft' | 'dark';
const variants: Record<Variant, string> = {
  primary: 'bg-pine-600 text-white hover:bg-pine-700 shadow-sm',
  ghost: 'bg-transparent text-ink hover:bg-black/[0.05] border border-ink',
  danger: 'bg-coral-500 text-white hover:bg-coral-600 shadow-sm',
  soft: 'bg-pine-50 text-pine-700 hover:bg-pine-100 border border-pine-100',
  dark: 'bg-ink text-paper hover:bg-ink/90',
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
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] lg:px-5 lg:py-3 lg:text-[26px]',
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
      className={cn('rounded-2xl border border-ink bg-white shadow-[0_1px_2px_rgba(27,26,22,0.04)]', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

type Tone = 'pine' | 'coral' | 'amber' | 'neutral' | 'ink' | 'blue';
const tones: Record<Tone, string> = {
  pine: 'bg-pine-50 text-pine-700 ring-pine-100',
  coral: 'bg-coral-50 text-coral-600 ring-coral-500/20',
  amber: 'bg-orange-50 text-orange-700 ring-orange-500/20',
  neutral: 'bg-paper-2 text-ink ring-ink/15',
  ink: 'bg-ink text-paper ring-ink',
  blue: 'bg-[#e8f0fb] text-[#2b5fa8] ring-[#b9d0ee]',
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
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
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
      {label && <span className="mb-1.5 block text-sm font-medium text-ink lg:text-[26px]">{label}</span>}
      <input
        className={cn(
          'w-full rounded-xl border border-ink bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/50 lg:px-4 lg:py-4 lg:text-[26px] focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20',
          className,
        )}
        {...rest}
      />
      {hint && <span className="mt-1 block text-xs text-ink lg:mt-2 lg:text-[26px]">{hint}</span>}
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
      {label && <span className="mb-1.5 block text-sm font-medium text-ink lg:text-[26px]">{label}</span>}
      <textarea
        className={cn(
          'w-full resize-none rounded-xl border border-ink bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/50 lg:px-4 lg:py-4 lg:text-[26px] focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20',
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6 lg:p-10" onClick={onClose}>
      <div
        className={cn(
          'animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-paper shadow-2xl sm:rounded-3xl',
          wide ? 'sm:max-w-3xl lg:max-w-4xl' : 'sm:max-w-lg lg:max-w-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink bg-paper/95 px-5 py-4 backdrop-blur lg:px-10 lg:py-6">
            <h3 className="font-display text-xl font-semibold text-ink lg:text-[2rem]">{title}</h3>
            <button onClick={onClose} className="rounded-full p-1.5 text-ink hover:bg-black/5">
              <X size={18} className="lg:h-7 lg:w-7" />
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-ink hover:bg-black/5 lg:right-7 lg:top-7">
            <X size={20} className="lg:h-8 lg:w-8" />
          </button>
        )}
        <div className="p-6 lg:p-12">{children}</div>
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
  const palette = ['#158066', '#2b5fa8', '#c97a12', '#a23f6f', '#5b7f2b', '#c93a35'];
  const bg = tone ?? palette[initials.charCodeAt(0) % palette.length];
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
      style={{ background: bg }}
    >
      {initials}
    </span>
  );
}
