import { useEffect, useRef } from 'react';

// --- インターフェースの拡張 ---
interface Fish {
  x: number;
  y: number;
  baseX: number; // 新規: 漂流の基準点X
  baseY: number;
  speed: number; // 漂流の場合は「揺れの速さ」になります
  dir: number;
  image: HTMLImageElement;
  phase: number;  // 縦揺れのタイミング
  phaseX: number; // 新規: 横揺れのタイミング
  offsetY: number;
  isDrifter: boolean; // 新規: 漂流タイプかどうか
  driftRadius: number; // 新規: 漂流する範囲の半径
}

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  offset: number;
}

interface Weed {
  x: number;
  targetHeight: number;
  widthRatio: number;
  phase: number;
}

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

    // --- 1. 生き物の初期化 (グループ化) ---
    for (let i = 0; i < count; i++) {
      const img = new Image();
      // 画像名でタイプを仮決定 (後半の画像を漂流タイプとする)
      const imgIndex = i % imageNames.length;
      img.src = `${import.meta.env.BASE_URL}${imageNames[imgIndex]}`;
      
      // 漂流タイプ
      const isDrifter = imgIndex >= 6; 

      const baseX = Math.random() * width;
      // 漂流タイプは少し下の方、回遊タイプは上の方をメインに
      const baseY = isDrifter 
        ? height * 0.4 + Math.random() * (height * 0.4) 
        : Math.random() * (height * 0.6);

      fishes.push({
        x: baseX,
        y: baseY,
        baseX: baseX,
        baseY: baseY,
        // 漂流タイプはゆっくり、回遊タイプは速く
        speed: isDrifter ? 0.5 + Math.random() * 0.5 : 0.5 + Math.random() * 0.8,
        dir: Math.random() > 0.5 ? 1 : -1,
        image: img,
        phase: Math.random() * Math.PI * 2,
        phaseX: Math.random() * Math.PI * 2, // 横揺れ用
        offsetY: 0,
        isDrifter: isDrifter,
        // 漂流範囲（ウニなら小さく、クラゲなら大きくなど調整可能）
        driftRadius: isDrifter ? 30 + Math.random() * 30 : 0 
      });
    }

    // --- 2. 泡の初期化 (既存) ---
    const bubbleCount = Math.max(15, count * 1.2); 
    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 2.5,
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * 100
      });
    }

    // --- 3. 水草の初期化 (既存・群生) ---
    const clusterCount = Math.floor(width / 300);
    for (let c = 0; c < clusterCount; c++) {
      const centerX = (width / clusterCount) * c + (Math.random() * 100);
      const weedsInCluster = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < weedsInCluster; i++) {
        weeds.push({
          x: centerX + (Math.random() - 0.5) * 60,
          targetHeight: 0.4 + Math.random() * 0.4,
          widthRatio: 0.04 + Math.random() * 0.03,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.012;
      
      // 背景と砂 (既存)
      ctx.fillStyle = '#004466';
      ctx.fillRect(0, 0, width, height);
      const sandH = height * 0.2;
      const sandY = height - sandH;
      const sandGradient = ctx.createLinearGradient(0, sandY, 0, height);
      sandGradient.addColorStop(0, '#d4c6a0');
      sandGradient.addColorStop(1, '#a89a78');
      ctx.fillStyle = sandGradient;
      ctx.fillRect(0, sandY, width, sandH);

      // 水草 (既存)
      ctx.fillStyle = 'rgba(79, 119, 45, 0.9)';
      weeds.forEach(w => {
        const actualHeight = height * w.targetHeight;
        const actualWidth = height * w.widthRatio;
        const tipSway = Math.sin(time + w.phase) * (actualHeight * 0.2); 
        ctx.beginPath();
        ctx.moveTo(w.x - actualWidth / 2, height);
        ctx.quadraticCurveTo(w.x - actualWidth / 2 + tipSway * 0.5, height - actualHeight / 2, w.x + tipSway, height - actualHeight);
        ctx.quadraticCurveTo(w.x + actualWidth / 2 + tipSway * 0.5, height - actualHeight / 2, w.x + actualWidth / 2, height);
        ctx.fill();
      });

      // 泡 (既存)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      bubbles.forEach(b => {
        b.y -= b.speed;
        const xShake = Math.sin(time + b.offset) * 2;
        ctx.beginPath();
        ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
        if (b.y < -20) { b.y = height + 20; b.x = Math.random() * width; }
      });

      // --- 生き物の描画と更新 ---
      const fishSize = height * 0.25;

      fishes.forEach((f1, i) => {
        // 回避ロジック (共通)
        let yPush = 0; let xPush = 0;
        const personalSpace = fishSize * 1.2;
        fishes.forEach((f2, j) => {
          if (i === j) return;
          const dx = f1.x - f2.x; const dy = f1.y - f2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < personalSpace) {
            yPush += (dy > 0 ? 0.8 : -0.8) * (personalSpace - dist) * 0.05;
            // 漂流タイプは横方向の回避（加速・減速）はしない
            if (!f1.isDrifter) {
              const isAhead = (f1.dir > 0 && dx < 0) || (f1.dir < 0 && dx > 0);
              xPush += isAhead ? -0.1 : 0.1;
            }
          }
        });
        f1.offsetY = f1.offsetY * 0.96 + yPush;

        // --- 動きの分岐 ---
        if (f1.isDrifter) {
          // 【漂流グループ】基準点を中心にゆらゆら円運動
          // speed を揺れの速さ係数として使う
          const driftX = Math.sin(time * f1.speed + f1.phaseX) * f1.driftRadius;
          const driftY = Math.cos(time * f1.speed + f1.phase) * (f1.driftRadius * 0.5); // 縦揺れは少し控えめに
          
          f1.x = f1.baseX + driftX;
          f1.y = f1.baseY + driftY + f1.offsetY; // 回避による上下ズレを加算

        } else {
          // 【回遊グループ】既存の左右移動＆ループ
          const currentSpeed = f1.speed + xPush;
          f1.x += Math.max(0.3, currentSpeed) * f1.dir;
          const wave = Math.sin(time + f1.phase) * (height * 0.05);
          f1.y = f1.baseY + wave + f1.offsetY;

          // 画面端ループ
          if (f1.x > width + fishSize) f1.x = -fishSize;
          if (f1.x < -fishSize) f1.x = width + fishSize;
        }

        // 描画
        ctx.save();
        ctx.translate(f1.x, f1.y);
        // 漂流タイプは向き反転しない（常に正面向きと仮定）
        if (!f1.isDrifter && f1.dir === -1) ctx.scale(-1, 1);
        if (f1.image.complete) {
          ctx.drawImage(f1.image, -fishSize/2, -fishSize/2, fishSize, fishSize);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, count]);

  return (
    <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
  );
};
