import { Hono } from 'hono';
import { Env } from '../env';
import { SyncPayload } from '../../src/types/note';
import { syncNote, searchNotesFts, listNotes, getNoteById } from '../db/queries';

export const notesRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /api/notes/sync
 * 1.5s debounced sync: updates D1 SQLite and writes Markdown snapshot to R2
 */
notesRouter.post('/sync', async (c) => {
  const body = await c.req.json<SyncPayload>();
  if (!body || !body.note) {
    return c.json({ error: 'Missing note payload' }, 400);
  }

  const { note, clientVersion } = body;
  const db = c.env.DB;
  const bucket = c.env.BUCKET;

  const result = await syncNote(db, note, clientVersion);

  // Write Markdown file to Cloudflare R2 asynchronously
  if (bucket && note.rawMarkdown) {
    const r2Key = `notes/${note.id}.md`;
    const r2Promise = bucket.put(r2Key, note.rawMarkdown, {
      httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
      customMetadata: {
        noteId: note.id,
        tags: JSON.stringify(note.tags),
        updatedAt: note.updatedAt.toString(),
      },
    });

    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      c.executionCtx.waitUntil(r2Promise);
    } else {
      await r2Promise;
    }
  }

  return c.json({
    success: true,
    note: result.note,
  });
});

/**
 * GET /api/notes/search
 * D1 FTS5 Full-Text Search
 */
notesRouter.get('/search', async (c) => {
  const query = c.req.query('q') || '';
  const tag = c.req.query('tag');
  const limit = parseInt(c.req.query('limit') || '30', 10);

  const notes = await searchNotesFts(c.env.DB, query, tag, limit);
  return c.json({ notes });
});

/**
 * GET /api/notes
 * List latest notes
 */
notesRouter.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const notes = await listNotes(c.env.DB, limit, offset);
  return c.json({ notes });
});

/**
 * GET /api/notes/:id
 */
notesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const note = await getNoteById(c.env.DB, id);
  if (!note) {
    return c.json({ error: 'Note not found' }, 404);
  }
  return c.json({ note });
});

/**
 * POST /api/notes/:id/like
 * Atomic persistent increment for note likes in Cloudflare D1
 */
notesRouter.post('/:id/like', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'DB binding missing' }, 500);
  }

  try {
    await db
      .prepare('UPDATE notes SET likes = COALESCE(likes, 0) + 1 WHERE id = ?')
      .bind(id)
      .run();
  } catch {
    try {
      await db.prepare('ALTER TABLE notes ADD COLUMN likes INTEGER DEFAULT 0').run();
      await db
        .prepare('UPDATE notes SET likes = COALESCE(likes, 0) + 1 WHERE id = ?')
        .bind(id)
        .run();
    } catch {
      // ignore
    }
  }

  const note = await getNoteById(db, id);
  return c.json({
    success: true,
    likes: note?.likes || 1,
  });
});

/**
 * DELETE /api/notes/:id
 */
notesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  const now = Date.now();

  await db
    .prepare('UPDATE notes SET is_deleted = 1, updated_at = ?, synced_at = ? WHERE id = ?')
    .bind(now, now, id)
    .run();

  return c.json({ success: true, id });
});
