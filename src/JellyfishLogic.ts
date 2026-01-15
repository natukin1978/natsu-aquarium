import type { Fish } from './types';

/**
 * くらげの拍動と移動の計算
 */
export const updateJellyfish = (f: Fish, time: number) => {
  // 拍動リズム（閉じるのは速く、開くのはゆっくり）
  const pulse = Math.pow(Math.sin(time * 0.8 + f.phase), 2);
  f.pulse = pulse; // 描画で使うために保持

  // 推進力のシミュレーション：傘を閉じた瞬間（pulseが大きい時）に少し上昇
  const propulsion = pulse > 0.85 ? -0.4 : 0.05; 
  f.offsetY = (f.offsetY || 0) + propulsion;
  f.offsetY *= 0.97; // 水の抵抗

  // 横方向のゆらぎ（Driftersのロジックを継承しつつ少し不規則に）
  f.x = f.baseX + Math.sin(time * 0.3 + f.phaseX) * (f.driftRadius || 20);
  f.y = f.baseY + f.offsetY;
};

/**
 * くらげの専用描画
 */
export const drawJellyfish = (ctx: CanvasRenderingContext2D, f: Fish, height: number) => {
  const pulse = f.pulse || 0;
  // 拍動によるスケーリング：閉じると細長く、開くと平べったく
  const scaleX = 1 - pulse * 0.25;
  const scaleY = 1 + pulse * 0.35;

  const size = height * 0.5;
  const w = size * f.aspectRatio;
  const h = size;

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(scaleX, scaleY);
  
  // くらげ特有の半透明感
  ctx.globalAlpha = 0.7 + (1 - pulse) * 0.2;

  // 画像の描画（中心を軸にする）
  ctx.drawImage(f.image, -w / 2, -h / 2, w, h);
  ctx.restore();
};
