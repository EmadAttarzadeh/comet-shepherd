// The shepherd skiff: a small sailboat of light that the player steers.
// It accelerates quickly, drifts a little, and can dash in a burst. The
// dash is both the fastest way across the sky and the strongest push a
// comet can get, so spending it well is the core skill of the game.

import { RUN, VIEW_H, VIEW_W } from './config.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = VIEW_W / 2;
    this.y = VIEW_H / 2 + 170;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2;
    this.radius = 17;
    this.dashLeft = 0;
    this.dashCd = 0;
    this.dashDirX = 0;
    this.dashDirY = -1;
    this.pulseCd = 0;
    this.pulseFlash = 0;
    this.thrust = 0;
  }

  get dashing() {
    return this.dashLeft > 0;
  }

  get dashReady() {
    return this.dashCd <= 0;
  }

  get pulseReady() {
    return this.pulseCd <= 0;
  }

  tryDash(targetX, targetY, mods) {
    if (!this.dashReady) return false;
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    const len = Math.hypot(dx, dy);
    if (len < 4) {
      dx = this.dashDirX;
      dy = this.dashDirY;
    } else {
      dx /= len;
      dy /= len;
    }
    this.dashDirX = dx;
    this.dashDirY = dy;
    this.dashLeft = RUN.dashTime;
    this.dashCd = RUN.dashCooldown * mods.dashCdMul;
    this.vx = dx * RUN.dashSpeed;
    this.vy = dy * RUN.dashSpeed;
    return true;
  }

  tryPulse(mods) {
    if (!this.pulseReady) return false;
    this.pulseCd = RUN.pulseCooldown;
    this.pulseFlash = 0.35;
    return true;
  }

  update(dt, input, mods) {
    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.pulseCd > 0) this.pulseCd -= dt;
    if (this.pulseFlash > 0) this.pulseFlash -= dt;

    if (this.dashLeft > 0) {
      this.dashLeft -= dt;
      this.thrust = 1;
    } else {
      const axis = input.axis();
      const accel = RUN.shipAccel * mods.speedMul;
      this.vx += axis.x * accel * dt;
      this.vy += axis.y * accel * dt;
      const drag = Math.max(0, 1 - RUN.shipDrag * dt);
      this.vx *= drag;
      this.vy *= drag;
      const max = RUN.shipMaxSpeed * mods.speedMul;
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > max) {
        this.vx = (this.vx / speed) * max;
        this.vy = (this.vy / speed) * max;
      }
      this.thrust = axis.x !== 0 || axis.y !== 0 ? 1 : Math.max(0, this.thrust - dt * 4);
      if (speed > 30) {
        this.dashDirX = this.vx / speed;
        this.dashDirY = this.vy / speed;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Keep the skiff inside the sky, with a soft bounce at the walls.
    if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx) * 0.4; }
    if (this.x > VIEW_W - this.radius) { this.x = VIEW_W - this.radius; this.vx = -Math.abs(this.vx) * 0.4; }
    if (this.y < this.radius + 26) { this.y = this.radius + 26; this.vy = Math.abs(this.vy) * 0.4; }
    if (this.y > VIEW_H - this.radius) { this.y = VIEW_H - this.radius; this.vy = -Math.abs(this.vy) * 0.4; }

    const moving = Math.hypot(this.vx, this.vy);
    if (moving > 40) {
      const target = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      let diff = target - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * Math.min(1, dt * 12);
    }
  }

  draw(ctx, time) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1.9, 1.9);
    // Dark halo first: it cuts the skiff out of the star glow behind it,
    // so the boat reads as its own shape instead of melting into the gold.
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
    halo.addColorStop(0, 'rgba(6, 9, 24, 0.78)');
    halo.addColorStop(0.65, 'rgba(6, 9, 24, 0.45)');
    halo.addColorStop(1, 'rgba(6, 9, 24, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.fill();
    // Teal lantern glow: a cool colour against the warm star, so the
    // skiff keeps its own light even when it crosses the star glow.
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 52);
    glow.addColorStop(0, 'rgba(77, 227, 194, 0.5)');
    glow.addColorStop(0.5, 'rgba(77, 227, 194, 0.18)');
    glow.addColorStop(1, 'rgba(77, 227, 194, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fill();
    // Thin bright ring around the halo, for an edge the eye can follow.
    ctx.strokeStyle = 'rgba(255, 242, 184, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(this.angle);
    const bob = Math.sin(time * 3.1) * 1.5;
    ctx.translate(0, bob);
    // Hull: a crescent boat, drawn larger with a bright rim.
    ctx.fillStyle = '#3a4f9e';
    ctx.strokeStyle = '#fff2b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-21, 6);
    ctx.quadraticCurveTo(0, 24, 21, 6);
    ctx.quadraticCurveTo(11, 13, 0, 13);
    ctx.quadraticCurveTo(-11, 13, -21, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Mast and glowing sail, taller and wider than before.
    ctx.strokeStyle = '#e8ecff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -30);
    ctx.stroke();
    const sail = ctx.createLinearGradient(0, -30, 0, 6);
    sail.addColorStop(0, '#ffffff');
    sail.addColorStop(0.55, '#fff6d8');
    sail.addColorStop(1, '#ffb454');
    ctx.fillStyle = sail;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(18, -13, 3, 3);
    ctx.quadraticCurveTo(-3, -11, 0, -30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(77, 227, 194, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // Lantern at the bow, larger with its own bright halo.
    const lanternGlow = ctx.createRadialGradient(0, -34, 1, 0, -34, 13);
    lanternGlow.addColorStop(0, 'rgba(255, 242, 184, 0.9)');
    lanternGlow.addColorStop(1, 'rgba(255, 242, 184, 0)');
    ctx.fillStyle = lanternGlow;
    ctx.beginPath();
    ctx.arc(0, -34, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbe8';
    ctx.beginPath();
    ctx.arc(0, -34, 5.2 + Math.sin(time * 5) * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Wake trail behind the boat. It is always drawn, so the skiff
    // keeps a visible tail even while drifting without thrust, and it
    // brightens while thrusting. Purely visual: it never affects motion.
    const wakeBoost = this.thrust > 0.4 ? 0.25 : 0;
    for (let i = 0; i < 4; i += 1) {
      const wakeY = 24 + i * 10;
      const wakeX = Math.sin(time * 4 + i * 1.3) * 2;
      const wakeR = 4.6 - i * 0.8;
      const wakeA = Math.min(0.95, 0.78 - i * 0.16 + wakeBoost);
      ctx.fillStyle = `rgba(77, 227, 194, ${wakeA})`;
      ctx.beginPath();
      ctx.arc(wakeX, wakeY, wakeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${wakeA * 0.55})`;
      ctx.beginPath();
      ctx.arc(wakeX, wakeY, wakeR * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Pulse ring while it blooms.
    if (this.pulseFlash > 0) {
      const f = 1 - this.pulseFlash / 0.35;
      ctx.save();
      ctx.globalAlpha = (1 - f) * 0.8;
      ctx.strokeStyle = '#4de3c2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 30 + f * 170, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
