/**
 * Lightweight Kawaii Particle & Confetti Burst Engine
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'circle' | 'heart' | 'star';
  rotation: number;
  vRot: number;
  opacity: number;
  life: number;
  maxLife: number;
}

const CANDY_COLORS = [
  '#FF4D6D', '#FF758F', '#FF85A1', // Pinks
  '#00B4D8', '#48CAE4', '#90E0EF', // Cyans
  '#FFB703', '#FCE043', '#FB8500', // Yellows & Oranges
  '#06D6A0', '#70E000', '#52B788', // Emeralds
  '#9D4EDD', '#C77DFF', '#E0AAFF', // Purples
];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let isAnimating = false;

function ensureCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof window === 'undefined') return null;

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
  }

  if (!ctx && canvas) {
    ctx = canvas.getContext('2d');
  }

  return ctx && canvas ? { canvas, ctx } : null;
}

function renderLoop() {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18; // gravity
    p.vx *= 0.98; // friction
    p.rotation += p.vRot;
    p.life++;
    p.opacity = Math.max(0, 1 - p.life / p.maxLife);

    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'heart') {
      ctx.font = `${p.size * 2}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤️', 0, 0);
    } else if (p.shape === 'star') {
      ctx.font = `${p.size * 2}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐️', 0, 0);
    }

    ctx.restore();
  }

  if (particles.length > 0) {
    requestAnimationFrame(renderLoop);
  } else {
    isAnimating = false;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

/**
 * Trigger a joyful particle burst from a screen point (x, y)
 */
export function triggerParticleBurst(x: number, y: number, count = 28): void {
  const env = ensureCanvas();
  if (!env) return;

  const shapes: ('circle' | 'heart' | 'star')[] = ['circle', 'circle', 'heart', 'star'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5, // initial upward pop
      size: Math.random() * 6 + 4,
      color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      life: 0,
      maxLife: Math.floor(Math.random() * 30 + 45),
    });
  }

  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(renderLoop);
  }
}

/**
 * Trigger a celebratory full-screen confetti shower
 */
export function triggerConfettiShower(count = 60): void {
  const env = ensureCanvas();
  if (!env) return;

  const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const shapes: ('circle' | 'heart' | 'star')[] = ['circle', 'heart', 'star'];

  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * -80;
    const speed = Math.random() * 4 + 3;

    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: speed,
      size: Math.random() * 8 + 5,
      color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.15,
      opacity: 1,
      life: 0,
      maxLife: Math.floor(Math.random() * 50 + 70),
    });
  }

  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(renderLoop);
  }
}
