import { type Transition, type Variants } from 'motion/react';

/**
 * ⚡ Precision Motion System Tokens
 * Optimized for Instant 0-Lag Rendering & 144Hz/240Hz High Refresh Displays.
 */

// 1. Micro-Interactions (Buttons, Badges, Tabs, Toggles) - Snappy 120ms
export const SPRING_MICRO: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 30,
  mass: 0.6,
};

// 2. Macro Layouts (Cards, Drawers, Sheets) - Fluid 240ms
export const SPRING_MACRO: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
  mass: 0.7,
};

// 3. Modals, Popovers & Dialogs - Spatial 220ms
export const SPRING_MODAL: Transition = {
  type: 'spring',
  stiffness: 460,
  damping: 28,
  mass: 0.7,
};

// 4. Snappy Exit Strategy (Zero perception lag)
export const EXIT_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 1, 1],
};

// ============================================================================
// 🎭 Core Component Animation Variants (Zero Layout Thrashing, No Heavy Blurs)
// ============================================================================

// A. Ultra-Fast Cascades for Lists & Grid Feeds (Total duration < 120ms)
export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.015,
      delayChildren: 0,
    },
  },
};

export const DOMINO_ITEM: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 460,
      damping: 28,
      mass: 0.6,
    },
  },
};

// B. Tactile Interactive Press/Hover Presets
export const HOVER_TACTILE = {
  whileHover: { y: -4, scale: 1.012 },
  whileTap: { scale: 0.97, y: 0 },
  transition: SPRING_MACRO,
};

export const HOVER_BUTTON_PRESS = {
  whileHover: { scale: 1.04, y: -1 },
  whileTap: { scale: 0.93, y: 0.5 },
  transition: SPRING_MICRO,
};

export const HOVER_ICON_POP = {
  whileHover: { scale: 1.15, rotate: 6 },
  whileTap: { scale: 0.85, rotate: -4 },
  transition: SPRING_MICRO,
};

// C. Modal & Popover Morph Expansion (Instant & Crisp)
export const MODAL_EXPAND_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 14,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_MODAL,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: EXIT_TRANSITION,
  },
};
