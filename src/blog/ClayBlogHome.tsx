import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PenTool, Layers, Compass, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Note } from '../types/note';
import { db, getAllTagCounts, getActiveNotes, ensureNotesAuthorSeparation } from '../db/dexie';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { deleteNoteRemote, fetchRemoteNotes } from '../services/api';
import { APP_VERSION, getFormattedBuildTime } from '../constants/version';

import { ClayHeader } from './ClayHeader';
import { ClayTagCloud } from './ClayTagCloud';
import { ViewMode } from './ClayModeDock';
import { BentoGridView } from './views/BentoGridView';
import { FloatingCanvasView } from './views/FloatingCanvasView';
import { PolaroidBoardView } from './views/PolaroidBoardView';
import { Carousel3DView } from './views/Carousel3DView';
import { TimelineListView } from './views/TimelineListView';
import { ClayReadingModal } from './ClayReadingModal';
import { ClayAtmosphereCanvas } from './components/ClayAtmosphereCanvas';
import { ClayFloatingActions } from './components/ClayFloatingActions';
import { playPop, playChime } from './utils/soundEffects';
import { useClayTheme } from './utils/clayThemes';

export interface ClayBlogHomeProps {
  onGoToEditor: () => void;
  onGoToEditorWithNote: (note: Note) => void;
  onOpenShortcuts?: () => void;
}

export const ClayBlogHome: React.FC<ClayBlogHomeProps> = ({
  onGoToEditor,
  onGoToEditorWithNote,
  onOpenShortcuts,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin, openAuthModal } = useAuth();

  const [selectedTag, setSelectedTag] = useState<string>('#all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [authorFilter, setAuthorFilter] = useState<'all' | 'admin' | 'guest'>('all');
  const [transitionType, setTransitionType] = useState<'slide-right' | 'slide-left' | 'view-switch'>('slide-right');
  const [activeReadingNote, setActiveReadingNote] = useState<Note | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAuthorFilterChange = (newFilter: 'all' | 'admin' | 'guest', pitch: number) => {
    playPop(pitch);
    const filterOrder: Record<'all' | 'admin' | 'guest', number> = { all: 0, admin: 1, guest: 2 };
    const currentOrder = filterOrder[authorFilter];
    const newOrder = filterOrder[newFilter];
    setTransitionType(newOrder >= currentOrder ? 'slide-right' : 'slide-left');
    setAuthorFilter(newFilter);

    // Smooth auto-fallback: If selected tag does not exist under target role, reset to #all
    if (selectedTag && selectedTag !== '#all' && selectedTag !== '#untagged') {
      const targetNotes = publicNotes.filter((note) => {
        if (!note) return false;
        if (newFilter === 'admin') return note.isOfficial === true || note.author === 'admin';
        if (newFilter === 'guest') return note.isOfficial !== true && note.author !== 'admin';
        return true;
      });
      const hasTag = targetNotes.some((n) =>
        (n.tags || []).some((t) => typeof t === 'string' && t.toLowerCase() === selectedTag.toLowerCase())
      );
      if (!hasTag) {
        setSelectedTag('#all');
      }
    }
  };

  const handleViewModeChange = (newMode: ViewMode) => {
    setTransitionType('view-switch');
    setViewMode(newMode);
  };

  const handleSelectTagWithTransition = (tg: string) => {
    setTransitionType('view-switch');
    setSelectedTag(tg);
  };

  // Dynamic Live Query: Retrieve all active notes so author badge counts always remain accurate
  const rawNotes = useLiveQuery(
    () => getActiveNotes(),
    [refreshTick]
  );

  const allNotes = useMemo(() => rawNotes || [], [rawNotes]);

  // Dynamic Manual & Auto Refresh Handler
  const handleDynamicRefresh = useCallback(async () => {
    playPop();
    setIsRefreshing(true);
    try {
      const remoteNotes = await fetchRemoteNotes();
      if (remoteNotes && remoteNotes.length > 0) {
        for (const rNote of remoteNotes) {
          const localNote = await db.notes.get(rNote.id);
          await db.notes.put({
            ...rNote,
            likes: typeof rNote.likes === 'number' && rNote.likes > 0 ? rNote.likes : (localNote?.likes || 0),
            isDirty: false,
            syncedAt: rNote.syncedAt || Date.now(),
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setRefreshTick((t) => t + 1);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  const handleDeleteNote = async (noteId: string) => {
    await db.notes.update(noteId, { isDeleted: true, isDirty: true, updatedAt: Date.now() });
    deleteNoteRemote(noteId);
  };

  // Auto seed on mount ONLY IF never seeded before & ensure separation of admin vs guest notes
  useEffect(() => {
    ensureNotesAuthorSeparation().then(async () => {
      const hasSeededGuest = typeof window !== 'undefined' && localStorage.getItem('tagmesh_has_seeded_guest_notes_v2') === 'true';
      if (!hasSeededGuest) {
        const { seed10GuestSampleNotes } = await import('../db/guestSampleNotes');
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

      const hasSeeded = typeof window !== 'undefined' && localStorage.getItem('tagmesh_has_seeded_sample_notes_v1') === 'true';
      if (!hasSeeded) {
        const notes = await getActiveNotes();
        if (notes.length === 0) {
          const { seed40SampleNotes } = await import('../db/sampleNotes');
          await seed40SampleNotes();
        }
      }
    });
  }, []);

  // Auto-refresh notes whenever window focuses, tab activates or hash route switches
  useEffect(() => {
    const onRefreshNeeded = () => {
      setRefreshTick((t) => t + 1);
    };
    window.addEventListener('focus', onRefreshNeeded);
    window.addEventListener('hashchange', onRefreshNeeded);
    document.addEventListener('visibilitychange', onRefreshNeeded);
    return () => {
      window.removeEventListener('focus', onRefreshNeeded);
      window.removeEventListener('hashchange', onRefreshNeeded);
      document.removeEventListener('visibilitychange', onRefreshNeeded);
    };
  }, []);

  // Parse mode and tag query params from URL hash (e.g. #/gallery?mode=timeline&tag=react)
  useEffect(() => {
    const handleHashParams = () => {
      const hash = window.location.hash;
      const queryIdx = hash.indexOf('?');
      if (queryIdx !== -1) {
        const queryString = hash.slice(queryIdx + 1);
        const params = new URLSearchParams(queryString);
        const modeParam = params.get('mode');
        const tagParam = params.get('tag');
        if (modeParam && ['grid', 'polaroid', 'timeline', 'carousel', 'floating'].includes(modeParam)) {
          setViewMode(modeParam as ViewMode);
        }
        if (tagParam) {
          setSelectedTag(tagParam.startsWith('#') ? tagParam : `#${tagParam}`);
        }
      }
    };
    handleHashParams();
    window.addEventListener('hashchange', handleHashParams);
    return () => window.removeEventListener('hashchange', handleHashParams);
  }, []);

  // Filter out #draft or #private notes for public blog view
  const publicNotes = useMemo(() => {
    return allNotes.filter((note) => {
      if (!note) return false;
      const tags = Array.isArray(note.tags) ? note.tags : [];
      const isDraftOrPrivate = tags.some((t) => {
        if (typeof t !== 'string') return false;
        const lower = t.toLowerCase();
        return lower === '#draft' || lower === '#private' || lower === '#草稿';
      });
      return !isDraftOrPrivate;
    });
  }, [allNotes]);

  // Dynamic Real-time Tag counts scoped strictly to active authorFilter
  const authorTagCounts = useMemo(() => {
    const targetNotes = publicNotes.filter((note) => {
      if (!note) return false;
      if (authorFilter === 'admin') {
        return note.isOfficial === true || note.author === 'admin';
      }
      if (authorFilter === 'guest') {
        return note.isOfficial !== true && note.author !== 'admin';
      }
      return true;
    });

    const map = new Map<string, number>();
    targetNotes.forEach((note) => {
      const tags = Array.isArray(note.tags) ? note.tags : [];
      tags.forEach((tag) => {
        if (typeof tag === 'string') {
          const clean = tag.trim().toLowerCase();
          if (clean) {
            map.set(clean, (map.get(clean) || 0) + 1);
          }
        }
      });
    });

    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [publicNotes, authorFilter]);

  // Calculate live stats
  const totalNotes = publicNotes.length;
  const totalTags = authorTagCounts.length;
  const adminNotesCount = useMemo(() => publicNotes.filter(n => n.isOfficial === true || n.author === 'admin').length, [publicNotes]);
  const guestNotesCount = useMemo(() => publicNotes.filter(n => n.isOfficial !== true && n.author !== 'admin').length, [publicNotes]);
  const totalWords = useMemo(() => {
    return publicNotes.reduce((acc, curr) => acc + (curr?.wordCount || 0), 0);
  }, [publicNotes]);

  // Filter notes by selected tag and author
  const filteredNotes = useMemo(() => {
    return publicNotes
      .filter((note) => {
        if (!note) return false;
        const tags = Array.isArray(note.tags) ? note.tags : [];

        // Author filter
        if (authorFilter === 'admin' && note.isOfficial !== true && note.author !== 'admin') {
          return false;
        }
        if (authorFilter === 'guest' && (note.isOfficial === true || note.author === 'admin')) {
          return false;
        }

        // Tag filter
        if (selectedTag && selectedTag !== '#all') {
          if (selectedTag === '#untagged') {
            if (tags.length > 0) return false;
          } else {
            const hasMatch = tags.some(
              (t) => t.toLowerCase() === selectedTag.toLowerCase()
            );
            if (!hasMatch) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notes first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by createdAt desc
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [publicNotes, selectedTag, authorFilter]);

  // Sync hash routing for articles
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/post\/(.+)$/);
      if (match) {
        const id = match[1];
        const found = publicNotes.find((n) => n.id === id);
        if (found) {
          setActiveReadingNote(found);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [publicNotes]);

  const handleCardClick = (note: Note) => {
    window.location.hash = `#/post/${note.id}`;
    setActiveReadingNote(note);
  };

  const handleCloseReadingModal = () => {
    window.location.hash = '#/gallery';
    setActiveReadingNote(null);
  };

  return (
    <div 
      style={{ backgroundColor: theme.bg }}
      className="min-h-screen text-neutral-800 flex flex-col selection:bg-pink-300 selection:text-pink-900 font-sans antialiased relative transition-colors duration-500 overflow-x-hidden"
    >
      {/* 0. Live Ambient Atmospheric Particle World */}
      <ClayAtmosphereCanvas />

      {/* Floating 3D Clay Action Dock: [ ⚡ 灵动快捷魔术坞 ] + [ 🎡 切换展示模式 ] + [ ⬆️ 回到顶部 ] */}
      <ClayFloatingActions
        viewMode={viewMode}
        onSelectMode={(m) => handleViewModeChange(m)}
        onRefresh={handleDynamicRefresh}
        isRefreshing={isRefreshing}
        onGoToEditor={onGoToEditor}
      />

      {/* Top Navigation Header */}
      <ClayHeader
        onGoToEditor={onGoToEditor}
        currentRoute="gallery"
      />

      {/* Compact Gallery Stage Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-8 pt-4 sm:pt-6 pb-2 select-none w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playPop();
              window.location.hash = '#/';
            }}
            className="p-2 sm:p-2.5 rounded-2xl bg-white hover:bg-pink-50 text-neutral-600 hover:text-pink-600 border border-neutral-200/80 shadow-3xs transition cursor-pointer active:scale-95 shrink-0"
            title="Back to Home Portal"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bubble text-lg sm:text-2xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 bg-clip-text text-transparent">
                {locale === 'zh' ? '旅人笔记' : 'Notes Space'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[11px] font-bubble font-bold border border-pink-200 shadow-3xs">
                <Sparkles className="w-3 h-3 text-pink-500" />
                <span>{locale === 'zh' ? '5 种笔记展示模式' : '5 Note Views'}</span>
              </span>
            </div>
            <p className="font-cute text-xs text-neutral-500 hidden sm:block mt-0.5">
              {locale === 'zh'
                ? `共收录 ${totalNotes} 篇笔记 • 5 种笔记展示模式自由切换`
                : `${totalNotes} notes exhibited • 5 Interactive Note Views`}
            </p>
          </div>
        </div>

        {/* Author Dimension Filter Pills + Active Tag Status */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end overflow-x-auto no-scrollbar">
          {/* Author Switcher */}
          <div className="inline-flex p-1 rounded-2xl bg-white/95 border border-neutral-200/80 shadow-3xs text-xs font-bubble font-bold shrink-0">
            <button
              type="button"
              onClick={() => handleAuthorFilterChange('all', 520)}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 hover:scale-105 ${
                authorFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <span>🌟 {locale === 'zh' ? '全部' : 'All'} ({publicNotes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleAuthorFilterChange('admin', 540)}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 hover:scale-105 ${
                authorFilter === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-900 shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span>👑 {locale === 'zh' ? '馆长精选' : 'Curator'} ({adminNotesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleAuthorFilterChange('guest', 560)}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 hover:scale-105 ${
                authorFilter === 'guest'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span>🌱 {locale === 'zh' ? '旅人笔记' : 'Guests'} ({guestNotesCount})</span>
            </button>
          </div>

          {/* Active Tag Filter Status with Clear X Button */}
          {selectedTag && selectedTag !== '#all' && (
            <button
              onClick={() => {
                playPop();
                handleSelectTagWithTransition('#all');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bubble text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 animate-in fade-in"
              title="Click to clear tag filter"
            >
              <span>🏷️ {selectedTag} ({filteredNotes.length})</span>
              <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px] ml-0.5">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Searchable & Multi-Sort Interactive Tag Mesh Pills */}
      <ClayTagCloud
        tags={authorTagCounts}
        totalNotesCount={authorFilter === 'admin' ? adminNotesCount : authorFilter === 'guest' ? guestNotesCount : totalNotes}
        selectedTag={selectedTag}
        onSelectTag={(tg) => handleSelectTagWithTransition(tg)}
        authorFilter={authorFilter}
      />

      {/* Main Full-Width Immersive 5-View Showcase Canvas */}
      <main className="w-full max-w-[1750px] mx-auto px-3 sm:px-8 pl-4 sm:pl-20 md:pl-24 py-4 flex-1">
        {rawNotes === undefined ? (
          <div className="text-center py-24 flex flex-col items-center justify-center">
            <span className="text-5xl select-none">🎈</span>
            <p className="font-bubble font-bold text-sm text-neutral-600 mt-4">
              {locale === 'zh' ? '正在连接笔记空间...' : 'Loading Notes...'}
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/80 clay-card max-w-md mx-auto my-8 border-3 border-white shadow-xl select-none">
            <div className="text-5xl mb-3 select-none">
              {authorFilter === 'admin' ? '👑' : authorFilter === 'guest' ? '🌱' : '🎈'}
            </div>
            <h3 className="font-bubble text-xl font-bold text-neutral-800 mb-1.5">
              {authorFilter === 'admin'
                ? (locale === 'zh' ? '暂无馆长官方笔记' : 'No curator notes')
                : authorFilter === 'guest'
                ? (locale === 'zh' ? '暂无旅人随笔笔记' : 'No guest notes')
                : (locale === 'zh' ? '当前分类暂无笔记' : 'No notes under this tag')}
            </h3>
            <p className="font-cute text-xs text-neutral-500 mb-6 max-w-xs mx-auto leading-relaxed">
              {authorFilter === 'admin'
                ? (locale === 'zh' ? '馆长尚未在当前标签下创作官方笔记，可在工作台以馆长身份新建。' : 'No curator notes under this tag.')
                : authorFilter === 'guest'
                ? (locale === 'zh' ? '还没有旅人在当前分类下留下笔记，快去工作台写下第一篇灵感吧！' : 'No guest notes yet. Create your first note in workspace!')
                : (locale === 'zh' ? '可以尝试切换其他标签，或前往工作台记录新的想法！' : 'Try switching tags or create a note in workspace!')}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onGoToEditor}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bubble text-xs font-bold clay-btn shadow-md cursor-pointer hover:shadow-lg hover:scale-105 active:scale-95 transition"
              >
                <PenTool className="w-4 h-4" />
                <span>{locale === 'zh' ? '🍮 前往灵感工作台 ➜' : '🍮 Go to Workspace ➜'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div 
            key={`${authorFilter}-${selectedTag}-${viewMode}`} 
            className={`w-full ${
              transitionType === 'slide-right'
                ? 'slide-in-right'
                : transitionType === 'slide-left'
                ? 'slide-in-left'
                : 'view-universe-enter'
            }`}
          >
            {/* View 1: Bento Grid */}
            {viewMode === 'grid' && (
                <BentoGridView
                  notes={filteredNotes}
                  onNoteClick={handleCardClick}
                  onTagClick={(tg) => setSelectedTag(tg)}
                />
              )}

              {/* View 2: Floating Universe */}
              {viewMode === 'floating' && (
                <FloatingCanvasView
                  notes={filteredNotes}
                  onNoteClick={handleCardClick}
                  onTagClick={(tg) => setSelectedTag(tg)}
                />
              )}

              {/* View 3: Polaroid Sticky Board */}
              {viewMode === 'polaroid' && (
                <PolaroidBoardView
                  notes={filteredNotes}
                  onNoteClick={handleCardClick}
                  onTagClick={(tg) => setSelectedTag(tg)}
                />
              )}

              {/* View 4: 3D Carousel Deck */}
              {viewMode === 'carousel' && (
                <Carousel3DView
                  notes={filteredNotes}
                  onNoteClick={handleCardClick}
                  onTagClick={(tg) => setSelectedTag(tg)}
                  onGoToEditorWithNote={onGoToEditorWithNote}
                />
              )}

              {/* View 5: Timeline Stream */}
              {viewMode === 'timeline' && (
                <TimelineListView
                  notes={filteredNotes}
                  onNoteClick={handleCardClick}
                  onTagClick={(tg) => setSelectedTag(tg)}
                />
              )}
            </div>
        )}
      </main>

      {/* Reading Showcase Modal */}
      <ClayReadingModal
        note={activeReadingNote}
        allNotes={filteredNotes}
        onClose={handleCloseReadingModal}
        onGoToEditorWithNote={(note) => {
          setActiveReadingNote(null);
          onGoToEditorWithNote(note);
        }}
        onTagClick={(tg) => {
          setSelectedTag(tg);
        }}
        onSelectNote={handleCardClick}
        onDeleteNote={handleDeleteNote}
      />

      {/* Clean & Elegant Minimal Gallery Footer */}
      <footer className="mt-12 py-8 px-4 border-t border-amber-900/10 bg-[#fdfbf7]/90 text-center select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-cute text-neutral-500">
          <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
            <span className="font-bubble font-bold text-neutral-700">TagMesh {APP_VERSION}</span>
            <span>•</span>
            <span>{totalNotes} {locale === 'zh' ? '篇笔记' : 'notes'}</span>
            <span>•</span>
            <span>{totalTags} {locale === 'zh' ? '个标签' : 'tags'}</span>
            <span>•</span>
            <span>{totalWords.toLocaleString()} {locale === 'zh' ? '字' : 'words'}</span>
            <span>•</span>
            <span className="text-neutral-400">☁️ {locale === 'zh' ? '部署时间' : 'Deployed'}: {getFormattedBuildTime(locale)}</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-neutral-600 flex-wrap justify-center">
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="hover:text-rose-600 transition cursor-pointer font-bold"
              >
                {locale === 'zh' ? '⌨️ 快捷键速查 (⌘/)' : 'Shortcuts (⌘/)'}
              </button>
            )}

            <button
              onClick={() => {
                playPop();
                window.location.hash = '#/';
              }}
              className="hover:text-pink-600 transition cursor-pointer font-bold"
            >
              {locale === 'zh' ? '🏰 返回乐园首页' : '🏰 Home Portal'}
            </button>

            <button
              onClick={() => {
                playPop();
                openAuthModal();
              }}
              className="px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bubble font-bold text-xs shadow-3xs cursor-pointer transition active:scale-95 flex items-center gap-1"
            >
              <span>👑</span>
              <span>{isAdmin ? (locale === 'zh' ? '馆长数据控制台' : 'Admin Console') : (locale === 'zh' ? '馆长入口' : 'Admin Portal')}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
