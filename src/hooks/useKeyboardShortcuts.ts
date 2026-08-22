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
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

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

      // Cmd/Ctrl + \ or Cmd/Ctrl + B
      if (isMeta && (key === '\\' || key === 'b')) {
        e.preventDefault();
        e.stopPropagation();
        handlers.onToggleSidebar?.();
        return;
      }

      // Cmd/Ctrl + N
      if (isMeta && !isShift && key === 'n') {
        e.preventDefault();
        e.stopPropagation();
        handlers.onNewNote?.();
        return;
      }

      // Cmd/Ctrl + S
      if (isMeta && !isShift && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        handlers.onForceSave?.();
        return;
      }

      // Cmd/Ctrl + Shift + L
      if (isMeta && isShift && key === 'l') {
        e.preventDefault();
        e.stopPropagation();
        handlers.onToggleLanguage?.();
        return;
      }

      // Cmd/Ctrl + /
      if (isMeta && !isShift && (key === '/' || key === '?')) {
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
