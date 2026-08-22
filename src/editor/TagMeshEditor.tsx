import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Tag as TagIcon,
  Plus,
  X,
  Check,
  Hash,
  Clock,
  FileText,
  MousePointerClick,
  Layers,
  ArrowDownAZ,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Undo,
  Redo,
  Sparkles,
  Smile,
  Minus
} from 'lucide-react';
import { Note } from '../types/note';
import { db, getAllTagCounts, getOrCreateActiveNote, extractTagsFromMarkdown } from '../db/dexie';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { markdownToHtml, htmlToMarkdown, extractExcerptFromMarkdown, countWordsAndChars } from './utils/markdown';
import Image from '@tiptap/extension-image';
import { HashtagExtension } from './extensions/HashtagExtension';
import { EmojiColonExtension } from './extensions/EmojiColonExtension';
import { ClayContextMenu } from './components/ClayContextMenu';
import { ClayEmojiPickerModal } from './components/ClayEmojiPickerModal';
import { EmojiItem } from './data/emojiMemeData';
import { playPop, playChime, playSoftTick } from '../blog/utils/soundEffects';
import { triggerParticleBurst } from '../blog/utils/confetti';
import { useClayTheme } from '../blog/utils/clayThemes';

export interface TagMeshEditorProps {
  note: Note | null;
  onNoteChange: (updatedNote: Note) => void;
  onTagClick?: (tag: string) => void;
}

const TAG_COLOR_PALETTES = [
  'bg-pink-100/90 text-pink-700 border-pink-200 hover:bg-pink-200',
  'bg-purple-100/90 text-purple-700 border-purple-200 hover:bg-purple-200',
  'bg-indigo-100/90 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
  'bg-teal-100/90 text-teal-700 border-teal-200 hover:bg-teal-200',
  'bg-amber-100/90 text-amber-800 border-amber-200 hover:bg-amber-200',
  'bg-rose-100/90 text-rose-700 border-rose-200 hover:bg-rose-200',
  'bg-emerald-100/90 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
];

function getTagColorClass(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTES.length;
  return TAG_COLOR_PALETTES[index];
}

export const TagMeshEditor: React.FC<TagMeshEditorProps> = ({
  note,
  onNoteChange,
  onTagClick,
}) => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();
  const { isAdmin, isGuest, openAuthModal } = useAuth();
  const isTrashNote = Boolean(note?.isDeleted);
  // Guest can ONLY edit their own created notes (author === 'guest' and not official); trash notes are always protected
  const isNoteProtected = Boolean(
    isTrashNote || (isGuest && (note?.isOfficial === true || note?.author === 'admin' || (note?.author && note.author !== 'guest')))
  );

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Right click context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  // Emoji Picker Modal
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // 100% Real-time dynamic live query for all tags in the database
  const allDbTags = useLiveQuery(() => getAllTagCounts(isAdmin ? undefined : 'guest'), [isAdmin]) || [];

  // Keep a ref to active note id to prevent stale closures
  const activeNoteIdRef = useRef<string | null>(null);
  const activeNoteTagsRef = useRef<string[]>([]);

  useEffect(() => {
    activeNoteIdRef.current = note?.id || null;
    activeNoteTagsRef.current = note?.tags || [];
  }, [note?.id, note?.tags]);

  /**
   * Absorb tag directly into the note's tags array (Zero clutter in prose body)
   */
  const handleDirectTagAbsorb = useCallback((rawTag: string, clientX?: number, clientY?: number) => {
    if (!rawTag.trim() || !activeNoteIdRef.current) return;

    let cleanTag = rawTag.trim();
    if (!cleanTag.startsWith('#')) cleanTag = `#${cleanTag}`;

    const currentTags = activeNoteTagsRef.current || [];
    const exists = currentTags.some(t => t.toLowerCase() === cleanTag.toLowerCase());

    if (!exists) {
      const updatedTags = [...currentTags, cleanTag].sort((a, b) => 
        a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
      );

      activeNoteTagsRef.current = updatedTags;

      if (clientX !== undefined && clientY !== undefined) {
        triggerParticleBurst(clientX, clientY, 20);
        playChime();
      }

      db.notes.update(activeNoteIdRef.current, {
        tags: updatedTags,
        isDirty: true,
        updatedAt: Date.now(),
      });

      if (note) {
        onNoteChange({
          ...note,
          tags: updatedTags,
          isDirty: true,
          updatedAt: Date.now(),
        });
      }
    }
  }, [note, onNoteChange]);

  /**
   * Handle Emoji selection from modal
   */
  const handleSelectEmojiItem = useCallback((item: EmojiItem) => {
    if (!editor) return;

    if (item.type === 'emoji') {
      editor.chain().focus().insertContent(item.value).run();
    } else {
      editor.chain().focus().setImage({ src: item.value, alt: item.nameZh }).run();
    }
    setEmojiPickerOpen(false);
  }, []);

  // TipTap editor instance setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: { depth: 100 },
      }),
      Placeholder.configure({
        placeholder: locale === 'zh'
          ? '写下此刻的灵感... 敲击 #标签 即可随心分类，敲击 :表情 唤起表情 ✨'
          : 'Write down your spark... Type #tag to categorize, type :emoji for smileys ✨',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      CharacterCount,
      Image.configure({ inline: true, allowBase64: true }),
      HashtagExtension.configure({
        onTagAbsorb: (tag) => {
          handleDirectTagAbsorb(tag);
        },
      }),
      EmojiColonExtension,
    ],
    content: note ? markdownToHtml(note.rawMarkdown || '') : '',
    editable: !isNoteProtected,
    onUpdate: ({ editor }) => {
      if (!note || !activeNoteIdRef.current) return;

      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      const excerpt = extractExcerptFromMarkdown(markdown, 'Untitled note');
      const { wordCount, charCount } = countWordsAndChars(markdown);

      // Dynamically extract any typed inline tags and absorb into TAG dock
      const inlineTags = extractTagsFromMarkdown(markdown);
      const currentTags = activeNoteTagsRef.current || [];
      const mergedTags = Array.from(new Set([...currentTags, ...inlineTags])).sort((a, b) =>
        a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
      );

      const hasNewTags = mergedTags.length !== currentTags.length;
      if (hasNewTags) {
        activeNoteTagsRef.current = mergedTags;
      }

      const finalTags = hasNewTags ? mergedTags : currentTags;

      db.notes.update(activeNoteIdRef.current, {
        rawMarkdown: markdown,
        excerpt,
        tags: finalTags,
        wordCount,
        charCount,
        isDirty: true,
        updatedAt: Date.now(),
      });

      onNoteChange({
        ...note,
        rawMarkdown: markdown,
        excerpt,
        tags: finalTags,
        wordCount,
        charCount,
        isDirty: true,
        updatedAt: Date.now(),
      });
    },
  });

  // Keep editor content in sync when active note changes
  useEffect(() => {
    if (!editor || !note) return;

    const currentMarkdown = htmlToMarkdown(editor.getHTML());
    if (currentMarkdown.trim() !== (note.rawMarkdown || '').trim()) {
      editor.commands.setContent(markdownToHtml(note.rawMarkdown || ''));
    }
  }, [note?.id, editor]);

  const handleEditorContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    playPop(550);
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleAppendTag = (tagToAdd: string, e?: React.MouseEvent) => {
    if (!tagToAdd.trim()) return;

    let cleanTag = tagToAdd.trim();
    if (!cleanTag.startsWith('#')) cleanTag = `#${cleanTag}`;

    handleDirectTagAbsorb(cleanTag, e?.clientX, e?.clientY);

    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note || !activeNoteIdRef.current) return;

    playPop(480);
    triggerParticleBurst(e.clientX, e.clientY, 15);

    const updatedTags = (activeNoteTagsRef.current || []).filter(
      (t) => t.toLowerCase() !== tagToRemove.toLowerCase()
    );

    activeNoteTagsRef.current = updatedTags;

    db.notes.update(activeNoteIdRef.current, {
      tags: updatedTags,
      isDirty: true,
      updatedAt: Date.now(),
    });

    onNoteChange({
      ...note,
      tags: updatedTags,
      isDirty: true,
      updatedAt: Date.now(),
    });
  };

  const activeNoteTags = note?.tags || [];
  const sortedActiveTags = useMemo(() => {
    return [...activeNoteTags].sort((a, b) => 
      a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
    );
  }, [activeNoteTags]);

  const readMinutes = Math.max(1, Math.ceil((note?.wordCount || 50) / 200));

  const formattedDate = note
    ? new Date(note.createdAt || Date.now()).toLocaleDateString(
        locale === 'zh' ? 'zh-CN' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : '';

  // Synchronize read-only protection state to TipTap editor
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isNoteProtected);
    }
  }, [editor, isNoteProtected]);

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-8 py-3 sm:py-8 animate-in fade-in duration-300">
      {/* Clay Paper Pad Workspace */}
      <div 
        onContextMenu={isNoteProtected ? undefined : handleEditorContextMenu}
        className="relative w-full rounded-[24px] sm:rounded-[44px] bg-[#fdfbf7] border-2 sm:border-4 border-white shadow-lg sm:shadow-2xl clay-card p-3.5 sm:p-10 md:p-14 overflow-hidden flex flex-col justify-between min-h-[72vh] sm:min-h-[82vh] transition-all"
      >
        {/* Top Rainbow Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 sm:h-2.5 bg-gradient-to-r from-pink-400 via-rose-400 via-amber-300 to-cyan-400" />

        {/* 🗑️ Trash Note Preview Banner */}
        {isTrashNote && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-stone-100 border-2 border-stone-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-cute text-stone-800 select-none animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">🗑️</span>
              <div>
                <div className="font-bubble font-bold text-sm sm:text-base text-stone-900 flex items-center gap-1.5">
                  <span>{locale === 'zh' ? '废纸篓预览 • 该手账已被删除（只读预览中）' : 'Trash Preview • Note is in Recycle Bin'}</span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  {locale === 'zh'
                    ? '若想继续编辑，请点击右侧「恢复放回工作台」，或点击「永久粉碎」彻底清除。'
                    : 'Click Restore to put back into active workspace, or Purge to delete permanently.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  if (!note) return;
                  playChime();
                  await db.notes.update(note.id, { isDeleted: false, isDirty: true, updatedAt: Date.now() });
                  onNoteChange({ ...note, isDeleted: false });
                }}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bubble font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                {locale === 'zh' ? '↺ 恢复放回工作台' : '↺ Restore Note'}
              </button>
            </div>
          </div>
        )}

        {/* 🔒 Guest Mode Protection Banner for Admin/Other Notes (when not in trash) */}
        {!isTrashNote && isNoteProtected && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-amber-50/95 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-cute text-amber-900 select-none animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">🔒</span>
              <div>
                <div className="font-bubble font-bold text-sm sm:text-base text-neutral-900 flex items-center gap-1.5">
                  <span>
                    {note?.isOfficial || note?.author === 'admin'
                      ? (locale === 'zh' ? '👑 馆长官方精选手账 • 只读保护生效中' : '👑 Curator Card • Read-Only Active')
                      : (locale === 'zh' ? '🔒 他人手账 • 游客只读保护生效中' : '🔒 Protected Note • Read-Only Active')}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  {locale === 'zh'
                    ? '当前为游客模式，不可修改他人手账。请点击右上角「新建」创建属于你的专属灵感手账！'
                    : 'Other notes are protected from editing in guest mode. Click "New" to start your own note!'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-900 font-bubble font-extrabold text-xs shadow-xs hover:scale-105 active:scale-95 transition shrink-0 cursor-pointer"
            >
              {locale === 'zh' ? '👑 登录馆长解锁' : '👑 Admin Unlock'}
            </button>
          </div>
        )}

        {/* 1. Top Clean Meta Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-amber-900/10 select-none text-sm font-cute text-neutral-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl select-none">✍️</span>
            <span className="font-bubble font-bold text-neutral-800 text-base sm:text-lg">
              {formattedDate}
            </span>
            {note?.author === 'admin' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-xs font-bubble font-extrabold shadow-3xs">
                👑 馆长精选
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bubble font-bold shadow-3xs">
                🌱 旅人手账
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 font-medium flex-wrap">
            {/* Emoji Picker Button */}
            {!isNoteProtected && (
              <button
                type="button"
                onClick={() => {
                  playPop(580);
                  setEmojiPickerOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/10 to-amber-500/10 hover:from-pink-500/20 hover:to-amber-500/20 text-rose-600 border border-rose-200/80 text-xs font-bubble font-bold transition-all cursor-pointer active:scale-95 shadow-3xs"
                title={locale === 'zh' ? '插入情绪表情与手势' : 'Insert Emojis & Gestures'}
              >
                <Smile className="w-3.5 h-3.5 text-rose-500" />
                <span>{locale === 'zh' ? '表情 / 手势' : 'Emojis'}</span>
              </button>
            )}

            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              <span className="font-mono font-bold text-neutral-700">{note?.wordCount || 0}</span> 字
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>{readMinutes} min read</span>
            </span>
          </div>
        </div>

        {/* 2. Pure Distraction-Free Writing Canvas with Generous Breathing Space */}
        <div className="relative flex-1 cursor-text py-2">
          <EditorContent editor={editor} />
        </div>

        {/* 4. Bottom 3D Macaron Pill Tag Dock (精美轻盈的灵感胶囊收纳盒) */}
        <div className="mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-amber-900/10 select-none">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bubble font-bold text-neutral-800">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-xs">
                <TagIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span>{locale === 'zh' ? '灵感标签收纳盒' : 'Tag Capsule Dock'}</span>
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-rose-600 bg-rose-50 px-2 sm:px-2.5 py-0.5 rounded-full font-mono font-bold border border-rose-200">
                <ArrowDownAZ className="w-3 h-3" />
                <span>{sortedActiveTags.length}</span>
              </span>
            </div>

            <span className="text-xs font-cute text-neutral-400 hidden sm:inline">
              {locale === 'zh' ? '正文中敲击 #标签 自动吸附收纳于此' : 'Type #tag in text to auto-absorb here'}
            </span>
          </div>

          {/* Sleek Horizontal Wrapping Macaron Candy Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {sortedActiveTags.map((tg) => {
              const colorClass = getTagColorClass(tg);
              const tagDbInfo = allDbTags.find(t => t.tag.toLowerCase() === tg.toLowerCase());

              return (
                <div
                  key={tg}
                  onMouseDown={(e) => e.preventDefault()}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    playPop(620);
                    onTagClick?.(tg);
                  }}
                  className={`group/tag inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-3xs cursor-pointer transition-all hover:scale-105 active:scale-95 ${colorClass}`}
                >
                  <Hash className="w-3.5 h-3.5 opacity-60" />
                  <span className="font-mono font-bold text-xs sm:text-[13px] leading-none">
                    {tg.replace(/^#/, '')}
                  </span>
                  {tagDbInfo && tagDbInfo.count > 1 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white/70 text-neutral-700">
                      {tagDbInfo.count}
                    </span>
                  )}

                  {/* Remove Tag Button (Disabled on protected notes) */}
                  {!isNoteProtected && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(tg, e)}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-black/15 text-neutral-500 hover:text-rose-700 transition cursor-pointer"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Quick Add Tag Pill */}
            {!isNoteProtected && (
              <>
                {isAddingTag ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-rose-300 shadow-sm animate-in fade-in">
                    <span className="text-neutral-400 font-mono text-xs font-bold">#</span>
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAppendTag(newTagInput, e as any);
                        if (e.key === 'Escape') setIsAddingTag(false);
                      }}
                      placeholder={locale === 'zh' ? '输入标签名...' : 'Tag name...'}
                      className="bg-transparent font-mono text-neutral-800 text-xs focus:outline-none w-28"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => handleAppendTag(newTagInput, e)}
                      className="p-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(false)}
                      className="p-1 rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      playPop(560);
                      setIsAddingTag(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-pink-50 text-neutral-600 hover:text-rose-600 font-bubble text-xs font-bold border border-neutral-200 shadow-3xs transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-500" />
                    <span>{locale === 'zh' ? '加标签' : 'Add Tag'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Click Clay Context Menu */}
      <ClayContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 } })}
        onInsertCodeBlock={(lang) => {
          editor?.chain().focus().toggleCodeBlock().run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertTag={() => {
          setIsAddingTag(true);
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertHeading={(level) => {
          editor?.chain().focus().toggleHeading({ level }).run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertTaskList={() => {
          editor?.chain().focus().toggleTaskList().run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertQuote={() => {
          editor?.chain().focus().toggleBlockquote().run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertBulletList={() => {
          editor?.chain().focus().toggleBulletList().run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertOrderedList={() => {
          editor?.chain().focus().toggleOrderedList().run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertBold={() => {
          editor?.chain().focus().toggleBold().run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onInsertDivider={() => {
          editor?.chain().focus().setHorizontalRule().run();
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onCopyAllMarkdown={() => {
          if (note?.rawMarkdown) {
            navigator.clipboard.writeText(note.rawMarkdown);
            playChime();
          }
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Emoji Picker Modal */}
      <ClayEmojiPickerModal
        isOpen={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onSelectEmoji={handleSelectEmojiItem}
      />
    </div>
  );
};
