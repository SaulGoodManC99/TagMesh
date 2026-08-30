import { Hono } from 'hono';
import { Env } from '../env';
import { requireAdminAuth } from '../middleware/auth';

export const uploadRouter = new Hono<{ Bindings: Env }>();

// 允许上传的图片 MIME 类型白名单
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]);

// 单个文件最大大小限制：5MB
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

/**
 * GET /api/upload/status
 * 检查 R2 存储桶连通性（需要管理员鉴权）
 */
uploadRouter.get('/status', requireAdminAuth, async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({
      connected: false,
      message: 'Cloudflare R2 存储桶未绑定',
    });
  }

  try {
    const listRes = await bucket.list({ limit: 5 });
    return c.json({
      connected: true,
      bucketName: 'tagmesh-bucket',
      sampleObjectsCount: listRes.objects.length,
    });
  } catch (err: unknown) {
    console.error('[R2 Status Query Error]', err);
    return c.json({
      connected: false,
      message: 'R2 存储桶连通性检测异常',
    });
  }
});

/**
 * POST /api/upload
 * 笔记图片上传至 Cloudflare R2（强制要求馆长管理员鉴权 + MIME白名单 + 5MB上限校验）
 */
uploadRouter.post('/', requireAdminAuth, async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ success: false, error: 'Cloudflare R2 存储桶未绑定' }, 500);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: '请选择要上传的有效文件' }, 400);
    }

    // 1. 文件大小上限校验 (5MB)
    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      return c.json({ success: false, error: '上传图片大小不能超过 5MB' }, 400);
    }

    // 2. MIME 类型白名单校验
    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType.toLowerCase())) {
      return c.json(
        {
          success: false,
          error: `不支持的文件类型 (${contentType})，仅允许上传 JPEG, PNG, GIF, WebP, SVG, AVIF 图片`,
        },
        400
      );
    }

    const extension = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now();
    const randomHex = crypto.randomUUID().slice(0, 8);
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', ''); // 如 202608
    const key = `images/${datePrefix}/${timestamp}_${randomHex}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();

    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        uploadedAt: timestamp.toString(),
        fileSize: file.size.toString(),
      },
    });

    const publicBase = c.env.R2_PUBLIC_BASE_URL || `${new URL(c.req.url).origin}/r2`;
    const publicUrl = `${publicBase}/${key}`;

    return c.json({
      success: true,
      key,
      url: publicUrl,
      size: file.size,
      contentType,
    });
  } catch (err: unknown) {
    console.error('[R2 Upload Error]', err);
    return c.json({ success: false, error: '图片上传失败，请稍后重试' }, 500);
  }
});

/**
 * POST /api/upload/backup
 * 全库数据快照归档备份至 R2（强制要求馆长管理员鉴权）
 */
uploadRouter.post('/backup', requireAdminAuth, async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ success: false, error: 'Cloudflare R2 存储桶未绑定' }, 500);
  }

  try {
    const body = (await c.req.json()) as { notes?: any[]; triggerBy?: string };
    const notes = Array.isArray(body.notes) ? body.notes : [];
    const timestamp = Date.now();
    const nowIso = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/tagmesh_backup_${nowIso}.json`;

    const snapshotPayload = {
      app: 'TagMesh',
      version: '2.0.2',
      createdAt: timestamp,
      createdIso: new Date(timestamp).toISOString(),
      triggerBy: body.triggerBy || 'admin',
      totalNotes: notes.length,
      notes,
    };

    const jsonString = JSON.stringify(snapshotPayload, null, 2);
    await bucket.put(key, jsonString, {
      httpMetadata: {
        contentType: 'application/json; charset=utf-8',
        cacheControl: 'private, no-cache',
      },
      customMetadata: {
        totalNotes: notes.length.toString(),
        createdAt: timestamp.toString(),
      },
    });

    return c.json({
      success: true,
      key,
      totalNotes: notes.length,
      size: jsonString.length,
      createdAt: timestamp,
    });
  } catch (err: unknown) {
    console.error('[R2 Backup Error]', err);
    return c.json({ success: false, error: '全量备份归档失败，请稍后重试' }, 500);
  }
});

/**
 * GET /api/upload/backups
 * 获取 R2 历史云端备份快照列表（强制要求馆长管理员鉴权）
 */
uploadRouter.get('/backups', requireAdminAuth, async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ success: false, backups: [], error: 'Cloudflare R2 存储桶未绑定' });
  }

  try {
    const listRes = await bucket.list({ prefix: 'backups/', limit: 50 });
    const backups = listRes.objects
      .map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
        httpEtag: obj.httpEtag,
        customMetadata: obj.customMetadata,
      }))
      .sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

    return c.json({
      success: true,
      backups,
    });
  } catch (err: unknown) {
    console.error('[R2 List Backups Error]', err);
    return c.json({ success: false, backups: [], error: '获取备份列表失败，请稍后重试' }, 500);
  }
});

/**
 * POST /api/upload/restore
 * 从 R2 读取历史快照内容以供恢复（强制要求馆长管理员鉴权）
 */
uploadRouter.post('/restore', requireAdminAuth, async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ success: false, error: 'Cloudflare R2 存储桶未绑定' }, 500);
  }

  try {
    const { key } = (await c.req.json()) as { key: string };
    if (!key || !key.startsWith('backups/')) {
      return c.json({ success: false, error: '无效的备份文件键名' }, 400);
    }

    const object = await bucket.get(key);
    if (!object) {
      return c.json({ success: false, error: '未在 R2 存储桶中找到指定备份文件' }, 404);
    }

    const text = await object.text();
    const data = JSON.parse(text);

    return c.json({
      success: true,
      snapshot: data,
    });
  } catch (err: unknown) {
    console.error('[R2 Restore Error]', err);
    return c.json({ success: false, error: '读取备份数据失败，请稍后重试' }, 500);
  }
});
