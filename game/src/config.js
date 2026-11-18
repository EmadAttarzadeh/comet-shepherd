// Tuning, palette and layout for Comet Shepherd. Every number that shapes
// how the game feels lives here so balance can be adjusted in one place.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const STAR = { x: 640, y: 360, core: 34, touch: 56 };

export const PALETTE = {
  skyTop: '#0a0e24',
  skyBottom: '#101a3d',
  ink: '#eef2ff',
  dim: '#aab4dd',
  faint: '#6c78a8',
  amber: '#ffb454',
  amberDeep: '#e07f2e',
  teal: '#4de3c2',
  tealDeep: '#1fae93',
  violet: '#b78cff',
  violetDeep: '#7d54d6',
  void: '#3a3f66',
  voidRim: '#8f7bff',
  danger: '#ff6b7a',
  gold: '#ffd97a',
  panel: 'rgba(10, 14, 36, 0.88)',
  panelEdge: 'rgba(190, 205, 255, 0.35)',
  hud: 'rgba(8, 11, 28, 0.72)',
};

export const GATE_COLORS = ['amber', 'teal', 'violet'];

export const COMET_TYPES = {
  swift: { radius: 13, speed: 1.38, base: 120, push: 1.25 },
  normal: { radius: 17, speed: 1.0, base: 100, push: 1.0 },
  heavy: { radius: 23, speed: 0.78, base: 170, push: 0.62 },
  void: { radius: 18, speed: 1.05, base: 25, push: 0.9 },
};

export const RUN = {
  startHearts: 3,
  maxHearts: 5,
  winWave: 6,
  baseSpeed: 62,
  shipAccel: 2600,
  shipMaxSpeed: 345,
  shipDrag: 4.2,
  dashSpeed: 920,
  dashTime: 0.18,
  dashCooldown: 2.2,
  dashPush: 2.3,
  bumpImpulse: 175,
  pulseRadius: 195,
  pulsePower: 330,
  pulseCooldown: 5.0,
  slowSeconds: 4.0,
  slowFactor: 0.55,
  orbEvery: 17,
  comboStep: 0.25,
  comboCap: 3,
};

// Difficulty for one wave: how many comets, how fast they arrive, how quick
// they drift, and how often a harmful void comet appears.
export function waveSettings(wave) {
  const n = Math.max(1, wave);
  return {
    total: 6 + 2 * n,
    spawnGap: Math.max(1.25, 2.3 - 0.17 * (n - 1)),
    speed: 1 + 0.09 * (n - 1),
    voidChance: Math.min(0.32, 0.1 + 0.045 * (n - 1)),
    heavyChance: Math.min(0.3, 0.06 + 0.05 * (n - 1)),
    swiftChance: Math.min(0.34, 0.14 + 0.04 * (n - 1)),
  };
}

export const TITLE_FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";
export const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";
