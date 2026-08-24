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
  BookOpen
} from 'lucide-react';
import { Note } from './types/note';
import { db, getActiveNotes, createNewNote, getOrCreateActiveNote, ensureNotesAuthorSeparation, isNoteEmpty } from './db/dexie';
import { fetchRemoteNotes, deleteNoteRemote } from './services/api';
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
import { ClayDanmakuPlaza } from './blog/ClayDanmakuPlaza';
import { ClayHeader } from './blog/ClayHeader';
import { ClayAdminAuthModal } from './components/ClayAdminAuthModal';
import { playPop, playChime } from './blog/utils/soundEffects';
import { useClayTheme } from './blog/utils/clayThemes';
import { useAuth } from './hooks/useAuth';
import { ClayAtmosphereCanvas } from './blog/components/ClayAtmosphereCanvas';

type AppRoute = 'home' | 'gallery' | 'danmaku' | 'editor';

export const App: React.FC = () => {
  const { t, locale, toggleLocale } = useI18n();
  const { theme, switchNextTheme } = useClayTheme();
  const { isAdmin, isGuest, openAuthModal } = useAuth();
  const { guestNotesEnabled, danmakuEnabled } = useSiteConfig();

  // Route state: 'home' (Landing Portal) | 'gallery' (5 View Exhibition Hall) | 'danmaku' (Danmaku Plaza) | 'editor' (Workspace)
  const [route, setRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/editor')) return 'editor';
    if (hash.startsWith('#/danmaku') || hash.startsWith('#/barrage') || hash.startsWith('#/chat')) return 'danmaku';
    if (hash.startsWith('#/gallery') || hash.startsWith('#/explore') || hash.startsWith('#/blog') || hash.startsWith('#/notes') || hash.startsWith('#/post')) return 'gallery';
    return 'home';
  });

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('#all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Left Sidebar state (responsive default: open on desktop, drawer on mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1.5s Debounced Zero-Sync Hook
  const { syncState, forceSyncNow } = useZeroSync(activeNote);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Listen to hash changes for routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      let nextRoute: AppRoute = 'home';
      if (hash.startsWith('#/editor')) {
        nextRoute = 'editor';
      } else if (hash.startsWith('#/danmaku') || hash.startsWith('#/barrage') || hash.startsWith('#/chat')) {
        if (!danmakuEnabled) {
          showToast(locale === 'zh' ? '💌 弹幕广场已暂停开放，已返回首页' : '💌 Danmaku Plaza is closed, returned to home');
          window.location.hash = '#/';
          nextRoute = 'home';
        } else {
          nextRoute = 'danmaku';
        }
      } else if (hash.startsWith('#/gallery') || hash.startsWith('#/explore') || hash.startsWith('#/blog') || hash.startsWith('#/notes') || hash.startsWith('#/post')) {
        nextRoute = 'gallery';
      } else {
        nextRoute = 'home';
      }

      setRoute(nextRoute);
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [danmakuEnabled, locale, showToast]);

  // Guard against unauthorized editor access when guest notes mode is disabled
  useEffect(() => {
    if (route === 'editor' && !guestNotesEnabled && !isAdmin) {
      playPop(300);
      showToast(locale === 'zh' ? '🔒 旅人创作已关闭，仅馆长可进入工作台' : '🔒 Workspace is restricted to Curator');
      openAuthModal();
      setRoute('home');
      window.location.hash = '#/';
    }
  }, [route, guestNotesEnabled, isAdmin, openAuthModal, locale, showToast]);

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

  // Guard against danmaku plaza access when danmaku mode is disabled (auto-return home smoothly)
  useEffect(() => {
    if (route === 'danmaku' && !danmakuEnabled) {
      playPop(300);
      showToast(locale === 'zh' ? '💌 弹幕广场已暂停开放，已自动返回首页' : '💌 Danmaku Plaza is closed, returning home');
      setRoute('home');
      window.location.hash = '#/';
    }
  }, [route, danmakuEnabled, locale, showToast]);

  // Initialize DB, load initial note, seed guest sample notes, and ensure author separation
  useEffect(() => {
    ensureNotesAuthorSeparation().then(async () => {
      const hasSeededGuest = typeof window !== 'undefined' && localStorage.getItem('tagmesh_has_seeded_guest_notes_v2') === 'true';
      if (!hasSeededGuest) {
        const { seed10GuestSampleNotes } = await import('./db/guestSampleNotes');
        await seed10GuestSampleNotes();
      }

      // Pull latest notes from D1 (including any created via MCP)
      try {
        const remoteNotes = await fetchRemoteNotes();
        if (remoteNotes.length > 0) {
          for (const rNote of remoteNotes) {
            await db.notes.put({
              ...rNote,
              isDirty: false,
              syncedAt: rNote.syncedAt || Date.now(),
            });
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
        const blank = await createNewNote('', [], { author: isAdmin ? 'admin' : 'guest', isOfficial: Boolean(isAdmin) });
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
      author: isAdmin ? 'admin' : 'guest',
      isOfficial: Boolean(isAdmin),
    });
    
    setActiveNote(newNote);
    if (route !== 'editor') {
      window.location.hash = '#/editor';
    }
    showToast(locale === 'zh' ? '✨ 已新建空白笔记' : '✨ Created new note');
  }, [activeNote, isAdmin, locale, route, showToast]);

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
    await db.notes.update(activeNote.id, { isPinned: newPin, isDirty: true });
    setActiveNote({ ...activeNote, isPinned: newPin, isDirty: true });
    showToast(newPin ? '📌 Note Pinned' : 'Unpinned Note');
  }, [activeNote, showToast]);

  // Delete specific note by ID
  const handleDeleteNoteById = useCallback(async (id: string) => {
    const target = await db.notes.get(id);
    if (!target) return;

    if (isGuest && target.isOfficial) {
      showToast(locale === 'zh' ? '⚠️ 官方示例笔记仅馆长可删除，可点击右上角登录馆长！' : '⚠️ Official notes can only be deleted by Admin!');
      return;
    }

    await db.notes.update(id, { isDeleted: true, isDirty: true, updatedAt: Date.now() });
    
    // Sync remote deletion to Cloudflare D1
    deleteNoteRemote(id);

    showToast(locale === 'zh' ? '🗑 笔记已移入废纸篓' : '🗑 Note Moved to Trash');
    
    if (activeNote?.id === id) {
      const remaining = await getActiveNotes(isAdmin ? undefined : 'guest');
      if (remaining.length > 0) {
        setActiveNote(remaining[0]);
      } else {
        const next = await createNewNote('', [], { author: isAdmin ? 'admin' : 'guest', isOfficial: Boolean(isAdmin) });
        setActiveNote(next);
      }
    }
  }, [activeNote?.id, isGuest, isAdmin, locale, showToast]);

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
      // ⌘K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // ⌘\ or Ctrl+\ -> Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // ⌘N or Ctrl+N -> New Note
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote('');
      }
      // ⌘/ or Ctrl+/ -> Shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
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
      style={{ backgroundColor: theme.editorBg }}
      className="h-screen w-screen overflow-hidden text-neutral-800 flex flex-col selection:bg-pink-300 selection:text-pink-900 font-sans transition-colors duration-500 relative"
    >
      {/* 0. Live Ambient Atmospheric Particle World */}
      <ClayAtmosphereCanvas />

      {/* Top Cute Clay Header Bar (Responsive & Streamlined) */}
      <header 
        style={{ backgroundColor: `${theme.headerBg}ee` }}
        className="h-14 border-b border-amber-900/10 px-3 sm:px-6 flex items-center justify-between text-xs text-neutral-600 select-none shrink-0 backdrop-blur-md transition-colors duration-500 relative z-30"
      >
        {/* Left Actions: Back / Gallery / Sidebar toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Link to Portal Home */}
          <button
            type="button"
            onClick={() => {
              playPop();
              setRoute('home');
              window.location.hash = '#/';
            }}
            className="h-9 px-2.5 sm:px-3.5 rounded-full font-bubble font-bold text-xs bg-white/95 text-neutral-700 hover:text-pink-600 border-2 border-white shadow-3xs hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Return to Home Portal"
          >
            <Home className="w-3.5 h-3.5 text-pink-500" />
            <span className="hidden sm:inline">{locale === 'zh' ? '首页' : 'Home'}</span>
          </button>

          {/* Link to Gallery */}
          <button
            type="button"
            onClick={() => {
              playPop();
              setRoute('gallery');
              window.location.hash = '#/gallery';
            }}
            className="h-9 px-2.5 sm:px-3.5 rounded-full font-bubble font-bold text-xs bg-white/95 text-neutral-700 hover:text-rose-600 border-2 border-white shadow-3xs hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Return to Notes Gallery"
          >
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">{locale === 'zh' ? '笔记' : 'Gallery'}</span>
          </button>

          {/* Sidebar Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`h-9 px-2.5 sm:px-3 rounded-full border-2 border-white shadow-3xs hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-bubble font-bold text-xs ${
              isSidebarOpen ? `bg-gradient-to-r ${theme.primaryGradient} text-white border-white shadow-sm` : 'bg-white/95 text-neutral-700 hover:text-neutral-900'
            }`}
            title="Toggle Sidebar Drawer (⌘\)"
          >
            <PanelLeft className={`w-3.5 h-3.5 ${isSidebarOpen ? 'text-white' : 'text-neutral-500'}`} />
            <span className="hidden sm:inline">{locale === 'zh' ? '笔记列表' : 'Notes'}</span>
          </button>

          {/* Active Note Excerpt on Desktop */}
          <span className="text-neutral-300 hidden md:inline">/</span>
          <span className="text-neutral-600 font-bubble font-bold truncate max-w-[160px] lg:max-w-xs hidden md:inline">
            {activeNote?.excerpt || (locale === 'zh' ? '灵感笔记' : 'Notes & Thoughts')}
          </span>
        </div>

        {/* Right Actions: Desktop Full Bar + Mobile Compact Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Only: Toggle Pin */}
          {activeNote && (
            <button
              type="button"
              onClick={handleTogglePin}
              className={`hidden md:flex h-9 px-3.5 rounded-full text-xs font-bubble font-bold transition-all cursor-pointer border-2 shadow-3xs items-center gap-1 hover:scale-105 active:scale-95 ${
                activeNote.isPinned
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white/95 hover:bg-amber-50 text-neutral-600 border-white'
              }`}
              title="Pin Note"
            >
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeNote.isPinned ? 'Pinned' : 'Pin'}</span>
            </button>
          )}

          {/* Desktop Only: Export Markdown */}
          {activeNote && (
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="hidden md:flex h-9 px-3.5 rounded-full bg-white/95 hover:bg-pink-50 border-2 border-white text-neutral-700 hover:text-pink-600 text-xs font-bubble font-bold cursor-pointer transition-all shadow-3xs hover:scale-105 active:scale-95 items-center gap-1.5"
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
              className="hidden md:flex h-9 w-9 rounded-full bg-white/95 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 border-2 border-white shadow-3xs hover:scale-105 active:scale-95 transition-all items-center justify-center cursor-pointer"
              title="Delete Note (⌘⌫)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Desktop Only: Command Palette */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex h-9 px-3.5 rounded-full bg-white/95 hover:bg-neutral-50 border-2 border-white text-neutral-700 text-xs font-mono font-bold cursor-pointer transition-all shadow-3xs hover:scale-105 active:scale-95 items-center gap-1.5"
          >
            <span>Search</span>
            <kbd className="text-[10px] bg-neutral-100 px-1 py-0.2 rounded text-neutral-500 font-mono">⌘K</kbd>
          </button>

          {/* Desktop Only: Identity Pill */}
          <button
            type="button"
            onClick={() => {
              playPop();
              openAuthModal();
            }}
            className={`hidden md:flex h-9 px-3.5 rounded-full font-bubble font-bold text-xs border-2 border-white shadow-3xs hover:scale-105 active:scale-95 transition-all items-center gap-1.5 cursor-pointer shrink-0 ${
              isAdmin
                ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-900"
                : "bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
            }`}
            title={isAdmin ? (locale === 'zh' ? '馆长身份 (点击管理)' : 'Admin Mode') : (locale === 'zh' ? '当前为游客模式 (点击登录馆长)' : 'Guest Mode')}
          >
            <span>{isAdmin ? '👑' : '🌱'}</span>
            <span>{isAdmin ? (locale === 'zh' ? '馆长' : 'Admin') : (locale === 'zh' ? '游客' : 'Guest')}</span>
          </button>

          {/* Theme Switcher (Visible Everywhere) */}
          <button
            type="button"
            onClick={switchNextTheme}
            className="h-9 px-2.5 sm:px-3.5 rounded-full bg-white/95 text-neutral-700 hover:text-rose-600 text-xs font-bubble font-bold border-2 border-white shadow-3xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            title="Switch Clay Mood Theme Palette"
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
              className="h-9 w-9 rounded-full bg-white/95 text-neutral-700 hover:text-rose-600 border-2 border-white shadow-3xs flex items-center justify-center cursor-pointer active:scale-90"
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
                <div className="relative w-56 bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-3xl clay-card p-2.5 text-neutral-800 modal-card-enter z-10 flex flex-col gap-1 text-xs font-cute">
                  {/* Search */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCommandPaletteOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-neutral-100 transition text-left cursor-pointer"
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
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-amber-50 transition text-left cursor-pointer"
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
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-pink-50 transition text-left cursor-pointer"
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
                    className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-emerald-50 transition text-left cursor-pointer border-t border-neutral-100 pt-2"
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
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-rose-50 text-rose-600 transition text-left cursor-pointer"
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
      <div className="flex flex-1 overflow-hidden relative">
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
          style={{ backgroundColor: theme.editorBg }}
          className="flex-1 overflow-y-auto relative flex flex-col justify-between transition-colors duration-500"
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
              if (!guestNotesEnabled && !isAdmin) {
                showToast(locale === 'zh' ? '🔒 旅人创作已关闭，仅馆长可进入工作台' : '🔒 Workspace is restricted to Curator');
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
              if (!guestNotesEnabled && !isAdmin) {
                showToast(locale === 'zh' ? '🔒 旅人创作已关闭，仅馆长可进入工作台' : '🔒 Workspace is restricted to Curator');
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
              if (!guestNotesEnabled && !isAdmin) {
                showToast(locale === 'zh' ? '🔒 旅人创作已关闭，仅馆长可进入工作台' : '🔒 Workspace is restricted to Curator');
                openAuthModal();
                return;
              }
              setRoute('editor');
              window.location.hash = '#/editor';
            }}
            onGoToEditorWithNote={(note) => {
              if (!guestNotesEnabled && !isAdmin) {
                showToast(locale === 'zh' ? '🔒 旅人创作已关闭，仅馆长可进入工作台' : '🔒 Workspace is restricted to Curator');
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

        {route === 'danmaku' && (
          !danmakuEnabled ? (
            <div className="min-h-screen flex flex-col w-full relative select-none animate-in fade-in duration-300">
              <ClayHeader currentRoute="danmaku" onGoToEditor={() => { window.location.hash = '#/editor'; }} />
              <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-md p-8 sm:p-10 rounded-[38px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-3 border-white dark:border-white/10 shadow-2xl clay-card flex flex-col items-center text-center gap-4">
                  <span className="text-5xl select-none animate-bounce">💌</span>
                  <h3 className="font-bubble font-extrabold text-xl sm:text-2xl text-neutral-900 dark:text-neutral-100">
                    {locale === 'zh' ? '弹幕广场暂停开放' : 'Danmaku Plaza is Closed'}
                  </h3>
                  <p className="font-cute text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {locale === 'zh' 
                      ? '馆长当前关闭了弹幕广场互动通道，请漫游笔记或稍后再来！' 
                      : 'The Curator has temporarily paused public Danmaku messages. Enjoy reading notes or check back later!'}
                  </p>
                  <button
                    onClick={() => {
                      playPop();
                      window.location.hash = '#/';
                    }}
                    className={`mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r ${theme.primaryGradient} text-white font-bubble font-bold text-sm clay-btn shadow-md hover:scale-105 active:scale-95 transition cursor-pointer`}
                  >
                    {locale === 'zh' ? '🎈 返回乐园首页' : '🎈 Back to Home'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ClayDanmakuPlaza
              onGoToEditor={() => {
                if (!guestNotesEnabled && !isAdmin) {
                  showToast(locale === 'zh' ? '🔒 旅人创作已关闭，仅馆长可进入工作台' : '🔒 Workspace is restricted to Curator');
                  openAuthModal();
                  return;
                }
                setRoute('editor');
                window.location.hash = '#/editor';
              }}
            />
          )
        )}

        {route === 'editor' && renderEditorView()}
      </div>

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[400] animate-in fade-in slide-in-from-top-3 duration-200 px-5 py-2.5 rounded-2xl bg-neutral-900/95 dark:bg-neutral-800/95 border border-white/20 dark:border-white/10 text-white text-xs sm:text-sm font-bubble font-bold shadow-2xl backdrop-blur-xl flex items-center gap-2 select-none pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}

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
    </>
  );
};
