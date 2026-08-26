import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { EMOJI_MEME_DATABASE, EmojiItem } from '../data/emojiMemeData';
import { playPop, playChime } from '../../blog/utils/soundEffects';

export const EmojiColonPluginKey = new PluginKey('emojiColonSuggestion');

export interface EmojiColonOptions {
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const EmojiColonExtension = Extension.create<EmojiColonOptions>({
  name: 'emojiColon',

  addOptions() {
    return {
      suggestion: {
        char: ':',
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => {
          const q = query.toLowerCase().trim();
          if (!q) {
            // Default top 7 popular emotions & sparks
            return EMOJI_MEME_DATABASE.slice(0, 7);
          }

          const matches = EMOJI_MEME_DATABASE.filter((item) => {
            const codeMatch = item.code.toLowerCase().includes(q);
            const nameZhMatch = item.nameZh.toLowerCase().includes(q);
            const nameEnMatch = item.nameEn.toLowerCase().includes(q);
            const kwMatch = item.keywords.some((k) => k.toLowerCase().includes(q));
            return codeMatch || nameZhMatch || nameEnMatch || kwMatch;
          });

          return matches.slice(0, 8);
        },
        render: () => {
          let component: HTMLDivElement;
          let popup: TippyInstance[];
          let currentCommand: ((item: EmojiItem) => void) | null = null;
          let currentItems: EmojiItem[] = [];
          let activeIndex = 0;

          const updateMenu = (container: HTMLDivElement, props: any) => {
            const items: EmojiItem[] = props.items || [];
            currentItems = items;
            if (items.length === 0) {
              container.innerHTML = `
                <div class="px-3 py-2 text-neutral-400 text-xs font-cute">
                  未找到匹配表情
                </div>
              `;
              return;
            }

            activeIndex = Math.min(activeIndex, items.length - 1);
            if (activeIndex < 0) activeIndex = 0;

            container.innerHTML = `
              <div class="px-2.5 py-1 text-[10px] font-bubble font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 flex items-center justify-between">
                <span>✨ 情绪表情</span>
                <span>↑↓ 切换 • Enter 插入</span>
              </div>
              <div class="py-1 flex flex-col gap-0.5">
                ${items
                  .map(
                    (item, idx) => `
                    <button
                      type="button"
                      data-index="${idx}"
                      class="emoji-suggest-item ${
                        idx === activeIndex
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : 'hover:bg-neutral-100 text-neutral-700'
                      } flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl text-xs font-bubble transition-all cursor-pointer text-left w-full"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="w-5 h-5 flex items-center justify-center shrink-0 text-base">
                          ${
                            item.type === 'meme'
                              ? `<img src="${item.value}" class="w-4 h-4 object-contain rounded-xs" />`
                              : item.value
                          }
                        </span>
                        <span class="truncate">${item.code}</span>
                      </div>
                      <span class="text-[10px] ${idx === activeIndex ? 'text-white/80' : 'text-neutral-400'} truncate shrink-0">
                        ${item.nameZh}
                      </span>
                    </button>
                  `
                  )
                  .join('')}
              </div>
            `;

            // Bind click handlers
            const buttons = container.querySelectorAll('.emoji-suggest-item');
            buttons.forEach((btn, idx) => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentCommand && items[idx]) {
                  playPop(650);
                  currentCommand(items[idx]);
                }
              });
            });
          };

          return {
            onStart: (props) => {
              currentCommand = props.command;
              activeIndex = 0;
              component = document.createElement('div');
              component.className =
                'emoji-colon-suggestion-menu bg-white/95 border-2 border-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-md text-neutral-800 text-xs font-bubble ring-1 ring-black/5 z-50 clay-card min-w-[220px] max-w-[280px] animate-in zoom-in-95 duration-100';

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: component,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });

              updateMenu(component, props);
            },

            onUpdate: (props) => {
              currentCommand = props.command;
              if (popup && popup[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as any,
                });
              }
              updateMenu(component, props);
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup[0]?.hide();
                return true;
              }

              if (currentItems.length === 0) return false;

              if (props.event.key === 'ArrowDown') {
                activeIndex = (activeIndex + 1) % currentItems.length;
                updateMenu(component, { items: currentItems });
                return true;
              }

              if (props.event.key === 'ArrowUp') {
                activeIndex = (activeIndex - 1 + currentItems.length) % currentItems.length;
                updateMenu(component, { items: currentItems });
                return true;
              }

              if (props.event.key === 'Enter' || props.event.key === 'Tab') {
                if (currentItems[activeIndex] && currentCommand) {
                  playPop(650);
                  currentCommand(currentItems[activeIndex]);
                  return true;
                }
              }

              return false;
            },

            onExit: () => {
              if (popup && popup[0]) {
                popup[0].destroy();
              }
            },
          };
        },
        command: ({ editor, range, props }) => {
          const item = props as unknown as EmojiItem;
          if (!item) return;

          playChime();
          
          if (item.type === 'emoji' || item.type === 'sticker') {
            // Replace :code with character + space
            editor
              .chain()
              .focus()
              .insertContentAt(range, `${item.value} `)
              .run();
          } else if (item.type === 'meme') {
            // Replace :code with markdown image
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent(`![${item.nameZh}](${item.value})\n`)
              .run();
          }
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: EmojiColonPluginKey,
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
