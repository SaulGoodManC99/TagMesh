import { Extension, InputRule } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { getAllTagCounts } from '../../db/dexie';
import { playPop, playChime } from '../../blog/utils/soundEffects';

export const HashtagPluginKey = new PluginKey('hashtagSuggestion');

export interface HashtagOptions {
  onTagClick?: (tag: string) => void;
  onTagAbsorb?: (tag: string) => void;
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const HashtagExtension = Extension.create<HashtagOptions>({
  name: 'hashtag',

  addOptions() {
    return {
      onTagClick: undefined,
      onTagAbsorb: undefined,
      suggestion: {
        char: '#',
        allowSpaces: false,
        startOfLine: false,
        items: async ({ query }) => {
          const allTags = await getAllTagCounts();
          const q = query.toLowerCase();
          const filtered = allTags
            .filter(t => t.tag.replace(/^#/, '').toLowerCase().includes(q))
            .map(t => t.tag.replace(/^#/, ''));
          
          // Sort filtered tags alphabetically (A-Z)
          filtered.sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' }));

          if (query && !filtered.includes(query)) {
            return [query, ...filtered.slice(0, 7)];
          }
          return filtered.slice(0, 8);
        },
        render: () => {
          let component: any;
          let popup: TippyInstance[];
          let currentCommand: ((item: { id: string }) => void) | null = null;

          return {
            onStart: (props) => {
              currentCommand = props.command;
              component = document.createElement('div');
              component.className = 'tag-suggestion-menu bg-[#fdfbf7] border-3 border-white rounded-2xl p-2 shadow-2xl backdrop-blur-xl text-neutral-800 text-xs font-cute ring-1 ring-black/5 z-50 clay-card min-w-[180px] animate-in zoom-in-95 duration-100';

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

              const items = component.querySelectorAll('.suggestion-item');
              const active = component.querySelector('.suggestion-item.active');
              let activeIndex = Array.from(items).indexOf(active as Element);

              if (props.event.key === 'ArrowDown') {
                activeIndex = (activeIndex + 1) % items.length;
                setActiveItem(items, activeIndex);
                return true;
              }

              if (props.event.key === 'ArrowUp') {
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                setActiveItem(items, activeIndex);
                return true;
              }

              if (props.event.key === 'Enter' || props.event.key === 'Tab') {
                if (active) {
                  const tag = active.getAttribute('data-tag');
                  if (tag && currentCommand) {
                    playPop(650);
                    currentCommand({ id: tag });
                    return true;
                  }
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
          playChime();
          const cleanTag = props.id.startsWith('#') ? props.id : `#${props.id}`;
          
          // 1. Seamlessly absorb into bottom dock via callback
          const onAbsorb = (editor.extensionManager.extensions.find(e => e.name === 'hashtag')?.options as HashtagOptions)?.onTagAbsorb;
          if (onAbsorb) {
            onAbsorb(cleanTag);
          }

          // 2. Remove the inline #tag text from editor body so it doesn't clutter the prose!
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .run();
        },
      },
    };
  },

  // Input rule: when user finishes typing `#tag ` (space), absorb tag and remove text from editor
  addInputRules() {
    const onAbsorb = this.options.onTagAbsorb;

    return [
      new InputRule({
        find: /(?:^|\s)(#([a-zA-Z0-9_\u4e00-\u9fa5-]+))\s$/,
        handler: ({ state, range, match }) => {
          const rawTag = match[1];
          if (!rawTag) return;

          const tag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
          if (onAbsorb) {
            playChime();
            onAbsorb(tag);
          }

          // Delete the `#tag ` string from the prose text
          const { tr } = state;
          tr.delete(range.from, range.to);
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: HashtagPluginKey,
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

function updateMenu(component: HTMLElement, props: any) {
  component.innerHTML = '';
  if (!props.items || props.items.length === 0) {
    component.innerHTML = '<div class="px-3 py-2 text-neutral-400 font-cute text-xs italic">输入标签名并回车吸附到底部...</div>';
    return;
  }

  props.items.forEach((item: string, idx: number) => {
    const div = document.createElement('div');
    div.className = `suggestion-item px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition font-mono text-xs ${
      idx === 0 ? 'active bg-pink-100 text-pink-700 font-bold border border-pink-200 shadow-3xs' : 'hover:bg-amber-50 text-neutral-700'
    }`;
    div.setAttribute('data-tag', item);
    div.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span class="text-rose-500 font-bold">#</span>
        <span>${item}</span>
      </div>
      <span class="text-[10px] text-pink-500 font-cute">吸附至收纳盒 ↵</span>
    `;
    
    div.onclick = () => {
      playPop(650);
      props.command({ id: item });
    };

    component.appendChild(div);
  });
}

function setActiveItem(items: NodeListOf<Element>, activeIndex: number) {
  items.forEach((item, idx) => {
    if (idx === activeIndex) {
      item.classList.add('active', 'bg-pink-100', 'text-pink-700', 'font-bold', 'border', 'border-pink-200', 'shadow-3xs');
      item.classList.remove('hover:bg-amber-50', 'text-neutral-700');
    } else {
      item.classList.remove('active', 'bg-pink-100', 'text-pink-700', 'font-bold', 'border', 'border-pink-200', 'shadow-3xs');
      item.classList.add('text-neutral-700');
    }
  });
}
