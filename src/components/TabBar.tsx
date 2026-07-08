export type Tab = 'journey' | 'projects' | 'records'

const TABS: { id: Tab; label: string }[] = [
  { id: 'journey', label: '여정' },
  { id: 'projects', label: '프로젝트' },
  { id: 'records', label: '기록' },
]

export default function TabBar({
  active,
  onChange,
}: {
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <nav style={{ display: 'flex', gap: 8, padding: '10px 14px 16px' }}>
      {TABS.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 8,
              fontSize: 12,
              background: on ? 'var(--ink)' : 'var(--paper)',
              color: on ? 'var(--paper)' : 'var(--muted)',
              border: on ? 'none' : '1px solid var(--border)',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
