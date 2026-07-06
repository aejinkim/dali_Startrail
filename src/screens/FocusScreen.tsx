import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import DialTimer from '../components/DialTimer'

const DEFAULT_MIN = 10

export default function FocusScreen({ onExit }: { onExit: () => void }) {
  const tasks = useStore((s) => s.tasks)
  const activeTaskId = useStore((s) => s.activeTaskId)
  const finishSession = useStore((s) => s.finishSession)

  const active = tasks.find((t) => t.id === activeTaskId && !t.done) ?? tasks.find((t) => !t.done)
  const totalMs = DEFAULT_MIN * 60_000

  const [remainingMs, setRemainingMs] = useState(totalMs)
  const endRef = useRef(Date.now() + totalMs)
  const doneRef = useRef(false)

  useEffect(() => {
    endRef.current = Date.now() + totalMs
    const id = setInterval(() => {
      const left = endRef.current - Date.now()
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true
        clearInterval(id)
        if (active) finishSession(active.id, DEFAULT_MIN)
        setRemainingMs(0)
        onExit()
        return
      }
      setRemainingMs(Math.max(0, left))
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!active) {
    return (
      <div style={{ padding: '2rem 1.25rem' }}>
        <p>진행할 태스크가 없습니다.</p>
        <button type="button" onClick={onExit} style={{ marginTop: 16, color: 'var(--needle)' }}>돌아가기</button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 14 }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="serif-italic" style={{ fontSize: 14, color: 'var(--serif-label)' }}>Deep work</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--dark-muted)' }}>
          SESSION {active.completedSessions + 1}/{active.estimatedSessions}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <DialTimer remainingMs={remainingMs} totalMs={totalMs} label={active.title.slice(0, 14).toUpperCase()} />
      </div>

      <button
        type="button"
        aria-label="세션 취소"
        onClick={onExit}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid var(--track)', color: 'var(--dark-muted)',
          fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        ✕
      </button>
    </div>
  )
}
