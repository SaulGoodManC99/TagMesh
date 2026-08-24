import { Hono } from 'hono';
import { Env } from '../env';

export const uploadRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /api/upload/status
 * Check R2 bucket connection status
 */
uploadRouter.get('/status', async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({
      connected: false,
      message: 'R2 Bucket not configured',
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
    return c.json({
      connected: false,
      message: err instanceof Error ? err.message : 'Failed to query R2',
    });
  }
});

/**
 * POST /api/upload
 * Silent screenshot / image upload to Cloudflare R2
 */
uploadRouter.post('/', async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ error: 'Cloudflare R2 Bucket binding not configured' }, 500);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No valid file uploaded' }, 400);
    }

    const contentType = file.type || 'application/octet-stream';
    const extension = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const randomHex = crypto.randomUUID().slice(0, 8);
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', ''); // e.g. 202608
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
    return c.json({ error: err instanceof Error ? err.message : 'Upload failed' }, 500);
  }
});

/**
 * POST /api/upload/backup
 * Create a full database snapshot archive in R2
 */
uploadRouter.post('/backup', async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ error: 'Cloudflare R2 Bucket binding not configured' }, 500);
  }

  try {
    const body = await c.req.json() as { notes?: any[]; triggerBy?: string };
    const notes = Array.isArray(body.notes) ? body.notes : [];
    const timestamp = Date.now();
    const nowIso = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/tagmesh_backup_${nowIso}.json`;

    const snapshotPayload = {
      app: 'TagMesh',
      version: '1.7.0',
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
    return c.json({ error: err instanceof Error ? err.message : 'Backup failed' }, 500);
  }
});

/**
 * GET /api/upload/backups
 * List historical snapshot backups from R2
 */
uploadRouter.get('/backups', async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ backups: [], error: 'R2 Bucket not configured' });
  }

  try {
    const listRes = await bucket.list({ prefix: 'backups/', limit: 50 });
    const backups = listRes.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      httpEtag: obj.httpEtag,
      customMetadata: obj.customMetadata,
    })).sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

    return c.json({
      success: true,
      backups,
    });
  } catch (err: unknown) {
    console.error('[R2 List Backups Error]', err);
    return c.json({ backups: [], error: err instanceof Error ? err.message : 'Failed to list backups' });
  }
});

/**
 * POST /api/upload/restore
 * Retrieve snapshot content from R2 by key for restoration
 */
uploadRouter.post('/restore', async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ error: 'Cloudflare R2 Bucket binding not configured' }, 500);
  }

  try {
    const { key } = await c.req.json() as { key: string };
    if (!key || !key.startsWith('backups/')) {
      return c.json({ error: 'Invalid backup key' }, 400);
    }

    const object = await bucket.get(key);
    if (!object) {
      return c.json({ error: 'Backup snapshot not found in R2' }, 404);
    }

    const text = await object.text();
    const data = JSON.parse(text);

    return c.json({
      success: true,
      snapshot: data,
    });
  } catch (err: unknown) {
    console.error('[R2 Restore Error]', err);
    return c.json({ error: err instanceof Error ? err.message : 'Restore failed' }, 500);
  }
});
