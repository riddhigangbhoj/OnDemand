import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useStore } from '../store/store';
import { cn } from '../shared/ui';

export function Layout() {
  const { state } = useStore();
  const navigate = useNavigate();
  const customer = state.customers.find((c) => c.id === state.cookieCustomerId);
  const firstName = customer?.name.split(' ')[0];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-semibold transition hover:text-pine-700 lg:text-[26px]',
      isActive ? 'text-ink' : 'text-ink',
    );

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-ink bg-paper/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8 lg:py-4">
          <Link to="/" className="flex items-baseline">
            <span className="font-display text-[24px] font-bold leading-none tracking-tight text-ink lg:text-[30px]">
              KINE<span className="text-orange-500">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-6 lg:gap-8">
            <nav className="hidden items-center gap-6 md:flex lg:gap-8">
              <NavLink to="/physiotherapy" className={navClass}>Physiotherapy</NavLink>
              <NavLink to="/physical-training" className={navClass}>Physical Training</NavLink>
              <NavLink to="/help" className={navClass}>Help</NavLink>
            </nav>
            <button
              onClick={() => navigate('/account')}
              className="flex items-center gap-1.5 rounded-full border border-ink bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:border-pine-300 lg:gap-2 lg:px-5 lg:py-2.5 lg:text-[26px]"
            >
              <User size={15} className="text-pine-600 lg:h-[18px] lg:w-[18px]" />
              {firstName ?? 'Your bookings'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-ink">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-ink lg:text-2xl">KINE<span className="text-orange-500">.</span></span>
            <span className="text-sm font-medium text-ink lg:text-[26px]">On-demand · Bengaluru</span>
          </div>
          <nav className="flex gap-5 text-sm font-medium text-ink lg:gap-7 lg:text-[26px]">
            <Link to="/physiotherapy" className="hover:text-ink">Physiotherapy</Link>
            <Link to="/physical-training" className="hover:text-ink">Training</Link>
            <Link to="/help" className="hover:text-ink">Help</Link>
            <Link to="/terms" className="hover:text-ink">Terms</Link>
          </nav>
        </div>
        <div className="mx-auto w-full max-w-7xl px-5 pb-8 text-xs leading-relaxed text-ink lg:px-8 lg:text-[26px]">
          A home physiotherapy &amp; training service by the KINE physiotherapy group. This is a
          prototype. No real payment, message, or booking is processed.
        </div>
      </footer>
    </div>
  );
}
