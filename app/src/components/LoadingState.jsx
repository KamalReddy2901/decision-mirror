/**
 * LoadingState.jsx — Typographic loading indicator
 * 
 * Cycles through stage sentences in Fraunces italic with a blinking Vermilion caret.
 * No spinners, no shimmers — just editorial typography.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_STAGES = [
  'Reading your emotional landscape...',
  'Scanning for cognitive biases...',
  'Running decision science frameworks...',
  'Building future scenarios...',
  'Comparing your options side-by-side...',
  'Stress-testing assumptions...',
  'Generating your personal analysis...',
  'Cross-referencing research data...',
  'Polishing insights...',
  'Almost there — finalizing report...',
];

export default function LoadingState({ stages = DEFAULT_STAGES, currentStage = null }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [showCaret, setShowCaret] = useState(true);

  // Cycle through stages if not explicitly provided
  useEffect(() => {
    if (currentStage) return; // Use external stage if provided

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentStage, stages.length]);

  // Blink the caret
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCaret((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, []);

  const displayText = currentStage || stages[stageIndex];

  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-7) var(--space-6)',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={displayText}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '500px',
          }}
        >
          {displayText}
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '1.2em',
              background: 'var(--accent-vermilion)',
              marginLeft: '4px',
              verticalAlign: 'middle',
              opacity: showCaret ? 1 : 0,
              transition: 'opacity 0.1s',
            }}
          />
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
