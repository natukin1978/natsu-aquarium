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

export const Aquarium = ({ width, height }: { width: number; height: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const fishes: Fish[] = [];
    const bubbles: Bubble[] = [];
    const imageNames = ['fish1.png', 'fish2.png', 'fish3.png', 'fish4.png', 'fish5.png', 'fish6.png'];

    // 1. お魚の初期化
    for (let i = 0; i < 12; i++) {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}${imageNames[i % imageNames.length]}`;
      const baseY = Math.random() * height;
      fishes.push({
        x: Math.random() * width,
        y: baseY,
        baseY: baseY,
        speed: 0.4 + Math.random() * 0.6,
        dir: Math.random() > 0.5 ? 1 : -1,
        image: img,
        phase: Math.random() * Math.PI * 2,
        offsetY: 0
      });
    }

    // 2. 泡の初期化
    for (let i = 0; i < 20; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 3,
        speed: 0.3 + Math.random() * 0.7,
        offset: Math.random() * 100
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      
      // 背景描画
      ctx.fillStyle = '#004466';
      ctx.fillRect(0, 0, width, height);

      // --- 泡の描画と更新 ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      bubbles.forEach(b => {
        b.y -= b.speed;
        const xShake = Math.sin(time + b.offset) * 3;
        
        ctx.beginPath();
        ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();

        if (b.y < -20) {
          b.y = height + 20;
          b.x = Math.random() * width;
        }
      });

      // --- お魚の描画と更新 ---
      fishes.forEach((f1, i) => {
        // 重なり防止（分離ロジック）
        let yPush = 0;
        let xPush = 0;
        const personalSpace = 70;

        fishes.forEach((f2, j) => {
          if (i === j) return;
          const dx = f1.x - f2.x;
          const dy = f1.y - f2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < personalSpace) {
            yPush += (dy > 0 ? 1 : -1) * (personalSpace - dist) * 0.04;
            const isAhead = (f1.dir > 0 && dx < 0) || (f1.dir < 0 && dx > 0);
            xPush += isAhead ? -0.15 : 0.15;
          }
        });

        // 動きの計算
        f1.offsetY = f1.offsetY * 0.96 + yPush;
        const currentSpeed = f1.speed + xPush;
        f1.x += Math.max(0.2, currentSpeed) * f1.dir;
        
        const wave = Math.sin(time + f1.phase) * 15;
        f1.y = f1.baseY + wave + f1.offsetY;

        // ループ処理
        if (f1.x > width + 100) f1.x = -100;
        if (f1.x < -100) f1.x = width + 100;

        // お魚の描画
        ctx.save();
        ctx.translate(f1.x, f1.y);
        if (f1.dir === -1) ctx.scale(-1, 1);
        if (f1.image.complete) {
          ctx.drawImage(f1.image, -30, -30, 60, 60);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height]);

  return (
    <div style={{ backgroundColor: '#111', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={{ display: 'block', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} 
      />
    </div>
  );
};
