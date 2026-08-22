import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playChime } from '../utils/soundEffects';
import { Sparkles, ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';

export interface GalaxyMeshViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

interface TagSun {
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  noteCount: number;
}

interface NotePlanet {
  note: Note;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  primaryTag: string;
  orbitAngle: number;
  orbitSpeed: number;
  orbitDistance: number;
}

const GALAXY_COLORS = [
  '#FF5E7E', // Coral Pink
  '#00B4D8', // Sky Cyan
  '#FFAA00', // Golden Amber
  '#10B981', // Mint Emerald
  '#8B5CF6', // Vivid Purple
  '#F97316', // Bright Orange
  '#EC4899', // Hot Pink
];

export const GalaxyMeshView: React.FC<GalaxyMeshViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
}) => {
  const { locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredItem, setHoveredItem] = useState<{ type: 'note' | 'tag'; label: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedPlanetRef = useRef<NotePlanet | null>(null);

  const tagSunsRef = useRef<TagSun[]>([]);
  const notePlanetsRef = useRef<NotePlanet[]>([]);

  // Initialize Galaxy Force Graph
  const initGalaxy = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 1200;
    const height = containerRef.current.clientHeight || 750;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Group notes by top tags to form Sun clusters
    const tagMap = new Map<string, number>();
    (notes || []).forEach((n) => {
      if (!n) return;
      const tags = Array.isArray(n.tags) ? n.tags : [];
      tags.forEach((tg) => {
        if (typeof tg === 'string') {
          tagMap.set(tg, (tagMap.get(tg) || 0) + 1);
        }
      });
    });

    const topTags = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);

    if (topTags.length === 0) {
      topTags.push(['#tagmesh', (notes || []).length]);
    }

    // 2. Position Tag Suns in a wide circular constellation
    const suns: TagSun[] = topTags.map(([tag, count], idx) => {
      const angle = (idx / topTags.length) * Math.PI * 2;
      const dist = Math.min(width, height) * 0.28;
      return {
        name: tag,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: Math.min(34, 18 + count * 2),
        color: GALAXY_COLORS[idx % GALAXY_COLORS.length],
        noteCount: count,
      };
    });

    // 3. Position Note Planets orbiting their primary tag sun
    const planets: NotePlanet[] = (notes || []).map((note, idx) => {
      const tags = Array.isArray(note?.tags) ? note.tags : [];
      const primaryTag = tags[0] || (suns[0]?.name ?? '#tagmesh');
      const targetSun = suns.find((s) => s.name === primaryTag) || suns[idx % suns.length];
      const orbitDistance = 50 + (idx % 6) * 22 + Math.random() * 20;
      const orbitAngle = Math.random() * Math.PI * 2;

      return {
        note,
        x: (targetSun?.x || centerX) + Math.cos(orbitAngle) * orbitDistance,
        y: (targetSun?.y || centerY) + Math.sin(orbitAngle) * orbitDistance,
        vx: 0,
        vy: 0,
        radius: note.isPinned ? 14 : 10,
        color: targetSun?.color || GALAXY_COLORS[idx % GALAXY_COLORS.length],
        primaryTag,
        orbitAngle,
        orbitSpeed: (0.003 + Math.random() * 0.005) * (idx % 2 === 0 ? 1 : -1),
        orbitDistance,
      };
    });

    tagSunsRef.current = suns;
    notePlanetsRef.current = planets;
  }, [notes]);

  useEffect(() => {
    initGalaxy();
  }, [initGalaxy]);

  // Main Canvas Rendering Loop with Gravity & Force-directed Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth || 1200;
      const height = containerRef.current.clientHeight || 750;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Apply Pan and Zoom transforms
      ctx.translate(pan.x + width / 2, pan.y + height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const suns = tagSunsRef.current;
      const planets = notePlanetsRef.current;

      // 1. Draw gravitational orbit rings and connecting cosmic filaments
      suns.forEach((sun) => {
        // Soft aura glow around Tag Sun
        const gradient = ctx.createRadialGradient(sun.x, sun.y, sun.radius * 0.5, sun.x, sun.y, sun.radius * 3.5);
        gradient.addColorStop(0, `${sun.color}44`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, sun.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Orbit ring
        ctx.strokeStyle = `${sun.color}22`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, 90, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, 140, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Update and Draw Note Planets & Force Beams
      planets.forEach((planet) => {
        const targetSun = suns.find((s) => s.name === planet.primaryTag) || suns[0];

        if (targetSun && planet !== draggedPlanetRef.current) {
          // Orbit animation
          planet.orbitAngle += planet.orbitSpeed;
          planet.x = targetSun.x + Math.cos(planet.orbitAngle) * planet.orbitDistance;
          planet.y = targetSun.y + Math.sin(planet.orbitAngle) * planet.orbitDistance;

          // Draw laser filament beam between planet and sun
          ctx.strokeStyle = `${planet.color}33`;
          ctx.lineWidth = planet.note.isPinned ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(targetSun.x, targetSun.y);
          ctx.lineTo(planet.x, planet.y);
          ctx.stroke();
        }

        // Draw 3D Clay Planet Sphere
        const planetGrad = ctx.createRadialGradient(
          planet.x - planet.radius * 0.3,
          planet.y - planet.radius * 0.3,
          planet.radius * 0.1,
          planet.x,
          planet.y,
          planet.radius
        );
        planetGrad.addColorStop(0, '#FFFFFF');
        planetGrad.addColorStop(0.3, planet.color);
        planetGrad.addColorStop(1, '#1A1A24');

        ctx.fillStyle = planetGrad;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Excerpt Label below Planet
        ctx.fillStyle = '#2D3748';
        ctx.font = 'bold 10px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const labelText = planet.note.excerpt.length > 12 ? planet.note.excerpt.substring(0, 10) + '..' : planet.note.excerpt;
        ctx.fillText(labelText, planet.x, planet.y + planet.radius + 4);
      });

      // 3. Draw Tag Suns on top with 3D Glowing Core
      suns.forEach((sun) => {
        const sunGrad = ctx.createRadialGradient(
          sun.x - sun.radius * 0.3,
          sun.y - sun.radius * 0.3,
          sun.radius * 0.2,
          sun.x,
          sun.y,
          sun.radius
        );
        sunGrad.addColorStop(0, '#FFFFFF');
        sunGrad.addColorStop(0.4, sun.color);
        sunGrad.addColorStop(1, '#27272A');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Sun Label Tag
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sun.name, sun.x, sun.y);
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [zoom, pan]);

  // Coordinate conversion helper (Screen to World Space)
  const screenToWorld = (screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const width = containerRef.current.clientWidth || 1200;
    const height = containerRef.current.clientHeight || 750;

    const wx = (screenX - (pan.x + width / 2)) / zoom + width / 2;
    const wy = (screenY - (pan.y + height / 2)) / zoom + height / 2;
    return { x: wx, y: wy };
  };

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldPos = screenToWorld(sx, sy);

    // Check if clicked a Planet
    const clickedPlanet = notePlanetsRef.current.find((p) => {
      const dist = Math.hypot(p.x - worldPos.x, p.y - worldPos.y);
      return dist <= p.radius + 6;
    });

    if (clickedPlanet) {
      draggedPlanetRef.current = clickedPlanet;
      playPop();
      return;
    }

    // Check if clicked a Sun Tag
    const clickedSun = tagSunsRef.current.find((s) => {
      const dist = Math.hypot(s.x - worldPos.x, s.y - worldPos.y);
      return dist <= s.radius + 6;
    });

    if (clickedSun) {
      playChime();
      onTagClick(clickedSun.name);
      return;
    }

    // Otherwise initiate Canvas Panning
    isDraggingCanvasRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldPos = screenToWorld(sx, sy);

    if (draggedPlanetRef.current) {
      draggedPlanetRef.current.x = worldPos.x;
      draggedPlanetRef.current.y = worldPos.y;
      return;
    }

    if (isDraggingCanvasRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    // Hover tooltip detection
    const hoveredPlanet = notePlanetsRef.current.find((p) => {
      const dist = Math.hypot(p.x - worldPos.x, p.y - worldPos.y);
      return dist <= p.radius + 6;
    });

    if (hoveredPlanet) {
      setHoveredItem({
        type: 'note',
        label: hoveredPlanet.note.excerpt,
        x: e.clientX,
        y: e.clientY,
      });
      if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
      return;
    }

    const hoveredSun = tagSunsRef.current.find((s) => {
      const dist = Math.hypot(s.x - worldPos.x, s.y - worldPos.y);
      return dist <= s.radius + 6;
    });

    if (hoveredSun) {
      setHoveredItem({
        type: 'tag',
        label: `${hoveredSun.name} (${hoveredSun.noteCount} 篇)`,
        x: e.clientX,
        y: e.clientY,
      });
      if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
      return;
    }

    setHoveredItem(null);
    if (canvasRef.current) canvasRef.current.style.cursor = isDraggingCanvasRef.current ? 'grabbing' : 'grab';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedPlanetRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        onNoteClick(draggedPlanetRef.current.note);
      }
      draggedPlanetRef.current = null;
    }
    isDraggingCanvasRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(2.5, Math.max(0.4, z * delta)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-210px)] min-h-[680px] rounded-[36px] bg-gradient-to-b from-[#181824] via-[#12121c] to-[#0a0a10] border-4 border-white shadow-2xl overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* Background Starfield */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:32px_32px] opacity-70 pointer-events-none" />

      {/* Top Banner Info */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none text-white">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl select-none">🪐</span>
          <div>
            <h3 className="font-bubble text-base sm:text-lg font-bold text-cyan-300">
              {locale === 'zh' ? '星系引力拓扑网 (Galaxy Force Mesh)' : 'Galaxy Force Mesh'}
            </h3>
            <p className="text-xs font-cute text-neutral-400">
              {locale === 'zh' ? '#标签为恒星核心，笔记为轨道行星。点击/拖拽探索引力' : 'Tags as central suns, notes as orbiting planets'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls Overlay */}
      <div className="absolute top-5 right-6 z-30 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-700 shadow-xl text-white text-xs font-cute">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
          className="p-1.5 rounded-full hover:bg-neutral-800 text-cyan-300 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
          className="p-1.5 rounded-full hover:bg-neutral-800 text-cyan-300 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-neutral-600">|</span>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            initGalaxy();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-neutral-800 text-amber-300 transition cursor-pointer"
          title="Reset Universe"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{locale === 'zh' ? '重置宇宙' : 'Reset'}</span>
        </button>
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Dynamic Hover Tooltip */}
      {hoveredItem && (
        <div
          style={{ left: hoveredItem.x + 12, top: hoveredItem.y + 12 }}
          className="fixed z-50 px-3.5 py-2 rounded-2xl bg-neutral-900/95 text-white font-bubble text-xs shadow-2xl border border-cyan-500/40 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1.5"
        >
          <span>{hoveredItem.type === 'tag' ? '☀️' : '🪐'}</span>
          <span>{hoveredItem.label}</span>
        </div>
      )}
    </div>
  );
};
