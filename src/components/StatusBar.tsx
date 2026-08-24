import React from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  WifiOff, 
  AlertTriangle, 
  Globe, 
  Sidebar, 
  Server,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { Note, SyncState } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { useClayTheme } from '../blog/utils/clayThemes';
import { playPop } from '../blog/utils/soundEffects';

export interface StatusBarProps {
  note: Note | null;
  syncState: SyncState;
  onToggleSidebar: () => void;
  onToggleLanguage: () => void;
  onOpenCommandPalette: () => void;
  onOpenMcpSettings: () => void;
  onTagClick: (tag: string) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  note,
  syncState,
  onToggleSidebar,
  onToggleLanguage,
  onOpenCommandPalette,
  onOpenMcpSettings,
  onTagClick,
}) => {
  const { t, locale } = useI18n();
  const { theme } = useClayTheme();

  const readingTimeMinutes = Math.max(1, Math.ceil((note?.wordCount || 0) / 200));

  const renderSyncIndicator = () => {
    switch (syncState) {
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-cute font-bold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{t.editor.saving}</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs font-cute">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t.editor.offline}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-cute font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Sync Error</span>
          </div>
        );
      case 'synced':
      default:
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-cute font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.editor.synced}</span>
          </div>
        );
    }
  };

  return (
    <footer 
      style={{ backgroundColor: `${theme.headerBg}ee` }}
      className="hidden md:flex fixed bottom-0 left-0 right-0 h-10 border-t border-amber-900/10 dark:border-white/10 backdrop-blur-xl px-4 sm:px-6 items-center justify-between z-30 select-none text-neutral-600 dark:text-neutral-300 text-xs font-cute transition-colors duration-500"
    >
      {/* Left side: Sync indicator & Word statistics */}
      <div className="flex items-center gap-3 sm:gap-4">
        {renderSyncIndicator()}

        <span className="w-px h-3.5 bg-amber-900/15 dark:bg-white/10 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
          <span>{note?.wordCount || 0} {t.editor.words}</span>
          <span>·</span>
          <span>{note?.charCount || 0} {t.editor.characters}</span>
          <span>·</span>
          <span>{readingTimeMinutes} {t.editor.readingTime}</span>
        </div>

        {/* Note's Tag Badges */}
        {note?.tags && note.tags.length > 0 && (
          <>
            <span className="w-px h-3.5 bg-amber-900/15 dark:bg-white/10 hidden md:block" />
            <div className="hidden md:flex items-center gap-1.5 overflow-hidden max-w-[280px]">
              {note.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    playPop(620);
                    onTagClick(tag);
                  }}
                  className="px-2.5 py-0.5 rounded-xl bg-pink-50/90 dark:bg-white/10 hover:bg-pink-100 dark:hover:bg-white/20 border border-pink-200 dark:border-white/15 text-pink-700 dark:text-pink-300 text-xs font-bubble font-bold truncate cursor-pointer transition"
                >
                  {tag}
                </button>
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs text-neutral-400">+{note.tags.length - 3}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right side: Sidebar Toggle, MCP, Language, Command Palette */}
      <div className="flex items-center gap-2 font-cute font-medium">
        {/* Toggle Tag Mesh Sidebar */}
        <button
          onClick={() => {
            playPop();
            onToggleSidebar();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/90 dark:bg-white/10 hover:bg-pink-50 dark:hover:bg-white/20 border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:text-pink-600 dark:hover:text-pink-400 transition cursor-pointer text-xs font-bubble font-bold shadow-xs active:scale-95"
          title={locale === 'zh' ? '展开/收起侧边栏 (Alt+S)' : 'Tag Mesh Sidebar (Alt+S)'}
        >
          <Sidebar className="w-3.5 h-3.5 text-pink-500" />
          <span className="hidden md:inline">{locale === 'zh' ? '侧边栏' : 'Sidebar'}</span>
        </button>

        {/* MCP Credentials */}
        <button
          onClick={() => {
            playPop();
            onOpenMcpSettings();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/90 dark:bg-white/10 hover:bg-amber-50 dark:hover:bg-white/20 border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer text-xs font-bubble font-bold shadow-xs active:scale-95"
          title="MCP Service"
        >
          <Server className="w-3 h-3 text-amber-500" />
          <span className="hidden md:inline">{locale === 'zh' ? 'MCP密钥' : 'MCP'}</span>
        </button>

        {/* Language switch */}
        <button
          onClick={() => {
            playPop();
            onToggleLanguage();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/90 dark:bg-white/10 hover:bg-cyan-50 dark:hover:bg-white/20 border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer text-xs font-bubble font-bold shadow-xs active:scale-95"
          title={locale === 'zh' ? '切换中英文' : 'Toggle Language'}
        >
          <Globe className="w-3 h-3 text-cyan-500" />
          <span>{locale === 'zh' ? '中' : 'EN'}</span>
        </button>

        {/* Search / Command Palette button */}
        <button
          onClick={() => {
            playPop();
            onOpenCommandPalette();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-white/10 hover:bg-neutral-100 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 transition cursor-pointer text-xs font-bubble font-bold shadow-xs active:scale-95"
        >
          <Search className="w-3 h-3 text-neutral-400" />
          <span>{locale === 'zh' ? '搜索 (⌘K)' : 'Search (⌘K)'}</span>
        </button>
      </div>
    </footer>
  );
};
