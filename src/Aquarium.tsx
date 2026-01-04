import { useEffect, useRef } from 'react';

interface Fish {
  x: number;
  y: number;
  baseY: number;   // 基準となる高さ
  speed: number;
  dir: number;
  image: HTMLImageElement;
  phase: number;   // 動きのタイミング（ズレ）を作るための値
}

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  offset: number; // 横揺れのズレ
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
    imageNames.forEach((name) => {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}${name}`;
      const baseY = Math.random() * height;
      fishes.push({
        x: Math.random() * width,
        y: baseY,
        baseY: baseY,
        speed: 0.5 + Math.random() * 1,
        dir: Math.random() > 0.5 ? 1 : -1,
        image: img,
        phase: Math.random() * Math.PI * 2 // 個体ごとに動きのタイミングをズラす
      });
    });

    // 2. 泡の初期化 (20個くらい)
    for (let i = 0; i < 20; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2 + Math.random() * 4,
        speed: 0.5 + Math.random() * 1,
        offset: Math.random() * 100
      });
    }

    let time = 0; // 全体の経過時間

    const render = () => {
      time += 0.02;

      // 背景（少し濃いめの青）
      ctx.fillStyle = '#004466';
      ctx.fillRect(0, 0, width, height);

      // --- 泡の描画と更新 ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      bubbles.forEach(b => {
        b.y -= b.speed;
        // 横にゆらゆらさせる
        const xShake = Math.sin(time + b.offset) * 2;
        
        ctx.beginPath();
        ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();

        // 画面上に出たら下に戻す
        if (b.y < -10) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }
      });

      // --- お魚の描画と更新 ---
      fishes.forEach(fish => {
        // 横移動に緩急をつける
        const speedVar = fish.speed * (1 + Math.sin(time + fish.phase) * 0.3);
        fish.x += speedVar * fish.dir;

        // 上下にふわふわさせる (基準の高さ + サイン波)
        fish.y = fish.baseY + Math.sin(time + fish.phase) * 20;

        if (fish.x > width + 100) fish.x = -100;
        if (fish.x < -100) fish.x = width + 100;

        ctx.save();
        ctx.translate(fish.x, fish.y);
        if (fish.dir === -1) ctx.scale(-1, 1);
        
        if (fish.image.complete) {
          ctx.drawImage(fish.image, -32, -32, 64, 64);
        } else {
          ctx.fillStyle = 'orange';
          ctx.fillRect(-15, -10, 30, 20);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height]);

  return (
    <div style={{ backgroundColor: '#111', padding: '20px', display: 'inline-block' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.5)', display: 'block' }} 
      />
    </div>
  );
};
