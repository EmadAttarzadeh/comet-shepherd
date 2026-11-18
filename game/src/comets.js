// Comets: the things the player shepherds. A comet drifts in a straight
// line until the ship bumps it, a pulse pushes it, or it reaches a gate, the
// home star, or the edge of the sky. Void comets are the danger: dark,
// harmful to the star, and worth banishing off the edge instead.

import { COMET_TYPES, GATE_COLORS, PALETTE, RUN, VIEW_H, VIEW_W } from './config.js';

export const COMET_COLORS = {
  amber: PALETTE.amber,
  teal: PALETTE.teal,
  violet: PALETTE.violet,
  void: PALETTE.voidRim,
};

let nextId = 1;

export function makeComet(rng, wave, settings) {
  const isVoid = rng.chance(settings.voidChance);
  let type = 'normal';
  if (!isVoid) {
    const roll = rng.next();
    if (roll < settings.heavyChance) type = 'heavy';
    else if (roll < settings.heavyChance + settings.swiftChance) type = 'swift';
  } else {
    type = 'void';
  }
  const spec = COMET_TYPES[type];
  const color = isVoid ? 'void' : rng.pick(GATE_COLORS);

  // Spawn on a random edge, away from the gate mouths, drifting toward the
  // middle of the sky with a spread so paths stay varied.
  const edge = rng.int(0, 3);
  let x;
  let y;
  if (edge === 0) { x = rng.range(120, VIEW_W - 120); y = -30; }
  else if (edge === 1) { x = VIEW_W + 30; y = rng.range(120, VIEW_H - 120); }
  else if (edge === 2) { x = rng.range(120, VIEW_W - 120); y = VIEW_H + 30; }
  else { x = -30; y = rng.range(120, VIEW_H - 120); }
  const aimX = VIEW_W / 2 + rng.range(-260, 260);
  const aimY = VIEW_H / 2 + rng.range(-190, 190);
  const dx = aimX - x;
  const dy = aimY - y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = RUN.baseSpeed * spec.speed * settings.speed * rng.range(0.9, 1.15);

  return {
    id: nextId,
    type,
    color,
    x,
    y,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    radius: spec.radius,
    spin: rng.range(0, Math.PI * 2),
    spinSpeed: rng.range(-1.6, 1.6),
    bumpCd: 0,
    trail: [],
  };
}

export function updateComet(comet, dt, timeScale) {
  const step = dt * timeScale;
  comet.x += comet.vx * step;
  comet.y += comet.vy * step;
  comet.spin += comet.spinSpeed * step;
  if (comet.bumpCd > 0) comet.bumpCd -= dt;
  comet.trail.unshift({ x: comet.x, y: comet.y });
  if (comet.trail.length > 14) comet.trail.pop();
}

export function drawComet(ctx, comet) {
  const color = COMET_COLORS[comet.color];
  // Tail: fading circles laid along the recent path.
  for (let i = comet.trail.length - 1; i >= 2; i -= 1) {
    const p = comet.trail[i];
    const f = 1 - i / comet.trail.length;
    ctx.globalAlpha = f * 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, comet.radius * 0.55 * f + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Glow.
  const glow = ctx.createRadialGradient(comet.x, comet.y, 2, comet.x, comet.y, comet.radius * 2.4);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = comet.color === 'void' ? 0.35 : 0.5;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(comet.x, comet.y, comet.radius * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Head.
  ctx.save();
  ctx.translate(comet.x, comet.y);
  ctx.rotate(comet.spin);
  if (comet.color === 'void') {
    ctx.fillStyle = '#232744';
    ctx.beginPath();
    ctx.arc(0, 0, comet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.voidRim;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#0e1126';
    ctx.beginPath();
    ctx.arc(-4, -3, comet.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const head = ctx.createRadialGradient(-5, -6, 2, 0, 0, comet.radius);
    head.addColorStop(0, '#ffffff');
    head.addColorStop(0.35, color);
    head.addColorStop(1, 'rgba(20, 24, 52, 0.9)');
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(0, 0, comet.radius, 0, Math.PI * 2);
    ctx.fill();
    // Craters give each comet a face the eye can follow.
    ctx.fillStyle = 'rgba(20, 24, 52, 0.35)';
    ctx.beginPath();
    ctx.arc(5, 4, comet.radius * 0.28, 0, Math.PI * 2);
    ctx.arc(-7, 6, comet.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    if (comet.type === 'heavy') {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, comet.radius + 3, 0.4, 2.4);
      ctx.stroke();
    }
  }
  ctx.restore();
}
