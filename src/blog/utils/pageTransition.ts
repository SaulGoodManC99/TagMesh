import { Variants } from 'motion/react';

export type PageTransitionStyle = 'slide' | 'fade' | 'zoom';

export interface TransitionStyleOption {
  id: PageTransitionStyle;
  nameZh: string;
  nameEn: string;
  emoji: string;
}

export const TRANSITION_STYLES: TransitionStyleOption[] = [
  { id: 'slide', nameZh: '3D 空间画卷翻转', nameEn: '3D Spatial Slide', emoji: '↔️' },
  { id: 'fade', nameZh: '全屏极光弥散穿梭', nameEn: 'Aurora Glow Diffusion', emoji: '✨' },
  { id: 'zoom', nameZh: '极速空间折叠微缩', nameEn: 'Cosmic Elastic Warp', emoji: '💫' },
];

const LOCAL_STORAGE_KEY = 'tagmesh_page_transition_style_v1';

export function getStoredTransitionStyle(): PageTransitionStyle {
  if (typeof window === 'undefined') return 'slide';
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as PageTransitionStyle;
    if (saved === 'slide' || saved === 'fade' || saved === 'zoom') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'slide';
}

export function saveTransitionStyle(style: PageTransitionStyle) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, style);
    window.dispatchEvent(new CustomEvent('tagmesh_transition_style_changed', { detail: style }));
  } catch {
    // ignore
  }
}

/**
 * High-Impact Physical Page Transition Variants for AnimatePresence
 */
export const PAGE_TRANSITION_VARIANTS: Record<PageTransitionStyle, Variants> = {
  // 1. 3D Spatial Spring Flip & Slide
  slide: {
    initial: (direction: 'slide-left' | 'slide-right') => ({
      opacity: 0,
      x: direction === 'slide-left' ? 100 : -100,
      rotateY: direction === 'slide-left' ? 7 : -7,
      scale: 0.98,
    }),
    animate: {
      opacity: 1,
      x: 0,
      rotateY: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 28,
        mass: 0.75,
      },
    },
    exit: (direction: 'slide-left' | 'slide-right') => ({
      opacity: 0,
      x: direction === 'slide-left' ? -80 : 80,
      rotateY: direction === 'slide-left' ? -6 : 6,
      scale: 0.98,
      transition: {
        duration: 0.14,
        ease: 'easeOut',
      },
    }),
  },

  // 2. Radiant Aurora Glow Diffusion
  fade: {
    initial: {
      opacity: 0,
      scale: 1.04,
      filter: 'blur(8px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      filter: 'blur(6px)',
      transition: {
        duration: 0.14,
        ease: 'easeOut',
      },
    },
  },

  // 3. Cosmic Elastic Warp
  zoom: {
    initial: {
      opacity: 0,
      scale: 0.9,
      y: 24,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 450,
        damping: 26,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      scale: 1.04,
      y: -18,
      transition: {
        duration: 0.13,
        ease: 'easeOut',
      },
    },
  },
};
