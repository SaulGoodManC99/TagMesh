import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Layers, 
  Search, 
  Pin, 
  Plus, 
  PanelLeftClose,
  Trash2,
  BookOpen,
  CheckSquare,
  Check,
  X,
  RotateCcw,
  Flame,
  LayoutList,
  Grid,
} from 'lucide-react';
import { Note } from '../types/note';
import { db, getAllTagCounts, searchNotesLocal, getActiveNotes, createNewNote } from '../db/dexie';
import { deleteNoteRemote, syncNoteRemote } from '../services/api';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { playPop, playChime, playSoftTick } from '../blog/utils/soundEffects';
import { triggerConfettiShower } from '../blog/utils/confetti';
import { ClayDeleteModal } from './ClayDeleteModal';
import { ClayBatchDeleteModal } from './ClayBatchDeleteModal';
import { useClayTheme } from '../blog/utils/clayThemes';

export interface TagMeshSidebarProps {
  isOpen: boolean;
  activeNote: Note | null;
  selectedTag: string;
  onToggleSidebar: () => void;
  onSelectTag: (tag: string) => void;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onDeleteNoteById: (noteId: string) => void;
}

function formatShortDate(timestamp: number, locale: string): string {
  try {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const pad = (n: number) => String(n).padStart(2, '0');
    if (isToday) {
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (d.getFullYear() === now.getFullYear()) {
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    }
    return `${d.getFullYear().toString().slice(2)}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  } catch {
    return '';
  }
}

export const TagMeshSidebar: React.FC<TagMeshSidebarProps> = ({
  isOpen,
  activeNote,
  selectedTag,
  onToggleSidebar,
  onSelectTag,
  onSelectNote,
  onNewNote,
  onDeleteNoteById,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin } = useAuth();
  
  // Top-level mode: 'create' (创作模式) | 'manage' (回收管理)
  const [sidebarMode, setSidebarMode] = useState<'create' | 'manage'>('create');
  // Sub-tab inside manage mode: 'batch' (批量整理) | 'trash' (废纸篓)
  const [manageSubTab, setManageSubTab] = useState<'batch' | 'trash'>('batch');

  const isBatchMode = sidebarMode === 'manage' && manageSubTab === 'batch';
  const sidebarTab = sidebarMode === 'manage' && manageSubTab === 'trash' ? 'trash' : 'notes';

  const [searchQuery, setSearchQuery] = useState('');
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  // View mode: 'compact' (紧凑高密度单行) | 'comfortable' (舒缓轻量卡片)
  const [viewMode, setViewMode] = useState<'compact' | 'comfortable'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('tagmesh_sidebar_view_mode') as 'compact' | 'comfortable') || 'compact';
    }
    return 'compact';
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // Drag-resizable sidebar width with persistent storage (default 500px, min 320px, max 850px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tagmesh_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= 850) {
          return parsed;
        }
      }
    }
    return 500;
  });

  const isResizingRef = React.useRef(false);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(e.clientX, 320), 850);
      setSidebarWidth(newWidth);
      try {
        localStorage.setItem('tagmesh_sidebar_width', String(newWidth));
      } catch {}
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleToggleViewMode = (mode: 'compact' | 'comfortable') => {
    playSoftTick();
    setViewMode(mode);
    try {
      localStorage.setItem('tagmesh_sidebar_view_mode', mode);
    } catch {}
  };

  // Visibility filter: 'all' | 'public' | 'private'
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');

  // Reactive live query for all active notes (visibility-aware)
  const allActiveNotes = useLiveQuery(
    () => getActiveNotes(visibilityFilter),
    [visibilityFilter]
  ) || [];

  // Reactive live query for all trash / deleted notes
  const deletedNotes = useLiveQuery(
    () => db.notes.filter(n => Boolean(n.isDeleted)).reverse().toArray(),
    []
  ) || [];

  // Reactive live query for aggregated tags (visibility-aware)
  const tags = useLiveQuery(
    () => getAllTagCounts(visibilityFilter),
    [visibilityFilter]
  ) || [];

  // Reactive live query for filtered notes under selected tag, search query and visibility
  const filteredNotes = useLiveQuery(
    () => searchNotesLocal(searchQuery, selectedTag, visibilityFilter),
    [searchQuery, selectedTag, visibilityFilter]
  ) || [];

  const totalCount = allActiveNotes.length;
  const deletedCount = deletedNotes.length;

  // Toggle selection for a single note in batch mode
  const handleToggleNoteSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSoftTick();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle pin on a specific note
  const handleTogglePinById = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    playSoftTick();
    const newPin = !note.isPinned;
    const now = Date.now();
    const updatedNote: Note = {
      ...note,
      isPinned: newPin,
      isDirty: true,
      updatedAt: now,
    };
    await db.notes.put(updatedNote);
    if (activeNote?.id === note.id) {
      onSelectNote(updatedNote);
    }
    syncNoteRemote(updatedNote);
  };

  // Select all currently visible filtered notes
  const handleSelectAllVisible = () => {
    playPop();
    const visibleIds = filteredNotes.map(n => n.id);
    setSelectedIds(new Set(visibleIds));
  };

  // Deselect all
  const handleDeselectAll = () => {
    playPop();
    setSelectedIds(new Set());
  };

  // Execute batch deletion
  const handleConfirmBatchDelete = async (mode: 'soft' | 'permanent') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (mode === 'soft') {
      await db.transaction('rw', db.notes, async () => {
        for (const id of ids) {
          await db.notes.update(id, { isDeleted: true, isDirty: true, updatedAt: Date.now() });
        }
      });
    } else {
      await db.notes.bulkDelete(ids);
    }

    // Sync remote deletion to Cloudflare D1
    ids.forEach(id => deleteNoteRemote(id));

    // If active note was in the deleted list, switch to next available active note
    if (activeNote && ids.includes(activeNote.id)) {
      const remaining = await getActiveNotes('all');
      if (remaining.length > 0) {
        onSelectNote(remaining[0]);
      } else {
        const next = await createNewNote('', [], {
          isPublic: true,
        });
        onSelectNote(next);
      }
    }

    setSelectedIds(new Set());
    setIsBatchDeleteModalOpen(false);
    setSidebarMode('create');
    playChime();
    triggerConfettiShower();
  };

  // Restore a single deleted note from trash
  const handleRestoreNote = async (note: Note) => {
    playChime();
    triggerConfettiShower();
    await db.notes.update(note.id, { isDeleted: false, isDirty: true, updatedAt: Date.now() });
    onSelectNote({ ...note, isDeleted: false });
  };

  // Permanently delete a single note from trash
  const handlePermanentlyDeleteNote = async (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playPop();
    await db.notes.delete(noteId);
    deleteNoteRemote(noteId);
  };

  // Restore ALL notes from trash
  const handleRestoreAllTrash = async () => {
    if (deletedNotes.length === 0) return;
    playChime();
    await db.transaction('rw', db.notes, async () => {
      for (const n of deletedNotes) {
        await db.notes.update(n.id, { isDeleted: false, isDirty: true, updatedAt: Date.now() });
      }
    });
    setSidebarMode('create');
  };

  // Permanently empty entire trash can
  const handleEmptyTrash = async () => {
    if (deletedNotes.length === 0) return;
    playPop();
    const ids = deletedNotes.map(n => n.id);
    await db.notes.bulkDelete(ids);
    ids.forEach(id => deleteNoteRemote(id));
  };

  const selectedNotesList = useMemo(() => {
    return filteredNotes.filter(n => selectedIds.has(n.id));
  }, [filteredNotes, selectedIds]);

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden modal-backdrop-enter"
          onClick={onToggleSidebar}
        />
      )}

      <aside
        style={{ 
          backgroundColor: `${theme.headerBg}f0`,
          width: isOpen ? (typeof window !== 'undefined' && window.innerWidth >= 768 ? `${sidebarWidth}px` : undefined) : '0px'
        }}
        className={`fixed md:relative top-0 bottom-0 left-0 h-full rounded-[28px] sm:rounded-[32px] border border-white/70 dark:border-white/15 backdrop-blur-2xl flex select-none transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] shrink-0 z-40 md:z-20 shadow-xl md:shadow-md overflow-hidden ${
          isOpen ? 'w-[92vw] max-w-[440px] md:max-w-none md:w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full md:translate-x-0 border-r-0 pointer-events-none'
        }`}
      >
        <div 
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${sidebarWidth}px` : undefined }}
          className="w-[92vw] max-w-[440px] md:max-w-none md:w-full min-w-[290px] h-full flex flex-col relative"
        >
          {/* Horizontal Drag Resize Handle (Desktop Only) */}
          <div
            onMouseDown={startResizing}
            onDoubleClick={() => {
              setSidebarWidth(500);
              try { localStorage.setItem('tagmesh_sidebar_width', '500'); } catch {}
            }}
            className="hidden md:block absolute top-0 right-0 bottom-0 w-2.5 cursor-col-resize hover:bg-rose-500/30 active:bg-rose-500 transition-colors z-50 group"
            title={locale === 'zh' ? '左右拖拽调节侧边栏宽度 (双击恢复 500px 默认)' : 'Drag to resize sidebar (Double click to reset)'}
          >
            <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-600 group-hover:bg-rose-500 absolute top-1/2 right-1 -translate-y-1/2 rounded-full transition-colors" />
          </div>
          
          {/* ==================== 1. DUAL DEDICATED SIDEBAR HEADERS ==================== */}
          <div 
            style={{ backgroundColor: `${theme.headerBg}cc` }}
            className="h-14 border-b border-white/60 dark:border-white/10 px-3.5 sm:px-4 flex items-center justify-between shrink-0 backdrop-blur-xl gap-2 select-none"
          >
            {sidebarMode === 'create' ? (
              /* SIDEBAR 1: ✍️ 灵感创作库 HEADER */
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs text-white shrink-0 bg-gradient-to-tr ${theme.primaryGradient}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bubble font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {locale === 'zh' ? '灵感创作库' : 'My Notes'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500/10 dark:bg-white/10 text-rose-600 dark:text-rose-300 text-[11px] font-mono font-bold border border-rose-500/20 dark:border-white/10">
                      {totalCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Switch to Management Sidebar Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop(580);
                      setSidebarMode('manage');
                    }}
                    className="h-8 flex items-center gap-1 px-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 font-bubble text-xs font-bold transition cursor-pointer active:scale-95 border border-white/40 dark:border-white/10 relative"
                    title={locale === 'zh' ? '切换至回收管理侧边栏' : 'Switch to Recycle & Management Sidebar'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span className="hidden sm:inline">{locale === 'zh' ? '回收管理' : 'Management'}</span>
                    {deletedCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold leading-none">
                        {deletedCount}
                      </span>
                    )}
                  </button>

                  {/* Primary New Note Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop();
                      onNewNote();
                    }}
                    className={`h-8 flex items-center gap-1 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer active:scale-95 shrink-0 border border-white/20`}
                    title={locale === 'zh' ? '新建笔记 (Alt+N)' : 'New Note (Alt+N)'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '新建' : 'New'}</span>
                  </button>

                  {/* Collapse Sidebar */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop();
                      onToggleSidebar();
                    }}
                    className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer shrink-0 border border-transparent hover:border-white/40 dark:hover:border-white/10"
                    title={locale === 'zh' ? '收起侧边栏 (Alt+S)' : 'Collapse Sidebar (Alt+S)'}
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* SIDEBAR 2: 🗑️ 空间回收管理 HEADER */
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs text-white shrink-0 bg-neutral-800 dark:bg-neutral-700">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bubble font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {locale === 'zh' ? '空间回收管理' : 'Recycle Hub'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Switch Back to Creation Sidebar Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop(560);
                      setSidebarMode('create');
                      setSelectedIds(new Set());
                    }}
                    className={`h-8 flex items-center gap-1.5 px-3 rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer active:scale-95 border border-white/20`}
                    title={locale === 'zh' ? '返回灵感创作库' : 'Return to Notes'}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '返回创作' : 'Back to Notes'}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold leading-none">
                      {totalCount}
                    </span>
                  </button>

                  {/* Collapse Sidebar */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop();
                      onToggleSidebar();
                    }}
                    className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer shrink-0 border border-transparent hover:border-white/40 dark:hover:border-white/10"
                    title={locale === 'zh' ? '收起侧边栏 (Alt+S)' : 'Collapse Sidebar (Alt+S)'}
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ==================== 1.5 MANAGEMENT SUB-TAB SWITCHER ==================== */}
          {sidebarMode === 'manage' && (
            <div className="px-3.5 py-2 bg-white/40 dark:bg-white/5 border-b border-white/60 dark:border-white/10 flex items-center justify-between gap-2 select-none animate-in fade-in">
              <div className="w-full grid grid-cols-2 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-md gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playPop(550);
                    setManageSubTab('batch');
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bubble font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    manageSubTab === 'batch'
                      ? 'bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{locale === 'zh' ? '批量整理' : 'Batch Select'}</span>
                  <span className="text-[10px] opacity-70 font-mono">({totalCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPop(550);
                    setManageSubTab('trash');
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bubble font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    manageSubTab === 'trash'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{locale === 'zh' ? '废纸篓' : 'Trash'}</span>
                  <span className={`text-[10px] font-mono font-bold ${deletedCount > 0 ? 'text-rose-500' : 'opacity-70'}`}>({deletedCount})</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================== 2. UNIFIED SEARCH & TAGS STRIP (Creation & Batch Mode) ==================== */}
          {(sidebarMode === 'create' || (sidebarMode === 'manage' && manageSubTab === 'batch')) && (
            <div className="px-3 py-2.5 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md space-y-2">
              {/* Universal Real-time Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'zh' ? '快速搜索笔记、内容或标签...' : 'Search notes or tags...'}
                  className="w-full pl-8 pr-7 py-1.5 bg-white/90 dark:bg-neutral-800/90 border border-white/80 dark:border-white/10 text-neutral-800 dark:text-neutral-100 rounded-xl text-xs font-cute focus:outline-none focus:border-rose-400 dark:focus:border-rose-500 transition shadow-3xs placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300 flex items-center justify-center text-[10px] hover:bg-rose-500 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Horizontal Tag Pills (Single Clean Row) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
                {/* #all Pill */}
                <button
                  type="button"
                  onClick={() => {
                    playPop(550);
                    onSelectTag('#all');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition cursor-pointer border shrink-0 ${
                    selectedTag === '#all'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                      : 'bg-white/80 dark:bg-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-white hover:dark:bg-white/20 border-white/60 dark:border-white/10 shadow-3xs'
                  }`}
                >
                  <span>#all</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedTag === '#all' ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
                  }`}>
                    {totalCount}
                  </span>
                </button>

                {/* Tag Pills */}
                {tags.map((tItem) => {
                  const isSelected = selectedTag.toLowerCase() === tItem.tag.toLowerCase();
                  return (
                    <button
                      key={tItem.tag}
                      type="button"
                      onClick={() => {
                        playPop(600);
                        onSelectTag(tItem.tag);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition cursor-pointer border shrink-0 ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                          : 'bg-white/80 dark:bg-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-white hover:dark:bg-white/20 border-white/60 dark:border-white/10 shadow-3xs'
                      }`}
                    >
                      <span>{tItem.tag}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
                      }`}>
                        {tItem.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 3. BATCH OPERATIONS ACTION STRIP ==================== */}
          {sidebarMode === 'manage' && manageSubTab === 'batch' && (
            <div className="px-3.5 py-2.5 bg-rose-500/5 dark:bg-rose-500/10 border-b border-white/60 dark:border-white/10 flex flex-col gap-2 select-none animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bubble">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="h-7 px-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-50 dark:hover:bg-rose-950 transition shadow-3xs cursor-pointer active:scale-95 flex items-center gap-1 text-[11px]"
                  >
                    <span>☑️</span>
                    <span>{locale === 'zh' ? `全选 (${filteredNotes.length})` : `All (${filteredNotes.length})`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="h-7 px-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-white/10 transition shadow-3xs cursor-pointer active:scale-95 flex items-center gap-1 text-[11px]"
                  >
                    <span>⬜</span>
                    <span>{locale === 'zh' ? '清空' : 'Clear'}</span>
                  </button>
                </div>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-xs">
                  已选 {selectedIds.size} / {filteredNotes.length}
                </span>
              </div>

              {/* Batch Delete Trigger Button */}
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => {
                  playPop();
                  setIsBatchDeleteModalOpen(true);
                }}
                className="w-full h-8 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bubble font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {locale === 'zh' ? `立即批量删除 (${selectedIds.size}) 篇笔记` : `Delete Selected (${selectedIds.size}) Notes`}
                </span>
              </button>
            </div>
          )}

          {/* ==================== 4. TRASH TOP ACTION STRIP ==================== */}
          {sidebarMode === 'manage' && manageSubTab === 'trash' && (
            <div className="px-3.5 py-2.5 bg-white/40 dark:bg-white/5 border-b border-white/60 dark:border-white/10 flex items-center justify-between text-xs font-bubble select-none">
              <span className="text-neutral-700 dark:text-neutral-300 font-bold">
                {deletedCount === 0 ? (locale === 'zh' ? '废纸篓空空如也 🍃' : 'Trash is empty 🍃') : `共 ${deletedCount} 篇已删笔记`}
              </span>
              {deletedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRestoreAllTrash}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95 text-xs"
                    title="Restore All Notes"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-500" />
                    <span>{locale === 'zh' ? '全部恢复' : 'Restore All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold hover:shadow-xs transition shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95 text-xs"
                    title="Empty Trash Permanently"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{locale === 'zh' ? '彻底清空' : 'Empty'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. Refined Notes Stream (Compact List vs Comfortable Card) */}
          <div className={`flex-1 overflow-y-auto select-none ${viewMode === 'compact' ? 'p-2 space-y-1' : 'p-3 space-y-2.5'}`}>
            {sidebarTab === 'notes' ? (
              <>
                <div className="px-2 py-1 flex items-center justify-between gap-2 flex-wrap">
                  {/* Visibility Filter Switcher [ 全部 | 🌐 公开 | 🔒 私密 ] */}
                  <div className="flex items-center p-0.5 rounded-xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => { playSoftTick(); setVisibilityFilter('all'); }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bubble font-bold transition cursor-pointer ${
                        visibilityFilter === 'all'
                          ? 'bg-white/90 dark:bg-white/20 text-neutral-900 dark:text-white shadow-3xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {locale === 'zh' ? '全部' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { playSoftTick(); setVisibilityFilter('public'); }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bubble font-bold transition cursor-pointer flex items-center gap-1 ${
                        visibilityFilter === 'public'
                          ? 'bg-sky-500 text-white shadow-3xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      <span>🌐</span>
                      <span className="text-[11px]">{locale === 'zh' ? '公开' : 'Public'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { playSoftTick(); setVisibilityFilter('private'); }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bubble font-bold transition cursor-pointer flex items-center gap-1 ${
                        visibilityFilter === 'private'
                          ? 'bg-neutral-800 dark:bg-neutral-700 text-white shadow-3xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      <span>🔒</span>
                      <span className="text-[11px]">{locale === 'zh' ? '私密' : 'Private'}</span>
                    </button>
                  </div>

                  {/* View Mode Toggle Switcher [ ☰ 紧凑 | 🗂️ 舒缓 ] */}
                  <div className="flex items-center p-0.5 rounded-xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleViewMode('compact')}
                      className={`px-1.5 py-0.5 rounded-lg text-xs font-bubble font-bold flex items-center gap-1 transition cursor-pointer ${
                        viewMode === 'compact'
                          ? 'bg-white/90 dark:bg-white/20 text-neutral-900 dark:text-white shadow-3xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                      title={locale === 'zh' ? '紧凑列表视图 (单行高密度)' : 'Compact List View'}
                    >
                      <LayoutList className="w-3 h-3" />
                      <span className="text-[10px] hidden sm:inline">{locale === 'zh' ? '紧凑' : 'Compact'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleViewMode('comfortable')}
                      className={`px-1.5 py-0.5 rounded-lg text-xs font-bubble font-bold flex items-center gap-1 transition cursor-pointer ${
                        viewMode === 'comfortable'
                          ? 'bg-white/90 dark:bg-white/20 text-neutral-900 dark:text-white shadow-3xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                      title={locale === 'zh' ? '舒缓卡片视图 (带纯净摘要)' : 'Comfortable Card View'}
                    >
                      <Grid className="w-3 h-3" />
                      <span className="text-[10px] hidden sm:inline">{locale === 'zh' ? '舒缓' : 'Card'}</span>
                    </button>
                  </div>
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 font-cute flex flex-col items-center gap-2">
                    <span className="text-3xl">📝</span>
                    <p className="text-xs font-bold">{locale === 'zh' ? '暂无匹配的灵感笔记' : 'No matching notes found'}</p>
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-1 px-3 py-1 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white text-xs font-bubble font-bold text-rose-600 dark:text-rose-400 border border-white/60 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95 transition"
                      >
                        {locale === 'zh' ? '清除搜索词' : 'Clear search'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          playPop();
                          onNewNote();
                        }}
                        className={`mt-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white text-xs font-bubble font-bold shadow-xs hover:shadow-md cursor-pointer active:scale-95 transition`}
                      >
                        {locale === 'zh' ? '+ 立即创建第一篇' : '+ Create Note'}
                      </button>
                    )}
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const isActive = activeNote?.id === note.id;
                    const isChecked = selectedIds.has(note.id);
                    const noteTags = (note.tags || []).slice(0, 2);

                    if (viewMode === 'compact') {
                      /* ☰ Compact List Item (~44px) */
                      return (
                        <div
                          key={note.id}
                          onClick={(e) => {
                            if (isBatchMode) {
                              handleToggleNoteSelect(note.id, e);
                            } else {
                              playPop(520);
                              onSelectNote(note);
                            }
                          }}
                          className={`relative px-3 py-2 rounded-xl transition cursor-pointer group flex items-center justify-between gap-2.5 select-none border border-transparent ${
                            isChecked
                              ? 'bg-rose-100/80 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 font-medium backdrop-blur-md'
                              : isActive && !isBatchMode
                              ? 'bg-white/80 dark:bg-white/10 text-neutral-900 dark:text-white font-medium shadow-3xs border-white/60 dark:border-white/10 backdrop-blur-md'
                              : 'hover:bg-white/60 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:border-white/40 dark:hover:border-white/5'
                          }`}
                        >
                          {/* Left Accent Bar for Active Note */}
                          {isActive && !isBatchMode && (
                            <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-rose-500" />
                          )}

                          {/* Batch Checkbox */}
                          {isBatchMode && (
                            <div className="shrink-0">
                              <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                                isChecked
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-white/20 text-transparent hover:border-rose-400'
                              }`}>
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>
                          )}

                          {/* Note Title + Pin + Visibility icon */}
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {note.isPinned && !isBatchMode && (
                              <button
                                type="button"
                                onClick={(e) => handleTogglePinById(e, note)}
                                className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/80 transition cursor-pointer"
                                title={locale === 'zh' ? '点击取消置顶' : 'Click to unpin'}
                              >
                                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 hover:scale-110 active:scale-90 transition-transform" />
                              </button>
                            )}
                            {note.isPublic === false && (
                              <span className="text-neutral-500 dark:text-neutral-400 text-[11px] shrink-0" title={locale === 'zh' ? '仅自己可见 (私密)' : 'Private note'}>
                                🔒
                              </span>
                            )}
                            <span className={`font-bubble text-[13.5px] truncate ${
                              isActive && !isBatchMode 
                                ? 'font-extrabold text-neutral-900 dark:text-white' 
                                : 'font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-rose-600 dark:group-hover:text-rose-400'
                            }`}>
                              {note.excerpt || (locale === 'zh' ? '空白笔记' : 'Untitled note')}
                            </span>
                          </div>

                          {/* Right side: Micro Tag + Short Date + Pin/Delete */}
                          <div className="flex items-center gap-1.5 shrink-0 text-xs font-cute text-neutral-400 dark:text-neutral-500">
                            {noteTags[0] && (
                              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 text-[10px] font-mono font-semibold truncate max-w-[80px]">
                                {noteTags[0]}
                              </span>
                            )}

                            {/* Pin button on hover if not pinned */}
                            {!isBatchMode && !note.isPinned && (
                              <button
                                type="button"
                                onClick={(e) => handleTogglePinById(e, note)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-950/80 hover:text-amber-600 dark:hover:text-amber-300 transition text-neutral-400"
                                title={locale === 'zh' ? '置顶笔记' : 'Pin Note'}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                              {formatShortDate(note.createdAt || Date.now(), locale)}
                            </span>

                            {/* Delete button */}
                            {!isBatchMode && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingNote(note);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/80 hover:text-rose-600 dark:hover:text-rose-300 transition text-neutral-400 -mr-1"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      /* 🗂️ Comfortable Card View (~76px) */
                      return (
                        <div
                          key={note.id}
                          onClick={(e) => {
                            if (isBatchMode) {
                              handleToggleNoteSelect(note.id, e);
                            } else {
                              playPop(520);
                              onSelectNote(note);
                            }
                          }}
                          className={`p-3 rounded-2xl border transition cursor-pointer group flex flex-col justify-between relative select-none backdrop-blur-xl ${
                            isChecked
                              ? 'bg-rose-50/80 dark:bg-rose-950/70 border-rose-400 shadow-sm ring-2 ring-rose-400/30'
                              : isActive && !isBatchMode
                              ? 'bg-white/85 dark:bg-[#18181B]/85 backdrop-blur-2xl border-rose-400 dark:border-rose-500/60 shadow-md ring-2 ring-rose-400/25'
                              : 'bg-white/60 dark:bg-[#18181B]/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-[#18181B]/80 border-white/60 dark:border-white/10 hover:border-rose-300/80 hover:shadow-xs'
                          }`}
                        >
                          {/* Left Accent Bar for Active Card */}
                          {isActive && !isBatchMode && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-rose-500" />
                          )}

                          {/* Line 1: Title + Pin + Visibility + Time */}
                          <div className={`flex items-start justify-between gap-2 mb-1 ${isBatchMode ? 'pr-7' : ''} ${isActive && !isBatchMode ? 'pl-1.5' : ''}`}>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {note.isPinned && !isBatchMode && (
                                <button
                                  type="button"
                                  onClick={(e) => handleTogglePinById(e, note)}
                                  className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/80 transition cursor-pointer"
                                  title={locale === 'zh' ? '点击取消置顶' : 'Click to unpin'}
                                >
                                  <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 hover:scale-110 active:scale-90 transition-transform" />
                                </button>
                              )}
                              {note.isPublic === false && (
                                <span className="text-neutral-500 dark:text-neutral-400 text-xs shrink-0" title={locale === 'zh' ? '仅自己可见 (私密)' : 'Private'}>
                                  🔒
                                </span>
                              )}
                              <h4 className={`font-bubble text-sm font-bold truncate leading-snug ${
                                isChecked
                                  ? 'text-rose-800 dark:text-rose-200'
                                  : isActive && !isBatchMode
                                  ? 'text-rose-700 dark:text-rose-300 font-extrabold'
                                  : 'text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400'
                              }`}>
                                {note.excerpt || (locale === 'zh' ? '空白笔记' : 'Untitled note')}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isBatchMode && !note.isPinned && (
                                <button
                                  type="button"
                                  onClick={(e) => handleTogglePinById(e, note)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/80 text-neutral-400 hover:text-amber-600 transition cursor-pointer"
                                  title={locale === 'zh' ? '置顶笔记' : 'Pin Note'}
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
                                {formatShortDate(note.createdAt || Date.now(), locale)}
                              </span>
                            </div>
                          </div>

                          {/* Line 2: Single-line Clean Plain Text Preview */}
                          <p className={`font-cute text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mb-1.5 ${isActive && !isBatchMode ? 'pl-1.5' : ''}`}>
                            {(note.rawMarkdown || '').replace(/^[#>*`\-\d.]+\s*/gm, '').substring(0, 70) || (locale === 'zh' ? '暂无内容...' : 'No content...')}
                          </p>

                          {/* Line 3: Micro Tags & Words */}
                          <div className={`flex items-center justify-between text-[11px] font-cute text-neutral-400 dark:text-neutral-500 ${isActive && !isBatchMode ? 'pl-1.5' : ''}`}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {noteTags.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.2 rounded-md bg-rose-50/80 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold border border-rose-200/50 dark:border-rose-900/60"
                                >
                                  {t}
                                </span>
                              ))}
                              <span>{note.wordCount || 0} 字</span>
                              {note.isPublic === false && (
                                <span className="px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-bubble font-bold border border-neutral-200 dark:border-neutral-700">
                                  🔒 仅自己可见
                                </span>
                              )}
                            </div>

                            {/* Delete Action */}
                            {!isBatchMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingNote(note);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer text-neutral-400"
                                title="Delete Note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  })
                )}
              </>
            ) : (
              /* Trash Can Deleted Notes List */
              <>
                {deletedNotes.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 font-cute flex flex-col items-center gap-2">
                    <span className="text-3xl">🍃</span>
                    <p className="text-xs font-bold">{locale === 'zh' ? '废纸篓是空的' : 'Recycle Bin is Empty'}</p>
                  </div>
                ) : (
                  deletedNotes.map((note) => {
                    const formattedDate = formatShortDate(note.updatedAt || Date.now(), locale);

                    if (viewMode === 'compact') {
                      return (
                        <div
                          key={note.id}
                          onClick={() => onSelectNote(note)}
                          className="px-3 py-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 transition cursor-pointer flex items-center justify-between gap-2 text-xs select-none shadow-3xs group"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-neutral-400">🗑️</span>
                            <span className="font-bubble font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400">
                              {note.excerpt || (locale === 'zh' ? '已删笔记' : 'Deleted Note')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-neutral-400">{formattedDate}</span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                playChime();
                                await db.notes.update(note.id, { isDeleted: false, isDirty: true, updatedAt: Date.now() });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 transition"
                              title={locale === 'zh' ? '恢复笔记' : 'Restore'}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                playPop(400);
                                await db.notes.delete(note.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition"
                              title={locale === 'zh' ? '永久粉碎' : 'Purge'}
                            >
                              <Flame className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={note.id}
                        onClick={() => onSelectNote(note)}
                        className="p-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 transition cursor-pointer flex flex-col justify-between gap-1.5 shadow-3xs group backdrop-blur-md"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">🗑️</span>
                            <h4 className="font-bubble text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400">
                              {note.excerpt || (locale === 'zh' ? '已删笔记' : 'Deleted Note')}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400 shrink-0">{formattedDate}</span>
                        </div>
                        <p className="font-cute text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {(note.rawMarkdown || '').replace(/^[#>*`\-\d.]+\s*/gm, '').substring(0, 60) || (locale === 'zh' ? '暂无内容...' : 'No content...')}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              playChime();
                              await db.notes.update(note.id, { isDeleted: false, isDirty: true, updatedAt: Date.now() });
                            }}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bubble text-[11px] font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{locale === 'zh' ? '恢复' : 'Restore'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              playPop(400);
                              await db.notes.delete(note.id);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bubble text-[11px] font-bold hover:bg-rose-100 transition flex items-center gap-1"
                          >
                            <Flame className="w-3 h-3" />
                            <span>{locale === 'zh' ? '粉碎' : 'Purge'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Single Note Delete Confirmation Modal */}
      <ClayDeleteModal
        isOpen={!!deletingNote}
        noteTitle={deletingNote?.excerpt || ''}
        onConfirm={() => {
          if (deletingNote) {
            onDeleteNoteById(deletingNote.id);
            setDeletingNote(null);
          }
        }}
        onClose={() => setDeletingNote(null)}
      />

      {/* Batch Notes Delete Confirmation Modal */}
      <ClayBatchDeleteModal
        isOpen={isBatchDeleteModalOpen}
        selectedNotes={selectedNotesList}
        onConfirm={handleConfirmBatchDelete}
        onClose={() => setIsBatchDeleteModalOpen(false)}
      />
    </>
  );
};
