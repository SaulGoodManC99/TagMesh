import React from 'react';
import { Sparkles, FileText, Hash, Layers, Dices } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { playPop } from './utils/soundEffects';

export interface ClayHeroProps {
  totalNotes: number;
  totalTags: number;
  totalWords: number;
}

export const ClayHero: React.FC<ClayHeroProps> = ({
  totalNotes,
  totalTags,
  totalWords,
}) => {
  const { locale } = useI18n();

  return (
    <section className="relative pt-6 pb-2 px-4 sm:px-8 overflow-hidden select-none">
      {/* Subtle Ambient Mesh Glows in Background */}
      <div className="absolute -top-16 left-1/4 w-96 h-96 rounded-full bg-pink-300/20 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />

      {/* Bento-style Hero Container */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        {/* Left Large Bento Card (8 Cols) */}
        <div className="lg:col-span-8 p-7 sm:p-9 rounded-[36px] bg-white/85 backdrop-blur-xl clay-card border-3 border-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Floating Playful Mascot */}
          <div className="absolute top-6 right-8 text-4xl sm:text-5xl animate-cute-float opacity-90 hidden sm:block pointer-events-none">
            🎈
          </div>

          <div>
            {/* Top Pill Badge */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-bubble text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                <span>{locale === 'zh' ? '零标题 · 纯标签 · 黏土乐园' : 'Zero Titles · Pure Tags · Clay Paradise'}</span>
              </div>
            </div>

            {/* Bubbly Gradient Title */}
            <h1 className="font-bubble text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-3">
              {locale === 'zh' ? (
                <>
                  把每一个灵感，捏成<span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">可爱的黏土卡片</span> ✨
                </>
              ) : (
                <>
                  Shape Every Idea into a <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">Delightful Clay Card</span> ✨
                </>
              )}
            </h1>

            <p className="font-cute text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
              {locale === 'zh'
                ? '告别传统文件夹的繁琐束缚。只需在正文中随处敲击 #标签，即刻织就多维立体的灵感网络。'
                : 'No more folder anxiety. Type #hashtags anywhere and watch your ideas weave into a playful mesh.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4 text-xs font-cute text-neutral-400">
            <span>💡 {locale === 'zh' ? '点击右下角浮动按钮可随时切换 5 种笔记展示模式' : 'Click the bottom-right floating button to switch between 5 note views'}</span>
          </div>
        </div>

        {/* Right Bento Stats Tiles (4 Cols) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          {/* Tile 1: Notes */}
          <div className="p-5 rounded-[28px] bg-gradient-to-br from-pink-50 to-rose-100/80 clay-card border-3 border-white shadow-md flex items-center justify-between group hover:scale-102 transition-transform">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white text-pink-600 clay-btn flex items-center justify-center text-xl shadow-xs group-hover:rotate-12 transition-transform">
                📝
              </div>
              <div>
                <p className="text-xs font-bubble text-pink-800 font-bold uppercase tracking-wider">
                  {locale === 'zh' ? '收录笔记' : 'Total Notes'}
                </p>
                <h3 className="font-bubble text-2xl font-extrabold text-neutral-900 mt-0.5">
                  {totalNotes} <span className="text-xs font-cute font-semibold text-neutral-500">{locale === 'zh' ? '篇' : 'cards'}</span>
                </h3>
              </div>
            </div>
            <span className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">🌸</span>
          </div>

          {/* Tile 2: Tags */}
          <div className="p-5 rounded-[28px] bg-gradient-to-br from-amber-50 to-yellow-100/80 clay-card border-3 border-white shadow-md flex items-center justify-between group hover:scale-102 transition-transform">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 clay-btn flex items-center justify-center text-xl shadow-xs group-hover:rotate-12 transition-transform">
                🏷️
              </div>
              <div>
                <p className="text-xs font-bubble text-amber-800 font-bold uppercase tracking-wider">
                  {locale === 'zh' ? '标签聚合网' : 'Tag Mesh'}
                </p>
                <h3 className="font-bubble text-2xl font-extrabold text-neutral-900 mt-0.5">
                  {totalTags} <span className="text-xs font-cute font-semibold text-neutral-500">{locale === 'zh' ? '个' : 'tags'}</span>
                </h3>
              </div>
            </div>
            <span className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">🍯</span>
          </div>

          {/* Tile 3: Words */}
          <div className="p-5 rounded-[28px] bg-gradient-to-br from-cyan-50 to-sky-100/80 clay-card border-3 border-white shadow-md flex items-center justify-between group hover:scale-102 transition-transform">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white text-cyan-600 clay-btn flex items-center justify-center text-xl shadow-xs group-hover:rotate-12 transition-transform">
                ⚡
              </div>
              <div>
                <p className="text-xs font-bubble text-cyan-800 font-bold uppercase tracking-wider">
                  {locale === 'zh' ? '灵感字数' : 'Words Count'}
                </p>
                <h3 className="font-bubble text-2xl font-extrabold text-neutral-900 mt-0.5">
                  {totalWords.toLocaleString()} <span className="text-xs font-cute font-semibold text-neutral-500">{locale === 'zh' ? '字' : 'words'}</span>
                </h3>
              </div>
            </div>
            <span className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">🌊</span>
          </div>
        </div>
      </div>
    </section>
  );
};
