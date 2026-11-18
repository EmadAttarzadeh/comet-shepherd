// Everything the player sees: the sky, the star, the gates, the HUD and
// every screen. Layout rectangles for buttons and cards live here too, so
// clicks and drawing always agree about where things are.

import { PALETTE, RUN, STAR, TITLE_FONT, VIEW_H, VIEW_W } from './config.js';
import { makeRng } from './random.js';
import { drawGates } from './gates.js';
import { pointInRect } from './input.js';

export const START_RECT = { x: 490, y: 516, w: 300, h: 64 };
export const RESTART_RECT = { x: 490, y: 552, w: 300, h: 64 };
export const RESUME_RECT = { x: 440, y: 396, w: 180, h: 56 };
export const PAUSE_RESTART_RECT = { x: 660, y: 396, w: 180, h: 56 };
export const CARD_RECTS = [
  { x: 110, y: 246, w: 310, h: 280 },
  { x: 485, y: 246, w: 310, h: 280 },
  { x: 860, y: 246, w: 310, h: 280 },
];
export const MUTE_RECT = { x: 1124, y: 8, w: 44, h: 40 };
export const PAUSE_BTN_RECT = { x: 1176, y: 8, w: 44, h: 40 };

// A fixed starfield, generated once from a seed so the sky is stable.
const STARFIELD = (() => {
  const rng = makeRng(20261115);
  const stars = [];
  for (let i = 0; i < 170; i += 1) {
    stars.push({
      x: rng.range(0, VIEW_W),
      y: rng.range(0, VIEW_H),
      r: rng.range(0.6, 2.1),
      phase: rng.range(0, Math.PI * 2),
      speed: rng.range(0.4, 1.4),
      drift: rng.range(2, 9),
    });
  }
  return stars;
})();

function roundedPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawButton(ctx, rect, label, hovered, primary) {
  ctx.save();
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  if (primary) {
    grad.addColorStop(0, hovered ? '#ffcf7d' : '#ffb454');
    grad.addColorStop(1, '#e07f2e');
  } else {
    grad.addColorStop(0, hovered ? '#2b3a72' : '#22305e');
    grad.addColorStop(1, '#18224a');
  }
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = primary ? '#ffe9bd' : PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = primary ? '#231303' : PALETTE.ink;
  ctx.font = `bold ${rect.h >= 60 ? 26 : 20}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function drawBackground(ctx, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.55, '#0d1330');
  grad.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Two soft nebulae, fixed in place.
  const neb1 = ctx.createRadialGradient(240, 150, 10, 240, 150, 320);
  neb1.addColorStop(0, 'rgba(125, 84, 214, 0.30)');
  neb1.addColorStop(1, 'rgba(125, 84, 214, 0)');
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const neb2 = ctx.createRadialGradient(1040, 560, 10, 1040, 560, 340);
  neb2.addColorStop(0, 'rgba(31, 174, 147, 0.22)');
  neb2.addColorStop(1, 'rgba(31, 174, 147, 0)');
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  for (const star of STARFIELD) {
    const x = (star.x + time * star.drift) % VIEW_W;
    const twinkle = 0.55 + 0.45 * Math.sin(time * star.speed + star.phase);
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHomeStar(ctx, world, time) {
  const pulse = 1 + Math.sin(time * 2.4) * 0.06;
  ctx.save();
  ctx.translate(STAR.x, STAR.y);
  // Rotating rays.
  ctx.save();
  ctx.rotate(time * 0.12);
  ctx.strokeStyle = 'rgba(255, 217, 122, 0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 44);
    ctx.lineTo(Math.cos(a) * 74, Math.sin(a) * 74);
    ctx.stroke();
  }
  ctx.restore();
  // Glow and core.
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 110);
  glow.addColorStop(0, 'rgba(255, 217, 122, 0.75)');
  glow.addColorStop(0.4, 'rgba(255, 180, 84, 0.28)');
  glow.addColorStop(1, 'rgba(255, 180, 84, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 110, 0, Math.PI * 2);
  ctx.fill();
  const core = ctx.createRadialGradient(-6, -8, 2, 0, 0, STAR.core * pulse);
  core.addColorStop(0, '#fffbe8');
  core.addColorStop(0.5, '#ffd97a');
  core.addColorStop(1, '#e07f2e');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, STAR.core * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Surface shimmer.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(-10, -12, 7, 0, Math.PI * 2);
  ctx.fill();
  // Shield ring.
  if (world.shield) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 7]);
    ctx.lineDashOffset = -time * 30;
    ctx.beginPath();
    ctx.arc(0, 0, STAR.touch + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Hit flash.
  if (world.starFlash > 0) {
    ctx.globalAlpha = Math.min(0.8, world.starFlash);
    ctx.fillStyle = '#ff6b7a';
    ctx.beginPath();
    ctx.arc(0, 0, STAR.core * pulse + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -11, 0, -5);
  ctx.bezierCurveTo(6, -11, 9, -3, 0, 5);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#ff6b7a';
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255, 107, 122, 0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.restore();
}

function drawOrbs(ctx, world, time) {
  for (const orb of world.orbs) {
    const fade = orb.life < 3 ? 0.4 + 0.6 * Math.abs(Math.sin(time * 6)) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    const color = orb.kind === 'shield' ? PALETTE.gold : PALETTE.teal;
    const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, 34);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = fade * 0.5;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#101736';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.translate(orb.x, orb.y);
    ctx.fillStyle = color;
    if (orb.kind === 'shield') {
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, -3);
      ctx.lineTo(5, 4);
      ctx.quadraticCurveTo(0, 8, -5, 4);
      ctx.lineTo(-6, -3);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -5);
      ctx.moveTo(0, 0);
      ctx.lineTo(4, 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHud(ctx, world, muted) {
  ctx.save();
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW_W, 56);
  ctx.fillStyle = 'rgba(190, 205, 255, 0.25)';
  ctx.fillRect(0, 56, VIEW_W, 1);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `bold 26px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(`SCORE  ${world.score}`, 24, 37);
  ctx.font = `bold 20px ${TITLE_FONT}`;
  ctx.fillStyle = world.combo >= 2 ? PALETTE.gold : PALETTE.dim;
  ctx.fillText(world.combo >= 2 ? `COMBO x${world.combo}` : 'COMBO x1', 300, 35);

  ctx.textAlign = 'center';
  ctx.font = `bold 20px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(`WAVE ${world.wave} / ${RUN.winWave}`, VIEW_W / 2, 26);
  ctx.font = `14px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(`${world.resolved} of ${world.waveTotal} comets settled`, VIEW_W / 2, 46);

  // Hearts.
  for (let i = 0; i < world.maxHearts; i += 1) {
    drawHeart(ctx, 950 + i * 30, 30, 15, i < world.hearts);
  }
  if (world.shield) {
    ctx.font = `bold 15px ${TITLE_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('SHIELD', 950, 52);
  }

  // Wave progress bar.
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 58, VIEW_W, 5);
  ctx.fillStyle = PALETTE.teal;
  ctx.fillRect(0, 58, VIEW_W * world.waveProgress, 5);

  // Cooldown pips, bottom left.
  const pips = [
    { label: 'DASH  click / shift', ready: world.player.dashReady, frac: 1 - Math.max(0, world.player.dashCd) / (RUN.dashCooldown * world.mods.dashCdMul) },
    { label: 'PULSE  space', ready: world.player.pulseReady, frac: 1 - Math.max(0, world.player.pulseCd) / RUN.pulseCooldown },
  ];
  pips.forEach((pip, i) => {
    const x = 24 + i * 210;
    const y = VIEW_H - 52;
    roundedPath(ctx, x, y, 190, 36, 10);
    ctx.fillStyle = 'rgba(8, 11, 28, 0.72)';
    ctx.fill();
    ctx.strokeStyle = pip.ready ? PALETTE.teal : 'rgba(190, 205, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = pip.ready ? PALETTE.teal : 'rgba(77, 227, 194, 0.35)';
    ctx.fillRect(x + 8, y + 27, 174 * Math.max(0, Math.min(1, pip.frac)), 3);
    ctx.font = `bold 14px ${TITLE_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = pip.ready ? PALETTE.ink : PALETTE.dim;
    ctx.fillText(pip.label, x + 10, y + 21);
  });

  // Hint, bottom right.
  ctx.textAlign = 'right';
  ctx.font = `15px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Bump comets into the gate of their colour. Void comets harm the star.', VIEW_W - 24, VIEW_H - 26);

  // Mute and pause buttons.
  for (const [rect, label] of [[MUTE_RECT, muted ? 'MUTE: OFF' : 'SOUND'], [PAUSE_BTN_RECT, 'II']]) {
    roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, 9);
    ctx.fillStyle = 'rgba(8, 11, 28, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(190, 205, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = `bold ${rect === MUTE_RECT ? 11 : 16}px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 5);
  }
  ctx.restore();
}

function drawTitle(ctx, world, input, time) {
  ctx.save();
  drawHomeStar(ctx, world, time);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 78px ${TITLE_FONT}`;
  ctx.shadowColor = 'rgba(255, 180, 84, 0.5)';
  ctx.shadowBlur = 24;
  ctx.fillText('COMET SHEPHERD', VIEW_W / 2, 128);
  ctx.shadowBlur = 0;
  ctx.font = `italic 26px Georgia, serif`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Guide the falling stars home. Guard the last light.', VIEW_W / 2, 168);

  // How to play panel.
  roundedPath(ctx, 330, 200, 620, 168, 16);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const rows = [
    ['BUMP', 'Steer the skiff into comets to push them where you want.'],
    ['MATCH', 'Each comet belongs in the gate of its own colour.'],
    ['GUARD', 'Dark void comets harm the star. Shove them off the edge.'],
  ];
  ctx.textAlign = 'left';
  rows.forEach((row, i) => {
    const y = 238 + i * 48;
    ctx.font = `bold 18px ${TITLE_FONT}`;
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(row[0], 362, y);
    ctx.font = `18px ${TITLE_FONT}`;
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(row[1], 452, y);
  });

  ctx.textAlign = 'center';
  ctx.font = `17px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Move: WASD / arrows      Dash: click or Shift      Pulse: Space      Pause: P      Mute: M', VIEW_W / 2, 402);
  ctx.fillText(`Clear ${RUN.winWave} waves to complete the constellation.`, VIEW_W / 2, 432);

  const hovered = pointInRect(input.mouse.x, input.mouse.y, START_RECT);
  drawButton(ctx, START_RECT, 'START THE WATCH', hovered, true);
  ctx.font = `17px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(world.best > 0 ? `Best score: ${world.best}` : 'No watch kept yet. The sky is waiting.', VIEW_W / 2, 620);
  ctx.fillText('Press Enter to begin', VIEW_W / 2, 648);
  ctx.restore();
}

function drawChoice(ctx, world, input) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 22, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 44px ${TITLE_FONT}`;
  ctx.fillText('THE WAVE IS CLEAR', VIEW_W / 2, 118);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `22px ${TITLE_FONT}`;
  ctx.fillText('Choose one blessing for the waves ahead', VIEW_W / 2, 156);
  ctx.font = `18px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(`Score ${world.score}   •   Wave ${world.wave} cleared   •   Next: wave ${world.wave + 1}`, VIEW_W / 2, 188);

  world.choice.forEach((upgrade, i) => {
    const rect = CARD_RECTS[i];
    const hovered = pointInRect(input.mouse.x, input.mouse.y, rect);
    roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, 18);
    ctx.fillStyle = hovered ? 'rgba(43, 58, 114, 0.96)' : PALETTE.panel;
    ctx.fill();
    ctx.strokeStyle = hovered ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = hovered ? 3 : 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 18px ${TITLE_FONT}`;
    ctx.fillText(`PRESS ${i + 1}`, rect.x + rect.w / 2, rect.y + 40);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 30px ${TITLE_FONT}`;
    ctx.fillText(upgrade.title, rect.x + rect.w / 2, rect.y + 88);
    ctx.font = `19px ${TITLE_FONT}`;
    ctx.fillStyle = PALETTE.dim;
    const lines = wrapLines(ctx, upgrade.desc, rect.w - 56);
    lines.forEach((line, li) => {
      ctx.fillText(line, rect.x + rect.w / 2, rect.y + 132 + li * 28);
    });
    ctx.fillStyle = PALETTE.teal;
    ctx.font = `bold 16px ${TITLE_FONT}`;
    ctx.fillText('CLICK TO CHOOSE', rect.x + rect.w / 2, rect.y + rect.h - 24);
  });
  ctx.restore();
}

function drawEnd(ctx, world, input, won) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 22, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.gold : PALETTE.danger;
  ctx.font = `bold 52px ${TITLE_FONT}`;
  ctx.fillText(won ? 'THE CONSTELLATION IS COMPLETE' : 'THE STAR HAS FADED', VIEW_W / 2, 138);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `italic 23px Georgia, serif`;
  ctx.fillText(
    won ? 'Every comet found its gate. The sky remembers this watch.'
      : 'The void reached the light. The sky is patient. Try again.',
    VIEW_W / 2,
    180,
  );

  roundedPath(ctx, 390, 224, 500, 240, 16);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const rows = [
    ['Final score', String(world.score)],
    ['Best score', String(world.best)],
    ['Best combo', `x${world.bestCombo}`],
    ['Comets guided', String(world.stats.guided)],
    ['Void banished', String(world.stats.banished)],
    ['Waves faced', String(world.wave)],
  ];
  ctx.textAlign = 'left';
  rows.forEach((row, i) => {
    const y = 262 + i * 36;
    ctx.font = `20px ${TITLE_FONT}`;
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText(row[0], 424, y);
    ctx.textAlign = 'right';
    ctx.font = `bold 20px ${TITLE_FONT}`;
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(row[1], 856, y);
    ctx.textAlign = 'left';
  });

  const hovered = pointInRect(input.mouse.x, input.mouse.y, RESTART_RECT);
  drawButton(ctx, RESTART_RECT, won ? 'KEEP THE WATCH' : 'TRY AGAIN', hovered, true);
  ctx.textAlign = 'center';
  ctx.font = `17px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Press R to restart', VIEW_W / 2, 648);
  ctx.restore();
}

function drawPaused(ctx, input) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 22, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 56px ${TITLE_FONT}`;
  ctx.fillText('PAUSED', VIEW_W / 2, 300);
  ctx.font = `20px ${TITLE_FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('The sky waits for you.', VIEW_W / 2, 340);
  drawButton(ctx, RESUME_RECT, 'RESUME', pointInRect(input.mouse.x, input.mouse.y, RESUME_RECT), true);
  drawButton(ctx, PAUSE_RESTART_RECT, 'RESTART', pointInRect(input.mouse.x, input.mouse.y, PAUSE_RESTART_RECT), false);
  ctx.restore();
}

export function drawScene(ctx, world, input, muted) {
  ctx.save();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  const time = world.time;
  drawBackground(ctx, time);

  // Screen shake on damage: the scene moves, the HUD stays steady.
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 12;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawGates(ctx, time, world.flashes, world.state !== 'title');
  drawHomeStar(ctx, world, time);
  if (world.state !== 'title') {
    drawOrbs(ctx, world, time);
    world.drawComets(ctx);
    world.player.draw(ctx, time);
  }
  world.effects.draw(ctx);
  ctx.restore();

  // Slow-time tint.
  if (world.timeScale < 1 && world.state === 'playing') {
    ctx.save();
    ctx.strokeStyle = 'rgba(77, 227, 194, 0.55)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, VIEW_W - 6, VIEW_H - 6);
    ctx.restore();
  }

  if (world.state === 'title') {
    drawTitle(ctx, world, input, time);
  } else if (world.state === 'choice') {
    drawHud(ctx, world, muted);
    drawChoice(ctx, world, input);
  } else if (world.state === 'won' || world.state === 'lost') {
    drawHud(ctx, world, muted);
    drawEnd(ctx, world, input, world.state === 'won');
  } else {
    drawHud(ctx, world, muted);
    if (world.state === 'paused') drawPaused(ctx, input);
  }
  ctx.restore();
}
