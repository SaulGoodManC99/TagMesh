import { Hono } from 'hono';
import { Env } from '../env';

export interface DanmakuItem {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  themeStyle: 'rainbow' | 'sakura' | 'cosmic' | 'zen' | 'gold' | 'default';
  likes: number;
  timestamp: number;
  isSelf?: boolean;
}

interface DbDanmakuRow {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  theme_style: string;
  likes: number;
  created_at: number;
}

export const danmakuRouter = new Hono<{ Bindings: Env }>();

const SEED_DANMAKUS: DanmakuItem[] = [
  {
    id: 'dm_seed_1',
    sender: '👑 馆长',
    avatar: '👑',
    content: '欢迎来到 TagMesh 灵感笔记次元！敲击 # 即可把灵感编织成网 ✨',
    themeStyle: 'gold',
    likes: 42,
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'dm_seed_2',
    sender: '🌸 樱花酱',
    avatar: '🌸',
    content: '在这个笔记世界里漫步，心都变得好平静呀 (っ˘ڡ˘ς)',
    themeStyle: 'sakura',
    likes: 29,
    timestamp: Date.now() - 3600000 * 1.5,
  },
  {
    id: 'dm_seed_3',
    sender: '🌌 星空旅人',
    avatar: '✨',
    content: '零文件夹焦虑的标签网状链接，写长篇笔记真的太爽了 🚀',
    themeStyle: 'cosmic',
    likes: 35,
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'dm_seed_4',
    sender: '🍵 抹茶猫猫',
    avatar: '🐾',
    content: '按住 ⌘ 顺滑跳转双向链接，思维全通了 (ฅ^•ﻌ•^ฅ)',
    themeStyle: 'zen',
    likes: 18,
    timestamp: Date.now() - 1800000,
  },
  {
    id: 'dm_seed_5',
    sender: '🌈 灵感捕手',
    avatar: '🎨',
    content: '笔记纸质纹理配这个触感音效，每天都想来写几笔 💖',
    themeStyle: 'rainbow',
    likes: 23,
    timestamp: Date.now() - 600000,
  },
];

function rowToDanmaku(row: DbDanmakuRow): DanmakuItem {
  return {
    id: row.id,
    sender: row.sender,
    avatar: row.avatar,
    content: row.content,
    themeStyle: (row.theme_style || 'rainbow') as any,
    likes: row.likes,
    timestamp: row.created_at,
  };
}

async function listD1Danmakus(db: D1Database): Promise<DanmakuItem[]> {
  try {
    const { results } = await db
      .prepare('SELECT * FROM danmakus ORDER BY created_at DESC LIMIT 100')
      .all<DbDanmakuRow>();

    if (!results || results.length === 0) {
      // Seed initial danmakus
      for (const seed of SEED_DANMAKUS) {
        await db
          .prepare(
            'INSERT OR IGNORE INTO danmakus (id, sender, avatar, content, theme_style, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )
          .bind(seed.id, seed.sender, seed.avatar, seed.content, seed.themeStyle, seed.likes, seed.timestamp)
          .run();
      }
      return [...SEED_DANMAKUS];
    }

    return results.map(rowToDanmaku);
  } catch (err) {
    console.warn('[D1 Danmaku Non-fatal]', err);
    return [...SEED_DANMAKUS];
  }
}

function computeStats(list: DanmakuItem[]) {
  const sendersSet = new Set(list.map((d) => d.sender));
  const totalLaunches = list.length;
  const totalLikes = list.reduce((acc, curr) => acc + (curr.likes || 1), 0);

  return {
    totalSenders: Math.max(1, sendersSet.size),
    totalLaunches: Math.max(1, totalLaunches),
    totalLikes: Math.max(1, totalLikes),
  };
}

/**
 * GET /api/danmaku
 * Retrieve all shared danmakus and global telemetry stats from D1
 */
danmakuRouter.get('/', async (c) => {
  const list = await listD1Danmakus(c.env.DB);
  return c.json({
    success: true,
    danmakus: list,
    stats: computeStats(list),
  });
});

/**
 * POST /api/danmaku
 * Publish a new danmaku saved into D1
 */
danmakuRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<Partial<DanmakuItem>>();
    if (!body || !body.content?.trim()) {
      return c.json({ error: 'Missing content' }, 400);
    }

    const now = Date.now();
    const newDanmaku: DanmakuItem = {
      id: `dm_${now}_${Math.random().toString(36).slice(2, 6)}`,
      sender: body.sender?.trim() || '🎭 匿名旅人',
      avatar: body.avatar || (body.sender?.includes('馆长') ? '👑' : '🐾'),
      content: body.content.trim(),
      themeStyle: body.themeStyle || 'rainbow',
      likes: 1,
      timestamp: now,
    };

    await c.env.DB.prepare(
      'INSERT INTO danmakus (id, sender, avatar, content, theme_style, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        newDanmaku.id,
        newDanmaku.sender,
        newDanmaku.avatar,
        newDanmaku.content,
        newDanmaku.themeStyle,
        newDanmaku.likes,
        newDanmaku.timestamp
      )
      .run();

    const list = await listD1Danmakus(c.env.DB);

    return c.json({
      success: true,
      danmaku: newDanmaku,
      stats: computeStats(list),
    });
  } catch (err: unknown) {
    return c.json({ error: String(err) }, 500);
  }
});

/**
 * POST /api/danmaku/:id/like
 * Add a like to a danmaku in D1
 */
danmakuRouter.post('/:id/like', async (c) => {
  const id = c.req.param('id');
  try {
    await c.env.DB.prepare('UPDATE danmakus SET likes = likes + 1 WHERE id = ?').bind(id).run();
    const list = await listD1Danmakus(c.env.DB);
    const target = list.find((d) => d.id === id);

    return c.json({
      success: true,
      likes: target ? target.likes : 1,
      stats: computeStats(list),
    });
  } catch (err: unknown) {
    return c.json({ error: String(err) }, 500);
  }
});

/**
 * DELETE /api/danmaku/:id
 * Moderate/delete a danmaku from D1
 */
danmakuRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await c.env.DB.prepare('DELETE FROM danmakus WHERE id = ?').bind(id).run();
    const list = await listD1Danmakus(c.env.DB);
    return c.json({ success: true, id, stats: computeStats(list) });
  } catch (err: unknown) {
    return c.json({ error: String(err) }, 500);
  }
});
