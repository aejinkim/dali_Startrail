import { useEffect, useRef, useState } from 'react'
import type { Project, Task } from '../domain/types'
import { campFractions, currentFraction } from '../domain/journey'
import Character from './Character'

interface Point { x: number; y: number }
type Sampler = (fraction: number) => Point

const VIEW_W = 220
const VIEW_H = 250

// Fixed decorative trail from bottom-left up to the summit near top.
const TRAIL_D =
  'M25 235 C 55 225, 45 210, 60 200 C 78 188, 95 180, 118 168 ' +
  'C 140 156, 148 152, 150 150 C 152 130, 130 110, 112 95 C 103 88, 97 84, 95 80'

const CONTOURS = [
  { cx: 60, cy: 200 }, { cx: 150, cy: 150 }, { cx: 95, cy: 80 },
]

export default function JourneyMap({
  projects,
  tasks,
  walking = false,
  sampler: injectedSampler,
}: {
  projects: Project[]
  tasks: Task[]
  walking?: boolean
  sampler?: Sampler
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const [sampler, setSampler] = useState<Sampler | null>(() => injectedSampler ?? null)

  useEffect(() => {
    if (injectedSampler) return
    const path = pathRef.current
    if (!path || typeof path.getTotalLength !== 'function') return
    const len = path.getTotalLength()
    setSampler(() => (f: number) => {
      const pt = path.getPointAtLength(Math.max(0, Math.min(1, f)) * len)
      return { x: pt.x, y: pt.y }
    })
  }, [injectedSampler])

  const camps = campFractions(projects, tasks)
  const current = currentFraction(tasks)

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="북극성으로 향하는 여정 지도"
    >
      <path
        d="M110 22 l3.5 7 7.5 1 -5.5 5.5 1.5 7.5 -7 -3.8 -7 3.8 1.5 -7.5 -5.5 -5.5 7.5 -1 z"
        fill="var(--amber)"
      />
      {CONTOURS.map((c, i) => (
        <g key={i} fill="none" stroke="var(--contour)" strokeWidth="1">
          <ellipse cx={c.cx} cy={c.cy} rx="46" ry="28" />
          <ellipse cx={c.cx} cy={c.cy} rx="30" ry="17" />
          <ellipse cx={c.cx} cy={c.cy} rx="14" ry="8" />
        </g>
      ))}

      <path ref={pathRef} d={TRAIL_D} fill="none" stroke="transparent" />
      <path d={TRAIL_D} fill="none" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="1 6" strokeLinecap="round" />

      {sampler && (
        <>
          {camps.map((f, i) => {
            const p = sampler(f)
            const isSummit = i === camps.length - 1
            return (
              <circle
                key={i}
                data-camp
                cx={p.x}
                cy={p.y}
                r={isSummit ? 6 : 4}
                fill="var(--paper)"
                stroke={isSummit ? 'var(--ink)' : 'var(--amber)'}
                strokeWidth={isSummit ? 1.5 : 2}
              />
            )
          })}
          <WalkedTrail sampler={sampler} to={current} />
          <g data-character transform={`translate(${sampler(current).x} ${sampler(current).y})`}>
            <Character walking={walking} />
          </g>
        </>
      )}
    </svg>
  )
}

function WalkedTrail({ sampler, to }: { sampler: Sampler; to: number }) {
  const steps = 40
  const pts: string[] = []
  const end = Math.max(0, Math.min(1, to))
  for (let i = 0; i <= steps; i++) {
    const f = (end * i) / steps
    const p = sampler(f)
    pts.push(`${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
  }
  return <path d={pts.join(' ')} fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" />
}
