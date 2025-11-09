import React from 'react'
import type { GamePhase } from './GameShell'
import {
  MousePointer2,
  Smartphone,
  Keyboard,
  Sparkles,
  Rocket,
  Undo2,
} from 'lucide-react'

interface GameOverlayProps {
  phase: GamePhase
  lastScore: number
  onStart: () => void
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  phase,
  lastScore,
  onStart,
}) => {
  if (phase === 'running') return null

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="pointer-events-auto w-full max-w-xl">
        {phase === 'idle' && (
          <div className="mx-auto flex flex-col gap-4 px-5 py-4 rounded-3xl bg-slate-950/92 border border-slate-800/90 backdrop-blur-xl shadow-[0_18px_70px_rgba(15,23,42,0.96)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-[0.26em] text-cyan-400/90">
                  Mission Briefing
                </span>
                <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                  Pilot the Neon Saucer through asteroid corridors.
                </h1>
                <p className="text-[10px] text-slate-400">
                  This is a refined, production-grade Flappy-style experience. Glide with
                  precision, react fast, and chase your personal best across a living,
                  reactive starfield.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 text-[8px] text-slate-500">
                <span className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
                  v1.0 Cosmic Stable
                </span>
                <span>Optimized for smooth play</span>
                <span>Responsive • Keyboard, mouse &amp; touch</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[8px] text-slate-300">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/98 border border-slate-800/90">
                <MousePointer2 className="w-3 h-3 text-cyan-300" />
                <div className="flex flex-col leading-tight">
                  <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
                    Desktop
                  </span>
                  <span>Click or hold in the arena to thrust upward.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/98 border border-slate-800/90">
                <Keyboard className="w-3 h-3 text-violet-300" />
                <div className="flex flex-col leading-tight">
                  <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
                    Keyboard
                  </span>
                  <span>Tap Space or ArrowUp to pulse your boosters.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/98 border border-slate-800/90">
                <Smartphone className="w-3 h-3 text-emerald-300" />
                <div className="flex flex-col leading-tight">
                  <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
                    Mobile
                  </span>
                  <span>Touch &amp; hold anywhere on the arena to hover.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500/90 text-slate-950 text-xs font-semibold shadow-[0_0_40px_rgba(34,211,238,0.85)] hover:bg-cyan-400 transition-colors"
              >
                <Rocket className="w-4 h-4" />
                Begin First Flight
              </button>
              <div className="flex items-center gap-1 text-[8px] text-slate-500">
                <Sparkles className="w-3 h-3 text-violet-300" />
                <span>
                  Seamless parallax, tuned collisions, persistent best-score memory.
                </span>
              </div>
            </div>
          </div>
        )}

        {phase === 'paused' && (
          <div className="mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/96 border border-slate-800/90 backdrop-blur-xl text-[9px] text-slate-300">
            <div className="flex flex-col">
              <span className="uppercase tracking-[0.26em] text-[7px] text-cyan-400/90">
                Flight Paused
              </span>
              <span className="text-slate-400">
                Thrusters offline. Recenter your path, then tap Resume to re-enter the
                corridor.
              </span>
            </div>
            <div className="hidden sm:flex flex-col items-end text-[8px] text-slate-500">
              <span>Tip: Aim through the glowing slit, not at the towers.</span>
              <span>Short, rhythmic taps beat holding the thrust.</span>
            </div>
          </div>
        )}

        {phase === 'over' && (
          <div className="mx-auto flex flex-col gap-3 px-5 py-4 rounded-3xl bg-slate-950/96 border border-rose-900/70 backdrop-blur-xl shadow-[0_18px_70px_rgba(15,23,42,0.98)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-[0.26em] text-rose-400/90">
                  Impact Detected
                </span>
                <h2 className="text-base md:text-lg font-semibold text-rose-100">
                  Your saucer clipped the asteroid field.
                </h2>
                <p className="text-[10px] text-slate-400">
                  That run sharpened your instincts. Adjust your entry angle, manage your
                  thrust bursts, and dive back in to surpass your previous score.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end text-[8px] text-slate-500">
                <span className="px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-200">
                  Run Score: {lastScore}
                </span>
                <span>Each gap cleared = +1. Track and beat your personal record.</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-[8px] text-slate-400">
              <div className="flex flex-col">
                <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
                  Strategy Hints
                </span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Glide into the center of the beam-lit gaps.</li>
                  <li>Feather your thrust right before each corridor, don&apos;t spam.</li>
                  <li>Keep your eyes two obstacles ahead to smooth corrections.</li>
                </ul>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={onStart}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500/85 text-slate-950 text-[9px] font-semibold shadow-[0_0_30px_rgba(34,211,238,0.9)] hover:bg-cyan-400 transition-colors"
                >
                  <Rocket className="w-3 h-3" />
                  Launch Another Run
                </button>
                <div className="flex items-center gap-1 text-[7px] text-slate-500">
                  <Undo2 className="w-3 h-3 text-slate-500" />
                  <span>Instant restart, no friction. Perfect for high-volume play.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
