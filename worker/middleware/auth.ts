import { Context, Next } from 'hono';
import { Env } from '../env';

const TOKEN_PREFIX = 'tm_hmac_';
const DEFAULT_SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 天有效期

/**
 * 将字符串转为 ArrayBuffer
 */
function strToBuffer(str: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(str);
  const copy = new Uint8Array(encoded.byteLength);
  copy.set(encoded);
  return copy.buffer;
}

/**
 * 将 ArrayBuffer 转为十六进制字符串
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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
 * 使用 Web Crypto API 生成 HMAC-SHA256 签名
 */
async function generateHmacSignature(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    strToBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, strToBuffer(data));
  return bufferToHex(signature);
}

/**
 * 为登录成功的管理员签发带过期时间的 HMAC 签名 Token
 * Token 结构: tm_hmac_<expiresAt>.<hexSignature>
 */
export async function generateSessionToken(
  adminPassword: string,
  expiresInMs: number = DEFAULT_SESSION_EXPIRY_MS
): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + expiresInMs;
  const payload = `session:${expiresAt}`;
  const signature = await generateHmacSignature(adminPassword, payload);
  const token = `${TOKEN_PREFIX}${expiresAt}.${signature}`;
  return { token, expiresAt };
}

/**
 * 校验 Token 是否有效
 * 支持:
 * 1. 本项目签发的动态 HMAC 会话 Token (tm_hmac_<expiresAt>.<signature>)
 * 2. 环境变量中配置的 ADMIN_PASSWORD / API_AUTH_TOKEN 明文 Token
 * 3. 环境变量中配置的 MCP_AUTH_TOKEN
 */
export async function verifyAdminToken(
  authHeader: string | undefined,
  env: Env
): Promise<{ isValid: boolean; reason?: string }> {
  if (!authHeader) {
    return { isValid: false, reason: '缺少 Authorization 请求头' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { isValid: false, reason: 'Bearer Token 为空' };
  }

  const adminPassword = env.ADMIN_PASSWORD;
  const mcpToken = env.MCP_AUTH_TOKEN;

  // 严禁使用硬编码默认值兜底：若服务端未配置任何密码/Secret，直接拒绝
  if (!adminPassword && !mcpToken) {
    console.warn('[Security Alert] ADMIN_PASSWORD 与 MCP_AUTH_TOKEN 均未配置，已拒绝所有管理请求。请使用 wrangler secret 设置。');
    return { isValid: false, reason: '服务端未配置管理员密钥' };
  }

  // 1. 优先校验动态 HMAC 会话 Token
  if (token.startsWith(TOKEN_PREFIX) && adminPassword) {
    try {
      const rest = token.slice(TOKEN_PREFIX.length);
      const dotIndex = rest.indexOf('.');
      if (dotIndex === -1) {
        return { isValid: false, reason: 'Token 格式不正确' };
      }

      const expiresAtStr = rest.slice(0, dotIndex);
      const signature = rest.slice(dotIndex + 1);
      const expiresAt = parseInt(expiresAtStr, 10);

      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return { isValid: false, reason: '登录会话已过期，请重新登录' };
      }

      const payload = `session:${expiresAt}`;
      const expectedSignature = await generateHmacSignature(adminPassword, payload);

      if (timingSafeEqual(signature, expectedSignature)) {
        return { isValid: true };
      } else {
        return { isValid: false, reason: 'Token 签名校验未通过' };
      }
    } catch (err) {
      console.error('[Auth Token Verification Error]', err);
      return { isValid: false, reason: 'Token 校验异常' };
    }
  }

  // 2. 校验是否直接匹配 ADMIN_PASSWORD（用于直接 API 脚本调用）
  if (adminPassword && timingSafeEqual(token, adminPassword)) {
    return { isValid: true };
  }

  // 3. 校验是否匹配 MCP_AUTH_TOKEN
  if (mcpToken && timingSafeEqual(token, mcpToken)) {
    return { isValid: true };
  }

  return { isValid: false, reason: '口令或 Token 无效' };
}

/**
 * 辅助方法：快速检查当前请求是否具备管理员权限（不中断请求）
 */
export async function checkIsAdmin(c: Context<{ Bindings: Env }>): Promise<boolean> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return false;
  const { isValid } = await verifyAdminToken(authHeader, c.env);
  return isValid;
}

/**
 * 强制鉴权中间件：若未通过鉴权直接返回 401 JSON 错误
 */
export async function requireAdminAuth(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  const { isValid, reason } = await verifyAdminToken(authHeader, c.env);

  if (!isValid) {
    return c.json(
      {
        success: false,
        error: reason || '未授权访问：需要有效的馆长管理员口令',
        code: 'UNAUTHORIZED',
      },
      401
    );
  }

  return await next();
}
