import React, { useEffect, useRef } from 'react';
import { useClayTheme } from '../utils/clayThemes';

export const ClayAtmosphereCanvas: React.FC = () => {
  const { theme, atmosphereIntensity } = useClayTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (atmosphereIntensity === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Interactive mouse state & stardust trail
    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: -1000, lastY: -1000 };
    
    interface MouseMote {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;
    }
    const mouseMotes: MouseMote[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      mouse.vx = (e.clientX - mouse.x) * 0.15;
      mouse.vy = (e.clientY - mouse.y) * 0.15;
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Spawn interactive micro stardust when moving
      if (Math.random() < 0.6) {
        const palette = theme.particlePalette || ['#f43f5e', '#fb7185', '#fda4af'];
        const color = palette[Math.floor(Math.random() * palette.length)];
        mouseMotes.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          size: Math.random() * 3.5 + 2,
          color,
          alpha: 0.9,
          life: 0,
          maxLife: Math.floor(Math.random() * 25 + 20),
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const themeId = theme.id;
    const isSoft = atmosphereIntensity === 'soft';

    // Particle count: generous for rich visibility & immersion
    let baseCount = 85;
    if (themeId === 'rain') baseCount = 140;
    else if (themeId === 'stars') baseCount = 110;
    else if (themeId === 'cyber') baseCount = 95;
    else if (themeId === 'sakura') baseCount = 90;
    else if (themeId === 'lavender') baseCount = 90;
    else if (themeId === 'matcha') baseCount = 80;
    else if (themeId === 'fireflies') baseCount = 75;
    else baseCount = 75;

    const particleCount = isSoft ? Math.max(30, Math.floor(baseCount * 0.45)) : baseCount;

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      rot: number;
      rotSpeed: number;
      pitch: number;
      pitchSpeed: number;
      color: string;
      life: number;
      maxLife: number;
      wobbleOffset: number;
      wobbleSpeed: number;
    }

    interface Splash {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const splashes: Splash[] = [];

    const initParticle = (p?: Partial<Particle>): Particle => {
      const x = p?.x ?? Math.random() * width;
      const y = p?.y ?? Math.random() * height;
      const palette = theme.particlePalette || ['#f43f5e', '#fb7185', '#fda4af'];
      const randomColor = palette[Math.floor(Math.random() * palette.length)];

      if (themeId === 'sakura' || themeId === 'lavender') {
        return {
          x,
          y,
          size: Math.random() * 12 + 10,
          speedX: Math.random() * 1.5 - 0.2,
          speedY: Math.random() * 1.4 + 0.8,
          opacity: Math.random() * 0.45 + 0.5,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.035 - 0.017,
          pitch: Math.random() * Math.PI * 2,
          pitchSpeed: Math.random() * 0.045 + 0.02,
          color: randomColor,
          life: Math.random() * 500,
          maxLife: 1000,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.03 + 0.015,
        };
      } else if (themeId === 'rain') {
        return {
          x,
          y,
          size: Math.random() * 24 + 16,
          speedX: -1.8,
          speedY: Math.random() * 10 + 14,
          opacity: Math.random() * 0.45 + 0.45,
          rot: -0.15,
          rotSpeed: 0,
          pitch: 0,
          pitchSpeed: 0,
          color: randomColor,
          life: 0,
          maxLife: 1000,
          wobbleOffset: 0,
          wobbleSpeed: 0,
        };
      } else if (themeId === 'fireflies') {
        return {
          x,
          y,
          size: Math.random() * 6.5 + 4,
          speedX: Math.random() * 1.0 - 0.5,
          speedY: Math.random() * -0.9 - 0.2,
          opacity: Math.random() * 0.6 + 0.4,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.04,
          pitch: 0,
          pitchSpeed: 0,
          color: randomColor,
          life: Math.random() * 100,
          maxLife: 150 + Math.random() * 50,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.05 + 0.02,
        };
      } else if (themeId === 'stars') {
        return {
          x,
          y,
          size: Math.random() * 4.5 + 2,
          speedX: Math.random() * 0.3 - 0.15,
          speedY: Math.random() * 0.3 - 0.15,
          opacity: Math.random() * 0.7 + 0.3,
          rot: Math.random() * Math.PI,
          rotSpeed: Math.random() * 0.02,
          pitch: 0,
          pitchSpeed: 0,
          color: randomColor,
          life: Math.random() * 120,
          maxLife: 160 + Math.random() * 60,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.04 + 0.02,
        };
      } else if (themeId === 'cyber') {
        return {
          x,
          y,
          size: Math.random() * 5 + 2.5,
          speedX: (Math.random() - 0.5) * 2.2,
          speedY: (Math.random() - 0.5) * 2.2,
          opacity: Math.random() * 0.7 + 0.3,
          rot: Math.random() * Math.PI,
          rotSpeed: 0.06,
          pitch: 0,
          pitchSpeed: 0,
          color: randomColor,
          life: Math.random() * 70,
          maxLife: 100 + Math.random() * 40,
          wobbleOffset: 0,
          wobbleSpeed: 0,
        };
      } else if (themeId === 'matcha') {
        return {
          x,
          y,
          size: Math.random() * 11 + 7,
          speedX: Math.random() * 1.6 - 0.4,
          speedY: Math.random() * 1.3 + 0.7,
          opacity: Math.random() * 0.45 + 0.45,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.035 - 0.017,
          pitch: Math.random() * Math.PI * 2,
          pitchSpeed: Math.random() * 0.04 + 0.015,
          color: randomColor,
          life: Math.random() * 500,
          maxLife: 1000,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.03 + 0.01,
        };
      } else {
        // 🍵 'zen'
        return {
          x,
          y,
          size: Math.random() * 10 + 6,
          speedX: Math.random() * 1.3 - 0.3,
          speedY: Math.random() * 1.2 + 0.6,
          opacity: Math.random() * 0.45 + 0.45,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.03 - 0.015,
          pitch: Math.random() * Math.PI * 2,
          pitchSpeed: Math.random() * 0.035 + 0.01,
          color: randomColor,
          life: Math.random() * 500,
          maxLife: 1000,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.025 + 0.01,
        };
      }
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(initParticle());
    }

    // Shooting stars / meteors
    let shootingStar: { x: number; y: number; len: number; speed: number; opacity: number } | null = null;
    let nextShootingStarTime = Date.now() + 1500;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Shooting stars (stars & cyber & sakura themes)
      if ((themeId === 'stars' || themeId === 'cyber' || themeId === 'sakura') && Date.now() > nextShootingStarTime && !shootingStar && !isSoft) {
        shootingStar = {
          x: Math.random() * (width * 0.7) + width * 0.1,
          y: Math.random() * (height * 0.35),
          len: Math.random() * 110 + 80,
          speed: Math.random() * 16 + 18,
          opacity: 1,
        };
        nextShootingStarTime = Date.now() + Math.random() * 3500 + 2500;
      }

      if (shootingStar) {
        ctx.save();
        ctx.strokeStyle = themeId === 'cyber' ? 'rgba(6, 182, 212, ' : (themeId === 'sakura' ? 'rgba(251, 113, 133, ' : 'rgba(255, 255, 255, ');
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle + '1)';
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(shootingStar.x - shootingStar.len * 0.8, shootingStar.y + shootingStar.len * 0.6);
        ctx.strokeStyle = `${ctx.strokeStyle}${shootingStar.opacity})`;
        ctx.stroke();
        ctx.restore();

        shootingStar.x += shootingStar.speed * 0.8;
        shootingStar.y += shootingStar.speed * 0.6;
        shootingStar.opacity -= 0.032;

        if (shootingStar.opacity <= 0 || shootingStar.x > width + 100 || shootingStar.y > height + 100) {
          shootingStar = null;
        }
      }

      // 2. Interactive Mouse Stardust Motes
      for (let m = mouseMotes.length - 1; m >= 0; m--) {
        const mote = mouseMotes[m];
        mote.x += mote.vx;
        mote.y += mote.vy;
        mote.life++;
        mote.alpha = Math.max(0, 1 - mote.life / mote.maxLife);

        ctx.save();
        ctx.globalAlpha = mote.alpha * 0.85;
        ctx.fillStyle = mote.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = mote.color;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.size * (1 - (mote.life / mote.maxLife) * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (mote.life >= mote.maxLife) {
          mouseMotes.splice(m, 1);
        }
      }

      // 3. Update & Render Main Atmospheric Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gentle interactive mouse deflection
        if (!isSoft) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repelRadius = 150;

          if (dist < repelRadius && dist > 0) {
            const force = (1 - dist / repelRadius) * 3.2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // --- Theme 1: Sakura & Lavender (Drifting 3D Petals) ---
        if (themeId === 'sakura' || themeId === 'lavender') {
          p.x += p.speedX + Math.sin(p.life * p.wobbleSpeed + p.wobbleOffset) * 0.8;
          p.y += p.speedY;
          p.rot += p.rotSpeed;
          p.pitch += p.pitchSpeed;
          p.life++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.pitch));
          ctx.globalAlpha = p.opacity;

          // Glowing shadow for rich visual presence
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;

          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size * 0.85, -p.size * 0.6, p.size * 0.85, p.size * 0.6, 0, p.size);
          ctx.bezierCurveTo(-p.size * 0.85, p.size * 0.6, -p.size * 0.85, -p.size * 0.6, 0, -p.size);
          ctx.fillStyle = p.color;
          ctx.fill();

          ctx.restore();

          if (p.y > height + 25 || p.x > width + 40 || p.x < -40) {
            particles[i] = initParticle({ y: -20, x: Math.random() * (width + 80) - 40 });
          }
        } 
        // --- Theme 2: Rain (Raindrop streaks & Ripple splashes) ---
        else if (themeId === 'rain') {
          p.x += p.speedX;
          p.y += p.speedY;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.0;
          ctx.shadowBlur = 5;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2.8, p.y + p.size);
          ctx.stroke();
          ctx.restore();

          // Spawn puddle ripples on bottom
          if (p.y >= height - 30 && Math.random() < 0.35 && splashes.length < 30) {
            splashes.push({
              x: p.x,
              y: height - 15 + Math.random() * 12,
              radius: 1,
              maxRadius: Math.random() * 16 + 8,
              opacity: 0.85,
            });
          }

          if (p.y > height + 15 || p.x < -30) {
            particles[i] = initParticle({ y: -25, x: Math.random() * (width + 120) });
          }
        } 
        // --- Theme 3: Fireflies (Breathing Glowing Lanterns) ---
        else if (themeId === 'fireflies') {
          p.x += p.speedX + Math.sin(p.life * p.wobbleSpeed + p.wobbleOffset) * 0.6;
          p.y += p.speedY;
          p.life++;

          const pulse = (Math.sin((p.life / p.maxLife) * Math.PI * 2) + 1) * 0.5;
          const currentOpacity = p.opacity * (0.35 + pulse * 0.65);

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          ctx.fillStyle = p.color;

          // Double halo glow
          ctx.shadowBlur = p.size * 3.5;
          ctx.shadowColor = p.color;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.75 + pulse * 0.4), 0, Math.PI * 2);
          ctx.fill();

          // Bright center nucleus
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (p.y < -25 || p.x > width + 25 || p.x < -25 || p.life > p.maxLife * 3) {
            particles[i] = initParticle({ y: height + 20, x: Math.random() * width });
          }
        } 
        // --- Theme 4: Stars (Twinkling Cross Glints) ---
        else if (themeId === 'stars') {
          p.life++;
          const twinkle = (Math.sin((p.life / p.maxLife) * Math.PI * 2) + 1) * 0.5;
          const currentOpacity = p.opacity * (0.3 + twinkle * 0.7);

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = p.size * 3;
          ctx.shadowColor = p.color;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // 4-Pointed Starburst Cross Flare on peak twinkle
          if (twinkle > 0.65 && p.size > 2.5) {
            const arm = p.size * 2.6 * twinkle;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(p.x - arm, p.y);
            ctx.lineTo(p.x + arm, p.y);
            ctx.moveTo(p.x, p.y - arm);
            ctx.lineTo(p.x, p.y + arm);
            ctx.stroke();
          }

          ctx.restore();

          if (p.life > p.maxLife * 2) {
            particles[i] = initParticle();
          }
        } 
        // --- Theme 5: Cyber (Quantum Grid Nodes & Sparks) ---
        else if (themeId === 'cyber') {
          p.x += p.speedX;
          p.y += p.speedY;
          p.life++;

          const pulse = (Math.sin(p.life * 0.1) + 1) * 0.5;

          ctx.save();
          ctx.globalAlpha = p.opacity * (0.5 + pulse * 0.5);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;

          // Diamond rotated node
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot + p.life * 0.02);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();

          if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || p.life > p.maxLife * 2) {
            particles[i] = initParticle();
          }
        } 
        // --- Theme 6 & 7: Zen & Matcha (Tea & Bamboo Leaves) ---
        else {
          p.x += p.speedX + Math.sin(p.life * p.wobbleSpeed + p.wobbleOffset) * 0.7;
          p.y += p.speedY;
          p.rot += p.rotSpeed;
          p.pitch += p.pitchSpeed;
          p.life++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.pitch));
          ctx.globalAlpha = p.opacity;
          ctx.shadowBlur = 5;
          ctx.shadowColor = p.color;

          ctx.beginPath();
          ctx.moveTo(-p.size * 1.5, 0);
          ctx.quadraticCurveTo(0, -p.size * 0.65, p.size * 1.5, 0);
          ctx.quadraticCurveTo(0, p.size * 0.65, -p.size * 1.5, 0);
          ctx.fillStyle = p.color;
          ctx.fill();

          ctx.restore();

          if (p.y > height + 25 || p.x > width + 40 || p.x < -40) {
            particles[i] = initParticle({ y: -20, x: Math.random() * (width + 80) - 40 });
          }
        }
      }

      // 4. Rain Puddle Ripple Expansions
      if (themeId === 'rain') {
        for (let j = splashes.length - 1; j >= 0; j--) {
          const s = splashes[j];
          s.radius += 0.65;
          s.opacity -= 0.03;

          ctx.save();
          ctx.globalAlpha = Math.max(0, s.opacity);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.6;
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius * 2.0, s.radius * 0.65, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (s.opacity <= 0 || s.radius >= s.maxRadius) {
            splashes.splice(j, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme.id, theme.particlePalette, atmosphereIntensity]);

  const getAuroraOrbs = () => {
    switch (theme.id) {
      case 'sakura':
        return {
          orb1: 'bg-gradient-to-br from-pink-400/40 via-rose-400/30 to-amber-300/20',
          orb2: 'bg-gradient-to-tr from-amber-300/35 via-rose-300/25 to-pink-400/20',
          orb3: 'bg-gradient-to-bl from-rose-400/35 via-pink-300/25 to-purple-300/20',
        };
      case 'stars':
        return {
          orb1: 'bg-gradient-to-br from-purple-500/40 via-indigo-600/30 to-pink-400/20',
          orb2: 'bg-gradient-to-tr from-pink-500/35 via-violet-400/25 to-cyan-400/20',
          orb3: 'bg-gradient-to-bl from-violet-500/35 via-blue-500/25 to-indigo-400/20',
        };
      case 'zen':
        return {
          orb1: 'bg-gradient-to-br from-emerald-400/40 via-teal-500/30 to-lime-300/20',
          orb2: 'bg-gradient-to-tr from-lime-300/35 via-emerald-300/25 to-teal-400/20',
          orb3: 'bg-gradient-to-bl from-teal-400/35 via-green-300/25 to-amber-200/20',
        };
      case 'fireflies':
        return {
          orb1: 'bg-gradient-to-br from-amber-400/40 via-orange-400/30 to-rose-400/20',
          orb2: 'bg-gradient-to-tr from-yellow-300/35 via-amber-300/25 to-orange-300/20',
          orb3: 'bg-gradient-to-bl from-orange-400/35 via-rose-300/25 to-yellow-200/20',
        };
      case 'rain':
        return {
          orb1: 'bg-gradient-to-br from-cyan-400/40 via-sky-500/30 to-blue-500/20',
          orb2: 'bg-gradient-to-tr from-blue-400/35 via-cyan-300/25 to-teal-300/20',
          orb3: 'bg-gradient-to-bl from-sky-400/35 via-indigo-300/25 to-cyan-200/20',
        };
      case 'lavender':
        return {
          orb1: 'bg-gradient-to-br from-violet-500/40 via-purple-500/30 to-rose-400/20',
          orb2: 'bg-gradient-to-tr from-fuchsia-400/35 via-violet-300/25 to-pink-300/20',
          orb3: 'bg-gradient-to-bl from-purple-400/35 via-rose-300/25 to-indigo-300/20',
        };
      case 'matcha':
        return {
          orb1: 'bg-gradient-to-br from-lime-500/40 via-emerald-500/30 to-teal-400/20',
          orb2: 'bg-gradient-to-tr from-emerald-400/35 via-lime-300/25 to-amber-300/20',
          orb3: 'bg-gradient-to-bl from-teal-400/35 via-emerald-300/25 to-green-200/20',
        };
      case 'cyber':
        return {
          orb1: 'bg-gradient-to-br from-pink-500/40 via-violet-600/35 to-cyan-400/30',
          orb2: 'bg-gradient-to-tr from-cyan-400/40 via-blue-500/30 to-pink-400/25',
          orb3: 'bg-gradient-to-bl from-purple-600/40 via-pink-400/30 to-cyan-300/25',
        };
      default:
        return {
          orb1: 'bg-pink-400/30',
          orb2: 'bg-amber-300/25',
          orb3: 'bg-rose-300/25',
        };
    }
  };

  const orbs = getAuroraOrbs();

  return (
    <>
      {/* 1. Living Dynamic Aurora Mesh Fluid Orbs (Deep Backdrop at z-0) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className={`absolute -top-32 -left-32 w-[550px] h-[550px] sm:w-[750px] sm:h-[750px] rounded-full blur-[100px] sm:blur-[140px] opacity-80 aurora-orb-1 transition-all duration-1000 ${orbs.orb1}`} />
        <div className={`absolute top-1/3 -right-32 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full blur-[100px] sm:blur-[140px] opacity-75 aurora-orb-2 transition-all duration-1000 ${orbs.orb2}`} />
        <div className={`absolute -bottom-32 left-1/4 w-[480px] h-[480px] sm:w-[650px] sm:h-[650px] rounded-full blur-[100px] sm:blur-[140px] opacity-75 aurora-orb-3 transition-all duration-1000 ${orbs.orb3}`} />
      </div>

      {/* 2. Physics Interactive Atmospheric Particle Canvas (Foreground Floating at z-35, above content, beneath modals/header) */}
      {atmosphereIntensity !== 'off' && (
        <div className="fixed inset-0 pointer-events-none z-35 overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full opacity-95 transition-opacity duration-500"
          />
        </div>
      )}
    </>
  );
};

