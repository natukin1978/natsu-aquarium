import type { FishType } from './types';

export const FISH_ASSETS: Record<FishType, string[]> = {
  Swimmers: ['fish1.png', 'fish2.png', 'fish3.png', 'fish4.png', 'fish5.png', 'fish6.png', 'fish16.png', 'fish17.png', 'fish18.png', 'fish19.png'],
  Drifters: ['fish7.png', 'fish8.png'],
  Crawlers: ['fish9.png', 'fish10.png', 'fish11.png', 'fish12.png', 'fish13.png', 'fish14.png', 'fish15.png'],
};

export const DECOR_ASSETS = {
  Rocks: ['rock1.png', 'rock2.png', 'rock3.png', 'rock4.png', 'rock5.png', 'rock5.png'],
  Corals: ['coral1.png', 'coral2.png', 'coral3.png'],
  Driftwood: ['wood1.png','wood2.png','wood3.png']
};

// 出現比率の設定
export const FISH_RATIO: Record<FishType, number> = {
  Swimmers: 6,
  Drifters: 1,
  Crawlers: 3,
};

export const CONFIG = {
  SWIMMER: { MIN_SPEED: 0.2, MAX_SPEED: 0.5, SIZE_RATIO: 0.25, WAVE_AMP: 0.03 },
  DRIFTER: { MIN_SPEED: 0.05, MAX_SPEED: 0.15, SIZE_RATIO: 0.15, RADIUS_BASE: 10 },
  CRAWLER: { SPEED: 0.1, SIZE_RATIO: 0.15, WIGGLE: 2 },
  COMMON: { AVOID_FACTOR: 0.03, PERSONAL_SPACE: 1.1, FRICTION: 0.96 },
  ENVIRONMENT: { SAND_RATIO: 0.2, BUBBLE_SPEED_MIN: 0.2, BUBBLE_SPEED_MAX: 0.4, TIME_STEP: 0.008 }
};
