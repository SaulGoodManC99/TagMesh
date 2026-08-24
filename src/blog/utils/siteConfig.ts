export type ButtonStyle = 'tint' | 'clay' | 'glass';
export type ColorMode = 'auto' | 'light' | 'dark';

export interface SiteConfig {
  guestNotesEnabled: boolean;
  danmakuEnabled: boolean;
  buttonStyle: ButtonStyle;
  colorMode: ColorMode;
}

const STORAGE_KEY = 'tagmesh_site_config_v1';

const DEFAULT_CONFIG: SiteConfig = {
  guestNotesEnabled: true,
  danmakuEnabled: true,
  buttonStyle: 'tint',
  colorMode: 'auto',
};

export function getStoredSiteConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      guestNotesEnabled: typeof parsed.guestNotesEnabled === 'boolean' ? parsed.guestNotesEnabled : true,
      danmakuEnabled: typeof parsed.danmakuEnabled === 'boolean' ? parsed.danmakuEnabled : true,
      buttonStyle: ['tint', 'clay', 'glass'].includes(parsed.buttonStyle) ? parsed.buttonStyle : 'tint',
      colorMode: ['auto', 'light', 'dark'].includes(parsed.colorMode) ? parsed.colorMode : 'auto',
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveSiteConfig(newConfig: Partial<SiteConfig>): SiteConfig {
  const current = getStoredSiteConfig();
  const updated: SiteConfig = { ...current, ...newConfig };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    applySiteConfigToDOM(updated);
    window.dispatchEvent(new CustomEvent('tagmesh_site_config_changed', { detail: updated }));
  } catch {
    // ignore
  }
  return updated;
}

/**
 * Resolves whether dark mode is currently active (taking 'auto' system preference into account)
 */
export function isDarkModeActive(mode: ColorMode = getStoredSiteConfig().colorMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

export function applySiteConfigToDOM(config: SiteConfig = getStoredSiteConfig()): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Color mode
  const isDark = isDarkModeActive(config.colorMode);
  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme-mode', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme-mode', 'light');
  }

  // 2. Button style
  root.setAttribute('data-button-style', config.buttonStyle);
}
