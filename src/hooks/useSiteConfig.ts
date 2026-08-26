import { useState, useEffect } from 'react';
import { 
  SiteConfig, 
  getStoredSiteConfig, 
  saveSiteConfig, 
  isDarkModeActive, 
  applySiteConfigToDOM,
  ButtonStyle,
  ColorMode
} from '../blog/utils/siteConfig';

export type { ButtonStyle, ColorMode, SiteConfig };

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(() => getStoredSiteConfig());
  const [isDark, setIsDark] = useState<boolean>(() => isDarkModeActive(config.colorMode));

  useEffect(() => {
    // Initial DOM setup
    applySiteConfigToDOM(config);

    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<SiteConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
        setIsDark(isDarkModeActive(customEvent.detail.colorMode));
      } else {
        const latest = getStoredSiteConfig();
        setConfig(latest);
        setIsDark(isDarkModeActive(latest.colorMode));
      }
    };

    const handleSystemThemeChange = () => {
      const current = getStoredSiteConfig();
      if (current.colorMode === 'auto') {
        const dark = isDarkModeActive('auto');
        setIsDark(dark);
        applySiteConfigToDOM(current);
      }
    };

    window.addEventListener('tagmesh_site_config_changed', handleConfigChange);

    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) {
      mql.addEventListener('change', handleSystemThemeChange);
    }

    return () => {
      window.removeEventListener('tagmesh_site_config_changed', handleConfigChange);
      if (mql) {
        mql.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, []);

  const updateConfig = (patch: Partial<SiteConfig>) => {
    const next = saveSiteConfig(patch);
    setConfig(next);
    setIsDark(isDarkModeActive(next.colorMode));
  };

  const setButtonStyle = (style: ButtonStyle) => updateConfig({ buttonStyle: style });
  const setColorMode = (mode: ColorMode) => updateConfig({ colorMode: mode });

  const toggleColorMode = () => {
    const modes: ColorMode[] = ['auto', 'light', 'dark'];
    const nextIdx = (modes.indexOf(config.colorMode) + 1) % modes.length;
    setColorMode(modes[nextIdx]);
  };

  return {
    config,
    isDark,
    buttonStyle: config.buttonStyle,
    colorMode: config.colorMode,
    updateConfig,
    setButtonStyle,
    setColorMode,
    toggleColorMode,
  };
}
