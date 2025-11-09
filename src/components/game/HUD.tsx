import React from 'react'
import type { GamePhase, GameStats } from './GameShell'
import { Trophy, Activity, Gauge, History } from 'lucide-react'

interface HUDProps {
  phase: GamePhase
  stats: GameStats
  lastScore: number
}

export const HUD: React.FC<HUDProps> = ({ phase, stats, lastScore }) => {
  return (
    <div className="flex flex-wrap items-stretch gap-2 text-[9px]">
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 border border-slate-800/80 backdrop-blur-md">
        <Gauge className="w-3 h-3 text-cyan-300" />
        <div className="flex flex-col leading-tight">
          <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
            Status
          </span>
          <span className="text-cyan-200">
            {phase === 'idle' && 'Awaiting launch sequence'}
            {phase === 'running' && 'In flight • Avoid asteroid corridors'}
            {phase === 'paused' && 'Paused • Systems on standby'}
            {phase === 'over' && 'Crashed • Review telemetry and retry'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 border border-cyan-900/80">
        <Trophy className="w-3 h-3 text-yellow-300" />
        <div className="flex flex-col leading-tight">
          <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
            Best Score
          </span>
          <span className="text-yellow-300 font-semibold">{stats.bestScore}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 border border-violet-900/80">
        <Activity className="w-3 h-3 text-violet-300" />
        <div className="flex flex-col leading-tight">
          <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
            Distance Log
          </span>
          <span className="text-violet-200">
            {(stats.distance / 10).toFixed(0)} km
          </span>
        </div>
      </div>

      {phase === 'over' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 border border-rose-900/80">
          <History className="w-3 h-3 text-rose-300" />
          <div className="flex flex-col leading-tight">
            <span className="uppercase tracking-[0.18em] text-[7px] text-slate-500">
              Last Run
            </span>
            <span className="text-rose-200">
              Score {lastScore} • Attempt #{stats.runs}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
