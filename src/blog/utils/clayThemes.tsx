import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { playChime, playPop } from './soundEffects';
import { triggerConfettiShower } from './confetti';

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
  headerBg: string;
  primaryGradient: string;
  accentText: string;
  glowColor: string;
  washiGradient: string;
  editorBg: string;
  badgeBg: string;
  island1Bg: string;
  island2Bg: string;
  universeRibbonBgs: string[];
  noteCardThemes: NoteCardTheme[];
}

export const CLAY_THEMES: ClayTheme[] = [
  // 1. 🌸 樱花物语 (Sakura Bloom) - 柔粉蜜桃背景 + 翻飞樱花花瓣
  {
    id: 'sakura',
    nameZh: '樱花物语',
    nameEn: 'Sakura Bloom',
    emoji: '🌸',
    atmosphereDescZh: '落英缤纷 • 治愈花瓣随风轻拂',
    atmosphereDescEn: 'Falling petals & soft rose breeze',
    bg: '#fff1f3',
    headerBg: '#ffe4e8',
    primaryGradient: 'from-pink-500 via-rose-500 to-amber-400',
    accentText: 'text-rose-600',
    glowColor: 'rgba(244, 114, 182, 0.45)',
    washiGradient: 'from-pink-300 via-rose-300 to-amber-200',
    editorBg: '#fff1f3',
    badgeBg: 'bg-rose-100 text-rose-700 border-rose-200',
    island1Bg: 'bg-white',
    island2Bg: 'bg-white',
    universeRibbonBgs: [
      'from-rose-100/90 to-pink-100/70',
      'from-pink-100/90 to-amber-100/70',
      'from-amber-100/90 to-rose-100/70',
      'from-purple-100/90 to-pink-100/70',
      'from-rose-100/90 to-orange-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white',
        tagPill: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🌸',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200',
        hoverGlow: 'rgba(236, 72, 153, 0.3)',
        emoji: '🎀',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🍓',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
        hoverGlow: 'rgba(168, 85, 247, 0.3)',
        emoji: '🍬',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🍑',
      },
    ],
  },

  // 2. 🌌 极光星瀚 (Cosmic Aurora) - 梦幻薰衣草星空紫背景 + 彩色极光与流星
  {
    id: 'stars',
    nameZh: '极光星瀚',
    nameEn: 'Cosmic Aurora',
    emoji: '🌌',
    atmosphereDescZh: '梦幻星河 • 极光与流星雨划过夜空',
    atmosphereDescEn: 'Starlit aurora & passing meteors',
    bg: '#ede9fe',
    headerBg: '#e0e7ff',
    primaryGradient: 'from-purple-600 via-indigo-600 to-pink-500',
    accentText: 'text-purple-700',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    washiGradient: 'from-purple-300 via-indigo-300 to-pink-200',
    editorBg: '#ede9fe',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    island1Bg: 'bg-white',
    island2Bg: 'bg-white',
    universeRibbonBgs: [
      'from-purple-100/90 to-indigo-100/70',
      'from-indigo-100/90 to-pink-100/70',
      'from-pink-100/90 to-purple-100/70',
      'from-violet-100/90 to-cyan-100/70',
      'from-purple-100/90 to-blue-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white',
        tagPill: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
        hoverGlow: 'rgba(168, 85, 247, 0.3)',
        emoji: '🌌',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
        hoverGlow: 'rgba(99, 102, 241, 0.3)',
        emoji: '🪐',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200',
        hoverGlow: 'rgba(236, 72, 153, 0.3)',
        emoji: '🌠',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200',
        hoverGlow: 'rgba(6, 182, 212, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200',
        hoverGlow: 'rgba(139, 92, 246, 0.3)',
        emoji: '🔮',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '🌙',
      },
    ],
  },

  // 3. 🍵 禅意苔原 (Zen Bamboo) - 清冽竹韵草木绿背景 + 晨曦水珠与浮游光斑
  {
    id: 'zen',
    nameZh: '禅意苔原',
    nameEn: 'Zen Bamboo',
    emoji: '🍵',
    atmosphereDescZh: '竹韵草木 • 晨曦水珠与金色浮游光斑',
    atmosphereDescEn: 'Dewdrops on bamboo & sunlit motes',
    bg: '#ecfdf5',
    headerBg: '#d1fae5',
    primaryGradient: 'from-emerald-600 via-teal-600 to-amber-500',
    accentText: 'text-emerald-800',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    washiGradient: 'from-emerald-300 via-teal-300 to-lime-200',
    editorBg: '#ecfdf5',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    island1Bg: 'bg-white',
    island2Bg: 'bg-white',
    universeRibbonBgs: [
      'from-emerald-100/90 to-teal-100/70',
      'from-lime-100/90 to-emerald-100/70',
      'from-teal-100/90 to-cyan-100/70',
      'from-green-100/90 to-emerald-100/70',
      'from-emerald-100/90 to-amber-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white',
        tagPill: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
        hoverGlow: 'rgba(16, 185, 129, 0.3)',
        emoji: '🍵',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-lime-50 text-lime-700 hover:bg-lime-100 border-lime-200',
        hoverGlow: 'rgba(132, 204, 22, 0.3)',
        emoji: '🌿',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200',
        hoverGlow: 'rgba(20, 184, 166, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
        hoverGlow: 'rgba(34, 197, 94, 0.3)',
        emoji: '🍃',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '🎋',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
        hoverGlow: 'rgba(16, 185, 129, 0.3)',
        emoji: '🪵',
      },
    ],
  },

  // 4. 👑 琥珀盛夏 (Amber Glow) - 温暖奶油琥珀金背景 + 浮空金色光尘与泡泡
  {
    id: 'fireflies',
    nameZh: '琥珀盛夏',
    nameEn: 'Amber Glow',
    emoji: '👑',
    atmosphereDescZh: '暖日琥珀 • 金色光尘与呼吸光晕',
    atmosphereDescEn: 'Amber glow & floating golden motes',
    bg: '#fef3c7',
    headerBg: '#fde68a',
    primaryGradient: 'from-amber-500 via-orange-500 to-rose-500',
    accentText: 'text-amber-800',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    washiGradient: 'from-amber-300 via-orange-300 to-yellow-200',
    editorBg: '#fef3c7',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    island1Bg: 'bg-white',
    island2Bg: 'bg-white',
    universeRibbonBgs: [
      'from-amber-100/90 to-yellow-100/70',
      'from-orange-100/90 to-amber-100/70',
      'from-yellow-100/90 to-rose-100/70',
      'from-amber-100/90 to-orange-100/70',
      'from-orange-100/90 to-pink-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white',
        tagPill: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '👑',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-orange-50 text-orange-800 hover:bg-orange-100 border-orange-200',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🍯',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
        hoverGlow: 'rgba(234, 179, 8, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '🍮',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200',
        hoverGlow: 'rgba(244, 63, 94, 0.3)',
        emoji: '🔥',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-orange-50 text-orange-800 hover:bg-orange-100 border-orange-200',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🌻',
      },
    ],
  },

  // 5. 🌊 蔚蓝深海 (Azure Ocean) - 静谧冰川浅海蓝背景 + 浪花波纹与深海水滴
  {
    id: 'rain',
    nameZh: '蔚蓝深海',
    nameEn: 'Azure Ocean',
    emoji: '🌊',
    atmosphereDescZh: '静谧浅海 • 碧波水滴与浪花微澜',
    atmosphereDescEn: 'Deep azure ocean & soothing ripples',
    bg: '#e0f2fe',
    headerBg: '#bae6fd',
    primaryGradient: 'from-cyan-600 via-sky-600 to-blue-700',
    accentText: 'text-sky-800',
    glowColor: 'rgba(2, 132, 199, 0.45)',
    washiGradient: 'from-sky-300 via-cyan-300 to-blue-200',
    editorBg: '#e0f2fe',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-200',
    island1Bg: 'bg-white',
    island2Bg: 'bg-white',
    universeRibbonBgs: [
      'from-sky-100/90 to-indigo-100/70',
      'from-cyan-100/90 to-sky-100/70',
      'from-blue-100/90 to-teal-100/70',
      'from-sky-100/90 to-cyan-100/70',
      'from-teal-100/90 to-sky-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white',
        tagPill: 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200',
        hoverGlow: 'rgba(14, 165, 233, 0.3)',
        emoji: '🌊',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-200',
        hoverGlow: 'rgba(6, 182, 212, 0.3)',
        emoji: '🐬',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200',
        hoverGlow: 'rgba(59, 130, 246, 0.3)',
        emoji: '💧',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-teal-50 text-teal-800 hover:bg-teal-100 border-teal-200',
        hoverGlow: 'rgba(20, 184, 166, 0.3)',
        emoji: '🫧',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-indigo-200',
        hoverGlow: 'rgba(99, 102, 241, 0.3)',
        emoji: '🐚',
      },
      {
        bg: 'bg-white',
        tagPill: 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200',
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

  const theme = CLAY_THEMES.find((t) => t.id === themeId) || CLAY_THEMES[0];

  const [themeToast, setThemeToast] = useState<{ emoji: string; nameZh: string; nameEn: string; desc: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = theme.bg;
      }
    } catch {
      // ignore
    }
  }, [themeId, theme.bg]);

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
    <ClayThemeContext.Provider value={{ theme, themeId, setTheme, nextTheme, switchNextTheme: nextTheme }}>
      {children}

      {/* Floating Theme Switch Toast Feedback (Top-Left Safe Corner) */}
      {themeToast && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-16 left-4 sm:left-8 z-[200] pointer-events-none animate-in fade-in slide-in-from-top-2 slide-in-from-left-3 duration-250">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/98 backdrop-blur-md border-2 border-amber-300/80 shadow-2xl clay-card text-neutral-800 text-xs sm:text-sm font-bubble font-bold">
            <span className="text-lg select-none">{themeToast.emoji}</span>
            <span className="text-neutral-900">
              已切换至「{themeToast.nameZh}」次元
            </span>
            <span className="hidden sm:inline text-neutral-400 font-cute text-xs">
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
