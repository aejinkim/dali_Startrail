export default function Character({ walking = false }: { walking?: boolean }) {
  return (
    <g data-character-body>
      <circle cx="0" cy="0" r="9" fill="#FFFFFF" stroke="var(--ink)" strokeWidth="1.3" />
      <circle cx="-3.5" cy="-1.5" r="1.3" fill="var(--ink)" />
      <circle cx="3.5" cy="-1.5" r="1.3" fill="var(--ink)" />
      <path
        d={walking ? 'M-2.5 3.5 q2.5 3 5 0' : 'M-2.5 3 q2.5 2 5 0'}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.1"
      />
      <circle cx="6" cy="-4" r="3" fill="var(--orange)" />
    </g>
  )
}
