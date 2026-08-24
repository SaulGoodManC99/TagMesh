import React, { useState } from 'react';
import { 
  Sparkles, 
  Globe, 
  Volume2, 
  VolumeX,
} from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { isSoundEnabled, toggleSound, playPop, playSoftTick } from './utils/soundEffects';
import { useClayTheme } from './utils/clayThemes';

export interface ClayHeaderProps {
  onGoToEditor?: () => void;
  currentRoute?: 'home' | 'gallery' | 'danmaku' | 'editor';
}

export const ClayHeader: React.FC<ClayHeaderProps> = () => {
  const { locale, toggleLocale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin, openAuthModal } = useAuth();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const basePillClass = "h-8 sm:h-9 px-3 sm:px-3.5 rounded-full font-bubble font-bold text-xs bg-white/95 text-neutral-700 hover:text-rose-600 border border-neutral-200/80 shadow-3xs hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0";

  return (
    <header 
      style={{ backgroundColor: `${theme.headerBg}ee` }}
      className="sticky top-0 z-40 px-3 sm:px-8 py-2.5 backdrop-blur-xl border-b border-amber-900/5 transition-colors duration-500 select-none"
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
              <span className="font-bubble font-bold text-lg sm:text-2xl tracking-tight text-neutral-800">
                TagMesh
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-cute text-neutral-400 -mt-0.5 hidden md:block">
              {locale === 'zh' ? '🎈 趣味黏土笔记与思维织网乐园' : '🎈 A Playful Claymorphic Inspiration Notes & Thought Mesh'}
            </p>
          </div>
        </div>

        {/* Right: Minimal Clean Utility Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 py-0.5 shrink-0">
          {/* 1. Language Switcher */}
          <button
            type="button"
            onClick={() => {
              playSoftTick();
              toggleLocale();
            }}
            className={basePillClass}
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>{locale === 'zh' ? '中 / EN' : 'EN / 中'}</span>
          </button>

          {/* 2. Sound FX Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-full font-bubble font-bold text-xs border transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              soundOn
                ? 'bg-pink-50/95 text-pink-600 border-pink-200 shadow-3xs hover:bg-pink-100 hover:scale-105'
                : 'bg-white/80 text-neutral-400 border-neutral-200 hover:bg-neutral-100'
            }`}
            title="Sound"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-pink-500" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundOn ? (locale === 'zh' ? '音效' : 'SFX') : (locale === 'zh' ? '静音' : 'Muted')}</span>
          </button>

          {/* 3. Admin/Guest Role Identity */}
          <button
            type="button"
            onClick={() => {
              playPop();
              openAuthModal();
            }}
            className={
              isAdmin
                ? "h-8 sm:h-9 px-3 sm:px-3.5 rounded-full font-bubble font-extrabold text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-900 border border-amber-300 shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                : "h-8 sm:h-9 px-3 sm:px-3.5 rounded-full font-bubble font-bold text-xs bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-3xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            }
            title={isAdmin ? 'Admin' : 'Guest'}
          >
            <span>{isAdmin ? '👑' : '🌱'}</span>
            <span>{isAdmin ? (locale === 'zh' ? '馆长' : 'Admin') : (locale === 'zh' ? '游客' : 'Guest')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
