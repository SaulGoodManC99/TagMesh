import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RotateCw, 
  Globe, 
  Volume2, 
  VolumeX, 
  ArrowUp, 
  PenTool, 
  Home, 
  Layers, 
  Moon, 
  Sun,
  ChevronRight,
  Check,
  Palette,
  Sliders,
  Wind,
  Dices,
  X
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';
import { useSiteConfig } from '../../hooks/useSiteConfig';
import { ButtonStyle } from '../utils/siteConfig';
import { useClayTheme, AtmosphereIntensity, CLAY_THEMES, ClayTheme } from '../utils/clayThemes';
import { isSoundEnabled, toggleSound, playPop, playSoftTick, playChime } from '../utils/soundEffects';
import { toast } from '../../components/ClayToast';
import { ViewMode } from '../ClayModeDock';
import { SPRING_MICRO, SPRING_MODAL } from '../utils/motionSystem';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ClayGlobalContextMenuProps {
  currentRoute?: 'home' | 'gallery' | 'editor';
  viewMode?: ViewMode;
  onSelectMode?: (mode: ViewMode) => void;
  onRefresh?: () => void;
  onGoToEditor?: () => void;
}

const MODES: Array<{ id: ViewMode; nameZh: string; nameEn: string; emoji: string }> = [
  { id: 'grid', nameZh: '便当瀑布流', nameEn: 'Bento Grid', emoji: '🍱' },
  { id: 'timeline', nameZh: '时光卷轴', nameEn: 'Timeline Stream', emoji: '⏳' },
];

const BUTTON_STYLES: Array<{ id: ButtonStyle; nameZh: string; nameEn: string; emoji: string; descZh: string; descEn: string }> = [
  { id: 'neon', nameZh: '霓虹微光', nameEn: 'Neon Glow', emoji: '⚡', descZh: '柔光发光外轮廓', descEn: 'Radiant neon aura' },
  { id: 'laser', nameZh: '极光微弹', nameEn: 'Laser Elastic', emoji: '✨', descZh: '动感微弹跳跃', descEn: 'Kinetic micro-bounce' },
  { id: 'jelly', nameZh: '果冻微弹', nameEn: 'Jelly Physics', emoji: '🍬', descZh: 'Q弹柔韧果肉感', descEn: 'Squishy jelly elasticity' },
  { id: 'tint', nameZh: '柔和微淡', nameEn: 'Soft Tint', emoji: '🎨', descZh: '极简极净柔色', descEn: 'Minimalist subtle tint' },
  { id: 'clay', nameZh: '3D粘土', nameEn: 'Clay Tactile', emoji: '🧸', descZh: '饱满拟物浮雕', descEn: 'Chunky neumorphic clay' },
  { id: 'glass', nameZh: '晶透玻璃', nameEn: 'Frosted Glass', emoji: '🧊', descZh: '晶莹清透毛玻璃', descEn: 'Crystalline frosted glass' },
];

const ATMOSPHERE_MODES: Array<{ id: AtmosphereIntensity; nameZh: string; nameEn: string; emoji: string; descZh: string; descEn: string }> = [
  { id: 'soft', nameZh: '舒缓微风', nameEn: 'Soft Breeze', emoji: '🍃', descZh: '轻盈慢速浮游微粒', descEn: 'Gentle slow drift motes' },
  { id: 'dynamic', nameZh: '灵动幻彩', nameEn: 'Dynamic Aura', emoji: '✨', descZh: '全屏流光浮层交互', descEn: 'Full floating stardust & aura' },
  { id: 'off', nameZh: '静止无光', nameEn: 'Off / Static', emoji: '🌑', descZh: '节能静音，沉静阅读', descEn: 'Dormant static state' },
];

export const ClayGlobalContextMenu: React.FC<ClayGlobalContextMenuProps> = ({
  currentRoute = 'home',
  viewMode = 'grid',
  onSelectMode,
  onRefresh,
  onGoToEditor,
}) => {
  const { locale, toggleLocale } = useI18n();
  const { theme, setTheme, randomTheme, atmosphereIntensity, setAtmosphereIntensity } = useClayTheme();
  const { isAdmin, openAuthModal } = useAuth();
  const { colorMode, toggleColorMode, buttonStyle, setButtonStyle } = useSiteConfig();
  
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  
  // Cascading Submenu state: 'theme' | 'buttonStyle' | 'atmosphere' | null
  const [activeSubmenu, setActiveSubmenu] = useState<'theme' | 'buttonStyle' | 'atmosphere' | null>(null);
  const closeSubmenuTimerRef = useRef<number | null>(null);

  const [showInitialHint, setShowInitialHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasSeen = localStorage.getItem('tagmesh_has_seen_context_menu_hint_v1');
    return !hasSeen;
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const touchTimerRef = useRef<number | null>(null);

  // Auto-dismiss initial hint after 4.5 seconds and save to localStorage
  useEffect(() => {
    if (!showInitialHint) return;
    const timer = setTimeout(() => {
      setShowInitialHint(false);
      try {
        localStorage.setItem('tagmesh_has_seen_context_menu_hint_v1', 'true');
      } catch {
        // ignore
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [showInitialHint]);

  // Open Context Menu Helper
  const openMenu = useCallback((clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY);
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
      return;
    }

    setPosition({ x: clientX, y: clientY });
    setActiveSubmenu(null);
    setIsOpen(true);
    playPop(650);
    if (showInitialHint) {
      setShowInitialHint(false);
      try {
        localStorage.setItem('tagmesh_has_seen_context_menu_hint_v1', 'true');
      } catch {
        // ignore
      }
    }
  }, [showInitialHint]);

  // Listen to Global Right-Click on Desktop
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.monaco-editor') || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      openMenu(e.clientX, e.clientY);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [openMenu]);

  // Listen to Long-Press (500ms) on Mobile / Touch
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const target = touch.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      touchTimerRef.current = window.setTimeout(() => {
        openMenu(touch.clientX, touch.clientY);
      }, 520);
    };

    const handleTouchEnd = () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchmove', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchEnd);
    };
  }, [openMenu]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const targetNode = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(targetNode)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSubmenu) {
          setActiveSubmenu(null);
        } else {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('touchstart', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeSubmenu]);

  // Submenu Hover Handlers (with 280ms safety buffer on mouse leave)
  const handleSubmenuEnter = (type: 'theme' | 'buttonStyle' | 'atmosphere') => {
    if (closeSubmenuTimerRef.current) {
      clearTimeout(closeSubmenuTimerRef.current);
      closeSubmenuTimerRef.current = null;
    }
    setActiveSubmenu(type);
  };

  const handleSubmenuLeave = () => {
    closeSubmenuTimerRef.current = window.setTimeout(() => {
      setActiveSubmenu(null);
    }, 280);
  };

  const handleSubmenuContainerEnter = () => {
    if (closeSubmenuTimerRef.current) {
      clearTimeout(closeSubmenuTimerRef.current);
      closeSubmenuTimerRef.current = null;
    }
  };

  // Action: Select Theme directly from Submenu
  const handleSelectTheme = (targetTheme: ClayTheme) => {
    setTheme(targetTheme.id);
    playChime();
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Random Theme
  const handleActionRandomTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    randomTheme();
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Select Button Style directly from Submenu
  const handleSelectButtonStyle = (style: typeof BUTTON_STYLES[0]) => {
    setButtonStyle(style.id);
    playPop(620);
    toast.success(
      locale === 'zh' 
        ? `全站按钮已应用「${style.nameZh}」物理触感` 
        : `All buttons updated to "${style.nameEn}" tactile response`,
      `${style.emoji} ${locale === 'zh' ? '按钮风格已更新' : 'Button Style Applied'}`
    );
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Select Atmosphere Intensity directly from Submenu
  const handleSelectAtmosphere = (mode: typeof ATMOSPHERE_MODES[0]) => {
    setAtmosphereIntensity(mode.id);
    playSoftTick();
    toast.info(
      locale === 'zh' 
        ? `粒子渲染已切换为「${mode.nameZh}」` 
        : `Atmosphere engine updated to "${mode.nameEn}"`,
      `${mode.emoji} ${locale === 'zh' ? '粒子氛围引擎' : 'Atmosphere Engine'}`
    );
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Refresh Telemetry & Notes
  const handleActionRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRefresh) onRefresh();
    toast.success(
      locale === 'zh' ? '全网最新数据与笔记已完成同步 ⚡' : 'Telemetry and notes synced ⚡',
      `🔄 ${locale === 'zh' ? '刷新同步' : 'Live Sync'}`
    );
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Toggle View Mode
  const handleActionMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectMode) {
      const currIdx = MODES.findIndex((m) => m.id === viewMode);
      const nextIdx = (currIdx + 1) % MODES.length;
      const nextMode = MODES[nextIdx];
      onSelectMode(nextMode.id);
      playPop();
      toast.info(
        locale === 'zh' ? `展示模式已切换至「${nextMode.nameZh}」` : `Note view set to ${nextMode.nameEn}`,
        `${nextMode.emoji} ${locale === 'zh' ? '笔记视图模式' : 'View Mode'}`
      );
    } else {
      window.location.hash = '#/gallery';
    }
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Toggle Language
  const handleActionLocale = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSoftTick();
    toggleLocale();
    toast.info(
      locale === 'zh' ? 'Language switched to English' : '已切换至简体中文',
      `🌐 ${locale === 'zh' ? '语言切换' : 'Language'}`
    );
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Toggle Sound
  const handleActionSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleSound();
    setSoundOn(next);
    toast.info(
      next 
        ? (locale === 'zh' ? '全局音效已开启 🔊' : 'Sound effects enabled 🔊') 
        : (locale === 'zh' ? '全局音效已静音 🔇' : 'Sound effects muted 🔇'),
      `🎵 ${locale === 'zh' ? '音效反馈' : 'Sound Feedback'}`
    );
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Toggle Color Mode
  const handleActionColorMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(540);
    toggleColorMode();
    toast.info(
      locale === 'zh' ? '外观色彩模式已更新' : 'Appearance color mode toggled',
      `🌓 ${locale === 'zh' ? '色彩外观' : 'Appearance'}`
    );
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Scroll to Top
  const handleActionTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(550);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(locale === 'zh' ? '已回到页面顶部 🔝' : 'Scrolled to top 🔝', `🚀 ${locale === 'zh' ? '快速导航' : 'Navigation'}`);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Action: Navigation
  const handleActionNav = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    window.location.hash = hash;
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Geometry calculations:
  // Primary Menu Width = 268px (w-[268px]), Submenu Width = 285px (w-[285px])
  const menuWidth = 268;
  const subMenuWidth = 285;
  const menuHeight = 380;

  // Detect whether both primary and secondary submenus fit to the right side of click point
  const canFitRight = typeof window !== 'undefined' && (position.x + menuWidth + subMenuWidth + 24 <= window.innerWidth);
  const isFlipLeft = !canFitRight;

  let clampedX = 12;
  if (typeof window !== 'undefined') {
    if (canFitRight) {
      clampedX = Math.max(12, Math.min(window.innerWidth - menuWidth - subMenuWidth - 24, position.x));
    } else {
      clampedX = Math.max(subMenuWidth + 20, Math.min(window.innerWidth - menuWidth - 12, position.x));
    }
  }

  const clampedY = typeof window !== 'undefined' ? Math.max(12, Math.min(window.innerHeight - menuHeight - 16, position.y)) : 12;

  const currentModeObj = MODES.find((m) => m.id === viewMode) || MODES[0];
  const currentButtonStyleObj = BUTTON_STYLES.find((b) => b.id === buttonStyle) || BUTTON_STYLES[0];
  const currentAtmosphereObj = ATMOSPHERE_MODES.find((a) => a.id === atmosphereIntensity) || ATMOSPHERE_MODES[0];

  const getMenuBadgeTitle = () => {
    if (currentRoute === 'home') return locale === 'zh' ? '🏰 乐园首页工具坞' : 'Home Portal Hub';
    if (currentRoute === 'gallery') return locale === 'zh' ? '📖 笔记工具坞' : 'Notes Space Hub';
    return locale === 'zh' ? 'TagMesh 灵动工具坞' : 'TagMesh Toolbox';
  };

  return (
    <>
      {/* 0. First-Time User Cute Tooltip Hint */}
      {showInitialHint && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-20 left-4 sm:left-8 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none select-none">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/90 dark:border-white/10 shadow-xl text-neutral-800 dark:text-neutral-100 text-xs font-cute">
            <span className="text-base select-none">💡</span>
            <span>
              {locale === 'zh'
                ? '提示：随时在页面空白处「右键」（移动端长按）唤出定制快捷工具箱~'
                : 'Tip: Right-click anywhere (or hold screen) to open Custom Toolbox!'}
            </span>
          </div>
        </div>,
        document.body
      )}

      {/* 1. Primary Level 1 Context Menu */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <motion.div
          ref={menuRef}
          data-no-global-btn="true"
          initial={{ opacity: 0, scale: 0.94, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
          style={{
            left: `${clampedX}px`,
            top: `${clampedY}px`,
          }}
          className="fixed z-[250] w-[268px] bg-[#fdfbf7]/98 dark:bg-[#18181b]/98 backdrop-blur-xl border-2 border-white/90 dark:border-white/10 shadow-2xl rounded-2xl clay-card p-2 text-neutral-800 dark:text-neutral-100 select-none ring-1 ring-black/5 gpu-layer"
        >
          {/* Header Title */}
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-amber-900/10 dark:border-white/10 text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>{getMenuBadgeTitle()}</span>
            </span>
            <span className="text-[9px] font-mono opacity-50 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">Esc</span>
          </div>

          <div className="space-y-1 font-cute text-xs">
            
            {/* ========== 1. CASCADING SUBMENU: THEMES (心境视觉主题) ========== */}
            <div
              onMouseEnter={() => handleSubmenuEnter('theme')}
              onMouseLeave={handleSubmenuLeave}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setActiveSubmenu(prev => prev === 'theme' ? null : 'theme')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left group ${
                  activeSubmenu === 'theme'
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-xs font-bold`
                    : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0 leading-none group-hover:scale-115 transition-transform">
                    {theme.emoji}
                  </span>
                  <span className="font-bold truncate">{locale === 'zh' ? '心境视觉主题' : 'Visual Themes'}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className={`text-[10px] font-bubble font-bold ${activeSubmenu === 'theme' ? 'text-white' : 'text-rose-500'}`}>
                    {locale === 'zh' ? theme.nameZh : theme.nameEn}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeSubmenu === 'theme' ? (isFlipLeft ? '-rotate-180 text-white' : 'rotate-90 text-white') : 'opacity-50 group-hover:translate-x-0.5'
                  }`} />
                </div>
              </button>

              {/* Relative Submenu Floating Panel (Zero Overlap & Single Clean Scrollbar) */}
              <AnimatePresence>
                {activeSubmenu === 'theme' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: isFlipLeft ? 8 : -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: isFlipLeft ? 6 : -6, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                    onMouseEnter={handleSubmenuContainerEnter}
                    onMouseLeave={handleSubmenuLeave}
                    className={`absolute z-[260] w-[285px] overflow-hidden bg-[#fdfbf7]/98 dark:bg-[#18181b]/98 backdrop-blur-2xl border-2 border-white/90 dark:border-white/10 shadow-2xl rounded-2xl clay-card p-2 text-neutral-800 dark:text-neutral-100 select-none ring-1 ring-black/5 ${
                      isFlipLeft ? 'right-full mr-2' : 'left-full ml-2'
                    } -top-1`}
                  >
                    {/* Hover Bridge */}
                    <div className={`absolute top-0 bottom-0 ${isFlipLeft ? '-right-3 w-3' : '-left-3 w-3'}`} />

                    {/* Submenu Header */}
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400 border-b border-amber-900/10 dark:border-white/10 pb-1.5 mb-1.5">
                      <span className="flex items-center gap-1.5 text-rose-500">
                        <Palette className="w-3.5 h-3.5" />
                        <span>{locale === 'zh' ? '8 大心境视觉次元' : 'Visual Dimensions'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-500 font-bold px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50">8 Themes</span>
                    </div>

                    {/* Random Theme Surprise Entry */}
                    <button
                      type="button"
                      onClick={handleActionRandomTheme}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 hover:from-amber-500/25 hover:via-rose-500/25 hover:to-purple-500/25 border border-amber-500/20 text-neutral-900 dark:text-neutral-100 font-bubble font-bold text-xs transition cursor-pointer active:scale-95 text-left group mb-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base group-hover:rotate-180 transition-transform duration-500 shrink-0">🎲</span>
                        <span className="bg-gradient-to-r from-amber-600 to-rose-600 dark:from-amber-400 dark:to-rose-400 bg-clip-text text-transparent truncate">
                          {locale === 'zh' ? '随机心境漫游' : 'Randomize'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-rose-500 font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-rose-200 dark:border-rose-900/50">Play</span>
                    </button>

                    {/* Themes List (Single Scrollbar) */}
                    <div className="space-y-1 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
                      {CLAY_THEMES.map((item) => {
                        const isCurrent = theme.id === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectTheme(item)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition cursor-pointer text-left text-xs ${
                              isCurrent
                                ? `bg-gradient-to-r ${item.primaryGradient} text-white font-bold shadow-xs`
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{item.emoji}</span>
                              <div className="min-w-0">
                                <p className="font-bubble font-bold truncate leading-tight text-xs">
                                  {locale === 'zh' ? item.nameZh : item.nameEn}
                                </p>
                                <p className={`text-[11px] font-cute truncate mt-0.5 ${isCurrent ? 'text-white/85' : 'text-neutral-400 dark:text-neutral-500'}`}>
                                  {locale === 'zh' ? item.atmosphereDescZh : item.atmosphereDescEn}
                                </p>
                              </div>
                            </div>

                            {isCurrent && (
                              <Check className="w-4 h-4 text-white shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ========== 2. CASCADING SUBMENU: BUTTON STYLES (按钮触感风格) ========== */}
            <div
              onMouseEnter={() => handleSubmenuEnter('buttonStyle')}
              onMouseLeave={handleSubmenuLeave}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setActiveSubmenu(prev => prev === 'buttonStyle' ? null : 'buttonStyle')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left group ${
                  activeSubmenu === 'buttonStyle'
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-xs font-bold`
                    : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0 leading-none group-hover:scale-115 transition-transform">
                    {currentButtonStyleObj.emoji}
                  </span>
                  <span className="font-bold truncate">{locale === 'zh' ? '按钮触感风格' : 'Button Styles'}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className={`text-[10px] font-bubble font-bold ${activeSubmenu === 'buttonStyle' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>
                    {locale === 'zh' ? currentButtonStyleObj.nameZh : currentButtonStyleObj.nameEn}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeSubmenu === 'buttonStyle' ? (isFlipLeft ? '-rotate-180 text-white' : 'rotate-90 text-white') : 'opacity-50 group-hover:translate-x-0.5'
                  }`} />
                </div>
              </button>

              {/* Relative Submenu Floating Panel (Zero Overlap & Clean Layout) */}
              <AnimatePresence>
                {activeSubmenu === 'buttonStyle' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: isFlipLeft ? 8 : -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: isFlipLeft ? 6 : -6, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                    onMouseEnter={handleSubmenuContainerEnter}
                    onMouseLeave={handleSubmenuLeave}
                    className={`absolute z-[260] w-[285px] bg-[#fdfbf7]/98 dark:bg-[#18181b]/98 backdrop-blur-2xl border-2 border-white/90 dark:border-white/10 shadow-2xl rounded-2xl clay-card p-2 text-neutral-800 dark:text-neutral-100 select-none ring-1 ring-black/5 ${
                      isFlipLeft ? 'right-full mr-2' : 'left-full ml-2'
                    } -top-1`}
                  >
                    {/* Hover Bridge */}
                    <div className={`absolute top-0 bottom-0 ${isFlipLeft ? '-right-3 w-3' : '-left-3 w-3'}`} />

                    {/* Submenu Header */}
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400 border-b border-amber-900/10 dark:border-white/10 pb-1.5 mb-1.5">
                      <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{locale === 'zh' ? '按钮物理触感 (悬浮体验)' : 'Tactile Styles'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50">6 Styles</span>
                    </div>

                    <div className="space-y-1.5">
                      {BUTTON_STYLES.map((item) => {
                        const isCurrent = buttonStyle === item.id;
                        const previewClass = `ctx-btn-preview-${item.id}`;
                        const activeClass = `ctx-btn-active-${item.id}`;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectButtonStyle(item)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-left text-xs ${previewClass} ${
                              isCurrent
                                ? `${activeClass} font-bold shadow-xs`
                                : 'bg-white/80 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-100 shadow-3xs'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{item.emoji}</span>
                              <div className="min-w-0">
                                <p className="font-bubble font-bold truncate leading-tight text-xs">
                                  {locale === 'zh' ? item.nameZh : item.nameEn}
                                </p>
                                <p className={`text-[11px] font-cute truncate mt-0.5 ${isCurrent ? 'opacity-90' : 'text-neutral-400 dark:text-neutral-500'}`}>
                                  {locale === 'zh' ? item.descZh : item.descEn}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                isCurrent ? 'bg-white/20 border-white/40 text-current' : 'bg-neutral-100 dark:bg-neutral-700/60 border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300'
                              }`}>
                                {item.id.toUpperCase()}
                              </span>
                              {isCurrent && (
                                <Check className="w-3.5 h-3.5 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ========== 3. CASCADING SUBMENU: ATMOSPHERE ENGINE (粒子氛围引擎) ========== */}
            <div
              onMouseEnter={() => handleSubmenuEnter('atmosphere')}
              onMouseLeave={handleSubmenuLeave}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setActiveSubmenu(prev => prev === 'atmosphere' ? null : 'atmosphere')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left group ${
                  activeSubmenu === 'atmosphere'
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-xs font-bold`
                    : 'hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-700 dark:hover:text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0 leading-none group-hover:scale-115 transition-transform">
                    {currentAtmosphereObj.emoji}
                  </span>
                  <span className="font-bold truncate">{locale === 'zh' ? '粒子氛围引擎' : 'Atmosphere Engine'}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className={`text-[10px] font-bubble font-bold ${activeSubmenu === 'atmosphere' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'}`}>
                    {locale === 'zh' ? currentAtmosphereObj.nameZh : currentAtmosphereObj.nameEn}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeSubmenu === 'atmosphere' ? (isFlipLeft ? '-rotate-180 text-white' : 'rotate-90 text-white') : 'opacity-50 group-hover:translate-x-0.5'
                  }`} />
                </div>
              </button>

              {/* Relative Submenu Floating Panel (Zero Overlap & Clean Layout) */}
              <AnimatePresence>
                {activeSubmenu === 'atmosphere' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: isFlipLeft ? 8 : -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: isFlipLeft ? 6 : -6, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                    onMouseEnter={handleSubmenuContainerEnter}
                    onMouseLeave={handleSubmenuLeave}
                    className={`absolute z-[260] w-[285px] bg-[#fdfbf7]/98 dark:bg-[#18181b]/98 backdrop-blur-2xl border-2 border-white/90 dark:border-white/10 shadow-2xl rounded-2xl clay-card p-2 text-neutral-800 dark:text-neutral-100 select-none ring-1 ring-black/5 ${
                      isFlipLeft ? 'right-full mr-2' : 'left-full ml-2'
                    } -top-1`}
                  >
                    {/* Hover Bridge */}
                    <div className={`absolute top-0 bottom-0 ${isFlipLeft ? '-right-3 w-3' : '-left-3 w-3'}`} />

                    {/* Submenu Header */}
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400 border-b border-amber-900/10 dark:border-white/10 pb-1.5 mb-1.5">
                      <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                        <Wind className="w-3.5 h-3.5" />
                        <span>{locale === 'zh' ? '粒子氛围渲染强度' : 'Atmosphere Engine'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/50">3 Modes</span>
                    </div>

                    <div className="space-y-1.5">
                      {ATMOSPHERE_MODES.map((item) => {
                        const isCurrent = atmosphereIntensity === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectAtmosphere(item)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-left text-xs ${
                              isCurrent
                                ? `bg-gradient-to-r ${theme.primaryGradient} text-white font-bold shadow-xs`
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{item.emoji}</span>
                              <div className="min-w-0">
                                <p className="font-bubble font-bold truncate leading-tight text-xs">
                                  {locale === 'zh' ? item.nameZh : item.nameEn}
                                </p>
                                <p className={`text-[11px] font-cute truncate mt-0.5 ${isCurrent ? 'text-white/85' : 'text-neutral-400 dark:text-neutral-500'}`}>
                                  {locale === 'zh' ? item.descZh : item.descEn}
                                </p>
                              </div>
                            </div>

                            {isCurrent && (
                              <Check className="w-4 h-4 text-white shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-px bg-amber-900/10 dark:border-white/10 my-1.5" />

            {/* ==================== HOME VIEW CONTROLS ==================== */}
            {currentRoute === 'home' && (
              <>
                {onRefresh && (
                  <button
                    type="button"
                    onClick={handleActionRefresh}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                      <span className="font-bold">{locale === 'zh' ? '刷新全网数据' : 'Sync Telemetry'}</span>
                    </div>
                    <span className="text-[9px] font-mono text-neutral-400">Live</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleActionNav('#/gallery', e)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{locale === 'zh' ? '漫游笔记' : 'Notes Space'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">➜</span>
                </button>
              </>
            )}

            {/* ==================== GALLERY / NOTES CONTROLS ==================== */}
            {currentRoute === 'gallery' && (
              <>
                {onRefresh && (
                  <button
                    type="button"
                    onClick={handleActionRefresh}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                      <span className="font-bold">{locale === 'zh' ? '刷新云端笔记' : 'Sync Cloud Notes'}</span>
                    </div>
                    <span className="text-[9px] font-mono text-neutral-400">D1</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleActionMode}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none shrink-0">{currentModeObj.emoji}</span>
                    <span className="font-bold">{locale === 'zh' ? '切换展示模式' : 'Switch View'}</span>
                  </div>
                  <span className="text-[10px] font-bubble font-bold text-amber-600">{locale === 'zh' ? currentModeObj.nameZh : currentModeObj.nameEn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleActionTop}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-3.5 h-3.5 text-rose-500 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    <span className="font-bold">{locale === 'zh' ? '回到页面顶部' : 'Back to Top'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleActionNav('#/', e)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span>{locale === 'zh' ? '乐园首页' : 'Home Portal'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">➜</span>
                </button>
              </>
            )}

            {/* ==================== DANMAKU CONTROLS ==================== */}
            <div className="h-px bg-amber-900/10 dark:border-white/10 my-1.5" />

            {/* Shared Quick Settings Row: Language, Sound, Color Mode */}
            <div className="grid grid-cols-3 gap-1.5 px-0.5 pt-0.5">
              <button
                type="button"
                data-no-global-btn="true"
                onClick={handleActionLocale}
                className="py-1.5 px-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 hover:bg-pink-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bubble text-[11px] font-bold flex items-center justify-center gap-1 border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95 transition-all"
                title="Language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{locale === 'zh' ? '语言' : 'Lang'}</span>
              </button>

              <button
                type="button"
                data-no-global-btn="true"
                onClick={handleActionSound}
                className="py-1.5 px-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 hover:bg-pink-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bubble text-[11px] font-bold flex items-center justify-center gap-1 border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95 transition-all"
                title="Sound"
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5 text-pink-500 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                <span>{soundOn ? (locale === 'zh' ? '音效' : 'SFX') : (locale === 'zh' ? '静音' : 'Mute')}</span>
              </button>

              <button
                type="button"
                data-no-global-btn="true"
                onClick={handleActionColorMode}
                className="py-1.5 px-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 hover:bg-indigo-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bubble text-[11px] font-bold flex items-center justify-center gap-1 border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95 transition-all"
                title="Color Mode"
              >
                {colorMode === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                ) : colorMode === 'light' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                <span>{colorMode === 'dark' ? (locale === 'zh' ? '暗黑' : 'Dark') : colorMode === 'light' ? (locale === 'zh' ? '亮色' : 'Light') : (locale === 'zh' ? '自动' : 'Auto')}</span>
              </button>
            </div>

            {/* Bottom Primary CTA: Enter Workspace (Admin direct, visitor prompts login) */}
            <button
              type="button"
              data-no-global-btn="true"
              onClick={(e) => {
                e.stopPropagation();
                playPop();
                setIsOpen(false);
                setActiveSubmenu(null);
                if (isAdmin) {
                  if (onGoToEditor) {
                    onGoToEditor();
                  } else {
                    handleActionNav('#/editor', e);
                  }
                } else {
                  openAuthModal();
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 mt-1.5`}
            >
              <div className="flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '进入工作台' : 'Workspace'}</span>
              </div>
              <span>➜</span>
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
};

