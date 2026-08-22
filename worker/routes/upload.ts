import { Hono } from 'hono';
import { Env } from '../env';

export const uploadRouter = new Hono<{ Bindings: Env }>();

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
    const key = `images/${timestamp}_${randomHex}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();

    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        uploadedAt: timestamp.toString(),
      },
    });

    const publicBase = c.env.R2_PUBLIC_BASE_URL || `${new URL(c.req.url).origin}/r2`;
    const publicUrl = `${publicBase}/${key}`;

    return c.json({
      success: true,
      key,
      url: publicUrl,
    });
  } catch (err: unknown) {
    console.error('[R2 Upload Error]', err);
    return c.json({ error: err instanceof Error ? err.message : 'Upload failed' }, 500);
  }
});
