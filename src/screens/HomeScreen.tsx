export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>여정</h2>
      <button onClick={onStart} style={{ marginTop: 16, color: 'var(--orange)' }}>
        세션 시작 (placeholder)
      </button>
    </div>
  )
}
