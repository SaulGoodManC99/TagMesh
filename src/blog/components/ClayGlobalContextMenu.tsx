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
  MessageSquare,
  Dices,
  Moon,
  Sun
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';
import { useSiteConfig } from '../../hooks/useSiteConfig';
import { useClayTheme } from '../utils/clayThemes';
import { isSoundEnabled, toggleSound, playPop, playSoftTick } from '../utils/soundEffects';
import { ViewMode } from '../ClayModeDock';
import { SPRING_MICRO } from '../utils/motionSystem';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ClayGlobalContextMenuProps {
  currentRoute?: 'home' | 'gallery' | 'danmaku' | 'editor';
  viewMode?: ViewMode;
  onSelectMode?: (mode: ViewMode) => void;
  onRefresh?: () => void;
  onGoToEditor?: () => void;
  onTriggerGacha?: () => void;
}

const MODES: Array<{ id: ViewMode; nameZh: string; nameEn: string; emoji: string }> = [
  { id: 'grid', nameZh: '便当瀑布流', nameEn: 'Bento Grid', emoji: '🍱' },
  { id: 'polaroid', nameZh: '拍立得便签墙', nameEn: 'Polaroid Board', emoji: '📷' },
  { id: 'timeline', nameZh: '时光卷轴', nameEn: 'Timeline Stream', emoji: '⏳' },
  { id: 'carousel', nameZh: '3D 轮播穿梭', nameEn: '3D Carousel', emoji: '🎡' },
  { id: 'floating', nameZh: '漂浮失重空间', nameEn: 'Floating Space', emoji: '🪐' },
];

export const ClayGlobalContextMenu: React.FC<ClayGlobalContextMenuProps> = ({
  currentRoute = 'home',
  viewMode = 'grid',
  onSelectMode,
  onRefresh,
  onGoToEditor,
  onTriggerGacha,
}) => {
  const { locale, toggleLocale } = useI18n();
  const { theme, switchNextTheme } = useClayTheme();
  const { isAdmin, openAuthModal } = useAuth();
  const { guestNotesEnabled, colorMode, toggleColorMode } = useSiteConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
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
  }, [isOpen]);

  // Action Handlers
  const handleActionTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    switchNextTheme();
    setIsOpen(false);
  };

  const handleActionRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRefresh) onRefresh();
    setIsOpen(false);
  };

  const handleActionMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectMode) {
      const currIdx = MODES.findIndex((m) => m.id === viewMode);
      const nextIdx = (currIdx + 1) % MODES.length;
      onSelectMode(MODES[nextIdx].id);
    } else {
      window.location.hash = '#/gallery';
    }
    setIsOpen(false);
  };

  const handleActionLocale = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSoftTick();
    toggleLocale();
    setIsOpen(false);
  };

  const handleActionSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleSound();
    setSoundOn(next);
    setIsOpen(false);
  };

  const handleActionTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(550);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleActionNav = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    window.location.hash = hash;
    setIsOpen(false);
  };

  const handleActionGacha = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTriggerGacha) {
      onTriggerGacha();
    } else {
      window.location.hash = '#/';
    }
    setIsOpen(false);
  };

  // Clamp positioning inside screen
  const menuWidth = 240;
  const menuHeight = 320;
  const clampedX = typeof window !== 'undefined' ? Math.max(10, Math.min(window.innerWidth - menuWidth - 10, position.x)) : 10;
  const clampedY = typeof window !== 'undefined' ? Math.max(10, Math.min(window.innerHeight - menuHeight - 10, position.y)) : 10;

  const currentModeObj = MODES.find((m) => m.id === viewMode) || MODES[0];

  const getMenuBadgeTitle = () => {
    if (currentRoute === 'home') return locale === 'zh' ? '🏰 乐园首页工具坞' : 'Home Portal Hub';
    if (currentRoute === 'gallery') return locale === 'zh' ? '📖 笔记工具坞' : 'Notes Space Hub';
    if (currentRoute === 'danmaku') return locale === 'zh' ? '💬 弹幕星河工具坞' : 'Danmaku Plaza Hub';
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

      {/* 1. Frosted 3D Clay Global Context Menu */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.95, y: 6 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
          style={{
            left: `${clampedX}px`,
            top: `${clampedY}px`,
          }}
          className="fixed z-[250] w-60 bg-[#fdfbf7]/95 dark:bg-neutral-900/95 backdrop-blur-xl border-3 border-white dark:border-white/10 shadow-2xl rounded-3xl clay-card p-2 text-neutral-800 dark:text-neutral-100 select-none ring-1 ring-black/5 gpu-layer"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-amber-900/10 dark:border-white/10 text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>{getMenuBadgeTitle()}</span>
            </span>
            <span className="text-[10px] font-mono opacity-50">Esc 退出</span>
          </div>

          <div className="space-y-0.5 font-cute text-xs">
            
            {/* ==================== 1. HOME EXCLUSIVE MENU ==================== */}
            {currentRoute === 'home' && (
              <>
                {/* 1. Refresh at First Position */}
                {onRefresh && (
                  <button
                    onClick={handleActionRefresh}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <RotateCw className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                      </div>
                      <span className="font-bold">{locale === 'zh' ? '刷新全网数据' : 'Sync Telemetry'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">Live</span>
                  </button>
                )}

                {/* 2. Theme Cycle */}
                <button
                  onClick={handleActionTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 text-sm leading-none group-hover:scale-110 transition-transform">
                      {theme.emoji}
                    </div>
                    <span className="font-bold">{locale === 'zh' ? '切换心境主题' : 'Switch Theme'}</span>
                  </div>
                  <span className="text-[11px] font-bubble font-bold text-rose-500">{locale === 'zh' ? theme.nameZh : theme.nameEn}</span>
                </button>

                {/* 3. Gacha Trigger */}
                <button
                  onClick={handleActionGacha}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Dices className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="font-bold">{locale === 'zh' ? '抽取灵感扭蛋' : 'Inspiration Gacha'}</span>
                  </div>
                  <span className="text-[10px] font-bubble text-amber-600">🎲 Play</span>
                </button>

                {/* 4. Quick Nav: Notes */}
                <button
                  onClick={(e) => handleActionNav('#/gallery', e)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span>{locale === 'zh' ? '漫游笔记' : 'Notes Space'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">➜</span>
                </button>

                {/* 5. Quick Nav: Danmaku */}
                <button
                  onClick={(e) => handleActionNav('#/danmaku', e)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                    </div>
                    <span>{locale === 'zh' ? '弹幕星河广场' : 'Danmaku Plaza'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">➜</span>
                </button>
              </>
            )}

            {/* ==================== 2. GALLERY / NOTES EXCLUSIVE MENU ==================== */}
            {currentRoute === 'gallery' && (
              <>
                {/* 1. Refresh at First Position */}
                {onRefresh && (
                  <button
                    onClick={handleActionRefresh}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <RotateCw className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                      </div>
                      <span className="font-bold">{locale === 'zh' ? '刷新云端笔记' : 'Sync Cloud Notes'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">D1 Sync</span>
                  </button>
                )}

                {/* 2. Theme Cycle */}
                <button
                  onClick={handleActionTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 text-sm leading-none group-hover:scale-110 transition-transform">
                      {theme.emoji}
                    </div>
                    <span className="font-bold">{locale === 'zh' ? '切换心境主题' : 'Switch Theme'}</span>
                  </div>
                  <span className="text-[11px] font-bubble font-bold text-rose-500">{locale === 'zh' ? theme.nameZh : theme.nameEn}</span>
                </button>

                {/* 3. Mode Cycle */}
                <button
                  onClick={handleActionMode}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 text-sm leading-none group-hover:scale-110 transition-transform">
                      {currentModeObj.emoji}
                    </div>
                    <span className="font-bold">{locale === 'zh' ? '切换展示模式' : 'Switch Note View'}</span>
                  </div>
                  <span className="text-[11px] font-bubble font-bold text-amber-600">{locale === 'zh' ? currentModeObj.nameZh : currentModeObj.nameEn}</span>
                </button>

                {/* 4. Scroll to Top */}
                <button
                  onClick={handleActionTop}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <ArrowUp className="w-3.5 h-3.5 text-rose-500 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <span className="font-bold">{locale === 'zh' ? '回到页面顶部' : 'Back to Top'}</span>
                  </div>
                </button>

                {/* 5. Quick Nav: Home */}
                <button
                  onClick={(e) => handleActionNav('#/', e)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Home className="w-3.5 h-3.5 text-pink-500" />
                    </div>
                    <span>{locale === 'zh' ? '乐园首页' : 'Home Portal'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">➜</span>
                </button>
              </>
            )}

            {/* ==================== 3. DANMAKU PLAZA EXCLUSIVE MENU ==================== */}
            {currentRoute === 'danmaku' && (
              <>
                {/* 1. Refresh at First Position */}
                {onRefresh && (
                  <button
                    onClick={handleActionRefresh}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <RotateCw className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                      </div>
                      <span className="font-bold">{locale === 'zh' ? '刷新最新弹幕' : 'Sync Danmakus'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">Live</span>
                  </button>
                )}

                {/* 2. Theme Cycle */}
                <button
                  onClick={handleActionTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 text-sm leading-none group-hover:scale-110 transition-transform">
                      {theme.emoji}
                    </div>
                    <span className="font-bold">{locale === 'zh' ? '切换心境主题' : 'Switch Theme'}</span>
                  </div>
                  <span className="text-[11px] font-bubble font-bold text-rose-500">{locale === 'zh' ? theme.nameZh : theme.nameEn}</span>
                </button>

                {/* 3. Quick Nav: Home */}
                <button
                  onClick={(e) => handleActionNav('#/', e)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Home className="w-3.5 h-3.5 text-pink-500" />
                    </div>
                    <span>{locale === 'zh' ? '乐园首页' : 'Home Portal'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">➜</span>
                </button>

                {/* 4. Quick Nav: Notes */}
                <button
                  onClick={(e) => handleActionNav('#/gallery', e)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span>{locale === 'zh' ? '笔记' : 'Notes Space'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">➜</span>
                </button>
              </>
            )}

            <div className="h-px bg-amber-900/10 dark:bg-white/10 my-1" />

            {/* Shared Global Settings: Language, Sound & Color Mode (3-Columns) */}
            <div className="grid grid-cols-3 gap-1 px-1">
              <button
                onClick={handleActionLocale}
                className="p-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 hover:bg-pink-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bubble text-[11px] font-bold flex items-center justify-center gap-1 border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95 transition"
                title="Language"
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  <Globe className="w-3 h-3 text-amber-500" />
                </div>
                <span>{locale === 'zh' ? '语言' : 'Lang'}</span>
              </button>

              <button
                onClick={handleActionSound}
                className="p-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 hover:bg-pink-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bubble text-[11px] font-bold flex items-center justify-center gap-1 border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95 transition"
                title="Sound"
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {soundOn ? <Volume2 className="w-3 h-3 text-pink-500" /> : <VolumeX className="w-3 h-3 text-neutral-400" />}
                </div>
                <span>{soundOn ? (locale === 'zh' ? '音效' : 'SFX') : (locale === 'zh' ? '静音' : 'Mute')}</span>
              </button>

              <button
                onClick={() => {
                  playPop(540);
                  toggleColorMode();
                }}
                className="p-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 hover:bg-indigo-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bubble text-[11px] font-bold flex items-center justify-center gap-1 border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95 transition"
                title={locale === 'zh' ? `当前色彩模式: ${colorMode}` : `Color Mode: ${colorMode}`}
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {colorMode === 'dark' ? (
                    <Moon className="w-3 h-3 text-indigo-500" />
                  ) : colorMode === 'light' ? (
                    <Sun className="w-3 h-3 text-amber-500" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
                <span>{colorMode === 'dark' ? (locale === 'zh' ? '暗黑' : 'Dark') : colorMode === 'light' ? (locale === 'zh' ? '亮色' : 'Light') : (locale === 'zh' ? '自动' : 'Auto')}</span>
              </button>
            </div>

            {/* Bottom Primary CTA: Enter Workspace (Admin or Guest mode enabled) */}
            {(guestNotesEnabled || isAdmin) && (
              <button
                onClick={(e) => {
                  if (onGoToEditor) {
                    e.stopPropagation();
                    playPop();
                    onGoToEditor();
                    setIsOpen(false);
                  } else {
                    handleActionNav('#/editor', e);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold text-xs shadow-md transition cursor-pointer active:scale-95 mt-1.5`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <PenTool className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'zh' ? '进入写作工作台' : 'Open Workspace'}</span>
                </div>
                <span>➜</span>
              </button>
            )}
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
};
