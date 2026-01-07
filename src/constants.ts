import type { FishType } from './types';

export const FISH_ASSETS: Record<FishType, string[]> = {
  Swimmers: ['fish1.png', 'fish2.png', 'fish3.png', 'fish4.png', 'fish5.png', 'fish6.png'],
  Drifters: ['fish7.png', 'fish8.png'],
  Crawlers: ['fish9.png'],
};

export const CONFIG = {
  SWIMMER: { MIN_SPEED: 0.2, MAX_SPEED: 0.5, SIZE_RATIO: 0.25, WAVE_AMP: 0.03 },
  DRIFTER: { MIN_SPEED: 0.05, MAX_SPEED: 0.15, SIZE_RATIO: 0.2, RADIUS_BASE: 10 },
  CRAWLER: { SPEED: 0.1, SIZE_RATIO: 0.15, WIGGLE: 2 },
  COMMON: { AVOID_FACTOR: 0.03, PERSONAL_SPACE: 1.1, FRICTION: 0.96 },
  ENVIRONMENT: { SAND_RATIO: 0.2, BUBBLE_SPEED_MIN: 0.2, BUBBLE_SPEED_MAX: 0.4, TIME_STEP: 0.008 }
};
