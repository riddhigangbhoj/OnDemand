import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useStore } from '../store/store';
import { cn } from '../shared/ui';

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display font-semibold leading-none tracking-tight', className)}>
      Kine<span className="text-clay-500">.</span>
    </span>
  );
}

export function Layout() {
  const { state } = useStore();
  const navigate = useNavigate();
  const customer = state.customers.find((c) => c.id === state.cookieCustomerId);
  const firstName = customer?.name.split(' ')[0];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative text-body font-medium text-ink-soft transition-colors hover:text-ink',
      isActive && 'text-ink',
    );

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <Link to="/" className="flex items-baseline">
            <Wordmark className="text-title" />
          </Link>

          <div className="flex items-center gap-7 lg:gap-9">
            <nav className="hidden items-center gap-8 md:flex">
              {[
                { to: '/physiotherapy', label: 'Physiotherapy' },
                { to: '/physical-training', label: 'Physical Training' },
                { to: '/help', label: 'Help' },
              ].map((l) => (
                <NavLink key={l.to} to={l.to} className={navClass}>
                  {({ isActive }) => (
                    <>
                      {l.label}
                      <span
                        className={cn(
                          'absolute -bottom-1.5 left-0 h-[2px] w-full origin-left rounded-full bg-clay-500 transition-transform duration-300',
                          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                        )}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => navigate('/account')}
              className="flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-fine font-semibold text-ink transition hover:border-forest-500 hover:shadow-[0_8px_20px_-14px_rgba(20,51,39,0.5)]"
            >
              <User size={15} className="text-forest-600" />
              {firstName ?? 'Your bookings'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="relative mt-24 overflow-hidden bg-forest-800 text-forest-50/85">
        <div className="grain-dark" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 text-clay-500/20 glow" aria-hidden />
        <div className="relative mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10">
          <div className="flex flex-col gap-10 border-b border-forest-50/12 pb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <Wordmark className="text-heading text-surface" />
              <p className="mt-4 max-w-sm text-body leading-relaxed text-forest-50/70">
                Same-day physiotherapy and physical training, delivered to your door across Bengaluru.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-body font-medium">
              <Link to="/physiotherapy" className="transition hover:text-surface">Physiotherapy</Link>
              <Link to="/physical-training" className="transition hover:text-surface">Training</Link>
              <Link to="/help" className="transition hover:text-surface">Help</Link>
              <Link to="/terms" className="transition hover:text-surface">Terms</Link>
            </nav>
          </div>
          <div className="mt-8 flex flex-col gap-3 text-fine text-forest-50/55 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Kinetic Age · Bengaluru</span>
            <span className="max-w-xl">
              A home physiotherapy &amp; training service by the KINE physiotherapy group. Prototype — no real
              payment, message, or booking is processed.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
