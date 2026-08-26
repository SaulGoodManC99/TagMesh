import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Check, 
  Sun, 
  Moon, 
  Laptop, 
  Dices, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Palette, 
  Layers, 
  Wind,
  RotateCcw,
  Smile,
  Crown,
  Loader2
} from 'lucide-react';
import { useClayTheme, CLAY_THEMES, ClayTheme, AtmosphereIntensity } from '../blog/utils/clayThemes';
import { useI18n } from '../hooks/useI18n';
import { useSiteConfig, ButtonStyle, ColorMode } from '../hooks/useSiteConfig';
import { isSoundEnabled, toggleSound, playPop, playChime, playSoftTick } from '../blog/utils/soundEffects';
import { triggerConfettiShower } from '../blog/utils/confetti';
import { SPRING_MICRO } from '../blog/utils/motionSystem';
import { useAuth } from '../hooks/useAuth';
import { saveGlobalAppearanceRemote } from '../services/api';
import { toast } from './ClayToast';

export interface ThemeStudioModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const { 
    theme, 
    themeId, 
    setTheme, 
    randomTheme, 
    isDark, 
    atmosphereIntensity, 
    setAtmosphereIntensity, 
    isThemeModalOpen, 
    closeThemeModal 
  } = useClayTheme();

  const { locale } = useI18n();
  const { isAdmin } = useAuth();
  const { colorMode, setColorMode, buttonStyle, setButtonStyle } = useSiteConfig();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  const isOpen = propIsOpen !== undefined ? propIsOpen : isThemeModalOpen;
  const handleClose = propOnClose || closeThemeModal;

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const handleSurpriseMe = () => {
    playChime();
    randomTheme();
    triggerConfettiShower(30);
  };

  const handleResetDefaults = () => {
    playPop();
    try {
      localStorage.removeItem('tagmesh_user_customized_v1');
      const cached = localStorage.getItem('tagmesh_cached_telemetry');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.globalTheme && CLAY_THEMES.some(t => t.id === parsed.globalTheme)) {
          setTheme(parsed.globalTheme);
        } else {
          setTheme('sakura');
        }
        if (parsed?.globalButtonStyle) setButtonStyle(parsed.globalButtonStyle);
        if (parsed?.globalAtmosphere) setAtmosphereIntensity(parsed.globalAtmosphere);
        if (parsed?.globalColorMode) setColorMode(parsed.globalColorMode);
        triggerConfettiShower(15);
        toast.info(
          locale === 'zh' ? '已重置为全站官方推荐默认外观' : 'Reset to official default appearance',
          locale === 'zh' ? '外观已重置' : 'Appearance Reset',
          2000
        );
        return;
      }
    } catch {
      // ignore
    }
    setTheme('sakura');
    setAtmosphereIntensity('dynamic');
    setColorMode('auto');
    setButtonStyle('neon');
    triggerConfettiShower(15);
  };

  const handleSaveGlobalDefault = async () => {
    setIsSavingGlobal(true);
    playChime();
    try {
      const res = await saveGlobalAppearanceRemote({
        themeId,
        buttonStyle,
        atmosphereIntensity,
        colorMode,
      });
      if (res) {
        triggerConfettiShower(35);
        try {
          localStorage.setItem('tagmesh_cached_telemetry', JSON.stringify(res));
        } catch {
          // ignore
        }
        toast.success(
          locale === 'zh'
            ? `👑 已成功固化为全站官方默认外观！所有新访客打开时将默认呈现「${theme.nameZh}」与「${buttonStyle}」风格。`
            : `👑 Successfully saved as global default appearance for all visitors!`,
          locale === 'zh' ? '全站外观已固化' : 'Global Default Saved',
          3500
        );
      } else {
        toast.error(
          locale === 'zh' ? '固化失败，请确认管理员登录状态' : 'Failed to save global default',
          locale === 'zh' ? '同步失败' : 'Sync Error'
        );
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsSavingGlobal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md transition-opacity"
        onClick={handleClose} 
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={SPRING_MICRO}
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#faf8f5] dark:bg-[#12111a] border-4 border-white dark:border-white/10 shadow-2xl rounded-[36px] clay-card p-5 sm:p-8 text-neutral-800 dark:text-neutral-100 z-10 space-y-6"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bubble text-xl font-bold text-neutral-900 dark:text-white">
                  {locale === 'zh' ? '次元主题工坊' : 'Theme Studio'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bubble font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  8 Dimensions
                </span>
              </div>
              <p className="font-cute text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {locale === 'zh' ? '个性化切换 8 大粘土次元配色、环境光影与触觉交互风格' : 'Customize visual dimensions, atmospheric lighting & tactile feedback'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Random Mood Button */}
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="h-9 px-3 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-bubble font-bold text-xs"
              title={locale === 'zh' ? '随机次元变幻' : 'Surprise Me'}
            >
              <Dices className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{locale === 'zh' ? '随机奇遇' : 'Surprise'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-neutral-700 text-neutral-400 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 border border-neutral-200/80 dark:border-white/10 shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: 8 Visual Themes Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bubble font-bold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <span>🌈 {locale === 'zh' ? '选择视觉次元' : 'Visual Dimensions'}</span>
            </h4>
            <span className="text-[11px] font-cute text-neutral-400 dark:text-neutral-500">
              {locale === 'zh' ? '点击即刻无缝换肤' : 'Instant theme switch'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CLAY_THEMES.map((item) => {
              const isSelected = item.id === themeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  style={{
                    borderColor: isSelected ? item.primaryColor : undefined,
                  }}
                  className={`relative p-3.5 rounded-3xl text-left transition-all duration-300 flex flex-col justify-between group cursor-pointer border-2 ${
                    isSelected
                      ? 'bg-white dark:bg-neutral-800/90 shadow-lg scale-102 ring-2 ring-offset-2 ring-offset-transparent'
                      : 'bg-white/80 dark:bg-neutral-900/60 hover:bg-white dark:hover:bg-neutral-800/80 border-neutral-200/70 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 hover:scale-102'
                  }`}
                >
                  {/* Top: Emoji & Badge */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-2xl group-hover:scale-120 transition-transform duration-200">
                      {item.emoji}
                    </span>
                    {isSelected && (
                      <div 
                        style={{ backgroundColor: item.primaryColor }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs animate-in zoom-in-50"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="font-bubble font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {locale === 'zh' ? item.nameZh : item.nameEn}
                    </div>
                    <div className="font-cute text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                      {locale === 'zh' ? item.atmosphereDescZh.split('•')[0] : item.atmosphereDescEn}
                    </div>
                  </div>

                  {/* Color Palette Chips */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                    <span 
                      style={{ backgroundColor: item.primaryColor }}
                      className="w-4 h-4 rounded-full shadow-2xs border border-white/80 dark:border-white/20 shrink-0" 
                      title="Primary"
                    />
                    <span 
                      style={{ backgroundColor: item.bg }}
                      className="w-4 h-4 rounded-full shadow-2xs border border-neutral-300 dark:border-neutral-700 shrink-0" 
                      title="Light Background"
                    />
                    <span 
                      style={{ backgroundColor: item.darkBg }}
                      className="w-4 h-4 rounded-full shadow-2xs border border-neutral-700 shrink-0" 
                      title="Dark Background"
                    />
                    <span 
                      style={{ backgroundColor: item.particlePalette[0] || item.primaryColor }}
                      className="w-4 h-4 rounded-full shadow-2xs border border-white/60 dark:border-white/20 shrink-0" 
                      title="Particle Accent"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Atmosphere Intensity, Color Mode & Button Tactility */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-amber-900/10 dark:border-white/10">
          {/* 1. Atmosphere Intensity Slider/Pills */}
          <div className="p-4 rounded-3xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bubble font-bold text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-pink-500" />
                <span>{locale === 'zh' ? '粒子氛围引擎' : 'Atmosphere Engine'}</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-cute">
              {(['off', 'soft', 'dynamic'] as AtmosphereIntensity[]).map((mode) => {
                const isActive = atmosphereIntensity === mode;
                const labels = {
                  off: { zh: '🌑 静止', en: 'Off' },
                  soft: { zh: '🍃 舒缓', en: 'Soft' },
                  dynamic: { zh: '✨ 灵动', en: 'Lively' },
                };
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAtmosphereIntensity(mode)}
                    className={`py-1.5 rounded-xl font-bubble font-bold text-[11px] transition-all cursor-pointer ${
                      isActive
                        ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-xs`
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {locale === 'zh' ? labels[mode].zh : labels[mode].en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Color Mode (Light / Dark / Auto) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bubble font-bold text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{locale === 'zh' ? '外观明暗模式' : 'Color Mode'}</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-cute">
              {[
                { id: 'light' as ColorMode, icon: Sun, zh: '☀️ 浅色', en: 'Light' },
                { id: 'dark' as ColorMode, icon: Moon, zh: '🌙 深色', en: 'Dark' },
                { id: 'auto' as ColorMode, icon: Laptop, zh: '💻 自动', en: 'Auto' },
              ].map((item) => {
                const isActive = colorMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playSoftTick();
                      setColorMode(item.id);
                    }}
                    className={`py-1.5 rounded-xl font-bubble font-bold text-[11px] transition-all cursor-pointer ${
                      isActive
                        ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-xs`
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {locale === 'zh' ? item.zh : item.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Audio & Reset */}
          <div className="p-4 rounded-3xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 space-y-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-bubble font-bold text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>{locale === 'zh' ? '触感音效与重置' : 'Audio & Reset'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`flex-1 py-2 px-3 rounded-2xl font-bubble font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  soundOn
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200/70 dark:border-white/10'
                }`}
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundOn ? (locale === 'zh' ? '音效开启' : 'Sound On') : (locale === 'zh' ? '静音' : 'Muted')}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="py-2 px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bubble font-bold text-xs border border-neutral-200/70 dark:border-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                title={locale === 'zh' ? '恢复默认配置' : 'Reset Defaults'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '重置' : 'Reset'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Tactile Button Style Switcher */}
        <div className="space-y-2.5 pt-2 border-t border-amber-900/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="font-bubble font-bold text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-500" />
              <span>{locale === 'zh' ? '按钮拟物微动效风格 (Tactile Styles)' : 'Button Physics & Tactile Style'}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { id: 'neon' as ButtonStyle, emoji: '⚡', nameZh: '霓虹微光', nameEn: 'Neon' },
              { id: 'laser' as ButtonStyle, emoji: '✨', nameZh: '极光微弹', nameEn: 'Laser' },
              { id: 'jelly' as ButtonStyle, emoji: '🍬', nameZh: '果冻微弹', nameEn: 'Jelly' },
              { id: 'tint' as ButtonStyle, emoji: '🎨', nameZh: '柔和微淡', nameEn: 'Tint' },
              { id: 'clay' as ButtonStyle, emoji: '🧸', nameZh: '3D粘土', nameEn: 'Clay' },
              { id: 'glass' as ButtonStyle, emoji: '🧊', nameZh: '晶透玻璃', nameEn: 'Glass' },
            ].map((b) => {
              const isSelected = buttonStyle === b.id;
              const previewClass = `ctx-btn-preview-${b.id}`;
              const activeClass = `ctx-btn-active-${b.id}`;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    playPop();
                    setButtonStyle(b.id);
                  }}
                  className={`py-2 px-2.5 rounded-2xl text-center font-bubble font-bold text-xs transition-all cursor-pointer border ${previewClass} ${
                    isSelected
                      ? `${activeClass} scale-105`
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200/80 dark:border-white/10'
                  }`}
                >
                  <span className="mr-1">{b.emoji}</span>
                  <span>{locale === 'zh' ? b.nameZh : b.nameEn}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Live Button Playground */}
          <div className="p-3.5 rounded-3xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bubble text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{locale === 'zh' ? '实时触感试玩区 (悬停与点击体验)' : 'Live Interactive Tactile Playground'}</span>
              </span>
              <span className="font-cute text-[10px]">
                {buttonStyle === 'neon' && (locale === 'zh' ? '⚡ 赛博错位多重硬阴影与主题霓虹光晕' : '⚡ Cyber multi-shadow & theme neon aura')}
                {buttonStyle === 'laser' && (locale === 'zh' ? '✨ 极光微弹高亮光圈与主题悬浮' : '✨ Laser contour aura & spring scale')}
                {buttonStyle === 'jelly' && (locale === 'zh' ? '🍬 软糖般物理挤压微弹与果冻晶莹流光' : '🍬 Jelly squash & stretch spring bounce')}
                {buttonStyle === 'tint' && (locale === 'zh' ? '🎨 柔和粉彩渐变与轻透微光内阴影' : '🎨 Soft pastel sheen & delicate inner tint')}
                {buttonStyle === 'clay' && (locale === 'zh' ? '🧸 玩具级立体粘土双向浮雕与挤压回弹' : '🧸 Chunky 3D clay extrusion & bevel press')}
                {buttonStyle === 'glass' && (locale === 'zh' ? '🧊 晶透液态毛玻璃高饱和折射与高光' : '🧊 Frosted liquid glassmorphism & reflections')}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => playPop(600)}
                className={`px-4 py-2 rounded-2xl font-bubble font-bold text-xs text-white bg-gradient-to-r ${theme.primaryGradient} shadow-sm cursor-pointer`}
              >
                <span>{locale === 'zh' ? `🔥 ${theme.nameZh} 主操作` : `🔥 ${theme.nameEn} Action`}</span>
              </button>

              <button
                type="button"
                onClick={() => playSoftTick()}
                className={`px-4 py-2 rounded-2xl font-bubble font-bold text-xs ${theme.activeBtnClass} cursor-pointer`}
              >
                <span>{locale === 'zh' ? '次级胶囊' : 'Secondary Capsule'}</span>
              </button>

              <button
                type="button"
                onClick={() => playChime()}
                className={`px-3.5 py-2 rounded-2xl font-bubble font-bold text-xs ${theme.badgeBg} cursor-pointer flex items-center gap-1.5`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '次元徽章测试' : 'Theme Badge Test'}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerConfettiShower(10)}
                className="px-3.5 py-2 rounded-2xl font-bubble font-bold text-xs bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200/80 dark:border-white/15 cursor-pointer flex items-center gap-1.5 shadow-3xs"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '彩蛋微弹' : 'Confetti Pop'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Curator Global Default Sync Bar */}
        {isAdmin && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border-2 border-amber-300/70 dark:border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 text-left w-full sm:w-auto">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bubble font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                  {locale === 'zh' ? '👑 主理人全站默认外观控制' : '👑 Curator Global Appearance'}
                </p>
                <p className="font-cute text-[11px] text-neutral-500 dark:text-neutral-400">
                  {locale === 'zh' ? '将当前选择的主题、按钮与氛围固化为全站官方默认外观，所有访客打开时同频呈现' : 'Save active theme & button style as global default for all visitors'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingGlobal}
              onClick={handleSaveGlobalDefault}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bubble font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {isSavingGlobal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{locale === 'zh' ? '保存为全站默认外观' : 'Save as Global Default'}</span>
            </button>
          </div>
        )}

        {/* Footer info pill */}
        <div className="pt-3 border-t border-amber-900/10 dark:border-white/10 flex items-center justify-between text-xs font-cute text-neutral-400 dark:text-neutral-500">
          <span>{locale === 'zh' ? `当前次元：${theme.emoji} ${theme.nameZh}` : `Active: ${theme.emoji} ${theme.nameEn}`}</span>
          <button
            type="button"
            onClick={handleClose}
            className={`px-5 py-2 rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer`}
          >
            {locale === 'zh' ? '完成并探索' : 'Done & Explore'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
