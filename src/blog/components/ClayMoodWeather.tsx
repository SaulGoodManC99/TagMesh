import React from 'react';
import { Sun, Zap, Waves, Sparkles, Heart } from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop } from '../utils/soundEffects';

export interface ClayMoodWeatherProps {
  notes: Note[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
}

interface MoodCategory {
  id: string;
  emoji: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  keywords: string[];
  gradient: string;
  borderClass: string;
  textClass: string;
}

const MOODS: MoodCategory[] = [
  {
    id: 'creative',
    emoji: '☀️',
    titleZh: '灵感晴朗',
    titleEn: 'Sunny Ideas',
    descZh: '产品创意、设计美学与闪光想法',
    descEn: 'Design, product ideas & creativity',
    keywords: ['#idea', '#design', '#ui', '#ux', '#product', '#创意', '#灵感', '#设计', '#美学'],
    gradient: 'from-amber-100 to-yellow-200',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-900',
  },
  {
    id: 'tech',
    emoji: '⚡',
    titleZh: '极客技术',
    titleEn: 'Geek Sparks',
    descZh: '代码工程、架构设计与工具打磨',
    descEn: 'Code, tech stack, tooling & engines',
    keywords: ['#code', '#react', '#rust', '#dev', '#tech', '#ai', '#前端', '#算法', '#架构', '#工具'],
    gradient: 'from-cyan-100 to-sky-200',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-900',
  },
  {
    id: 'insight',
    emoji: '🌊',
    titleZh: '深度沉思',
    titleEn: 'Deep Flow',
    descZh: '认知复盘、心流体验与长远洞察',
    descEn: 'Cognition, philosophy & reflection',
    keywords: ['#deep', '#thinking', '#career', '#book', '#insight', '#思考', '#复盘', '#认知', '#心流'],
    gradient: 'from-purple-100 to-indigo-200',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-900',
  },
  {
    id: 'daily',
    emoji: '🌸',
    titleZh: '随笔生活',
    titleEn: 'Cozy Moments',
    descZh: '生活碎片、心情日记与手账温度',
    descEn: 'Daily memos, life warmth & journaling',
    keywords: ['#daily', '#life', '#memo', '#todo', '#notes', '#随笔', '#生活', '#日记', '#手账'],
    gradient: 'from-pink-100 to-rose-200',
    borderClass: 'border-pink-300',
    textClass: 'text-rose-900',
  },
];

export const ClayMoodWeather: React.FC<ClayMoodWeatherProps> = ({
  notes,
  selectedTag,
  onSelectTag,
}) => {
  const { locale } = useI18n();

  // Compute counts for each mood category
  const moodStats = React.useMemo(() => {
    return MOODS.map((m) => {
      const matchCount = notes.filter((n) => {
        const tags = (n.tags || []).map((t) => t.toLowerCase());
        return m.keywords.some((k) => tags.includes(k.toLowerCase()));
      }).length;
      return { ...m, count: matchCount };
    });
  }, [notes]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-3 select-none">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-pink-500" />
        <h3 className="font-bubble font-bold text-sm sm:text-base text-neutral-800">
          {locale === 'zh' ? '⛅ 乐园灵感天气与思维状态' : '⛅ Inspiration Weather & Mood Map'}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {moodStats.map((mood) => {
          return (
            <div
              key={mood.id}
              onClick={() => {
                playPop(650);
                // Filter by first keyword of mood
                onSelectTag(mood.keywords[0]);
              }}
              className={`p-4 rounded-3xl bg-gradient-to-br ${mood.gradient} border-2 ${mood.borderClass} shadow-md hover:shadow-xl hover:scale-102 transition-all duration-200 cursor-pointer clay-card group flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl select-none group-hover:rotate-6 transition-transform">{mood.emoji}</span>
                <span className={`px-2.5 py-0.5 rounded-full bg-white/80 font-mono text-xs font-bold ${mood.textClass} shadow-3xs`}>
                  {mood.count} 篇
                </span>
              </div>

              <div>
                <h4 className={`font-bubble text-sm sm:text-base font-extrabold ${mood.textClass} leading-tight mb-0.5`}>
                  {locale === 'zh' ? mood.titleZh : mood.titleEn}
                </h4>
                <p className="text-[11px] font-cute text-neutral-600 line-clamp-1 opacity-80">
                  {locale === 'zh' ? mood.descZh : mood.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
