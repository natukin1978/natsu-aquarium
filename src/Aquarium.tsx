import { useEffect, useRef } from 'react';

// --- 調整用定数 (マジックナンバーの排除) ---
const CONFIG = {
  SWIMMER: {
    MIN_SPEED: 0.2,   // 回遊魚の最低速度
    MAX_SPEED: 0.5,   // 回遊魚の最高速度
    SIZE_RATIO: 0.25, // 画面高に対するサイズ (0.25 = 25%)
    WAVE_AMP: 0.03,   // 上下ゆらゆらの振幅
  },
  DRIFTER: {
    MIN_SPEED: 0.1,   // 漂流生物の揺れ速度 (極低速)
    MAX_SPEED: 0.3,
    SIZE_RATIO: 0.2,
    RADIUS_BASE: 15,  // 漂う範囲の基本半径
  },
  COMMON: {
    AVOID_FACTOR: 0.03,     // 避ける力の強さ
    PERSONAL_SPACE: 1.1,    // 魚のサイズに対する回避距離の倍率
    FRICTION: 0.96,         // 回避の慣性 (1に近いほどぬるぬる動く)
  },
  ENVIRONMENT: {
    SAND_RATIO: 0.2,        // 砂底の高さ
    BUBBLE_SPEED_MIN: 0.2,
    BUBBLE_SPEED_MAX: 0.4,
    TIME_STEP: 0.008,       // 時間経過の速さ (以前の0.012から下げてゆったりに)
  }
};

interface Fish {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  speed: number;
  dir: number;
  image: HTMLImageElement;
  aspectRatio: number; // 比率維持用
  phase: number;
  phaseX: number;
  offsetY: number;
  isDrifter: boolean;
  driftRadius: number;
}

// (Bubble, Weed インターフェースは前回と同様)
interface Bubble { x: number; y: number; size: number; speed: number; offset: number; }
interface Weed { x: number; targetHeight: number; widthRatio: number; phase: number; }

export const Aquarium = ({ width, height, count }: { width: number; height: number; count: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const fishes: Fish[] = [];
    const bubbles: Bubble[] = [];
    const weeds: Weed[] = [];
    const imageNames = ['fish1.png', 'fish2.png', 'fish3.png', 'fish4.png', 'fish5.png', 'fish6.png', 'fish7.png', 'fish8.png', 'fish9.png', ];

    // --- 初期化 ---
    for (let i = 0; i < count; i++) {
      const img = new Image();
      const imgIndex = i % imageNames.length;
      img.src = `${import.meta.env.BASE_URL}${imageNames[imgIndex]}`;
      
      // 漂流タイプ
      const isDrifter = imgIndex >= 6;
      const baseX = Math.random() * width;
      const baseY = isDrifter ? height * 0.5 + Math.random() * (height * 0.3) : Math.random() * (height * 0.6);

      // 画像の比率を読み込む
      img.onload = () => {
        const fish: Fish = {
          x: baseX,
          y: baseY,
          baseX: baseX,
          baseY: baseY,
          speed: isDrifter 
            ? CONFIG.DRIFTER.MIN_SPEED + Math.random() * (CONFIG.DRIFTER.MAX_SPEED - CONFIG.DRIFTER.MIN_SPEED)
            : CONFIG.SWIMMER.MIN_SPEED + Math.random() * (CONFIG.SWIMMER.MAX_SPEED - CONFIG.SWIMMER.MIN_SPEED),
          dir: Math.random() > 0.5 ? 1 : -1,
          image: img,
          aspectRatio: img.width / img.height, // 比率を保存
          phase: Math.random() * Math.PI * 2,
          phaseX: Math.random() * Math.PI * 2,
          offsetY: 0,
          isDrifter: isDrifter,
          driftRadius: isDrifter ? CONFIG.DRIFTER.RADIUS_BASE + Math.random() * 20 : 0
        };
        fishes.push(fish);
      };
    }

    // (泡と水草の初期化は前回と同様のため、定数利用版に内部調整済みとして進めます)
    const clusterCount = Math.floor(width / 350);
    for (let c = 0; c < clusterCount; c++) {
      const centerX = (width / clusterCount) * c + (Math.random() * 100);
      const weedsInCluster = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < weedsInCluster; i++) {
        weeds.push({
          x: centerX + (Math.random() - 0.5) * 80,
          targetHeight: 0.4 + Math.random() * 0.4,
          widthRatio: 0.04 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    for (let i = 0; i < Math.max(15, count); i++) {
      bubbles.push({
        x: Math.random() * width, y: Math.random() * height,
        size: 1 + Math.random() * 2,
        speed: CONFIG.ENVIRONMENT.BUBBLE_SPEED_MIN + Math.random() * (CONFIG.ENVIRONMENT.BUBBLE_SPEED_MAX - CONFIG.ENVIRONMENT.BUBBLE_SPEED_MIN),
        offset: Math.random() * 100
      });
    }

    let time = 0;

    const render = () => {
      time += CONFIG.ENVIRONMENT.TIME_STEP;
      ctx.fillStyle = '#004466';
      ctx.fillRect(0, 0, width, height);

      // 砂底
      const sandH = height * CONFIG.ENVIRONMENT.SAND_RATIO;
      const sandGradient = ctx.createLinearGradient(0, height - sandH, 0, height);
      sandGradient.addColorStop(0, '#d4c6a0'); sandGradient.addColorStop(1, '#a89a78');
      ctx.fillStyle = sandGradient; ctx.fillRect(0, height - sandH, width, sandH);

      // 水草
      ctx.fillStyle = 'rgba(79, 119, 45, 0.85)';
      weeds.forEach(w => {
        const h = height * w.targetHeight;
        const sway = Math.sin(time + w.phase) * (h * 0.15);
        ctx.beginPath();
        ctx.moveTo(w.x - (height * w.widthRatio) / 2, height);
        ctx.quadraticCurveTo(w.x + sway * 0.5, height - h / 2, w.x + sway, height - h);
        ctx.quadraticCurveTo(w.x + sway * 0.5 + (height * w.widthRatio) / 2, height - h / 2, w.x + (height * w.widthRatio) / 2, height);
        ctx.fill();
      });

      // 泡
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      bubbles.forEach(b => {
        b.y -= b.speed;
        const xShake = Math.sin(time + b.offset) * 2;
        ctx.beginPath(); ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2); ctx.stroke();
        if (b.y < -20) { b.y = height + 20; b.x = Math.random() * width; }
      });

      // 生き物の更新と描画
      fishes.forEach((f1) => {
        const currentSizeW = height * (f1.isDrifter ? CONFIG.DRIFTER.SIZE_RATIO : CONFIG.SWIMMER.SIZE_RATIO);
        const currentSizeH = currentSizeW / f1.aspectRatio; // 比率を維持した高さ

        // 回避ロジック
        let yPush = 0;
        const pSpace = currentSizeW * CONFIG.COMMON.PERSONAL_SPACE;
        fishes.forEach((f2) => {
          if (f1 === f2) return;
          const dx = f1.x - f2.x; const dy = f1.y - f2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pSpace) {
            yPush += (dy > 0 ? 0.5 : -0.5) * (pSpace - dist) * CONFIG.COMMON.AVOID_FACTOR;
          }
        });
        f1.offsetY = f1.offsetY * CONFIG.COMMON.FRICTION + yPush;

        if (f1.isDrifter) {
          f1.x = f1.baseX + Math.sin(time * f1.speed + f1.phaseX) * f1.driftRadius;
          f1.y = f1.baseY + Math.cos(time * f1.speed + f1.phase) * (f1.driftRadius * 0.4) + f1.offsetY;
        } else {
          f1.x += f1.speed * f1.dir;
          f1.y = f1.baseY + Math.sin(time + f1.phase) * (height * CONFIG.SWIMMER.WAVE_AMP) + f1.offsetY;
          if (f1.x > width + currentSizeW) f1.x = -currentSizeW;
          if (f1.x < -currentSizeW) f1.x = width + currentSizeW;
        }

        ctx.save();
        ctx.translate(f1.x, f1.y);
        if (!f1.isDrifter && f1.dir === -1) ctx.scale(-1, 1);
        ctx.drawImage(f1.image, -currentSizeW/2, -currentSizeH/2, currentSizeW, currentSizeH);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, count]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />;
};
