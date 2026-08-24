export type PageTransitionStyle = 'slide' | 'fade' | 'zoom';

export interface TransitionStyleOption {
  id: PageTransitionStyle;
  nameZh: string;
  nameEn: string;
  emoji: string;
}

export const TRANSITION_STYLES: TransitionStyleOption[] = [
  { id: 'slide', nameZh: '左右滑动画卷', nameEn: 'Slide Stream', emoji: '↔️' },
  { id: 'fade', nameZh: '柔光预渲染', nameEn: 'Glow Pre-render', emoji: '✨' },
  { id: 'zoom', nameZh: '3D 弹性微缩', nameEn: '3D Spring Zoom', emoji: '💫' },
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
