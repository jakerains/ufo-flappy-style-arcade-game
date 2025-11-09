import React from 'react'
import { Satellite, Sparkles } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 flex flex-col">
      {/* Background gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.05),transparent_60%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.08),transparent_65%)]"
      />
      {/* Starfield overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.20] mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148, 163, 253, 0.35) 1px, transparent 0)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 pt-5 md:pt-7">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.55)]">
            <Satellite className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.19em] text-slate-400">
              Cosmic Arcade Lab
            </span>
            <span className="text-sm md:text-base font-semibold bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
              Flappy UFO: Neon Run
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400">
          <Sparkles className="w-3 h-3 text-violet-300" />
          <span className="uppercase tracking-[0.16em]">
            Precision Physics • 60 FPS • Responsive
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-6 pt-2">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-6 md:px-10 pb-4 text-[9px] text-slate-500">
        <span>Tip: Hold or tap to hover your UFO. Don&apos;t touch the asteroids.</span>
        <span className="hidden sm:inline text-slate-600">
          Built for production-level polish. All visuals are pure React + Tailwind.
        </span>
      </footer>
    </div>
  )
}
