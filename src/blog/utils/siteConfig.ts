export type ButtonStyle = 'neon' | 'laser' | 'jelly' | 'tint' | 'clay' | 'glass';
export type ColorMode = 'auto' | 'light' | 'dark';

export interface SiteConfig {
  buttonStyle: ButtonStyle;
  colorMode: ColorMode;
}

const STORAGE_KEY = 'tagmesh_site_config_v1';

const DEFAULT_CONFIG: SiteConfig = {
  buttonStyle: 'neon',
  colorMode: 'auto',
};

export function getStoredSiteConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check cached server telemetry for global button style & color mode
      const cachedTelemetry = localStorage.getItem('tagmesh_cached_telemetry');
      if (cachedTelemetry) {
        const parsedTel = JSON.parse(cachedTelemetry);
        if (parsedTel?.globalButtonStyle) {
          return {
            buttonStyle: parsedTel.globalButtonStyle as ButtonStyle,
            colorMode: parsedTel.globalColorMode || 'auto',
          };
        }
      }
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    let resolvedStyle: ButtonStyle = 'neon';
    if (parsed.buttonStyle === 'blob' || parsed.buttonStyle === 'jelly') {
      resolvedStyle = 'jelly';
    } else if (['neon', 'laser', 'tint', 'clay', 'glass'].includes(parsed.buttonStyle)) {
      resolvedStyle = parsed.buttonStyle;
    }
    return {
      buttonStyle: resolvedStyle,
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
    localStorage.setItem('tagmesh_user_customized_v1', 'true');
    applySiteConfigToDOM(updated);
    window.dispatchEvent(new CustomEvent('tagmesh_site_config_changed', { detail: updated }));
  } catch {
    // ignore
  }
  return updated;
}

export function applyServerSiteConfig(globalButtonStyle?: string, globalColorMode?: string): void {
  try {
    const hasUserCustom = localStorage.getItem('tagmesh_user_customized_v1') === 'true';
    if (!hasUserCustom && globalButtonStyle) {
      let resolvedStyle: ButtonStyle = 'neon';
      if (['neon', 'laser', 'jelly', 'tint', 'clay', 'glass'].includes(globalButtonStyle)) {
        resolvedStyle = globalButtonStyle as ButtonStyle;
      }
      const resolvedColor = ['auto', 'light', 'dark'].includes(globalColorMode || '') ? (globalColorMode as ColorMode) : 'auto';
      const config: SiteConfig = { buttonStyle: resolvedStyle, colorMode: resolvedColor };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      applySiteConfigToDOM(config);
      window.dispatchEvent(new CustomEvent('tagmesh_site_config_changed', { detail: config }));
    }
  } catch {
    // ignore
  }
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
