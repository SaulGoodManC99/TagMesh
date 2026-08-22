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
  Keyboard
} from 'lucide-react';
import { Note, SyncState } from '../types/note';
import { useI18n } from '../hooks/useI18n';
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

  const readingTimeMinutes = Math.max(1, Math.ceil((note?.wordCount || 0) / 200));

  const renderSyncIndicator = () => {
    switch (syncState) {
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-cute font-bold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{t.editor.saving}</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-cute">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t.editor.offline}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-cute font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Sync Error</span>
          </div>
        );
      case 'synced':
      default:
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-cute font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.editor.synced}</span>
          </div>
        );
    }
  };

  return (
    <footer className="hidden md:flex fixed bottom-0 left-0 right-0 h-10 border-t border-amber-900/10 bg-[#fdfbf7]/90 backdrop-blur-md px-4 sm:px-6 items-center justify-between z-30 select-none text-neutral-600 text-xs font-cute">
      {/* Left side: Sync indicator & Word statistics */}
      <div className="flex items-center gap-3 sm:gap-4">
        {renderSyncIndicator()}

        <span className="w-px h-3.5 bg-amber-900/15 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2 text-neutral-500">
          <span>{note?.wordCount || 0} {t.editor.words}</span>
          <span>·</span>
          <span>{note?.charCount || 0} {t.editor.characters}</span>
          <span>·</span>
          <span>{readingTimeMinutes} {t.editor.readingTime}</span>
        </div>

        {/* Note's Tag Badges */}
        {note?.tags && note.tags.length > 0 && (
          <>
            <span className="w-px h-3.5 bg-amber-900/15 hidden md:block" />
            <div className="hidden md:flex items-center gap-1.5 overflow-hidden max-w-[280px]">
              {note.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    playPop(620);
                    onTagClick(tag);
                  }}
                  className="px-2 py-0.5 rounded-full bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 text-[10px] font-mono truncate cursor-pointer transition"
                >
                  {tag}
                </button>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[10px] text-neutral-400">+{note.tags.length - 3}</span>
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
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-pink-50 border border-neutral-200/80 text-neutral-700 hover:text-pink-600 transition cursor-pointer text-xs shadow-xs"
          title="Tag Mesh Sidebar (⌘\)"
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
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-amber-50 border border-neutral-200/80 text-neutral-700 hover:text-amber-600 transition cursor-pointer text-xs shadow-xs"
          title="MCP Service"
        >
          <Server className="w-3 h-3 text-amber-500" />
          <span className="hidden md:inline">MCP</span>
        </button>

        {/* Language switch */}
        <button
          onClick={() => {
            playPop();
            onToggleLanguage();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-cyan-50 border border-neutral-200/80 text-neutral-700 hover:text-cyan-600 transition cursor-pointer text-xs shadow-xs"
          title="Toggle Language (⇧⌘L)"
        >
          <Globe className="w-3 h-3 text-cyan-500" />
          <span className="font-bold">{locale === 'zh' ? '中' : 'EN'}</span>
        </button>

        {/* Command Palette button */}
        <button
          onClick={() => {
            playPop();
            onOpenCommandPalette();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-900 text-cyan-300 transition cursor-pointer text-xs font-mono font-bold shadow-xs hover:bg-neutral-800"
        >
          <span>⌘K</span>
        </button>
      </div>
    </footer>
  );
};
