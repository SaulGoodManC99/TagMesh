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
  Minus,
  UploadCloud,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Note } from '../types/note';
import { db, getAllTagCounts, getOrCreateActiveNote } from '../db/dexie';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { markdownToHtml, htmlToMarkdown, extractExcerptFromMarkdown, countWordsAndChars } from './utils/markdown';
import { uploadImageToR2 } from '../services/api';
import Image from '@tiptap/extension-image';
import { HashtagExtension } from './extensions/HashtagExtension';
import { EmojiColonExtension } from './extensions/EmojiColonExtension';
import { ClayContextMenu } from './components/ClayContextMenu';
import { playPop, playChime, playSoftTick } from '../blog/utils/soundEffects';
import { triggerParticleBurst } from '../blog/utils/confetti';
import { format24HourDateTime } from '../blog/utils/dateFormatter';
import { useClayTheme } from '../blog/utils/clayThemes';
import { toast } from '../components/ClayToast';

export interface TagMeshEditorProps {
  note: Note | null;
  onNoteChange: (updatedNote: Note) => void;
  onTagClick?: (tag: string) => void;
}

const TAG_COLOR_PALETTES = [
  'bg-pink-100/90 dark:bg-pink-950/70 text-pink-700 dark:text-pink-200 border-pink-200 dark:border-pink-800/50 hover:bg-pink-200',
  'bg-purple-100/90 dark:bg-purple-950/70 text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-800/50 hover:bg-purple-200',
  'bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-200',
  'bg-teal-100/90 dark:bg-teal-950/70 text-teal-700 dark:text-teal-200 border-teal-200 dark:border-teal-800/50 hover:bg-teal-200',
  'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/50 hover:bg-amber-200',
  'bg-rose-100/90 dark:bg-rose-950/70 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-800/50 hover:bg-rose-200',
  'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-200',
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
  const { isAdmin, openAuthModal } = useAuth();
  const isTrashNote = Boolean(note?.isDeleted);
  const isNoteProtected = isTrashNote;

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

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 100% Real-time dynamic live query for all tags in the database
  const allDbTags = useLiveQuery(() => getAllTagCounts(), []) || [];

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

  const editorRef = useRef<any>(null);

  /**
   * Upload image file to Cloudflare R2 (or fallback to local base64/blob) and insert into TipTap editor
   */
  const handleUploadAndInsertImage = useCallback(async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    playSoftTick();

    try {
      const res = await uploadImageToR2(file);
      if (res.success && res.url) {
        if (editorRef.current) {
          editorRef.current.chain().focus().setImage({ src: res.url, alt: file.name || 'image' }).run();
        }
        playChime();
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 25);
      } else {
        // Fallback: Local Base64 so user is never blocked
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          if (src && editorRef.current) {
            editorRef.current.chain().focus().setImage({ src, alt: file.name || 'image' }).run();
            playPop();
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('[Image Upload Fallback]', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src && editorRef.current) {
          editorRef.current.chain().focus().setImage({ src, alt: file.name || 'image' }).run();
          playPop();
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
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
          ? '写下此刻的灵感... 敲击 #标签 即可随心分类，敲击 :表情 唤起表情，支持直接 Ctrl+V 粘贴截图 ✨'
          : 'Write down your spark... Type #tag to categorize, type :emoji for smileys, Ctrl+V to paste screenshots ✨',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      CharacterCount,
      Image.configure({ inline: true, allowBase64: true }),
      HashtagExtension.configure({
        filterRole: isAdmin ? undefined : 'guest',
        onTagAbsorb: (tag) => {
          handleDirectTagAbsorb(tag);
        },
      }),
      EmojiColonExtension,
    ],
    content: note ? markdownToHtml(note.rawMarkdown || '') : '',
    editable: !isNoteProtected,
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleUploadAndInsertImage(file);
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleUploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (!note || !activeNoteIdRef.current) return;

      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      const excerpt = extractExcerptFromMarkdown(markdown, 'Untitled note');
      const { wordCount, charCount } = countWordsAndChars(markdown);
      const currentTags = activeNoteTagsRef.current || [];

      db.notes.update(activeNoteIdRef.current, {
        rawMarkdown: markdown,
        excerpt,
        tags: currentTags,
        wordCount,
        charCount,
        isDirty: true,
        updatedAt: Date.now(),
      });

      onNoteChange({
        ...note,
        rawMarkdown: markdown,
        excerpt,
        tags: currentTags,
        wordCount,
        charCount,
        isDirty: true,
        updatedAt: Date.now(),
      });
    },
  });

  // Keep editorRef current
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

  const formattedDate = note ? format24HourDateTime(note.createdAt || Date.now(), locale) : '';

  // Synchronize read-only protection state to TipTap editor
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isNoteProtected);
    }
  }, [editor, isNoteProtected]);

  return (
    <div className="w-full h-full flex-1 mx-auto animate-in fade-in duration-300 min-h-0 flex flex-col">
      {/* Clay Paper Pad Workspace */}
      <div 
        onContextMenu={isNoteProtected ? undefined : handleEditorContextMenu}
        style={{ backgroundColor: `${theme.headerBg}c8` }}
        className="relative w-full h-full rounded-[28px] sm:rounded-[36px] backdrop-blur-2xl border-2 sm:border-3 border-white/70 dark:border-white/15 shadow-xl clay-card p-4 sm:p-6 md:p-8 flex flex-col justify-between transition-all text-neutral-800 dark:text-neutral-100 overflow-hidden min-h-0"
      >

        {/* 🗑️ Trash Note Preview Banner */}
        {isTrashNote && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-stone-100 dark:bg-neutral-800 border-2 border-stone-300 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-cute text-stone-800 dark:text-neutral-200 select-none animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">🗑️</span>
              <div>
                <div className="font-bubble font-bold text-sm sm:text-base text-stone-900 dark:text-white flex items-center gap-1.5">
                  <span>{locale === 'zh' ? '废纸篓预览 • 该笔记已被删除（只读预览中）' : 'Trash Preview • Note is in Recycle Bin'}</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-neutral-400 mt-0.5">
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

        {/* 1. Top Clean Meta Bar */}
        <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-white/60 dark:border-white/10 select-none text-sm font-cute text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl select-none">✍️</span>
            <span className="font-bubble font-bold text-neutral-800 dark:text-neutral-100 text-base sm:text-lg">
              {formattedDate}
            </span>

            {/* Note Visibility Switcher (Public vs Private) */}
            {note && !isTrashNote && (
              <button
                type="button"
                onClick={async () => {
                  const nextPublic = note.isPublic === false ? true : false;
                  playPop(640);
                  await db.notes.update(note.id, { isPublic: nextPublic, isDirty: true, updatedAt: Date.now() });
                  onNoteChange({ ...note, isPublic: nextPublic });
                  toast.show(
                    nextPublic 
                      ? (locale === 'zh' ? '🌐 笔记已设为「展厅公开」' : '🌐 Note is now Public in gallery') 
                      : (locale === 'zh' ? '🔒 笔记已设为「仅自己可见」' : '🔒 Note is now Private'),
                    'info'
                  );
                }}
                className={`px-2.5 py-0.5 rounded-xl text-xs font-bubble font-bold border transition cursor-pointer flex items-center gap-1 shadow-3xs active:scale-95 ${
                  note.isPublic !== false
                    ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800 hover:bg-sky-200 dark:hover:bg-sky-900'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                }`}
                title={locale === 'zh' ? '点击切换公开 / 私密可见性' : 'Toggle Public / Private visibility'}
              >
                <span>{note.isPublic !== false ? '🌐' : '🔒'}</span>
                <span>{note.isPublic !== false ? (locale === 'zh' ? '展厅公开' : 'Public') : (locale === 'zh' ? '仅自己可见' : 'Private')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 font-medium flex-wrap">

            {/* R2 Image / Screenshot Upload Button */}
            {!isNoteProtected && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadAndInsertImage(file);
                      e.target.value = '';
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => {
                    playPop(560);
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-900/60 text-xs font-bubble font-bold transition-all cursor-pointer active:scale-95 shadow-3xs disabled:opacity-50"
                  title={locale === 'zh' ? '上传图片至 R2 (支持直接 Ctrl+V 粘贴截图)' : 'Upload image to R2 (Ctrl+V supported)'}
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                  )}
                  <span>
                    {isUploadingImage
                      ? (locale === 'zh' ? 'R2 上传中...' : 'Uploading...')
                      : (locale === 'zh' ? '图片 / 截屏' : 'Image')}
                  </span>
                </button>
              </>
            )}

            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              <span className="font-bubble font-bold text-neutral-700 dark:text-neutral-300">{note?.wordCount || 0}</span> {locale === 'zh' ? '字' : 'words'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="font-bubble font-bold text-neutral-700 dark:text-neutral-300">{note?.charCount || 0}</span> {locale === 'zh' ? '字符' : 'chars'}
            </span>
          </div>
        </div>

        {/* 2. Pure Distraction-Free Writing Canvas (Zero intrusive popup menus) */}
        <div className="relative flex-1 overflow-y-auto min-h-0 custom-scrollbar cursor-text py-2 pr-1 select-text">
          <EditorContent editor={editor} />
        </div>

        {/* 4. Bottom 3D Macaron Pill Tag Dock (精美轻盈的灵感胶囊收纳盒) */}
        <div className="shrink-0 mt-2 pt-3 border-t border-white/60 dark:border-white/10 select-none">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bubble font-bold text-neutral-800 dark:text-neutral-100">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <TagIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span>{locale === 'zh' ? '灵感标签收纳盒' : 'Tag Capsule Dock'}</span>
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 sm:px-2.5 py-0.5 rounded-xl font-bubble font-bold border border-rose-200 dark:border-rose-900">
                <ArrowDownAZ className="w-3 h-3" />
                <span>{sortedActiveTags.length}</span>
              </span>
            </div>

            <span className="text-xs font-cute text-neutral-400 dark:text-neutral-500 hidden sm:inline">
              {locale === 'zh' ? '正文中敲击 #标签 自动吸附收纳于此' : 'Type #tag in text to auto-absorb here'}
            </span>
          </div>

          {/* Sleek Horizontal Wrapping Macaron Candy Pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {sortedActiveTags.map((tg) => {
              const colorClass = getTagColorClass(tg);
              const tagDbInfo = allDbTags.find(t => t.tag.toLowerCase() === tg.toLowerCase());

              return (
                <div
                  key={tg}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
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
                  className={`group/tag inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border shadow-3xs cursor-pointer transition-all hover:scale-105 active:scale-95 ${colorClass}`}
                >
                  <Hash className="w-3.5 h-3.5 opacity-60" />
                  <span className="font-mono font-bold text-xs sm:text-[13px] leading-none">
                    {tg.replace(/^#/, '')}
                  </span>
                  {tagDbInfo && tagDbInfo.count > 1 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-white/70 text-neutral-700">
                      {tagDbInfo.count}
                    </span>
                  )}

                  {/* Remove Tag Button (Disabled on protected notes) */}
                  {!isNoteProtected && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(tg, e)}
                      className="ml-0.5 p-0.5 rounded-md hover:bg-black/15 text-neutral-500 hover:text-rose-700 transition cursor-pointer"
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-rose-300 dark:border-rose-700 shadow-sm animate-in fade-in">
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
                      className="bg-transparent font-mono text-neutral-800 dark:text-neutral-100 text-xs focus:outline-none w-28"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => handleAppendTag(newTagInput, e)}
                      className="p-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(false)}
                      className="p-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 transition cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-pink-50 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 font-bubble text-xs font-bold border border-neutral-200 dark:border-white/10 shadow-3xs transition cursor-pointer active:scale-95"
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
    </div>
  );
};
