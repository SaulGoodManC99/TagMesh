import { useEffect } from 'react';

export interface ShortcutHandlers {
  onToggleCommandPalette?: () => void;
  onToggleSidebar?: () => void;
  onNewNote?: () => void;
  onForceSave?: () => void;
  onToggleShortcuts?: () => void;
  onToggleLanguage?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isTypingInInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Escape
      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      // Cmd/Ctrl + K
      if (isMeta && !isShift && key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        handlers.onToggleCommandPalette?.();
        return;
      }

      // Alt + N or ⌘N (Alt+N avoids browser hijacking new window)
      if ((isAlt && key === 'n') || (e.metaKey && !isShift && key === 'n')) {
        e.preventDefault();
        e.stopPropagation();
        handlers.onNewNote?.();
        return;
      }

      // Alt + S -> Toggle Sidebar
      if (isAlt && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        handlers.onToggleSidebar?.();
        return;
      }

      // Alt + / or '?' (when not typing) -> Shortcuts
      if ((isAlt && (key === '/' || key === '?')) || (!isTypingInInput && e.key === '?')) {
        e.preventDefault();
        e.stopPropagation();
        handlers.onToggleShortcuts?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handlers]);
}
