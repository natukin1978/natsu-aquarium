import { useEffect, useRef } from 'react';
import type { Fish, Bubble, Weed, FishType, SandDetail } from './types';
import { CONFIG, FISH_ASSETS } from './constants';

export const Aquarium = ({ width, height, count }: { width: number; height: number; count: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    const fishes: Fish[] = [];
    const bubbles: Bubble[] = [];
    const weeds: Weed[] = [];
    const sandDetails: SandDetail[] = []; // 砂のムラを保持

    // --- 1. 初期化ロジック ---
    const sandTopY = height * (1 - CONFIG.ENVIRONMENT.SAND_RATIO);

    // お魚のプール作成
    const fishPool: { type: FishType; src: string }[] = [];
    (Object.keys(FISH_ASSETS) as FishType[]).forEach(type => {
      FISH_ASSETS[type].forEach(src => fishPool.push({ type, src }));
    });

    const init = () => {
      const sandH = height * CONFIG.ENVIRONMENT.SAND_RATIO;
      const sandTop = height - sandH;

      // 砂底の「色ムラ」を事前に15個ほど生成して固定する
      for (let i = 0; i < 15; i++) {
        sandDetails.push({
          x: Math.random() * width,
          y: sandTop + Math.random() * sandH,
          width: width * 0.1 + Math.random() * (width * 0.2),
          height: sandH * 0.3 + Math.random() * (sandH * 0.5),
          opacity: 0.03 + Math.random() * 0.05 // 非常に薄く設定
        });
      }
      
      for (let i = 0; i < count; i++) {
        const asset = fishPool[i % fishPool.length];
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}${asset.src}`;
        img.onload = () => {
          const type = asset.type;
          let baseY = Math.random() * (height * 0.6);
          if (type === 'Crawlers') baseY = sandTopY + (height * CONFIG.ENVIRONMENT.SAND_RATIO * 0.2);
          else if (type === 'Drifters') baseY = height * 0.3 + Math.random() * (height * 0.4);

          fishes.push({
            x: Math.random() * width, y: baseY, baseX: Math.random() * width, baseY,
            speed: type === 'Crawlers' ? CONFIG.CRAWLER.SPEED : 
                   type === 'Drifters' ? CONFIG.DRIFTER.MIN_SPEED + Math.random() * (CONFIG.DRIFTER.MAX_SPEED - CONFIG.DRIFTER.MIN_SPEED) :
                   CONFIG.SWIMMER.MIN_SPEED + Math.random() * (CONFIG.SWIMMER.MAX_SPEED - CONFIG.SWIMMER.MIN_SPEED),
            dir: Math.random() > 0.5 ? 1 : -1,
            image: img, aspectRatio: img.width / img.height,
            phase: Math.random() * Math.PI * 2, phaseX: Math.random() * Math.PI * 2,
            offsetY: 0, type, driftRadius: type === 'Drifters' ? CONFIG.DRIFTER.RADIUS_BASE + Math.random() * 20 : 0
          });
        };
      }

      // 泡の初期化
      for (let i = 0; i < Math.max(15, count); i++) {
        bubbles.push({
          x: Math.random() * width, y: Math.random() * height,
          size: 1 + Math.random() * 2,
          speed: CONFIG.ENVIRONMENT.BUBBLE_SPEED_MIN + Math.random() * (CONFIG.ENVIRONMENT.BUBBLE_SPEED_MAX - CONFIG.ENVIRONMENT.BUBBLE_SPEED_MIN),
          offset: Math.random() * 100
        });
      }

      // 水草の初期化 (群生)
      const clusterCount = Math.floor(width / 350) + 1;
      for (let c = 0; c < clusterCount; c++) {
        const centerX = (width / clusterCount) * c + (Math.random() * 100);
        for (let i = 0; i < 5; i++) {
          weeds.push({
            x: centerX + (Math.random() - 0.5) * 80,
            targetHeight: 0.4 + Math.random() * 0.4,
            widthRatio: 0.04 + Math.random() * 0.02,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
    };

    // --- 2. 描画ループ ---
    const render = () => {
      time += CONFIG.ENVIRONMENT.TIME_STEP;

      // 海の背景 (より深いグラデーション)
      const seaGradient = ctx.createLinearGradient(0, 0, 0, height);
      seaGradient.addColorStop(0, '#005b8a');
      seaGradient.addColorStop(0.7, '#002a44');
      seaGradient.addColorStop(1, '#001524');
      ctx.fillStyle = seaGradient;
      ctx.fillRect(0, 0, width, height);

      // 差し込む光 (God Rays) - 眺めるための演出
      drawLightRays(ctx, width, height, time);

      // 砂底の基本レイヤー
      const sandH = height * CONFIG.ENVIRONMENT.SAND_RATIO;
      const sandTop = height - sandH;
      const sandGradient = ctx.createLinearGradient(0, sandTop, 0, height);
      sandGradient.addColorStop(0, '#dccca3');
      sandGradient.addColorStop(1, '#a69875');
      ctx.fillStyle = sandGradient;
      ctx.fillRect(0, sandTop, width, sandH);

      // 固定された砂のムラを描画 (チラつかない)
      ctx.globalCompositeOperation = 'multiply'; // 下地と馴染ませる
      sandDetails.forEach(s => {
        ctx.fillStyle = `rgba(0, 0, 0, ${s.opacity})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.width, s.height, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';

      // 泡
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      bubbles.forEach(b => {
        b.y -= b.speed;
        const xShake = Math.sin(time + b.offset) * 2;
        ctx.beginPath();
        ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
        if (b.y < -20) { b.y = height + 20; b.x = Math.random() * width; }
      });

      // 生き物
      fishes.forEach((f) => {
        // サイズ計算ロジック
        let sizeRatio = CONFIG.SWIMMER.SIZE_RATIO;
        if (f.type === 'Drifters') sizeRatio = CONFIG.DRIFTER.SIZE_RATIO;
        if (f.type === 'Crawlers') sizeRatio = CONFIG.CRAWLER.SIZE_RATIO;
        const w = height * sizeRatio;
        const h = w / f.aspectRatio;

        // 移動ロジックの呼び出し
        updateFish(f, time, width, height, fishes);

        ctx.save();
        ctx.translate(f.x, f.y);
        
        // 【修正ポイント】全タイプで向き（f.dir）を反映する
        // f.dir が -1 なら左右反転させる
        if (f.dir === -1) {
          ctx.scale(-1, 1);
        }

        ctx.drawImage(f.image, -w/2, -h/2, w, h);
        ctx.restore();
      });

      // 水草
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

      animationFrameId = requestAnimationFrame(render);
    };

    init();
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, count]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />;
};

// 落ち着いた雰囲気を出すための光の筋
function drawLightRays(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const angle = Math.sin(time * 0.2 + i) * 0.02; // 非常にゆっくり揺れる
    const x = (width / 3) * i + (width / 6);
    const grad = ctx.createLinearGradient(x, 0, x + (width * angle), height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 50, 0);
    ctx.lineTo(x + 50, 0);
    ctx.lineTo(x + 200 + (width * angle), height);
    ctx.lineTo(x - 200 + (width * angle), height);
    ctx.fill();
  }
  ctx.restore();
}

// コンポーネント外に配置してスッキリさせる
function updateFish(f: Fish, time: number, width: number, height: number, allFishes: Fish[]) {
  let yPush = 0;
  let xPush = 0;
  const pSpace = (height * 0.25) * CONFIG.COMMON.PERSONAL_SPACE;

  // 簡易的な回避
  allFishes.forEach(f2 => {
    if (f === f2) return;
    const dx = f.x - f2.x;
    const dy = f.y - f2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < pSpace) {
      if (f.type !== 'Crawlers') yPush += (dy > 0 ? 0.5 : -0.5) * (pSpace - dist) * CONFIG.COMMON.AVOID_FACTOR;
      xPush += (dx > 0 ? 0.2 : -0.2) * (pSpace - dist) * CONFIG.COMMON.AVOID_FACTOR;
    }
  });

  f.offsetY = f.offsetY * CONFIG.COMMON.FRICTION + yPush;

  if (f.type === 'Crawlers') {
    f.x += (f.speed + xPush * 0.1) * f.dir;
    f.y = f.baseY + Math.sin(time * 5 + f.phase) * CONFIG.CRAWLER.WIGGLE;
  } else if (f.type === 'Drifters') {
    f.x = f.baseX + Math.sin(time * f.speed + f.phaseX) * f.driftRadius;
    f.y = f.baseY + Math.cos(time * f.speed + f.phase) * (f.driftRadius * 0.4) + f.offsetY;
  } else {
    f.x += (f.speed + xPush * 0.1) * f.dir;
    f.y = f.baseY + Math.sin(time + f.phase) * (height * CONFIG.SWIMMER.WAVE_AMP) + f.offsetY;
  }

  // 画面端ループ
  const margin = 100;
  if (f.type !== 'Drifters') {
    if (f.x > width + margin) f.x = -margin;
    if (f.x < -margin) f.x = width + margin;
  }
}
