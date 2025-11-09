import React, { useState, useCallback } from 'react'
import { Pause, Play, RefreshCw, Rocket, Info, Stars } from 'lucide-react'
import { GameCanvas } from './GameCanvas'
import { HUD } from './HUD'
import { GameOverlay } from './GameOverlay'

export type GamePhase = 'idle' | 'running' | 'paused' | 'over'

export interface GameStats {
  score: number
  bestScore: number
  distance: number
  runs: number
}

const createInitialStats = (): GameStats => {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem('ufo-flappy-best') : null
  const best = stored ? Number.parseInt(stored) || 0 : 0
  return {
    score: 0,
    bestScore: best,
    distance: 0,
    runs: 0,
  }
}

export const GameShell: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [stats, setStats] = useState<GameStats>(() => createInitialStats())
  const [lastScore, setLastScore] = useState(0)

  const updateStats = useCallback(
    (patch: Partial<GameStats>) => {
      setStats(prev => {
        const next = { ...prev, ...patch }
        if (next.bestScore !== prev.bestScore && typeof window !== 'undefined') {
          window.localStorage.setItem('ufo-flappy-best', String(next.bestScore))
        }
        return next
      })
    },
    [],
  )

  const handleStart = useCallback(() => {
    setPhase('running')
    setLastScore(0)
    updateStats({ score: 0, distance: 0, runs: stats.runs + 1 })
  }, [updateStats, stats.runs])

  const handlePauseToggle = useCallback(() => {
    setPhase(prev => (prev === 'running' ? 'paused' : prev === 'paused' ? 'running' : prev))
  }, [])

  const handleGameOver = useCallback(
    (score: number, distance: number) => {
      setPhase('over')
      setLastScore(score)
      setStats(prev => ({
        ...prev,
        score,
        distance,
        bestScore: score > prev.bestScore ? score : prev.bestScore,
      }))
    },
    [],
  )

  const handleRestart = useCallback(() => {
    setPhase('running')
    setLastScore(0)
    updateStats({ score: 0, distance: 0 })
  }, [updateStats])

  return (
    <section className="w-full max-w-5xl flex flex-col gap-3 md:gap-4">
      {/* Top HUD + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <HUD phase={phase} stats={stats} lastScore={lastScore} />
        <div className="flex justify-between md:justify-end gap-2">
          {phase === 'idle' && (
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/70 text-cyan-100 text-xs font-medium shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:bg-cyan-500/20 hover:border-cyan-300/90 transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Launch Mission
            </button>
          )}

          {phase !== 'idle' && (
            <>
              <button
                onClick={handlePauseToggle}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-200 text-[10px] hover:bg-slate-800/90 hover:border-cyan-400/30 transition-colors"
              >
                {phase === 'paused' ? (
                  <>
                    <Play className="w-3 h-3 text-cyan-300" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-violet-300" />
                    Pause
                  </>
                )}
              </button>

              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-cyan-500/5 border border-cyan-500/40 text-cyan-200 text-[10px] hover:bg-cyan-500/15 hover:border-cyan-300/70 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Run
              </button>
            </>
          )}

          <div className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-slate-900/80 border border-slate-800/80 text-[9px] text-slate-400">
            <Info className="w-3 h-3 text-cyan-400" />
            <span>Tap / Click / Space / ArrowUp or hold mouse to hover your UFO.</span>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="relative">
        <GameCanvas phase={phase} onGameOver={handleGameOver} />
        <GameOverlay phase={phase} lastScore={lastScore} onStart={handleStart} />
      </div>

      {/* Bottom callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9px] text-slate-400">
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-3 py-2 rounded-2xl backdrop-blur-sm">
          <Stars className="w-3 h-3 text-yellow-300" />
          <div className="flex flex-col">
            <span className="uppercase tracking-[0.18em] text-[8px] text-slate-500">
              Skill-Based
            </span>
            <span>Clean physics tuned for responsive yet forgiving control.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-900/70 px-3 py-2 rounded-2xl backdrop-blur-sm">
          <Rocket className="w-3 h-3 text-cyan-300" />
          <div className="flex flex-col">
            <span className="uppercase tracking-[0.18em] text-[8px] text-slate-500">
              Production Ready
            </span>
            <span>Adaptive layout, smooth rendering, modular React code.</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-violet-900/60 px-3 py-2 rounded-2xl backdrop-blur-sm">
          <Info className="w-3 h-3 text-violet-300" />
          <div className="flex flex-col">
            <span className="uppercase tracking-[0.18em] text-[8px] text-slate-500">
              Theming
            </span>
            <span>Neon deep space aesthetic, ready to integrate into portals.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
