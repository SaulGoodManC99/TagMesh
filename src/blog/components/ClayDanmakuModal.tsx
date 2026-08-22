import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, 
  X, 
  Smile, 
  Sparkles, 
  User, 
  MessageSquare, 
  Palette,
  Heart
} from 'lucide-react';
import { DanmakuItem, saveNewDanmaku } from '../data/danmakuData';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playSwoosh, playChime } from '../utils/soundEffects';
import { triggerParticleBurst } from '../utils/confetti';
import { useClayTheme } from '../utils/clayThemes';
import { EMOJI_MEME_DATABASE } from '../../editor/data/emojiMemeData';

export interface ClayDanmakuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendDanmaku: (newDanmaku: DanmakuItem) => void;
}

const QUICK_EMOJI_PICKS = [
  { label: '张嘴猫', code: ':popcat:', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f431.png' },
  { label: '打鼓猫', code: ':bongo_cat:', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f941.png' },
  { label: '哭哭猫', code: ':crying_cat:', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f63f.png' },
  { label: '摇摆猫', code: ':vibing_cat:', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3b6.png' },
  { label: '可怜', code: '🥺', icon: '🥺' },
  { label: '笑哭', code: '😂', icon: '😂' },
  { label: '爱心', code: '💖', icon: '💖' },
  { label: '火焰', code: '🔥', icon: '🔥' },
  { label: '布丁', code: '🍮', icon: '🍮' },
  { label: '肉垫', code: '🐾', icon: '🐾' },
  { label: '火箭', code: '🚀', icon: '🚀' },
  { label: '满分', code: '💯', icon: '💯' },
];

export const ClayDanmakuModal: React.FC<ClayDanmakuModalProps> = ({
  isOpen,
  onClose,
  onSendDanmaku,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('');
  const [themeStyle, setThemeStyle] = useState<'rainbow' | 'sakura' | 'cosmic' | 'zen' | 'gold' | 'default'>('rainbow');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setContent('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickInsert = (code: string) => {
    playPop(580);
    setContent((prev) => `${prev}${code}`);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    playSwoosh();
    triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 25);

    const cleanSender = sender.trim() || (locale === 'zh' ? '🎭 匿名旅人' : '🎭 Anonymous Traveler');
    const newDanmaku: DanmakuItem = {
      id: `dm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: cleanSender,
      avatar: cleanSender.startsWith('🎭') ? '🎭' : '🐾',
      content: content.trim(),
      themeStyle,
      likes: 1,
      timestamp: Date.now(),
      isSelf: true,
    };

    saveNewDanmaku(newDanmaku);
    onSendDanmaku(newDanmaku);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 modal-backdrop-enter select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] p-5 sm:p-7 rounded-[36px] bg-white/95 backdrop-blur-md border-4 border-white shadow-2xl clay-card flex flex-col gap-4 relative overflow-hidden modal-card-enter"
      >
        {/* Top Decorative Washi Tape */}
        <div className={`absolute -top-3 left-10 w-28 h-5.5 bg-gradient-to-r ${theme.washiGradient} opacity-90 rotate-[-1.5deg] shadow-xs`} />

        {/* 1. Header Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">🚀</span>
            <h3 className="font-bubble font-extrabold text-base sm:text-lg text-neutral-900">
              {locale === 'zh' ? '全屏弹幕发射台' : 'Danmaku Barrage Cannon'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-rose-500 hover:text-white text-neutral-500 flex items-center justify-center transition cursor-pointer active:scale-90 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          
          {/* Danmaku Content Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bubble font-bold text-neutral-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
              <span>{locale === 'zh' ? '弹幕要说的内容 *' : 'Your Message *'}</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                maxLength={70}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={locale === 'zh' ? '说点好玩的或留个心愿... (支持表情包)' : 'Leave a comment or wish...'}
                className="w-full px-4 py-2.5 bg-neutral-50/90 border border-neutral-200/80 rounded-2xl text-xs sm:text-sm font-cute text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-rose-400 transition shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400">
                {content.length}/70
              </span>
            </div>
          </div>

          {/* Quick Emoji / Meme Sticker Tray */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bubble font-bold text-neutral-500 flex items-center gap-1">
              <Smile className="w-3 h-3 text-amber-500" />
              <span>{locale === 'zh' ? '快捷插入表情 / 猫咪 MEME：' : 'Quick Emojis & Memes:'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 rounded-2xl border border-neutral-200/60">
              {QUICK_EMOJI_PICKS.map((em, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickInsert(em.code)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-pink-50 border border-neutral-200/80 hover:border-rose-300 text-xs font-bubble transition shadow-3xs cursor-pointer active:scale-90"
                  title={em.label}
                >
                  {em.icon.startsWith('http') ? (
                    <img src={em.icon} alt="" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    <span>{em.icon}</span>
                  )}
                  <span className="text-[10px] text-neutral-600">{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sender Identity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bubble font-bold text-neutral-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-500" />
              <span>{locale === 'zh' ? '你是谁 (留空即为 🎭 匿名旅人)' : 'Your Nickname (Optional)'}</span>
            </label>
            <input
              type="text"
              maxLength={20}
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder={locale === 'zh' ? '如：🌸 樱花主理人 / 喵酱 / 匿名旅人' : 'e.g. Pixel Wanderer / Anonymous'}
              className="w-full px-4 py-2 bg-neutral-50/90 border border-neutral-200/80 rounded-2xl text-xs font-cute text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-rose-400 transition shadow-inner"
            />
          </div>

          {/* Danmaku Color Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bubble font-bold text-neutral-500 flex items-center gap-1">
              <Palette className="w-3 h-3 text-pink-500" />
              <span>{locale === 'zh' ? '弹幕高光风格：' : 'Highlight Style:'}</span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'rainbow', label: '🌈 彩虹软糖', bg: 'bg-gradient-to-r from-pink-500 to-amber-500 text-white' },
                { id: 'sakura', label: '🌸 浪漫落樱', bg: 'bg-pink-500 text-white' },
                { id: 'cosmic', label: '🌌 极光星空', bg: 'bg-cyan-600 text-white' },
                { id: 'zen', label: '🍵 禅意抹茶', bg: 'bg-emerald-600 text-white' },
                { id: 'gold', label: '👑 尊贵琥珀', bg: 'bg-amber-500 text-white' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    playPop(520);
                    setThemeStyle(style.id as any);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bubble font-bold transition cursor-pointer shrink-0 border ${
                    themeStyle === style.id
                      ? `${style.bg} shadow-sm border-white scale-105`
                      : 'bg-neutral-100 text-neutral-700 border-transparent hover:bg-neutral-200'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!content.trim()}
            className={`w-full py-3 mt-1 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Rocket className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>{locale === 'zh' ? '🚀 咻~ 发射全屏弹幕！' : '🚀 Launch Danmaku!'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
