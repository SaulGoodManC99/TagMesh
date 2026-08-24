import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Hash, 
  Layers, 
  Search, 
  Pin, 
  Plus, 
  PanelLeftClose,
  Trash2,
  BookOpen,
  Calendar,
  CheckSquare,
  Square,
  ShieldAlert,
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  List,
  LayoutList,
  Grid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Note, TagCount } from '../types/note';
import { db, getAllTagCounts, searchNotesLocal, getOrCreateActiveNote, getActiveNotes, createNewNote } from '../db/dexie';
import { deleteNoteRemote } from '../services/api';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { playPop, playChime, playSoftTick } from '../blog/utils/soundEffects';
import { triggerConfettiShower } from '../blog/utils/confetti';
import { ClayDeleteModal } from './ClayDeleteModal';
import { ClayBatchDeleteModal } from './ClayBatchDeleteModal';
import { format24HourDateTime } from '../blog/utils/dateFormatter';
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
  const { isAdmin, openAuthModal } = useAuth();
  const [sidebarTab, setSidebarTab] = useState<'notes' | 'trash'>('notes');
  const [tagSearch, setTagSearch] = useState('');
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  // View mode: 'compact' (紧凑高密度单行/双行) | 'comfortable' (舒缓轻量卡片)
  const [viewMode, setViewMode] = useState<'compact' | 'comfortable'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('tagmesh_sidebar_view_mode') as 'compact' | 'comfortable') || 'compact';
    }
    return 'compact';
  });

  // Expandable Tag Cloud Drawer state
  const [isTagDrawerOpen, setIsTagDrawerOpen] = useState(false);

  // Batch Management Mode (Admin Only)
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  const handleToggleViewMode = (mode: 'compact' | 'comfortable') => {
    playSoftTick();
    setViewMode(mode);
    try {
      localStorage.setItem('tagmesh_sidebar_view_mode', mode);
    } catch {}
  };

  // Reactive live query for all active notes (role-aware)
  const allActiveNotes = useLiveQuery(
    () => getActiveNotes(isAdmin ? undefined : 'guest'),
    [isAdmin]
  ) || [];

  // Reactive live query for all trash / deleted notes
  const deletedNotes = useLiveQuery(
    () => db.notes.filter(n => Boolean(n.isDeleted)).reverse().toArray(),
    []
  ) || [];

  // Reactive live query for aggregated tags (isolated by role)
  const tags = useLiveQuery(
    () => getAllTagCounts(isAdmin ? undefined : 'guest'),
    [isAdmin]
  ) || [];

  // Reactive live query for filtered notes under selected tag
  const filteredNotes = useLiveQuery(
    () => searchNotesLocal('', selectedTag, isAdmin ? undefined : 'guest'),
    [selectedTag, isAdmin]
  ) || [];

  const totalCount = allActiveNotes.length;
  const deletedCount = deletedNotes.length;

  const filteredTags = useMemo(() => {
    const list = (tags || []).filter(tItem =>
      tItem && typeof tItem.tag === 'string' && tItem.tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
    return list.sort((a, b) => a.tag.localeCompare(b.tag, 'zh-CN', { numeric: true, sensitivity: 'base' }));
  }, [tags, tagSearch]);

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

  // Execute batch deletion (guaranteed 100% atomic on all selected IDs)
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
      const remaining = await getActiveNotes(isAdmin ? undefined : 'guest');
      if (remaining.length > 0) {
        onSelectNote(remaining[0]);
      } else {
        const next = await createNewNote('', [], {
          author: isAdmin ? 'admin' : 'guest',
          isOfficial: Boolean(isAdmin)
        });
        onSelectNote(next);
      }
    }

    setSelectedIds(new Set());
    setIsBatchDeleteModalOpen(false);
    setIsBatchMode(false);
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
    setSidebarTab('notes');
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
        style={{ backgroundColor: `${theme.headerBg}e6` }}
        className={`fixed md:relative top-0 bottom-0 left-0 h-full border-r border-white/60 dark:border-white/10 backdrop-blur-2xl flex select-none transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] shrink-0 z-40 md:z-20 shadow-2xl md:shadow-sm overflow-hidden ${
          isOpen ? 'w-[85vw] max-w-[380px] md:w-84 lg:w-96 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full md:translate-x-0 border-r-0 pointer-events-none'
        }`}
      >
        <div className="w-[85vw] max-w-[380px] md:w-84 lg:w-96 min-w-[290px] md:min-w-[336px] lg:min-w-[384px] h-full flex flex-col">
          {/* 1. Sidebar Top Header */}
          <div 
            style={{ backgroundColor: `${theme.headerBg}cc` }}
            className="h-15 border-b border-white/60 dark:border-white/10 px-3.5 sm:px-4 flex items-center justify-between shrink-0 backdrop-blur-xl gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-md text-white shrink-0 ${
                sidebarTab === 'trash'
                  ? 'bg-neutral-700 dark:bg-neutral-800'
                  : 'bg-rose-500'
              }`}>
                {sidebarTab === 'trash' ? <Trash2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bubble font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 block truncate">
                  {sidebarTab === 'trash'
                    ? (locale === 'zh' ? '🗑 废纸篓' : 'Recycle Bin')
                    : isBatchMode
                    ? (locale === 'zh' ? '👑 批量管理' : 'Batch Manage')
                    : (locale === 'zh' ? '灵感笔记库' : 'My Notes')}
                </span>
                <span className="text-[11px] font-cute text-neutral-400 dark:text-neutral-500 -mt-0.5 block truncate">
                  {sidebarTab === 'trash'
                    ? (locale === 'zh' ? `共 ${deletedCount} 篇已删笔记` : `${deletedCount} in trash`)
                    : isBatchMode 
                    ? (locale === 'zh' ? `已勾选 ${selectedIds.size} 篇` : `${selectedIds.size} selected`)
                    : `${totalCount} ${locale === 'zh' ? '篇笔记' : 'notes'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Admin Batch Mode Toggle Button (Only in notes view) */}
              {isAdmin && sidebarTab === 'notes' && (
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setIsBatchMode(prev => !prev);
                    if (isBatchMode) {
                      setSelectedIds(new Set());
                    }
                  }}
                  className={`h-7.5 px-2.5 rounded-xl font-bubble font-bold text-xs border transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    isBatchMode
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-200 border-white/60 dark:border-white/10 shadow-3xs backdrop-blur-md'
                  }`}
                  title={locale === 'zh' ? '切换批量管理' : 'Toggle Batch Mode'}
                >
                  {isBatchMode ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5 text-rose-500" />}
                  <span>{isBatchMode ? (locale === 'zh' ? '完成' : 'Done') : (locale === 'zh' ? '批量' : 'Batch')}</span>
                </button>
              )}

              {/* New Note Button (Only in notes view) */}
              {!isBatchMode && sidebarTab === 'notes' && (
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    onNewNote();
                  }}
                  className="h-7.5 flex items-center gap-1 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bubble text-xs font-bold shadow-sm hover:shadow-md transition cursor-pointer active:scale-95 shrink-0 border border-rose-400/80 dark:border-rose-500/50"
                  title={locale === 'zh' ? '新建笔记 (Alt+N)' : 'New Note (Alt+N)'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{locale === 'zh' ? '新建' : 'New'}</span>
                </button>
              )}

              {/* Collapse Sidebar Button */}
              <button
                type="button"
                onClick={() => {
                  playPop();
                  onToggleSidebar();
                }}
                className="h-7.5 w-7.5 rounded-xl flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer shrink-0 border border-transparent hover:border-white/40 dark:hover:border-white/10"
                title={locale === 'zh' ? '收起侧边栏 (Alt+S)' : 'Collapse Sidebar (Alt+S)'}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Sub Header: [全部笔记] vs [🗑️ 废纸篓] Tabs */}
          {!isBatchMode && (
            <div className="p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md border-b border-white/60 dark:border-white/10 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playPop();
                  setSidebarTab('notes');
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-bubble font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  sidebarTab === 'notes'
                    ? 'bg-white/90 dark:bg-white/15 text-rose-700 dark:text-rose-300 shadow-xs border-rose-200/80 dark:border-white/10 backdrop-blur-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10 border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>{locale === 'zh' ? '全部笔记' : 'Notes'}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-rose-50/80 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 text-[10px] font-bubble font-bold border border-rose-200/40 dark:border-rose-900/40">
                  {totalCount}
                </span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setSidebarTab('trash');
                    onSelectTag('#all');
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl font-bubble font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    sidebarTab === 'trash'
                      ? 'bg-stone-800 dark:bg-neutral-800 text-white shadow-xs border-stone-900 dark:border-white/10'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10 border-transparent'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{locale === 'zh' ? '废纸篓' : 'Trash'}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bubble font-bold ${
                    sidebarTab === 'trash' ? 'bg-stone-700 dark:bg-neutral-700 text-stone-200' : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {deletedCount}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* 3. Batch Operations Header Bar (When in Batch Mode) */}
          {isBatchMode && sidebarTab === 'notes' && (
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-rose-50/90 to-pink-50/90 dark:from-rose-950/80 dark:to-pink-950/80 border-b border-rose-200/80 dark:border-rose-900/60 flex flex-col gap-2 select-none animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bubble">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="h-7 px-2.5 rounded-full bg-white dark:bg-neutral-800 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-50 transition shadow-3xs cursor-pointer active:scale-95 flex items-center gap-1 text-[11px]"
                  >
                    <span>☑️</span>
                    <span>{locale === 'zh' ? `全选 (${filteredNotes.length})` : `All (${filteredNotes.length})`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="h-7 px-2.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 font-bold hover:bg-neutral-50 transition shadow-3xs cursor-pointer active:scale-95 flex items-center gap-1 text-[11px]"
                  >
                    <span>⬜</span>
                    <span>{locale === 'zh' ? '清空' : 'Clear'}</span>
                  </button>
                </div>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-xs">
                  已选 {selectedIds.size} / {filteredNotes.length}
                </span>
              </div>

              {/* Direct Prominent Batch Delete Trigger */}
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => {
                  playPop();
                  setIsBatchDeleteModalOpen(true);
                }}
                className="w-full h-8 px-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bubble font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {locale === 'zh' ? `立即批量删除已选 (${selectedIds.size}) 篇笔记` : `Delete Selected (${selectedIds.size}) Notes`}
                </span>
              </button>
            </div>
          )}

          {/* 4. Trash View Top Action Bar */}
          {sidebarTab === 'trash' && (
            <div className="px-3 py-2 bg-stone-100 dark:bg-neutral-900 border-b border-stone-200 dark:border-white/10 flex items-center justify-between text-xs font-bubble">
              <span className="text-stone-600 dark:text-neutral-300 font-bold">
                {deletedCount === 0 ? (locale === 'zh' ? '废纸篓空空如也' : 'Trash is empty') : `共 ${deletedCount} 篇已删笔记`}
              </span>
              {deletedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRestoreAllTrash}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Restore All Notes"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{locale === 'zh' ? '全部恢复' : 'Restore All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Empty Trash Permanently"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{locale === 'zh' ? '清空' : 'Empty'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. Tags Filter Section: Single-Line Horizontal Smooth Scroller OR Expanded Search Drawer (Mutually Exclusive) */}
          {sidebarTab === 'notes' && (
            <div className="border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md transition-all duration-300">
              {!isTagDrawerOpen ? (
                /* Mode A: Compact Single-Row Horizontal Scroller */
                <div className="px-3 py-1.5 flex items-center justify-between gap-1.5 animate-in fade-in duration-200">
                  <div className="flex-1 min-w-0 overflow-x-auto flex items-center gap-1.5 no-scrollbar py-0.5 scroll-smooth">
                    {/* Pinned #all Capsule */}
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

                    {/* Quick Horizontal Tag Pills */}
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

                  {/* Open Tag Search / Full Drawer Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop();
                      setIsTagDrawerOpen(true);
                    }}
                    className="h-6.5 px-2 rounded-lg text-xs font-bubble font-bold flex items-center gap-1 border transition cursor-pointer shrink-0 bg-white/80 dark:bg-white/10 hover:bg-white hover:dark:bg-white/20 text-neutral-600 dark:text-neutral-300 border-white/60 dark:border-white/10 shadow-3xs"
                    title={locale === 'zh' ? '展开全量标签与检索' : 'Search All Tags'}
                  >
                    <Search className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                /* Mode B: Morphed Search & Tag Cloud Drawer (Single Unified Tag Area) */
                <div className="p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder={locale === 'zh' ? '检索全部标签分类...' : 'Filter tags...'}
                        className="w-full pl-8 pr-7 py-1 bg-white/90 dark:bg-neutral-800/90 border border-white/60 dark:border-white/10 text-neutral-800 dark:text-neutral-100 rounded-xl text-xs font-cute focus:outline-none focus:border-rose-400 transition shadow-3xs placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                        autoFocus
                      />
                      {tagSearch && (
                        <button
                          type="button"
                          onClick={() => setTagSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300 flex items-center justify-center text-[10px] hover:bg-rose-500 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Close Search Drawer Button */}
                    <button
                      type="button"
                      onClick={() => {
                        playPop();
                        setIsTagDrawerOpen(false);
                        setTagSearch('');
                      }}
                      className="h-7 px-2.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-neutral-600 dark:text-neutral-300 border border-white/60 dark:border-white/10 text-xs font-bubble font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-3xs"
                      title={locale === 'zh' ? '收起搜索' : 'Close search'}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{locale === 'zh' ? '收起' : 'Close'}</span>
                    </button>
                  </div>

                  {/* Single Clean Tag Cloud Grid */}
                  <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 py-0.5 no-scrollbar">
                    {/* Always include #all in drawer */}
                    <button
                      type="button"
                      onClick={() => {
                        playPop(550);
                        onSelectTag('#all');
                        setIsTagDrawerOpen(false);
                        setTagSearch('');
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

                    {filteredTags.map((tItem) => {
                      const isSelected = selectedTag.toLowerCase() === tItem.tag.toLowerCase();
                      return (
                        <button
                          key={tItem.tag}
                          type="button"
                          onClick={() => {
                            playPop(600);
                            onSelectTag(tItem.tag);
                            setIsTagDrawerOpen(false);
                            setTagSearch('');
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
            </div>
          )}

          {/* 6. Refined Notes Stream (Compact List vs Comfortable Card) */}
          <div className={`flex-1 overflow-y-auto select-none ${viewMode === 'compact' ? 'p-2 space-y-1' : 'p-3 space-y-2.5'}`}>
            {sidebarTab === 'notes' ? (
              <>
                <div className="px-2 py-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bubble font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider truncate">
                    <span>{selectedTag === '#all' ? (locale === 'zh' ? '笔记清单' : 'Notes List') : `${selectedTag}`}</span>
                    <span className="text-[11px] font-mono">({filteredNotes.length})</span>
                  </div>

                  {/* View Mode Toggle Switcher [ ☰ 紧凑 | 🗂️ 舒缓 ] */}
                  <div className="flex items-center p-0.5 rounded-xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 shrink-0">
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
                    <p className="text-xs font-bold">{locale === 'zh' ? '暂无匹配的灵感笔记' : 'No notes found'}</p>
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

                          {/* Note Title + Pin */}
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {note.isPinned && !isBatchMode && (
                              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                            )}
                            <span className={`font-bubble text-[13.5px] truncate ${
                              isActive && !isBatchMode 
                                ? 'font-extrabold text-neutral-900 dark:text-white' 
                                : 'font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-rose-600 dark:group-hover:text-rose-400'
                            }`}>
                              {note.excerpt || (locale === 'zh' ? '空白笔记' : 'Untitled note')}
                            </span>
                          </div>

                          {/* Right side: Micro Tag + Short Date */}
                          <div className="flex items-center gap-2 shrink-0 text-xs font-cute text-neutral-400 dark:text-neutral-500">
                            {noteTags[0] && (
                              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 text-[10px] font-mono font-semibold truncate max-w-[80px]">
                                {noteTags[0]}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                              {formatShortDate(note.createdAt || Date.now(), locale)}
                            </span>

                            {/* Delete button (Admin non-batch) */}
                            {!isBatchMode && isAdmin && (
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
                          className={`p-3 rounded-2xl border transition cursor-pointer group flex flex-col justify-between relative select-none backdrop-blur-md ${
                            isChecked
                              ? 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-400 shadow-sm ring-2 ring-rose-400/30'
                              : isActive && !isBatchMode
                              ? 'bg-white dark:bg-[#18181B] border-rose-400 dark:border-rose-500/50 shadow-md ring-2 ring-rose-400/20'
                              : 'bg-white/70 dark:bg-[#18181B]/60 hover:bg-white dark:hover:bg-[#18181B] border-neutral-200/60 dark:border-white/10 hover:border-rose-200/80 hover:shadow-xs'
                          }`}
                        >
                          {/* Left Accent Bar for Active Card */}
                          {isActive && !isBatchMode && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-rose-500" />
                          )}

                          {/* Line 1: Title + Pin + Time */}
                          <div className={`flex items-start justify-between gap-2 mb-1 ${isBatchMode ? 'pr-7' : ''} ${isActive && !isBatchMode ? 'pl-1.5' : ''}`}>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {note.isPinned && !isBatchMode && (
                                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
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
                            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
                              {formatShortDate(note.createdAt || Date.now(), locale)}
                            </span>
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
                            </div>

                            {/* Delete Action (Admin non-batch) */}
                            {!isBatchMode && isAdmin && (
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
                          className="px-3 py-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/90 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800 transition cursor-pointer flex items-center justify-between gap-2 text-xs select-none"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="font-bubble font-bold text-stone-800 dark:text-neutral-200 truncate">
                              {note.excerpt || (locale === 'zh' ? '已删笔记' : 'Deleted Note')}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-stone-400 shrink-0">{formattedDate}</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={note.id}
                        onClick={() => onSelectNote(note)}
                        className="p-3 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-stone-50/90 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800 transition cursor-pointer flex flex-col justify-between gap-1.5 shadow-3xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bubble text-sm font-bold text-stone-700 dark:text-neutral-100 truncate">
                            {note.excerpt || (locale === 'zh' ? '已删笔记' : 'Deleted Note')}
                          </h4>
                          <span className="text-[10px] font-mono text-stone-400 shrink-0">{formattedDate}</span>
                        </div>
                        <p className="font-cute text-xs text-stone-500 dark:text-neutral-400 line-clamp-1">
                          {(note.rawMarkdown || '').replace(/^[#>*`\-\d.]+\s*/gm, '').substring(0, 60) || (locale === 'zh' ? '暂无内容...' : 'No content...')}
                        </p>
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
