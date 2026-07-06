import { useState } from 'react'
import type React from 'react'
import { useStore } from '../store/useStore'
import { taskProgress } from '../domain/progress'

export default function ProjectsScreen() {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const activeTaskId = useStore((s) => s.activeTaskId)
  const addProject = useStore((s) => s.addProject)
  const addTask = useStore((s) => s.addTask)
  const setActiveTask = useStore((s) => s.setActiveTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const deleteProject = useStore((s) => s.deleteProject)

  const [projectName, setProjectName] = useState('')
  const [draft, setDraft] = useState<Record<string, { title: string; sessions: string }>>({})

  const draftFor = (pid: string) => draft[pid] ?? { title: '', sessions: '4' }
  const setDraftFor = (pid: string, next: Partial<{ title: string; sessions: string }>) =>
    setDraft((d) => ({ ...d, [pid]: { ...draftFor(pid), ...next } }))

  return (
    <div style={{ padding: '1rem 1.25rem', overflowY: 'auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>프로젝트</h2>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0 20px' }}>
        <input
          placeholder="새 프로젝트 이름"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => {
            if (!projectName.trim()) return
            addProject(projectName.trim())
            setProjectName('')
          }}
          style={primaryBtn}
        >
          프로젝트 추가
        </button>
      </div>

      {projects.map((p) => {
        const pTasks = tasks.filter((t) => t.projectId === p.id)
        const d = draftFor(p.id)
        return (
          <div key={p.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14 }}>{p.title}</strong>
              <button type="button" onClick={() => deleteProject(p.id)} style={{ color: 'var(--muted)', fontSize: 12 }}>삭제</button>
            </div>

            {pTasks.map((t) => (
              <div key={t.id} style={taskRow}>
                <button
                  type="button"
                  onClick={() => setActiveTask(t.id)}
                  style={{ fontSize: 13, color: t.id === activeTaskId ? 'var(--orange)' : 'var(--ink)' }}
                >
                  {t.id === activeTaskId ? '● ' : '○ '}{t.title}
                </button>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t.completedSessions}/{t.estimatedSessions} · {Math.round(taskProgress(t) * 100)}%
                  <button type="button" onClick={() => deleteTask(t.id)} style={{ marginLeft: 8, color: 'var(--muted)' }}>×</button>
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input
                data-testid={`task-title-${p.id}`}
                placeholder="태스크"
                value={d.title}
                onChange={(e) => setDraftFor(p.id, { title: e.target.value })}
                style={{ ...inputStyle, flex: 2 }}
              />
              <input
                data-testid={`task-sessions-${p.id}`}
                type="number"
                min={1}
                value={d.sessions}
                onChange={(e) => setDraftFor(p.id, { sessions: e.target.value })}
                style={{ ...inputStyle, width: 56 }}
              />
              <button
                type="button"
                data-testid={`task-add-${p.id}`}
                onClick={() => {
                  if (!d.title.trim()) return
                  addTask(p.id, d.title.trim(), Number(d.sessions) || 1)
                  setDraftFor(p.id, { title: '', sessions: '4' })
                }}
                style={primaryBtn}
              >
                추가
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '8px 10px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--paper)', fontSize: 13,
}
const primaryBtn: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, background: 'var(--ink)', color: 'var(--paper)', fontSize: 12,
}
const card: React.CSSProperties = {
  background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12,
  padding: '12px 14px', marginBottom: 12,
}
const taskRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
}
