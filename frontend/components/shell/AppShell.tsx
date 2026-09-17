import type { ReactNode } from "react";

import { AppHeader } from "@/components/shell/AppHeader";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-cyan-200 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-xl transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <AppHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-5 outline-none sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
