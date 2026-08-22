export interface EmojiItem {
  id: string;
  code: string; // e.g. ":smile:", ":thumbsup:"
  nameZh: string;
  nameEn: string;
  type: 'emoji' | 'meme' | 'sticker';
  category: 'smiley' | 'gesture' | 'heart_symbol' | 'clay_food';
  value: string; // Character e.g. "😀", "👍"
  keywords: string[];
}

export const EMOJI_MEME_DATABASE: EmojiItem[] = [
  // ==========================================
  // 😊 1. 经典笑脸与情绪表情 (Smiley & Emotions)
  // ==========================================
  {
    id: 'joy',
    code: ':joy:',
    nameZh: '笑哭',
    nameEn: 'Tears of Joy',
    type: 'emoji',
    category: 'smiley',
    value: '😂',
    keywords: ['joy', 'laugh', 'cry', 'tears', '笑哭', '大笑', '搞笑'],
  },
  {
    id: 'smile',
    code: ':smile:',
    nameZh: '微笑开心',
    nameEn: 'Grinning Face',
    type: 'emoji',
    category: 'smiley',
    value: '😄',
    keywords: ['smile', 'happy', 'joy', '开心', '笑脸', '高兴'],
  },
  {
    id: 'pleading',
    code: ':pleading:',
    nameZh: '可怜眼巴巴',
    nameEn: 'Pleading Face',
    type: 'emoji',
    category: 'smiley',
    value: '🥺',
    keywords: ['plead', 'puppy', 'cute', '可怜', '拜托', '眼巴巴', '求求'],
  },
  {
    id: 'heart_eyes',
    code: ':heart_eyes:',
    nameZh: '花痴爱意',
    nameEn: 'Heart Eyes',
    type: 'emoji',
    category: 'smiley',
    value: '😍',
    keywords: ['love', 'heart', 'crush', '喜欢', '心动', '花痴', '爱了'],
  },
  {
    id: 'party',
    code: ':party:',
    nameZh: '庆祝派对',
    nameEn: 'Partying Face',
    type: 'emoji',
    category: 'smiley',
    value: '🥳',
    keywords: ['party', 'celebrate', 'horn', '庆祝', '狂欢', '好耶', '派对'],
  },
  {
    id: 'thinking',
    code: ':thinking:',
    nameZh: '沉思',
    nameEn: 'Thinking',
    type: 'emoji',
    category: 'smiley',
    value: '🤔',
    keywords: ['think', 'hmm', 'ponder', '思考', '思考中', '沉思', '琢磨'],
  },
  {
    id: 'cool',
    code: ':cool:',
    nameZh: '酷炫墨镜',
    nameEn: 'Cool Sunglasses',
    type: 'emoji',
    category: 'smiley',
    value: '😎',
    keywords: ['cool', 'sunglasses', 'boss', '酷', '墨镜', '大佬', '帅气'],
  },
  {
    id: 'sob',
    code: ':sob:',
    nameZh: '大哭流泪',
    nameEn: 'Loudly Crying',
    type: 'emoji',
    category: 'smiley',
    value: '😭',
    keywords: ['cry', 'tears', 'sad', '大哭', '伤心', '呜呜', '难过'],
  },
  {
    id: 'rofl',
    code: ':rofl:',
    nameZh: '笑翻满地打滚',
    nameEn: 'Rolling on the Floor Laughing',
    type: 'emoji',
    category: 'smiley',
    value: '🤣',
    keywords: ['rofl', 'lol', 'laugh', '笑翻', '打滚', '爆笑'],
  },
  {
    id: 'wink',
    code: ':wink:',
    nameZh: '眨眼俏皮',
    nameEn: 'Winking Face',
    type: 'emoji',
    category: 'smiley',
    value: '😉',
    keywords: ['wink', 'flirt', '俏皮', '眨眼', '你懂的'],
  },
  {
    id: 'star_struck',
    code: ':star_struck:',
    nameZh: '星星眼崇拜',
    nameEn: 'Star-Struck',
    type: 'emoji',
    category: 'smiley',
    value: '🤩',
    keywords: ['star', 'wow', 'amazing', '崇拜', '星星眼', '太棒了'],
  },
  {
    id: 'angel',
    code: ':angel:',
    nameZh: '纯真天使',
    nameEn: 'Smiling Face with Halo',
    type: 'emoji',
    category: 'smiley',
    value: '😇',
    keywords: ['angel', 'halo', 'innocent', '天使', '乖巧', '纯真'],
  },
  {
    id: 'sweat_smile',
    code: ':sweat_smile:',
    nameZh: '尴尬汗颜',
    nameEn: 'Grinning Face with Sweat',
    type: 'emoji',
    category: 'smiley',
    value: '😅',
    keywords: ['sweat', 'awkward', '汗', '尴尬', '擦汗'],
  },
  {
    id: 'mind_blown',
    code: ':mind_blown:',
    nameZh: '脑洞大开震碎',
    nameEn: 'Exploding Head',
    type: 'emoji',
    category: 'smiley',
    value: '🤯',
    keywords: ['shock', 'mindblown', 'boom', '炸裂', '震撼', '脑洞大开'],
  },

  // ==========================================
  // ✌️ 2. 常用与经典手势 (Gestures & Hands)
  // ==========================================
  {
    id: 'thumbsup',
    code: ':thumbsup:',
    nameZh: '绝赞点赞',
    nameEn: 'Thumbs Up',
    type: 'emoji',
    category: 'gesture',
    value: '👍',
    keywords: ['thumbsup', 'like', 'good', '点赞', '支持', '好的', '棒'],
  },
  {
    id: 'victory',
    code: ':victory:',
    nameZh: '剪刀手耶',
    nameEn: 'Victory Hand',
    type: 'emoji',
    category: 'gesture',
    value: '✌️',
    keywords: ['victory', 'peace', 'v', '耶', '胜利', '和平', '剪刀手'],
  },
  {
    id: 'clap',
    code: ':clap:',
    nameZh: '热烈鼓掌',
    nameEn: 'Clapping Hands',
    type: 'emoji',
    category: 'gesture',
    value: '👏',
    keywords: ['clap', 'applause', 'bravo', '鼓掌', '啪啪啪', '喝彩'],
  },
  {
    id: 'heart_hands',
    code: ':heart_hands:',
    nameZh: '双手比心',
    nameEn: 'Heart Hands',
    type: 'emoji',
    category: 'gesture',
    value: '🫶',
    keywords: ['heart', 'love', 'hands', '比心', '双手比心', '爱心手势'],
  },
  {
    id: 'highfive',
    code: ':highfive:',
    nameZh: '欢呼击掌',
    nameEn: 'Raising Hands',
    type: 'emoji',
    category: 'gesture',
    value: '🙌',
    keywords: ['highfive', 'praise', 'celebrate', '举手', '击掌', '好耶'],
  },
  {
    id: 'handshake',
    code: ':handshake:',
    nameZh: '握手合作',
    nameEn: 'Handshake',
    type: 'emoji',
    category: 'gesture',
    value: '🤝',
    keywords: ['handshake', 'deal', 'partner', '握手', '成交', '合作'],
  },
  {
    id: 'salute',
    code: ':salute:',
    nameZh: '敬礼致敬',
    nameEn: 'Saluting Face',
    type: 'emoji',
    category: 'gesture',
    value: '🫡',
    keywords: ['salute', 'respect', 'honor', '敬礼', '致敬', '遵命'],
  },
  {
    id: 'fist',
    code: ':fist:',
    nameZh: '加油握拳',
    nameEn: 'Raised Fist',
    type: 'emoji',
    category: 'gesture',
    value: '✊',
    keywords: ['fist', 'power', 'fight', '握拳', '加油', '冲', '奋斗'],
  },
  {
    id: 'wave',
    code: ':wave:',
    nameZh: '挥手问候',
    nameEn: 'Waving Hand',
    type: 'emoji',
    category: 'gesture',
    value: '👋',
    keywords: ['wave', 'hello', 'bye', '挥手', '你好', '再见', '打招呼'],
  },
  {
    id: 'call_me',
    code: ':call_me:',
    nameZh: '六六六电话',
    nameEn: 'Call Me Hand',
    type: 'emoji',
    category: 'gesture',
    value: '🤙',
    keywords: ['call', 'shaka', '666', '给力', '六六六', '联系'],
  },
  {
    id: 'crossed_fingers',
    code: ':crossed_fingers:',
    nameZh: '祈愿好运',
    nameEn: 'Crossed Fingers',
    type: 'emoji',
    category: 'gesture',
    value: '🤞',
    keywords: ['cross', 'luck', 'wish', '祈福', '好运', '保佑'],
  },

  // ==========================================
  // 💖 3. 灵感与心动符号 (Symbols & Sparks)
  // ==========================================
  {
    id: 'sparkles',
    code: ':sparkles:',
    nameZh: '闪亮星辉',
    nameEn: 'Sparkles',
    type: 'emoji',
    category: 'heart_symbol',
    value: '✨',
    keywords: ['sparkles', 'magic', 'shine', '闪光', '闪亮', '魔法', '星星'],
  },
  {
    id: 'fire',
    code: ':fire:',
    nameZh: '热情火焰',
    nameEn: 'Fire',
    type: 'emoji',
    category: 'heart_symbol',
    value: '🔥',
    keywords: ['fire', 'hot', 'lit', '火', '火焰', '热门', '爆火'],
  },
  {
    id: 'heart_sparkle',
    code: ':sparkling_heart:',
    nameZh: '闪光爱心',
    nameEn: 'Sparkling Heart',
    type: 'emoji',
    category: 'heart_symbol',
    value: '💖',
    keywords: ['heart', 'love', 'pink', '爱心', '喜欢', '心动', '闪亮心'],
  },
  {
    id: 'rocket',
    code: ':rocket:',
    nameZh: '极速火箭',
    nameEn: 'Rocket',
    type: 'emoji',
    category: 'heart_symbol',
    value: '🚀',
    keywords: ['rocket', 'launch', 'fast', '火箭', '发射', '起飞', '极速'],
  },
  {
    id: 'hundred',
    code: ':100:',
    nameZh: '满分百点',
    nameEn: 'Hundred Points',
    type: 'emoji',
    category: 'heart_symbol',
    value: '💯',
    keywords: ['100', 'perfect', 'score', '满分', '完美', '一百分'],
  },
  {
    id: 'lightbulb',
    code: ':bulb:',
    nameZh: '灵感灯泡',
    nameEn: 'Light Bulb',
    type: 'emoji',
    category: 'heart_symbol',
    value: '💡',
    keywords: ['bulb', 'idea', 'light', '灯泡', '灵感', '主意', '想到'],
  },

  // ==========================================
  // 🍮 4. 黏土甜点与美食 (Clay Sweets & Drinks)
  // ==========================================
  {
    id: 'pudding',
    code: ':pudding:',
    nameZh: '焦糖布丁',
    nameEn: 'Custard Pudding',
    type: 'emoji',
    category: 'clay_food',
    value: '🍮',
    keywords: ['pudding', 'dessert', 'custard', '布丁', '甜点', '焦糖'],
  },
  {
    id: 'coffee',
    code: ':coffee:',
    nameZh: '香浓咖啡',
    nameEn: 'Hot Beverage',
    type: 'emoji',
    category: 'clay_food',
    value: '☕',
    keywords: ['coffee', 'tea', 'cafe', '咖啡', '下午茶', '香浓'],
  },
  {
    id: 'cake',
    code: ':cake:',
    nameZh: '草莓蛋糕',
    nameEn: 'Shortcake',
    type: 'emoji',
    category: 'clay_food',
    value: '🍰',
    keywords: ['cake', 'strawberry', 'sweet', '蛋糕', '草莓', '甜品'],
  },
];

export const EMOJI_CATEGORIES = [
  { id: 'all', nameZh: '🌟 全部', nameEn: 'All' },
  { id: 'smiley', nameZh: '😊 笑脸情绪', nameEn: 'Smileys' },
  { id: 'gesture', nameZh: '✌️ 经典手势', nameEn: 'Gestures' },
  { id: 'heart_symbol', nameZh: '💖 灵感符号', nameEn: 'Symbols' },
  { id: 'clay_food', nameZh: '🍮 甜点美食', nameEn: 'Sweets' },
];

export function findEmojiByCode(code: string): EmojiItem | undefined {
  const clean = code.trim();
  return EMOJI_MEME_DATABASE.find(item => item.code.toLowerCase() === clean.toLowerCase());
}

export function searchEmojis(query: string, category: string = 'all'): EmojiItem[] {
  const q = query.trim().toLowerCase().replace(/^:/, '');
  return EMOJI_MEME_DATABASE.filter(item => {
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    if (!q) return true;
    return (
      item.nameZh.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.keywords.some(kw => kw.toLowerCase().includes(q))
    );
  });
}
