import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './env';
import { authRouter } from './routes/auth';
import { notesRouter } from './routes/notes';
import { uploadRouter } from './routes/upload';
import { mcpRouter } from './routes/mcp';
import { telemetryRouter } from './routes/telemetry';
import { telegramRouter } from './routes/telegram';

const app = new Hono<{ Bindings: Env }>();

// 严格受控的跨域资源共享 (CORS) 白名单配置
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (!origin) return '*';

      // 允许环境变量自定义配置的白名单（逗号分隔）
      const customOrigins = c.env.ALLOWED_ORIGINS?.split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (customOrigins && customOrigins.includes(origin)) {
        return origin;
      }

      // 默认受信任的开发环境与生产环境域名列表
      if (
        origin === 'https://tagmesh.top' ||
        origin === 'https://www.tagmesh.top' ||
        origin === 'http://localhost:5173' ||
        origin === 'http://127.0.0.1:5173' ||
        origin === 'http://localhost:8787' ||
        origin === 'http://127.0.0.1:8787' ||
        origin.endsWith('.workers.dev') ||
        origin.endsWith('.pages.dev')
      ) {
        return origin;
      }

      // 非白名单来源拒绝跨域
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
    credentials: true,
  })
);

// 路由挂载
app.route('/api/auth', authRouter);
app.route('/api/notes', notesRouter);
app.route('/api/upload', uploadRouter);
app.route('/mcp', mcpRouter);
app.route('/api/telemetry', telemetryRouter);
app.route('/api/telegram', telegramRouter);

/**
 * GET /r2/*
 * R2 公共资源代理流（带缓存头）
 */
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

/**
 * GET /api/health
 * 服务端健康检查探针
 */
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'TagMesh Markdown Serverless',
    timestamp: Date.now(),
    version: '2.0.2',
  });
});

export default app;
