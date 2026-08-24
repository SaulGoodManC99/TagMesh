import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Globe, 
  Volume2, 
  VolumeX, 
  Home, 
  Layers, 
  MessageSquare, 
  PenTool, 
  Menu, 
  ChevronRight 
} from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { isSoundEnabled, toggleSound, playPop, playSoftTick } from './utils/soundEffects';
import { useClayTheme } from './utils/clayThemes';
import { SPRING_MICRO, HOVER_BUTTON_PRESS } from './utils/motionSystem';

export interface ClayHeaderProps {
  onGoToEditor?: () => void;
  currentRoute?: 'home' | 'gallery' | 'danmaku' | 'editor';
}

export const ClayHeader: React.FC<ClayHeaderProps> = ({
  onGoToEditor,
  currentRoute = 'home',
}) => {
  const { locale, toggleLocale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin, openAuthModal } = useAuth();
  const { guestNotesEnabled } = useSiteConfig();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const handleGoEditor = () => {
    playPop();
    if (onGoToEditor) {
      onGoToEditor();
    } else {
      window.location.hash = '#/editor';
    }
  };

  const basePillClass = "h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-full font-bubble font-bold text-xs bg-white/95 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0";
  const activePillClass = `h-8.5 sm:h-9 px-3.5 sm:px-4 rounded-full font-bubble font-extrabold text-xs bg-gradient-to-r ${theme.primaryGradient} text-white border-2 border-white/90 dark:border-white/30 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0`;

  return (
    <header 
      style={{ backgroundColor: `${theme.headerBg}ee` }}
      className="sticky top-0 z-40 px-3 sm:px-8 py-2.5 backdrop-blur-xl border-b border-amber-900/5 dark:border-white/5 transition-colors duration-500 select-none"
    >
      <div className="max-w-[1480px] mx-auto flex items-center justify-between gap-3">
        {/* Left: Playful Logo */}
        <div 
          onClick={() => {
            playPop();
            window.location.hash = '#/';
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br ${theme.primaryGradient} clay-btn flex items-center justify-center text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-transform`}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bubble font-bold text-lg sm:text-2xl tracking-tight text-neutral-800 dark:text-neutral-100">
                TagMesh
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-cute text-neutral-400 dark:text-neutral-500 -mt-0.5 hidden md:block">
              {locale === 'zh' ? '🎈 趣味黏土笔记与思维织网乐园' : '🎈 A Playful Claymorphic Inspiration Notes & Thought Mesh'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation: Pure Minimal Core Capsules (>= 1024px) */}
        <div className="hidden lg:flex items-center gap-2 py-0.5 shrink-0">
          {/* 1. Portal Home */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING_MICRO}
            onClick={() => {
              playPop();
              window.location.hash = '#/';
            }}
            className={currentRoute === 'home' ? activePillClass : basePillClass}
            title={locale === 'zh' ? '返回乐园首页' : 'Return Home'}
          >
            <Home className={`w-3.5 h-3.5 ${currentRoute === 'home' ? 'text-white' : 'text-pink-500'}`} />
            <span>{locale === 'zh' ? '首页' : 'Home'}</span>
          </motion.button>

          {/* 2. Notes List / Showcase */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING_MICRO}
            onClick={() => {
              playPop();
              window.location.hash = '#/gallery';
            }}
            className={currentRoute === 'gallery' ? activePillClass : basePillClass}
            title={locale === 'zh' ? '进入笔记' : 'Enter Notes'}
          >
            <Layers className={`w-3.5 h-3.5 ${currentRoute === 'gallery' ? 'text-white' : 'text-amber-500'}`} />
            <span>{locale === 'zh' ? '笔记' : 'Notes'}</span>
          </motion.button>

          {/* 3. Danmaku Plaza */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING_MICRO}
            onClick={() => {
              playPop();
              window.location.hash = '#/danmaku';
            }}
            className={currentRoute === 'danmaku' ? activePillClass : basePillClass}
            title={locale === 'zh' ? '前往灵感弹幕广场' : 'Enter Danmaku Plaza'}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${currentRoute === 'danmaku' ? 'text-white' : 'text-cyan-500'}`} />
            <span>{locale === 'zh' ? '弹幕广场' : 'Danmaku'}</span>
          </motion.button>

          {/* 4. Admin/Guest Role Identity */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING_MICRO}
            onClick={() => {
              playPop();
              openAuthModal();
            }}
            className={
              isAdmin
                ? "h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-full font-bubble font-extrabold text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-900 border border-amber-300 shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                : "h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-full font-bubble font-bold text-xs bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-3xs flex items-center gap-1.5 cursor-pointer shrink-0"
            }
            title={isAdmin ? 'Admin' : 'Guest'}
          >
            <span>{isAdmin ? '👑' : '🌱'}</span>
            <span>{isAdmin ? (locale === 'zh' ? '馆长' : 'Admin') : (locale === 'zh' ? '游客' : 'Guest')}</span>
          </motion.button>

          {/* 5. Jump to Workspace CTA (Visible if Admin or Guest mode is open) */}
          {(guestNotesEnabled || isAdmin) && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.93 }}
              transition={SPRING_MICRO}
              onClick={handleGoEditor}
              className={`h-8.5 sm:h-9 px-3.5 sm:px-4 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold text-xs border border-white/60 shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer shrink-0`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? '工作台 ➜' : 'Workspace ➜'}</span>
            </motion.button>
          )}
        </div>

        {/* Mobile Navigation Header (< 1024px) */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {/* Mobile Identity Button */}
          <button
            type="button"
            onClick={() => {
              playPop();
              openAuthModal();
            }}
            className={
              isAdmin
                ? "h-8.5 px-3 rounded-full font-bubble font-extrabold text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-900 border border-amber-300 shadow-sm active:scale-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                : "h-8.5 px-3 rounded-full font-bubble font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-3xs active:scale-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            }
          >
            <span>{isAdmin ? '👑 馆长' : '🌱 游客'}</span>
          </button>

          {/* Mobile Menu Drawer Button */}
          <button
            type="button"
            onClick={() => {
              playPop(550);
              setIsMobileMenuOpen(true);
            }}
            className={`h-8.5 px-3.5 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white border border-white/60 shadow-sm flex items-center gap-1.5 text-xs font-bubble font-extrabold cursor-pointer active:scale-90`}
            title="Open Menu"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>{locale === 'zh' ? '菜单' : 'Menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Dropdown Menu Sheet (< 1024px) */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-start items-center p-3 pt-16 sm:pt-20 select-none lg:hidden overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/50 modal-backdrop-enter"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Card */}
          <div className="relative w-full max-w-sm bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[32px] clay-card p-5 text-neutral-800 modal-card-enter flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">🎈</span>
                <div>
                  <h3 className="font-bubble font-extrabold text-base text-neutral-900">
                    TagMesh 乐园导航
                  </h3>
                  <span className="text-[11px] font-cute text-neutral-400">
                    {theme.emoji} {locale === 'zh' ? theme.nameZh : theme.nameEn}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-rose-500 hover:text-white text-neutral-500 flex items-center justify-center transition cursor-pointer active:scale-90 text-xs font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Core Destinations */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  playPop();
                  setIsMobileMenuOpen(false);
                  window.location.hash = '#/';
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between font-bubble font-bold text-sm transition cursor-pointer border ${
                  currentRoute === 'home'
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white border-white/60 shadow-md`
                    : 'bg-white text-neutral-700 border-neutral-100 hover:bg-pink-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className={`w-4 h-4 shrink-0 ${currentRoute === 'home' ? 'text-white' : 'text-pink-500'}`} />
                  <span>{locale === 'zh' ? '乐园首页' : 'Home Portal'}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${currentRoute === 'home' ? 'text-white/80' : 'text-neutral-400'}`} />
              </button>

              <button
                onClick={() => {
                  playPop();
                  setIsMobileMenuOpen(false);
                  window.location.hash = '#/gallery';
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between font-bubble font-bold text-sm transition cursor-pointer border ${
                  currentRoute === 'gallery'
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white border-white/60 shadow-md`
                    : 'bg-white text-neutral-700 border-neutral-100 hover:bg-pink-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className={`w-4 h-4 shrink-0 ${currentRoute === 'gallery' ? 'text-white' : 'text-amber-500'}`} />
                  <span>{locale === 'zh' ? '笔记' : 'Notes'}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${currentRoute === 'gallery' ? 'text-white/80' : 'text-neutral-400'}`} />
              </button>

              <button
                onClick={() => {
                  playPop();
                  setIsMobileMenuOpen(false);
                  window.location.hash = '#/danmaku';
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between font-bubble font-bold text-sm transition cursor-pointer border ${
                  currentRoute === 'danmaku'
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white border-white/60 shadow-md`
                    : 'bg-white text-neutral-700 border-neutral-100 hover:bg-pink-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${currentRoute === 'danmaku' ? 'text-white' : 'text-cyan-500'}`} />
                  <span>{locale === 'zh' ? '弹幕广场' : 'Danmaku Plaza'}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${currentRoute === 'danmaku' ? 'text-white/80' : 'text-neutral-400'}`} />
              </button>

              {(guestNotesEnabled || isAdmin) && (
                <button
                  onClick={() => {
                    playPop();
                    setIsMobileMenuOpen(false);
                    handleGoEditor();
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between font-bubble font-extrabold text-sm text-white bg-gradient-to-r ${theme.primaryGradient} shadow-md transition cursor-pointer active:scale-95`}
                >
                  <div className="flex items-center gap-2.5">
                    <PenTool className="w-4 h-4 shrink-0" />
                    <span>{locale === 'zh' ? '进入写作工作台' : 'Open Workspace'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </button>
              )}
            </div>

            {/* Preferences */}
            <div className="pt-2 border-t border-amber-900/10 grid grid-cols-2 gap-2 text-xs font-bubble font-bold shrink-0">
              {/* Language Switch */}
              <button
                onClick={() => {
                  playSoftTick();
                  toggleLocale();
                }}
                className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 text-neutral-700 flex flex-col items-center gap-1 cursor-pointer hover:bg-amber-50"
              >
                <Globe className="w-4 h-4 text-amber-500" />
                <span>{locale === 'zh' ? '中 / EN' : 'EN / 中'}</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={handleToggleSound}
                className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 text-neutral-700 flex flex-col items-center gap-1 cursor-pointer hover:bg-pink-50"
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-pink-500" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
                <span>{soundOn ? (locale === 'zh' ? '音效开启' : 'SFX On') : (locale === 'zh' ? '静音' : 'Muted')}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
