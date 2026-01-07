import type { Fish, Bubble, Weed, SandDetail } from './types';
import { CONFIG } from './constants';

export const drawOcean = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const seaGradient = ctx.createLinearGradient(0, 0, 0, height);
  seaGradient.addColorStop(0, '#005b8a');
  seaGradient.addColorStop(0.7, '#002a44');
  seaGradient.addColorStop(1, '#001524');
  ctx.fillStyle = seaGradient;
  ctx.fillRect(0, 0, width, height);
};

export const drawSand = (ctx: CanvasRenderingContext2D, width: number, height: number, details: SandDetail[]) => {
  const sandH = height * CONFIG.ENVIRONMENT.SAND_RATIO;
  const sandTop = height - sandH;
  
  // 基本の砂
  const sandGradient = ctx.createLinearGradient(0, sandTop, 0, height);
  sandGradient.addColorStop(0, '#dccca3');
  sandGradient.addColorStop(1, '#a69875');
  ctx.fillStyle = sandGradient;
  ctx.fillRect(0, sandTop, width, sandH);

  // 砂のムラ
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  details.forEach(s => {
    ctx.fillStyle = `rgba(0, 0, 0, ${s.opacity})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.width, s.height, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

export const drawLightRays = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const angle = Math.sin(time * 0.2 + i) * 0.02;
    const x = (width / 3) * i + (width / 6);
    const grad = ctx.createLinearGradient(x, 0, x + (width * angle), height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 50, 0); ctx.lineTo(x + 50, 0);
    ctx.lineTo(x + 200 + (width * angle), height);
    ctx.lineTo(x - 200 + (width * angle), height);
    ctx.fill();
  }
  ctx.restore();
};

export const drawBubbles = (ctx: CanvasRenderingContext2D, bubbles: Bubble[], time: number, height: number) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  bubbles.forEach(b => {
    b.y -= b.speed;
    const xShake = Math.sin(time + b.offset) * 2;
    ctx.beginPath();
    ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2);
    ctx.stroke();
    if (b.y < -20) b.y = height + 20;
  });
  ctx.restore();
};

export const drawFish = (ctx: CanvasRenderingContext2D, f: Fish, height: number) => {
  let sizeRatio = CONFIG.SWIMMER.SIZE_RATIO;
  if (f.type === 'Drifters') sizeRatio = CONFIG.DRIFTER.SIZE_RATIO;
  if (f.type === 'Crawlers') sizeRatio = CONFIG.CRAWLER.SIZE_RATIO;
  
  const w = height * sizeRatio;
  const h = w / f.aspectRatio;

  ctx.save();
  ctx.translate(f.x, f.y);
  if (f.dir === -1) ctx.scale(-1, 1);
  ctx.drawImage(f.image, -w / 2, -h / 2, w, h);
  ctx.restore();
};

export const drawWeeds = (ctx: CanvasRenderingContext2D, weeds: Weed[], time: number, height: number) => {
  ctx.save();
  ctx.fillStyle = 'rgba(79, 119, 45, 0.85)';
  weeds.forEach(w => {
    const h = height * w.targetHeight;
    const wPixel = height * w.widthRatio;
    const sway = Math.sin(time + w.phase) * (h * 0.15);
    ctx.beginPath();
    ctx.moveTo(w.x - wPixel / 2, height);
    ctx.quadraticCurveTo(w.x + sway * 0.5, height - h / 2, w.x + sway, height - h);
    ctx.quadraticCurveTo(w.x + sway * 0.5 + wPixel / 2, height - h / 2, w.x + wPixel / 2, height);
    ctx.fill();
  });
  ctx.restore();
};
