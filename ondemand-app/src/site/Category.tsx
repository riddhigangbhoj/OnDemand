import { Link } from 'react-router-dom';
import { Activity, Dumbbell, ArrowUpRight } from 'lucide-react';
import { SERVICE_META, SERVICE_CARDS } from '../store/catalog';
import { useStore } from '../store/store';
import { asset } from '../shared/asset';
import { LoginProfile } from './LoginProfile';
import { useState } from 'react';
import type { Service } from '../store/types';

function CardImg({ slug, label, note }: { slug: string; label: string; note?: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="relative overflow-hidden">
      {note && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-clay-500 px-3 py-1 text-fine font-semibold uppercase tracking-[0.1em] text-surface shadow-lg">
          Popular
        </span>
      )}
      {broken ? (
        <div className="tile-placeholder relative grid aspect-[16/10] w-full place-items-center overflow-hidden">
          <div className="grain-dark" />
          <span className="relative font-display text-body font-medium text-surface/90">{label}</span>
        </div>
      ) : (
        <img
          src={asset(`conditions/${slug}.jpg`)}
          alt={label}
          className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}

export function Category({ service }: { service: Service }) {
  const { state } = useStore();
  const meta = SERVICE_META[service];
  const loggedIn = !!state.cookieCustomerId;
  const Icon = service === 'physiotherapy' ? Activity : Dumbbell;

  if (!loggedIn) {
    return (
      <div className="mx-auto grid w-full max-w-[1440px] gap-0 lg:min-h-[calc(100dvh-73px)] lg:grid-cols-2">
        {/* brand panel */}
        <div className="mesh-forest dotgrid contours relative flex flex-col justify-center overflow-hidden px-8 py-16 text-surface lg:rounded-r-[2.5rem] lg:px-14">
          <div className="grain-dark" />
          <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 text-clay-500/25 glow floaty" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 text-forest-500/40 glow" aria-hidden />
          <div className="relative z-10">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface/10 text-butter ring-1 ring-inset ring-surface/15">
              <Icon size={30} strokeWidth={1.6} />
            </span>
            <h1 className="mt-6 max-w-md font-display text-heading font-medium leading-[1.05] tracking-tight lg:text-display">
              {meta.gate}
            </h1>
          </div>
        </div>

        {/* login */}
        <div className="flex items-center justify-center px-6 py-14 lg:px-14">
          <div className="w-full max-w-md">
            <LoginProfile heading="Log in to continue" cta="Browse sessions" onDone={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10 lg:py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-4 max-w-xl font-display text-heading font-medium leading-[1.05] tracking-tight text-ink lg:text-display">
            {meta.hub}
          </h1>
        </div>
      </div>

      <div className="stagger mt-12 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_CARDS[service].map((c) => (
          <Link
            key={c.slug}
            to={`/${meta.path}/${c.slug}`}
            className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_2px_rgba(26,38,33,0.04),0_22px_46px_-32px_rgba(26,38,33,0.3)] transition hover:-translate-y-1 hover:border-forest-200"
          >
            <CardImg slug={c.slug} label={c.label} note={c.note} />
            <div className="flex items-center justify-between gap-3 px-6 py-5">
              <span className="font-display text-title font-medium text-ink">{c.label}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-4 py-2 text-fine font-semibold text-forest-700 transition group-hover:bg-forest-600 group-hover:text-surface">
                Book <ArrowUpRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
