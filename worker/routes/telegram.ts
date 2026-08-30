import { Hono } from 'hono';
import { Env } from '../env';
import { requireAdminAuth } from '../middleware/auth';

export const telegramRouter = new Hono<{ Bindings: Env }>();

// 提取 Markdown 中的标签
function extractTagsFromMarkdown(markdown: string): string[] {
  if (!markdown) return [];

  const cleanText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ');

  const regex = /(?<![#&a-zA-Z0-9_])#([a-zA-Z0-9_\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af-]+)/g;
  const tags = new Set<string>();
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    const raw = match[1];
    if (raw && raw !== '-' && raw !== '_' && !/^\d+$/.test(raw)) {
      tags.add(`#${raw.toLowerCase()}`);
    }
  }
  return Array.from(tags);
}

// 统计字数与字符数
function countWordsAndChars(text: string): { wordCount: number; charCount: number } {
  if (!text) return { wordCount: 0, charCount: 0 };
  const clean = text.replace(/```[\s\S]*?```/g, '').replace(/[#*`_~[\]()>-]/g, ' ');
  const charCount = text.length;
  const cjkMatches = clean.match(/[\u4e00-\u9fa5]/g) || [];
  const latinMatches = clean.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const wordCount = cjkMatches.length + latinMatches.length;
  return { wordCount, charCount };
}

// 提取摘要
function extractExcerptFromMarkdown(markdown: string, fallback: string = 'Telegram 灵感笔记'): string {
  if (!markdown) return fallback;
  const lines = markdown.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, '').replace(/^[*-]\s*/, '').replace(/^>\s*/, '').trim();
    if (clean) return clean.slice(0, 120);
  }
  return fallback;
}

// 发送 Telegram 消息
async function sendTelegramMessage(botToken: string, chatId: string | number, text: string, parseMode?: string): Promise<any> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body: any = {
    chat_id: chatId,
    text,
  };
  if (parseMode) {
    body.parse_mode = parseMode;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
}

// 获取 Telegram Bot 信息
async function getTelegramMe(botToken: string): Promise<any> {
  const url = `https://api.telegram.org/bot${botToken}/getMe`;
  const res = await fetch(url);
  return await res.json();
}

// 从 DB 读取配置
async function getSetting(db: D1Database, key: string, fallback: string = ''): Promise<string> {
  try {
    const row = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(key).first<{ value: string }>();
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

// 向 DB 写入配置
async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO system_settings (key, value, updated_at) 
    VALUES (?, ?, ?) 
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).bind(key, value, now).run();
}

// 脱敏 Bot Token (例如 7123456789:AAH...wxyz)
function maskToken(token: string): string {
  if (!token || token.length < 12) return token ? '********' : '';
  const prefix = token.slice(0, 10);
  const suffix = token.slice(-4);
  return `${prefix}...${suffix}`;
}

// ------------------------------------------------------------------------------------------------
// 1. GET /api/telegram/config - 获取 Telegram 配置状态（强制要求馆长管理员鉴权）
// ------------------------------------------------------------------------------------------------
telegramRouter.get('/config', requireAdminAuth, async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: '数据库未就绪' }, 500);
  }

  try {
    const token = await getSetting(db, 'telegram_bot_token', '');
    const userIds = await getSetting(db, 'telegram_user_ids', '');
    const webhookUrl = await getSetting(db, 'telegram_webhook_url', '');
    const enabled = await getSetting(db, 'telegram_enabled', '1');
    const defaultPublic = await getSetting(db, 'telegram_default_public', '1');

    let botInfo: any = null;
    if (token) {
      try {
        const meRes = await getTelegramMe(token);
        if (meRes.ok) {
          botInfo = meRes.result;
        }
      } catch (meErr) {
        console.warn('[Telegram Me Check Non-fatal]', meErr);
      }
    }

    return c.json({
      ok: true,
      configured: Boolean(token && userIds),
      botTokenMasked: maskToken(token),
      hasToken: Boolean(token),
      userIds,
      webhookUrl,
      enabled: enabled === '1',
      defaultPublic: defaultPublic === '1',
      botInfo,
    });
  } catch (err: unknown) {
    console.error('[Telegram Config Get Error]', err);
    return c.json({ ok: false, error: '获取 Telegram 配置失败' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 2. POST /api/telegram/config - 保存 Telegram 配置（强制要求馆长管理员鉴权）
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/config', requireAdminAuth, async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: '数据库未就绪' }, 500);
  }

  try {
    const body = await c.req.json<{
      botToken?: string;
      userIds?: string;
      webhookUrl?: string;
      enabled?: boolean;
      defaultPublic?: boolean;
    }>();

    if (body.botToken !== undefined && !body.botToken.includes('...')) {
      await setSetting(db, 'telegram_bot_token', body.botToken.trim());
    }

    if (body.userIds !== undefined) {
      await setSetting(db, 'telegram_user_ids', body.userIds.trim());
    }

    if (body.webhookUrl !== undefined) {
      await setSetting(db, 'telegram_webhook_url', body.webhookUrl.trim());
    }

    if (body.enabled !== undefined) {
      await setSetting(db, 'telegram_enabled', body.enabled ? '1' : '0');
    }

    if (body.defaultPublic !== undefined) {
      await setSetting(db, 'telegram_default_public', body.defaultPublic ? '1' : '0');
    }

    return c.json({ ok: true, message: 'Telegram 配置保存成功' });
  } catch (err: unknown) {
    console.error('[Telegram Config Save Error]', err);
    return c.json({ ok: false, error: '保存配置失败，请稍后重试' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 3. POST /api/telegram/set-webhook - 注册 Telegram Webhook（强制要求馆长管理员鉴权）
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/set-webhook', requireAdminAuth, async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: '数据库未就绪' }, 500);
  }

  try {
    const body = await c.req.json<{ webhookUrl?: string }>().catch(() => ({ webhookUrl: undefined }));
    const token = await getSetting(db, 'telegram_bot_token', '');
    if (!token) {
      return c.json({ ok: false, error: '请先配置 Telegram Bot Token' }, 400);
    }

    let url = body.webhookUrl || (await getSetting(db, 'telegram_webhook_url', ''));
    if (!url) {
      const origin = new URL(c.req.url).origin;
      url = `${origin}/api/telegram/webhook`;
    }

    await setSetting(db, 'telegram_webhook_url', url);

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(url)}`);
    const tgData: any = await tgRes.json();

    if (tgData.ok) {
      return c.json({ ok: true, message: 'Webhook 注册成功', webhookUrl: url, result: tgData });
    } else {
      return c.json({ ok: false, error: tgData.description || 'Telegram Webhook 注册失败', result: tgData }, 400);
    }
  } catch (err: unknown) {
    console.error('[Telegram Set Webhook Error]', err);
    return c.json({ ok: false, error: '设置 Webhook 异常，请检查网络或 Token' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 4. POST /api/telegram/delete-webhook - 解除 Telegram Webhook（强制要求馆长管理员鉴权）
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/delete-webhook', requireAdminAuth, async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: '数据库未就绪' }, 500);
  }

  try {
    const token = await getSetting(db, 'telegram_bot_token', '');
    if (!token) {
      return c.json({ ok: false, error: '未配置 Bot Token' }, 400);
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
    const tgData: any = await tgRes.json();

    return c.json({ ok: true, message: 'Webhook 已成功解除绑定', result: tgData });
  } catch (err: unknown) {
    console.error('[Telegram Delete Webhook Error]', err);
    return c.json({ ok: false, error: '解除 Webhook 异常' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 5. POST /api/telegram/test - 发送测试消息（强制要求馆长管理员鉴权）
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/test', requireAdminAuth, async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: '数据库未就绪' }, 500);
  }

  try {
    const token = await getSetting(db, 'telegram_bot_token', '');
    const userIdsStr = await getSetting(db, 'telegram_user_ids', '');

    if (!token) {
      return c.json({ ok: false, error: '请先填写 Bot Token' }, 400);
    }
    if (!userIdsStr) {
      return c.json({ ok: false, error: '请先填写绑定的 Telegram 用户 ID' }, 400);
    }

    const firstUserId = userIdsStr.split(/[,;\s]+/).filter(Boolean)[0];
    if (!firstUserId) {
      return c.json({ ok: false, error: '未找到有效的用户 ID' }, 400);
    }

    const testMessage = `🎉 *TagMesh 知识库连接成功！*\n\n✨ 您的 Telegram Bot 与 TagMesh 第二大脑已成功打通。\n\n💡 *使用提示：*\n• 直接向我发送文字或图片，即可自动入库为官方馆长笔记\n• 在正文中输入 \`#标签\`（如 \`#灵感\` \`#生活\`）即可智能打标\n• 发送 \`/status\` 查看全库状态\n• 发送 \`/recent\` 查看最新笔记\n• 发送 \`/tags\` 查看热门标签`;

    const res = await sendTelegramMessage(token, firstUserId, testMessage, 'Markdown');
    if (res.ok) {
      return c.json({ ok: true, message: '测试消息发送成功！请检查您的 Telegram 对话框。', result: res });
    } else {
      return c.json({ ok: false, error: res.description || '发送测试消息失败，请检查 Token 或用户 ID 是否正确。', result: res }, 400);
    }
  } catch (err: unknown) {
    console.error('[Telegram Test Error]', err);
    return c.json({ ok: false, error: '发送测试消息异常，请检查配置' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 6. POST /api/telegram/webhook - 主 Webhook 回调处理接口
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/webhook', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.text('OK', 200); // 始终向 Telegram 返回 200 避免重复重试
  }

  try {
    const update: any = await c.req.json();
    const message = update.message || update.edited_message || update.channel_post;

    if (!message) {
      return c.text('OK', 200);
    }

    const senderId = String(message.from?.id || message.chat?.id || '');
    const chatId = message.chat?.id || senderId;

    const botToken = await getSetting(db, 'telegram_bot_token', '');
    const userIdsStr = await getSetting(db, 'telegram_user_ids', '');
    const enabled = await getSetting(db, 'telegram_enabled', '1');

    if (!botToken || enabled !== '1') {
      return c.text('OK', 200);
    }

    const authorizedUserIds = userIdsStr.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

    // 发送者安全校验：非白名单 ID 拒绝入库
    if (authorizedUserIds.length > 0 && !authorizedUserIds.includes(senderId)) {
      const rejectMsg = `⛔ *未授权访问*\n\n您的 Telegram 用户 ID 为：\`${senderId}\`。\n请登录 TagMesh 馆长后台，在设置中心绑定此 ID 即可开启自动同步。`;
      await sendTelegramMessage(botToken, chatId, rejectMsg, 'Markdown').catch(() => {});
      return c.text('OK', 200);
    }

    let rawText = (message.text || message.caption || '').trim();

    // 处理图片附件
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      const largestPhoto = message.photo[message.photo.length - 1];
      try {
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${largestPhoto.file_id}`);
        const fileData: any = await fileRes.json();
        if (fileData.ok && fileData.result?.file_path) {
          const photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
          const imgMarkdown = `\n\n![Telegram 照片](${photoUrl})\n`;
          rawText = rawText ? `${rawText}${imgMarkdown}` : `📷 来自 Telegram 的快照记录${imgMarkdown}`;
        }
      } catch (e) {
        console.warn('[Telegram Webhook] Failed to fetch photo URL:', e);
      }
    }

    if (!rawText) {
      return c.text('OK', 200);
    }

    // 指令解析
    if (rawText.startsWith('/start') || rawText.startsWith('/help')) {
      const helpText = `🎈 *欢迎使用 TagMesh 闪念助手！*\n\n我是你的第二大脑云端同步机器人。\n\n📝 *直接记录：*\n直接向我发送任何想法、随笔或图片，我将立即为你保存至 TagMesh 知识库。\n\n🏷️ *自动标签：*\n在正文中随手写 \`#标签\`（例如 \`#读书笔记\` \`#架构\`），系统将自动解析为多维网状索引。\n\n⚡ *常用指令：*\n• \`/status\` - 查看全库统计与运行状态\n• \`/recent\` - 查看最近保存的 3 篇笔记\n• \`/tags\` - 查看热门知识库标签\n• \`/ping\` - 检查连接状态`;
      await sendTelegramMessage(botToken, chatId, helpText, 'Markdown');
      return c.text('OK', 200);
    }

    if (rawText.startsWith('/ping')) {
      await sendTelegramMessage(botToken, chatId, '🏓 Pong! TagMesh 边缘节点运行流畅。');
      return c.text('OK', 200);
    }

    if (rawText.startsWith('/status')) {
      const countRes = await db.prepare(`
        SELECT 
          COUNT(*) as total, 
          SUM(CASE WHEN is_public = 1 OR is_public IS NULL THEN 1 ELSE 0 END) as public_count,
          SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_count
        FROM notes 
        WHERE is_deleted = 0
      `).first<{ total: number; public_count: number; private_count: number }>();
      const totalNotes = countRes?.total ?? 0;
      const publicNotes = countRes?.public_count ?? 0;
      const privateNotes = countRes?.private_count ?? 0;
      const uptimeRes = await db.prepare("SELECT value FROM system_telemetry WHERE key = 'site_created_at'").first<{ value: string }>();
      const siteCreated = uptimeRes?.value ? new Date(Number(uptimeRes.value)).toLocaleDateString('zh-CN') : '2026-08';

      const statusMsg = `📊 *TagMesh 知识库实时概览*\n\n📚 笔记总量：*${totalNotes}* 篇\n🌐 公开展厅：*${publicNotes}* 篇\n🔒 仅自己可见：*${privateNotes}* 篇\n👑 授权馆长：\`${senderId}\`\n🚀 运行环境：Cloudflare Workers + D1\n🗓️ 开馆时间：${siteCreated}\n\n✨ 发送任意文字或图片即可极速入库！`;
      await sendTelegramMessage(botToken, chatId, statusMsg, 'Markdown');
      return c.text('OK', 200);
    }

    if (rawText.startsWith('/recent') || rawText.startsWith('/last')) {
      const recentNotes = await db.prepare(`
        SELECT id, raw_markdown, excerpt, tags_json, is_public, created_at 
        FROM notes 
        WHERE is_deleted = 0 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all<{ id: string; raw_markdown: string; excerpt: string; tags_json: string; is_public: number; created_at: number }>();

      if (!recentNotes.results || recentNotes.results.length === 0) {
        await sendTelegramMessage(botToken, chatId, '📭 当前知识库暂无笔记，发送一条试试吧！');
        return c.text('OK', 200);
      }

      let reply = `📑 *最近入库的 3 篇笔记：*\n\n`;
      recentNotes.results.forEach((n, idx) => {
        const date = new Date(n.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const tags: string[] = JSON.parse(n.tags_json || '[]');
        const tagStr = tags.length > 0 ? ` [${tags.join(' ')}]` : '';
        const visBadge = n.is_public === 0 ? '🔒 [私密]' : '🌐 [公开]';
        reply += `${idx + 1}. ${visBadge} *${n.excerpt}*\n   📅 ${date}${tagStr}\n\n`;
      });

      await sendTelegramMessage(botToken, chatId, reply, 'Markdown');
      return c.text('OK', 200);
    }

    if (rawText.startsWith('/tags')) {
      const allNotes = await db.prepare('SELECT tags_json FROM notes WHERE is_deleted = 0').all<{ tags_json: string }>();
      const tagCounts: Record<string, number> = {};

      (allNotes.results || []).forEach((row) => {
        try {
          const tags: string[] = JSON.parse(row.tags_json || '[]');
          tags.forEach((t) => {
            if (t) {
              tagCounts[t] = (tagCounts[t] || 0) + 1;
            }
          });
        } catch {
          // ignore
        }
      });

      const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
      if (sorted.length === 0) {
        await sendTelegramMessage(botToken, chatId, '🏷️ 暂无标签，在笔记中输入 `#标签名` 即可创建。');
        return c.text('OK', 200);
      }

      let tagMsg = `🏷️ *知识库热门标签：*\n\n`;
      sorted.forEach(([tag, count]) => {
        tagMsg += `• \`${tag}\` (${count}篇)\n`;
      });

      await sendTelegramMessage(botToken, chatId, tagMsg, 'Markdown');
      return c.text('OK', 200);
    }

    // 写入 D1 数据库
    const now = Date.now();
    const noteId = `tg_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const tags = extractTagsFromMarkdown(rawText);
    const excerpt = extractExcerptFromMarkdown(rawText, '来自 Telegram 的闪念');
    const { wordCount, charCount } = countWordsAndChars(rawText);
    const tagsJson = JSON.stringify(tags);

    const defaultPublicSetting = await getSetting(db, 'telegram_default_public', '1');
    let isPublic = defaultPublicSetting === '1';
    const lowerText = rawText.toLowerCase();
    if (lowerText.includes('#公开') || lowerText.includes('#public')) {
      isPublic = true;
    } else if (lowerText.includes('#私密') || lowerText.includes('#private') || lowerText.includes('#草稿') || lowerText.includes('#draft')) {
      isPublic = false;
    }

    await db.prepare(`
      INSERT INTO notes (
        id, raw_markdown, excerpt, tags_json, word_count, char_count, 
        version, is_pinned, is_deleted, is_public, created_at, updated_at, synced_at, author, is_official, likes
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?, ?, ?, 'admin', 1, 0)
    `).bind(noteId, rawText, excerpt, tagsJson, wordCount, charCount, isPublic ? 1 : 0, now, now, now).run();

    // 写入 FTS5 索引
    try {
      await db.prepare(`
        INSERT INTO notes_fts (id, raw_markdown, tags_json)
        VALUES (?, ?, ?)
      `).bind(noteId, rawText, tagsJson).run();
    } catch (ftsErr) {
      console.warn('[Telegram Webhook] FTS index insert failed:', ftsErr);
    }

    const tagDisplay = tags.length > 0 ? tags.join(' ') : '无标签';
    const visDisplay = isPublic ? '🌐 公开展厅' : '🔒 仅自己可见 (私密)';
    const receipt = `✨ *灵感笔记已入库 TagMesh！*\n\n📝 *摘要：* ${excerpt}\n🏷️ *标签：* ${tagDisplay}\n👁️ *可见性：* ${visDisplay}\n📊 *字数：* ${wordCount} 字 (${charCount} 字符)\n⏰ *时间：* ${new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;

    await sendTelegramMessage(botToken, chatId, receipt, 'Markdown').catch((e) => {
      console.warn('[Telegram Webhook] Failed to send receipt:', e);
    });

    return c.text('OK', 200);
  } catch (err: unknown) {
    console.error('[Telegram Webhook Error]', err);
    return c.text('OK', 200);
  }
});
