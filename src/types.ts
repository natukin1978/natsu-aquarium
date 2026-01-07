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

export interface Bubble { x: number; y: number; size: number; speed: number; offset: number; }
export interface Weed { x: number; targetHeight: number; widthRatio: number; phase: number; }
