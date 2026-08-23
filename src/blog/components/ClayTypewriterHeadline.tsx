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
    prefixZh: '把每一个灵感，\n捏成',
    highlightZh: '可爱的黏土卡片',
    suffixZh: ' ✨',
    prefixEn: 'Shape Every Idea into a \n',
    highlightEn: 'Cute Clay Card',
    suffixEn: ' ✨',
  },
  {
    prefixZh: '随时敲击 #标签，\n织就',
    highlightZh: '立体思维网',
    suffixZh: ' 🕸️',
    prefixEn: 'Type #hashtags anywhere to \nweave a ',
    highlightEn: 'Thought Mesh',
    suffixEn: ' 🕸️',
  },
  {
    prefixZh: '告别文件夹焦虑，\n自由切换 ',
    highlightZh: '5 种笔记展示模式',
    suffixZh: ' 🎡',
    prefixEn: 'Zero folder anxiety, \nfreely explore ',
    highlightEn: '5 Note Views',
    suffixEn: ' 🎡',
  },
  {
    prefixZh: '不仅是 Markdown，\n更是',
    highlightZh: '温暖治愈的创作乐园',
    suffixZh: ' 🎈',
    prefixEn: 'Not just Markdown, \na warm ',
    highlightEn: 'Creative Wonderland',
    suffixEn: ' 🎈',
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
        <span className="whitespace-pre-line text-neutral-900">
          {visibleFull}
        </span>
      );
    } else if (charCount <= prefixLen + highlightLen) {
      const visibleHighlight = visibleFull.slice(prefixLen);
      return (
        <span className="whitespace-pre-line">
          <span className="text-neutral-900">{prefixText}</span>
          <span className={`bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>
            {visibleHighlight}
          </span>
        </span>
      );
    } else {
      const visibleSuffix = visibleFull.slice(prefixLen + highlightLen);
      return (
        <span className="whitespace-pre-line">
          <span className="text-neutral-900">{prefixText}</span>
          <span className={`bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>
            {highlightText}
          </span>
          <span className="text-neutral-900">{visibleSuffix}</span>
        </span>
      );
    }
  };

  return (
    <div className="min-h-[7.5rem] sm:min-h-[9.5rem] lg:min-h-[12rem] flex items-center justify-center text-center mb-4 sm:mb-6">
      <h1 className="font-bubble text-3xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 leading-[1.15] tracking-tight text-center drop-shadow-sm">
        {renderStyledText()}
        <span className="inline-block w-1.5 sm:w-2 h-8 sm:h-12 lg:h-14 ml-2 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full animate-pulse align-middle shadow-md" />
      </h1>
    </div>
  );
};
