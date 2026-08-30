import { Note } from '../../src/types/note';

export interface DbNoteRow {
  id: string;
  raw_markdown: string;
  excerpt: string;
  tags_json: string;
  word_count: number;
  char_count: number;
  version: number;
  is_pinned: number;
  is_deleted: number;
  is_public?: number;
  created_at: number;
  updated_at: number;
  synced_at: number;
  author?: string;
  is_official?: number;
  likes?: number;
}

export function rowToNote(row: DbNoteRow): Note {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags_json || '[]');
  } catch {
    tags = [];
  }

  const isPublic = row.is_public !== undefined ? Boolean(row.is_public) : true;

  return {
    id: row.id,
    rawMarkdown: row.raw_markdown,
    excerpt: row.excerpt,
    tags,
    wordCount: row.word_count,
    charCount: row.char_count,
    version: row.version,
    isPinned: Boolean(row.is_pinned),
    isDeleted: Boolean(row.is_deleted),
    isPublic,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    isOfficial: true,
    author: 'admin',
    likes: Number(row.likes || 0),
  };
}

export async function getNoteById(db: D1Database, id: string): Promise<Note | null> {
  const row = await db
    .prepare('SELECT * FROM notes WHERE id = ?')
    .bind(id)
    .first<DbNoteRow>();

  return row ? rowToNote(row) : null;
}

export async function listNotes(db: D1Database, limit = 50, offset = 0, isPublicOnly = false): Promise<Note[]> {
  const sql = isPublicOnly
    ? 'SELECT * FROM notes WHERE is_deleted = 0 AND (is_public IS NULL OR is_public = 1) ORDER BY is_pinned DESC, updated_at DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM notes WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC LIMIT ? OFFSET ?';

  const { results } = await db
    .prepare(sql)
    .bind(limit, offset)
    .all<DbNoteRow>();

  return (results || []).map(rowToNote);
}

export async function syncNote(
  db: D1Database,
  note: Note,
  clientVersion: number
): Promise<{ success: boolean; note?: Note }> {
  const existing = await getNoteById(db, note.id);
  const now = Date.now();
  const nextVersion = existing ? existing.version + 1 : 1;
  const rawMarkdown = note.rawMarkdown ?? '';
  const excerpt = note.excerpt ?? rawMarkdown.replace(/^[#>*`\-\d.]+\s*/gm, '').substring(0, 100);
  const tagsJson = JSON.stringify(note.tags || []);
  const wordCount = typeof note.wordCount === 'number' ? note.wordCount : 0;
  const charCount = typeof note.charCount === 'number' ? note.charCount : rawMarkdown.length;
  const isPublic = note.isPublic !== undefined ? (note.isPublic ? 1 : 0) : 1;
  const updatedAt = note.updatedAt || now;
  const createdAt = note.createdAt || now;

  if (existing) {
    await db
      .prepare(`
        UPDATE notes
        SET raw_markdown = ?,
            excerpt = ?,
            tags_json = ?,
            word_count = ?,
            char_count = ?,
            version = ?,
            is_pinned = ?,
            is_deleted = ?,
            is_public = ?,
            updated_at = ?,
            synced_at = ?,
            author = 'admin',
            is_official = 1
        WHERE id = ?
      `)
      .bind(
        rawMarkdown,
        excerpt,
        tagsJson,
        wordCount,
        charCount,
        nextVersion,
        note.isPinned ? 1 : 0,
        note.isDeleted ? 1 : 0,
        isPublic,
        updatedAt,
        now,
        note.id
      )
      .run();
  } else {
    await db
      .prepare(`
        INSERT INTO notes (
          id, raw_markdown, excerpt, tags_json, word_count, char_count,
          version, is_pinned, is_deleted, is_public, created_at, updated_at, synced_at,
          author, is_official, likes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', 1, ?)
      `)
      .bind(
        note.id,
        rawMarkdown,
        excerpt,
        tagsJson,
        wordCount,
        charCount,
        nextVersion,
        note.isPinned ? 1 : 0,
        note.isDeleted ? 1 : 0,
        isPublic,
        createdAt,
        updatedAt,
        now,
        note.likes || 0
      )
      .run();
  }

  // Update FTS5 Index safely
  try {
    if (note.isDeleted) {
      await db.prepare('DELETE FROM notes_fts WHERE id = ?').bind(note.id).run();
    } else {
      await db.prepare('DELETE FROM notes_fts WHERE id = ?').bind(note.id).run();
      await db
        .prepare('INSERT INTO notes_fts (id, raw_markdown, tags_json) VALUES (?, ?, ?)')
        .bind(note.id, note.rawMarkdown, tagsJson)
        .run();
    }
  } catch (ftsErr) {
    console.warn('[FTS5 Sync Non-fatal]', ftsErr);
  }

  const updatedNote: Note = {
    ...note,
    version: nextVersion,
    syncedAt: now,
  };

  return {
    success: true,
    note: updatedNote,
  };
}

export async function searchNotesFts(
  db: D1Database,
  query: string,
  tag?: string,
  limit = 30,
  isPublicOnly = false
): Promise<Note[]> {
  const trimmed = query.trim();

  if (!trimmed && !tag) {
    return await listNotes(db, limit, 0, isPublicOnly);
  }

  if (trimmed) {
    const ftsTerm = `"${trimmed.replace(/"/g, '""')}"*`;
    let sql = `
      SELECT n.*
      FROM notes n
      JOIN notes_fts fts ON n.id = fts.id
      WHERE notes_fts MATCH ? AND n.is_deleted = 0
    `;
    const params: (string | number)[] = [ftsTerm];

    if (isPublicOnly) {
      sql += ` AND (n.is_public IS NULL OR n.is_public = 1)`;
    }

    if (tag && tag !== '#all') {
      sql += ` AND n.tags_json LIKE ?`;
      params.push(`%"${tag.toLowerCase()}"%`);
    }

    sql += ` ORDER BY fts.rank LIMIT ?`;
    params.push(limit);

    try {
      const { results } = await db.prepare(sql).bind(...params).all<DbNoteRow>();
      return (results || []).map(rowToNote);
    } catch {
      let fallbackSql = `
        SELECT * FROM notes
        WHERE is_deleted = 0 AND raw_markdown LIKE ?
      `;
      if (isPublicOnly) {
        fallbackSql += ` AND (is_public IS NULL OR is_public = 1)`;
      }
      fallbackSql += ` ORDER BY updated_at DESC LIMIT ?`;
      const { results } = await db.prepare(fallbackSql).bind(`%${trimmed}%`, limit).all<DbNoteRow>();
      return (results || []).map(rowToNote);
    }
  } else if (tag && tag !== '#all') {
    let sql = 'SELECT * FROM notes WHERE is_deleted = 0';
    if (isPublicOnly) {
      sql += ' AND (is_public IS NULL OR is_public = 1)';
    }
    sql += ' AND tags_json LIKE ? ORDER BY updated_at DESC LIMIT ?';
    const { results } = await db
      .prepare(sql)
      .bind(`%"${tag.toLowerCase()}"%`, limit)
      .all<DbNoteRow>();

    return (results || []).map(rowToNote);
  }

  return [];
}
