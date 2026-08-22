export interface DanmakuItem {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  themeStyle?: 'rainbow' | 'sakura' | 'cosmic' | 'zen' | 'gold' | 'default';
  likes: number;
  timestamp: number;
  isSelf?: boolean;
}

export const INITIAL_PRESET_SENDERS = [
  '🐱 喵酱主理人',
  '🚀 极客星际旅人',
  '🍮 焦糖布丁狂热者',
  '🍵 禅意茶客',
  '🎭 匿名旅人',
  '🌸 落樱手账家',
  '🌟 灵感捕手',
  '🧋 奶茶微糖',
];

export const DEFAULT_DANMAKU_PRESETS: DanmakuItem[] = [
  {
    id: 'dm_1',
    sender: '🐱 喵酱主理人',
    avatar: '🐾',
    content: '欢迎来到 TagMesh 黏土乐园！随手写下一篇灵感吧 🌸',
    themeStyle: 'sakura',
    likes: 24,
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'dm_2',
    sender: '🚀 极客星际旅人',
    avatar: '👨‍🚀',
    content: 'Cloudflare Workers + D1 边缘架构太丝滑了 💯 :rocket:',
    themeStyle: 'cosmic',
    likes: 18,
    timestamp: Date.now() - 3200000,
  },
  {
    id: 'dm_3',
    sender: '🍮 焦糖布丁狂热者',
    avatar: '🍮',
    content: '这个黏土 UI 质感太治愈了吧！按键还会 Q 弹波纹 💖 :popcat:',
    themeStyle: 'rainbow',
    likes: 42,
    timestamp: Date.now() - 2800000,
  },
  {
    id: 'dm_4',
    sender: '🍵 禅意茶客',
    avatar: '🍵',
    content: '没有文件夹层级，敲击 # 标签即可全自动归档，太懂写作了 ✨',
    themeStyle: 'zen',
    likes: 15,
    timestamp: Date.now() - 2400000,
  },
  {
    id: 'dm_5',
    sender: '🎭 匿名旅人',
    avatar: '🎭',
    content: '打字机主标题好酷！Bongo Cat 疯狂打鼓中 :bongo_cat: 🥁',
    themeStyle: 'gold',
    likes: 31,
    timestamp: Date.now() - 2000000,
  },
  {
    id: 'dm_6',
    sender: '🌸 落樱手账家',
    avatar: '🎀',
    content: '春日樱花心境粒子好唯美，飘落的时候还会随着风力旋转 🌸✨',
    themeStyle: 'sakura',
    likes: 29,
    timestamp: Date.now() - 1600000,
  },
  {
    id: 'dm_7',
    sender: '🌟 灵感捕手',
    avatar: '🌟',
    content: '已在此沉淀了 10 篇灵感笔记，3D 轮播穿梭台的手感绝了！',
    themeStyle: 'rainbow',
    likes: 20,
    timestamp: Date.now() - 1200000,
  },
  {
    id: 'dm_8',
    sender: '🎭 匿名旅人',
    avatar: '🐾',
    content: '求给 Ollie 礼貌猫来个大特写 :polite_cat: 😂',
    themeStyle: 'default',
    likes: 12,
    timestamp: Date.now() - 800000,
  },
  {
    id: 'dm_9',
    sender: '🧋 奶茶微糖',
    avatar: '🧋',
    content: '边喝珍珠奶茶边写手账，每一天都在闪闪发光 💖🥳',
    themeStyle: 'gold',
    likes: 36,
    timestamp: Date.now() - 400000,
  },
];

const LOCAL_STORAGE_DANMAKU_KEY = 'tagmesh_danmaku_list';
const LOCAL_STORAGE_LAUNCHES_KEY = 'tagmesh_danmaku_total_launches';
const LOCAL_STORAGE_SENDERS_KEY = 'tagmesh_danmaku_senders_set';

export function getStoredDanmakus(): DanmakuItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DANMAKU_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  // Initialize default presets if key doesn't exist
  localStorage.setItem(LOCAL_STORAGE_DANMAKU_KEY, JSON.stringify(DEFAULT_DANMAKU_PRESETS));
  return DEFAULT_DANMAKU_PRESETS;
}

export function saveNewDanmaku(danmaku: DanmakuItem): DanmakuItem[] {
  const current = getStoredDanmakus();
  const next = [danmaku, ...current.filter(d => d.id !== danmaku.id)].slice(0, 100);
  try {
    localStorage.setItem(LOCAL_STORAGE_DANMAKU_KEY, JSON.stringify(next));
    
    // Increment telemetry counters
    const currentLaunches = parseInt(localStorage.getItem(LOCAL_STORAGE_LAUNCHES_KEY) || `${current.length || DEFAULT_DANMAKU_PRESETS.length}`, 10);
    localStorage.setItem(LOCAL_STORAGE_LAUNCHES_KEY, (currentLaunches + 1).toString());

    let senders: string[] = [];
    const savedSenders = localStorage.getItem(LOCAL_STORAGE_SENDERS_KEY);
    if (savedSenders) {
      try { senders = JSON.parse(savedSenders); } catch { /* ignore */ }
    } else {
      senders = [...INITIAL_PRESET_SENDERS];
    }

    if (!senders.includes(danmaku.sender)) {
      senders.push(danmaku.sender);
      localStorage.setItem(LOCAL_STORAGE_SENDERS_KEY, JSON.stringify(senders));
    }
  } catch {
    // ignore
  }
  return next;
}

export function deleteStoredDanmaku(id: string): DanmakuItem[] {
  const current = getStoredDanmakus();
  const updated = current.filter(item => item.id !== id);
  try {
    localStorage.setItem(LOCAL_STORAGE_DANMAKU_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

/**
 * Reset all danmakus and telemetry to the factory default preset state (出厂默认重置)
 */
export function resetDanmakusToDefault(): DanmakuItem[] {
  try {
    localStorage.setItem(LOCAL_STORAGE_DANMAKU_KEY, JSON.stringify(DEFAULT_DANMAKU_PRESETS));
    localStorage.setItem(LOCAL_STORAGE_LAUNCHES_KEY, `${DEFAULT_DANMAKU_PRESETS.length}`);
    localStorage.setItem(LOCAL_STORAGE_SENDERS_KEY, JSON.stringify(INITIAL_PRESET_SENDERS));
  } catch {
    // ignore
  }
  return DEFAULT_DANMAKU_PRESETS;
}

/**
 * Clear all danmakus completely to zero (完全清空)
 */
export function clearAllDanmakus(): DanmakuItem[] {
  try {
    localStorage.setItem(LOCAL_STORAGE_DANMAKU_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_LAUNCHES_KEY, '0');
    localStorage.setItem(LOCAL_STORAGE_SENDERS_KEY, JSON.stringify([]));
  } catch {
    // ignore
  }
  return [];
}

export interface DanmakuTelemetryStats {
  totalSenders: number;
  totalLaunches: number;
  totalLikes: number;
}

export function getDanmakuTelemetryStats(): DanmakuTelemetryStats {
  try {
    const all = getStoredDanmakus();
    const storedLaunchesStr = localStorage.getItem(LOCAL_STORAGE_LAUNCHES_KEY);
    const storedLaunches = storedLaunchesStr !== null ? parseInt(storedLaunchesStr, 10) : all.length;
    
    let senders: string[] = [];
    const savedSenders = localStorage.getItem(LOCAL_STORAGE_SENDERS_KEY);
    if (savedSenders) {
      try { senders = JSON.parse(savedSenders); } catch { /* ignore */ }
    } else {
      senders = [...INITIAL_PRESET_SENDERS];
    }
    
    const uniqueSendersInPool = new Set([...senders, ...all.map(d => d.sender)]);
    const totalLikes = all.reduce((sum, item) => sum + (item.likes || 0), 0);

    return {
      totalSenders: uniqueSendersInPool.size,
      totalLaunches: Math.max(storedLaunches, all.length),
      totalLikes,
    };
  } catch {
    return {
      totalSenders: INITIAL_PRESET_SENDERS.length,
      totalLaunches: DEFAULT_DANMAKU_PRESETS.length,
      totalLikes: 227,
    };
  }
}
