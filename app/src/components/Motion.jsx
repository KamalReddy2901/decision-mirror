/**
 * Motion.jsx — Editorial animation primitives using Framer Motion
 * 
 * Provides reusable motion components that feel editorial/physical:
 * - Content "sets" like print with staggered cascades
 * - Vermilion underlines that "draw" on reveal
 * - Intentional hover states (not translateY bounce)
 */

import { motion, AnimatePresence } from 'framer-motion';

// Editorial cascade: items animate in like paragraphs setting on a page
const editorialEase = [0.16, 1, 0.3, 1];

export const PageTransition = ({ children, pageKey }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={pageKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: editorialEase }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export const CascadeItem = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.5,
      delay,
      ease: editorialEase
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export const CascadeList = ({ children, staggerDelay = 0.04 }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
  >
    {children}
  </motion.div>
);

export const CascadeListItem = ({ children, ...props }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: editorialEase } }
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Vermilion underline that draws left-to-right
export const VermilionUnderline = ({ children, ...props }) => (
  <motion.span
    style={{ position: 'relative', display: 'inline-block' }}
    {...props}
  >
    {children}
    <motion.span
      style={{
        position: 'absolute',
        bottom: '-4px',
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--accent-vermilion)',
        transformOrigin: 'left'
      }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: editorialEase }}
    />
  </motion.span>
);

// Modal/dialog fade + scale (card sliding onto paper)
export const ModalTransition = ({ children, isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3, ease: editorialEase }}
      >
        {children}
      </motion.div>
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
