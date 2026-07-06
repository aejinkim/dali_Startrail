export default function FocusScreen({ onExit }: { onExit: () => void }) {
  return (
    <div style={{ padding: '1rem 1.25rem' }}>
      <button onClick={onExit}>나가기 (placeholder)</button>
    </div>
  )
}
