import Dexie, { type EntityTable } from 'dexie';
import { Note, TagCount } from '../types/note';

export interface AppMeta {
  key: string;
  value: unknown;
}

export class TagMeshDatabase extends Dexie {
  notes!: EntityTable<Note, 'id'>;
  meta!: EntityTable<AppMeta, 'key'>;

  constructor() {
    super('TagMeshMarkdownDB');
    this.version(1).stores({
      notes: 'id, updatedAt, createdAt, isPinned, isDeleted, isDirty, *tags',
      meta: 'key',
    });
  }
}

export const db = new TagMeshDatabase();

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `tm_${timestamp}_${randomStr}`;
}

/**
 * Extract first non-empty line as clean preview summary
 */
export function extractExcerptFromMarkdown(markdown: string, fallback = 'Empty note'): string {
  if (!markdown || !markdown.trim()) return fallback;
  
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 1. Clean markdown headings, lists, quotes, checkboxes
    let cleaned = trimmed
      .replace(/^[#>*`\-\d.]+\s*/, '')
      .replace(/\[[ x]\]\s*/, '')
      .trim();

    // 2. Clean image markdown ![alt](url) -> alt or [贴纸]
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_m, alt) => alt ? `${alt}` : '🖼️ [贴纸]');

    // 3. Clean link markdown [text](url) -> text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 4. Clean bold, italic, code
    cleaned = cleaned.replace(/[*_`~]/g, '').trim();

    if (cleaned) {
      return cleaned.length > 80 ? cleaned.substring(0, 77) + '...' : cleaned;
    }
  }
  
  return fallback;
}

/**
 * Extract all `#tag` occurrences from anywhere in the Markdown text
 */
export function extractTagsFromMarkdown(markdown: string): string[] {
  if (!markdown) return [];
  // Matches #hashtag with unicode support (Chinese/English/Alphanumeric/hyphen/underscore)
  const regex = /(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5-]+)/g;
  const tags = new Set<string>();
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const tag = `#${match[1].toLowerCase()}`;
    if (tag !== '#' && !tag.startsWith('#http')) {
      tags.add(tag);
    }
  }
  return Array.from(tags);
}

/**
 * Calculate word and character count
 */
export function countWordsAndChars(text: string): { wordCount: number; charCount: number } {
  if (!text) return { wordCount: 0, charCount: 0 };
  const clean = text.replace(/```[\s\S]*?```/g, '').replace(/[#*`_~[\]()>-]/g, ' ');
  const charCount = text.length;
  const cjkMatches = clean.match(/[\u4e00-\u9fa5]/g) || [];
  const latinMatches = clean.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const wordCount = cjkMatches.length + latinMatches.length;
  return { wordCount, charCount };
}

/**
 * Create a new note with zero friction
 */
export async function createNewNote(
  initialMarkdown: string = '',
  tags: string[] = [],
  options?: { author?: string; isOfficial?: boolean }
): Promise<Note> {
  const now = Date.now();
  const excerpt = extractExcerptFromMarkdown(initialMarkdown, 'Empty note');
  const extractedTags = Array.from(new Set([...tags, ...extractTagsFromMarkdown(initialMarkdown)]));
  const { wordCount, charCount } = countWordsAndChars(initialMarkdown);

  const isOfficial = options?.isOfficial !== undefined ? options.isOfficial : (options?.author === 'admin');
  const author = options?.author || (isOfficial ? 'admin' : 'guest');

  const note: Note = {
    id: generateId(),
    rawMarkdown: initialMarkdown,
    excerpt,
    tags: extractedTags,
    wordCount,
    charCount,
    version: 1,
    isPinned: false,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    isDirty: true,
    isOfficial,
    author,
  };

  await db.notes.put(note);
  return note;
}

/**
 * Ensures all existing notes have clear author and isOfficial separation
 */
export async function ensureNotesAuthorSeparation(): Promise<void> {
  try {
    const all = await db.notes.toArray();
    if (all.length === 0) return;

    for (const note of all) {
      let changed = false;
      const updates: Partial<Note> = {};

      // If it's one of sample notes or has no author, classify by official status
      if (note.id.startsWith('sample_') || note.isOfficial === true) {
        if (note.author !== 'admin' || note.isOfficial !== true) {
          updates.isOfficial = true;
          updates.author = 'admin';
          changed = true;
        }
      } else if (!note.author) {
        // Default unassigned note to guest
        updates.isOfficial = false;
        updates.author = 'guest';
        changed = true;
      }

      // Clean tags: filter out substring prefixes accidentally generated (e.g. #t or #ta when #tag exists)
      if (Array.isArray(note.tags) && note.tags.length > 1) {
        const cleanedTags = note.tags.filter((tag) => {
          const lower = tag.toLowerCase();
          const isPrefixOfAnother = note.tags.some(other => {
            const otherLower = other.toLowerCase();
            return otherLower !== lower && otherLower.startsWith(lower) && lower.length <= 3;
          });
          return !isPrefixOfAnother;
        });

        if (cleanedTags.length !== note.tags.length) {
          updates.tags = cleanedTags;
          changed = true;
        }
      }

      if (changed) {
        await db.notes.update(note.id, updates);
      }
    }
  } catch (e) {
    console.warn('ensureNotesAuthorSeparation warning:', e);
  }
}

/**
 * Get active non-deleted notes sorted by pinned and updatedAt
 */
export async function getActiveNotes(filterRole?: 'admin' | 'guest'): Promise<Note[]> {
  const all = await db.notes.toArray();
  return all
    .filter(n => {
      if (n.isDeleted) return false;
      if (filterRole) {
        if (filterRole === 'admin') return n.author === 'admin' || n.isOfficial === true;
        if (filterRole === 'guest') return n.author === 'guest' || (!n.isOfficial && n.author !== 'admin');
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
}

/**
 * Get the most recent active note or create a new one
 */
export async function getOrCreateActiveNote(options?: { author?: string; isOfficial?: boolean }): Promise<Note> {
  const filterRole = options?.author === 'admin' ? 'admin' : (options?.author === 'guest' ? 'guest' : undefined);
  const activeNotes = await getActiveNotes(filterRole);
  if (activeNotes.length > 0) {
    return activeNotes[0];
  }
  return await createNewNote('', [], options);
}

/**
 * Search notes in local IndexedDB
 */
export async function searchNotesLocal(query: string, tagFilter?: string, filterRole?: 'admin' | 'guest'): Promise<Note[]> {
  const activeNotes = await getActiveNotes(filterRole);
  const q = query.trim().toLowerCase();

  return activeNotes.filter((note) => {
    if (!note) return false;
    const tags = Array.isArray(note.tags) ? note.tags : [];

    // Filter by specific tag
    if (tagFilter) {
      if (tagFilter === '#untagged') {
        if (tags.length > 0) return false;
      } else if (tagFilter !== '#all') {
        if (!tags.some(t => typeof t === 'string' && t.toLowerCase() === tagFilter.toLowerCase())) {
          return false;
        }
      }
    }

    if (!q) return true;

    // Substring match in raw markdown, excerpt, or tags
    const inMarkdown = (note.rawMarkdown || '').toLowerCase().includes(q);
    const inExcerpt = (note.excerpt || '').toLowerCase().includes(q);
    const inTags = tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q));

    return inMarkdown || inExcerpt || inTags;
  });
}

/**
 * Aggregate all tags and their note counts (with optional role isolation)
 */
export async function getAllTagCounts(filterRole?: 'admin' | 'guest'): Promise<TagCount[]> {
  const notes = await getActiveNotes(filterRole);
  const map = new Map<string, number>();

  notes.forEach((note) => {
    if (!note) return;
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

  const list: TagCount[] = Array.from(map.entries()).map(([tag, count]) => ({
    tag,
    count,
  }));

  list.sort((a, b) => b.count - a.count);
  return list;
}

/**
 * Seed starter notes if empty
 */
export async function seedStarterNotesIfEmpty(sampleText?: string): Promise<Note> {
  const activeNotes = await getActiveNotes();
  if (activeNotes.length > 0) {
    return activeNotes[0];
  }

  const defaultStarter = `欢迎来到 #TagMesh 黏土乐园与极客知识库 🎈

这里彻底摒弃了传统繁重的“文件夹层级”与“起标题焦虑”。只需敲击键盘，随性在正文中写下你的灵感，并在任意位置插入 #标签（例如 #cloudflare、#架构、#clay）。

## 🌈 多维展示模式随心切换
- **🍱 便当瀑布流 (Bento Grid)**：错落有致的 3D 黏土卡片。
- **🌌 漂浮重力宇宙 (Floating Universe)**：失重漂浮、互动碰撞的灵感气泡。
- **🪐 星系引力拓扑网 (Galaxy Force Mesh)**：恒星与轨道行星力导向星图。
- **🃏 拍立得手账便签墙 (Polaroid Board)**：日系手账和纸胶带与微倾斜便签。
- **🎴 3D 轮播穿梭 (3D Carousel Deck)**：沉浸式 3D Coverflow 翻转卡片。
- **📜 紧凑时光卷轴 (Timeline Stream)**：高效按时间线排布的清单。

#tagmesh #linear #geek #minimalism #clay`;

  return await createNewNote(sampleText || defaultStarter);
}
