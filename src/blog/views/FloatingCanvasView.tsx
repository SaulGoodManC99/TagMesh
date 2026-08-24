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
    cardBg: 'from-pink-100 to-rose-200 text-rose-900 border-rose-200',
    tagPill: 'bg-rose-50/90 text-rose-700 border-rose-200',
    emoji: '🌸',
  },
  {
    cardBg: 'from-cyan-100 to-sky-200 text-cyan-900 border-cyan-200',
    tagPill: 'bg-cyan-50/90 text-cyan-700 border-cyan-200',
    emoji: '🌊',
  },
  {
    cardBg: 'from-amber-100 to-yellow-200 text-amber-900 border-amber-200',
    tagPill: 'bg-amber-50/90 text-amber-700 border-amber-200',
    emoji: '🍯',
  },
  {
    cardBg: 'from-emerald-100 to-teal-200 text-emerald-900 border-emerald-200',
    tagPill: 'bg-emerald-50/90 text-emerald-700 border-emerald-200',
    emoji: '🌿',
  },
  {
    cardBg: 'from-purple-100 to-violet-200 text-purple-900 border-purple-200',
    tagPill: 'bg-purple-50/90 text-purple-700 border-purple-200',
    emoji: '🔮',
  },
  {
    cardBg: 'from-orange-100 to-amber-200 text-orange-900 border-orange-200',
    tagPill: 'bg-orange-50/90 text-orange-700 border-orange-200',
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
        x: 20 + col * cellW + (Math.random() * 30 - 15),
        y: 20 + row * cellH + (Math.random() * 30 - 15),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: 240,
        colorTheme: idx % PASTEL_PALETTES.length,
        rotation: (Math.random() - 0.5) * 6,
        vr: (Math.random() - 0.5) * 0.04,
      };
    });

    setNodes(initialNodes);
  }, [notes]);

  useEffect(() => {
    initNodes();
    const handleResize = () => initNodes();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initNodes]);

  // Global Window Mouse Move and Mouse Up Listeners to PREVENT edge sticking!
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragInfoRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const cardWidth = 240;
      const cardHeight = 150;
      const width = containerRef.current.clientWidth || 1200;
      const height = containerRef.current.clientHeight || 750;

      // Mouse pos relative to container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let nx = mouseX - dragInfoRef.current.offsetX;
      let ny = mouseY - dragInfoRef.current.offsetY;

      // Clamping within bounds with 10px padding
      nx = Math.max(10, Math.min(width - cardWidth - 10, nx));
      ny = Math.max(10, Math.min(height - cardHeight - 10, ny));

      // Calculate throw fling velocity
      const vx = (e.clientX - dragInfoRef.current.lastX) * 0.35;
      const vy = (e.clientY - dragInfoRef.current.lastY) * 0.35;

      dragInfoRef.current.lastX = e.clientX;
      dragInfoRef.current.lastY = e.clientY;
      dragInfoRef.current.vx = vx;
      dragInfoRef.current.vy = vy;
      dragInfoRef.current.moved = true;

      const draggingId = dragInfoRef.current.id;
      setNodes((prev) =>
        prev.map((n) => (n.note.id === draggingId ? { ...n, x: nx, y: ny } : n))
      );
    };

    const handleGlobalMouseUp = () => {
      if (!dragInfoRef.current) return;

      const { id, moved, vx, vy } = dragInfoRef.current;
      const draggedNode = nodes.find((n) => n.note.id === id);

      if (moved) {
        // Apply throw momentum velocity
        setNodes((prev) =>
          prev.map((n) =>
            n.note.id === id
              ? {
                  ...n,
                  vx: Math.max(-2.5, Math.min(2.5, vx || n.vx)),
                  vy: Math.max(-2.5, Math.min(2.5, vy || n.vy)),
                }
              : n
          )
        );
      } else if (draggedNode) {
        // Simple click without dragging -> open full reading modal
        playPop();
        onNoteClick(draggedNode.note);
      }

      dragInfoRef.current = null;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [nodes, onNoteClick]);

  // Animation Physics Loop
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;

    const step = () => {
      setNodes((prevNodes) => {
        if (!containerRef.current) return prevNodes;
        const width = containerRef.current.clientWidth || 1200;
        const height = containerRef.current.clientHeight || 750;

        const cardWidth = 240;
        const cardHeight = 150;

        return prevNodes.map((node) => {
          // Pause motion if currently dragging or hovering this card
          if (dragInfoRef.current?.id === node.note.id) return node;
          if (hoveredNode?.note.id === node.note.id) return node;

          let nx = node.x + node.vx;
          let ny = node.y + node.vy;
          let nvx = node.vx;
          let nvy = node.vy;
          let nrot = node.rotation + node.vr;

          // Left/Right Wall Bounce
          if (nx < 10) {
            nx = 10;
            nvx = Math.abs(nvx);
          } else if (nx + cardWidth > width - 10) {
            nx = width - cardWidth - 10;
            nvx = -Math.abs(nvx);
          }

          // Top/Bottom Wall Bounce
          if (ny < 10) {
            ny = 10;
            nvy = Math.abs(nvy);
          } else if (ny + cardHeight > height - 10) {
            ny = height - cardHeight - 10;
            nvy = -Math.abs(nvy);
          }

          return {
            ...node,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
            rotation: nrot,
          };
        });
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, hoveredNode]);

  // Card Mouse Down Handler (Initiate Drag)
  const handleCardMouseDown = (node: FloatingNode, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    dragInfoRef.current = {
      id: node.note.id,
      offsetX: mouseX - node.x,
      offsetY: mouseY - node.y,
      lastX: e.clientX,
      lastY: e.clientY,
      vx: 0,
      vy: 0,
      moved: false,
    };
  };

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[680px] select-none animate-in fade-in duration-300">
      {/* Floating Toolbar Controls (Borderless, Seamless Floating Pill) */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full clay-card border border-white shadow-md">
        <button
          onClick={() => {
            playPop();
            setIsPlaying((p) => !p);
          }}
          className="flex items-center gap-1.5 text-xs font-bubble text-neutral-700 hover:text-pink-600 transition cursor-pointer"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? (locale === 'zh' ? '暂停漂浮' : 'Pause') : (locale === 'zh' ? '继续漂浮' : 'Float')}</span>
        </button>
        <span className="text-neutral-300">|</span>
        <button
          onClick={() => {
            playPop();
            initNodes();
          }}
          className="flex items-center gap-1.5 text-xs font-bubble text-neutral-700 hover:text-cyan-600 transition cursor-pointer"
          title="Reset Gravity"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{locale === 'zh' ? '重置重力' : 'Reset'}</span>
        </button>
      </div>

      {/* Top Banner */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-spin" style={{ animationDuration: '10s' }}>
            🌌
          </span>
          <div>
            <h3 className="font-bubble text-sm font-bold text-neutral-800">
              {locale === 'zh' ? '失重黏土宇宙 · 鼠标悬停即看内容 · 随意甩动' : 'Zero-Gravity Clay Universe · Hover to Peek · Fling & Play'}
            </h3>
            <p className="text-[11px] font-cute text-neutral-500">
              {locale === 'zh' ? '光标靠近卡片自动悬停并展开透视小黑板，按住可抛掷' : 'Hover any card to inspect full content, grab to throw'}
            </p>
          </div>
        </div>
      </div>

      {/* Full Open Canvas Area with Draggable Cards */}
      <div
        ref={containerRef}
        className="relative w-full h-full"
      >
        {nodes.map((node) => {
          const palette = PASTEL_PALETTES[node.colorTheme];
          const isHovered = hoveredNode?.note.id === node.note.id;

          return (
            <div
              key={node.note.id}
              onMouseDown={(e) => handleCardMouseDown(node, e)}
              onMouseEnter={() => {
                if (!dragInfoRef.current) {
                  playSwoosh();
                  setHoveredNode(node);
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
              className={`absolute w-60 p-4 rounded-3xl bg-gradient-to-br ${palette.cardBg} clay-card shadow-lg border-2 border-white transition-all duration-150 active:cursor-grabbing hover:shadow-2xl hover:scale-105 active:scale-95 group`}
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

              <div className="mb-3 overflow-hidden font-cute text-xs text-neutral-800 leading-relaxed line-clamp-3">
                {renderCardMarkdownSnippet(node.note.rawMarkdown, 100)}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5">
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

                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-rose-600 transition shrink-0 ml-1" />
              </div>

              {/* 🌟 Hover Quick-Peek Glass Popover (鼠标悬停即时透视小画板，无需点击) */}
              {isHovered && !dragInfoRef.current && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-80 sm:w-96 p-5 rounded-[28px] bg-white/95 backdrop-blur-xl border-3 border-white shadow-2xl clay-card z-50 animate-in zoom-in-95 fade-in duration-150 flex flex-col gap-3 text-neutral-800 pointer-events-auto"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{palette.emoji}</span>
                      <span className="font-bubble font-bold text-xs text-rose-500 uppercase tracking-wider">
                        {locale === 'zh' ? '即时透视预览' : 'QUICK PEEK'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-cute text-neutral-400">
                      <span>{node.note.wordCount || 0} {locale === 'zh' ? '字' : 'words'}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100/60 overflow-hidden max-h-48 font-cute text-xs sm:text-sm text-neutral-800 leading-relaxed">
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
                          className="px-2 py-0.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-700 text-[10px] font-mono border border-pink-200 transition cursor-pointer"
                        >
                          {tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[11px] font-cute font-bold text-neutral-500">
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
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r-2 border-b-2 border-white rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
