import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { playChime, playPop, playSoftTick } from './soundEffects';
import { triggerConfettiShower } from './confetti';
import { isDarkModeActive } from './siteConfig';
import { toast } from '../../components/ClayToast';

export type AtmosphereIntensity = 'off' | 'soft' | 'dynamic';

export interface NoteCardTheme {
  bg: string;
  darkBg?: string;
  tagPill: string;
  hoverGlow: string;
  emoji: string;
  accentBorder?: string;
}

export interface ClayTheme {
  id: 'sakura' | 'stars' | 'zen' | 'fireflies' | 'rain' | 'lavender' | 'matcha' | 'cyber';
  nameZh: string;
  nameEn: string;
  emoji: string;
  atmosphereDescZh: string;
  atmosphereDescEn: string;
  
  // Base backgrounds
  bg: string;
  darkBg: string;
  headerBg: string;
  darkHeaderBg: string;
  sidebarBg: string;
  darkSidebarBg: string;
  cardBg: string;
  darkCardBg: string;
  cardBorder: string;
  darkCardBorder: string;
  editorBg: string;
  darkEditorBg: string;

  // Brand / Accents
  primaryColor: string;
  primaryColorDark: string;
  primaryRgb: string;
  primaryDarkRgb: string;
  btnText: string;
  btnDarkText: string;
  primaryGradient: string;
  darkPrimaryGradient: string;
  accentText: string;
  glowColor: string;
  darkGlowColor: string;
  washiGradient: string;

  // UI tokens
  badgeBg: string;
  activeBtnClass: string;
  selectionBg: string;
  selectionText: string;
  island1Bg: string;
  island2Bg: string;
  universeRibbonBgs: string[];
  noteCardThemes: NoteCardTheme[];

  // Atmosphere particle color palette
  particlePalette: string[];
}

export const CLAY_THEMES: ClayTheme[] = [
  // 1. 🌸 樱花物语 (Sakura Bloom) - 浪漫、温润、治愈
  {
    id: 'sakura',
    nameZh: '樱花物语',
    nameEn: 'Sakura Bloom',
    emoji: '🌸',
    atmosphereDescZh: '落英缤纷 • 治愈花瓣随风轻拂',
    atmosphereDescEn: 'Falling petals & soft rose breeze',
    bg: '#fff1f3',
    darkBg: '#0f0e16',
    headerBg: '#ffe4e8',
    darkHeaderBg: '#161322',
    sidebarBg: '#fff1f3',
    darkSidebarBg: '#13111e',
    cardBg: '#ffffff',
    darkCardBg: '#18181b',
    cardBorder: 'rgba(244, 114, 182, 0.25)',
    darkCardBorder: 'rgba(244, 114, 182, 0.15)',
    editorBg: '#fff1f3',
    darkEditorBg: '#0f0e16',
    primaryColor: '#f43f5e',
    primaryColorDark: '#fb7185',
    primaryRgb: '244, 63, 94',
    primaryDarkRgb: '251, 113, 133',
    btnText: '#9f1239',
    btnDarkText: '#fecdd3',
    primaryGradient: 'from-pink-500 via-rose-500 to-amber-400',
    darkPrimaryGradient: 'from-pink-600 via-rose-600 to-amber-500',
    accentText: 'text-rose-600 dark:text-rose-400',
    glowColor: 'rgba(244, 114, 182, 0.45)',
    darkGlowColor: 'rgba(244, 114, 182, 0.25)',
    washiGradient: 'from-pink-300 via-rose-300 to-amber-200',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    activeBtnClass: 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-300 border border-rose-300/90 dark:border-rose-500/40 shadow-sm',
    selectionBg: 'rgba(244, 114, 182, 0.35)',
    selectionText: '#881337',
    island1Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-rose-100/90 to-pink-100/70',
      'from-pink-100/90 to-amber-100/70',
      'from-amber-100/90 to-rose-100/70',
      'from-purple-100/90 to-pink-100/70',
      'from-rose-100/90 to-orange-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🌸',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(236, 72, 153, 0.3)',
        emoji: '🎀',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🍓',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(168, 85, 247, 0.3)',
        emoji: '🍬',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🍑',
      },
    ],
    particlePalette: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#e11d48'],
  },

  // 2. 🌌 极光星瀚 (Cosmic Aurora) - 深邃、浩瀚、星河
  {
    id: 'stars',
    nameZh: '极光星瀚',
    nameEn: 'Cosmic Aurora',
    emoji: '🌌',
    atmosphereDescZh: '梦幻星河 • 极光与流星雨划过夜空',
    atmosphereDescEn: 'Starlit aurora & passing meteors',
    bg: '#ede9fe',
    darkBg: '#0c0a16',
    headerBg: '#e0e7ff',
    darkHeaderBg: '#131024',
    sidebarBg: '#ede9fe',
    darkSidebarBg: '#100d1e',
    cardBg: '#ffffff',
    darkCardBg: '#18181b',
    cardBorder: 'rgba(168, 85, 247, 0.25)',
    darkCardBorder: 'rgba(168, 85, 247, 0.15)',
    editorBg: '#ede9fe',
    darkEditorBg: '#0c0a16',
    primaryColor: '#8b5cf6',
    primaryColorDark: '#a78bfa',
    primaryRgb: '139, 92, 246',
    primaryDarkRgb: '167, 139, 250',
    btnText: '#5b21b6',
    btnDarkText: '#ede9fe',
    primaryGradient: 'from-purple-600 via-indigo-600 to-pink-500',
    darkPrimaryGradient: 'from-purple-700 via-indigo-700 to-pink-600',
    accentText: 'text-purple-700 dark:text-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    darkGlowColor: 'rgba(168, 85, 247, 0.25)',
    washiGradient: 'from-purple-300 via-indigo-300 to-pink-200',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    activeBtnClass: 'bg-purple-500/15 text-purple-600 dark:bg-purple-500/25 dark:text-purple-300 border border-purple-300/90 dark:border-purple-500/40 shadow-sm',
    selectionBg: 'rgba(168, 85, 247, 0.35)',
    selectionText: '#4c1d95',
    island1Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-purple-100/90 to-indigo-100/70',
      'from-indigo-100/90 to-pink-100/70',
      'from-pink-100/90 to-purple-100/70',
      'from-violet-100/90 to-cyan-100/70',
      'from-purple-100/90 to-blue-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(168, 85, 247, 0.3)',
        emoji: '🌌',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(99, 102, 241, 0.3)',
        emoji: '🪐',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(236, 72, 153, 0.3)',
        emoji: '🌠',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(6, 182, 212, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(139, 92, 246, 0.3)',
        emoji: '🔮',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '🌙',
      },
    ],
    particlePalette: ['#a855f7', '#818cf8', '#38bdf8', '#c084fc', '#f472b6'],
  },

  // 3. 🍵 禅意苔原 (Zen Bamboo) - 清幽、专注、生机
  {
    id: 'zen',
    nameZh: '禅意苔原',
    nameEn: 'Zen Bamboo',
    emoji: '🍵',
    atmosphereDescZh: '竹韵草木 • 晨曦水珠与金色浮游光斑',
    atmosphereDescEn: 'Dewdrops on bamboo & sunlit motes',
    bg: '#ecfdf5',
    darkBg: '#08110e',
    headerBg: '#d1fae5',
    darkHeaderBg: '#0f1c17',
    sidebarBg: '#ecfdf5',
    darkSidebarBg: '#0b1612',
    cardBg: '#ffffff',
    darkCardBg: '#18181b',
    cardBorder: 'rgba(16, 185, 129, 0.25)',
    darkCardBorder: 'rgba(16, 185, 129, 0.15)',
    editorBg: '#ecfdf5',
    darkEditorBg: '#08110e',
    primaryColor: '#059669',
    primaryColorDark: '#34d399',
    primaryRgb: '5, 150, 105',
    primaryDarkRgb: '52, 211, 153',
    btnText: '#065f46',
    btnDarkText: '#d1fae5',
    primaryGradient: 'from-emerald-600 via-teal-600 to-amber-500',
    darkPrimaryGradient: 'from-emerald-700 via-teal-700 to-amber-600',
    accentText: 'text-emerald-800 dark:text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    darkGlowColor: 'rgba(16, 185, 129, 0.25)',
    washiGradient: 'from-emerald-300 via-teal-300 to-lime-200',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    activeBtnClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-300/90 dark:border-emerald-500/40 shadow-sm',
    selectionBg: 'rgba(16, 185, 129, 0.35)',
    selectionText: '#064e3b',
    island1Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-emerald-100/90 to-teal-100/70',
      'from-lime-100/90 to-emerald-100/70',
      'from-teal-100/90 to-cyan-100/70',
      'from-green-100/90 to-emerald-100/70',
      'from-emerald-100/90 to-amber-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(16, 185, 129, 0.3)',
        emoji: '🍵',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(132, 204, 22, 0.3)',
        emoji: '🌿',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(20, 184, 166, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(34, 197, 94, 0.3)',
        emoji: '🍃',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '🎋',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(16, 185, 129, 0.3)',
        emoji: '🪵',
      },
    ],
    particlePalette: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#84cc16'],
  },

  // 4. 👑 琥珀盛夏 (Amber Glow) - 温暖、日暮、怀旧
  {
    id: 'fireflies',
    nameZh: '琥珀盛夏',
    nameEn: 'Amber Glow',
    emoji: '👑',
    atmosphereDescZh: '暖日琥珀 • 金色光尘与呼吸光晕',
    atmosphereDescEn: 'Amber glow & floating golden motes',
    bg: '#fef3c7',
    darkBg: '#120e07',
    headerBg: '#fde68a',
    darkHeaderBg: '#1c160b',
    sidebarBg: '#fef3c7',
    darkSidebarBg: '#17120a',
    cardBg: '#ffffff',
    darkCardBg: '#18181b',
    cardBorder: 'rgba(245, 158, 11, 0.25)',
    darkCardBorder: 'rgba(245, 158, 11, 0.15)',
    editorBg: '#fef3c7',
    darkEditorBg: '#120e07',
    primaryColor: '#d97706',
    primaryColorDark: '#fbbf24',
    primaryRgb: '217, 119, 6',
    primaryDarkRgb: '251, 191, 36',
    btnText: '#92400e',
    btnDarkText: '#fef3c7',
    primaryGradient: 'from-amber-500 via-orange-500 to-rose-500',
    darkPrimaryGradient: 'from-amber-600 via-orange-600 to-rose-600',
    accentText: 'text-amber-800 dark:text-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    darkGlowColor: 'rgba(245, 158, 11, 0.25)',
    washiGradient: 'from-amber-300 via-orange-300 to-yellow-200',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    activeBtnClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-300/90 dark:border-amber-500/40 shadow-sm',
    selectionBg: 'rgba(245, 158, 11, 0.35)',
    selectionText: '#78350f',
    island1Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-amber-100/90 to-yellow-100/70',
      'from-orange-100/90 to-amber-100/70',
      'from-yellow-100/90 to-rose-100/70',
      'from-amber-100/90 to-orange-100/70',
      'from-orange-100/90 to-pink-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '👑',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🍯',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(234, 179, 8, 0.3)',
        emoji: '🌻',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(245, 158, 11, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🍂',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(249, 115, 22, 0.3)',
        emoji: '🥞',
      },
    ],
    particlePalette: ['#f59e0b', '#fbbf24', '#f97316', '#fb923c', '#eab308'],
  },

  // 5. 🌊 深海微雨 (Ocean Dew) - 静谧、纯净、灵动
  {
    id: 'rain',
    nameZh: '深海微雨',
    nameEn: 'Ocean Dew',
    emoji: '🌊',
    atmosphereDescZh: '静谧雨幕 • 细雨涟漪与深海微光',
    atmosphereDescEn: 'Gentle raindrops & oceanic ripples',
    bg: '#ecfeff',
    darkBg: '#070f17',
    headerBg: '#cffafe',
    darkHeaderBg: '#0d1a26',
    sidebarBg: '#ecfeff',
    darkSidebarBg: '#0a141f',
    cardBg: '#ffffff',
    darkCardBg: '#18181b',
    cardBorder: 'rgba(6, 182, 212, 0.25)',
    darkCardBorder: 'rgba(6, 182, 212, 0.15)',
    editorBg: '#ecfeff',
    darkEditorBg: '#070f17',
    primaryColor: '#0891b2',
    primaryColorDark: '#22d3ee',
    primaryRgb: '8, 145, 178',
    primaryDarkRgb: '34, 211, 238',
    btnText: '#155e75',
    btnDarkText: '#cffafe',
    primaryGradient: 'from-cyan-600 via-sky-600 to-blue-600',
    darkPrimaryGradient: 'from-cyan-700 via-sky-700 to-blue-700',
    accentText: 'text-cyan-800 dark:text-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    darkGlowColor: 'rgba(6, 182, 212, 0.25)',
    washiGradient: 'from-cyan-300 via-sky-300 to-blue-200',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
    activeBtnClass: 'bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/25 dark:text-cyan-300 border border-cyan-300/90 dark:border-cyan-500/40 shadow-sm',
    selectionBg: 'rgba(6, 182, 212, 0.35)',
    selectionText: '#164e63',
    island1Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-cyan-100/90 to-sky-100/70',
      'from-sky-100/90 to-blue-100/70',
      'from-blue-100/90 to-teal-100/70',
      'from-teal-100/90 to-cyan-100/70',
      'from-cyan-100/90 to-indigo-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(6, 182, 212, 0.3)',
        emoji: '🌊',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(14, 165, 233, 0.3)',
        emoji: '💧',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(59, 130, 246, 0.3)',
        emoji: '🐟',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(20, 184, 166, 0.3)',
        emoji: '🫧',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(99, 102, 241, 0.3)',
        emoji: '🐚',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(14, 165, 233, 0.3)',
        emoji: '⛵',
      },
    ],
    particlePalette: ['#0284c7', '#0ea5e9', '#38bdf8', '#06b6d4', '#0d9488'],
  },

  // 6. 💜 紫藤落霞 (Twilight Lavender) - 暮色、诗意、温柔
  {
    id: 'lavender',
    nameZh: '紫藤落霞',
    nameEn: 'Twilight Lavender',
    emoji: '💜',
    atmosphereDescZh: '紫藤暮霞 • 暮色晚风与暮霭星光',
    atmosphereDescEn: 'Lavender twilight & evening stardust',
    bg: '#f5f3ff',
    darkBg: '#100e1c',
    headerBg: '#ede9fe',
    darkHeaderBg: '#18152b',
    sidebarBg: '#f5f3ff',
    darkSidebarBg: '#141124',
    cardBg: '#ffffff',
    darkCardBg: '#18181b',
    cardBorder: 'rgba(192, 132, 252, 0.25)',
    darkCardBorder: 'rgba(192, 132, 252, 0.15)',
    editorBg: '#f5f3ff',
    darkEditorBg: '#100e1c',
    primaryColor: '#9333ea',
    primaryColorDark: '#c084fc',
    primaryRgb: '147, 51, 234',
    primaryDarkRgb: '192, 132, 252',
    btnText: '#6b21a8',
    btnDarkText: '#f3e8ff',
    primaryGradient: 'from-violet-500 via-purple-500 to-rose-400',
    darkPrimaryGradient: 'from-violet-600 via-purple-600 to-rose-500',
    accentText: 'text-violet-800 dark:text-violet-400',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    darkGlowColor: 'rgba(192, 132, 252, 0.25)',
    washiGradient: 'from-violet-300 via-purple-300 to-pink-200',
    badgeBg: 'bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-900',
    activeBtnClass: 'bg-violet-500/15 text-violet-700 dark:bg-violet-500/25 dark:text-violet-300 border border-violet-300/90 dark:border-violet-500/40 shadow-sm',
    selectionBg: 'rgba(192, 132, 252, 0.35)',
    selectionText: '#581c87',
    island1Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-violet-100/90 to-purple-100/70',
      'from-purple-100/90 to-rose-100/70',
      'from-rose-100/90 to-violet-100/70',
      'from-fuchsia-100/90 to-indigo-100/70',
      'from-violet-100/90 to-pink-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(192, 132, 252, 0.3)',
        emoji: '💜',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(232, 121, 249, 0.3)',
        emoji: '🪻',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(244, 114, 182, 0.3)',
        emoji: '🌇',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(167, 139, 250, 0.3)',
        emoji: '✨',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(251, 146, 60, 0.3)',
        emoji: '🪁',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(192, 132, 252, 0.3)',
        emoji: '🌙',
      },
    ],
    particlePalette: ['#c084fc', '#e879f9', '#a78bfa', '#f472b6', '#fb923c'],
  },

  // 7. 🍃 抹茶森息 (Matcha Forest) - 自然、木香、清爽
  {
    id: 'matcha',
    nameZh: '抹茶森息',
    nameEn: 'Matcha Forest',
    emoji: '🍃',
    atmosphereDescZh: '草木森息 • 嫩芽茶香与微风落叶',
    atmosphereDescEn: 'Matcha tea aroma & forest breeze',
    bg: '#f2f8f2',
    darkBg: '#09120a',
    headerBg: '#e1efe1',
    darkHeaderBg: '#111d12',
    sidebarBg: '#f2f8f2',
    darkSidebarBg: '#0d180f',
    cardBg: '#ffffff',
    darkCardBg: '#18181b',
    cardBorder: 'rgba(132, 204, 22, 0.25)',
    darkCardBorder: 'rgba(132, 204, 22, 0.15)',
    editorBg: '#f2f8f2',
    darkEditorBg: '#09120a',
    primaryColor: '#65a30d',
    primaryColorDark: '#a3e635',
    primaryRgb: '101, 163, 13',
    primaryDarkRgb: '163, 230, 53',
    btnText: '#3f6212',
    btnDarkText: '#ecfccb',
    primaryGradient: 'from-lime-600 via-emerald-600 to-teal-500',
    darkPrimaryGradient: 'from-lime-700 via-emerald-700 to-teal-600',
    accentText: 'text-lime-800 dark:text-lime-400',
    glowColor: 'rgba(132, 204, 22, 0.45)',
    darkGlowColor: 'rgba(132, 204, 22, 0.25)',
    washiGradient: 'from-lime-300 via-emerald-300 to-teal-200',
    badgeBg: 'bg-lime-100 dark:bg-lime-950/80 text-lime-900 dark:text-lime-300 border-lime-200 dark:border-lime-900',
    activeBtnClass: 'bg-lime-500/15 text-lime-800 dark:bg-lime-500/25 dark:text-lime-300 border border-lime-300/90 dark:border-lime-500/40 shadow-sm',
    selectionBg: 'rgba(132, 204, 22, 0.35)',
    selectionText: '#365314',
    island1Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-lime-100/90 to-emerald-100/70',
      'from-emerald-100/90 to-teal-100/70',
      'from-green-100/90 to-lime-100/70',
      'from-teal-100/90 to-cyan-100/70',
      'from-lime-100/90 to-yellow-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(132, 204, 22, 0.3)',
        emoji: '🍃',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(16, 185, 129, 0.3)',
        emoji: '🍵',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(234, 179, 8, 0.3)',
        emoji: '🌰',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(34, 197, 94, 0.3)',
        emoji: '🌱',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(20, 184, 166, 0.3)',
        emoji: '🌾',
      },
      {
        bg: 'bg-white/75 dark:bg-[#18181B]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(132, 204, 22, 0.3)',
        emoji: '🪵',
      },
    ],
    particlePalette: ['#84cc16', '#a3e635', '#22c55e', '#10b981', '#eab308'],
  },

  // 8. ⚡ 赛博霓虹 (Cyber Neon / Obsidian OLED) - 极客、炫酷、OLED高对比
  {
    id: 'cyber',
    nameZh: '赛博霓虹',
    nameEn: 'Cyber Neon',
    emoji: '⚡',
    atmosphereDescZh: '未来赛博 • 霓虹粒子与量子脉冲光尘',
    atmosphereDescEn: 'Cyber neon matrix & quantum pulses',
    bg: '#f1f5f9',
    darkBg: '#05070a',
    headerBg: '#e2e8f0',
    darkHeaderBg: '#0e121a',
    sidebarBg: '#f1f5f9',
    darkSidebarBg: '#090d14',
    cardBg: '#ffffff',
    darkCardBg: '#0f172a',
    cardBorder: 'rgba(236, 72, 153, 0.3)',
    darkCardBorder: 'rgba(6, 182, 212, 0.3)',
    editorBg: '#f1f5f9',
    darkEditorBg: '#05070a',
    primaryColor: '#ec4899',
    primaryColorDark: '#f472b6',
    primaryRgb: '236, 72, 153',
    primaryDarkRgb: '244, 114, 182',
    btnText: '#9d174d',
    btnDarkText: '#fce7f3',
    primaryGradient: 'from-pink-500 via-purple-600 to-cyan-400',
    darkPrimaryGradient: 'from-pink-500 via-violet-600 to-cyan-400',
    accentText: 'text-pink-600 dark:text-cyan-400',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    darkGlowColor: 'rgba(6, 182, 212, 0.4)',
    washiGradient: 'from-pink-400 via-purple-400 to-cyan-300',
    badgeBg: 'bg-pink-100 dark:bg-slate-900 text-pink-700 dark:text-cyan-300 border-pink-200 dark:border-cyan-800/60',
    activeBtnClass: 'bg-pink-500/15 text-pink-600 dark:bg-cyan-500/25 dark:text-cyan-300 border border-pink-300/90 dark:border-cyan-500/40 shadow-sm',
    selectionBg: 'rgba(236, 72, 153, 0.4)',
    selectionText: '#ffffff',
    island1Bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    island2Bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10',
    universeRibbonBgs: [
      'from-pink-100/90 to-purple-100/70',
      'from-purple-100/90 to-cyan-100/70',
      'from-cyan-100/90 to-pink-100/70',
      'from-violet-100/90 to-sky-100/70',
      'from-pink-100/90 to-blue-100/70',
    ],
    noteCardThemes: [
      {
        bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(236, 72, 153, 0.4)',
        emoji: '⚡',
      },
      {
        bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(6, 182, 212, 0.4)',
        emoji: '🕹️',
      },
      {
        bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(168, 85, 247, 0.4)',
        emoji: '🚀',
      },
      {
        bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(244, 63, 94, 0.4)',
        emoji: '💎',
      },
      {
        bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(56, 189, 248, 0.4)',
        emoji: '👾',
      },
      {
        bg: 'bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-lg',
        tagPill: 'bg-white/80 dark:bg-white/10 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10',
        hoverGlow: 'rgba(234, 179, 8, 0.4)',
        emoji: '🔋',
      },
    ],
    particlePalette: ['#ec4899', '#06b6d4', '#8b5cf6', '#38bdf8', '#f43f5e'],
  },
];

interface ClayThemeContextValue {
  theme: ClayTheme;
  themeId: ClayTheme['id'];
  setTheme: (id: ClayTheme['id']) => void;
  nextTheme: () => void;
  switchNextTheme: () => void;
  randomTheme: () => void;
  isDark: boolean;
  atmosphereIntensity: AtmosphereIntensity;
  setAtmosphereIntensity: (intensity: AtmosphereIntensity) => void;
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  toggleThemeModal: () => void;
}

const ClayThemeContext = createContext<ClayThemeContextValue | null>(null);

const STORAGE_KEY = 'tagmesh_clay_theme_v4';
const ATMOSPHERE_STORAGE_KEY = 'tagmesh_atmosphere_intensity_v1';

export const ClayThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ClayTheme['id']>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && CLAY_THEMES.some((t) => t.id === saved)) {
        return saved as ClayTheme['id'];
      }
      // Check cached server telemetry for global theme
      const cached = localStorage.getItem('tagmesh_cached_telemetry');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.globalTheme && CLAY_THEMES.some((t) => t.id === parsed.globalTheme)) {
          return parsed.globalTheme as ClayTheme['id'];
        }
      }
    } catch {
      // ignore
    }
    return 'sakura';
  });

  const [atmosphereIntensity, setAtmosphereIntensityState] = useState<AtmosphereIntensity>(() => {
    try {
      const saved = localStorage.getItem(ATMOSPHERE_STORAGE_KEY);
      if (saved === 'off' || saved === 'soft' || saved === 'dynamic') {
        return saved;
      }
      const cached = localStorage.getItem('tagmesh_cached_telemetry');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (['off', 'soft', 'dynamic'].includes(parsed?.globalAtmosphere)) {
          return parsed.globalAtmosphere;
        }
      }
    } catch {
      // ignore
    }
    return 'dynamic';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => isDarkModeActive());

  useEffect(() => {
    const handleConfigChange = () => {
      setIsDark(isDarkModeActive());
    };

    const handleTelemetryEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;
      const hasUserCustom = localStorage.getItem('tagmesh_user_customized_v1') === 'true';
      if (!hasUserCustom) {
        if (detail.globalTheme && CLAY_THEMES.some((t) => t.id === detail.globalTheme)) {
          setThemeId(detail.globalTheme);
        }
        if (detail.globalAtmosphere && ['off', 'soft', 'dynamic'].includes(detail.globalAtmosphere)) {
          setAtmosphereIntensityState(detail.globalAtmosphere);
        }
      }
    };

    window.addEventListener('tagmesh_site_config_changed', handleConfigChange);
    window.addEventListener('tagmesh_telemetry_updated', handleTelemetryEvent);
    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) mql.addEventListener('change', handleConfigChange);

    return () => {
      window.removeEventListener('tagmesh_site_config_changed', handleConfigChange);
      window.removeEventListener('tagmesh_telemetry_updated', handleTelemetryEvent);
      if (mql) mql.removeEventListener('change', handleConfigChange);
    };
  }, []);

  const baseTheme = CLAY_THEMES.find((t) => t.id === themeId) || CLAY_THEMES[0];

  const theme: ClayTheme = useMemo(() => {
    if (!isDark) return baseTheme;
    return {
      ...baseTheme,
      bg: baseTheme.darkBg,
      headerBg: baseTheme.darkHeaderBg,
      sidebarBg: baseTheme.darkSidebarBg,
      cardBg: baseTheme.darkCardBg,
      cardBorder: baseTheme.darkCardBorder,
      editorBg: baseTheme.darkEditorBg,
      glowColor: baseTheme.darkGlowColor,
      primaryColor: baseTheme.primaryColorDark,
      primaryGradient: baseTheme.darkPrimaryGradient,
    };
  }, [baseTheme, isDark]);

  // Synchronize CSS custom tokens to DOM root element
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const activeBg = isDark ? baseTheme.darkBg : baseTheme.bg;
        const activeHeaderBg = isDark ? baseTheme.darkHeaderBg : baseTheme.headerBg;
        const activeSidebarBg = isDark ? baseTheme.darkSidebarBg : baseTheme.sidebarBg;
        const activeCardBg = isDark ? baseTheme.darkCardBg : baseTheme.cardBg;
        const activeCardBorder = isDark ? baseTheme.darkCardBorder : baseTheme.cardBorder;
        const activePrimary = isDark ? baseTheme.primaryColorDark : baseTheme.primaryColor;
        const activeGlow = isDark ? baseTheme.darkGlowColor : baseTheme.glowColor;
        const activePrimaryRgb = isDark ? baseTheme.primaryDarkRgb : baseTheme.primaryRgb;
        const activeBtnText = isDark ? baseTheme.btnDarkText : baseTheme.btnText;

        root.style.setProperty('--theme-bg', activeBg);
        root.style.setProperty('--theme-header-bg', activeHeaderBg);
        root.style.setProperty('--theme-sidebar-bg', activeSidebarBg);
        root.style.setProperty('--theme-card-bg', activeCardBg);
        root.style.setProperty('--theme-card-border', activeCardBorder);
        root.style.setProperty('--theme-primary', activePrimary);
        root.style.setProperty('--theme-primary-rgb', activePrimaryRgb);
        root.style.setProperty('--theme-primary-dark', baseTheme.primaryColorDark);
        root.style.setProperty('--theme-glow', activeGlow);
        root.style.setProperty('--theme-btn-text', activeBtnText);
        root.style.setProperty('--theme-btn-dark-text', baseTheme.btnDarkText);
        root.style.setProperty('--theme-btn-bg-soft', `rgba(${activePrimaryRgb}, ${isDark ? '0.2' : '0.12'})`);
        root.style.setProperty('--theme-btn-border', `rgba(${activePrimaryRgb}, ${isDark ? '0.45' : '0.28'})`);
        root.style.setProperty('--theme-btn-shadow', `rgba(${activePrimaryRgb}, ${isDark ? '0.45' : '0.22'})`);
        root.style.setProperty('--theme-selection-bg', baseTheme.selectionBg);
        root.style.setProperty('--theme-selection-text', baseTheme.selectionText);

        document.body.style.backgroundColor = activeBg;
        document.documentElement.style.backgroundColor = activeBg;
        root.setAttribute('data-clay-theme', themeId);
      }
    } catch {
      // ignore
    }
  }, [themeId, isDark, baseTheme]);

  const setAtmosphereIntensity = useCallback((intensity: AtmosphereIntensity) => {
    playSoftTick();
    setAtmosphereIntensityState(intensity);
    try {
      localStorage.setItem(ATMOSPHERE_STORAGE_KEY, intensity);
      localStorage.setItem('tagmesh_user_customized_v1', 'true');
    } catch {
      // ignore
    }
  }, []);

  const showThemeNotification = (target: ClayTheme) => {
    toast.info(
      `已切换至「${target.nameZh}」次元 • ${target.atmosphereDescZh}`,
      `${target.emoji} 次元主题已应用`,
      2400
    );
  };

  const setTheme = (id: ClayTheme['id']) => {
    const target = CLAY_THEMES.find((t) => t.id === id) || CLAY_THEMES[0];
    playPop(650);
    setThemeId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
      localStorage.setItem('tagmesh_user_customized_v1', 'true');
    } catch {
      // ignore
    }
    showThemeNotification(target);
  };

  const nextTheme = () => {
    const currentIndex = CLAY_THEMES.findIndex((t) => t.id === themeId);
    const nextIndex = (currentIndex + 1) % CLAY_THEMES.length;
    const target = CLAY_THEMES[nextIndex];
    playChime();
    setThemeId(target.id);
    triggerConfettiShower(18);
    showThemeNotification(target);
  };

  const randomTheme = () => {
    const available = CLAY_THEMES.filter(t => t.id !== themeId);
    const target = available[Math.floor(Math.random() * available.length)] || CLAY_THEMES[0];
    playChime();
    setThemeId(target.id);
    triggerConfettiShower(25);
    showThemeNotification(target);
  };

  const openThemeModal = useCallback(() => {
    playPop();
    setIsThemeModalOpen(true);
  }, []);

  const closeThemeModal = useCallback(() => {
    setIsThemeModalOpen(false);
  }, []);

  const toggleThemeModal = useCallback(() => {
    playPop();
    setIsThemeModalOpen(prev => !prev);
  }, []);

  return (
    <ClayThemeContext.Provider 
      value={{ 
        theme, 
        themeId, 
        setTheme, 
        nextTheme, 
        switchNextTheme: nextTheme, 
        randomTheme,
        isDark,
        atmosphereIntensity,
        setAtmosphereIntensity,
        isThemeModalOpen,
        openThemeModal,
        closeThemeModal,
        toggleThemeModal,
      }}
    >
      {children}
    </ClayThemeContext.Provider>
  );
};

export const useClayTheme = () => {
  const ctx = useContext(ClayThemeContext);
  if (!ctx) {
    throw new Error('useClayTheme must be used within ClayThemeProvider');
  }
  return ctx;
};
