/**
 * Clean markdown serialization and parsing utilities with full Markdown AST support
 */

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.innerHTML = html;

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const childrenText = Array.from(el.childNodes).map(traverse).join('');

    switch (tagName) {
      case 'h1':
        return `# ${childrenText.trim()}\n\n`;
      case 'h2':
        return `## ${childrenText.trim()}\n\n`;
      case 'h3':
        return `### ${childrenText.trim()}\n\n`;
      case 'h4':
        return `#### ${childrenText.trim()}\n\n`;
      case 'p':
        return `${childrenText}\n\n`;
      case 'strong':
      case 'b':
        return `**${childrenText}**`;
      case 'em':
      case 'i':
        return `*${childrenText}*`;
      case 's':
      case 'del':
      case 'strike':
        return `~~${childrenText}~~`;
      case 'code':
        if (el.parentElement?.tagName.toLowerCase() === 'pre') {
          const lang = el.className.replace(/language-/, '') || '';
          return `\`\`\`${lang}\n${el.textContent || ''}\n\`\`\`\n\n`;
        }
        return `\`${childrenText}\``;
      case 'pre':
        if (el.querySelector('code')) {
          return childrenText;
        }
        return `\`\`\`\n${childrenText}\n\`\`\`\n\n`;
      case 'blockquote':
        return childrenText
          .trim()
          .split('\n')
          .map(line => `> ${line}`)
          .join('\n') + '\n\n';
      case 'ul':
        if (el.getAttribute('data-type') === 'taskList') {
          return childrenText + '\n';
        }
        return childrenText + '\n';
      case 'ol':
        return childrenText + '\n';
      case 'li': {
        const isTask = el.getAttribute('data-type') === 'taskItem';
        const isChecked = el.getAttribute('data-checked') === 'true';
        if (isTask) {
          return `- [${isChecked ? 'x' : ' '}] ${childrenText.trim()}\n`;
        }
        return `- ${childrenText.trim()}\n`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        return `![${alt}](${src})`;
      }
      case 'hr':
        return `\n---\n\n`;
      case 'br':
        return `\n`;
      default:
        return childrenText;
    }
  }

  const result = traverse(div);
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Converts Markdown string into Tiptap-compatible HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return markdown
    .split('\n\n')
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('# ')) return `<h1>${trimmed.replace(/^#\s+/, '')}</h1>`;
      if (trimmed.startsWith('## ')) return `<h2>${trimmed.replace(/^##\s+/, '')}</h2>`;
      if (trimmed.startsWith('### ')) return `<h3>${trimmed.replace(/^###\s+/, '')}</h3>`;
      if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
        const items = trimmed.split('\n').map((l) => {
          const checked = l.startsWith('- [x] ');
          const content = l.replace(/^- \[[ x]\]\s*/, '');
          return `<li data-type="taskItem" data-checked="${checked}"><p>${content}</p></li>`;
        }).join('');
        return `<ul data-type="taskList">${items}</ul>`;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').map(l => `<li><p>${l.replace(/^[-*]\s*/, '')}</p></li>`).join('');
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n').map(l => `<li><p>${l.replace(/^\d+\.\s*/, '')}</p></li>`).join('');
        return `<ol>${items}</ol>`;
      }
      if (trimmed.startsWith('> ')) {
        const quoteContent = trimmed.replace(/^>\s*/gm, '');
        return `<blockquote><p>${quoteContent}</p></blockquote>`;
      }
      if (trimmed.startsWith('```')) {
        const langMatch = trimmed.match(/^```([a-z0-9_-]*)\n/i);
        const lang = langMatch ? langMatch[1] : '';
        const codeContent = trimmed.replace(/^```[a-z0-9_-]*\n/i, '').replace(/\n```$/, '');
        return `<pre><code class="${lang ? `language-${lang}` : ''}">${codeContent}</code></pre>`;
      }
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        return `<hr />`;
      }
      
      const parsedContent = trimmed
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="clay-meme-img inline-block max-h-36 rounded-2xl border-2 border-white shadow-md my-1.5" />')
        .replace(/\n/g, '<br>');

      return `<p>${parsedContent}</p>`;
    })
    .join('');
}

/**
 * Extracts clean excerpt from markdown string
 */
export function extractExcerptFromMarkdown(markdown: string, fallback = 'Untitled note'): string {
  if (!markdown) return fallback;
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      // 1. Strip leading heading/quote/list markdown prefixes
      let clean = trimmed.replace(/^[#>*`\-\d.]+\s*/, '');
      // 2. Strip images ![alt](url) -> alt or [贴纸]
      clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_m, alt) => alt ? `${alt}` : '🖼️ [贴纸]');
      // 3. Strip links [text](url) -> text
      clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // 4. Strip emphasis and bold marks
      clean = clean.replace(/[*_`~]/g, '').trim();

      if (clean.length > 0) {
        return clean.slice(0, 60) || fallback;
      }
    }
  }
  return fallback;
}

/**
 * Counts words and characters from markdown text
 */
export function countWordsAndChars(markdown: string): { wordCount: number; charCount: number } {
  if (!markdown) return { wordCount: 0, charCount: 0 };
  const clean = markdown.replace(/[`#*_\-[\]()>]/g, ' ').trim();
  const charCount = clean.replace(/\s+/g, '').length;
  const wordCount = (clean.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_-]+/g) || []).length;
  return { wordCount, charCount };
}
