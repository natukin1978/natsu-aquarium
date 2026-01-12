export type FishType = 'Swimmers' | 'Drifters' | 'Crawlers';

export interface Fish {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  speed: number;
  dir: number;
  image: HTMLImageElement;
  aspectRatio: number;
  phase: number;
  phaseX: number;
  offsetY: number;
  type: FishType;
  driftRadius: number;
}

export interface Decor {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  isForeground: boolean;
}

export interface Bubble { x: number; y: number; size: number; speed: number; offset: number; }
export interface Weed { x: number; targetHeight: number; widthRatio: number; phase: number; }

export interface SandDetail {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

export interface BubbleEmitter {
  x: number;
  startTime: number;
  duration: number;
  isFinished: boolean;
}

export interface MarineSnow {
  x: number;
  y: number;
  size: number;
  speed: number;
  amplitude: number; // 左右の揺れ幅
  phase: number;     // 揺れのタイミング
}
