import React, { useState, useEffect } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useClayTheme } from '../utils/clayThemes';

interface SloganItem {
  prefixZh: string;
  highlightZh: string;
  suffixZh: string;
  prefixEn: string;
  highlightEn: string;
  suffixEn: string;
}

const SLOGANS: SloganItem[] = [
  {
    prefixZh: '捕获瞬时闪念，\n记录',
    highlightZh: '工作待办与生活灵感',
    suffixZh: ' ✨',
    prefixEn: 'Capture fleeting thoughts, \nrecord ',
    highlightEn: 'Work Tasks & Daily Sparks',
    suffixEn: ' ✨',
  },
  {
    prefixZh: '随手打上 #标签，\n井井有条整理',
    highlightZh: '会议纪要与学习笔记',
    suffixZh: ' 📑',
    prefixEn: 'Type #hashtags anytime, \nneatly organize ',
    highlightEn: 'Meeting Notes & Learnings',
    suffixEn: ' 📑',
  },
  {
    prefixZh: '晨间日记与读书随笔，\n随时开启',
    highlightZh: '轻松愉悦的记录时光',
    suffixZh: ' ☕',
    prefixEn: 'Daily journals & reading reflections, \nenjoy ',
    highlightEn: 'Pleasant Writing Moments',
    suffixEn: ' ☕',
  },
  {
    prefixZh: '无需复杂设置，\n随时记录',
    highlightZh: '每一个心动与闪光点',
    suffixZh: ' 💡',
    prefixEn: 'Zero complicated setup, \nfreely record ',
    highlightEn: 'Every Inspiring Moment',
    suffixEn: ' 💡',
  },
];

export const ClayTypewriterHeadline: React.FC = () => {
  const { locale } = useI18n();
  const { theme } = useClayTheme();

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentSlogan = SLOGANS[phraseIdx % SLOGANS.length];

  const fullText = locale === 'zh'
    ? `${currentSlogan.prefixZh}${currentSlogan.highlightZh}${currentSlogan.suffixZh}`
    : `${currentSlogan.prefixEn}${currentSlogan.highlightEn}${currentSlogan.suffixEn}`;

  const prefixText = locale === 'zh' ? currentSlogan.prefixZh : currentSlogan.prefixEn;
  const highlightText = locale === 'zh' ? currentSlogan.highlightZh : currentSlogan.highlightEn;

  useEffect(() => {
    setCharCount(0);
    setIsDeleting(false);
  }, [locale]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (charCount < fullText.length) {
        timer = setTimeout(() => {
          setCharCount((prev) => prev + 1);
        }, 75);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (charCount > 0) {
        timer = setTimeout(() => {
          setCharCount((prev) => prev - 1);
        }, 35);
      } else {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % SLOGANS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [charCount, isDeleting, fullText.length]);

  const visibleFull = fullText.slice(0, charCount);
  
  const renderStyledText = () => {
    const prefixLen = prefixText.length;
    const highlightLen = highlightText.length;

    if (charCount <= prefixLen) {
      return (
        <span className="whitespace-pre-line text-neutral-900 dark:text-white">
          {visibleFull}
        </span>
      );
    } else if (charCount <= prefixLen + highlightLen) {
      const visibleHighlight = visibleFull.slice(prefixLen);
      return (
        <span className="whitespace-pre-line">
          <span className="text-neutral-900 dark:text-white">{prefixText}</span>
          <span className={`bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>
            {visibleHighlight}
          </span>
        </span>
      );
    } else {
      const visibleSuffix = visibleFull.slice(prefixLen + highlightLen);
      return (
        <span className="whitespace-pre-line">
          <span className="text-neutral-900 dark:text-white">{prefixText}</span>
          <span className={`bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>
            {highlightText}
          </span>
          <span className="text-neutral-900 dark:text-white">{visibleSuffix}</span>
        </span>
      );
    }
  };

  // Find the longest slogan representation for ghost overlay to lock exact layout height across devices
  const longestSloganZh = "晨间日记与读书随笔，\n随时开启轻松愉悦的记录时光 ☕";
  const longestSloganEn = "Daily journals & reading reflections, \nenjoy Pleasant Writing Moments ☕";
  const ghostText = locale === 'zh' ? longestSloganZh : longestSloganEn;

  return (
    <div className="grid grid-cols-1 grid-rows-1 items-center justify-center text-center mb-4 sm:mb-6 w-full max-w-4xl mx-auto">
      {/* Invisible Ghost Pre-allocation Layer to eliminate CLS (Layout Shift) on all screen sizes */}
      <div 
        aria-hidden="true" 
        className="col-start-1 row-start-1 invisible select-none pointer-events-none opacity-0 flex items-center justify-center text-center w-full"
      >
        <h1 className="font-bubble text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.18] tracking-tight whitespace-pre-line text-center">
          <span>{ghostText}</span>
          <span className="inline-block w-1.5 sm:w-2 h-8 sm:h-12 lg:h-14 ml-2" />
        </h1>
      </div>

      {/* Real Animated Typewriter Layer */}
      <div className="col-start-1 row-start-1 z-10 flex items-center justify-center text-center w-full">
        <h1 className="font-bubble text-3xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white leading-[1.18] tracking-tight text-center drop-shadow-sm">
          {renderStyledText()}
          <span className="inline-block w-1.5 sm:w-2 h-8 sm:h-12 lg:h-14 ml-2 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full animate-pulse align-middle shadow-md" />
        </h1>
      </div>
    </div>
  );
};
