import { useEffect, useRef } from 'react';

interface Fish {
  x: number;
  y: number;
  baseY: number;
  speed: number;
  dir: number;
  image: HTMLImageElement;
  phase: number;
  offsetY: number;
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
    const imageNames = ['fish1.png', 'fish2.png', 'fish3.png', 'fish4.png', 'fish5.png', 'fish6.png'];

    // --- 1. お魚の初期化 (サイズ比率は描画時に調整) ---
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}${imageNames[i % imageNames.length]}`;
      // 砂底に潜りすぎないよう、上部70%をベースにする
      const baseY = Math.random() * (height * 0.7); 
      fishes.push({
        x: Math.random() * width,
        y: baseY,
        baseY: baseY,
        speed: 0.5 + Math.random() * 0.8,
        dir: Math.random() > 0.5 ? 1 : -1,
        image: img,
        phase: Math.random() * Math.PI * 2,
        offsetY: 0
      });
    }

    // --- 2. 泡の初期化 ---
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

    // --- 3. 水草の「群生」初期化 ---
    // 数カ所の「拠点」を作成し、その周りに数本ずつ生やす
    const clusterCount = Math.floor(width / 300); // 300pxごとに1拠点
    for (let c = 0; c < clusterCount; c++) {
      const centerX = (width / clusterCount) * c + (Math.random() * 100);
      const weedsInCluster = 3 + Math.floor(Math.random() * 4); // 1拠点に3〜6本
      
      for (let i = 0; i < weedsInCluster; i++) {
        weeds.push({
          x: centerX + (Math.random() - 0.5) * 60, // 拠点の左右30px以内に配置
          targetHeight: 0.4 + Math.random() * 0.4, // 高さの40%〜80%
          widthRatio: 0.04 + Math.random() * 0.03, // 太めにする
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.012; // 以前よりさらにゆったり
      
      // 背景
      ctx.fillStyle = '#004466';
      ctx.fillRect(0, 0, width, height);

      // --- 砂底 (高さの20%) ---
      const sandH = height * 0.2;
      const sandY = height - sandH;
      const sandGradient = ctx.createLinearGradient(0, sandY, 0, height);
      sandGradient.addColorStop(0, '#d4c6a0');
      sandGradient.addColorStop(1, '#a89a78');
      ctx.fillStyle = sandGradient;
      ctx.fillRect(0, sandY, width, sandH);

      // --- 水草 (群生) ---
      ctx.fillStyle = 'rgba(79, 119, 45, 0.9)'; // 少し透けさせて重なりを綺麗に
      weeds.forEach(w => {
        const actualHeight = height * w.targetHeight;
        const actualWidth = height * w.widthRatio;
        const tipSway = Math.sin(time + w.phase) * (actualHeight * 0.2); 
        
        ctx.beginPath();
        ctx.moveTo(w.x - actualWidth / 2, height);
        ctx.quadraticCurveTo(
          w.x - actualWidth / 2 + tipSway * 0.5, height - actualHeight / 2, 
          w.x + tipSway, height - actualHeight
        );
        ctx.quadraticCurveTo(
          w.x + actualWidth / 2 + tipSway * 0.5, height - actualHeight / 2,
          w.x + actualWidth / 2, height
        );
        ctx.fill();
      });

      // --- 泡 ---
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

      // --- お魚 (サイズ調整) ---
      const fishSize = height * 0.25; // 縦幅200pxなら50pxサイズに

      fishes.forEach((f1, i) => {
        // 回避ロジック
        let yPush = 0; let xPush = 0;
        const personalSpace = fishSize * 1.2; // 魚のサイズに合わせてパーソナルスペースを調整

        fishes.forEach((f2, j) => {
          if (i === j) return;
          const dx = f1.x - f2.x; const dy = f1.y - f2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < personalSpace) {
            yPush += (dy > 0 ? 0.8 : -0.8) * (personalSpace - dist) * 0.05;
            const isAhead = (f1.dir > 0 && dx < 0) || (f1.dir < 0 && dx > 0);
            xPush += isAhead ? -0.1 : 0.1;
          }
        });

        f1.offsetY = f1.offsetY * 0.96 + yPush;
        const currentSpeed = f1.speed + xPush;
        f1.x += Math.max(0.3, currentSpeed) * f1.dir;
        
        // 浮き沈みの幅も魚のサイズに合わせる
        const wave = Math.sin(time + f1.phase) * (height * 0.05);
        f1.y = f1.baseY + wave + f1.offsetY;

        if (f1.x > width + fishSize) f1.x = -fishSize;
        if (f1.x < -fishSize) f1.x = width + fishSize;

        ctx.save();
        ctx.translate(f1.x, f1.y);
        if (f1.dir === -1) ctx.scale(-1, 1);
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
