import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './env';
import { notesRouter } from './routes/notes';
import { uploadRouter } from './routes/upload';
import { mcpRouter } from './routes/mcp';
import { telemetryRouter } from './routes/telemetry';
import { danmakuRouter } from './routes/danmaku';
import { telegramRouter } from './routes/telegram';

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

app.route('/api/notes', notesRouter);
app.route('/api/upload', uploadRouter);
app.route('/mcp', mcpRouter);
app.route('/api/telemetry', telemetryRouter);
app.route('/api/danmaku', danmakuRouter);
app.route('/api/telegram', telegramRouter);

app.get('/r2/*', async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.text('R2 Bucket not configured', 500);
  }

  const url = new URL(c.req.url);
  const key = url.pathname.replace(/^\/r2\//, '');
  if (!key) return c.text('Missing key', 400);

  const object = await bucket.get(key);
  if (!object) return c.text('Object not found in R2', 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'TagMesh Markdown Serverless',
    timestamp: Date.now(),
  });
});

export default app;
