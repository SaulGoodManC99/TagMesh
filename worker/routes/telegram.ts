import { Hono } from 'hono';
import { Env } from '../env';

export const telegramRouter = new Hono<{ Bindings: Env }>();

// Helper to extract hashtags from markdown (supports interspersed tags, CJK text, hyphens)
function extractTagsFromMarkdown(markdown: string): string[] {
  if (!markdown) return [];

  // Strip code blocks and inline code
  const cleanText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ');

  // Matches # followed by tag characters (CJK/English/Digits/Hyphen/Underscore)
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

// Helper to count words and characters
function countWordsAndChars(text: string): { wordCount: number; charCount: number } {
  if (!text) return { wordCount: 0, charCount: 0 };
  const clean = text.replace(/```[\s\S]*?```/g, '').replace(/[#*`_~[\]()>-]/g, ' ');
  const charCount = text.length;
  const cjkMatches = clean.match(/[\u4e00-\u9fa5]/g) || [];
  const latinMatches = clean.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const wordCount = cjkMatches.length + latinMatches.length;
  return { wordCount, charCount };
}

// Helper to extract excerpt
function extractExcerptFromMarkdown(markdown: string, fallback: string = 'Telegram 灵感笔记'): string {
  if (!markdown) return fallback;
  const lines = markdown.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, '').replace(/^[*-]\s*/, '').replace(/^>\s*/, '').trim();
    if (clean) return clean.slice(0, 120);
  }
  return fallback;
}

// Helper to send Telegram message
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

// Helper to get Telegram Bot Info
async function getTelegramMe(botToken: string): Promise<any> {
  const url = `https://api.telegram.org/bot${botToken}/getMe`;
  const res = await fetch(url);
  return await res.json();
}

// Ensure system_settings table exists
async function ensureSettingsTable(db: D1Database): Promise<void> {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();
  } catch (err) {
    console.warn('[Telegram] ensureSettingsTable warning:', err);
  }
}

// Helper to read setting from DB
async function getSetting(db: D1Database, key: string, fallback: string = ''): Promise<string> {
  try {
    await ensureSettingsTable(db);
    const row = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(key).first<{ value: string }>();
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

// Helper to write setting to DB
async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  await ensureSettingsTable(db);
  const now = Date.now();
  await db.prepare(`
    INSERT INTO system_settings (key, value, updated_at) 
    VALUES (?, ?, ?) 
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).bind(key, value, now).run();
}

// Mask bot token for secure frontend display (e.g. 7123456789:AAH...wxyz)
function maskToken(token: string): string {
  if (!token || token.length < 12) return token ? '********' : '';
  const prefix = token.slice(0, 10);
  const suffix = token.slice(-4);
  return `${prefix}...${suffix}`;
}

// ------------------------------------------------------------------------------------------------
// 1. GET /api/telegram/config - Get current configuration status
// ------------------------------------------------------------------------------------------------
telegramRouter.get('/config', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: 'Database not available' }, 500);
  }

  const token = await getSetting(db, 'telegram_bot_token', '');
  const userIds = await getSetting(db, 'telegram_user_ids', '');
  const webhookUrl = await getSetting(db, 'telegram_webhook_url', '');
  const enabled = await getSetting(db, 'telegram_enabled', '1');

  let botInfo: any = null;
  if (token) {
    try {
      const meRes = await getTelegramMe(token);
      if (meRes.ok) {
        botInfo = meRes.result;
      }
    } catch {
      // ignore
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
    botInfo,
  });
});

// ------------------------------------------------------------------------------------------------
// 2. POST /api/telegram/config - Save configuration
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/config', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json<{
      botToken?: string;
      userIds?: string;
      webhookUrl?: string;
      enabled?: boolean;
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

    return c.json({ ok: true, message: 'Telegram 配置保存成功' });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || '保存配置失败' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 3. POST /api/telegram/set-webhook - Register Webhook to Telegram API
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/set-webhook', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json<{ webhookUrl?: string }>().catch(() => ({ webhookUrl: undefined }));
    const token = await getSetting(db, 'telegram_bot_token', '');
    if (!token) {
      return c.json({ ok: false, error: '请先配置 Telegram Bot Token' }, 400);
    }

    let url = body.webhookUrl || (await getSetting(db, 'telegram_webhook_url', ''));
    if (!url) {
      // Auto deduce from request origin
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
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || '设置 Webhook 异常' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 4. POST /api/telegram/delete-webhook - Delete Webhook from Telegram
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/delete-webhook', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: 'Database not available' }, 500);
  }

  try {
    const token = await getSetting(db, 'telegram_bot_token', '');
    if (!token) {
      return c.json({ ok: false, error: '未找到 Bot Token' }, 400);
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
    const tgData: any = await tgRes.json();

    return c.json({ ok: true, message: 'Webhook 已解除绑定', result: tgData });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || '解除 Webhook 异常' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 5. POST /api/telegram/test - Send Test Message
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/test', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ ok: false, error: 'Database not available' }, 500);
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
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || '发送测试消息异常' }, 500);
  }
});

// ------------------------------------------------------------------------------------------------
// 6. POST /api/telegram/webhook - Main Webhook Handler
// ------------------------------------------------------------------------------------------------
telegramRouter.post('/webhook', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.text('OK', 200); // Always reply 200 to Telegram
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

    // Security Check: Sender ID must match authorized list
    if (authorizedUserIds.length > 0 && !authorizedUserIds.includes(senderId)) {
      const rejectMsg = `⛔ *未授权访问*\n\n您的 Telegram 用户 ID 为：\`${senderId}\`。\n请登录 TagMesh 管理员后台，在权限中心绑定此 ID 即可开启自动同步。`;
      await sendTelegramMessage(botToken, chatId, rejectMsg, 'Markdown').catch(() => {});
      return c.text('OK', 200);
    }

    // Extract message content
    let rawText = (message.text || message.caption || '').trim();

    // Handle Photo Message (If photo sent without caption or with caption)
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

    // Command Handlers
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
      const countRes = await db.prepare('SELECT COUNT(*) as total FROM notes WHERE is_deleted = 0').first<{ total: number }>();
      const totalNotes = countRes?.total ?? 0;
      const uptimeRes = await db.prepare("SELECT value FROM system_telemetry WHERE key = 'site_created_at'").first<{ value: string }>();
      const siteCreated = uptimeRes?.value ? new Date(Number(uptimeRes.value)).toLocaleDateString('zh-CN') : '2026-08';

      const statusMsg = `📊 *TagMesh 知识库实时概览*\n\n📚 笔记总量：*${totalNotes}* 篇\n👑 授权馆长：\`${senderId}\`\n🚀 运行环境：Cloudflare Workers + D1\n🗓️ 开馆时间：${siteCreated}\n\n✨ 发送任意文字或图片即可极速入库！`;
      await sendTelegramMessage(botToken, chatId, statusMsg, 'Markdown');
      return c.text('OK', 200);
    }

    if (rawText.startsWith('/recent') || rawText.startsWith('/last')) {
      const recentNotes = await db.prepare(`
        SELECT id, raw_markdown, excerpt, tags_json, created_at 
        FROM notes 
        WHERE is_deleted = 0 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all<{ id: string; raw_markdown: string; excerpt: string; tags_json: string; created_at: number }>();

      if (!recentNotes.results || recentNotes.results.length === 0) {
        await sendTelegramMessage(botToken, chatId, '📭 当前知识库暂无笔记，发送一条试试吧！');
        return c.text('OK', 200);
      }

      let reply = `📑 *最近入库的 3 篇笔记：*\n\n`;
      recentNotes.results.forEach((n, idx) => {
        const date = new Date(n.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const tags: string[] = JSON.parse(n.tags_json || '[]');
        const tagStr = tags.length > 0 ? ` [${tags.join(' ')}]` : '';
        reply += `${idx + 1}. *${n.excerpt}*\n   📅 ${date}${tagStr}\n\n`;
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

    // --------------------------------------------------------------------------------------------
    // Standard Message: Auto-Create Note in D1
    // --------------------------------------------------------------------------------------------
    const now = Date.now();
    const noteId = `tg_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const tags = extractTagsFromMarkdown(rawText);
    const excerpt = extractExcerptFromMarkdown(rawText, '来自 Telegram 的闪念');
    const { wordCount, charCount } = countWordsAndChars(rawText);
    const tagsJson = JSON.stringify(tags);

    // Insert into D1
    await db.prepare(`
      INSERT INTO notes (
        id, raw_markdown, excerpt, tags_json, word_count, char_count, 
        version, is_pinned, is_deleted, created_at, updated_at, synced_at, author, is_official
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?, ?, 'admin', 1)
    `).bind(noteId, rawText, excerpt, tagsJson, wordCount, charCount, now, now, now).run();

    // Insert into FTS5
    try {
      await db.prepare(`
        INSERT INTO notes_fts (id, raw_markdown, tags_json)
        VALUES (?, ?, ?)
      `).bind(noteId, rawText, tagsJson).run();
    } catch (ftsErr) {
      console.warn('[Telegram Webhook] FTS index insert failed:', ftsErr);
    }

    // Send confirmation receipt to Telegram
    const tagDisplay = tags.length > 0 ? tags.join(' ') : '无标签';
    const receipt = `✨ *灵感笔记已入库 TagMesh！*\n\n📝 *摘要：* ${excerpt}\n🏷️ *标签：* ${tagDisplay}\n📊 *字数：* ${wordCount} 字 (${charCount} 字符)\n⏰ *时间：* ${new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;

    await sendTelegramMessage(botToken, chatId, receipt, 'Markdown').catch((e) => {
      console.warn('[Telegram Webhook] Failed to send receipt:', e);
    });

    return c.text('OK', 200);
  } catch (err: any) {
    console.error('[Telegram Webhook Error]', err);
    return c.text('OK', 200);
  }
});
