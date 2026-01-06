import { useEffect, useRef } from 'react';

// --- 型定義 ---
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

// 新しく追加: 水草のデータ構造
interface Weed {
  x: number;      // 生える位置
  height: number; // 高さ
  width: number;  // 太さ
  phase: number;  // 揺れのタイミング
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
    const weeds: Weed[] = []; // 水草の配列
    const imageNames = ['fish1.png', 'fish2.png', 'fish3.png', 'fish4.png', 'fish5.png', 'fish6.png'];

    // 1. お魚の初期化 (既存)
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}${imageNames[i % imageNames.length]}`;
      const baseY = Math.random() * (height - 100); // 砂に埋もれすぎないように調整
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

    // 2. 泡の初期化 (既存)
    const bubbleCount = Math.max(10, count * 1.5); 
    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 3,
        speed: 0.3 + Math.random() * 0.7,
        offset: Math.random() * 100
      });
    }

    // 3. 水草の初期化 (新規)
    // 画面幅に合わせて適度な本数を生やす (例: 150pxごとに1本くらい)
    const weedCount = Math.floor(width / 150) + 2;
    for (let i = 0; i < weedCount; i++) {
      weeds.push({
        x: (width / weedCount) * i + Math.random() * 50, // 均等配置＋ランダムなズレ
        height: 150 + Math.random() * 150, // 高さは150~300px
        width: 15 + Math.random() * 10,    // 太さは15~25px
        phase: Math.random() * Math.PI * 2
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      
      // --- レイヤー1: 背景色 ---
      ctx.fillStyle = '#004466';
      ctx.fillRect(0, 0, width, height);

      // --- レイヤー2: 海底の砂 (新規) ---
      const sandHeight = Math.min(150, height * 0.25); // 高すぎないように制限
      const sandY = height - sandHeight;
      // グラデーションを作成 (上は明るく、下は暗く)
      const sandGradient = ctx.createLinearGradient(0, sandY, 0, height);
      sandGradient.addColorStop(0, '#d4c6a0'); // 明るい砂色
      sandGradient.addColorStop(1, '#a89a78'); // 暗い砂色
      ctx.fillStyle = sandGradient;
      ctx.fillRect(0, sandY, width, sandHeight);

      // --- レイヤー3: ゆらゆら水草 (新規) ---
      ctx.fillStyle = '#4f772d'; // 深緑色
      weeds.forEach(w => {
        // 先端の揺れ幅を計算
        const tipSway = Math.sin(time + w.phase) * 20;
        
        ctx.beginPath();
        // 根元からスタート
        ctx.moveTo(w.x - w.width / 2, height);
        
        // 左側のカーブを描く (ベジェ曲線)
        // 制御点(中間)も少し揺らすことで、より自然な動きに
        ctx.quadraticCurveTo(
          w.x - w.width / 2 + tipSway * 0.5, height - w.height / 2, 
          w.x + tipSway, height - w.height
        );
        
        // 右側のカーブを描いて戻る
        ctx.quadraticCurveTo(
          w.x + w.width / 2 + tipSway * 0.5, height - w.height / 2,
          w.x + w.width / 2, height
        );
        ctx.closePath();
        ctx.fill();
      });

      // --- レイヤー4: 泡 (既存) ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      bubbles.forEach(b => {
        b.y -= b.speed;
        const xShake = Math.sin(time + b.offset) * 3;
        ctx.beginPath();
        ctx.arc(b.x + xShake, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
        if (b.y < -20) { b.y = height + 20; b.x = Math.random() * width; }
      });

      // --- レイヤー5: お魚 (既存) ---
      fishes.forEach((f1, i) => {
        // (回避ロジックは省略せず維持)
        let yPush = 0; let xPush = 0; const personalSpace = 70;
        fishes.forEach((f2, j) => {
          if (i === j) return;
          const dx = f1.x - f2.x; const dy = f1.y - f2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < personalSpace) {
            yPush += (dy > 0 ? 1 : -1) * (personalSpace - dist) * 0.04;
            const isAhead = (f1.dir > 0 && dx < 0) || (f1.dir < 0 && dx > 0);
            xPush += isAhead ? -0.15 : 0.15;
          }
        });
        f1.offsetY = f1.offsetY * 0.96 + yPush;
        const currentSpeed = f1.speed + xPush;
        f1.x += Math.max(0.2, currentSpeed) * f1.dir;
        const wave = Math.sin(time + f1.phase) * 15;
        f1.y = f1.baseY + wave + f1.offsetY;
        if (f1.x > width + 100) f1.x = -100;
        if (f1.x < -100) f1.x = width + 100;

        ctx.save();
        ctx.translate(f1.x, f1.y);
        if (f1.dir === -1) ctx.scale(-1, 1);
        if (f1.image.complete) ctx.drawImage(f1.image, -30, -30, 60, 60);
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
