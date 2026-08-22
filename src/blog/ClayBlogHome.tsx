import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PenTool, Layers, Compass, ArrowLeft, RefreshCw } from 'lucide-react';
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
  const [activeReadingNote, setActiveReadingNote] = useState<Note | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // When 'all' is selected, retrieve ALL notes regardless of role
  const effectiveRole = authorFilter === 'all' ? undefined : authorFilter;

  // Dynamic Live Query with refreshTick dependency
  const rawNotes = useLiveQuery(
    () => getActiveNotes(effectiveRole),
    [effectiveRole, refreshTick]
  );

  const allNotes = useMemo(() => rawNotes || [], [rawNotes]);

  // Live Query all tag counts (role-aware)
  const allTagCounts = useLiveQuery(
    () => getAllTagCounts(effectiveRole),
    [effectiveRole, refreshTick]
  ) || [];

  // Dynamic Manual & Auto Refresh Handler
  const handleDynamicRefresh = useCallback(async () => {
    playPop();
    setIsRefreshing(true);
    setRefreshTick((t) => t + 1);
    try {
      const remoteNotes = await fetchRemoteNotes();
      if (remoteNotes && remoteNotes.length > 0) {
        for (const rNote of remoteNotes) {
          await db.notes.put({
            ...rNote,
            isDirty: false,
            syncedAt: rNote.syncedAt || Date.now(),
          });
        }
      }
    } catch {
      // ignore
    } finally {
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

  // Calculate live stats
  const totalNotes = publicNotes.length;
  const totalTags = allTagCounts.length;
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

      {/* Floating Dual Action Group: [ 🎡 切换展示模式 ] + [ ⬆️ 回到顶部 ] (Synced with theme color) */}
      <ClayFloatingActions
        viewMode={viewMode}
        onSelectMode={(m) => setViewMode(m)}
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
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">📚</span>
              <h2 className="font-bubble font-extrabold text-lg sm:text-2xl text-neutral-900 tracking-tight">
                {locale === 'zh' ? '灵感笔记空间' : 'Notes Space'}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs font-cute text-neutral-400 -mt-0.5 line-clamp-1">
              {locale === 'zh'
                ? `共收录 ${totalNotes} 篇笔记 • 5 大视界交互漫游`
                : `${totalNotes} notes exhibited • 5 Interactive Universes`}
            </p>
          </div>
        </div>

        {/* Author Dimension Filter Pills + Refresh Button + Active Tag Status */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end overflow-x-auto no-scrollbar">
          {/* Dynamic Sync / Refresh Button */}
          <button
            type="button"
            onClick={handleDynamicRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 hover:bg-pink-50 border border-neutral-200/80 shadow-3xs text-xs font-bubble font-bold text-neutral-700 hover:text-rose-600 transition cursor-pointer active:scale-90 shrink-0"
            title={locale === 'zh' ? '动态实时刷新笔记列表' : 'Dynamic Refresh Notes'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{locale === 'zh' ? '动态刷新' : 'Refresh'}</span>
          </button>

          {/* Author Switcher */}
          <div className="inline-flex p-1 rounded-2xl bg-white/95 border border-neutral-200/80 shadow-3xs text-xs font-bubble font-bold shrink-0">
            <button
              type="button"
              onClick={() => {
                playPop(520);
                setAuthorFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                authorFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <span>🌟 {locale === 'zh' ? '全部' : 'All'} ({publicNotes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPop(540);
                setAuthorFilter('admin');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                authorFilter === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-900 shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span>👑 {locale === 'zh' ? '馆长精选' : 'Curator'} ({adminNotesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPop(560);
                setAuthorFilter('guest');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
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
                setSelectedTag('#all');
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
        tags={allTagCounts}
        totalNotesCount={totalNotes}
        selectedTag={selectedTag}
        onSelectTag={(tg) => setSelectedTag(tg)}
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
          <>
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
          </>
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

            <button
              onClick={() => {
                playPop(520);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200/80 font-bubble font-bold text-neutral-700 shadow-3xs cursor-pointer transition"
            >
              {locale === 'zh' ? '⬆️ 回到顶部' : 'Top'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
