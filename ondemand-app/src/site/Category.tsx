import { Link } from 'react-router-dom';
import { Activity, Dumbbell } from 'lucide-react';
import { PRICE, SERVICE_META, SERVICE_CARDS } from '../store/catalog';
import { useStore } from '../store/store';
import { Card } from '../shared/ui';
import { asset } from '../shared/asset';
import { LoginProfile } from './LoginProfile';
import type { Service } from '../store/types';

export function Category({ service }: { service: Service }) {
  const { state } = useStore();
  const meta = SERVICE_META[service];
  const loggedIn = !!state.cookieCustomerId;

  if (!loggedIn) {
    return (
      <div>
        {/* banner — decorated brand band on top (desktop) */}
        <div className="relative hidden h-[36rem] w-full overflow-hidden bg-gradient-to-br from-pine-700 via-pine-700 to-blue-700 lg:block">
          <div className="grain-light pointer-events-none absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-orange-500/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" aria-hidden />
          <div className="absolute inset-0 grid place-items-center">
            {service === 'physiotherapy'
              ? <Activity className="h-44 w-44 text-white/20" strokeWidth={1.5} />
              : <Dumbbell className="h-44 w-44 text-white/20" strokeWidth={1.5} />}
          </div>
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[15px] lg:text-[26px] font-semibold uppercase tracking-[0.2em] text-white/75">
            {meta.title} · Same-day at home
          </span>
        </div>

        {/* heading + login below */}
        <div className="mx-auto w-full max-w-md px-5 py-10 lg:max-w-3xl lg:py-14 lg:text-center">
          <h1 className="font-display text-[2rem] font-semibold leading-tight text-ink sm:text-[2.5rem] lg:text-[3.6rem] lg:leading-[1.04]">
            {meta.gate}
          </h1>
          <p className="mt-3 text-[16px] text-ink lg:mx-auto lg:mt-4 lg:max-w-xl lg:text-[26px]">
            Starting at <span className="font-semibold text-ink">₹{PRICE[service].toLocaleString('en-IN')}</span>, at
            your home, same day.
          </p>
          <Card className="mt-8 w-full p-6 text-left sm:p-7 lg:mx-auto lg:mt-10 lg:max-w-lg lg:p-10">
            <LoginProfile heading="Login to continue" cta="Browse sessions" onDone={() => {}} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 lg:max-w-7xl lg:px-8 lg:py-16">
      <div>
        <h1 className="font-display text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.35rem] lg:whitespace-nowrap lg:text-[3.4rem]">
          {meta.hub}
        </h1>
      </div>

      {/* conditions */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-10 lg:grid-cols-2 lg:gap-6">
        {SERVICE_CARDS[service].map((c) => (
          <Link
            key={c.slug}
            to={`/${meta.path}/${c.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-ink bg-white transition hover:border-pine-300 hover:shadow-[0_10px_30px_-16px_rgba(20,107,85,0.4)]"
          >
            <div className="relative">
              {c.note && (
                <div className="absolute inset-x-0 top-0 bg-orange-500 px-2.5 py-1 text-[11px] font-semibold leading-snug text-white lg:px-4 lg:py-2 lg:text-[26px]">
                  {c.note}
                </div>
              )}
              <img
                src={asset(c.img)}
                alt={c.label}
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105 lg:aspect-[16/9]"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 lg:px-6 lg:py-5">
              <span className="text-[15px] font-bold text-ink lg:text-[26px]">{c.label}</span>
              <span className="hidden shrink-0 rounded-xl bg-pine-600 px-6 py-3 text-[16px] font-bold text-white transition group-hover:bg-pine-700 lg:inline-block lg:text-[26px]">Book</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
