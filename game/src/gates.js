// The three gates: glowing mouths on the edges of the sky. A comet that
// enters the gate of its own colour scores big and builds the combo; the
// wrong gate scores little and breaks it. Void comets banished through any
// gate are simply gone, which is a win of its own.

import { PALETTE, VIEW_H, VIEW_W } from './config.js';
import { COMET_COLORS } from './comets.js';

export const GATES = [
  { id: 'amber', color: 'amber', label: 'AMBER GATE', x: 540, y: VIEW_H - 30, w: 200, h: 30, edge: 'bottom' },
  { id: 'teal', color: 'teal', label: 'TEAL GATE', x: 0, y: 290, w: 30, h: 140, edge: 'left' },
  { id: 'violet', color: 'violet', label: 'VIOLET GATE', x: VIEW_W - 30, y: 290, w: 30, h: 140, edge: 'right' },
];

export function gateAt(x, y) {
  for (const gate of GATES) {
    if (x >= gate.x && x <= gate.x + gate.w && y >= gate.y && y <= gate.y + gate.h) {
      return gate;
    }
  }
  return null;
}

export function drawGateSymbol(ctx, gate, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  if (gate.color === 'amber') {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.8, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.8, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (gate.color === 'teal') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const a2 = a + Math.PI / 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size);
      ctx.lineTo(Math.cos(a2) * size * 0.45, Math.sin(a2) * size * 0.45);
      ctx.lineTo(Math.cos(a + (Math.PI * 2) / 5) * size, Math.sin(a + (Math.PI * 2) / 5) * size);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGates(ctx, time, flashes, showLabels = true) {
  for (const gate of GATES) {
    const color = COMET_COLORS[gate.color];
    const flash = flashes[gate.id] || 0;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + gate.x);
    ctx.save();
    // Glow field spilling into the sky.
    const cx = gate.x + gate.w / 2;
    const cy = gate.y + gate.h / 2;
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 130);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.28 + pulse * 0.12 + flash * 0.5;
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 130, cy - 130, 260, 260);
    ctx.globalAlpha = 1;
    // Mouth.
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    if (gate.edge === 'bottom') ctx.fillRect(gate.x + 8, gate.y + 1, gate.w - 16, 4);
    if (gate.edge === 'left') ctx.fillRect(gate.x + gate.w - 5, gate.y + 8, 4, gate.h - 16);
    if (gate.edge === 'right') ctx.fillRect(gate.x + 1, gate.y + 8, 4, gate.h - 16);
    // Symbol and label just inside the sky.
    if (showLabels) {
      const symX = gate.edge === 'left' ? 58 : gate.edge === 'right' ? VIEW_W - 58 : cx;
      const symY = gate.edge === 'bottom' ? VIEW_H - 78 : cy;
      drawGateSymbol(ctx, gate, symX, symY, 15, color);
      ctx.font = "bold 12px 'Trebuchet MS', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.ink;
      ctx.globalAlpha = 0.85;
      const labelX = gate.edge === 'left' ? 78 : gate.edge === 'right' ? VIEW_W - 78 : cx;
      const labelY = gate.edge === 'bottom' ? VIEW_H - 104 : cy + 52;
      ctx.fillText(gate.label, labelX, labelY);
    }
    ctx.restore();
  }
}
