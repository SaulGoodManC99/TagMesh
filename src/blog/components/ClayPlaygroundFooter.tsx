import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  Download, 
  Terminal, 
  Keyboard, 
  ShieldCheck, 
  Smile, 
  Footprints,
  Database,
  ArrowUp
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playChime } from '../utils/soundEffects';
import { triggerParticleBurst, triggerConfettiShower } from '../utils/confetti';
import { db } from '../../db/dexie';
import { APP_VERSION, getFormattedBuildTime } from '../../constants/version';

export interface ClayPlaygroundFooterProps {
  totalNotes: number;
  totalTags: number;
  totalWords: number;
  onOpenShortcuts?: () => void;
  onOpenGacha?: () => void;
}

const STAMP_EMOJIS = ['🐾', '🌸', '✨', '🍡', '🍮', '💖', '🍭', '🧸'];

export const ClayPlaygroundFooter: React.FC<ClayPlaygroundFooterProps> = ({
  totalNotes,
  totalTags,
  totalWords,
  onOpenShortcuts,
  onOpenGacha,
}) => {
  const { locale } = useI18n();
  const [stampCount, setStampCount] = useState(128);
  const [stamps, setStamps] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  // Interactive Clay Stamp Easter Egg
  const handleLeaveStamp = (e: React.MouseEvent) => {
    playChime();
    setStampCount((prev) => prev + 1);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const randomEmoji = STAMP_EMOJIS[Math.floor(Math.random() * STAMP_EMOJIS.length)];

    const newStamp = {
      id: Date.now() + Math.random(),
      x,
      y,
      emoji: randomEmoji,
    };

    setStamps((prev) => [...prev.slice(-8), newStamp]);
    triggerParticleBurst(e.clientX, e.clientY, 15);
  };

  const handleExportAllJson = async () => {
    playPop(620);
    const allNotes = await db.notes.toArray();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allNotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tagmesh-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const scrollToTop = () => {
    playPop(520);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-16 border-t border-amber-900/10 dark:border-white/10 bg-[#fdfbf7]/90 dark:bg-neutral-950/90 backdrop-blur-md pt-12 pb-16 px-4 sm:px-8 select-none relative overflow-hidden">
      {/* Decorative Rainbow Line at Top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-rose-400 via-amber-300 via-emerald-300 to-cyan-400" />

      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Top Playful Interactive Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Interactive Stamp Easter Egg */}
          <div 
            onClick={handleLeaveStamp}
            className="relative p-6 rounded-[32px] bg-white dark:bg-neutral-900 border-3 border-white dark:border-white/10 shadow-md hover:shadow-xl transition cursor-pointer clay-card overflow-hidden group flex flex-col justify-between min-h-[140px]"
          >
            {/* Animated Floating Stamps */}
            {stamps.map((st) => (
              <span
                key={st.id}
                style={{ left: st.x, top: st.y }}
                className="absolute pointer-events-none text-2xl -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-50 fade-in duration-200"
              >
                {st.emoji}
              </span>
            ))}

            <div className="flex items-center justify-between">
              <span className="text-3xl select-none group-hover:scale-110 transition-transform">🐾</span>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900 text-xs font-mono font-bold">
                {stampCount} {locale === 'zh' ? '个乐园手印' : 'stamps'}
              </span>
            </div>

            <div>
              <h4 className="font-bubble text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {locale === 'zh' ? '留下你的黏土手印 🐾' : 'Leave your clay stamp 🐾'}
              </h4>
              <p className="text-xs font-cute text-neutral-400 dark:text-neutral-500">
                {locale === 'zh' ? '点击此处盖章，触发治愈手印彩蛋！' : 'Click to stamp cute paw prints!'}
              </p>
            </div>
          </div>

          {/* Card 2: Lucky Dip Gacha Trigger */}
          <div 
            onClick={() => {
              if (onOpenGacha) {
                playPop();
                onOpenGacha();
              }
            }}
            className="p-6 rounded-[32px] bg-gradient-to-br from-amber-50 to-pink-50 dark:from-amber-950/40 dark:to-pink-950/40 border-3 border-white dark:border-white/10 shadow-md hover:shadow-xl transition cursor-pointer clay-card flex flex-col justify-between min-h-[140px] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl select-none group-hover:rotate-12 transition-transform">🎲</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bubble font-bold">
                {locale === 'zh' ? '随心漫游' : 'Lucky Dip'}
              </span>
            </div>

            <div>
              <h4 className="font-bubble text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {locale === 'zh' ? '乐园灵感扭蛋机 🎰' : 'Inspiration Gacha 🎰'}
              </h4>
              <p className="text-xs font-cute text-neutral-500 dark:text-neutral-400">
                {locale === 'zh' ? '不知道看哪篇？摇一颗今日命中注定的灵感卡片' : 'Spin a random serendipitous note'}
              </p>
            </div>
          </div>

          {/* Card 3: Full Backup & Data Portability */}
          <div 
            onClick={handleExportAllJson}
            className="p-6 rounded-[32px] bg-white dark:bg-neutral-900 border-3 border-white dark:border-white/10 shadow-md hover:shadow-xl transition cursor-pointer clay-card flex flex-col justify-between min-h-[140px] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">📦</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900 text-xs font-mono font-bold">
                JSON Backup
              </span>
            </div>

            <div>
              <h4 className="font-bubble text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {locale === 'zh' ? '全量笔记数据备份 💾' : 'Export Full Backup 💾'}
              </h4>
              <p className="text-xs font-cute text-neutral-400 dark:text-neutral-500">
                {locale === 'zh' ? '100% 本地优先，随时一键导出全库' : '100% Local-First data ownership'}
              </p>
            </div>
          </div>
        </div>

        {/* Middle Stats Bar */}
        <div className="p-5 rounded-3xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-cute text-neutral-600 dark:text-neutral-300 shadow-3xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-bubble font-bold text-neutral-800 dark:text-neutral-100">
              <Database className="w-4 h-4 text-rose-500" />
              <span>{totalNotes} {locale === 'zh' ? '篇笔记' : 'notes'}</span>
            </span>
            <span>•</span>
            <span className="font-bold text-pink-600 dark:text-pink-400">{totalTags} {locale === 'zh' ? '个标签' : 'tags'}</span>
            <span>•</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{totalWords} {locale === 'zh' ? '字总产出' : 'words'}</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer font-bold"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '全键盘快捷键' : 'Shortcuts (⌘/)'}</span>
              </button>
            )}

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-white/10 transition cursor-pointer font-bubble font-bold active:scale-95"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? '回到顶部' : 'Top'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Signature with Version & Build Time */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <p className="font-bubble font-extrabold text-sm sm:text-base text-neutral-800 dark:text-neutral-100">
              TagMesh • 纯标签驱动的 3D 黏土趣味知识笔记系统
            </p>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-xs font-bold shadow-3xs">
              {APP_VERSION}
            </span>
          </div>
          <p className="font-cute text-xs text-neutral-400 dark:text-neutral-500">
            Handcrafted with 💖, Claymorphism & Local-First IndexedDB Architecture
          </p>
        </div>
      </div>
    </footer>
  );
};
