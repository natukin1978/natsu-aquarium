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
  const scaleX = 1 - pulse * 0.15;
  const scaleY = 1 + pulse * 0.25;

  const size = height * 0.35; 
  const w = size * f.aspectRatio;
  const h = size;

  ctx.save();
  ctx.translate(f.x, f.y);

  // ★追加：横揺れ(drift)に合わせてわずかに角度をつける（水の抵抗感）
  const tilt = Math.sin(performance.now() * 0.001 + f.phaseX) * 0.1;
  ctx.rotate(tilt);

  ctx.scale(scaleX, scaleY);
  ctx.globalAlpha = 0.6 + (1 - pulse) * 0.2;

  // 中心を軸に描画
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(180, 220, 255, 0.6)';
  ctx.drawImage(f.image, -w / 2, -h / 2, w, h);
  ctx.restore();
};
