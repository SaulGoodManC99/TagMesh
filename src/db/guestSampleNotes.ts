import { Note } from '../types/note';
import { db, extractExcerptFromMarkdown, countWordsAndChars, generateId } from './dexie';

export interface GuestSampleNoteRaw {
  content: string;
  tags: string[];
}

export const GUEST_10_SAMPLE_NOTES: GuestSampleNoteRaw[] = [
  // 1. 晨间手冲咖啡
  {
    content: `晨光、浅烘豆与手冲咖啡的治愈早晨 ☕

早晨七点半，阳光刚好穿过窗纱落在木质餐桌上。今天拆开了一包埃塞俄比亚耶加雪菲（水洗 G1）。

- **研磨参数**：C40 研磨度 24 格，中细研磨
- **冲煮水温**：92℃ 纯净水
- **注水比例**：15g 咖啡粉，总计注水 225g (1:15)
- **风味体验**：浓郁的茉莉花香扑鼻而来，入口有清脆的佛手柑红茶与柑橘酸甜感

让呼吸跟着热水注入的节奏慢下来，给新的一天注入温柔的能量。`,
    tags: ['#咖啡时光', '#生活美学', '#晨间仪式', '#治愈日常'],
  },

  // 2. 旧书店偶遇
  {
    content: `在街角二手书店偶遇一本泛黄的旧诗集 📚

下午避开喧闹的主街，拐进了一家藏在梧桐树荫下的旧书屋。木质地板走上去有轻微的吱呀声，空气里弥漫着陈年纸张特有的木质香气。

> “我们醒来，并在更广阔的梦境里相遇。”

在诗集的扉页上，有人用铅笔轻轻写着一句话：愿你在每一个平淡的黄昏里，都能找到属于自己的落日。

买下一杯温热的燕麦拿铁，在这里安静地读完了半本。`,
    tags: ['#读书笔记', '#旧书店', '#诗歌灵感', '#漫步城市'],
  },

  // 3. 雨后森林漫步
  {
    content: `雨后森林漫步：收集松果与泥土的清甜 🌲

初夏的午后下了一场暴雨，雨停后独自去后山森林栈道散步。微风拂过，树叶上的雨滴落在肩头，空气中泛着浓郁的泥土与青苔香气。

- 捡到了一颗形状完美的干燥松果 🌰
- 观察了木桩上刚刚冒头的一簇浅褐色野生菌 🍄
- 记录了 3 种不同鸟类的清脆鸣叫声 🐦

大自然拥有最神奇的治愈力，任何烦恼在山林里都变得微不足道。`,
    tags: ['#户外徒步', '#自然治愈', '#森林漫步', '#随笔'],
  },

  // 4. 极简桌面搭建
  {
    content: `极简无线桌面搭建与心流工作法复盘 🖥️

花了一个周末彻底整理了工作台，把所有杂乱的线缆全部收纳到了桌板下方理线槽内。

- **视觉降噪**：桌面只保留 27寸 4K 显示器、矮轴机械键盘与无线鼠标
- **触感升级**：铺了一块深灰色羊毛毡桌垫，敲击手感温润扎实
- **光影氛围**：显示器后方加装了 4000K 暖白光隐形灯带，夜间工作柔和不刺眼

干净清爽的物理空间，能瞬间降低大脑的认知负荷，进入专注心流状态。`,
    tags: ['#桌面搭建', '#数字游民', '#极简主义', '#效率工具'],
  },

  // 5. 周末暖心煲汤
  {
    content: `独居青年的周末暖心玉米排骨汤指南 🍲

周六的傍晚最适合在厨房里慢悠悠地煲一锅热汤。咕嘟咕嘟的炖煮声，是独居生活里最有安全感的背景音。

- **食材清单**：新鲜肋排 300g、甜玉米 1根、白萝卜半根、生姜 3片、红枣 4颗
- **慢炖秘诀**：排骨冷水下锅焯水洗净，大火烧开后转微火慢煨 1.5 小时
- **出锅调味**：出锅前 5 分钟撒少许海盐与白胡椒粉，撒一把鲜嫩葱花

汤清味甜，喝下一整碗热汤，整周的疲惫都被彻底驱散了。`,
    tags: ['#独居生活', '#美食日记', '#温暖治愈', '#周末日常'],
  },

  // 6. 观星夜记
  {
    content: `观星夜记：在楼顶天台寻觅夏季大三角 ✨

今夜空气通透度极高，趁着晴朗无云的夜色，带着便携双筒望远镜爬上了楼顶天台。

- **织女星 (Vega)**：天琴座最璀璨的蓝白色宝石，仰角最高，格外耀眼
- **牛郎星 (Altair)**：天鹰座中心，与织女星隔着银河星汉遥相辉映
- **天津四 (Deneb)**：天鹅座的尾羽，勾勒出壮阔的夏季大三角星群

躺在折叠椅上吹着夜风，宇宙浩瀚无垠，我们不过是星尘凝聚的一瞬。`,
    tags: ['#观星夜话', '#天文摄影', '#浩瀚宇宙', '#浪漫日常'],
  },

  // 7. 胶片相机的仪式感
  {
    content: `胶片相机的仪式感：记录无法被撤回的光影 📷

重新装上一卷 Kodak Gold 200 胶卷，带着老式旁轴相机走街串巷。

- 每一张快门都意味着一次深思熟虑的构图与呼吸
- 无法立刻在屏幕上回放确认，反而让人更专注地感受当下的光线与情绪
- 等待暗房冲洗扫描的过程，充满了类似拆开盲盒般的未知期待

颗粒感与轻微的色彩偏移，赋予了平凡生活最真实的胶片质感。`,
    tags: ['#胶片摄影', '#摄影手记', '#复古胶卷', '#街头抓拍'],
  },

  // 8. 手作陶艺初体验
  {
    content: `老城巷弄里的手作陶艺初体验 🏺

在古巷深处的一家陶艺工作室度过了一个安静的下午。双手沾满湿润清凉的陶土，在拉胚机旋转的韵律中感受重心的平衡。

- 从一块毫无形状的泥团，慢慢塑形出属于自己的茶杯雏形
- 手指稍有不匀杯壁就会倾斜，做陶器必须心无杂念、屏息凝神
- 选了温润的草木灰哑光釉，等待两周后的入窑烧制

不完美的器物边缘，恰恰留下了手作最真实的温度与痕迹。`,
    tags: ['#手作陶艺', '#匠人精神', '#周末去哪儿', '#生活体验'],
  },

  // 9. 私人第二大脑
  {
    content: `打造私人第二大脑与知识网状链接的极简原则 🧩

经过多年的笔记工具折腾，终于明白建立第二大脑的核心不是“把所有资料存起来”，而是“让灵感产生连接”。

- **收集 (Capture)**：只记录真正触动思考的核心洞见，绝不盲目做仓鼠收藏
- **去中心化 (Mesh)**：打破文件夹树状层级，让每条笔记通过标签自由相遇
- **创造与输出 (Create)**：定期在展厅视图中复盘知识星系，促成新的观点产出

工具越轻盈，思维越自由。`,
    tags: ['#第二大脑', '#知识管理', '#个人成长', '#认知升级'],
  },

  // 10. 晚风中的散步
  {
    content: `晚风中的散步与耳机里的落日歌单 🌙

晚上八点半，换上一双舒服的跑鞋出门散步。微风徐徐吹过街角的花坛，夏夜的气息扑面而来。

- **今日单曲循环**：落日飞车《I Know You Know I Love You》
- **路遇小确幸**：街角面包房飘出的现烤肉桂卷香味，路边慵懒打哈欠的橘猫 🐱
- **今日步数**：8,420 步，彻底放空了白天的疲倦与思绪

把今天的不开心留在晚风里，明天依然是充满希望的新一天。`,
    tags: ['#晚间散步', '#音乐歌单', '#治愈日常', '#晚安日记'],
  },
];

/**
 * Seed 10 guest notes into IndexedDB Dexie with clean text and isolated tags
 */
export async function seed10GuestSampleNotes(): Promise<number> {
  const now = Date.now();
  let inserted = 0;

  for (let i = 0; i < GUEST_10_SAMPLE_NOTES.length; i++) {
    const item = GUEST_10_SAMPLE_NOTES[i];
    const excerpt = extractExcerptFromMarkdown(item.content, 'Guest Note');
    const { wordCount, charCount } = countWordsAndChars(item.content);
    const timeOffset = (GUEST_10_SAMPLE_NOTES.length - i) * 1000 * 60 * 18;

    const note: Note = {
      id: generateId(),
      rawMarkdown: item.content,
      excerpt,
      tags: item.tags,
      wordCount,
      charCount,
      version: 1,
      isPinned: false,
      isDeleted: false,
      createdAt: now - timeOffset,
      updatedAt: now - timeOffset,
      isDirty: true,
      isOfficial: false,
      author: 'guest',
    };

    await db.notes.put(note);
    inserted++;
  }

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tagmesh_has_seeded_guest_notes_v2', 'true');
    }
  } catch {
    // ignore
  }

  return inserted;
}

// Backward compatibility export
export const GUEST_40_SAMPLE_NOTES = GUEST_10_SAMPLE_NOTES;
export const seed40GuestSampleNotes = seed10GuestSampleNotes;
