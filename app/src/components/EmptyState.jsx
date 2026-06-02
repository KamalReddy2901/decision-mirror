/**
 * EmptyState.jsx — Editorial empty state component
 * 
 * Uses Fraunces italic for the reflective message + optional accent action
 */

export default function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-8) var(--space-6)',
        animation: 'fadeInUp 0.5s var(--ease-editorial)'
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-5)',
          lineHeight: 1.5
        }}
      >
        {message}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
