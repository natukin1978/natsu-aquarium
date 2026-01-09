import { useEffect, useRef } from 'react';
import type { Fish, Bubble, Weed, FishType, SandDetail, BubbleEmitter, Decor } from './types';
import { CONFIG, FISH_ASSETS, FISH_RATIO, DECOR_ASSETS } from './constants';
import * as Draw from './drawUtils'; // まとめてインポート

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
    const sandDetails: SandDetail[] = [];

    const backgroundDecors: Decor[] = [];
    const foregroundDecors: Decor[] = [];

    // --- 初期化 ---
    const init = () => {
      const sandH = height * CONFIG.ENVIRONMENT.SAND_RATIO;
      const sandTop = height - sandH;

      // 砂のムラを生成
      for (let i = 0; i < 15; i++) {
        sandDetails.push({
          x: Math.random() * width, y: sandTop + Math.random() * sandH,
          width: width * 0.1 + Math.random() * (width * 0.2),
          height: sandH * 0.3 + Math.random() * (sandH * 0.5),
          opacity: 0.03 + Math.random() * 0.05
        });
      }

      // 生き物のプール
      const fishPool: { type: FishType; src: string }[] = [];
      (Object.keys(FISH_ASSETS) as FishType[]).forEach(type => {
        FISH_ASSETS[type].forEach(src => fishPool.push({ type, src }));
      });

      // 比率に基づいたタイプ選択用のリストを作成 ['Swimmers', 'Swimmers', 'Swimmers', 'Drifters', 'Crawlers']
      const typePool: FishType[] = [];
      (Object.keys(FISH_RATIO) as FishType[]).forEach(type => {
        for (let i = 0; i < FISH_RATIO[type]; i++) {
          typePool.push(type);
        }
      });

      for (let i = 0; i < count; i++) {
        // 1. 比率リストからランダムにタイプを決定
        const selectedType = typePool[Math.floor(Math.random() * typePool.length)];
        
        // 2. そのタイプの画像リストからランダムに画像を選択
        const imagesOfType = FISH_ASSETS[selectedType];
        const selectedSrc = imagesOfType[Math.floor(Math.random() * imagesOfType.length)];
      
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}${selectedSrc}`;
        
        img.onload = () => {
          let baseY = Math.random() * (height * 0.6);
          if (selectedType === 'Crawlers') {
            baseY = sandTop + (sandH * 0.2);
          } else if (selectedType === 'Drifters') {
            baseY = height * 0.3 + Math.random() * (height * 0.4);
          }
      
          fishes.push({
            x: Math.random() * width,
            y: baseY,
            baseX: Math.random() * width,
            baseY,
            speed: selectedType === 'Crawlers' ? CONFIG.CRAWLER.SPEED : 
                   selectedType === 'Drifters' ? CONFIG.DRIFTER.MIN_SPEED + Math.random() * (CONFIG.DRIFTER.MAX_SPEED - CONFIG.DRIFTER.MIN_SPEED) :
                   CONFIG.SWIMMER.MIN_SPEED + Math.random() * (CONFIG.SWIMMER.MAX_SPEED - CONFIG.SWIMMER.MIN_SPEED),
            dir: Math.random() > 0.5 ? 1 : -1,
            image: img,
            aspectRatio: img.width / img.height,
            phase: Math.random() * Math.PI * 2,
            phaseX: Math.random() * Math.PI * 2,
            offsetY: 0,
            type: selectedType,
            driftRadius: selectedType === 'Drifters' ? CONFIG.DRIFTER.RADIUS_BASE + Math.random() * 20 : 0
          });
        };
      }

      // 泡と水草の初期化 (前回同様)
      for (let i = 0; i < Math.max(15, count); i++) {
        bubbles.push({ x: Math.random() * width, y: Math.random() * height, size: 1 + Math.random() * 2, speed: 0.2 + Math.random() * 0.2, offset: Math.random() * 100 });
      }
      const clusterCount = Math.floor(width / 350) + 1;
      for (let c = 0; c < clusterCount; c++) {
        const cx = (width / clusterCount) * c + (Math.random() * 100);
        for (let i = 0; i < 5; i++) {
          weeds.push({ x: cx + (Math.random() - 0.5) * 80, targetHeight: 0.3 + Math.random() * 0.3, widthRatio: 0.04 + Math.random() * 0.02, phase: Math.random() * Math.PI * 2 });
        }
      }

      // デコレーション（岩・珊瑚・流木）の生成
      const decorTypes = Object.entries(DECOR_ASSETS);
      for (let i = 0; i < 4; i++) { // 合計4個程度配置
        const [_, srcs] = decorTypes[Math.floor(Math.random() * decorTypes.length)];
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}${srcs[Math.floor(Math.random() * srcs.length)]}`;
        
        img.onload = () => {
          const isForeground = Math.random() > 0.5;
          const scale = 0.15 + Math.random() * 0.2;
          const w = height * scale * (img.width / img.height);
          const h = height * scale;
          
          const decor = {
            x: Math.random() * (width - w),
            y: (height * (1 - CONFIG.ENVIRONMENT.SAND_RATIO)) - (h * 0.45), // 砂に少し埋める
            width: w,
            height: h,
            image: img,
            isForeground
          };

          if (isForeground) foregroundDecors.push(decor);
          else backgroundDecors.push(decor);
        };
      }
    };

    const burstBubbles: Bubble[] = [];
    const emitters: BubbleEmitter[] = [];
    let lastEmitterTime = 0;

    const render = () => {
      const now = performance.now();
      time += CONFIG.ENVIRONMENT.TIME_STEP;

      // --- 描画レイヤー順 ---
      const cycle = Draw.drawOcean(ctx, width, height, time);
      Draw.drawLightRays(ctx, width, height, time, cycle);
      Draw.drawSand(ctx, width, height, sandDetails);

      // 1. 奥側のデコレーション (岩や奥の珊瑚)
      Draw.drawDecors(ctx, backgroundDecors);

      // --- 1. 既存の泡の更新 ---
      bubbles.forEach(b => {
        b.y -= b.speed;
        if (b.y < -20) {
          b.y = height + 20;
          b.x = Math.random() * width;
        }
      });

      // --- 2. ボコボコ泡のエミッター管理 ---
      if (emitters.length < 5 && now - lastEmitterTime > 4000) {
        emitters.push({
          x: Math.random() * width,
          startTime: now,
          duration: 2000 + Math.random() * 3000,
          isFinished: false
        });
        lastEmitterTime = now;
      }

      // --- 3. ボコボコ泡の生成 ---
      emitters.forEach(e => {
        const elapsed = now - e.startTime;
        if (elapsed > e.duration) e.isFinished = true;
        if (!e.isFinished && burstBubbles.length < 80) {
          if (Math.random() > 0.85) {
            burstBubbles.push({
              x: e.x + (Math.random() - 0.5) * 15,
              y: height + 10,
              size: 0.5 + Math.random() * 3,
              speed: 1.2 + Math.random() * 1.0,
              offset: Math.random() * 100
            });
          }
        }
      });

      // --- 4. ボコボコ泡の移動と削除 ---
      for (let i = burstBubbles.length - 1; i >= 0; i--) {
        burstBubbles[i].y -= burstBubbles[i].speed;
        if (burstBubbles[i].y < -20) {
          burstBubbles.splice(i, 1);
        }
      }

      // --- 5. 古くなったエミッターの削除 ---
      for (let i = emitters.length - 1; i >= 0; i--) {
        // 噴射終了から3秒経ち、枠を空ける
        if (emitters[i].isFinished && now - emitters[i].startTime > emitters[i].duration + 3000) {
          emitters.splice(i, 1);
        }
      }

      // 泡の描画
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      [...bubbles, ...burstBubbles].forEach(b => {
        const xShake = Math.sin(time + b.offset) * 2;
        ctx.beginPath();
        ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      // 生き物と水草の描画（水草が一番手前）
      fishes.forEach(f => {
        updateFish(f, time, width, height, fishes);
        Draw.drawFish(ctx, f, height);
      });

      // 4. 手前側のデコレーション (流木や手前の珊瑚)
      Draw.drawDecors(ctx, foregroundDecors);

      // 水草を手前に描画 (生き物が隠れる)
      Draw.drawWeeds(ctx, weeds, time, height);

      animationFrameId = requestAnimationFrame(render);
    };

    init();
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, count]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />;
};

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
