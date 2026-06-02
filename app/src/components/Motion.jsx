/**
 * Motion.jsx — Editorial animation primitives using Framer Motion
 * 
 * Provides reusable motion components that feel editorial/physical:
 * - Content "sets" like print with staggered cascades
 * - Vermilion underlines that "draw" on reveal
 * - Intentional hover states (not translateY bounce)
 */

import { AnimatePresence } from 'framer-motion';

// Removed unused editorialEase constant - using CSS animations instead

export const PageTransition = ({ children, pageKey }) => (
  <AnimatePresence mode="wait">
    <div
      key={pageKey}
      style={{ animation: 'fadeIn 0.5s var(--ease-editorial)' }}
    >
      {children}
    </div>
  </AnimatePresence>
);

export const CascadeItem = ({ children, delay = 0, ...props }) => (
  <div
    style={{
      animation: `fadeInUp 0.5s var(--ease-editorial) ${delay}s backwards`
    }}
    {...props}
  >
    {children}
  </div>
);

export const CascadeList = ({ children }) => (
  <div style={{ animation: 'fadeIn 0.5s var(--ease-editorial)' }}>
    {children}
  </div>
);

export const CascadeListItem = ({ children, ...props }) => (
  <div
    style={{ animation: 'fadeInUp 0.5s var(--ease-editorial)' }}
    {...props}
  >
    {children}
  </div>
);

// Vermilion underline that draws left-to-right
export const VermilionUnderline = ({ children, ...props }) => (
  <span
    style={{ position: 'relative', display: 'inline-block' }}
    {...props}
  >
    {children}
    <span
      style={{
        position: 'absolute',
        bottom: '-4px',
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--accent-vermilion)',
        animation: 'scaleXIn 0.6s var(--ease-editorial) 0.2s backwards',
        transformOrigin: 'left'
      }}
    />
  </span>
);

// Modal/dialog fade + scale (card sliding onto paper)
export const ModalTransition = ({ children, isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <div style={{ animation: 'fadeIn 0.3s var(--ease-editorial)' }}>
        {children}
      </div>
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
