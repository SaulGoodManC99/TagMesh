import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { playChime, playPop } from './soundEffects';
import { triggerConfettiShower } from './confetti';
import { isDarkModeActive } from './siteConfig';

export interface NoteCardTheme {
  bg: string;
  tagPill: string;
  hoverGlow: string;
  emoji: string;
}

export interface ClayTheme {
  id: 'sakura' | 'stars' | 'zen' | 'fireflies' | 'rain';
  nameZh: string;
  nameEn: string;
  emoji: string;
  atmosphereDescZh: string;
  atmosphereDescEn: string;
  bg: string;
  darkBg: string;
  headerBg: string;
  darkHeaderBg: string;
  primaryGradient: string;
  accentText: string;
  glowColor: string;
  washiGradient: string;
  editorBg: string;
  darkEditorBg: string;
  badgeBg: string;
  activeBtnClass: string;
  island1Bg: string;
  island2Bg: string;
  universeRibbonBgs: string[];
  noteCardThemes: NoteCardTheme[];
}

export const CLAY_THEMES: ClayTheme[] = [
  // 1. 🌸 樱花物语 (Sakura Bloom)
  {
    id: 'sakura',
    nameZh: '樱花物语',
    nameEn: 'Sakura Bloom',
    emoji: '🌸',
    atmosphereDescZh: '落英缤纷 • 治愈花瓣随风轻拂',
    atmosphereDescEn: 'Falling petals & soft rose breeze',
    bg: '#fff1f3',
    darkBg: '#0f0e16',
    headerBg: '#ffe4e8',
    darkHeaderBg: '#161322',
    primaryGradient: 'from-pink-500 via-rose-500 to-amber-400',
    accentText: 'text-rose-600 dark:text-rose-400',
    glowColor: 'rgba(244, 114, 182, 0.45)',
    washiGradient: 'from-pink-300 via-rose-300 to-amber-200',
    editorBg: '#fff1f3',
    darkEditorBg: '#0f0e16',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    activeBtnClass: 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-300 border border-rose-300/90 dark:border-rose-500/40 shadow-sm',
    island1Bg: 'bg-white dark:bg-neutral-900',
    island2Bg: 'bg-white dark:bg-neutral-900',
    universeRibbonBgs: [
      'from-rose-100/90 to-pink-100/70',
      'from-pink-100/90 to-amber-100/70',
      'from-amber-100/90 to-rose-100/70',
      'from-purple-100/90 to-pink-100/70',
      'from-rose-100/90 to-orange-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🌸',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-900',
        hoverGlow: 'rgba(236, 72, 153, 0.3)',
        emoji: '🎀',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🍓',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900',
        hoverGlow: 'rgba(168, 85, 247, 0.3)',
        emoji: '🍬',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🍑',
      },
    ],
  },

  // 2. 🌌 极光星瀚 (Cosmic Aurora)
  {
    id: 'stars',
    nameZh: '极光星瀚',
    nameEn: 'Cosmic Aurora',
    emoji: '🌌',
    atmosphereDescZh: '梦幻星河 • 极光与流星雨划过夜空',
    atmosphereDescEn: 'Starlit aurora & passing meteors',
    bg: '#ede9fe',
    darkBg: '#0c0a16',
    headerBg: '#e0e7ff',
    darkHeaderBg: '#131024',
    primaryGradient: 'from-purple-600 via-indigo-600 to-pink-500',
    accentText: 'text-purple-700 dark:text-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    washiGradient: 'from-purple-300 via-indigo-300 to-pink-200',
    editorBg: '#ede9fe',
    darkEditorBg: '#0c0a16',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    activeBtnClass: 'bg-purple-500/15 text-purple-600 dark:bg-purple-500/25 dark:text-purple-300 border border-purple-300/90 dark:border-purple-500/40 shadow-sm',
    island1Bg: 'bg-white dark:bg-neutral-900',
    island2Bg: 'bg-white dark:bg-neutral-900',
    universeRibbonBgs: [
      'from-purple-100/90 to-indigo-100/70',
      'from-indigo-100/90 to-pink-100/70',
      'from-pink-100/90 to-purple-100/70',
      'from-violet-100/90 to-cyan-100/70',
      'from-purple-100/90 to-blue-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900',
        hoverGlow: 'rgba(168, 85, 247, 0.3)',
        emoji: '🌌',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
        hoverGlow: 'rgba(99, 102, 241, 0.3)',
        emoji: '🪐',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-900',
        hoverGlow: 'rgba(236, 72, 153, 0.3)',
        emoji: '🌠',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
        hoverGlow: 'rgba(6, 182, 212, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-900',
        hoverGlow: 'rgba(139, 92, 246, 0.3)',
        emoji: '🔮',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '🌙',
      },
    ],
  },

  // 3. 🍵 禅意苔原 (Zen Bamboo)
  {
    id: 'zen',
    nameZh: '禅意苔原',
    nameEn: 'Zen Bamboo',
    emoji: '🍵',
    atmosphereDescZh: '竹韵草木 • 晨曦水珠与金色浮游光斑',
    atmosphereDescEn: 'Dewdrops on bamboo & sunlit motes',
    bg: '#ecfdf5',
    darkBg: '#08110e',
    headerBg: '#d1fae5',
    darkHeaderBg: '#0f1c17',
    primaryGradient: 'from-emerald-600 via-teal-600 to-amber-500',
    accentText: 'text-emerald-800 dark:text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    washiGradient: 'from-emerald-300 via-teal-300 to-lime-200',
    editorBg: '#ecfdf5',
    darkEditorBg: '#08110e',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    activeBtnClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-300/90 dark:border-emerald-500/40 shadow-sm',
    island1Bg: 'bg-white dark:bg-neutral-900',
    island2Bg: 'bg-white dark:bg-neutral-900',
    universeRibbonBgs: [
      'from-emerald-100/90 to-teal-100/70',
      'from-lime-100/90 to-emerald-100/70',
      'from-teal-100/90 to-cyan-100/70',
      'from-green-100/90 to-emerald-100/70',
      'from-emerald-100/90 to-amber-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
        hoverGlow: 'rgba(16, 185, 129, 0.3)',
        emoji: '🍵',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300 border-lime-200 dark:border-lime-900',
        hoverGlow: 'rgba(132, 204, 22, 0.3)',
        emoji: '🌿',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-900',
        hoverGlow: 'rgba(20, 184, 166, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border-green-200 dark:border-green-900',
        hoverGlow: 'rgba(34, 197, 94, 0.3)',
        emoji: '🍃',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '🎋',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
        hoverGlow: 'rgba(16, 185, 129, 0.3)',
        emoji: '🪵',
      },
    ],
  },

  // 4. 👑 琥珀盛夏 (Amber Glow)
  {
    id: 'fireflies',
    nameZh: '琥珀盛夏',
    nameEn: 'Amber Glow',
    emoji: '👑',
    atmosphereDescZh: '暖日琥珀 • 金色光尘与呼吸光晕',
    atmosphereDescEn: 'Amber glow & floating golden motes',
    bg: '#fef3c7',
    darkBg: '#120e07',
    headerBg: '#fde68a',
    darkHeaderBg: '#1c160b',
    primaryGradient: 'from-amber-500 via-orange-500 to-rose-500',
    accentText: 'text-amber-800 dark:text-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    washiGradient: 'from-amber-300 via-orange-300 to-yellow-200',
    editorBg: '#fef3c7',
    darkEditorBg: '#120e07',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    activeBtnClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-300/90 dark:border-amber-500/40 shadow-sm',
    island1Bg: 'bg-white dark:bg-neutral-900',
    island2Bg: 'bg-white dark:bg-neutral-900',
    universeRibbonBgs: [
      'from-amber-100/90 to-yellow-100/70',
      'from-orange-100/90 to-amber-100/70',
      'from-yellow-100/90 to-rose-100/70',
      'from-amber-100/90 to-orange-100/70',
      'from-orange-100/90 to-pink-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '👑',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🍯',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900',
        hoverGlow: 'rgba(234, 179, 8, 0.3)',
        emoji: '🌻',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🍂',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🥞',
      },
    ],
  },

  // 5. 🌊 深海微雨 (Ocean Dew)
  {
    id: 'rain',
    nameZh: '深海微雨',
    nameEn: 'Ocean Dew',
    emoji: '🌊',
    atmosphereDescZh: '静谧雨幕 • 细雨涟漪与深海微光',
    atmosphereDescEn: 'Gentle raindrops & oceanic ripples',
    bg: '#ecfeff',
    darkBg: '#070f17',
    headerBg: '#cffafe',
    darkHeaderBg: '#0d1a26',
    primaryGradient: 'from-cyan-600 via-sky-600 to-blue-600',
    accentText: 'text-cyan-800 dark:text-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    washiGradient: 'from-cyan-300 via-sky-300 to-blue-200',
    editorBg: '#ecfeff',
    darkEditorBg: '#070f17',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
    activeBtnClass: 'bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/25 dark:text-cyan-300 border border-cyan-300/90 dark:border-cyan-500/40 shadow-sm',
    island1Bg: 'bg-white dark:bg-neutral-900',
    island2Bg: 'bg-white dark:bg-neutral-900',
    universeRibbonBgs: [
      'from-cyan-100/90 to-sky-100/70',
      'from-sky-100/90 to-blue-100/70',
      'from-blue-100/90 to-teal-100/70',
      'from-teal-100/90 to-cyan-100/70',
      'from-cyan-100/90 to-indigo-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
        hoverGlow: 'rgba(6, 182, 212, 0.3)',
        emoji: '🌊',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900',
        hoverGlow: 'rgba(14, 165, 233, 0.3)',
        emoji: '💧',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        hoverGlow: 'rgba(59, 130, 246, 0.3)',
        emoji: '🐟',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-900',
        hoverGlow: 'rgba(20, 184, 166, 0.3)',
        emoji: '🫧',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
        hoverGlow: 'rgba(99, 102, 241, 0.3)',
        emoji: '🐚',
      },
      {
        bg: 'bg-white dark:bg-neutral-900',
        tagPill: 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900',
        hoverGlow: 'rgba(14, 165, 233, 0.3)',
        emoji: '⛵',
      },
    ],
  },
];

interface ClayThemeContextValue {
  theme: ClayTheme;
  themeId: ClayTheme['id'];
  setTheme: (id: ClayTheme['id']) => void;
  nextTheme: () => void;
  switchNextTheme: () => void;
  isDark: boolean;
}

const ClayThemeContext = createContext<ClayThemeContextValue | null>(null);

const STORAGE_KEY = 'tagmesh_clay_theme_v3';

export const ClayThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ClayTheme['id']>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && CLAY_THEMES.some((t) => t.id === saved)) {
        return saved as ClayTheme['id'];
      }
    } catch {
      // ignore
    }
    return 'sakura';
  });

  const [isDark, setIsDark] = useState<boolean>(() => isDarkModeActive());

  useEffect(() => {
    const handleConfigChange = () => {
      setIsDark(isDarkModeActive());
    };

    window.addEventListener('tagmesh_site_config_changed', handleConfigChange);
    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) mql.addEventListener('change', handleConfigChange);

    return () => {
      window.removeEventListener('tagmesh_site_config_changed', handleConfigChange);
      if (mql) mql.removeEventListener('change', handleConfigChange);
    };
  }, []);

  const baseTheme = CLAY_THEMES.find((t) => t.id === themeId) || CLAY_THEMES[0];

  const theme: ClayTheme = useMemo(() => {
    if (!isDark) return baseTheme;
    return {
      ...baseTheme,
      bg: baseTheme.darkBg,
      headerBg: baseTheme.darkHeaderBg,
      editorBg: baseTheme.darkEditorBg,
    };
  }, [baseTheme, isDark]);

  const [themeToast, setThemeToast] = useState<{ emoji: string; nameZh: string; nameEn: string; desc: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
      if (typeof document !== 'undefined') {
        const activeBg = isDark ? baseTheme.darkBg : baseTheme.bg;
        document.body.style.backgroundColor = activeBg;
        document.documentElement.style.backgroundColor = activeBg;
      }
    } catch {
      // ignore
    }
  }, [themeId, isDark, baseTheme]);

  const showThemeNotification = (target: ClayTheme) => {
    setThemeToast({
      emoji: target.emoji,
      nameZh: target.nameZh,
      nameEn: target.nameEn,
      desc: target.atmosphereDescZh,
    });
    setTimeout(() => {
      setThemeToast((curr) => (curr?.nameZh === target.nameZh ? null : curr));
    }, 2400);
  };

  const setTheme = (id: ClayTheme['id']) => {
    const target = CLAY_THEMES.find((t) => t.id === id) || CLAY_THEMES[0];
    playPop(650);
    setThemeId(id);
    showThemeNotification(target);
  };

  const nextTheme = () => {
    const currentIndex = CLAY_THEMES.findIndex((t) => t.id === themeId);
    const nextIndex = (currentIndex + 1) % CLAY_THEMES.length;
    const target = CLAY_THEMES[nextIndex];
    playChime();
    setThemeId(target.id);
    triggerConfettiShower(18);
    showThemeNotification(target);
  };

  return (
    <ClayThemeContext.Provider value={{ theme, themeId, setTheme, nextTheme, switchNextTheme: nextTheme, isDark }}>
      {children}

      {/* Floating Theme Switch Toast Feedback */}
      {themeToast && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-16 left-4 sm:left-8 z-[350] pointer-events-none animate-in fade-in slide-in-from-top-2 slide-in-from-left-3 duration-250">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-2 border-amber-300/80 dark:border-amber-500/40 shadow-2xl clay-card text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm font-bubble font-bold">
            <span className="text-lg select-none">{themeToast.emoji}</span>
            <span className="text-neutral-900 dark:text-neutral-100">
              已切换至「{themeToast.nameZh}」次元
            </span>
            <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500 font-cute text-xs">
              • {themeToast.desc}
            </span>
          </div>
        </div>,
        document.body
      )}
    </ClayThemeContext.Provider>
  );
};

export const useClayTheme = () => {
  const ctx = useContext(ClayThemeContext);
  if (!ctx) {
    throw new Error('useClayTheme must be used within ClayThemeProvider');
  }
  return ctx;
};
