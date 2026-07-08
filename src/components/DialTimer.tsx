const R = 78
const CIRC = 2 * Math.PI * R

function mmss(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DialTimer({
  remainingMs,
  totalMs,
  label,
}: {
  remainingMs: number
  totalMs: number
  label: string
}) {
  const frac = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const angle = -Math.PI / 2 + (1 - frac) * 2 * Math.PI
  const nx = 100 + R * Math.cos(angle)
  const ny = 100 + R * Math.sin(angle)

  return (
    <svg viewBox="0 0 200 200" width="82%" role="img" aria-label="집중 타이머">
      <circle cx="100" cy="100" r={R} fill="none" stroke="var(--track)" strokeWidth="16" />
      <circle
        data-arc
        cx="100"
        cy="100"
        r={R}
        fill="none"
        stroke="var(--tan)"
        strokeWidth="16"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - frac)}
        transform="rotate(-90 100 100)"
        strokeLinecap="butt"
      />
      <line x1="100" y1="100" x2={nx} y2={ny} stroke="var(--needle)" strokeWidth="2" />
      <circle cx="100" cy="100" r="3" fill="var(--needle)" />
      <text x="100" y="96" textAnchor="middle" className="mono" fill="var(--ivory)" fontSize="26">
        {mmss(remainingMs)}
      </text>
      <text x="100" y="116" textAnchor="middle" fill="var(--dark-muted)" fontSize="8" letterSpacing="1.5">
        {label}
      </text>
    </svg>
  )
}
