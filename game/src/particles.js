// Particles and floating score text: the instant feedback for bumps,
// gate deliveries, pickups and damage. One pool, updated and drawn together.

export class Effects {
  constructor() {
    this.parts = [];
    this.texts = [];
  }

  burst(x, y, color, count, speed, life = 0.7, size = 3.5) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.9);
      this.parts.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: life * (0.6 + Math.random() * 0.7),
        max: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        drag: 2.4,
      });
    }
    if (this.parts.length > 420) this.parts.splice(0, this.parts.length - 420);
  }

  trail(x, y, color, count = 2) {
    for (let i = 0; i < count; i += 1) {
      this.parts.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 0.45,
        max: 0.45,
        size: 2.5 + Math.random() * 2,
        color,
        drag: 1,
      });
    }
  }

  ring(x, y, color, count = 26) {
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      this.parts.push({
        x, y,
        vx: Math.cos(angle) * 260,
        vy: Math.sin(angle) * 260,
        life: 0.5,
        max: 0.5,
        size: 3,
        color,
        drag: 3.2,
      });
    }
  }

  addText(x, y, text, color, size = 22) {
    this.texts.push({ x, y, text, color, size, life: 1.15, max: 1.15 });
    if (this.texts.length > 24) this.texts.shift();
  }

  update(dt) {
    for (const p of this.parts) {
      p.life -= dt;
      const drag = Math.max(0, 1 - p.drag * dt);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 42 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const a = Math.max(0, Math.min(1, t.life / t.max * 1.6));
      ctx.globalAlpha = a;
      ctx.font = `bold ${t.size}px 'Trebuchet MS', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  clear() {
    this.parts = [];
    this.texts = [];
  }
}
