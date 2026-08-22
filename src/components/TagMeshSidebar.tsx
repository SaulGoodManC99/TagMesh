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
  Sparkles
} from 'lucide-react';
import { Note, TagCount } from '../types/note';
import { db, getAllTagCounts, searchNotesLocal, getOrCreateActiveNote, getActiveNotes, createNewNote } from '../db/dexie';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { playPop, playChime, playSoftTick } from '../blog/utils/soundEffects';
import { triggerConfettiShower } from '../blog/utils/confetti';
import { ClayDeleteModal } from './ClayDeleteModal';
import { ClayBatchDeleteModal } from './ClayBatchDeleteModal';

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
  const { isAdmin, openAuthModal } = useAuth();
  const [sidebarTab, setSidebarTab] = useState<'notes' | 'trash'>('notes');
  const [tagSearch, setTagSearch] = useState('');
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  // Batch Management Mode (Admin Only)
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

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
    import('../services/api').then(({ deleteNoteRemote }) => {
      ids.forEach(id => deleteNoteRemote(id));
    });

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
    import('../services/api').then(({ deleteNoteRemote }) => {
      deleteNoteRemote(noteId);
    });
  };

  // Restore ALL notes from trash
  const handleRestoreAllTrash = async () => {
    if (deletedNotes.length === 0) return;
    playChime();
    triggerConfettiShower();
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
    import('../services/api').then(({ deleteNoteRemote }) => {
      ids.forEach(id => deleteNoteRemote(id));
    });
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
        className={`fixed md:relative top-0 bottom-0 left-0 h-full border-r border-amber-900/10 bg-[#fdfbf7]/98 backdrop-blur-2xl flex select-none transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] shrink-0 z-40 md:z-20 shadow-2xl md:shadow-sm overflow-hidden ${
          isOpen ? 'w-[85vw] max-w-[380px] md:w-84 lg:w-96 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full md:translate-x-0 border-r-0 pointer-events-none'
        }`}
      >
        <div className="w-[85vw] max-w-[380px] md:w-84 lg:w-96 min-w-[290px] md:min-w-[336px] lg:min-w-[384px] h-full flex flex-col">
          {/* 1. Sidebar Top Header */}
          <div className="h-16 border-b border-amber-900/10 px-3.5 sm:px-4 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-md text-white shrink-0 ${
                sidebarTab === 'trash'
                  ? 'bg-gradient-to-br from-neutral-600 to-stone-800'
                  : isBatchMode
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                  : 'bg-gradient-to-br from-pink-400 via-rose-400 to-amber-300'
              }`}>
                {sidebarTab === 'trash' ? <Trash2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bubble font-bold text-sm sm:text-base text-neutral-800 tracking-tight block truncate">
                  {sidebarTab === 'trash'
                    ? (locale === 'zh' ? '🗑️ 废纸篓' : 'Recycle Bin')
                    : isBatchMode
                    ? (locale === 'zh' ? '👑 批量管理' : 'Batch Manage')
                    : (locale === 'zh' ? '灵感手账本' : 'My Journal')}
                </span>
                <span className="text-[11px] font-cute text-neutral-400 -mt-0.5 block truncate">
                  {sidebarTab === 'trash'
                    ? (locale === 'zh' ? `共 ${deletedCount} 篇已删手账` : `${deletedCount} in trash`)
                    : isBatchMode 
                    ? (locale === 'zh' ? `已勾选 ${selectedIds.size} 篇` : `${selectedIds.size} selected`)
                    : `${totalCount} ${locale === 'zh' ? '篇手账' : 'notes'}`}
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
                  className={`h-8 px-2.5 rounded-full font-bubble font-bold text-xs border transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    isBatchMode
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200/90 shadow-3xs'
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
                  className="h-8 flex items-center gap-1 px-3 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bubble text-xs font-bold shadow-sm hover:shadow-md transition cursor-pointer active:scale-95 shrink-0 border border-white"
                  title="New Note (⌘N)"
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
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer shrink-0 border border-transparent hover:border-neutral-200"
                title="Collapse Sidebar (⌘\)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Top View Switcher: [全部笔记] vs [🗑️ 废纸篓 (N)] */}
          {!isBatchMode && (
            <div className="p-2.5 bg-amber-50/40 border-b border-amber-900/10 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playPop();
                  setSidebarTab('notes');
                }}
                className={`flex-1 py-2 px-3 rounded-2xl font-bubble font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  sidebarTab === 'notes'
                    ? 'bg-white text-rose-700 shadow-xs border border-rose-200'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-pink-500" />
                <span>{locale === 'zh' ? '全部笔记' : 'All Notes'}</span>
                <span className="px-2 py-0.2 rounded-full bg-rose-50 text-rose-600 text-[11px] font-mono font-bold">
                  {totalCount}
                </span>
              </button>

              {/* Recycle Bin / Trash Can tab (Always available for admin) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setSidebarTab('trash');
                    onSelectTag('#all');
                  }}
                  className={`flex-1 py-2 px-3 rounded-2xl font-bubble font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'trash'
                      ? 'bg-stone-800 text-white shadow-xs border border-stone-900'
                      : 'text-neutral-600 hover:bg-stone-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>{locale === 'zh' ? '废纸篓' : 'Trash'}</span>
                  <span className={`px-2 py-0.2 rounded-full text-[11px] font-mono font-bold ${
                    sidebarTab === 'trash' ? 'bg-stone-700 text-stone-200' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {deletedCount}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* 3. Batch Operations Header Bar (When in Batch Mode) */}
          {isBatchMode && sidebarTab === 'notes' && (
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-rose-50/90 to-pink-50/90 border-b border-rose-200/80 flex flex-col gap-2 select-none animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bubble">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="h-7 px-2.5 rounded-full bg-white border border-rose-300 text-rose-700 font-bold hover:bg-rose-50 transition shadow-3xs cursor-pointer active:scale-95 flex items-center gap-1 text-[11px]"
                  >
                    <span>☑️</span>
                    <span>{locale === 'zh' ? `全选 (${filteredNotes.length})` : `All (${filteredNotes.length})`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="h-7 px-2.5 rounded-full bg-white border border-neutral-200 text-neutral-600 font-bold hover:bg-neutral-50 transition shadow-3xs cursor-pointer active:scale-95 flex items-center gap-1 text-[11px]"
                  >
                    <span>⬜</span>
                    <span>{locale === 'zh' ? '清空' : 'Clear'}</span>
                  </button>
                </div>
                <span className="font-extrabold text-rose-600 font-mono text-xs">
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
                className="w-full h-8.5 px-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bubble font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition border border-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {locale === 'zh' ? `立即批量删除已选 (${selectedIds.size}) 篇手账` : `Delete Selected (${selectedIds.size}) Notes`}
                </span>
              </button>
            </div>
          )}

        {/* 4. Trash View Top Action Bar */}
        {sidebarTab === 'trash' && (
          <div className="px-3 py-2.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs font-bubble">
            <span className="text-stone-600 font-bold">
              {deletedCount === 0 ? (locale === 'zh' ? '废纸篓空空如也' : 'Trash is empty') : `共 ${deletedCount} 篇已删手账`}
            </span>
            {deletedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRestoreAllTrash}
                  className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50 transition shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95"
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

        {/* 5. Tags Filter Section: Compact Horizontal Pastel Capsules */}
        {sidebarTab === 'notes' && (
          <div className="p-3 border-b border-amber-900/10 bg-white/50 space-y-2">
            {/* Tag Search Inset */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder={locale === 'zh' ? '快速检索标签分类...' : 'Filter tags...'}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200/80 rounded-xl text-xs font-cute focus:outline-none focus:border-rose-400 transition shadow-3xs placeholder:text-neutral-400"
              />
              {tagSearch && (
                <button
                  onClick={() => setTagSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center text-[10px] hover:bg-rose-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Horizontal Flowing Tag Capsules */}
            <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5 py-0.5 no-scrollbar">
              <button
                onClick={() => {
                  playPop(550);
                  onSelectTag('#all');
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer border shadow-3xs ${
                  selectedTag === '#all'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-neutral-700 hover:bg-pink-50 hover:text-pink-700 border-neutral-200/80'
                }`}
              >
                <span>#all</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedTag === '#all' ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'}`}>
                  {totalCount}
                </span>
              </button>

              {filteredTags.map((tItem) => {
                const isSelected = selectedTag.toLowerCase() === tItem.tag.toLowerCase();
                return (
                  <button
                    key={tItem.tag}
                    onClick={() => {
                      playPop(600);
                      onSelectTag(tItem.tag);
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer border shadow-3xs ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-white text-neutral-700 hover:bg-pink-50 hover:text-pink-700 border-neutral-200/80'
                    }`}
                  >
                    <span>{tItem.tag}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'}`}>
                      {tItem.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Spacious Handcrafted Notes Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 select-none">
          {sidebarTab === 'notes' ? (
            <>
              <div className="px-1.5 py-1 text-xs font-bubble font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>{selectedTag === '#all' ? (locale === 'zh' ? '手账清单' : 'Notes List') : `${selectedTag}`}</span>
                <span>{filteredNotes.length} 篇</span>
              </div>

              {filteredNotes.map((note) => {
                const isActive = activeNote?.id === note.id;
                const isChecked = selectedIds.has(note.id);
                const d = new Date(note.createdAt || Date.now());
                const formattedDate = locale === 'zh'
                  ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
                  : d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });

                const noteTags = (note.tags || []).slice(0, 2);

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
                    className={`p-4.5 rounded-[26px] border transition cursor-pointer group flex flex-col justify-between relative ${
                      isChecked
                        ? 'bg-rose-50/95 border-rose-400 shadow-sm ring-2 ring-rose-400/30'
                        : isActive && !isBatchMode
                        ? 'bg-gradient-to-br from-rose-50/90 via-pink-50/80 to-amber-50/70 shadow-md border-pink-300 ring-2 ring-pink-400/30'
                        : 'bg-white hover:bg-white border-neutral-200/80 hover:border-pink-200 hover:shadow-xs'
                    }`}
                  >
                    {/* Batch Checkbox Indicator */}
                    {isBatchMode && (
                      <div className="absolute top-4 right-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          isChecked
                            ? 'bg-rose-500 border-rose-500 text-white shadow-xs scale-105'
                            : 'bg-white border-neutral-300 text-transparent hover:border-rose-400'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    )}

                    <div className={`flex items-start justify-between gap-2 mb-1.5 ${isBatchMode ? 'pr-7' : ''}`}>
                      <h4 className={`font-bubble text-base font-bold line-clamp-1 leading-snug transition-colors ${
                        isChecked ? 'text-rose-800' : isActive && !isBatchMode ? 'text-rose-700' : 'text-neutral-900 group-hover:text-rose-600'
                      }`}>
                        {note.excerpt || (locale === 'zh' ? '空白笔记' : 'Untitled note')}
                      </h4>
                      {!isBatchMode && note.isPinned && (
                        <Pin className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Note Snippet */}
                    <p className="font-cute text-xs sm:text-[13px] text-neutral-600 line-clamp-2 leading-relaxed mb-3 opacity-90">
                      {(note.rawMarkdown || '').replace(/^[#>*`\-\d.]+\s*/gm, '').substring(0, 90) || (locale === 'zh' ? '暂无内容...' : 'No content...')}
                    </p>

                    {/* Note Card Tags Badge Bar */}
                    {noteTags.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        {noteTags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full bg-rose-50/80 text-rose-700 text-[11px] font-mono font-bold border border-rose-200/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Meta & Delete Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-amber-900/5 text-xs font-cute text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{formattedDate}</span>
                        </span>
                        <span>•</span>
                        <span className="text-neutral-500">{note.wordCount || 0} 字</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          note.author === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {note.author === 'admin' ? '👑 馆长' : '🌱 旅人'}
                        </span>
                      </div>

                      {/* Single Delete Action Button (Admin only, non-batch mode) */}
                      {!isBatchMode && isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingNote(note);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer text-neutral-400"
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            /* Trash Can Deleted Notes List */
            <>
              {deletedNotes.length === 0 ? (
                <div className="p-10 text-center text-neutral-400 font-cute flex flex-col items-center gap-2">
                  <span className="text-4xl">🍃</span>
                  <p className="text-sm font-bold">{locale === 'zh' ? '废纸篓是空的' : 'Recycle Bin is Empty'}</p>
                  <p className="text-xs text-neutral-400">{locale === 'zh' ? '删除的手账会暂存在这里，可随时恢复' : 'Deleted notes will appear here.'}</p>
                </div>
              ) : (
                deletedNotes.map((note) => {
                  const d = new Date(note.updatedAt || Date.now());
                  const formattedDate = locale === 'zh'
                    ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });

                  return (
                    <div
                      key={note.id}
                      onClick={() => onSelectNote(note)}
                      className="p-4.5 rounded-[26px] border border-stone-200 bg-stone-50/95 hover:bg-white transition cursor-pointer group flex flex-col justify-between shadow-3xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="font-bubble text-base font-bold text-stone-700 line-clamp-1 group-hover:text-stone-900">
                          {note.excerpt || (locale === 'zh' ? '已删手账' : 'Deleted Note')}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold shrink-0">
                          {locale === 'zh' ? '已删除' : 'Trash'}
                        </span>
                      </div>

                      <p className="font-cute text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3 opacity-90">
                        {(note.rawMarkdown || '').replace(/^[#>*`\-\d.]+\s*/gm, '').substring(0, 80) || (locale === 'zh' ? '暂无内容...' : 'No content...')}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 text-xs font-cute">
                        <span className="text-stone-400 text-[11px]">{formattedDate}</span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreNote(note);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bubble font-bold transition flex items-center gap-1 shadow-3xs cursor-pointer active:scale-95"
                            title="Restore Note"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{locale === 'zh' ? '恢复' : 'Restore'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handlePermanentlyDeleteNote(note.id, e)}
                            className="px-2 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bubble font-bold transition flex items-center gap-1 shadow-3xs cursor-pointer active:scale-95"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{locale === 'zh' ? '粉碎' : 'Purge'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* 7. Bottom Sidebar Action Footer: 👑 馆长后台控制台 / 🌱 游客 */}
        <div className="p-2.5 border-t border-amber-900/10 bg-white/80 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              playPop();
              openAuthModal();
            }}
            className={`w-full py-2 px-3 rounded-2xl font-bubble font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border shadow-3xs hover:scale-[1.02] active:scale-95 ${
              isAdmin
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-neutral-900 border-amber-300 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>{isAdmin ? '👑' : '🌱'}</span>
            <span>{isAdmin ? (locale === 'zh' ? '👑 馆长后台控制台' : '👑 Admin Console') : (locale === 'zh' ? '🔐 登录馆长' : '🔐 Login Admin')}</span>
          </button>
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
