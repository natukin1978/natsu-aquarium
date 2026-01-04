import { useEffect, useRef } from 'react';

interface Fish {
  x: number;
  y: number;
  speed: number;
  dir: number;
  image: HTMLImageElement;
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

    // 1. お魚の初期化
    imageNames.forEach((name) => {
      const img = new Image();
      img.src = `/${name}`; // publicフォルダの画像
      fishes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1 + Math.random() * 2,
        dir: Math.random() > 0.5 ? 1 : -1,
        image: img
      });
    });

    // 2. 描画ループ
    const render = () => {
      // 背景を塗りつぶす
      ctx.fillStyle = '#006699';
      ctx.fillRect(0, 0, width, height);

      fishes.forEach(fish => {
        // 移動計算
        fish.x += fish.speed * fish.dir;
        if (fish.x > width + 50) fish.x = -50;
        if (fish.x < -50) fish.x = width + 50;

        // 描画
        ctx.save();
        ctx.translate(fish.x, fish.y);
        // 向きに合わせて反転
        if (fish.dir === -1) ctx.scale(-1, 1);
        
        // 画像を描画（画像が読み込まれていない時は四角を描画）
        if (fish.image.complete) {
          ctx.drawImage(fish.image, -25, -25, 50, 50);
        } else {
          ctx.fillStyle = 'orange';
          ctx.fillRect(-10, -10, 20, 20);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ border: '2px solid #fff', borderRadius: '8px' }} 
    />
  );
};
