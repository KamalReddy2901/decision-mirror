import { motion } from 'framer-motion';

const MotionDiv = motion.div;

/**
 * EmptyState.jsx — Editorial empty state component
 * 
 * Uses Fraunces italic for the reflective message + optional accent action
 */

export default function EmptyState({ message, actionLabel, onAction }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        textAlign: 'center',
        padding: 'var(--space-8) var(--space-6)'
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
    </MotionDiv>
  );
}
