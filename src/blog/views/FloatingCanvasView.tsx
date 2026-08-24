import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCw, Pin, ArrowUpRight, BookOpen, Clock, Sparkles, X } from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playSwoosh } from '../utils/soundEffects';
import { renderCardMarkdownSnippet } from '../utils/markdownRenderer';
import { format24HourDateTime } from '../utils/dateFormatter';

export interface FloatingCanvasViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

interface FloatingNode {
  note: Note;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorTheme: number;
  rotation: number;
  vr: number;
}

const PASTEL_PALETTES = [
  {
    cardBg: 'from-pink-100 to-rose-200 dark:from-pink-950/80 dark:to-rose-900/60 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800/40',
    tagPill: 'bg-rose-50/90 dark:bg-rose-950/70 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-800/40',
    emoji: '🌸',
  },
  {
    cardBg: 'from-cyan-100 to-sky-200 dark:from-cyan-950/80 dark:to-sky-900/60 text-cyan-900 dark:text-cyan-100 border-cyan-200 dark:border-cyan-800/40',
    tagPill: 'bg-cyan-50/90 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800/40',
    emoji: '🌊',
  },
  {
    cardBg: 'from-amber-100 to-yellow-200 dark:from-amber-950/80 dark:to-yellow-900/60 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800/40',
    tagPill: 'bg-amber-50/90 dark:bg-amber-950/70 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-800/40',
    emoji: '🍯',
  },
  {
    cardBg: 'from-emerald-100 to-teal-200 dark:from-emerald-950/80 dark:to-teal-900/60 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800/40',
    tagPill: 'bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/40',
    emoji: '🌿',
  },
  {
    cardBg: 'from-purple-100 to-violet-200 dark:from-purple-950/80 dark:to-violet-900/60 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800/40',
    tagPill: 'bg-purple-50/90 dark:bg-purple-950/70 text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-800/40',
    emoji: '🔮',
  },
  {
    cardBg: 'from-orange-100 to-amber-200 dark:from-orange-950/80 dark:to-amber-900/60 text-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-800/40',
    tagPill: 'bg-orange-50/90 dark:bg-orange-950/70 text-orange-700 dark:text-orange-200 border-orange-200 dark:border-orange-800/40',
    emoji: '🍊',
  },
];

export const FloatingCanvasView: React.FC<FloatingCanvasViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
}) => {
  const { locale } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [nodes, setNodes] = useState<FloatingNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<FloatingNode | null>(null);

  // Drag tracking refs
  const dragInfoRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    vx: number;
    vy: number;
    moved: boolean;
  } | null>(null);

  // Initialize nodes across available container width and height
  const initNodes = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 1200;
    const height = Math.max(700, containerRef.current.clientHeight || 750);

    const cols = Math.max(3, Math.floor(width / 270));
    const count = Math.min((notes || []).length, 40);
    const rows = Math.ceil(count / cols);
    const cellW = (width - 60) / cols;
    const cellH = (height - 60) / Math.max(1, rows);

    const initialNodes: FloatingNode[] = (notes || []).slice(0, count).map((note, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      return {
        note,
        x: 30 + col * cellW + Math.random() * (cellW - 240),
        y: 30 + row * cellH + Math.random() * (cellH - 180),
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 240,
        colorTheme: idx % PASTEL_PALETTES.length,
        rotation: (Math.random() - 0.5) * 8,
        vr: (Math.random() - 0.5) * 0.15,
      };
    });

    setNodes(initialNodes);
  }, [notes]);

  useEffect(() => {
    initNodes();
  }, [initNodes]);

  // Handle Drag Start
  const handleMouseDown = (e: React.MouseEvent, node: FloatingNode) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    dragInfoRef.current = {
      id: node.note.id,
      offsetX: mouseX - node.x,
      offsetY: mouseY - node.y,
      lastX: mouseX,
      lastY: mouseY,
      vx: 0,
      vy: 0,
      moved: false,
    };
  };

  // Handle Drag Move & Window Physics
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfoRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = mouseX - dragInfoRef.current.lastX;
      const dy = mouseY - dragInfoRef.current.lastY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragInfoRef.current.moved = true;
      }

      dragInfoRef.current.vx = dx * 0.5;
      dragInfoRef.current.vy = dy * 0.5;
      dragInfoRef.current.lastX = mouseX;
      dragInfoRef.current.lastY = mouseY;

      const newX = mouseX - dragInfoRef.current.offsetX;
      const newY = mouseY - dragInfoRef.current.offsetY;

      setNodes((prev) =>
        prev.map((n) =>
          n.note.id === dragInfoRef.current?.id
            ? { ...n, x: newX, y: newY, vx: dragInfoRef.current.vx, vy: dragInfoRef.current.vy }
            : n
        )
      );
    };

    const handleMouseUp = () => {
      dragInfoRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Floating Physics Loop (Soft Bouncing & Drift)
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (isPlaying && containerRef.current) {
        const width = containerRef.current.clientWidth || 1200;
        const height = containerRef.current.clientHeight || 750;

        setNodes((prev) =>
          prev.map((node) => {
            // Skip actively dragged node
            if (dragInfoRef.current && dragInfoRef.current.id === node.note.id) {
              return node;
            }

            let nextX = node.x + node.vx;
            let nextY = node.y + node.vy;
            let nextVx = node.vx;
            let nextVy = node.vy;
            let nextRot = node.rotation + node.vr;

            const cardW = 240;
            const cardH = 160;

            // Bounce on boundaries
            if (nextX <= 10) {
              nextX = 10;
              nextVx = Math.abs(nextVx) * 0.9;
            } else if (nextX + cardW >= width - 10) {
              nextX = width - cardW - 10;
              nextVx = -Math.abs(nextVx) * 0.9;
            }

            if (nextY <= 10) {
              nextY = 10;
              nextVy = Math.abs(nextVy) * 0.9;
            } else if (nextY + cardH >= height - 10) {
              nextY = height - cardH - 10;
              nextVy = -Math.abs(nextVy) * 0.9;
            }

            // Air damping
            nextVx *= 0.995;
            nextVy *= 0.995;

            // Gentle ambient turbulence if slowed down
            if (Math.abs(nextVx) < 0.1) nextVx += (Math.random() - 0.5) * 0.15;
            if (Math.abs(nextVy) < 0.1) nextVy += (Math.random() - 0.5) * 0.15;

            return {
              ...node,
              x: nextX,
              y: nextY,
              vx: nextVx,
              vy: nextVy,
              rotation: nextRot,
            };
          })
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="w-full select-none animate-in fade-in duration-300 pb-12 flex flex-col gap-4">
      {/* Top Floating Controls Bar */}
      <div className="flex items-center justify-between px-5 py-3 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-3 border-white dark:border-white/10 shadow-md clay-card">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪐</span>
          <span className="font-bubble font-extrabold text-sm text-neutral-800 dark:text-neutral-100">
            {locale === 'zh' ? '失重空间 (可拖拽与悬浮预览)' : 'Zero-Gravity Mesh'}
          </span>
          <span className="hidden sm:inline text-xs font-cute text-neutral-400 dark:text-neutral-500 ml-1">
            {locale === 'zh' ? '• 任意拖动卡片赋予初速度' : '• Drag cards to launch'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playPop();
              setIsPlaying(!isPlaying);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-cute font-bold border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
            <span>{isPlaying ? (locale === 'zh' ? '定格' : 'Pause') : (locale === 'zh' ? '漂浮' : 'Float')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSwoosh();
              initNodes();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-cute font-bold border border-neutral-200/80 dark:border-white/10 shadow-3xs cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
            <span>{locale === 'zh' ? '重置散布' : 'Scatter'}</span>
          </button>
        </div>
      </div>

      {/* Floating Canvas Sandbox */}
      <div
        ref={containerRef}
        className="relative w-full h-[650px] sm:h-[720px] rounded-[36px] bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border-3 border-white dark:border-white/10 shadow-inner overflow-hidden select-none"
      >
        {nodes.map((node) => {
          const palette = PASTEL_PALETTES[node.colorTheme % PASTEL_PALETTES.length];
          const isHovered = hoveredNode?.note.id === node.note.id;

          return (
            <div
              key={node.note.id}
              onMouseDown={(e) => handleMouseDown(e, node)}
              onClick={() => {
                if (dragInfoRef.current?.moved) return;
                playPop();
                onNoteClick(node.note);
              }}
              onMouseEnter={() => {
                if (!dragInfoRef.current) {
                  setHoveredNode(node);
                  playPop(700);
                }
              }}
              onMouseLeave={() => {
                if (!dragInfoRef.current) {
                  setHoveredNode(null);
                }
              }}
              style={{
                transform: `translate3d(${node.x}px, ${node.y}px, 0) rotate(${isHovered ? 0 : node.rotation}deg)`,
                cursor: 'grab',
                zIndex: isHovered ? 40 : 10,
              }}
              className={`absolute w-60 p-4 rounded-3xl bg-gradient-to-br ${palette.cardBg} clay-card shadow-lg border-2 border-white dark:border-white/10 transition-all duration-150 active:cursor-grabbing hover:shadow-2xl hover:scale-105 active:scale-95 group`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{palette.emoji}</span>
                {node.note.isPinned && (
                  <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-300 text-amber-900 text-[9px] font-bubble font-bold">
                    <Pin className="w-2.5 h-2.5" />
                    <span>Top</span>
                  </span>
                )}
                <span className="text-[10px] font-cute opacity-70">
                  {(node.note.tags && node.note.tags[0]) || '#idea'}
                </span>
              </div>

              <div className="mb-3 overflow-hidden font-cute text-xs text-neutral-800 dark:text-neutral-100 leading-relaxed line-clamp-3">
                {renderCardMarkdownSnippet(node.note.rawMarkdown, 100)}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1 overflow-hidden">
                  {(node.note.tags || []).slice(0, 2).map((tg) => (
                    <span
                      key={tg}
                      onClick={(e) => {
                        e.stopPropagation();
                        playPop(620);
                        onTagClick(tg);
                      }}
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono border ${palette.tagPill} truncate cursor-pointer`}
                    >
                      {tg}
                    </span>
                  ))}
                </div>

                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition shrink-0 ml-1" />
              </div>

              {/* 🌟 Hover Quick-Peek Glass Popover (鼠标悬停即时透视小画板，无需点击) */}
              {isHovered && !dragInfoRef.current && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-80 sm:w-96 p-5 rounded-[28px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-3 border-white dark:border-white/10 shadow-2xl clay-card z-50 animate-in zoom-in-95 fade-in duration-150 flex flex-col gap-3 text-neutral-800 dark:text-neutral-100 pointer-events-auto"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{palette.emoji}</span>
                      <span className="font-bubble font-bold text-xs text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                        {locale === 'zh' ? '即时透视预览' : 'QUICK PEEK'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-cute text-neutral-400 dark:text-neutral-500">
                      <span>{node.note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 dark:bg-neutral-800 p-3.5 rounded-2xl border border-amber-100/60 dark:border-white/10 overflow-hidden max-h-48 font-cute text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 leading-relaxed">
                    {renderCardMarkdownSnippet(node.note.rawMarkdown, 250)}
                  </div>

                  {/* Tags */}
                  {(node.note.tags || []).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(node.note.tags || []).map((tg) => (
                        <span
                          key={tg}
                          onClick={(e) => {
                            e.stopPropagation();
                            playPop(620);
                            onTagClick(tg);
                          }}
                          className="px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 dark:hover:bg-pink-900 text-pink-700 dark:text-pink-300 text-[10px] font-mono border border-pink-200 dark:border-pink-900 transition cursor-pointer"
                        >
                          {tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-cute font-bold text-neutral-500 dark:text-neutral-400">
                      {format24HourDateTime(node.note.createdAt || Date.now(), locale)}
                    </span>

                    <button
                      onClick={() => {
                        playPop();
                        onNoteClick(node.note);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bubble text-xs font-bold clay-btn shadow-md cursor-pointer hover:shadow-lg transition active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{locale === 'zh' ? '翻开阅读' : 'Read Note'}</span>
                    </button>
                  </div>

                  {/* Downward triangle arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white dark:bg-neutral-900 border-r-2 border-b-2 border-white dark:border-white/10 rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
