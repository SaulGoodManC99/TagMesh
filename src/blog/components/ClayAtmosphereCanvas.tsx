import React, { useEffect, useRef } from 'react';
import { useClayTheme } from '../utils/clayThemes';

export const ClayAtmosphereCanvas: React.FC = () => {
  const { theme } = useClayTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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

    // Mouse interactive physics
    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.vx = (e.clientX - mouse.x) * 0.1;
      mouse.vy = (e.clientY - mouse.y) * 0.1;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const themeId = theme.id;
    const particleCount = themeId === 'rain' ? 85 : themeId === 'stars' ? 75 : themeId === 'fireflies' ? 55 : 55;

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

      if (themeId === 'sakura') {
        return {
          x,
          y,
          size: Math.random() * 11 + 8,
          speedX: Math.random() * 1.5 - 0.4,
          speedY: Math.random() * 1.4 + 0.8,
          opacity: Math.random() * 0.5 + 0.45,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.03 - 0.015,
          pitch: Math.random() * Math.PI * 2,
          pitchSpeed: Math.random() * 0.04 + 0.02,
          color: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#e11d48'][Math.floor(Math.random() * 5)],
          life: 0,
          maxLife: 1000,
        };
      } else if (themeId === 'rain') {
        return {
          x,
          y,
          size: Math.random() * 20 + 14,
          speedX: -1.4,
          speedY: Math.random() * 9 + 11,
          opacity: Math.random() * 0.45 + 0.35,
          rot: -0.14,
          rotSpeed: 0,
          pitch: 0,
          pitchSpeed: 0,
          color: ['#0284c7', '#0369a1', '#0ea5e9', '#0891b2'][Math.floor(Math.random() * 4)],
          life: 0,
          maxLife: 1000,
        };
      } else if (themeId === 'fireflies') {
        return {
          x,
          y,
          size: Math.random() * 5.5 + 3.5,
          speedX: Math.random() * 0.9 - 0.45,
          speedY: Math.random() * -0.8 - 0.25,
          opacity: Math.random() * 0.8 + 0.2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.05,
          pitch: 0,
          pitchSpeed: 0,
          color: ['#ea580c', '#d97706', '#f59e0b', '#fbbf24', '#b45309'][Math.floor(Math.random() * 5)],
          life: Math.random() * 100,
          maxLife: 160,
        };
      } else if (themeId === 'stars') {
        return {
          x,
          y,
          size: Math.random() * 4 + 2,
          speedX: Math.random() * 0.3 - 0.15,
          speedY: Math.random() * 0.3 - 0.15,
          opacity: Math.random() * 0.85 + 0.15,
          rot: 0,
          rotSpeed: Math.random() * 0.02,
          pitch: 0,
          pitchSpeed: 0,
          color: ['#7c3aed', '#9333ea', '#06b6d4', '#ec4899', '#ffffff'][Math.floor(Math.random() * 5)],
          life: Math.random() * 100,
          maxLife: 180,
        };
      } else {
        // 'zen' / 'sundust'
        return {
          x,
          y,
          size: Math.random() * 4.5 + 2.5,
          speedX: Math.random() * 0.6 - 0.3,
          speedY: Math.random() * -0.5 - 0.2,
          opacity: Math.random() * 0.65 + 0.3,
          rot: 0,
          rotSpeed: 0,
          pitch: 0,
          pitchSpeed: 0,
          color: ['#059669', '#10b981', '#d97706', '#f59e0b', '#047857'][Math.floor(Math.random() * 5)],
          life: Math.random() * 100,
          maxLife: 200,
        };
      }
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(initParticle());
    }

    // Shooting stars
    let shootingStar: { x: number; y: number; len: number; speed: number; opacity: number } | null = null;
    let nextShootingStarTime = Date.now() + 1500;

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.015;

      // 1. Cosmic Aurora Wave Ribbon in Sky
      if (themeId === 'stars') {
        const auroraGrad = ctx.createLinearGradient(0, 0, width, height * 0.5);
        auroraGrad.addColorStop(0, 'rgba(124, 58, 237, 0.12)');
        auroraGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
        auroraGrad.addColorStop(1, 'rgba(236, 72, 153, 0.03)');
        ctx.fillStyle = auroraGrad;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.15 + Math.sin(time) * 35);
        ctx.bezierCurveTo(
          width * 0.33, height * 0.05 + Math.cos(time) * 45,
          width * 0.66, height * 0.28 + Math.sin(time * 0.8) * 40,
          width, height * 0.12 + Math.cos(time * 0.5) * 30
        );
        ctx.lineTo(width, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Zen Sunbeam Light Rays
      if (themeId === 'zen') {
        const beamGrad = ctx.createRadialGradient(width * 0.85, 0, 10, width * 0.85, 0, height * 0.85);
        beamGrad.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
        beamGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.06)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, 0, width, height * 0.75);
      }

      // 3. Shooting Star
      if (themeId === 'stars') {
        const now = Date.now();
        if (!shootingStar && now > nextShootingStarTime) {
          shootingStar = {
            x: Math.random() * width * 0.75,
            y: Math.random() * height * 0.25,
            len: Math.random() * 110 + 90,
            speed: Math.random() * 15 + 13,
            opacity: 1,
          };
        }

        if (shootingStar) {
          ctx.save();
          ctx.beginPath();
          const starGrad = ctx.createLinearGradient(
            shootingStar.x, shootingStar.y,
            shootingStar.x - shootingStar.len, shootingStar.y - shootingStar.len * 0.55
          );
          starGrad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
          starGrad.addColorStop(0.3, `rgba(6, 182, 212, ${shootingStar.opacity * 0.9})`);
          starGrad.addColorStop(0.7, `rgba(147, 51, 234, ${shootingStar.opacity * 0.7})`);
          starGrad.addColorStop(1, `rgba(99, 102, 241, 0)`);
          ctx.strokeStyle = starGrad;
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(shootingStar.x - shootingStar.len, shootingStar.y - shootingStar.len * 0.55);
          ctx.stroke();
          ctx.restore();

          shootingStar.x += shootingStar.speed;
          shootingStar.y += shootingStar.speed * 0.55;
          shootingStar.opacity -= 0.022;

          if (shootingStar.opacity <= 0 || shootingStar.x > width + 120 || shootingStar.y > height + 120) {
            shootingStar = null;
            nextShootingStarTime = now + Math.random() * 3500 + 1500;
          }
        }
      }

      // 4. Render & Update Main Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse avoidance/sway
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (140 - dist) / 140;
          if (themeId === 'fireflies') {
            p.x -= (dx / dist) * force * 1.5;
            p.y -= (dy / dist) * force * 1.5;
          } else {
            p.x += (dx / dist) * force * 2.5;
            p.y += (dy / dist) * force * 2.5;
          }
        }

        if (themeId === 'sakura') {
          // 🌸 3D Fluttering Petals with Sway
          p.x += p.speedX + Math.sin(time + p.y * 0.01) * 0.7;
          p.y += p.speedY;
          p.rot += p.rotSpeed;
          p.pitch += p.pitchSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(Math.cos(p.pitch), 1);
          ctx.globalAlpha = p.opacity;

          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.8);
          ctx.bezierCurveTo(p.size * 0.75, -p.size * 0.6, p.size * 0.8, p.size * 0.5, 0, p.size);
          ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.75, -p.size * 0.6, 0, -p.size * 0.8);
          ctx.fillStyle = p.color;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.5);
          ctx.lineTo(0, p.size * 0.7);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.restore();

          if (p.y > height + 20 || p.x > width + 20 || p.x < -20) {
            particles[i] = initParticle({ y: -15, x: Math.random() * (width + 50) - 25 });
          }
        } else if (themeId === 'rain') {
          // 🌊 Azure Ocean Rain Streaks & Splashes
          p.x += p.speedX;
          p.y += p.speedY;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * (p.size * 0.2), p.y - p.size);
          ctx.stroke();
          ctx.restore();

          if (p.y >= height - 10) {
            if (splashes.length < 25 && Math.random() < 0.45) {
              splashes.push({
                x: p.x,
                y: height - Math.random() * 15,
                radius: 1,
                maxRadius: Math.random() * 12 + 6,
                opacity: 0.7,
              });
            }
            particles[i] = initParticle({ y: -20, x: Math.random() * (width + 100) });
          }
        } else if (themeId === 'fireflies') {
          // 👑 Pulsing Glowing Amber Summer Fireflies
          p.life += 1;
          const pulse = (Math.sin((p.life / p.maxLife) * Math.PI * 2) + 1) / 2;
          const currentAlpha = p.opacity * (0.35 + pulse * 0.65);

          p.x += p.speedX + Math.sin(time * 2 + p.y) * 0.45;
          p.y += p.speedY + Math.cos(time * 2 + p.x) * 0.35;

          ctx.save();
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.8);
          glow.addColorStop(0, p.color);
          glow.addColorStop(0.4, p.color);
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = Math.min(1, currentAlpha * 1.6);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (p.life >= p.maxLife || p.y < -30 || p.x < -30 || p.x > width + 30) {
            particles[i] = initParticle({ y: height + 10, x: Math.random() * width });
          }
        } else if (themeId === 'stars') {
          // 🌌 Twinkling Star Cross Glints on Lavender Sky
          p.life += 1;
          const twinkle = (Math.sin((p.life / p.maxLife) * Math.PI * 2) + 1) / 2;
          const currentAlpha = p.opacity * (0.25 + twinkle * 0.75);

          p.x += p.speedX;
          p.y += p.speedY;

          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = p.color;

          const s = p.size * (0.7 + twinkle * 0.6);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s * 2.4);
          ctx.lineTo(p.x + s * 0.7, p.y);
          ctx.lineTo(p.x, p.y + s * 2.4);
          ctx.lineTo(p.x - s * 0.7, p.y);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(p.x - s * 2.4, p.y);
          ctx.lineTo(p.x, p.y + s * 0.7);
          ctx.lineTo(p.x + s * 2.4, p.y);
          ctx.lineTo(p.x, p.y - s * 0.7);
          ctx.closePath();
          ctx.fill();

          ctx.restore();

          if (p.life >= p.maxLife || p.y > height + 20 || p.x > width + 20 || p.x < -20) {
            particles[i] = initParticle();
          }
        } else {
          // 🍵 Zen Bamboo Dew & Herbal Sparks
          p.life += 1;
          const shimmer = (Math.sin((p.life / p.maxLife) * Math.PI * 2) + 1) / 2;
          const currentAlpha = p.opacity * (0.35 + shimmer * 0.65);

          p.x += p.speedX + Math.sin(time + p.y * 0.02) * 0.35;
          p.y += p.speedY;

          ctx.save();
          const dustGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.6);
          dustGlow.addColorStop(0, p.color);
          dustGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = dustGlow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (p.life >= p.maxLife || p.y < -20 || p.x < -20 || p.x > width + 20) {
            particles[i] = initParticle({ y: height + 10, x: Math.random() * width });
          }
        }
      }

      // 5. Update & Render Ocean Rain Puddle Splashes
      if (themeId === 'rain') {
        for (let j = splashes.length - 1; j >= 0; j--) {
          const s = splashes[j];
          s.radius += 0.55;
          s.opacity -= 0.035;

          ctx.save();
          ctx.globalAlpha = Math.max(0, s.opacity);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius * 1.8, s.radius * 0.6, 0, 0, Math.PI * 2);
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
  }, [theme.id]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90 transition-opacity duration-500"
      style={{ pointerEvents: 'none' }}
    />
  );
};
