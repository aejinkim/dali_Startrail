import { useState } from 'react'
import type React from 'react'
import { useStore } from '../store/useStore'

export default function OnboardingScreen() {
  const setNorthStar = useStore((s) => s.setNorthStar)
  const [title, setTitle] = useState('')
  const [statement, setStatement] = useState('')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1.5rem', gap: 20 }}>
      <div style={{ textAlign: 'center', fontSize: 40, color: 'var(--amber)' }}>★</div>
      <div style={{ textAlign: 'center' }}>
        <div className="serif-italic" style={{ fontSize: 18, color: 'var(--serif-label)' }}>
          당신의 북극성은 무엇인가요?
        </div>
        <p style={{ fontSize: 13, color: 'var(--dark-muted)', marginTop: 8, lineHeight: 1.6 }}>
          모든 집중이 향할 하나의 큰 목적을 정하세요.
        </p>
      </div>

      <input
        placeholder="예: 브랜드 첫 런칭"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={darkInput}
      />
      <input
        placeholder="이 시간은 나의 북극성을 향해 가고 있는가?"
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        style={darkInput}
      />

      <button
        type="button"
        onClick={() => {
          if (!title.trim()) return
          setNorthStar(title.trim(), statement.trim())
        }}
        style={{
          padding: '12px 0', borderRadius: 10, background: 'var(--needle)',
          color: 'var(--ivory)', fontSize: 14, fontWeight: 500,
        }}
      >
        여정 시작
      </button>
    </div>
  )
}

const darkInput: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 10, background: 'var(--track)',
  border: '1px solid var(--track)', color: 'var(--ivory)', fontSize: 14,
}
