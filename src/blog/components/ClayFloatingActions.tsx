import React, { useState } from 'react';
import { 
  ArrowUp, 
  RotateCw, 
  Sparkles,
  Check
} from 'lucide-react';
import { ViewMode } from '../ClayModeDock';
import { useI18n } from '../../hooks/useI18n';
import { useClayTheme } from '../utils/clayThemes';
import { playPop, playSwoosh, playChime } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';

export interface ClayFloatingActionsProps {
  viewMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentMode = MODES.find((m) => m.id === viewMode) || MODES[0];

  const handleScrollToTop = () => {
    playPop(550);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    setIsMenuOpen((prev) => !prev);
  };

  const handleSelect = (mode: ViewMode, e: React.MouseEvent) => {
    e.stopPropagation();
    playSwoosh();
    triggerParticleBurst(e.clientX, e.clientY, 15);
    onSelectMode(mode);
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
      {/* 1. Expandable 5-Mode Popup Selector Card */}
      {isMenuOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-40 right-0 w-72 p-4 rounded-[32px] bg-white/95 backdrop-blur-md border-3 border-white shadow-2xl clay-card animate-in zoom-in-90 fade-in duration-200 flex flex-col gap-2 z-50 mb-2"
        >
          <div className="flex items-center justify-between px-2 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 font-bubble font-extrabold text-sm text-neutral-800">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>{locale === 'zh' ? '选择笔记展示模式' : 'Note Display Modes'}</span>
            </div>
            <span className="text-[11px] font-cute text-neutral-400">5 模式</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {MODES.map((m) => {
              const isSelected = m.id === viewMode;
              return (
                <button
                  key={m.id}
                  onClick={(e) => handleSelect(m.id, e)}
                  className={`w-full p-2.5 rounded-[20px] transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                    isSelected
                      ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md font-bubble scale-[1.02]`
                      : 'hover:bg-neutral-100/80 text-neutral-800 font-cute'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{m.emoji}</span>
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

      {/* 2. Unified 3-Button Round 3D Clay Floating Dock */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Button 1: 🔄 Global Cloud Sync & Refresh */}
        {onRefresh && (
          <button
            onClick={(e) => {
              playChime();
              triggerParticleBurst(e.clientX, e.clientY, 15);
              onRefresh();
            }}
            disabled={isRefreshing}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/95 hover:bg-white text-neutral-700 hover:${theme.accentText} font-bubble font-bold shadow-lg hover:shadow-xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center backdrop-blur-xs group relative`}
            title={locale === 'zh' ? '全局云端同步与刷新' : 'Global Cloud Sync & Refresh'}
          >
            <RotateCw className={`w-5 h-5 text-rose-500 transition-transform ${isRefreshing ? 'animate-spin text-amber-500' : 'group-hover:rotate-180 duration-500'}`} />
          </button>
        )}

        {/* Button 2: 🎡 Switch Exhibition View Mode (Round 3D Clay Button) */}
        <button
          onClick={handleToggleMenu}
          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold shadow-xl hover:shadow-2xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center text-xl select-none relative`}
          title={`${locale === 'zh' ? currentMode.nameZh : currentMode.nameEn} (${locale === 'zh' ? '点击切换 5 模式' : 'Switch 5 Views'})`}
        >
          <span>{currentMode.emoji}</span>
        </button>

        {/* Button 3: ⬆️ Back to Top Button */}
        <button
          onClick={handleScrollToTop}
          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/95 hover:bg-white text-neutral-700 hover:${theme.accentText} font-bubble font-bold shadow-lg hover:shadow-xl hover:scale-108 active:scale-90 transition-all cursor-pointer border-2 border-white flex items-center justify-center backdrop-blur-xs`}
          title={locale === 'zh' ? '回到顶部' : 'Back to Top'}
        >
          <ArrowUp className="w-5 h-5 text-rose-500" />
        </button>
      </div>
    </div>
  );
};
