/**
 * Danmaku Profanity & Sensitive Words Filter (弹幕智能防脏话与敏感词过滤器)
 */

// Common offensive, vulgar, harassment and spam keyword patterns
const PROFANITY_PATTERNS: RegExp[] = [
  /操你|草泥马|傻逼|煞笔|脑残|弱智|白痴|妈的|他妈的|尼玛|卧槽|肏|去死|垃圾|贱人|废物/gi,
  /fuck|shit|bitch|asshole|idiot|cunt|dick|bastard|pussy|stfu/gi,
  /加微|加v|微信|兼职|菠菜|赌博|包过|发票|高利贷|刷单|代考/gi,
];

/**
 * Automatically masks vulgar words with *** and flags them
 */
export function filterDanmakuContent(raw: string): { cleanText: string; isFlagged: boolean } {
  if (!raw) return { cleanText: '', isFlagged: false };

  let cleanText = raw;
  let isFlagged = false;

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(cleanText)) {
      isFlagged = true;
      cleanText = cleanText.replace(pattern, (match) => '*'.repeat(Math.max(match.length, 2)));
    }
  }

  return { cleanText, isFlagged };
}
