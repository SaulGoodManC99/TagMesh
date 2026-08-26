import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  PanelLeft, 
  Sparkles, 
  Trash2, 
  Pin, 
  Share2, 
  FileDown, 
  Globe, 
  Copy, 
  Plus, 
  Compass,
  Home,
  Layers,
  Check,
  MoreHorizontal,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Note } from './types/note';
import { db, getActiveNotes, createNewNote, getOrCreateActiveNote, ensureNotesAuthorSeparation, isNoteEmpty } from './db/dexie';
import { fetchRemoteNotes, deleteNoteRemote, syncNoteRemote } from './services/api';
import { useZeroSync } from './hooks/useZeroSync';
import { useI18n } from './hooks/useI18n';
import { useSiteConfig } from './hooks/useSiteConfig';
import { TagMeshEditor } from './editor/TagMeshEditor';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { TagMeshSidebar } from './components/TagMeshSidebar';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { ClayDeleteModal } from './components/ClayDeleteModal';
import { ClayBlogHome } from './blog/ClayBlogHome';
import { ClayLandingPortal } from './blog/ClayLandingPortal';
import { ClayHeader } from './blog/ClayHeader';
import { ClayAdminAuthModal } from './components/ClayAdminAuthModal';
import { ClayToastContainer, toast } from './components/ClayToast';
import { playPop, playChime, isSoundEnabled, toggleSound } from './blog/utils/soundEffects';
import { useClayTheme } from './blog/utils/clayThemes';
import { useAuth } from './hooks/useAuth';
import { ClayAtmosphereCanvas } from './blog/components/ClayAtmosphereCanvas';
import { ThemeStudioModal } from './components/ThemeStudioModal';

type AppRoute = 'home' | 'gallery' | 'editor';

export const App: React.FC = () => {
  const { t, locale, toggleLocale } = useI18n();
  const { theme, randomTheme, openThemeModal } = useClayTheme();
  const { isAdmin, isGuest, openAuthModal } = useAuth();

  // Route state: 'home' (Landing Portal) | 'gallery' (Exhibition Hall) | 'editor' (Workspace)
  const [route, setRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/editor')) return 'editor';
    if (hash.startsWith('#/gallery') || hash.startsWith('#/explore') || hash.startsWith('#/blog') || hash.startsWith('#/notes') || hash.startsWith('#/post')) return 'gallery';
    return 'home';
  });

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('#all');

  // Left Sidebar state (responsive default: open on desktop, drawer on mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  // 1.5s Debounced Zero-Sync Hook
  const { syncState, forceSyncNow } = useZeroSync(activeNote);

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    toast.show(msg, type);
  }, []);

  // Listen to hash changes for routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      let nextRoute: AppRoute = 'home';
      if (hash.startsWith('#/editor')) {
        nextRoute = 'editor';
      } else if (hash.startsWith('#/gallery') || hash.startsWith('#/explore') || hash.startsWith('#/blog') || hash.startsWith('#/notes') || hash.startsWith('#/post')) {
        nextRoute = 'gallery';
      } else {
        nextRoute = 'home';
      }

      setRoute(nextRoute);
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Guard against unauthorized editor access when not admin
  useEffect(() => {
    if (route === 'editor' && !isAdmin) {
      playPop(300);
      showToast(locale === 'zh' ? '🔒 工作台仅供馆长登录使用，请先验证密码' : '🔒 Workspace is restricted to Curator');
      openAuthModal();
      setRoute('home');
      window.location.hash = '#/';
    }
  }, [route, isAdmin, openAuthModal, locale, showToast]);

  // Listen to Global Custom Toast Events (from Admin Modal, Context Menu, etc.)
  useEffect(() => {
    const handleGlobalToast = (e: any) => {
      if (e.detail?.message) {
        showToast(e.detail.message);
      }
    };
    window.addEventListener('tagmesh_toast_notify' as any, handleGlobalToast);
    return () => window.removeEventListener('tagmesh_toast_notify' as any, handleGlobalToast);
  }, [showToast]);

  // Initialize DB, load initial note, seed guest sample notes, and ensure author separation
  useEffect(() => {
    ensureNotesAuthorSeparation().then(async () => {
      const hasSeededGuest = typeof window !== 'undefined' && localStorage.getItem('tagmesh_has_seeded_guest_notes_v2') === 'true';
      if (!hasSeededGuest) {
        const { seed10GuestSampleNotes } = await import('./db/guestSampleNotes');
        await seed10GuestSampleNotes();
      }

      // Pull latest notes from D1 (including any created via MCP or Telegram)
      try {
        const remoteNotes = await fetchRemoteNotes();
        if (remoteNotes.length > 0) {
          for (const rNote of remoteNotes) {
            const localNote = await db.notes.get(rNote.id);
            if (!localNote) {
              await db.notes.put({
                ...rNote,
                isDirty: false,
                syncedAt: rNote.syncedAt || Date.now(),
              });
            } else if (!localNote.isDirty && rNote.updatedAt >= localNote.updatedAt) {
              await db.notes.put({
                ...rNote,
                likes: typeof rNote.likes === 'number' && rNote.likes > 0 ? rNote.likes : (localNote.likes || 0),
                isDirty: false,
                syncedAt: rNote.syncedAt || Date.now(),
              });
            }
          }
        }
      } catch {
        // ignore offline
      }

      const notes = await getActiveNotes();
      const hasSeededAdmin = typeof window !== 'undefined' && localStorage.getItem('tagmesh_has_seeded_sample_notes_v1') === 'true';

      if (notes.length === 0 && !hasSeededAdmin) {
        const { seed40SampleNotes } = await import('./db/sampleNotes');
        await seed40SampleNotes();
        const seeded = await getActiveNotes();
        setActiveNote(seeded[0] || null);
      } else if (notes.length === 0) {
        // If all notes were explicitly deleted, keep database clean and create a single fresh blank note
        const blank = await createNewNote('', [], { isPublic: true });
        setActiveNote(blank);
      } else {
        setActiveNote(notes[0]);
      }
    });
  }, [isAdmin]);

  // Handle Note Change from Editor
  const handleNoteChange = useCallback((updatedNote: Note) => {
    setActiveNote(updatedNote);
    if (!isNoteEmpty(updatedNote)) {
      db.notes.put(updatedNote);
    } else {
      // If note content and tags are completely empty, remove from persistent db
      db.notes.delete(updatedNote.id);
    }
  }, []);

  // Create new note with smart empty note reuse
  const handleCreateNote = useCallback(async (initialText = '') => {
    // 1. If currently on an unedited empty note, reuse it directly!
    if (activeNote && isNoteEmpty(activeNote) && !activeNote.isDeleted && !initialText) {
      if (route !== 'editor') {
        window.location.hash = '#/editor';
      }
      showToast(locale === 'zh' ? '✨ 当前已在空白笔记中' : '✨ Already in blank note');
      return;
    }

    const newNote = await createNewNote(initialText, [], {
      isPublic: true,
    });
    
    setActiveNote(newNote);
    if (route !== 'editor') {
      window.location.hash = '#/editor';
    }
    showToast(locale === 'zh' ? '✨ 已新建空白笔记' : '✨ Created new note');
  }, [activeNote, locale, route, showToast]);

  // Select note (auto dismiss sidebar drawer on mobile)
  const handleSelectNote = useCallback((note: Note) => {
    setActiveNote(note);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Filter by tag in left sidebar
  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(tag);
    setIsSidebarOpen(true);
  }, []);

  // Toggle Pin
  const handleTogglePin = useCallback(async () => {
    if (!activeNote) return;
    const newPin = !activeNote.isPinned;
    const now = Date.now();
    const updatedNote: Note = {
      ...activeNote,
      isPinned: newPin,
      isDirty: true,
      updatedAt: now,
    };
    await db.notes.put(updatedNote);
    setActiveNote(updatedNote);
    
    // Immediately persist and sync to Cloudflare D1
    syncNoteRemote(updatedNote);

    showToast(newPin ? (locale === 'zh' ? '📌 笔记已置顶' : '📌 Note Pinned') : (locale === 'zh' ? '📌 已取消置顶' : 'Unpinned Note'));
  }, [activeNote, locale, showToast]);

  // Delete specific note by ID
  const handleDeleteNoteById = useCallback(async (id: string) => {
    const target = await db.notes.get(id);
    if (!target) return;

    await db.notes.update(id, { isDeleted: true, isDirty: true, updatedAt: Date.now() });
    
    // Sync remote deletion to Cloudflare D1
    deleteNoteRemote(id);

    showToast(locale === 'zh' ? '🗑 笔记已移入废纸篓' : '🗑 Note Moved to Trash');
    
    if (activeNote?.id === id) {
      const remaining = await getActiveNotes('all');
      if (remaining.length > 0) {
        setActiveNote(remaining[0]);
      } else {
        const next = await createNewNote('', [], { isPublic: true });
        setActiveNote(next);
      }
    }
  }, [activeNote?.id, locale, showToast]);

  // Delete current active note
  const handleDeleteCurrentNote = useCallback(() => {
    if (!activeNote) return;
    if (isGuest && activeNote.isOfficial) {
      showToast(locale === 'zh' ? '⚠️ 官方示例笔记仅馆长可删除，可点击右上角登录馆长！' : '⚠️ Official notes can only be deleted by Admin!');
      return;
    }
    setIsDeleteModalOpen(true);
  }, [activeNote, isGuest, locale, showToast]);

  // Export current note as Markdown
  const handleExportMarkdown = useCallback(() => {
    if (!activeNote) return;
    const firstLine = activeNote.excerpt.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 30);
    const filename = `${firstLine || 'tagmesh-note'}.md`;
    const blob = new Blob([activeNote.rawMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('💾 Exported Markdown');
  }, [activeNote, showToast]);

  // Export all notes as JSON backup (Restricted to Admin/Curator)
  const handleExportJson = useCallback(async () => {
    if (!isAdmin) {
      showToast(locale === 'zh' ? '🔒 全量知识库备份为馆长专属权限，请先验证馆长身份！' : '🔒 Full knowledge base backup is restricted to Curator/Admin!');
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
    showToast(locale === 'zh' ? '📦 成功导出全量笔记数据备份' : '📦 Exported JSON Backup');
  }, [isAdmin, openAuthModal, locale, showToast]);

  // Register Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isTypingInInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // ⌘K or Ctrl+K -> Command Palette
      if (isMeta && key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Alt+N or ⌘N -> New Note (Alt+N avoids browser hijacking new window)
      if ((isAlt && key === 'n') || (e.metaKey && key === 'n')) {
        e.preventDefault();
        handleCreateNote('');
        return;
      }

      // Alt+S -> Toggle Sidebar
      if (isAlt && key === 's') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      // Alt+T -> Open Theme Studio
      if (isAlt && key === 't') {
        e.preventDefault();
        openThemeModal();
        return;
      }

      // Alt+/ or (when not typing) '?' -> Shortcuts
      if ((isAlt && e.key === '/') || (!isTypingInInput && e.key === '?')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsSettingsOpen(false);
        setIsShortcutsOpen(false);
        setIsDeleteModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote]);

  const renderEditorView = () => (
    <div 
      style={{ backgroundColor: theme.bg }}
      className="h-screen w-screen overflow-hidden text-neutral-800 flex flex-col selection:bg-pink-300 selection:text-pink-900 font-sans transition-colors duration-500 relative"
    >
      {/* 0. Live Ambient Atmospheric Particle World */}
      <ClayAtmosphereCanvas />

      {/* Top Floating App Bar */}
      <header 
        style={{ backgroundColor: `${theme.headerBg}cc` }}
        className="h-14 border-b border-white/60 dark:border-white/10 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none transition-colors duration-500"
      >
          {/* Left: Home + Sidebar Toggle + Note Excerpt */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Back to Blog Gallery */}
            <button
              type="button"
              onClick={() => {
                playPop();
                window.location.hash = '#/gallery';
              }}
              className="h-8.5 sm:h-9 px-2.5 sm:px-3.5 rounded-xl font-bubble font-bold text-xs bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title={locale === 'zh' ? '返回展厅广场' : 'Return to Gallery'}
            >
              <Home className="w-3.5 h-3.5 text-pink-500" />
              <span className="hidden sm:inline">{locale === 'zh' ? '广场' : 'Gallery'}</span>
            </button>

            {/* Sidebar Drawer Toggle */}
            <button
              type="button"
              onClick={() => {
                playPop();
                setIsSidebarOpen((prev) => !prev);
              }}
              className={`h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-bubble font-bold text-xs ${
                isSidebarOpen 
                  ? `bg-gradient-to-r ${theme.primaryGradient} text-white border-white/20 shadow-xs` 
                  : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border-neutral-200/80 dark:border-white/10 shadow-3xs hover:scale-105'
              }`}
              title={locale === 'zh' ? '展开/收起左侧笔记库 (Alt+S)' : 'Toggle Sidebar (Alt+S)'}
            >
              <PanelLeft className={`w-3.5 h-3.5 ${isSidebarOpen ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
              <span className="hidden sm:inline">{locale === 'zh' ? '笔记列表' : 'Notes'}</span>
            </button>

            {/* Active Note Excerpt on Desktop */}
            <span className="text-neutral-300 dark:text-neutral-700 hidden md:inline">/</span>
            <span className="text-neutral-700 dark:text-neutral-200 font-bubble font-bold truncate max-w-[160px] lg:max-w-xs hidden md:inline text-xs sm:text-sm">
              {activeNote?.excerpt || (locale === 'zh' ? '灵感笔记' : 'Notes & Thoughts')}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Desktop Only: Toggle Pin */}
            {activeNote && (
              <button
                type="button"
                onClick={handleTogglePin}
                className={`hidden md:flex h-8.5 sm:h-9 px-3 rounded-xl text-xs font-bubble font-bold transition-all cursor-pointer border shadow-3xs items-center gap-1 hover:scale-105 active:scale-95 ${
                  activeNote.isPinned
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                    : 'bg-white/90 dark:bg-neutral-900/90 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-neutral-700 dark:text-neutral-200 border-neutral-200/80 dark:border-white/10'
                }`}
                title="Pin Note"
              >
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <span>{activeNote.isPinned ? (locale === 'zh' ? '已置顶' : 'Pinned') : (locale === 'zh' ? '置顶' : 'Pin')}</span>
              </button>
            )}

            {/* Desktop Only: Export Markdown */}
            {activeNote && (
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="hidden md:flex h-8.5 sm:h-9 px-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 hover:bg-pink-50 dark:hover:bg-pink-950/30 border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:text-pink-600 dark:hover:text-pink-300 text-xs font-bubble font-bold cursor-pointer transition-all shadow-3xs hover:scale-105 active:scale-95 items-center gap-1.5"
                title="Export Markdown"
              >
                <Copy className="w-3.5 h-3.5 text-pink-500" />
                <span>{locale === 'zh' ? '导出' : 'Export'}</span>
              </button>
            )}

            {/* Desktop Only: Delete Action */}
            {activeNote && isAdmin && (
              <button
                type="button"
                onClick={handleDeleteCurrentNote}
                className="hidden md:flex h-8.5 sm:h-9 w-8.5 sm:w-9 rounded-xl bg-white/90 dark:bg-neutral-900/90 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-600 border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:scale-105 active:scale-95 transition-all items-center justify-center cursor-pointer"
                title="Delete Note (⌘⌫)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              </button>
            )}

            {/* Desktop Only: Command Palette */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex h-8.5 sm:h-9 px-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-white/10 border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-mono font-bold cursor-pointer transition-all shadow-3xs hover:scale-105 active:scale-95 items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <kbd className="text-[10px] bg-neutral-100 dark:bg-white/10 px-1 py-0.2 rounded text-neutral-500 dark:text-neutral-400 font-mono">⌘K</kbd>
            </button>

            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSound}
              className="h-8.5 sm:h-9 w-8.5 sm:w-9 rounded-xl bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              title={soundOn ? (locale === 'zh' ? '音效开启 (点击静音)' : 'Sound On') : (locale === 'zh' ? '音效已静音 (点击开启)' : 'Sound Off')}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-400" />}
            </button>

            {/* Desktop Only: Identity Pill */}
            <button
              type="button"
              onClick={() => {
                playPop();
                openAuthModal();
              }}
              className={`hidden md:flex h-8.5 sm:h-9 px-3.5 rounded-xl font-bubble font-bold text-xs border shadow-3xs hover:scale-105 active:scale-95 transition-all items-center gap-1.5 cursor-pointer shrink-0 ${
                isAdmin
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-900 border-amber-300"
                  : "bg-emerald-50/90 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
              }`}
              title={isAdmin ? (locale === 'zh' ? '馆长身份 (点击管理)' : 'Admin Mode') : (locale === 'zh' ? '当前为游客模式 (点击登录馆长)' : 'Guest Mode')}
            >
              <span>{isAdmin ? '👑' : '🌱'}</span>
              <span>{isAdmin ? (locale === 'zh' ? '馆长' : 'Admin') : (locale === 'zh' ? '游客' : 'Guest')}</span>
            </button>

            {/* Theme Studio Button */}
            <button
              type="button"
              onClick={openThemeModal}
              onContextMenu={(e) => {
                e.preventDefault();
                randomTheme();
              }}
              className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bubble font-bold border border-neutral-200/80 dark:border-white/10 shadow-3xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title={locale === 'zh' ? '点击打开「次元主题工坊」• 右键随机换肤' : 'Theme Studio • Right-click to randomize'}
            >
              <span className="text-sm">{theme.emoji}</span>
              <span className="hidden sm:inline">{theme.nameZh}</span>
            </button>

            {/* Mobile Quick Action Overflow Bubble */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => {
                  playPop(580);
                  setIsMobileMenuOpen((prev) => !prev);
                }}
                className="h-8.5 w-8.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 shadow-3xs flex items-center justify-center cursor-pointer active:scale-90"
                title="More Actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Mobile Dropdown Popover */}
              {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-end items-start p-3 pt-16 select-none md:hidden">
                  <div
                    className="fixed inset-0 bg-neutral-900/40 modal-backdrop-enter"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div className="relative w-56 bg-[#fdfbf7] dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl rounded-3xl p-2.5 text-neutral-800 dark:text-neutral-100 modal-card-enter z-10 flex flex-col gap-1 text-xs font-cute">
                    {/* Search */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsCommandPaletteOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-cyan-500" />
                      <span>{locale === 'zh' ? '搜索笔记 (⌘K)' : 'Search (⌘K)'}</span>
                    </button>

                    {/* Pin */}
                    {activeNote && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleTogglePin();
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition text-left cursor-pointer"
                      >
                        <Pin className="w-4 h-4 text-amber-500" />
                        <span>{activeNote.isPinned ? (locale === 'zh' ? '取消置顶' : 'Unpin') : (locale === 'zh' ? '置顶笔记' : 'Pin Note')}</span>
                      </button>
                    )}

                    {/* Export */}
                    {activeNote && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleExportMarkdown();
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-pink-50 dark:hover:bg-pink-950/40 transition text-left cursor-pointer"
                      >
                        <Copy className="w-4 h-4 text-pink-500" />
                        <span>{locale === 'zh' ? '复制/导出 Markdown' : 'Export Markdown'}</span>
                      </button>
                    )}

                    {/* Identity */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition text-left cursor-pointer border-t border-neutral-100 dark:border-white/10 pt-2"
                    >
                      <span>{isAdmin ? '👑' : '🌱'}</span>
                      <span>{isAdmin ? (locale === 'zh' ? '馆长后台权限' : 'Admin Panel') : (locale === 'zh' ? '登录馆长身份' : 'Curator Login')}</span>
                    </button>

                    {/* Delete (Admin) */}
                    {activeNote && isAdmin && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleDeleteCurrentNote();
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition text-left cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>{locale === 'zh' ? '移入废纸篓' : 'Move to Trash'}</span>
                      </button>
                    )}
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </header>

      {/* Main Area: Side-by-side Left Sidebar + Center Editor */}
      <div className="flex flex-1 overflow-hidden relative p-2.5 sm:p-3 gap-2.5 sm:gap-3 min-h-0">
        {/* Left Side-by-Side TagMesh Sidebar */}
        <TagMeshSidebar
          isOpen={isSidebarOpen}
          activeNote={activeNote}
          selectedTag={selectedTag}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onSelectTag={handleTagClick}
          onSelectNote={handleSelectNote}
          onNewNote={() => handleCreateNote('')}
          onDeleteNoteById={handleDeleteNoteById}
        />

        {/* Center Canvas: Pure Prose Writing Area */}
        <main 
          className="flex-1 h-full overflow-hidden relative flex flex-col transition-colors duration-500 z-10 min-h-0"
        >
          <TagMeshEditor
            note={activeNote}
            onNoteChange={handleNoteChange}
            onTagClick={handleTagClick}
          />
        </main>
      </div>

      {/* Bottom Floating Zero-Sync Status Bar */}
      <StatusBar
        note={activeNote}
        syncState={syncState}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleLanguage={toggleLocale}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenMcpSettings={() => setIsSettingsOpen(true)}
        onTagClick={handleTagClick}
      />
    </div>
  );

  return (
    <>
      <div className="w-full min-h-screen relative">
        {route === 'home' && (
          <ClayLandingPortal
            onGoToEditor={() => {
              if (!isAdmin) {
                showToast(locale === 'zh' ? '🔒 工作台仅供馆长登录使用，请先验证密码' : '🔒 Workspace is restricted to Curator');
                openAuthModal();
                return;
              }
              setRoute('editor');
              window.location.hash = '#/editor';
            }}
            onGoToExplore={(mode, tag) => {
              const queryParams = new URLSearchParams();
              if (mode) queryParams.set('mode', mode);
              if (tag) queryParams.set('tag', tag);
              const queryStr = queryParams.toString();
              window.location.hash = queryStr ? `#/gallery?${queryStr}` : '#/gallery';
            }}
            onGoToEditorWithNote={(note) => {
              if (!isAdmin) {
                showToast(locale === 'zh' ? '🔒 工作台仅供馆长登录使用，请先验证密码' : '🔒 Workspace is restricted to Curator');
                openAuthModal();
                return;
              }
              setActiveNote(note);
              setRoute('editor');
              window.location.hash = '#/editor';
            }}
          />
        )}

        {route === 'gallery' && (
          <ClayBlogHome
            onGoToEditor={() => {
              if (!isAdmin) {
                showToast(locale === 'zh' ? '🔒 工作台仅供馆长登录使用，请先验证密码' : '🔒 Workspace is restricted to Curator');
                openAuthModal();
                return;
              }
              setRoute('editor');
              window.location.hash = '#/editor';
            }}
            onGoToEditorWithNote={(note) => {
              if (!isAdmin) {
                showToast(locale === 'zh' ? '🔒 工作台仅供馆长登录使用，请先验证密码' : '🔒 Workspace is restricted to Curator');
                openAuthModal();
                return;
              }
              setActiveNote(note);
              setRoute('editor');
              window.location.hash = '#/editor';
            }}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
        )}

        {route === 'editor' && renderEditorView()}
      </div>

      {/* Unified Clay Dynamic Island Toast Container */}
      <ClayToastContainer />

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        activeNote={activeNote}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleLanguage={toggleLocale}
        onExportMarkdown={handleExportMarkdown}
        onExportJson={handleExportJson}
        onCopyMcpToken={() => setIsSettingsOpen(true)}
        onTogglePin={handleTogglePin}
        onDeleteNote={handleDeleteCurrentNote}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onFilterTag={handleTagClick}
        onGoToBlog={() => {
          window.location.hash = '#/';
        }}
      />

      {/* Settings & MCP Credentials Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardHelpModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* 3D Clay Delete Confirmation Modal */}
      <ClayDeleteModal
        isOpen={isDeleteModalOpen}
        noteTitle={activeNote?.excerpt || ''}
        onConfirm={() => {
          if (activeNote) {
            handleDeleteNoteById(activeNote.id);
          }
        }}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Admin Auth Modal */}
      <ClayAdminAuthModal />

      {/* Theme Studio & Atmosphere Workshop Modal */}
      <ThemeStudioModal />
    </>
  );
};
