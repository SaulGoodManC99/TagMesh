import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Eye, 
  Sparkles, 
  Heart,
  Database,
  Coffee
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

export interface ClayParadiseTelemetryProps {
  totalNotes: number;
  totalTags: number;
  totalWords: number;
}

// Track session start time when the app loads
const SESSION_START_TIME = Date.now();

export const ClayParadiseTelemetry: React.FC<ClayParadiseTelemetryProps> = ({
  totalNotes,
  totalTags,
  totalWords,
}) => {
  const { locale } = useI18n();

  // 1. Honest Session Uptime (Counts up from 00:00:00)
  const [sessionUptime, setSessionUptime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - SESSION_START_TIME) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      setSessionUptime({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Real Honest Visitor Stats (Starts from 1, increments per page session)
  const [realVisits, setRealVisits] = useState({
    total: 1,
    today: 1,
  });

  useEffect(() => {
    try {
      const TOTAL_VISIT_KEY = 'tagmesh_real_total_visits';
      const TODAY_VISIT_KEY = 'tagmesh_real_today_visits';
      const LAST_DATE_KEY = 'tagmesh_real_last_date';
      const SESSION_TAG_KEY = 'tagmesh_session_active';

      const todayStr = new Date().toISOString().slice(0, 10);
      let total = parseInt(localStorage.getItem(TOTAL_VISIT_KEY) || '0', 10);
      let today = parseInt(localStorage.getItem(TODAY_VISIT_KEY) || '0', 10);
      const lastDate = localStorage.getItem(LAST_DATE_KEY);

      if (lastDate !== todayStr) {
        today = 0; // Reset for new day
        localStorage.setItem(LAST_DATE_KEY, todayStr);
      }

      if (!sessionStorage.getItem(SESSION_TAG_KEY)) {
        total += 1;
        today += 1;
        localStorage.setItem(TOTAL_VISIT_KEY, total.toString());
        localStorage.setItem(TODAY_VISIT_KEY, today.toString());
        sessionStorage.setItem(SESSION_TAG_KEY, '1');
      }

      setRealVisits({ total: Math.max(1, total), today: Math.max(1, today) });
    } catch {
      setRealVisits({ total: 1, today: 1 });
    }
  }, []);

  return (
    <div className="w-full p-5 sm:p-6 rounded-[32px] bg-white/80 backdrop-blur-md border-3 border-white shadow-lg clay-card select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-cute text-neutral-600">
        
        {/* Left: Real Session Uptime Clock */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">
              {locale === 'zh' ? '本次运行时间' : 'Session Uptime'}
            </span>
            <span className="font-mono font-bold text-neutral-800 text-sm">
              {sessionUptime.hours > 0 ? `${sessionUptime.hours}h ` : ''}
              {String(sessionUptime.minutes).padStart(2, '0')}m{' '}
              <span className="text-rose-500">{String(sessionUptime.seconds).padStart(2, '0')}s</span>
            </span>
          </div>
        </div>

        {/* Middle: Real Honest Visits Count */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-100/80 text-pink-700">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">
              {locale === 'zh' ? '小站漫游记录' : 'Visits'}
            </span>
            <span className="font-mono font-bold text-neutral-800 text-sm">
              {realVisits.total}{' '}
              <span className="text-neutral-400 font-normal text-xs">{locale === 'zh' ? '次' : 'total'}</span>
              <span className="mx-1 text-neutral-300">•</span>
              <span className="text-pink-600">+{realVisits.today} {locale === 'zh' ? '今日' : 'today'}</span>
            </span>
          </div>
        </div>

        {/* Right: Notes & Words Summary */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700">
            <Coffee className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">
              {locale === 'zh' ? '真实灵感沉淀' : 'Creation Stack'}
            </span>
            <span className="font-mono font-bold text-neutral-800 text-sm">
              {totalNotes} {locale === 'zh' ? '篇' : 'notes'}
              <span className="mx-1 text-neutral-300">•</span>
              <span className="text-emerald-700">{totalWords.toLocaleString()} {locale === 'zh' ? '字' : 'words'}</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
