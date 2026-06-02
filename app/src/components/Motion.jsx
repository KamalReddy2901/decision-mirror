/**
 * Motion.jsx — Editorial animation primitives using Framer Motion
 * 
 * Provides reusable motion components that feel editorial/physical:
 * - Content "sets" like print with staggered cascades
 * - Vermilion underlines that "draw" on reveal
 * - Intentional hover states (not translateY bounce)
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const editorialEase = [0.16, 1, 0.3, 1];
const MotionDiv = motion.div;
const MotionSpan = motion.span;

export const PageTransition = ({ children, pageKey }) => {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <MotionDiv
        key={pageKey}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.5, ease: editorialEase }}
      >
        {children}
      </MotionDiv>
    </AnimatePresence>
  );
};

export const CascadeItem = ({ children, delay = 0, ...props }) => {
  const reduceMotion = useReducedMotion();
  return (
    <MotionDiv
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: editorialEase }}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export const CascadeList = ({ children }) => (
  <MotionDiv
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, ease: editorialEase }}
  >
    {children}
  </MotionDiv>
);

export const CascadeListItem = ({ children, ...props }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: editorialEase }}
    {...props}
  >
    {children}
  </MotionDiv>
);

// Vermilion underline that draws left-to-right
export const VermilionUnderline = ({ children, ...props }) => (
  <span
    style={{ position: 'relative', display: 'inline-block' }}
    {...props}
  >
    {children}
    <MotionSpan
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: editorialEase }}
      style={{
        position: 'absolute',
        bottom: '-4px',
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--accent-vermilion)',
        transformOrigin: 'left'
      }}
    />
  </span>
);

// Modal/dialog fade + scale (card sliding onto paper)
export const ModalTransition = ({ children, isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <MotionDiv
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.3, ease: editorialEase }}
      >
        {children}
      </MotionDiv>
    )}
  </AnimatePresence>
);

export default {
  PageTransition,
  CascadeItem,
  CascadeList,
  CascadeListItem,
  VermilionUnderline,
  ModalTransition
};
