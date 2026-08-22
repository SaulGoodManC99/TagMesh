import { Note } from '../types/note';
import { db, extractExcerptFromMarkdown, extractTagsFromMarkdown, countWordsAndChars, generateId } from './dexie';

export interface SampleNoteRaw {
  content: string;
  isPinned?: boolean;
}

export const SAMPLE_40_NOTES: SampleNoteRaw[] = [
  // --- TECH & CLOUDFLARE & SERVERLESS ---
  {
    isPinned: true,
    content: `欢迎来到 #TagMesh 黏土乐园与极客知识库 🎈

这里彻底摒弃了传统繁重的“文件夹层级”与“起标题焦虑”。只需敲击键盘，随性在正文中写下你的灵感，并在任意位置插入 #标签（例如 #cloudflare、#架构、#clay）。

## 🌈 多维展示模式随心切换
- **🍱 便当瀑布流 (Bento Grid)**：错落有致的 3D 黏土卡片。
- **🌌 漂浮重力宇宙 (Floating Bubble)**：失重漂浮、互动碰撞的灵感气泡。
- **🎴 3D 轮播穿梭 (3D Carousel)**：沉浸式 3D 翻转卡片。
- **📜 紧凑时光卷轴 (Timeline List)**：高效按时间线排布的清单。

#tagmesh #linear #geek #minimalism #clay`,
  },
  {
    isPinned: true,
    content: `Cloudflare Serverless 极速全栈架构实践 🚀

基于 **Cloudflare Workers + D1 SQLite + R2** 构建 0 冷启动、0 出站流量费用的全球边缘架构：

export default {
  async fetch(req, env, ctx) {
    const { results } = await env.DB.prepare("SELECT * FROM notes_fts MATCH ?").bind("cloudflare*").all();
    return Response.json({ status: "edge-fast", total: results.length });
  }
}

边缘毫秒级响应，数据自动同步至世界各地节点。

#cloudflare #serverless #sqlite #architecture`,
  },
  {
    content: `React 19 Server Components 与全新 Hooks 探索 ⚛️

React 19 带来了突破性的内置状态原语：
- useActionState：优雅处理表单提交与加载态
- useOptimistic：开箱即用的乐观更新 UI 体验
- 自动 React Compiler：无需手动编写 useMemo 与 useCallback

前端开发体验正在迎来十年未有的简化。

#react19 #frontend #javascript #webdev`,
  },
  {
    content: `为什么现代笔记系统应该彻底抛弃“树状文件夹”？ 🌳

从分类学的角度看，文件夹是一种**单维树状约束**。然而人类的大脑与灵感是**高维网状拓扑**：
1. 一篇笔记可能同时属于 #架构、#todo 与 #cloudflare。
2. 强迫用户在新建前决定分类，是扼杀写作冲动的头号元凶。
3. 纯 #标签网 + 全文检索 (FTS5) 才是终极生产力形态。

#mindset #productivity #pkm #knowledge`,
  },
  {
    content: `SQLite FTS5 全文搜索引擎的高性能微调技巧 🔍

在 SQLite 中启用 tokenize='porter unicode61' 可以完美支持中英文混排的分词与前缀通配符检索：

SELECT * FROM notes_fts WHERE notes_fts MATCH '"cloudflare"*' ORDER BY rank LIMIT 30;

毫秒级索引百万字文本，无需引入重型 ElasticSearch 集群！

#sqlite #fts5 #database #performance`,
  },
  {
    content: `Tailwind CSS v4 全新纯 CSS 引擎体验报告 ⚡

Tailwind v4 基于 Rust 核心与 Lightning CSS 重构：
- 彻底移除了 tailwind.config.js，一切通过纯 @import "tailwindcss"; 驱动
- 原生 CSS 变量驱动的全新颜色与阴影系统
- 编译速度暴涨 5~10 倍，热重载眨眼间完成！

#tailwindcss #css #frontend #dx`,
  },
  {
    content: `纯净 Serverless MCP (Model Context Protocol) 架构设计 🤖

为 Claude Desktop 与 Cursor 等外部 AI 编写纯净无污染的知识召回接口：
- search_by_tag：按标签网精准过滤
- search_fulltext：FTS5 毫秒检索
- create_or_update_note：双向回写

让本地 AI 成为你真正的第二大脑。

#mcp #ai #architecture #cursor`,
  },
  {
    content: `TypeScript 5.x 强类型元编程与常量类型推导 🛠️

使用 as const 与泛型参数推断构建类型安全的 API：

const createPayload = <const T extends string[]>(tags: T) => ({
  tags,
  count: tags.length,
});

在编译期抹平所有运行时隐患。

#typescript #coding #cleancode`,
  },

  // --- UI/UX & CLAYMORPHISM & DESIGN ---
  {
    content: `Claymorphism (黏土拟态) 的 3D 光影公式揭秘 🎨

要调配出 Q 弹立体的黏土质感，核心是**双层内发光 + 柔和外阴影**：
1. 内发光高光：模拟顶部环境光散射
2. 内阴影暗部：模拟底部材质受力
3. 外落阴影：打造悬浮于桌面的真实厚度

#clay #ui #design #css #art`,
  },
  {
    content: `给冰冷的软件注入一点“可爱感” (Emotional Design) 🧸

当软件界面从千篇一律的灰黑商务风，换上 **Fredoka / Baloo 2** 的圆润字体与糖果马卡龙色系时：
- 用户的认知疲劳大幅下降
- 互动意愿与写作欲望提升超过 40%
- 科技不应该是冷峻的，它应当像一块刚捏好的温热黏土。

#design #ux #emotion #creativity`,
  },
  {
    content: `弹性动画与弹簧物理曲线 (Spring Physics) 弹力美学 🎈

在 CSS 中使用 cubic-bezier(0.34, 1.56, 0.64, 1) 可以轻松实现超过 100% 回弹的萌系弹力效果。

点击与悬浮的瞬间就像按压了一块果冻！

#animation #css #ui #microinteraction`,
  },
  {
    content: `色盲友好的马卡龙对比度配色法 🌸

在设计高饱和度糖果界面时，务必保持 WCAG AA 级文字对比度：
- 樱花粉底色 (#FFF1F2) 搭配深李紫文字 (#9F1239)
- 浅海蓝底色 (#ECFEFF) 搭配深青蓝文字 (#155E75)
- 暖蜜黄底色 (#FFFBEB) 搭配焦糖褐文字 (#92400E)

美丽与可访问性完全可以兼得。

#design #color #a11y #ui`,
  },

  // --- PRODUCTIVITY & GEEK PHILOSOPHY ---
  {
    content: `Raycast 与 Linear 的“全键盘极客心流” (Flow State) ⌨️

顶尖工具的共同特质：永远不要强迫用户将右手从键盘移到鼠标上去找按钮：
- **Cmd + K**：一切指令的万能枢纽
- **Cmd + \\**：无缝展开/收起侧边栏
- **Cmd + N**：瞬间进入写作态

打字的速度，就是思考的速度。

#linear #raycast #geek #flow #productivity`,
  },
  {
    content: `费曼学习法与微笔记卡片 (Zettelkasten) 🧠

不要试图一次性写出万字长文。将复杂的概念拆解为独立的 #知识卡片：
1. 一张卡片只表达一个清晰原子概念
2. 用大白话解释给一个 10 岁小孩听
3. 通过 #标签 将卡片链接成知识晶体

#feynman #learning #pkm #knowledge`,
  },
  {
    content: `零阻力写作原则 (Zero Friction Rule) ✍️

写作最大的阻力在于“仪式感过重”：
- ❌ 思考标题 -> 挑选目录 -> 选择模板 -> 调整字号
- ✅ 打开即敲 -> 正文穿插标签 -> 自动提炼摘要 -> 毫秒级后台同步

删去一切阻碍灵感流淌的中间层。

#writing #creativity #minimalism #habits`,
  },
  {
    content: `如何对抗信息过载？“数字极简”实践手册 📵

- 取消所有非必要推送通知
- 用纯文本与 Markdown 记录重要决策
- 每天固定 45 分钟深度工作无干扰专注时段

在嘈杂的信息洪流中守护内心的秩序。

#minimalism #focus #life #habits`,
  },

  // --- FOOD & COFFEE & LIFE AESTHETICS ---
  {
    content: `手冲咖啡的黄金萃取公式 (Pour Over Coffee) ☕

一杯完美的耶加雪菲手冲日记：
- **粉水比**：1:15 (15g 浅烘豆，225g 热水)
- **水温**：92℃ 恒温手冲壶
- **三段式萃取**：30g 水闷蒸 30 秒 -> 注水至 130g -> 绕圈注水至 225g
- **风味轮**：明亮茉莉花香、柑橘酸甜与蜂蜜回甘 🍯

#coffee #lifestyle #recipe #relax`,
  },
  {
    content: `深夜日式溏心蛋拉面秘密高汤 🍜

家庭版 20 分钟浓郁高汤指南：
- 味噌 2 勺 + 芝麻酱 1 勺 + 蒜末 1 茶匙
- 倒入滚烫的骨汤或豆乳充分乳化
- 配上半熟溏心蛋、海苔脆片与炙烤叉烧

给忙碌代码之夜最好的温暖慰藉。

#food #cooking #life #delicious`,
  },
  {
    content: `松弛感烘焙：法式巴斯克焦香芝士蛋糕 🍰

哪怕是烘焙新手也能 100% 成功的甜点：
- 奶油奶酪 250g + 细砂糖 50g + 鸡蛋 2 颗 + 淡奶油 120g + 玉米淀粉 6g
- 220℃ 高温烘烤 25 分钟，表面形成迷人焦糖黑皮
- 冷藏一晚后，口感如同丝滑冰淇淋！

#baking #dessert #food #sweet`,
  },
  {
    content: `周末骑行与城市街角观察笔记 🚲

骑着小单车穿过梧桐树荫下的老街：
- 阳光穿过树叶洒在斑马线上的光斑
- 面包房里刚出炉的可颂黄油香气
- 灵感往往不在工位前，而在漫无目的的微风里。

#travel #cycling #citywalk #life`,
  },

  // --- TECH TIPS & ARCHITECTURE PATTERNS ---
  {
    content: `CSS has 选择器彻底颠覆父级样式控制 🪄

过去需要通过 JavaScript 监听子元素状态来切换父级类名，现在一行 CSS 搞定：

.clay-card:has(.pinned-badge) {
  border-color: #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);
}

现代 Web 标准正在变得无比强大。

#css #frontend #tips #webdev`,
  },
  {
    content: `IndexedDB + Dexie.js 离线优先 (Offline-First) 架构 💾

本地优先软件的三大核心要素：
1. 所有读写操作立即在本地 IndexedDB 完成（0 毫秒延迟响应）
2. 后台通过 1.5s 防抖无声增量同步到 Cloudflare D1
3. 网络断开时无缝切换为离线模式，重连后自动恢复

用户的数据永远属于本地。

#indexeddb #dexie #offline #architecture`,
  },
  {
    content: `Web Workers 在前端大文件处理中的魔力 🧵

将密集的 Markdown AST 解析与全库标签聚合丢给 Worker 线程，主线程始终保持 120 FPS 丝滑顺畅。

告别任何微小的输入卡顿。

#performance #javascript #webworker`,
  },
  {
    content: `SVG 滤镜打造真实黏土表面微颗粒噪点 🪨

在 CSS 中混入一点微弱的 SVG 噪点，可以瞬间让原本光滑的渐变呈现出像真正手工泥雕一样的有机质感。

#clay #svg #design #craftsmanship`,
  },

  // --- TRAVEL & CULTURE & NATURE ---
  {
    content: `京都雨天漫步：苔藓古寺与抹茶香 🍵

在琉璃光院的木廊上静坐，细听雨滴打在枫叶与青苔上的沙沙声：
- 窗外的雨雾与深浅交织的绿意
- 手捧一碗现沏的热抹茶，微苦中泛出甘甜
- 时间在这一刻仿佛完全静止了。

#travel #kyoto #japan #zen #peace`,
  },
  {
    content: `冰岛自驾指南：追逐极光与黑沙滩的浪 🌌

在零下十度的维克黑沙滩仰望夜空：
- 绿色的极光风暴如丝绸般在银河中翻涌
- 远方北大西洋的白色巨浪拍击着玄武岩柱
- 在大自然浩瀚的壮美前，一切代码 bug 都不值一提。

#travel #iceland #aurora #nature #adventure`,
  },
  {
    content: `徒步进入阿尔卑斯山脉的雪山秘境 🏔️

背上轻量化登山包，沿着高山草甸一路向上：
- 冰川融水汇聚成冰蓝色的湖泊
- 偶尔从岩壁间跃出的野生岩羚羊
- 山顶微风吹过脸颊，胸中尽是澄澈。

#hiking #outdoors #alps #mountains`,
  },
  {
    content: `寻找城市独立书店的隐秘角落 📚

在街巷深处推开一家推拉木门书店：
- 满屋旧纸与松木书架的气息
- 翻到一本绝版的排版设计老画册
- 实体书的厚度与触感，永远无法被屏幕完全取代。

#books #reading #bookstore #culture`,
  },

  // --- MINIMALISM & MINDFULNESS ---
  {
    content: `给自己的大脑做一次“垃圾回收” (Brain GC) 🧹

就像 V8 引擎定期清理内存垃圾一样，大脑也需要定期清空：
1. 拿出一张白纸，写下当前所有焦虑和待办
2. 划掉所有不可控的事情
3. 只保留 1 件当下最重要的事情立即着手

保持心智轻盈，才能持续输出高价值创造。

#mindset #mentalhealth #zen #productivity`,
  },
  {
    content: `番茄工作法进阶版：50/10 黄金节律 ⏱️

- **50 分钟全屏专注**：关闭一切通讯工具，戴上降噪耳机
- **10 分钟彻底离开屏幕**：眺望远方、伸展腰椎、喝一杯温水
- 持续 3 个周期，产出远胜于连续 8 小时浑浑噩噩的加班。

#focus #pomodoro #habits #wellness`,
  },
  {
    content: `早晨第一杯温水与晨间散步奇迹 ☀️

清晨起床后的前 30 分钟不要碰手机：
- 喝一杯 45℃ 温开水唤醒肠胃
- 站在阳台或下楼沐浴晨光 10 分钟，重置皮质醇生物钟
- 一整天精力充沛的秘密就在这里。

#morning #health #routine #wellness`,
  },
  {
    content: `为什么“少即是多”永远是经典设计法则？ 📐

在产品设计中，每增加一个配置项，都是在向用户转嫁决策成本：
- 优秀的设计不是没有东西可以添加，而是没有东西可以缩减
- 就像 TagMesh：没有标题框、没有文件夹树，只留下最纯粹的书写区。

#design #philosophy #minimalism #simplicity`,
  },

  // --- CREATIVE SPARKS & EXTRA INSPIRATIONS ---
  {
    content: `游戏化个人知识库的黏土徽章系统 🎮

如果在每一次写完笔记后，系统都能弹出一枚萌系立体黏土印章：
- 连续 7 天记录 ➜ 获得「☕ 咖啡大师」徽章
- 积累 100 个标签 ➜ 获得「🕸️ 织网蜘蛛」徽章
- 探索未分类内容 ➜ 获得「🧭 灵感探险家」徽章

用游戏般的乐趣驱动长久的知识积累！

#gamification #ideas #clay #creativity`,
  },
  {
    content: `给未来的自己写一封加密时间胶囊 ⏳

在笔记正文中打上 #timecapsule 标签：
- 记录下今天最开心的一个瞬间
- 设定一年后的今天通过邮件或通知提醒自己重温
- 看看当年的困惑如今是否已然迎刃而解。

#timecapsule #reflection #memories #life`,
  },
  {
    content: `黑客松 (Hackathon) 48 小时极速原型指南 💻

在有限时间内交付高亮 demo 的秘诀：
1. **砍掉 80% 的后台管理功能**，只打透一个惊艳核心路径
2. **选择开箱即用的前端全家桶** (Vite + Tailwind + Hono)
3. **视觉设计一定要拉满**，第一眼印象决定最终胜负！

#hackathon #startup #coding #builder`,
  },
  {
    content: `从 0 到 1 打造一款独立开发者产品的微日记 🛠️

独立开发最难的不是写代码，而是找到真实用户痛点：
- 永远尽早发布 (Ship Early)
- 倾听真实反馈，每天迭代一个微小改进
- 保持热情，做自己愿意每天使用的好产品。

#indiehacker #product #buildinpublic`,
  },
  {
    content: `晚间断网一小时与纸质书睡前阅读 🌙

睡前远离蓝光屏幕刺激：
- 点上一盏暖黄色香薰蜡烛
- 读上 20 页文学小说或自然随笔
- 伴着木质香气与平静的思绪安然入眠。

#night #reading #sleep #selfcare`,
  },
  {
    content: `在嘈杂的世界里，做一个敏锐的观察者 🔍

灵感从来不需要刻意搜寻，它就藏在日常的细微褶皱里：
- 咖啡杯壁上缓缓滑落的一滴水珠
- 窗外电线杆上排列整齐的几只小雀
- 记录下来，它们就是你最珍贵的精神土壤。

#inspiration #poetry #life #mindset`,
  },
  {
    content: `代码如诗：编写优雅、可读、自解释的现代架构 📜

好的代码就像一段优美的散文：
- 变量名即注释，函数体即逻辑演绎
- 没有复杂的深层嵌套，只有扁平清晰的单向数据流
- 让半年后的自己与协作者读起来如沐春风。

#cleancode #craftsmanship #programming #architecture`,
  },
  {
    content: `TagMesh 的愿景：让每个人享受无压力的灵感流转 ✨

没有传统工具沉重的认知包袱，有的只是像捏泥巴一样随性、快乐的书写体验：
- 随处敲击的 #标签网
- 缤纷立体的马卡龙黏土卡片
- 随时随地与外部 AI 连接的纯净接口

愿你的每一个灵感，都能在这里自由生长。

#tagmesh #vision #future #minimalism #clay`,
  },
];

/**
 * Seed all 40 sample notes into IndexedDB
 */
export async function seed40SampleNotes(): Promise<number> {
  const now = Date.now();
  let inserted = 0;

  for (let i = 0; i < SAMPLE_40_NOTES.length; i++) {
    const item = SAMPLE_40_NOTES[i];
    const excerpt = extractExcerptFromMarkdown(item.content, 'Sample note');
    const tags = extractTagsFromMarkdown(item.content);
    const { wordCount, charCount } = countWordsAndChars(item.content);
    const timeOffset = (SAMPLE_40_NOTES.length - i) * 1000 * 60 * 15; // 15 mins staggered

    const note: Note = {
      id: generateId(),
      rawMarkdown: item.content,
      excerpt,
      tags,
      wordCount,
      charCount,
      version: 1,
      isPinned: Boolean(item.isPinned),
      isDeleted: false,
      createdAt: now - timeOffset,
      updatedAt: now - timeOffset,
      isDirty: true,
      isOfficial: true,
      author: 'admin',
    };

    await db.notes.put(note);
    inserted++;
  }

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tagmesh_has_seeded_sample_notes_v1', 'true');
    }
  } catch {
    // ignore
  }

  return inserted;
}

/**
 * Reset all notes in DB with the 40 sample notes
 */
export async function resetWith40SampleNotes(): Promise<void> {
  await db.notes.clear();
  await seed40SampleNotes();
}
