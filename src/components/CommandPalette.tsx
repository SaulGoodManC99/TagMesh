import React, { useState, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  FileText, 
  Plus, 
  Globe, 
  Download, 
  Copy, 
  Pin, 
  PinOff, 
  Trash2, 
  HelpCircle, 
  Hash, 
  Sidebar,
  Database,
  Terminal,
  Sparkles,
  PenTool,
  CornerDownLeft,
  Tag as TagIcon
} from 'lucide-react';
import { Note, TagCount } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { db, searchNotesLocal, getAllTagCounts } from '../db/dexie';
import { playPop, playChime } from '../blog/utils/soundEffects';

export interface CommandPaletteProps {
  isOpen: boolean;
  activeNote: Note | null;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
  onCreateNote: (initialText?: string) => void;
  onToggleSidebar: () => void;
  onToggleLanguage: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onCopyMcpToken: () => void;
  onTogglePin: () => void;
  onDeleteNote: () => void;
  onOpenShortcuts: () => void;
  onFilterTag: (tag: string) => void;
  onGoToBlog?: () => void;
}

type TabType = 'all' | 'commands' | 'notes' | 'tags';

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  activeNote,
  onClose,
  onSelectNote,
  onCreateNote,
  onToggleSidebar,
  onToggleLanguage,
  onExportMarkdown,
  onExportJson,
  onCopyMcpToken,
  onTogglePin,
  onDeleteNote,
  onOpenShortcuts,
  onFilterTag,
  onGoToBlog,
}) => {
  const { t, locale } = useI18n();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchedNotes, setSearchedNotes] = useState<Note[]>([]);

  // 100% Real-time dynamic live query for all tags in Dexie DB (role-scoped)
  const liveTags = useLiveQuery(() => getAllTagCounts(isAdmin ? undefined : 'guest'), [isAdmin]) || [];

  // Reset search when opening palette
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveTab('all');
    }
  }, [isOpen]);

  // Search notes reactive to search input
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const load = async () => {
      try {
        const found = await searchNotesLocal(search, undefined, isAdmin ? undefined : 'guest');
        if (mounted) {
          setSearchedNotes(found.slice(0, 15));
        }
      } catch (err) {
        console.error('Failed to search inside CommandPalette', err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, search]);

  const systemCommands = useMemo(() => [
    {
      id: 'cmd-blog',
      title: locale === 'zh' ? '🎈 打开黏土乐园博客' : '🎈 Open Clay Paradise Blog',
      keywords: ['blog', 'paradise', 'clay', '博客', '乐园', '主页'],
      icon: <Sparkles className="w-4.5 h-4.5 text-pink-500" />,
      action: () => {
        if (onGoToBlog) onGoToBlog();
        else window.location.hash = '#/';
        onClose();
      },
    },
    {
      id: 'cmd-editor',
      title: locale === 'zh' ? '🍮 打开灵感笔记工作台' : '🍮 Open Notes Workspace',
      keywords: ['editor', 'write', 'notes', '笔记', '写作', '工作台'],
      icon: <PenTool className="w-4.5 h-4.5 text-rose-500" />,
      action: () => {
        window.location.hash = '#/editor';
        onClose();
      },
    },
    {
      id: 'cmd-new',
      title: locale === 'zh' ? '🌸 新建灵感笔记 (⌘N)' : '🌸 New Note (⌘N)',
      keywords: ['new', 'create', 'note', 'add', '新建', '创建', '笔记', '灵感', '随手记'],
      shortcut: '⌘N',
      icon: <Plus className="w-4.5 h-4.5 text-rose-500" />,
      action: () => {
        onCreateNote('');
        onClose();
      },
    },
    {
      id: 'cmd-sidebar',
      title: locale === 'zh' ? '📑 展开 / 收起侧边栏 (⌘\\)' : '📑 Toggle Sidebar (⌘\\)',
      keywords: ['sidebar', 'tagmesh', 'panel', '侧边栏', '展开', '收起'],
      shortcut: '⌘\\',
      icon: <Sidebar className="w-4.5 h-4.5 text-amber-500" />,
      action: () => {
        onToggleSidebar();
        onClose();
      },
    },
    ...(isAdmin ? [{
      id: 'cmd-pin',
      title: activeNote?.isPinned ? t.commandPalette.cmdUnpinNote : t.commandPalette.cmdPinNote,
      keywords: ['pin', 'unpin', 'top', '置顶', '取消置顶'],
      icon: activeNote?.isPinned ? <PinOff className="w-4.5 h-4.5 text-amber-500" /> : <Pin className="w-4.5 h-4.5 text-neutral-400" />,
      action: () => {
        onTogglePin();
        onClose();
      },
    }] : []),
    {
      id: 'cmd-toggle-lang',
      title: `${t.commandPalette.cmdToggleLang} (${locale === 'zh' ? 'EN' : '中文'})`,
      keywords: ['language', 'translate', 'locale', '语言', '中英文', '切换'],
      shortcut: '⇧⌘L',
      icon: <Globe className="w-4.5 h-4.5 text-sky-600" />,
      action: () => {
        onToggleLanguage();
        onClose();
      },
    },
    {
      id: 'cmd-export-md',
      title: t.commandPalette.cmdExportMarkdown,
      keywords: ['export', 'markdown', 'md', 'download', '导出', '下载'],
      icon: <Download className="w-4.5 h-4.5 text-neutral-600" />,
      action: () => {
        onExportMarkdown();
        onClose();
      },
    },
    {
      id: 'cmd-export-json',
      title: t.commandPalette.cmdExportJson,
      keywords: ['export', 'json', 'backup', '备份', '导出全量'],
      icon: <Database className="w-4.5 h-4.5 text-neutral-600" />,
      action: () => {
        onExportJson();
        onClose();
      },
    },
    {
      id: 'cmd-mcp',
      title: t.commandPalette.cmdCopyMcpToken,
      keywords: ['mcp', 'token', 'serverless', 'claude', 'cursor', '接口', '密钥'],
      icon: <Copy className="w-4.5 h-4.5 text-violet-600" />,
      action: () => {
        onCopyMcpToken();
        onClose();
      },
    },
    {
      id: 'cmd-shortcuts',
      title: t.commandPalette.cmdShortcuts,
      keywords: ['shortcuts', 'help', 'keyboard', '快捷键', '帮助'],
      shortcut: '⌘/',
      icon: <HelpCircle className="w-4.5 h-4.5 text-neutral-400" />,
      action: () => {
        onOpenShortcuts();
        onClose();
      },
    },
    ...(isAdmin ? [{
      id: 'cmd-delete',
      title: t.commandPalette.cmdDeleteNote,
      keywords: ['delete', 'remove', 'trash', '删除', '移入废纸篓'],
      shortcut: '⌘⌫',
      icon: <Trash2 className="w-4.5 h-4.5 text-rose-500" />,
      action: () => {
        onDeleteNote();
        onClose();
      },
    }] : []),
  ], [activeNote, isAdmin, locale, onClose, onCreateNote, onDeleteNote, onExportJson, onExportMarkdown, onCopyMcpToken, onOpenShortcuts, onToggleLanguage, onTogglePin, onToggleSidebar, onGoToBlog, t]);

  const trimmedSearch = search.trim().toLowerCase();
  const searchWithoutHash = trimmedSearch.replace(/^#/, '');

  // Filter commands by search query; if search is active but no matches, keep top actions so commands never completely disappear!
  const filteredCommands = useMemo(() => {
    if (!trimmedSearch) return systemCommands;
    const directMatches = systemCommands.filter(c => 
      c.title.toLowerCase().includes(trimmedSearch) || 
      c.keywords.some(k => k.includes(trimmedSearch))
    );
    // If no direct matches, return top default commands as quick fallbacks
    return directMatches.length > 0 ? directMatches : systemCommands.slice(0, 4);
  }, [systemCommands, trimmedSearch]);

  // 100% Dynamic real-time filter tags from liveTags with enlarged chips
  const filteredTags = useMemo(() => {
    if (!trimmedSearch) return liveTags.slice(0, 16);
    return liveTags.filter(tg => 
      tg.tag.toLowerCase().includes(trimmedSearch) || 
      tg.tag.toLowerCase().replace(/^#/, '').includes(searchWithoutHash)
    ).slice(0, 16);
  }, [liveTags, trimmedSearch, searchWithoutHash]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/40 modal-backdrop-enter" 
        onClick={onClose} 
      />

      {/* Command Dialog Box */}
      <div className="relative w-full max-w-2xl bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[36px] clay-card overflow-hidden modal-card-enter text-neutral-800 flex flex-col max-h-[84vh]">
        <Command label="TagMesh Command Palette" shouldFilter={false} className="flex flex-col h-full overflow-hidden">
          {/* Top Search Bar */}
          <div className="flex items-center gap-3 px-6 py-4.5 border-b border-amber-900/10 bg-white/70 shrink-0">
            <Search className="w-5 h-5 text-rose-500 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={locale === 'zh' ? '搜索笔记、标签或输入指令...' : t.commandPalette.placeholder}
              className="w-full bg-transparent text-neutral-800 placeholder:text-neutral-400 text-base sm:text-lg font-cute font-medium focus:outline-none"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-neutral-500 hover:text-neutral-800 px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 cursor-pointer font-cute font-bold transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Tabs: All / Commands / Notes / Tags */}
          <div className="px-5 py-2.5 border-b border-amber-900/10 flex items-center gap-2 bg-white/40 text-xs sm:text-sm font-cute font-bold select-none shrink-0">
            <button
              onClick={() => {
                playPop(520);
                setActiveTab('all');
              }}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'all' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:bg-white/80'
              }`}
            >
              全部 (All)
            </button>
            <button
              onClick={() => {
                playPop(520);
                setActiveTab('tags');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'tags' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:bg-white/80'
              }`}
            >
              <Hash className="w-3.5 h-3.5 text-pink-500" />
              <span>标签 ({filteredTags.length})</span>
            </button>
            <button
              onClick={() => {
                playPop(520);
                setActiveTab('notes');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'notes' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:bg-white/80'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>笔记 ({searchedNotes.length})</span>
            </button>
            <button
              onClick={() => {
                playPop(520);
                setActiveTab('commands');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'commands' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:bg-white/80'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>快捷指令 ({filteredCommands.length})</span>
            </button>
          </div>

          {/* Command List Body */}
          <Command.List className="overflow-y-auto p-4 flex-1 space-y-2 font-cute select-none min-h-[280px] max-h-[60vh]">
            {/* Dynamic Search Actions when user is typing */}
            {trimmedSearch && (
              <Command.Group heading={
                <div className="px-3 py-1.5 text-xs font-bubble font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{locale === 'zh' ? '✨ 智能快捷操作' : '✨ Quick Actions'}</span>
                </div>
              }>
                {/* Action 1: Create Note with Search Title */}
                <Command.Item
                  onSelect={() => {
                    playPop();
                    onCreateNote(search);
                    onClose();
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white hover:bg-pink-50 border border-neutral-200/80 hover:border-pink-300 text-neutral-800 text-sm cursor-pointer transition shadow-3xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-pink-100 text-pink-600 group-hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bubble font-bold text-neutral-900">
                        {locale === 'zh' ? `以 “${search}” 为标题新建笔记` : `Create note "${search}"`}
                      </span>
                      <span className="text-xs text-neutral-400 block -mt-0.5">
                        {locale === 'zh' ? '立即新建空白并以此作为笔记标题' : 'Create a fresh note with this title'}
                      </span>
                    </div>
                  </div>
                  <CornerDownLeft className="w-4 h-4 text-neutral-400 group-hover:text-rose-500 transition-colors" />
                </Command.Item>

                {/* Action 2: Filter Tag with Search */}
                <Command.Item
                  onSelect={() => {
                    playPop();
                    onFilterTag(`#${searchWithoutHash}`);
                    onClose();
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white hover:bg-pink-50 border border-neutral-200/80 hover:border-pink-300 text-neutral-800 text-sm cursor-pointer transition shadow-3xs group mt-1.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bubble font-bold text-neutral-900">
                        {locale === 'zh' ? `在笔记库中筛选 #${searchWithoutHash} 标签` : `Filter by #${searchWithoutHash}`}
                      </span>
                      <span className="text-xs text-neutral-400 block -mt-0.5">
                        {locale === 'zh' ? '在左侧边栏高亮定位该标签' : 'Locate this tag in sidebar'}
                      </span>
                    </div>
                  </div>
                  <CornerDownLeft className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 transition-colors" />
                </Command.Item>
              </Command.Group>
            )}

            {/* REAL-TIME DYNAMIC TAGS SECTION - ENLARGED COMFORTABLE SIZING */}
            {(activeTab === 'all' || activeTab === 'tags') && filteredTags.length > 0 && (
              <Command.Group heading={
                <div className="px-3 py-2 text-xs font-bubble font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-pink-500" />
                    <span>{locale === 'zh' ? '🏷️ 灵感标签分类 (实时动态聚合)' : 'Tags Mesh (Live Aggregated)'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">点击直接筛选</span>
                </div>
              }>
                <div className="flex flex-wrap gap-2 px-3 py-1 mb-3">
                  {filteredTags.map((tg) => (
                    <button
                      key={tg.tag}
                      onClick={() => {
                        playPop();
                        onFilterTag(tg.tag);
                        onClose();
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-pink-100 border border-neutral-200/80 hover:border-pink-300 text-neutral-800 hover:text-pink-700 text-xs sm:text-sm font-mono font-bold transition cursor-pointer shadow-3xs active:scale-95"
                    >
                      <Hash className="w-3.5 h-3.5 text-pink-500" />
                      <span>{tg.tag}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 font-bold">
                        {tg.count}
                      </span>
                    </button>
                  ))}
                </div>
              </Command.Group>
            )}

            {/* NOTES SECTION */}
            {(activeTab === 'all' || activeTab === 'notes') && searchedNotes.length > 0 && (
              <Command.Group heading={
                <div className="px-3 py-2 text-xs font-bubble font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>{locale === 'zh' ? '📑 匹配笔记清单' : 'Notes Found'}</span>
                </div>
              }>
                {searchedNotes.map((note) => (
                  <Command.Item
                    key={note.id}
                    onSelect={() => {
                      playPop();
                      onSelectNote(note);
                      onClose();
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white hover:bg-pink-50/70 text-neutral-800 text-sm cursor-pointer transition group border border-neutral-200/70 hover:border-pink-300 shadow-3xs mb-1.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bubble font-bold text-sm sm:text-base text-neutral-800 truncate group-hover:text-rose-600">
                          {note.excerpt || '空白笔记'}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {(note.tags || []).length > 0 ? note.tags.join(' ') : '无标签'} • {note.wordCount || 0} 字
                        </p>
                      </div>
                    </div>
                    {note.isPinned && (
                      <Pin className="w-4 h-4 text-amber-500 shrink-0 fill-amber-400" />
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* SYSTEM COMMANDS SECTION - NEVER DISAPPEARS */}
            {(activeTab === 'all' || activeTab === 'commands') && filteredCommands.length > 0 && (
              <Command.Group heading={
                <div className="px-3 py-2 text-xs font-bubble font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{locale === 'zh' ? '⚡ 快捷指令' : 'System Commands'}</span>
                </div>
              }>
                {filteredCommands.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    onSelect={() => {
                      playPop();
                      cmd.action();
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-800 text-sm cursor-pointer transition group border border-neutral-200/70 shadow-3xs mb-1.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700">
                        {cmd.icon}
                      </div>
                      <span className="font-bubble font-bold text-sm text-neutral-800 group-hover:text-rose-600">
                        {cmd.title}
                      </span>
                    </div>

                    {cmd.shortcut && (
                      <kbd className="px-2.5 py-1 rounded-xl bg-neutral-100 text-neutral-500 font-mono text-xs font-bold border border-neutral-200">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Bottom Footer Info */}
          <div className="px-5 py-3 border-t border-amber-900/10 bg-white/60 flex items-center justify-between text-xs font-cute text-neutral-400 select-none shrink-0">
            <div className="flex items-center gap-3">
              <span>↑↓ 选择</span>
              <span>•</span>
              <span>↵ 确认</span>
              <span>•</span>
              <span>ESC 关闭</span>
            </div>
            <div className="font-bubble font-bold text-pink-600">
              {locale === 'zh' ? '✨ 极速灵感枢纽' : '✨ Command Hub'}
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
};
