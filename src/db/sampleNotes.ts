import { Note } from '../types/note';
import { db, extractExcerptFromMarkdown, extractTagsFromMarkdown, countWordsAndChars, generateId } from './dexie';

export interface SampleNoteRaw {
  content: string;
  isPinned?: boolean;
}

export const SAMPLE_40_NOTES: SampleNoteRaw[] = [
  {
    isPinned: true,
    content: "京都雨季：古寺苔藓与初夏紫阳花 🌸\n\n![紫阳花与古寺](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop)\n\n在三千院的庭园里听雨声淅沥。青苔吸饱了雨水，在古杉树荫下泛着温润的深绿。\n\n- **雨日漫步**：湿润的石阶，偶遇几株深蓝色的紫阳花正在盛开\n- **心境沉淀**：听雨滴顺着茅草屋檐滴落在青石钵上，时间仿佛慢了下来\n\n#京都旅行 #日系生活 #胶片摄影 #生活美学 #旅行手记",
  },
  {
    isPinned: true,
    content: "Cloudflare Workers + D1 边缘架构极速实战 ⚡\n\n基于 Serverless Edge 打造毫秒级冷启动的分布式 Markdown 笔记系统：\n\n```typescript\nexport async function queryNotes(db: D1Database, tag: string) {\n  const stmt = db.prepare(\n    \"SELECT * FROM notes WHERE tags LIKE ? ORDER BY updatedAt DESC LIMIT 20\"\n  ).bind(`%${tag}%`);\n  const { results } = await stmt.all();\n  return results;\n}\n```\n\n数据全球多活同步，无需管理服务器运维，零出站流量费用。\n\n#cloudflare #serverless #typescript #sqlite #架构",
  },
  {
    content: "种一棵树最好的时间是十年前，其次是现在。🌱\n\n不必焦虑起点，迈出第一步的瞬间，未来就已经开始发生改变。\n\n#闪念 #哲学 #每日一句 #思考",
  },
  {
    content: "埃塞俄比亚耶加雪菲手冲黄金萃取参数 ☕\n\n- **咖啡豆**：耶加雪菲 沃卡处理厂（水洗 G1）\n- **粉水比例**：15g 咖啡粉 / 225g 水 (1:15)\n- **研磨刻度**：中细研磨 (EK43s 8.5)\n- **萃取水温**：91℃ 纯净水\n- **注水阶段**：\n  1. 30g 闷蒸 30 秒\n  2. 绕圈注水至 130g (中心缓慢向外扩散)\n  3. 待液面下降至一半，平稳注水至 225g 截止\n\n茉莉花香与佛手柑红茶尾韵极度清亮悠长。\n\n#咖啡 #手冲 #生活美学 #日常仪式",
  },
  {
    content: "为什么“高维网状标签”远优于“单维树状文件夹”？ 🧠\n\n传统笔记软件最大的认知负担，在于强迫用户在新建的第一秒决定“它属于哪个文件夹”。\n\n然而真实世界的灵感永远是多维交织的：\n1. 一篇关于 Rust 编译器的文章，同时属于 #rust、#编译器、#系统编程 和 #阅读笔记；\n2. 树状层级结构逼迫你做出非此即彼的分类妥协；\n3. 通过自由敲击 #标签 建立拓扑网，配合全局 FTS5 检索，才是最贴合人类第二大脑的笔记形态。\n\n自由记录，自然相连。\n\n#第二大脑 #知识管理 #卡片盒笔记法 #认知升级 #tagmesh",
  },
  {
    content: "今日高效专注清单 🎯\n\n- [x] 重构 TagMesh 首页双层页脚与状态胶囊\n- [x] 优化瀑布流多层次动态阶梯高度算法\n- [x] 通过 MCP 协议写入全新多维笔记数据\n- [ ] 享受一杯热拿铁，记录黄昏落日灵感\n- [ ] 整理本周 GitHub Issue 反馈与功能路线图\n\n#todo #效率 #今日计划 #聚焦",
  },
  {
    content: "富士胶片 Classic Chrome 街头纪实色彩配方 📷\n\n![街头纪实胶片感](https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop)\n\n- **胶片模拟**：Classic Chrome (经典正片)\n- **动态范围**：DR400%\n- **高光色调**：-1.0 ｜ **阴影色调**：+1.5\n- **色彩效果**：Color Chrome Effect Strong\n- **白平衡偏移**：Auto (R:+1, B:-2)\n\n适合午后斜阳下的城市漫步，低饱和度搭配浓郁的暗部层次，故事感十足。\n\n#摄影 #富士胶片 #街拍 #色彩美学",
  },
  {
    content: "React 19 Compiler 与全新的内置 Action Hooks ⚛️\n\n```typescript\nconst [state, formAction, isPending] = useActionState(\n  async (prevState, formData) => {\n    const note = await saveNote(formData.get(\"content\"));\n    return { ok: true, note };\n  },\n  { ok: false, note: null }\n);\n```\n\n无需再手动编写繁重的 loading 状态管理，React 19 自动处理过渡态与表单挂起，代码精简了一半以上。\n\n#react19 #frontend #typescript #webdev",
  },
  {
    content: "极简主义不是一无所有，而是把空间留给真正重要之事 🍃\n\n物理桌面少一件杂物，内心就多一分清澈。从物理环境的断舍离，到信息输入的精选，专注真正能产生长远价值的创造。\n\n#极简生活 #断舍离 #专注 #心境",
  },
  {
    content: "深夜代码：Hono 轻量路由在边缘运行时的极致性能 🏎️\n\n体积不足 20KB，零外部冗余依赖，冷启动耗时接近 0ms。在 Cloudflare V8 隔离区内运行如同原生 C++ 般迅捷。\n\n```typescript\nimport { Hono } from 'hono';\nconst app = new Hono();\napp.get('/api/notes', (c) => c.json({ status: 'ok' }));\n```\n\n#hono #cloudflare #backend #typescript #性能优化",
  },
  {
    content: "晚风中的散步与耳机里的落日歌单 🌙\n\n![黄昏海岸线](https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop)\n\n晚上八点半，换上一双舒服的跑鞋出门散步。微风徐徐吹过街角，夏夜的气息扑面而来。\n\n- **今日单曲循环**：落日飞车《I Know You Know I Love You》\n- **路遇小确幸**：街角面包房飘出的现烤肉桂卷香味，路边慵懒打哈欠的橘猫 🐱\n- **今日步数**：8,420 步，放空了白天的疲倦\n\n把今天的不开心留在晚风里，明天依然是充满希望的新一天。\n\n#晚间散步 #音乐歌单 #治愈日常 #晚安日记",
  },
  {
    content: "Dexie.js 本地优先（Local-First）架构实践 💾\n\n为什么选择 IndexedDB 作为第一数据源？\n- **零延迟**：用户输入笔记的瞬间，数据在 0 毫秒内写入本地磁盘，绝不因网络卡顿丢失字符；\n- **全离线**：断网环境下依然可以无缝翻阅历史笔记、创建新内容；\n- **静默同步**：通过 1.5s 防抖调度在空闲时段增量同步至 Cloudflare D1。\n\n把控制权还给用户自己的设备。\n\n#localfirst #indexeddb #dexie #前端架构",
  },
  {
    content: "灵感如同夜空中的萤火虫，不及时捕捉便会隐入黑暗 ✨\n\n随身携带一个轻快无负担的笔记工具，随时随地把脑海中闪现的火花记录下来。\n\n#闪念 #灵感 #写作 #创造力",
  },
  {
    content: "夏日自制冷萃咖啡（Cold Brew）风味指南 🧊\n\n1. **豆种选择**：浅中烘焙埃塞俄比亚耶加雪菲（粗研磨，如粗海盐状）\n2. **粉水比例**：1:10 (40g 咖啡粉 / 400g 冰纯净水)\n3. **冷藏浸泡**：封口置于冰箱 4℃ 冷藏室缓慢萃取 16~18 小时\n4. **风味呈现**：过滤后入口有强烈的白桃乌龙茶感与柑橘果酸，顺滑无苦涩\n\n加两片鲜柠檬和气泡水，就是一杯顶级的冰美式特调。\n\n#咖啡 #冷萃 #夏日饮品 #日常美学",
  },
  {
    content: "3D 拟物黏土风（Claymorphism）设计哲学 🎨\n\n扁平化设计统治了十年后，人类对触觉感官的渴望重新觉醒。\n- 双重柔和内阴影 (Double Soft Inner Shadow)\n- 圆润厚实的倒角 (Rounded Clay Geometry)\n- 微透光的马卡龙色调 (Subtle Macaron Translucency)\n\n赋予数字界面如同真实黏土般温暖可触的治愈质感。\n\n#设计 #clay #ui #ux #设计美学",
  },
  {
    content: "TypeScript 核心类型体操技巧：DeepReadonly 📐\n\n```typescript\ntype DeepReadonly<T> = T extends Function | boolean | number | string | null | undefined\n  ? T\n  : T extends Array<infer U>\n  ? _DeepReadonlyArray<U>\n  : _DeepReadonlyObject<T>;\n\ninterface _DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}\ntype _DeepReadonlyObject<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };\n```\n\n在编译期构建不可变数据结构，彻底消除运行时浅拷贝副作用。\n\n#typescript #typegym #编程技巧 #clean-code",
  },
  {
    content: "在信息过载的时代，输入减半，输出翻倍 📚\n\n停止无休止的信息被动刷屏。读完一本书，写下 3 张核心闪念卡片；学完一个技术，亲手敲出一个最小可用 Demo。\n\n能用大白话向一个外行讲明白，才算真正内化了知识。\n\n#学习方法 #费曼学习法 #知识管理 #生产力",
  },
  {
    content: "东京下北泽二手黑胶与复古咖啡馆探店 🎷\n\n![复古黑胶唱片与咖啡](https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop)\n\n窄巷里隐蔽的爵士黑胶唱片店，木质地板在脚下发出轻微声响。点一杯深烘曼特宁，听着 Miles Davis 的小号声，在角落写下一整个下午的随笔。\n\n生活需要这样无所事事的专注时刻。\n\n#东京 #黑胶唱片 #探店 #爵士乐 #生活方式",
  },
  {
    content: "Model Context Protocol (MCP) 原生协议详解 🤖\n\nMCP 统一了 AI Agent 与外部数据源通信的标准规范：\n- **JSON-RPC 2.0 基础协议**：跨语言、轻量、双向通讯；\n- **Tools（工具）**：赋予 AI 主动调用外部 API（增删改查笔记）的能力；\n- **Resources（上下文资源）**：为 AI 提供结构化的只读参考资料；\n- **Prompts（提示词模版）**：固化最佳工作流与交互模版。\n\n让笔记库无缝蜕变为 AI 的外部记忆中枢。\n\n#mcp #ai #claude #modelcontextprotocol #llm",
  },
  {
    content: "每日晨间高能自律清单 ☀️\n\n- [x] 空腹饮用 300ml 温开水唤醒身体代谢\n- [x] 15 分钟晨间拉伸与冥想放空\n- [x] 打开 TagMesh 浏览昨日未完成的待办事项\n- [x] 列出今日最重要的 3 件核心攻坚目标\n- [ ] 晨光下享用一杯现磨手冲咖啡\n\n用秩序感开启高效专注的一天。\n\n#晨间习惯 #自律 #健康 #生活方式 #todo",
  },
  {
    content: "流水不争先，争的是滔滔不绝 🌊\n\n长期主义不是咬牙切齿的苦苦坚持，而是把热爱融入每一天的微小日常，静待时间的复利发生。\n\n#哲学 #长期主义 #人生思考 #闪念",
  },
  {
    content: "SQLite FTS5 全文检索引擎在 D1 上的实战技巧 🔍\n\n```sql\nCREATE VIRTUAL TABLE notes_fts USING fts5(\n  rawMarkdown,\n  tags,\n  tokenize='trigram'\n);\n```\n\n采用 Trigram 分词器实现零外部字典依赖的中英文子串极速匹配，在万级卡片量级下，端到端检索耗时始终稳定在 5 毫秒以内。\n\n#sqlite #d1 #fts5 #数据库 #全文检索",
  },
  {
    content: "雨夜书房：一本读了三遍的《设计心理学》 📖\n\n![书房台灯与书本](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop)\n\n真正的优秀设计是不着痕迹的。好的工具应当像空气一样自然：\n- 示能 (Affordance)：让用户一眼看出如何操作\n- 意符 (Signifiers)：明确传达意图\n- 反馈 (Feedback)：操作后即时给予定心丸\n\n让人在使用时感受不到界面的阻碍，全身心沉浸在创作的流动体验中。\n\n#读书笔记 #设计心理学 #产品思维 #阅读",
  },
  {
    content: "Tailwind CSS v4 现代化架构升级笔记 🎨\n\n全新基于 Rust 的 Oxide 编译引擎，热更新速度提升 10 倍以上：\n- 彻底告别繁琐的 `tailwind.config.js`\n- 直接在 CSS 中使用 `@theme` 原生变量指令扩展设计令牌\n- 原生原生支持容器查询与现代 CSS 选择器\n\n开发体验纯净得令人惊叹。\n\n#tailwind #css #frontend #webdev",
  },
  {
    content: "手冲单品豆烘焙度风味图谱对照表 🌰\n\n- **浅度烘焙 (Cinnamon / Light)**：保留产区明亮果酸与花香（如瑰夏、水洗耶加）\n- **中度烘焙 (City / Medium)**：焦糖甜感与坚果香气达到完美平衡（如哥伦比亚、危地马拉）\n- **深烘焙 (French / Dark)**：浓郁黑巧克力、雪茄烟熏与醇厚脂感（如苏门答腊曼特宁）\n\n根据季节和心境选择最适合的豆子。\n\n#咖啡知识 #手冲 #咖啡豆 #生活美学",
  },
  {
    content: "简单的代码比聪明的代码更有生命力 💻\n\n不要为了展示深奥的技巧而编写难以维护的高阶抽象。\n\n清晰可读、易于重构、没有隐式副作用的代码，才是能跨越时间的工程艺术品。\n\n#编程哲学 #clean-code #软件工程 #思考",
  },
  {
    content: "数字游民（Digital Nomad）极简随行装备清单 🎒\n\n- [x] MacBook Pro 14 寸 + 65W 氮化镓轻量充电头\n- [x] 主动降噪头戴耳机 (Sony WH-1000XM5)\n- [x] 罗技 MX Anywhere 3S 便携无线鼠标\n- [x] 阳极氧化铝合金超薄折叠支架\n- [ ] 护照夹、紧急备份 U 盘与常备药物包\n\n一个双肩包，随时随地开启移动办公。\n\n#数字游民 #数码装备 #极简出行 #效率",
  },
  {
    content: "周末厨房：自制生椰拿铁与热压芝士三明治 🥪\n\n![早午餐与热咖啡](https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop)\n\n周六早晨的厨房时光。厚椰乳 180g 打底加满冰块，缓缓注入双份浓缩咖啡（Espresso），黑白分层如水墨晕染。配上一块烤得金黄酥脆的芝士吐司，治愈感拉满。\n\n慢下来，感受食物带来的最纯粹的快乐。\n\n#早午餐 #咖啡 #美食制作 #治愈日常",
  },
  {
    content: "Vite 6 生产构建极致优化指南 ⚡\n\n```typescript\nexport default defineConfig({\n  build: {\n    rollupOptions: {\n      output: {\n        manualChunks: {\n          vendor: ['react', 'react-dom'],\n          editor: ['@tiptap/core', '@tiptap/react'],\n          db: ['dexie', 'dexie-react-hooks'],\n        },\n      },\n    },\n  },\n});\n```\n\n合理拆分 Vendor Chunks，结合 Gzip / Brotli 与 CDN 边缘强缓存，实现百毫秒首屏直出。\n\n#vite #性能优化 #前端构建 #打包优化",
  },
  {
    content: "建造你的数字花园（Digital Garden），而不是知识墓地 🌻\n\n传统笔记常常沦为“收藏从未阅读、记录从未回顾”的数字垃圾场。\n\n数字花园的核心哲学：\n1. **闪念幼苗 (Seedlings)**：零门槛随手捕获灵感碎片；\n2. **标签生长 (Sprouting)**：通过 #标签 网状连接让想法发酵；\n3. **常青结晶 (Evergreen)**：最终汇聚成经久不衰的知识森林。\n\n自由记录，自然生长。\n\n#数字花园 #第二大脑 #卡片盒笔记 #知识管理 #tagmesh",
  },
];

/**
 * Seed all 30 sample notes into IndexedDB
 */
export async function seed40SampleNotes(): Promise<number> {
  const now = Date.now();
  let inserted = 0;

  for (let i = 0; i < SAMPLE_40_NOTES.length; i++) {
    const item = SAMPLE_40_NOTES[i];
    const excerpt = extractExcerptFromMarkdown(item.content, 'Sample note');
    const tags = extractTagsFromMarkdown(item.content);
    const { wordCount, charCount } = countWordsAndChars(item.content);
    // Stagger dates across recent months (August, July, June, May 2026) for rich timeline milestones
    const daysOffset = Math.floor(i * 3.2);
    const timeOffset = daysOffset * 24 * 60 * 60 * 1000 + (i * 1000 * 60 * 15);

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
 * Reset all notes in DB with the sample notes
 */
export async function resetWith40SampleNotes(): Promise<void> {
  await db.notes.clear();
  await seed40SampleNotes();
}
