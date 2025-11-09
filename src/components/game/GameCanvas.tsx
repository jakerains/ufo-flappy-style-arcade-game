import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  MutableRefObject,
} from 'react'
import type { GamePhase } from './GameShell'

interface Obstacle {
  id: number
  x: number
  gapY: number
  gapHeight: number
  width: number
  passed: boolean
}

interface ParallaxLayer {
  x: number
  speed: number
  size: number
  opacity: number
}

interface GameCanvasProps {
  phase: GamePhase
  onGameOver: (score: number, distance: number) => void
}

const GRAVITY = 1500 // px/s^2
const THRUST_ACCEL = -2600 // upward acceleration while thrusting
const UFO_RADIUS = 22

const OBSTACLE_WIDTH = 80
const OBSTACLE_BASE_GAP = 220 // start easier (wider gaps)
const OBSTACLE_MIN_GAP = 140 // minimum gap at high difficulty
const OBSTACLE_SPACING = 260

const BASE_SPEED = 190 // gentler start speed
const MAX_SPEED = 370 // max difficulty speed
const MAX_FPS = 1000 / 240

// Distance thresholds for difficulty scaling
const DIFFICULTY_MAX_DISTANCE = 4500 // around where we hit max difficulty

const COUNTDOWN_DURATION = 3 // seconds for 3-2-1-Go

const useHoldInput = (
  containerRef: MutableRefObject<HTMLDivElement | null>,
  setIsThrusting: (v: boolean) => void,
) => {
  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    let mouseDown = false

    const startThrust = () => {
      mouseDown = true
      setIsThrusting(true)
    }
    const stopThrust = () => {
      mouseDown = false
      setIsThrusting(false)
    }

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      startThrust()
    }
    const handleMouseUp = () => {
      if (mouseDown) stopThrust()
    }
    const handleMouseLeave = () => {
      if (mouseDown) stopThrust()
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      startThrust()
    }
    const handleTouchEnd = () => {
      stopThrust()
    }

    node.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    node.addEventListener('mouseleave', handleMouseLeave)

    node.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      node.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      node.removeEventListener('mouseleave', handleMouseLeave)

      node.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [containerRef, setIsThrusting])
}

const useKeyboardThrust = (setIsThrusting: (v: boolean) => void) => {
  useEffect(() => {
    let keyActive = false

    const isThrustKey = (code: string) =>
      code === 'Space' || code === 'ArrowUp'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isThrustKey(e.code)) return
      e.preventDefault()
      if (!keyActive) {
        keyActive = true
        setIsThrusting(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isThrustKey(e.code)) return
      e.preventDefault()
      if (keyActive) {
        keyActive = false
        setIsThrusting(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setIsThrusting])
}

// Compute difficulty scaling factor [0,1] from distance
const getDifficultyFactor = (distance: number): number => {
  if (distance <= 0) return 0
  if (distance >= DIFFICULTY_MAX_DISTANCE) return 1
  return distance / DIFFICULTY_MAX_DISTANCE
}

// Derive current obstacle gap and speed from difficulty
const getCurrentParams = (distance: number) => {
  const t = getDifficultyFactor(distance)
  const ease = t * t // simple ease-in for smoother ramp

  const speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * ease
  const gap =
    OBSTACLE_BASE_GAP + (OBSTACLE_MIN_GAP - OBSTACLE_BASE_GAP) * ease

  return { speed, gap }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ phase, onGameOver }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [width, setWidth] = useState(960)
  const [height, setHeight] = useState(440)

  const [ufoY, setUfoY] = useState(220)
  const [velocity, setVelocity] = useState(0)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [parallax, setParallax] = useState<ParallaxLayer[]>([])
  const [isThrusting, setIsThrusting] = useState(false)

  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownStartRef = useRef<number | null>(null)

  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const obstacleIdRef = useRef(0)

  useHoldInput(containerRef, setIsThrusting)
  useKeyboardThrust(setIsThrusting)

  // Resize for responsiveness
  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const resize = () => {
      const rect = node.getBoundingClientRect()
      const targetWidth = Math.max(320, Math.min(rect.width, 960))
      const ratio = 960 / 440
      const targetHeight = targetWidth / ratio
      setWidth(targetWidth)
      setHeight(targetHeight)
    }

    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  // Initialize parallax stars
  useEffect(() => {
    const layers: ParallaxLayer[] = []
    for (let i = 0; i < 34; i++) {
      layers.push({
        x: Math.random() * 960,
        speed: 20 + Math.random() * 70,
        size: 1 + Math.random() * 2,
        opacity: 0.08 + Math.random() * 0.22,
      })
    }
    setParallax(layers)
  }, [])

  const spawnObstacle = useCallback(
    (minX: number, gapHeight: number): Obstacle => {
      const centerMargin = 80
      const usableHeight = height - 2 * centerMargin - gapHeight
      const center =
        centerMargin +
        (usableHeight > 0 ? Math.random() * usableHeight : 0)

      return {
        id: obstacleIdRef.current++,
        x: minX,
        gapY: center + gapHeight / 2,
        gapHeight,
        width: OBSTACLE_WIDTH,
        passed: false,
      }
    },
    [height],
  )

  const resetGame = useCallback(() => {
    const midY = height / 2
    setUfoY(midY)
    setVelocity(0)
    setScore(0)
    setDistance(0)

    const { gap } = getCurrentParams(0)
    const initial: Obstacle[] = []
    const visibleCount = Math.ceil(960 / OBSTACLE_SPACING) + 2
    for (let i = 0; i < visibleCount; i++) {
      const x = 480 + i * OBSTACLE_SPACING
      initial.push(spawnObstacle(x, gap))
    }
    setObstacles(initial)

    // Prepare countdown; actual timing is handled in the loop
    setCountdown(COUNTDOWN_DURATION)
    countdownStartRef.current = null

    lastTimeRef.current = null
  }, [height, spawnObstacle])

  // Respond to external phase changes
  useEffect(() => {
    if (phase === 'running') {
      // When external shell says "start", we reset and trigger countdown.
      resetGame()
      setIsThrusting(false)
    } else if (phase === 'idle' || phase === 'over' || phase === 'paused') {
      // Stop thrust & animations when not actively running
      setIsThrusting(false)
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTimeRef.current = null
      setCountdown(null)
      countdownStartRef.current = null
    }
  }, [phase, resetGame])

  // Main game loop
  useEffect(() => {
    if (phase !== 'running') {
      // Phase is not active; guard
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTimeRef.current = null
      return
    }

    const tick = (timestamp: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = timestamp
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      let delta = (timestamp - lastTimeRef.current) / 1000
      if (delta <= 0) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      // Clamp delta for stability (handle tab switches, etc.)
      if (timestamp - lastTimeRef.current > MAX_FPS) {
        delta = Math.min(delta, 1 / 30)
      }
      lastTimeRef.current = timestamp

      let newDistance = distance
      let newScore = score
      let updatedObstacles = obstacles
      let hit = false

      // Countdown logic: during countdown, we:
      // - keep UFO centered vertically (small easing)
      // - slowly scroll parallax and obstacles for drama
      // - disable collisions and scoring until countdown ends
      let effectiveIsThrusting = isThrusting

      let currentCountdown = countdown
      if (currentCountdown !== null) {
        if (countdownStartRef.current == null) {
          countdownStartRef.current = timestamp
        }
        const elapsed = (timestamp - countdownStartRef.current) / 1000
        const remaining = COUNTDOWN_DURATION - elapsed

        if (remaining <= 0) {
          // Countdown complete -> clear and start real run
          currentCountdown = null
        } else {
          currentCountdown = remaining

          // Gentle hover behavior: ignore real thrust, lightly float around center
          effectiveIsThrusting = false

          // Slow scroll for obstacles and parallax
          const warmupSpeed = 80
          newDistance += warmupSpeed * delta

          updatedObstacles = obstacles.map(o => ({
            ...o,
            x: o.x - warmupSpeed * delta,
          }))

          // Keep pipeline during countdown so first real gaps are visible
          const { gap } = getCurrentParams(0)
          const needed = Math.ceil(960 / OBSTACLE_SPACING) + 3
          const active = updatedObstacles.filter(
            o => o.x + o.width > -60,
          )
          while (active.length < needed) {
            const maxX =
              active.length === 0
                ? 480
                : Math.max(...active.map(o => o.x)) +
                  OBSTACLE_SPACING
            active.push(spawnObstacle(maxX, gap))
          }
          updatedObstacles = active

          // Minimal float to feel alive
          const centerY = height / 2
          const interp = 1 - Math.pow(0.25, delta) // smooth ease
          const floatedY = ufoY + (centerY - ufoY) * interp

          const updatedParallax = parallax.map(s => {
            let x = s.x - s.speed * 0.25 * delta
            if (x < -10) x = 960 + Math.random() * 120
            return { ...s, x }
          })

          setParallax(updatedParallax)
          setUfoY(floatedY)
          setObstacles(updatedObstacles)
          setDistance(newDistance)
          setCountdown(currentCountdown)

          rafRef.current = requestAnimationFrame(tick)
          return
        }
      }

      // After countdown: real gameplay
      const { speed, gap } = getCurrentParams(newDistance)

      // UFO physics with actual input
      const accel = GRAVITY + (effectiveIsThrusting ? THRUST_ACCEL : 0)
      const nextVelocity = (velocity + accel * delta) * 0.995
      let nextY = ufoY + nextVelocity * delta

      const floor = height - 40
      const ceiling = 40

      if (nextY + UFO_RADIUS >= floor) {
        nextY = floor - UFO_RADIUS
        hit = true
      }
      if (nextY - UFO_RADIUS <= ceiling) {
        nextY = ceiling + UFO_RADIUS
        hit = true
      }

      // Obstacles movement
      updatedObstacles = obstacles.map(o => ({
        ...o,
        x: o.x - speed * delta,
      }))

      // Maintain obstacle pipeline with dynamic gap
      const needed = Math.ceil(960 / OBSTACLE_SPACING) + 3
      const active = updatedObstacles.filter(o => o.x + o.width > -60)
      while (active.length < needed) {
        const maxX =
          active.length === 0
            ? 480
            : Math.max(...active.map(o => o.x)) + OBSTACLE_SPACING
        active.push(spawnObstacle(maxX, gap))
      }
      updatedObstacles = active

      // Score update
      updatedObstacles.forEach(o => {
        if (!o.passed && o.x + o.width < 960 / 2 - 30) {
          o.passed = true
          newScore += 1
        }
      })

      // Distance
      newDistance += speed * delta

      // Collision detection (only after countdown is done)
      const ufoX = 960 / 2 - 80
      if (!hit) {
        for (const o of updatedObstacles) {
          const topHeight = o.gapY - o.gapHeight / 2
          const bottomY = o.gapY + o.gapHeight / 2

          const rects = [
            { x: o.x, y: 0, w: o.width, h: topHeight },
            {
              x: o.x,
              y: bottomY,
              w: o.width,
              h: height - bottomY,
            },
          ]

          for (const r of rects) {
            const closestX = Math.max(r.x, Math.min(ufoX, r.x + r.w))
            const closestY = Math.max(
              r.y,
              Math.min(nextY, r.y + r.h),
            )
            const dx = ufoX - closestX
            const dy = nextY - closestY
            if (dx * dx + dy * dy < UFO_RADIUS * UFO_RADIUS) {
              hit = true
              break
            }
          }
          if (hit) break
        }
      }

      // Parallax update
      const updatedParallax = parallax.map(s => {
        let x = s.x - s.speed * (0.5 + 0.5 * getDifficultyFactor(newDistance)) * delta
        if (x < -10) x = 960 + Math.random() * 120
        return { ...s, x }
      })

      if (hit) {
        setUfoY(nextY)
        setVelocity(0)
        setObstacles(updatedObstacles)
        setParallax(updatedParallax)
        setScore(newScore)
        setDistance(newDistance)
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        lastTimeRef.current = null
        onGameOver(newScore, newDistance)
        return
      }

      // Commit state
      setUfoY(nextY)
      setVelocity(nextVelocity)
      setObstacles(updatedObstacles)
      setParallax(updatedParallax)
      setScore(newScore)
      setDistance(newDistance)
      setCountdown(currentCountdown)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [
    phase,
    height,
    obstacles,
    parallax,
    ufoY,
    velocity,
    score,
    distance,
    isThrusting,
    countdown,
    spawnObstacle,
    onGameOver,
  ])

  // Scaled render
  const scaleX = width / 960
  const scaleY = height / 440
  const scale = Math.min(scaleX, scaleY)

  // Derive countdown label
  let countdownLabel: string | null = null
  if (countdown !== null) {
    if (countdown <= 0.8) countdownLabel = 'GO'
    else if (countdown <= 1.8) countdownLabel = '1'
    else if (countdown <= 2.8) countdownLabel = '2'
    else countdownLabel = '3'
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full mt-1 rounded-3xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-[0_18px_70px_rgba(15,23,42,0.9)]"
    >
      <div
        className="relative origin-top-left"
        style={{
          width: 960,
          height: 440,
          transform: `scale(${scale})`,
        }}
      >
        {/* Nebula background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950">
          <div className="absolute -left-16 -top-24 w-80 h-80 bg-cyan-500/8 blur-3xl rounded-full" />
          <div className="absolute -right-10 top-10 w-72 h-72 bg-violet-500/6 blur-3xl rounded-full" />
          <div className="absolute right-16 bottom-0 w-64 h-64 bg-blue-500/6 blur-3xl rounded-full" />
        </div>

        {/* Distant planet */}
        <div className="absolute right-4 top-4 w-40 h-24 rounded-3xl overflow-hidden border border-cyan-500/15 bg-slate-900/40 backdrop-blur">
          <img
            src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=60"
            alt="Distant galaxy horizon"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent" />
          <div className="absolute bottom-1 left-2 text-[7px] text-cyan-200/80 uppercase tracking-[0.18em] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
            Sector L-42
          </div>
        </div>

        {/* Parallax stars */}
        {parallax.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-200"
            style={{
              left: s.x,
              top: 40 + (i * 13) % 320,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              boxShadow:
                s.size > 2 ? '0 0 12px rgba(148, 163, 253, 0.9)' : 'none',
            }}
          />
        ))}

        {/* Floor + ceiling guides */}
        <div className="absolute left-0 right-0 bottom-34 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute left-0 right-0 top-34 h-[2px] bg-gradient-to-r from-transparent via-violet-400/15 to-transparent" />

        {/* Obstacles */}
        {obstacles.map(o => {
          const topHeight = o.gapY - o.gapHeight / 2
          const bottomY = o.gapY + o.gapHeight / 2
          return (
            <React.Fragment key={o.id}>
              {/* Top tower */}
              <div
                className="absolute bg-gradient-to-b from-slate-700/80 to-slate-900/95 border border-slate-500/40 shadow-[0_0_20px_rgba(15,23,42,1)]"
                style={{
                  left: o.x,
                  top: 0,
                  width: o.width,
                  height: topHeight,
                  borderBottomLeftRadius: 18,
                  borderBottomRightRadius: 18,
                }}
              >
                <div className="absolute inset-x-1 bottom-2 h-3 bg-slate-800/90 rounded-full blur-[2px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(148,163,253,0.08),transparent_55%)]" />
              </div>
              {/* Bottom tower */}
              <div
                className="absolute bg-gradient-to-t from-slate-800/95 to-slate-900/95 border border-slate-500/40 shadow-[0_0_22px_rgba(15,23,42,1)]"
                style={{
                  left: o.x,
                  top: bottomY,
                  width: o.width,
                  height: height - bottomY,
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                }}
              >
                <div className="absolute inset-x-1 top-2 h-3 bg-slate-900/95 rounded-full blur-[2px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_40%,rgba(56,189,248,0.05),transparent_55%)]" />
              </div>

              {/* Gap indicator */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: o.x + o.width / 2 - 1.5,
                  top: o.gapY - o.gapHeight / 2,
                  width: 3,
                  height: o.gapHeight,
                  background:
                    'linear-gradient(to bottom, rgba(56,189,248,0.0), rgba(56,189,248,0.35), rgba(168,85,247,0.0))',
                  boxShadow:
                    '0 0 16px rgba(56,189,248,0.35), 0 0 26px rgba(129,140,248,0.24)',
                  borderRadius: 999,
                  opacity: 0.45,
                }}
              />
            </React.Fragment>
          )
        })}

        {/* UFO */}
        <div
          className="absolute transition-transform"
          style={{
            left: 960 / 2 - 80,
            top: ufoY - UFO_RADIUS - 6,
          }}
        >
          {/* Glow ring */}
          <div className="absolute inset-x-[-14px] bottom-[-14px] h-5 bg-cyan-500/15 blur-lg rounded-full" />
          {/* Beam when thrusting */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-6 w-16 h-14 bg-gradient-to-b from-cyan-300/12 via-cyan-400/5 to-transparent blur-[1px] ${
              isThrusting ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-90`}
          />
          {/* Saucer */}
          <div className="relative flex flex-col items-center">
            {/* Dome */}
            <div className="w-10 h-6 rounded-full bg-gradient-to-b from-cyan-300/80 to-slate-900 border border-cyan-300/70 shadow-[0_0_18px_rgba(56,189,248,0.7)] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900/90 border border-cyan-200/80" />
            </div>
            {/* Body */}
            <div className="mt-[-4px] w-16 h-6 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 border border-cyan-400/70 shadow-[0_5px_16px_rgba(15,23,42,1)] flex items-center justify-around px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-300/90 shadow-[0_0_8px_rgba(252,211,77,0.9)]" />
              <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-300/90 shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
            </div>
          </div>
        </div>

        {/* HUD overlay */}
        <div className="absolute left-4 top-4 px-3 py-2 rounded-2xl bg-slate-950/85 border border-slate-800/90 backdrop-blur-md flex items-center gap-3 text-[9px] text-slate-300">
          <div className="flex flex-col leading-tight">
            <span className="text-[7px] uppercase tracking-[0.18em] text-slate-500">
              Score
            </span>
            <span className="text-cyan-300 text-xs font-semibold">{score}</span>
          </div>
          <div className="w-px h-6 bg-slate-800/90" />
          <div className="flex flex-col leading-tight">
            <span className="text-[7px] uppercase tracking-[0.18em] text-slate-500">
              Distance
            </span>
            <span className="text-violet-300 text-[9px]">
              {(distance / 10).toFixed(0)} km
            </span>
          </div>
        </div>

        {/* Countdown overlay */}
        {countdownLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`px-8 py-4 rounded-3xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.5)] flex items-center justify-center`}
            >
              <span
                className={`${
                  countdownLabel === 'GO'
                    ? 'text-cyan-300'
                    : 'text-slate-100'
                } text-5xl font-semibold tracking-[0.3em]`}
              >
                {countdownLabel}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
