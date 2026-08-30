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
  ArrowUp,
  Github
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useClayTheme } from '../utils/clayThemes';
import { playPop, playChime } from '../utils/soundEffects';
import { triggerParticleBurst, triggerConfettiShower } from '../utils/confetti';
import { db } from '../../db/dexie';
import { useAuth } from '../../hooks/useAuth';
import { APP_VERSION, getFormattedBuildTime } from '../../constants/version';

export interface ClayPlaygroundFooterProps {
  totalNotes: number;
  totalTags: number;
  totalWords: number;
  onOpenShortcuts?: () => void;
}

const STAMP_EMOJIS = ['🐾', '🌸', '✨', '🍡', '🍮', '💖', '🍭', '🧸'];

export const ClayPlaygroundFooter: React.FC<ClayPlaygroundFooterProps> = ({
  totalNotes,
  totalTags,
  totalWords,
  onOpenShortcuts,
}) => {
  const { locale } = useI18n();
  const { theme, randomTheme } = useClayTheme();
  const { isAdmin, openAuthModal } = useAuth();
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
    if (!isAdmin) {
      alert(locale === 'zh' ? '🔒 全量知识库备份为馆长专属权限，请先验证馆长身份！' : '🔒 Full knowledge base backup is restricted to Curator/Admin!');
      openAuthModal();
      return;
    }
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
    <footer 
      style={{ backgroundColor: `${theme.headerBg}ee` }}
      className="mt-8 sm:mt-12 border-t border-white/60 dark:border-white/10 backdrop-blur-xl pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 sm:px-6 select-none relative overflow-hidden transition-colors duration-500"
    >
      {/* Decorative Rainbow Line at Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-rose-400 via-amber-300 via-emerald-300 to-cyan-400 opacity-90" />

      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
        {/* Top Playful Interactive Section - Compact Sleek Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Interactive Stamp Easter Egg */}
          <div 
            onClick={handleLeaveStamp}
            className="relative p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#18181B]/85 border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-md transition cursor-pointer clay-card overflow-hidden group flex items-center justify-between gap-3 backdrop-blur-xl"
          >
            {/* Animated Floating Stamps */}
            {stamps.map((st) => (
              <span
                key={st.id}
                style={{ left: st.x, top: st.y }}
                className="absolute pointer-events-none text-xl -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-50 fade-in duration-200"
              >
                {st.emoji}
              </span>
            ))}

            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-300 border border-pink-500/20 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                🐾
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bubble text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                  {locale === 'zh' ? '留下你的黏土手印 🐾' : 'Leave your clay stamp 🐾'}
                </h4>
                <p className="text-[11px] font-cute text-neutral-500 dark:text-neutral-400 truncate">
                  {locale === 'zh' ? '点击盖章，触发治愈手印彩蛋！' : 'Click to stamp cute paw prints!'}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-pink-100/90 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900 text-[11px] font-bubble font-bold shrink-0">
              {stampCount} {locale === 'zh' ? '印' : 'stamps'}
            </span>
          </div>

          {/* Card 2: Serendipitous Theme Roaming */}
          <div 
            onClick={() => {
              randomTheme();
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#18181B]/85 border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-md transition cursor-pointer clay-card overflow-hidden group flex items-center justify-between gap-3 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20 flex items-center justify-center text-xl shrink-0 group-hover:rotate-12 transition-transform">
                🎲
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bubble text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                  {locale === 'zh' ? '次元随心漫游 🎨' : 'Serendipity Roam 🎨'}
                </h4>
                <p className="text-[11px] font-cute text-neutral-500 dark:text-neutral-400 truncate">
                  {locale === 'zh' ? '随机遇见 8 种治愈视觉心境' : 'Explore 8 serene visual dimensions'}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900 text-[11px] font-bubble font-bold shrink-0">
              {locale === 'zh' ? '随机换肤' : 'Randomize'}
            </span>
          </div>

          {/* Card 3: Full Backup & Data Portability */}
          <div 
            onClick={handleExportAllJson}
            className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#18181B]/85 border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:shadow-md transition cursor-pointer clay-card overflow-hidden group flex items-center justify-between gap-3 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                {isAdmin ? '📦' : '🔒'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bubble text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                  {locale === 'zh' ? '全量笔记数据备份 💾' : 'Export Full Backup 💾'}
                </h4>
                <p className="text-[11px] font-cute text-neutral-500 dark:text-neutral-400 truncate">
                  {isAdmin 
                    ? (locale === 'zh' ? '本地优先，随时一键导出全库' : 'Local-First data ownership')
                    : (locale === 'zh' ? '全量库备份受保护，点击验证' : 'Protected database (Admin only)')}
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bubble font-bold shrink-0 ${
              isAdmin 
                ? 'bg-cyan-100/90 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-900' 
                : 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900'
            }`}>
              {isAdmin ? (locale === 'zh' ? '导出' : 'Backup') : (locale === 'zh' ? '馆长专属' : 'Admin')}
            </span>
          </div>
        </div>

        {/* Middle Stats Bar - Compact Height */}
        <div className="py-2.5 px-4 sm:px-5 rounded-2xl bg-white/90 dark:bg-[#18181B]/85 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-cute text-neutral-600 dark:text-neutral-300 shadow-3xs">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-bubble font-bold text-neutral-800 dark:text-neutral-100">
              <Database className="w-3.5 h-3.5 text-rose-500" />
              <span>{totalNotes} {locale === 'zh' ? '篇笔记' : 'notes'}</span>
            </span>
            <span>•</span>
            <span className="font-bold text-pink-600 dark:text-pink-400">{totalTags} {locale === 'zh' ? '个标签' : 'tags'}</span>
            <span>•</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{totalWords} {locale === 'zh' ? '字总产出' : 'words'}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="px-3 py-1 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-300 border border-white/60 dark:border-white/10 text-xs font-bold clay-btn shadow-3xs cursor-pointer transition active:scale-95 flex items-center gap-1.5"
              >
                <Keyboard className="w-3.5 h-3.5 text-rose-500" />
                <span>{locale === 'zh' ? '快捷键速查 (Alt+/)' : 'Shortcuts'}</span>
              </button>
            )}

            <a
              href="https://github.com/SaulGoodManC99/TagMesh"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playPop(540)}
              className="px-3 py-1 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-neutral-900 text-neutral-700 dark:text-neutral-200 border border-white/60 dark:border-white/10 text-xs font-bubble font-bold clay-btn shadow-3xs cursor-pointer transition active:scale-95 flex items-center gap-1.5 group"
              title="GitHub Repository"
            >
              <Github className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
              <span>GitHub</span>
            </a>

            <button
              type="button"
              onClick={scrollToTop}
              className="px-3 py-1 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-200 border border-white/60 dark:border-white/10 text-xs font-bubble font-bold clay-btn shadow-3xs cursor-pointer transition active:scale-95 flex items-center gap-1.5"
            >
              <ArrowUp className="w-3.5 h-3.5 text-amber-500" />
              <span>{locale === 'zh' ? '回到顶部' : 'Top'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Signature with Version */}
        <div className="text-center space-y-0.5 pt-0.5">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <p className="font-bubble font-extrabold text-xs sm:text-sm text-neutral-800 dark:text-neutral-100">
              {locale === 'zh' ? 'TagMesh • 随心笔记 · 灵感备忘与多维标签管理' : 'TagMesh • Flow Notes · Fleeting Thoughts & Tag Mesh'}
            </p>
            <span className="px-2 py-0.2 rounded-full bg-rose-500 text-white font-bubble text-[11px] font-bold shadow-3xs">
              {APP_VERSION}
            </span>
          </div>
          <p className="font-cute text-[11px] text-neutral-400 dark:text-neutral-500">
            Handcrafted with 💖, Claymorphism & Local-First IndexedDB Architecture
          </p>
        </div>
      </div>
    </footer>
  );
};
