import type { ReactNode } from 'react';

/** Centres a mobile surface inside a phone bezel on wide screens. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full justify-center bg-[#1d1e1f] px-0 py-0 sm:px-6 sm:py-8">
      <div className="relative w-full max-w-[420px] bg-paper sm:rounded-[2.4rem] sm:border-[10px] sm:border-[#0f0f0d] sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="hidden sm:block">
          <div className="absolute left-1/2 top-2 z-20 h-6 w-32 -translate-x-1/2 rounded-full bg-[#0f0f0d]" />
        </div>
        <div className="min-h-[100dvh] overflow-hidden sm:min-h-[860px] sm:rounded-[1.8rem]">
          {children}
        </div>
      </div>
    </div>
  );
}
