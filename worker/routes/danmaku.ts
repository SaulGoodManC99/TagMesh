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

export const danmakuRouter = new Hono<{ Bindings: Env }>();

const SEED_DANMAKUS: DanmakuItem[] = [
  {
    id: 'dm_seed_1',
    sender: '👑 馆长',
    avatar: '👑',
    content: '欢迎来到 TagMesh 灵感手账次元！敲击 # 即可把灵感编织成网 ✨',
    themeStyle: 'gold',
    likes: 42,
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'dm_seed_2',
    sender: '🌸 樱花酱',
    avatar: '🌸',
    content: '在这个手账世界里漫步，心都变得好平静呀 (っ˘ڡ˘ς)',
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
    content: '手账纸质纹理配这个触感音效，每天都想来写几笔 💖',
    themeStyle: 'rainbow',
    likes: 23,
    timestamp: Date.now() - 600000,
  },
];

let danmakuList: DanmakuItem[] = [...SEED_DANMAKUS];
let extraLikesTotal = 0;

function computeStats() {
  const sendersSet = new Set(danmakuList.map((d) => d.sender));
  const totalLaunches = danmakuList.length;
  const totalLikes = danmakuList.reduce((acc, curr) => acc + (curr.likes || 1), 0) + extraLikesTotal;

  return {
    totalSenders: Math.max(1, sendersSet.size),
    totalLaunches: Math.max(1, totalLaunches),
    totalLikes: Math.max(1, totalLikes),
  };
}

/**
 * GET /api/danmaku
 * Retrieve all shared danmakus and global telemetry stats
 */
danmakuRouter.get('/', (c) => {
  return c.json({
    success: true,
    danmakus: danmakuList,
    stats: computeStats(),
  });
});

/**
 * POST /api/danmaku
 * Publish a new danmaku visible to all connected devices
 */
danmakuRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<Partial<DanmakuItem>>();
    if (!body || !body.content?.trim()) {
      return c.json({ error: 'Missing content' }, 400);
    }

    const newDanmaku: DanmakuItem = {
      id: `dm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: body.sender?.trim() || '🎭 匿名旅人',
      avatar: body.avatar || (body.sender?.includes('馆长') ? '👑' : '🐾'),
      content: body.content.trim(),
      themeStyle: body.themeStyle || 'rainbow',
      likes: 1,
      timestamp: Date.now(),
    };

    danmakuList.unshift(newDanmaku);
    // Keep max 100 recent danmakus
    if (danmakuList.length > 100) {
      danmakuList = danmakuList.slice(0, 100);
    }

    return c.json({
      success: true,
      danmaku: newDanmaku,
      stats: computeStats(),
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Invalid payload' }, 500);
  }
});

/**
 * POST /api/danmaku/:id/like
 * Add a like to a danmaku
 */
danmakuRouter.post('/:id/like', (c) => {
  const id = c.req.param('id');
  const target = danmakuList.find((d) => d.id === id);
  if (target) {
    target.likes = (target.likes || 0) + 1;
    return c.json({ success: true, likes: target.likes, stats: computeStats() });
  }

  extraLikesTotal += 1;
  return c.json({ success: true, likes: 1, stats: computeStats() });
});

/**
 * DELETE /api/danmaku/:id
 * Moderate/delete a danmaku
 */
danmakuRouter.delete('/:id', (c) => {
  const id = c.req.param('id');
  danmakuList = danmakuList.filter((d) => d.id !== id);
  return c.json({ success: true, id, stats: computeStats() });
});
