import { useEffect, useRef } from 'react';

interface Fish {
  x: number;
  y: number;
  vx: number; // 横方向の速度
  vy: number; // 縦方向の速度
  image: HTMLImageElement;
  phase: number;
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
    const imageNames = ['fish1.png', 'fish2.png', 'fish3.png', 'fish4.png', 'fish5.png', 'fish6.png'];

    // 1. お魚の初期化 (少し多めの15匹くらいにしてみましょう)
    for (let i = 0; i < 15; i++) {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}${imageNames[i % imageNames.length]}`;
      fishes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2, // -1 ~ 1 のランダムな速度
        vy: (Math.random() - 0.5) * 1,
        image: img,
        phase: Math.random() * Math.PI * 2
      });
    }

    const render = () => {
      ctx.fillStyle = '#004466';
      ctx.fillRect(0, 0, width, height);

      const margin = 50; // 画面端で跳ね返すためのマージン
      const turnSpeed = 0.2; // 端で向きを変える強さ
      const avoidDistance = 40; // 分離（避ける）を開始する距離
      const avoidFactor = 0.05; // 避ける力の強さ

      fishes.forEach(f1 => {
        // --- 分離 (Separation) ロジック ---
        let closeDX = 0;
        let closeDY = 0;

        fishes.forEach(f2 => {
          if (f1 === f2) return; // 自分自身は無視

          const dx = f1.x - f2.x;
          const dy = f1.y - f2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // もし他のお魚が近すぎたら
          if (distance < avoidDistance) {
            closeDX += dx;
            closeDY += dy;
          }
        });

        // 避ける方向に速度を少し加える
        f1.vx += closeDX * avoidFactor;
        f1.vy += closeDY * avoidFactor;

        // --- 画面端での挙動 ---
        if (f1.x < margin) f1.vx += turnSpeed;
        if (f1.x > width - margin) f1.vx -= turnSpeed;
        if (f1.y < margin) f1.vy += turnSpeed;
        if (f1.y > height - margin) f1.vy -= turnSpeed;

        // --- 速度の制限 (速くなりすぎないように) ---
        const speedLimit = 2;
        const currentSpeed = Math.sqrt(f1.vx * f1.vx + f1.vy * f1.vy);
        if (currentSpeed > speedLimit) {
          f1.vx = (f1.vx / currentSpeed) * speedLimit;
          f1.vy = (f1.vy / currentSpeed) * speedLimit;
        }

        // 位置の更新
        f1.x += f1.vx;
        f1.y += f1.vy;

        // --- 描画 ---
        ctx.save();
        ctx.translate(f1.x, f1.y);
        
        // vxの向きに合わせて反転 (右なら正、左なら負)
        if (f1.vx < 0) ctx.scale(-1, 1);
        
        if (f1.image.complete) {
          ctx.drawImage(f1.image, -25, -25, 50, 50);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height]);

  return (
    <div style={{ backgroundColor: '#111', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
};
