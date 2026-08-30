import { Hono } from 'hono';
import { Env } from '../env';
import { SyncPayload } from '../../src/types/note';
import { syncNote, searchNotesFts, listNotes, getNoteById } from '../db/queries';
import { requireAdminAuth, checkIsAdmin } from '../middleware/auth';

export const notesRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /api/notes/sync
 * 笔记同步接口（写操作）：强制要求馆长管理员鉴权
 * 1.5s 防抖同步：更新 D1 数据库并异步写入 Markdown 快照至 R2 存储桶
 */
notesRouter.post('/sync', requireAdminAuth, async (c) => {
  try {
    const body = await c.req.json<SyncPayload>();
    if (!body || !body.note) {
      return c.json({ success: false, error: '缺少笔记数据载荷' }, 400);
    }

    const { note, clientVersion } = body;
    const db = c.env.DB;
    const bucket = c.env.BUCKET;

    const result = await syncNote(db, note, clientVersion);

    // 异步写入 Markdown 物理文件到 Cloudflare R2 存储桶
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
  } catch (err: unknown) {
    console.error('[Notes Sync Error]', err);
    return c.json({ success: false, error: '笔记同步失败，请稍后重试' }, 500);
  }
});

/**
 * GET /api/notes/search
 * D1 FTS5 全文搜索与标签检索
 * 安全策略：未鉴权（游客）状态下强制服务端过滤非公开笔记 (is_public = 0)
 */
notesRouter.get('/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const tag = c.req.query('tag');
    const limit = parseInt(c.req.query('limit') || '30', 10);

    // 服务端权限判定：未通过鉴权的请求强制只能检索公开笔记 (isPublicOnly = true)
    const isAdmin = await checkIsAdmin(c);
    const isPublicOnly = !isAdmin ? true : c.req.query('public_only') === '1';

    const notes = await searchNotesFts(c.env.DB, query, tag, limit, isPublicOnly);
    return c.json({ notes });
  } catch (err: unknown) {
    console.error('[Notes Search Error]', err);
    return c.json({ error: '搜索查询失败，请稍后重试', notes: [] }, 500);
  }
});

/**
 * GET /api/notes
 * 获取最新笔记列表
 * 安全策略：未鉴权（游客）状态下强制服务端过滤非公开笔记 (is_public = 0)
 */
notesRouter.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    // 服务端权限判定：未通过鉴权的请求强制只能查看公开笔记 (isPublicOnly = true)
    const isAdmin = await checkIsAdmin(c);
    const isPublicOnly = !isAdmin ? true : c.req.query('public_only') === '1';

    const notes = await listNotes(c.env.DB, limit, offset, isPublicOnly);
    return c.json({ notes });
  } catch (err: unknown) {
    console.error('[Notes List Error]', err);
    return c.json({ error: '获取笔记列表失败，请稍后重试', notes: [] }, 500);
  }
});

/**
 * GET /api/notes/:id
 * 获取单篇笔记详情
 * 安全策略：私密笔记仅馆长可读，游客访问直接返回 404
 */
notesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const note = await getNoteById(c.env.DB, id);
    if (!note || note.isDeleted) {
      return c.json({ error: '笔记不存在或已被删除' }, 404);
    }

    // 若笔记为私密笔记，校验管理员权限
    if (!note.isPublic) {
      const isAdmin = await checkIsAdmin(c);
      if (!isAdmin) {
        return c.json({ error: '笔记不存在或已被删除' }, 404);
      }
    }

    return c.json({ note });
  } catch (err: unknown) {
    console.error('[Note Detail Error]', err);
    return c.json({ error: '获取笔记详情失败' }, 500);
  }
});

/**
 * POST /api/notes/:id/like
 * 笔记互动点赞（开放给所有访客与馆长）
 */
notesRouter.post('/:id/like', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: '数据库未连接' }, 500);
  }

  try {
    await db
      .prepare('UPDATE notes SET likes = COALESCE(likes, 0) + 1 WHERE id = ?')
      .bind(id)
      .run();

    const note = await getNoteById(db, id);
    return c.json({
      success: true,
      likes: note?.likes || 1,
    });
  } catch (err: unknown) {
    console.error('[Note Like Error]', err);
    return c.json({ success: false, error: '点赞操作失败' }, 500);
  }
});

/**
 * DELETE /api/notes/:id
 * 删除笔记（写操作）：强制要求馆长管理员鉴权
 */
notesRouter.delete('/:id', requireAdminAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    const now = Date.now();

    await db
      .prepare('UPDATE notes SET is_deleted = 1, updated_at = ?, synced_at = ? WHERE id = ?')
      .bind(now, now, id)
      .run();

    // 同步清理 FTS5 全文索引
    try {
      await db.prepare('DELETE FROM notes_fts WHERE id = ?').bind(id).run();
    } catch (ftsErr) {
      console.warn('[FTS5 Delete Non-fatal]', ftsErr);
    }

    return c.json({ success: true, id });
  } catch (err: unknown) {
    console.error('[Note Delete Error]', err);
    return c.json({ success: false, error: '删除笔记失败，请稍后重试' }, 500);
  }
});
