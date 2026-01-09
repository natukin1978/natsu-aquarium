import type { Fish, Weed, SandDetail, Decor } from './types';
import { CONFIG } from './constants';

// 2つの色を混ぜるヘルパー関数 ---
const lerpColor = (col1: string, col2: string, amt: number) => {
  const r1 = parseInt(col1.substring(1, 3), 16);
  const g1 = parseInt(col1.substring(3, 5), 16);
  const b1 = parseInt(col1.substring(5, 7), 16);

  const r2 = parseInt(col2.substring(1, 3), 16);
  const g2 = parseInt(col2.substring(3, 5), 16);
  const b2 = parseInt(col2.substring(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * amt).toString(16).padStart(2, '0');
  const g = Math.round(g1 + (g2 - g1) * amt).toString(16).padStart(2, '0');
  const b = Math.round(b1 + (b2 - b1) * amt).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
};

// --- 背景描画の更新 ---
export const drawOcean = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
  // 昼（0）から夜（1）へのサイクル。約2分で1周するように調整
  const cycle = (Math.sin(time * 0.01) + 1) / 2;

  // 昼の色と夜の色を定義
  const dayTop = '#005b8a';
  const dayBottom = '#002a44';
  const nightTop = '#001524';
  const nightBottom = '#00050a';

  const currentTop = lerpColor(dayTop, nightTop, cycle);
  const currentBottom = lerpColor(dayBottom, nightBottom, cycle);

  const seaGradient = ctx.createLinearGradient(0, 0, 0, height);
  seaGradient.addColorStop(0, currentTop);
  seaGradient.addColorStop(1, currentBottom);
  
  ctx.fillStyle = seaGradient;
  ctx.fillRect(0, 0, width, height);

  return cycle; // サイクル値を返して光の筋の透明度などに利用する
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

// --- 光の筋の更新 (夜は暗くする) ---
export const drawLightRays = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, cycle: number) => {
  ctx.save();
  // cycle（夜に近づくほど1）に応じて透明度を落とす
  const opacityBase = 0.05 * (1 - cycle);
  if (opacityBase <= 0) { ctx.restore(); return; }

  for (let i = 0; i < 3; i++) {
    const angle = Math.sin(time * 0.2 + i) * 0.02;
    const x = (width / 3) * i + (width / 6);
    const grad = ctx.createLinearGradient(x, 0, x + (width * angle), height);
    grad.addColorStop(0, `rgba(255, 255, 255, ${opacityBase})`);
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

export const drawDecors = (ctx: CanvasRenderingContext2D, decors: Decor[]) => {
  decors.forEach(d => {
    ctx.drawImage(d.image, d.x, d.y, d.width, d.height);
  });
};
