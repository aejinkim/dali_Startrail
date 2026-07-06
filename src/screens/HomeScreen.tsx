import { useStore } from '../store/useStore'
import { northStarProgress } from '../domain/progress'
import JourneyMap from '../components/JourneyMap'

export default function HomeScreen({ onStart }: { onStart: () => void }) {
  const northStar = useStore((s) => s.northStar)
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const activeTaskId = useStore((s) => s.activeTaskId)

  const pct = Math.round(northStarProgress(tasks) * 100)
  const active = tasks.find((t) => t.id === activeTaskId && !t.done)
    ?? tasks.find((t) => !t.done)
    ?? null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 14px 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--muted)' }}>
            NORTH STAR
          </div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{northStar?.title}</div>
        </div>
        <div className="mono" style={{ fontSize: 14, color: 'var(--orange)' }}>{pct}%</div>
      </header>

      <div
        style={{
          flex: 1,
          marginTop: 10,
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          minHeight: 320,
        }}
      >
        <JourneyMap projects={projects} tasks={tasks} />

        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 10,
            background: 'var(--ink)',
            borderRadius: 12,
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--paper)', fontWeight: 500 }}>
              {active ? active.title : '태스크를 추가해 여정을 시작하세요'}
            </div>
            {active && (
              <div className="mono" style={{ fontSize: 9, color: 'var(--dark-muted)', marginTop: 2 }}>
                SESSION {active.completedSessions}/{active.estimatedSessions}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="세션 시작"
            disabled={!active}
            onClick={onStart}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              flexShrink: 0,
              background: active ? 'var(--orange)' : 'var(--track)',
              color: 'var(--paper)',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
