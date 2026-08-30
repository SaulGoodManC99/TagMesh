import { Hono } from 'hono';
import { Env } from '../env';
import { generateSessionToken, verifyAdminToken } from '../middleware/auth';

export const authRouter = new Hono<{ Bindings: Env }>();

/**
 * 恒定时间字符串比对（防止时序攻击 Timing Attacks）
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * POST /api/auth/login
 * 馆长管理员登录：校验口令并签发短期安全 HMAC 会话 Token
 */
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json<{ password?: string }>().catch(() => ({ password: '' }));
    const inputPassword = (body.password || '').trim();

    const adminPassword = c.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.warn('[Security Warning] ADMIN_PASSWORD 未在服务端环境变量中配置，登录已被拒绝。');
      return c.json(
        {
          success: false,
          error: '服务端未配置管理员密钥，请联系运维配置 ADMIN_PASSWORD',
        },
        500
      );
    }

    if (!inputPassword || !timingSafeEqual(inputPassword, adminPassword)) {
      return c.json(
        {
          success: false,
          error: '馆长口令不正确，请重新输入',
        },
        401
      );
    }

    // 签发 30 天有效期的 HMAC 签名会话 Token
    const { token, expiresAt } = await generateSessionToken(adminPassword);

    return c.json({
      success: true,
      token,
      expiresAt,
      role: 'admin',
      message: '👑 馆长登录成功',
    });
  } catch (err: unknown) {
    console.error('[Auth Login Error]', err);
    return c.json({ success: false, error: '登录处理异常，请稍后重试' }, 500);
  }
});

/**
 * GET /api/auth/verify
 * 校验当前前端持有的 Token 是否依然有效
 */
authRouter.get('/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  const { isValid, reason } = await verifyAdminToken(authHeader, c.env);

  if (!isValid) {
    return c.json({
      success: false,
      isAdmin: false,
      error: reason || 'Token 无效或已过期',
    }, 401);
  }

  return c.json({
    success: true,
    isAdmin: true,
    role: 'admin',
  });
});

/**
 * POST /api/auth/logout
 * 退出登录
 */
authRouter.post('/logout', (c) => {
  return c.json({
    success: true,
    message: '已成功退出馆长权限',
  });
});
