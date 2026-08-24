import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { playPop } from './soundEffects';
import { triggerParticleBurst } from './confetti';
import { EMOJI_MEME_DATABASE } from '../../editor/data/emojiMemeData';

export interface MarkdownRenderOptions {
  onTagClick?: (tag: string) => void;
  stripFirstHeading?: boolean;
}

// Fast shortcode lookup map (e.g. ":popcat:" -> "https://...")
const MEME_SHORTCODE_LOOKUP = new Map<string, { name: string; url: string }>();
EMOJI_MEME_DATABASE.forEach((item) => {
  if (item.type === 'meme' || item.type === 'sticker' || item.value.startsWith('http')) {
    MEME_SHORTCODE_LOOKUP.set(item.code.toLowerCase(), {
      name: item.nameZh || item.nameEn,
      url: item.value,
    });
  }
});

/**
 * Parses inline formatting: **bold**, `code`, [link](url), and #hashtag
 */
export function renderInlineContent(
  text: string,
  onTagClick?: (tag: string) => void
): React.ReactNode[] {
  if (!text) return [];

  // Pre-pass: replace standalone shortcodes e.g. :popcat: -> ![Pop Cat](url)
  let processedText = text;
  MEME_SHORTCODE_LOOKUP.forEach(({ name, url }, code) => {
    if (processedText.includes(code)) {
      processedText = processedText.replaceAll(code, `![${name}](${url})`);
    }
  });

  // Match: ![img](url), **bold**, `code`, [text](url), #tag
  const regex = /(!\[[^\n\]]*\]\([^\n)]+\)|\*\*[^*]+\*\*|`[^`]+`|\[[^\n\]]+\]\([^\n)]+\)|(?:^|\s)#[a-zA-Z0-9_\u4e00-\u9fa5-]+)/g;
  const parts = processedText.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline Markdown Image / Sticker (![alt](url)) - tight snug spacing (mx-0.5) without forced gaps
    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      return (
        <img
          key={idx}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          title={imgMatch[1]}
          className="inline-block h-8 w-8 object-contain align-middle mx-0.5 rounded-lg border border-white/80 dark:border-white/10 shadow-xs hover:scale-125 transition-transform"
        />
      );
    }

    // Clean, crisp Bold emphasis
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="md-bold font-bold text-neutral-950 dark:text-white not-italic">
          {inner}
        </strong>
      );
    }

    // Inline code pill
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code key={idx} className="candy-inline-code font-cute">
          {inner}
        </code>
      );
    }

    // Markdown Link
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold underline underline-offset-4 decoration-rose-300 dark:decoration-rose-500 hover:decoration-rose-500 transition-colors"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="w-3.5 h-3.5 inline ml-0.5" />
        </a>
      );
    }

    // Hashtag
    const tagTrimmed = part.trim();
    if (tagTrimmed.startsWith('#') && tagTrimmed.length > 1 && !tagTrimmed.startsWith('#http')) {
      return (
        <span
          key={idx}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }}
          onClick={(e) => {
            if (onTagClick) {
              e.preventDefault();
              e.stopPropagation();
              if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              playPop(650);
              onTagClick(tagTrimmed.toLowerCase());
            }
          }}
          className="candy-inline-tag font-bubble cursor-pointer"
        >
          {tagTrimmed}
        </span>
      );
    }

    return <span key={idx} className="font-medium text-neutral-800 dark:text-neutral-200">{part}</span>;
  });
}

/**
 * Terminal Code Block with macOS buttons and Copy Action
 */
const CodeBlockItem: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    playPop(620);
    triggerParticleBurst(e.clientX, e.clientY, 15);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 sm:my-8 rounded-[28px] overflow-hidden border-3 border-neutral-800 dark:border-white/10 bg-neutral-950 shadow-2xl select-text">
      {/* Terminal Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-900 border-b border-neutral-800 select-none">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block shadow-xs" />
          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block shadow-xs" />
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 inline-block shadow-xs" />
          <span className="ml-2 font-bubble text-xs text-neutral-400 font-semibold tracking-wider">
            {language || 'CODE / MARKDOWN'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bubble transition cursor-pointer border border-neutral-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Text */}
      <pre className="p-5 sm:p-6 text-pink-300 dark:text-pink-200 font-cute text-sm sm:text-[15px] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Line-aware block segmentation for Markdown
 */
function parseMarkdownToBlocks(markdown: string): string[] {
  const lines = markdown.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code fence
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentBlock.push(line);
      if (!inCodeBlock) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      continue;
    }

    if (inCodeBlock) {
      currentBlock.push(line);
      continue;
    }

    // Empty line breaks block
    if (!trimmed) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      continue;
    }

    // Headings always start their own block
    if (trimmed.startsWith('#')) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      blocks.push(trimmed);
      continue;
    }

    // Check if transition into list items, quotes, or dividers
    const isListOrTask = /^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || /^>\s/.test(trimmed) || trimmed === '---' || trimmed === '***';
    const prevWasListOrTask = currentBlock.length > 0 && 
      (/^[-*]\s/.test(currentBlock[0].trim()) || /^\d+\.\s/.test(currentBlock[0].trim()) || /^>\s/.test(currentBlock[0].trim()));

    if (isListOrTask && currentBlock.length > 0 && !prevWasListOrTask) {
      blocks.push(currentBlock.join('\n'));
      currentBlock = [line];
      continue;
    }

    if (!isListOrTask && prevWasListOrTask) {
      blocks.push(currentBlock.join('\n'));
      currentBlock = [line];
      continue;
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  return blocks;
}

/**
 * Complete rich-text Markdown Renderer for Note Detail Modal / Full Post
 */
export function renderMarkdownToBlocks(
  markdown: string,
  options: MarkdownRenderOptions = {}
): React.ReactNode[] {
  if (!markdown) return [];

  const { onTagClick, stripFirstHeading = false } = options;
  const blocks = parseMarkdownToBlocks(markdown);
  let hasSkippedFirstH1 = !stripFirstHeading;

  return blocks.map((block, idx) => {
    const trimmed = block.trim();

    // H1 Heading
    if (trimmed.startsWith('# ')) {
      if (!hasSkippedFirstH1) {
        hasSkippedFirstH1 = true;
        return null;
      }
      const content = trimmed.replace(/^#\s+/, '');
      return (
        <h1 key={idx} className="font-bubble text-2xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white mt-8 mb-4 tracking-tight leading-tight">
          {renderInlineContent(content, onTagClick)}
        </h1>
      );
    }

    // H2 Heading (Section Divider)
    if (trimmed.startsWith('## ')) {
      const content = trimmed.replace(/^##\s+/, '');
      return (
        <div key={idx} className="mt-8 mb-4">
          <h2 className="font-bubble text-xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{renderInlineContent(content, onTagClick)}</span>
          </h2>
          <div className="h-1 w-full bg-neutral-200/70 dark:bg-white/10 rounded-full mt-2.5" />
        </div>
      );
    }

    // H3 Heading (Subsection)
    if (trimmed.startsWith('### ')) {
      const content = trimmed.replace(/^###\s+/, '');
      return (
        <h3 key={idx} className="font-bubble text-lg sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-6 mb-3">
          {renderInlineContent(content, onTagClick)}
        </h3>
      );
    }

    // Blockquote / Callout
    if (trimmed.startsWith('> ')) {
      const content = trimmed.replace(/^>\s*/gm, '');
      return (
        <blockquote
          key={idx}
          className="border-l-4 border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 p-5 sm:p-7 rounded-3xl my-5 text-neutral-800/95 dark:text-neutral-200 leading-[2.0] font-medium text-[17px] sm:text-[18.5px] shadow-3xs"
        >
          <div>{renderInlineContent(content, onTagClick)}</div>
        </blockquote>
      );
    }

    // Code Block
    if (trimmed.startsWith('```')) {
      const langMatch = trimmed.match(/^```([a-zA-Z0-9_-]*)\n/);
      const language = langMatch ? langMatch[1] : '';
      const code = trimmed.replace(/^```[a-zA-Z0-9_-]*\n/, '').replace(/\n```$/, '');
      return <CodeBlockItem key={idx} code={code} language={language} />;
    }

    // Task list / Checkboxes
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      const lines = trimmed.split('\n');
      return (
        <ul key={idx} className="my-5 space-y-3.5">
          {lines.map((ln, lidx) => {
            const isChecked = ln.startsWith('- [x] ');
            const text = ln.replace(/^- \[[ x]\]\s*/, '');
            return (
              <li key={lidx} className="flex items-start gap-3.5 text-[17.5px] sm:text-[18.5px] leading-[2.0] font-medium">
                <span
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-1 transition-colors ${
                    isChecked ? 'bg-emerald-500 text-white shadow-xs' : 'border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>
                <span className={isChecked ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'}>
                  {renderInlineContent(text, onTagClick)}
                </span>
              </li>
            );
          })}
        </ul>
      );
    }

    // Unordered List with Clean Uniform Rose Bullet Disc
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const lines = trimmed.split('\n');
      return (
        <ul key={idx} className="my-5 space-y-3">
          {lines.map((ln, lidx) => {
            const cleanText = ln.replace(/^[-*]\s*/, '');
            return (
              <li key={lidx} className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 dark:bg-rose-500 mt-2.5 shrink-0 inline-block select-none" />
                <div className="flex-1 text-[17.5px] sm:text-[18.5px] text-neutral-800 dark:text-neutral-200 leading-[2.0] font-medium">
                  {renderInlineContent(cleanText, onTagClick)}
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    // Ordered List with Clean Counter Badges
    if (/^\d+\.\s/.test(trimmed)) {
      const lines = trimmed.split('\n');
      return (
        <ol key={idx} className="my-5 space-y-3.5">
          {lines.map((ln, lidx) => {
            const cleanText = ln.replace(/^\d+\.\s*/, '');
            return (
              <li key={lidx} className="flex items-start gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 font-bubble text-xs font-bold shrink-0 mt-1 border border-rose-200 dark:border-rose-900 select-none">
                  {lidx + 1}
                </span>
                <div className="flex-1 text-[17.5px] sm:text-[18.5px] text-neutral-800 dark:text-neutral-200 leading-[2.0] font-medium">
                  {renderInlineContent(cleanText, onTagClick)}
                </div>
              </li>
            );
          })}
        </ol>
      );
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      return (
        <div key={idx} className="my-8 flex items-center justify-center">
          <div className="w-full border-t-2 border-dashed border-rose-200 dark:border-white/10" />
        </div>
      );
    }

    // Markdown Images
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      return (
        <div key={idx} className="my-8 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white dark:border-white/10">
          <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full h-auto object-cover" />
          {imgMatch[1] && (
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 py-3 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-100 dark:border-white/10 font-medium">
              {imgMatch[1]}
            </p>
          )}
        </div>
      );
    }

    // Standard Paragraph with 2.0x line-height and comfortable 18px ~ 19px sizing
    return (
      <p key={idx} className="text-[17.5px] sm:text-[18.5px] text-neutral-800 dark:text-neutral-200 leading-[2.0] font-medium my-4.5">
        {renderInlineContent(trimmed, onTagClick)}
      </p>
    );
  });
}

/**
 * Compact Markdown Snippet for Grid/Polaroid/Floating cards
 */
export function renderCardMarkdownSnippet(
  markdown: string,
  maxLines: number = 3
): React.ReactNode {
  if (!markdown) return null;

  const clean = markdown
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .filter((l) => !l.trim().startsWith('#'))
    .slice(0, maxLines);

  return (
    <div className="space-y-1.5 text-[13.5px] sm:text-[14.5px] text-neutral-700 dark:text-neutral-200 font-cute leading-[1.8]">
      {clean.map((ln, idx) => {
        const trimmed = ln.trim();
        if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
          const isChecked = trimmed.startsWith('- [x] ');
          const text = trimmed.replace(/^- \[[ x]\]\s*/, '');
          return (
            <div key={idx} className="flex items-center gap-2 truncate">
              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${isChecked ? 'bg-emerald-500 text-white' : 'border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'}`}>
                {isChecked ? '✓' : ''}
              </span>
              <span className={isChecked ? 'line-through opacity-50 truncate' : 'truncate'}>
                {renderInlineContent(text)}
              </span>
            </div>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.replace(/^[-*]\s*/, '');
          return (
            <div key={idx} className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 dark:bg-rose-500 shrink-0" />
              <span className="truncate">{renderInlineContent(text)}</span>
            </div>
          );
        }
        if (trimmed.startsWith('> ')) {
          const text = trimmed.replace(/^>\s*/, '');
          return (
            <div key={idx} className="italic text-neutral-600 dark:text-neutral-300 pl-2 border-l-2 border-amber-300 dark:border-amber-500 truncate">
              {renderInlineContent(text)}
            </div>
          );
        }
        return (
          <p key={idx} className="truncate">
            {renderInlineContent(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export const renderRichMarkdown = renderMarkdownToBlocks;
