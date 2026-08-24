import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  RotateCw, 
  Sparkles,
  Check,
  PenTool,
  Palette,
  MessageSquare,
  Zap,
  X,
  Layers
} from 'lucide-react';
import { ViewMode } from '../ClayModeDock';
import { useI18n } from '../../hooks/useI18n';
import { useClayTheme } from '../utils/clayThemes';
import { playPop, playSwoosh, playChime } from '../utils/soundEffects';
import { triggerParticleBurst, triggerConfettiShower } from '../utils/confetti';

export interface ClayFloatingActionsProps {
  viewMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onGoToEditor?: () => void;
}

const MODES: Array<{
  id: ViewMode;
  emoji: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
}> = [
  {
    id: 'grid',
    emoji: '🍱',
    nameZh: '便当瀑布流',
    nameEn: 'Bento Grid',
    descZh: '经典错落卡片',
    descEn: 'Classic Cards',
  },
  {
    id: 'polaroid',
    emoji: '📷',
    nameZh: '拍立得便签墙',
    nameEn: 'Polaroid Board',
    descZh: '和纸胶带留白',
    descEn: 'Film Cards',
  },
  {
    id: 'timeline',
    emoji: '⏳',
    nameZh: '时光卷轴',
    nameEn: 'Timeline Stream',
    descZh: '月份里程碑',
    descEn: 'Milestones',
  },
  {
    id: 'carousel',
    nameZh: '3D 轮播穿梭',
    nameEn: '3D Carousel',
    emoji: '🎡',
    descZh: '沉浸抽卡阅读',
    descEn: 'Coverflow',
  },
  {
    id: 'floating',
    nameZh: '漂浮失重空间',
    nameEn: 'Floating Space',
    emoji: '🪐',
    descZh: '物理拖拽碰撞',
    descEn: 'Zero-G Physics',
  },
];

export const ClayFloatingActions: React.FC<ClayFloatingActionsProps> = ({
  viewMode,
  onSelectMode,
  onRefresh,
  isRefreshing = false,
  onGoToEditor,
}) => {
  const { locale } = useI18n();
  const { theme, switchNextTheme } = useClayTheme();
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isQuickHubOpen, setIsQuickHubOpen] = useState(false);

  const currentMode = MODES.find((m) => m.id === viewMode) || MODES[0];

  // Close menus on click outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setIsModeMenuOpen(false);
      setIsQuickHubOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(550);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleModeMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    setIsQuickHubOpen(false);
    setIsModeMenuOpen((prev) => !prev);
  };

  const handleToggleQuickHub = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop(620);
    setIsModeMenuOpen(false);
    setIsQuickHubOpen((prev) => !prev);
  };

  const handleSelectMode = (mode: ViewMode, e: React.MouseEvent) => {
    e.stopPropagation();
    playSwoosh();
    triggerParticleBurst(e.clientX, e.clientY, 15);
    onSelectMode(mode);
    setIsModeMenuOpen(false);
  };

  // Quick Action Handlers
  const handleActionEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    triggerParticleBurst(e.clientX, e.clientY, 15);
    setIsQuickHubOpen(false);
    if (onGoToEditor) {
      onGoToEditor();
    } else {
      window.location.hash = '#/?view=editor';
    }
  };

  const handleActionTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    switchNextTheme();
    triggerParticleBurst(e.clientX, e.clientY, 20);
  };

  const handleActionDanmaku = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    triggerParticleBurst(e.clientX, e.clientY, 15);
    setIsQuickHubOpen(false);
    window.location.hash = '#/danmaku';
  };

  const handleActionRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 18);
    setIsQuickHubOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div 
      className="fixed bottom-5 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Expandable 5-Mode Popup Selector Card */}
      {isModeMenuOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-32 sm:bottom-36 right-0 w-64 sm:w-72 p-3 sm:p-4 rounded-[28px] sm:rounded-[32px] bg-white/95 backdrop-blur-md border-3 border-white shadow-2xl clay-card animate-in zoom-in-90 fade-in duration-200 flex flex-col gap-2 z-50 mb-2"
        >
          <div className="flex items-center justify-between px-2 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 font-bubble font-extrabold text-xs sm:text-sm text-neutral-800">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>{locale === 'zh' ? '选择笔记展示模式' : 'Note Display Modes'}</span>
            </div>
            <span className="text-[11px] font-cute text-neutral-400">5 模式</span>
          </div>

          <div className="space-y-1 pt-1">
            {MODES.map((m) => {
              const isSelected = m.id === viewMode;
              return (
                <button
                  key={m.id}
                  onClick={(e) => handleSelectMode(m.id, e)}
                  className={`w-full p-2 sm:p-2.5 rounded-[18px] sm:rounded-[20px] transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                    isSelected
                      ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md font-bubble scale-[1.02]`
                      : 'hover:bg-neutral-100/80 text-neutral-800 font-cute'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg sm:text-xl shrink-0">{m.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm leading-tight truncate">
                        {locale === 'zh' ? m.nameZh : m.nameEn}
                      </div>
                      <div className={`text-[10px] leading-tight truncate ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                        {locale === 'zh' ? m.descZh : m.descEn}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Expandable Quick Magic Hub Card */}
      {isQuickHubOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-40 sm:bottom-44 right-0 w-64 sm:w-72 p-3 sm:p-4 rounded-[28px] sm:rounded-[32px] bg-white/95 backdrop-blur-md border-3 border-white shadow-2xl clay-card animate-in zoom-in-90 fade-in duration-200 flex flex-col gap-2.5 z-50 mb-2"
        >
          <div className="flex items-center justify-between px-2 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 font-bubble font-extrabold text-xs sm:text-sm text-neutral-800">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>{locale === 'zh' ? '灵动快捷魔术坞' : 'Quick Actions Hub'}</span>
            </div>
            <button 
              onClick={() => setIsQuickHubOpen(false)}
              className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {/* Quick Action 1: 🏠 Home Portal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPop();
                setIsQuickHubOpen(false);
                window.location.hash = '#/';
              }}
              className="p-2.5 rounded-2xl bg-amber-50/90 hover:bg-amber-100 text-amber-800 font-bubble font-bold text-xs flex flex-col items-center justify-center gap-1 border border-amber-200 shadow-3xs cursor-pointer active:scale-95 transition-all hover:scale-103"
            >
              <span className="text-base leading-none">🏰</span>
              <span>{locale === 'zh' ? '乐园首页' : 'Home'}</span>
            </button>

            {/* Quick Action 2: 📖 Notes Showcase */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPop();
                setIsQuickHubOpen(false);
                window.location.hash = '#/gallery';
              }}
              className="p-2.5 rounded-2xl bg-orange-50/90 hover:bg-orange-100 text-orange-800 font-bubble font-bold text-xs flex flex-col items-center justify-center gap-1 border border-orange-200 shadow-3xs cursor-pointer active:scale-95 transition-all hover:scale-103"
            >
              <span className="text-base leading-none">📖</span>
              <span>{locale === 'zh' ? '旅人笔记' : 'Notes'}</span>
            </button>

            {/* Quick Action 3: ✍️ Editor Workspace */}
            <button
              onClick={handleActionEditor}
              className="p-2.5 rounded-2xl bg-pink-50/90 hover:bg-pink-100 text-pink-700 font-bubble font-bold text-xs flex flex-col items-center justify-center gap-1 border border-pink-200 shadow-3xs cursor-pointer active:scale-95 transition-all hover:scale-103"
            >
              <PenTool className="w-4 h-4 text-pink-500" />
              <span>{locale === 'zh' ? '工作台' : 'Editor'}</span>
            </button>

            {/* Quick Action 4: 💬 Danmaku Plaza */}
            <button
              onClick={handleActionDanmaku}
              className="p-2.5 rounded-2xl bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 font-bubble font-bold text-xs flex flex-col items-center justify-center gap-1 border border-indigo-200 shadow-3xs cursor-pointer active:scale-95 transition-all hover:scale-103"
            >
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>{locale === 'zh' ? '弹幕广场' : 'Danmaku'}</span>
            </button>

            {/* Quick Action 5: 🎨 One-Click Mood Themes */}
            <button
              onClick={handleActionTheme}
              className="p-2.5 rounded-2xl bg-rose-50/90 hover:bg-rose-100 text-rose-800 font-bubble font-bold text-xs flex flex-col items-center justify-center gap-1 border border-rose-200 shadow-3xs cursor-pointer active:scale-95 transition-all hover:scale-103"
              title={locale === 'zh' ? '点一下立即切换心境主题' : 'Single click to cycle theme'}
            >
              <Palette className="w-4 h-4 text-rose-500" />
              <span>{locale === 'zh' ? '换主题' : 'Theme'}</span>
            </button>

            {/* Quick Action 6: 🔄 Dynamic Refresh */}
            <button
              onClick={handleActionRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-2xl bg-emerald-50/90 hover:bg-emerald-100 text-emerald-700 font-bubble font-bold text-xs flex flex-col items-center justify-center gap-1 border border-emerald-200 shadow-3xs cursor-pointer active:scale-95 transition-all hover:scale-103"
            >
              <RotateCw className={`w-4 h-4 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (locale === 'zh' ? '同步中...' : 'Syncing...') : (locale === 'zh' ? '全局同步' : 'Sync')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Unified 3-Button Round 3D Clay Floating Dock */}
      <div className="flex flex-col items-center gap-2 sm:gap-2.5">
        {/* Button 1: ⚡ Quick Magic Hub Trigger */}
        <button
          onClick={handleToggleQuickHub}
          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 hover:bg-white text-neutral-800 hover:${theme.accentText} font-bubble font-bold shadow-lg hover:shadow-xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center backdrop-blur-xs group relative ${
            isQuickHubOpen ? 'ring-2 ring-amber-400 scale-105' : ''
          }`}
          title={locale === 'zh' ? '打开快捷魔术坞 (工作台/主题/弹幕/刷新)' : 'Quick Actions Hub (Editor/Themes/Danmaku/Sync)'}
        >
          <Zap className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${isQuickHubOpen ? 'scale-125 rotate-12 fill-amber-400' : 'group-hover:rotate-12'}`} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border border-white flex items-center justify-center text-[8px] text-white font-bold">
            ✦
          </span>
        </button>

        {/* Button 2: 🎡 Switch Exhibition View Mode (Round 3D Clay Button) */}
        <button
          onClick={handleToggleModeMenu}
          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold shadow-xl hover:shadow-2xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center text-lg sm:text-xl select-none relative ${
            isModeMenuOpen ? 'ring-2 ring-white scale-105' : ''
          }`}
          title={`${locale === 'zh' ? currentMode.nameZh : currentMode.nameEn} (${locale === 'zh' ? '点击切换 5 模式' : 'Switch 5 Views'})`}
        >
          <span>{currentMode.emoji}</span>
        </button>

        {/* Button 3: ⬆️ Back to Top Button */}
        <button
          onClick={handleScrollToTop}
          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 hover:bg-white text-neutral-700 hover:${theme.accentText} font-bubble font-bold shadow-lg hover:shadow-xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center backdrop-blur-xs`}
          title={locale === 'zh' ? '回到顶部' : 'Back to Top'}
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
        </button>
      </div>
    </div>
  );
};
