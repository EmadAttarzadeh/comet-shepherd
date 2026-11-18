// The world: the run's state, its waves, and every rule that turns bumps
// into scores. The render module draws this state; this module owns it.

import { COMET_TYPES, PALETTE, RUN, STAR, VIEW_H, VIEW_W, waveSettings } from './config.js';
import { COMET_COLORS, drawComet, makeComet, updateComet } from './comets.js';
import { GATES, gateAt } from './gates.js';
import { Player } from './player.js';
import { defaultMods, rollChoices } from './upgrades.js';
import { makeRng, randomSeed } from './random.js';

const BEST_KEY = 'comet-shepherd-best';

export function loadBest() {
  try {
    const value = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch (err) {
    // Private browsing or no storage: the run still counts.
  }
}

export class World {
  constructor(audio, effects) {
    this.audio = audio;
    this.effects = effects;
    this.player = new Player();
    this.state = 'title';
    this.pausedFrom = 'playing';
    this.time = 0;
    this.best = loadBest();
    this.seed = randomSeed();
    this.rng = makeRng(this.seed);
    this.resetRun();
  }

  resetRun() {
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.wave = 1;
    this.hearts = RUN.startHearts;
    this.maxHearts = RUN.maxHearts;
    this.shield = false;
    this.mods = defaultMods();
    this.comets = [];
    this.orbs = [];
    this.spawned = 0;
    this.resolved = 0;
    this.spawnTimer = 0.5;
    this.orbTimer = RUN.orbEvery * 0.6;
    this.slowUntil = 0;
    this.shake = 0;
    this.starFlash = 0;
    this.waveEndTimer = -1;
    this.keeperUsed = false;
    this.choice = [];
    this.settings = waveSettings(1);
    this.stats = { guided: 0, banished: 0, missed: 0, absorbed: 0, bumps: 0, dashes: 0 };
    this.flashes = { amber: 0, teal: 0, violet: 0 };
    this.lastBumpAt = -1;
    this.player.reset();
    this.effects.clear();
  }

  newRun(seed) {
    this.seed = seed === undefined ? randomSeed() : seed;
    this.rng = makeRng(this.seed);
    this.resetRun();
    this.state = 'playing';
    this.startWave(1);
  }

  startWave(n) {
    this.wave = n;
    this.settings = waveSettings(n);
    this.spawned = 0;
    this.resolved = 0;
    this.spawnTimer = 0.4;
    this.waveEndTimer = -1;
    this.keeperUsed = false;
    this.comets = [];
    this.effects.addText(VIEW_W / 2, 200, `WAVE ${n}`, PALETTE.gold, 38);
  }

  get timeScale() {
    return this.time < this.slowUntil ? RUN.slowFactor : 1;
  }

  get waveTotal() {
    return this.settings.total;
  }

  get waveProgress() {
    return this.waveTotal === 0 ? 0 : this.resolved / this.waveTotal;
  }

  togglePause() {
    if (this.state === 'playing') {
      this.pausedFrom = 'playing';
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = this.pausedFrom;
    }
  }

  breakCombo(why) {
    if (this.combo === 0) return;
    if (this.mods.comboKeeper && !this.keeperUsed && why !== 'hurt') {
      this.keeperUsed = true;
      this.effects.addText(VIEW_W / 2, 150, 'Combo kept!', PALETTE.gold, 22);
      return;
    }
    this.combo = 0;
  }

  scoreMatch(comet, gate) {
    const spec = COMET_TYPES[comet.type];
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const mult = Math.min(RUN.comboCap, 1 + RUN.comboStep * (this.combo - 1));
    const points = Math.round(spec.base * mult);
    this.score += points;
    this.stats.guided += 1;
    this.flashes[gate.id] = 1;
    this.effects.burst(comet.x, comet.y, COMET_COLORS[comet.color], 26, 240, 0.8, 4);
    this.effects.addText(comet.x, Math.max(60, comet.y - 20), `+${points}`, COMET_COLORS[comet.color], 26);
    if (this.combo >= 2) {
      this.effects.addText(VIEW_W / 2, 108, `COMBO x${this.combo}`, PALETTE.gold, 26);
    }
    this.audio.gate(GATES.indexOf(gate));
  }

  resolveComet(comet, how, gate) {
    this.resolved += 1;
    if (how === 'match') this.scoreMatch(comet, gate);
    else if (how === 'wrong') {
      this.score += 10;
      this.stats.missed += 1;
      this.breakCombo('wrong');
      this.effects.addText(comet.x, Math.max(60, comet.y - 20), 'Wrong gate +10', PALETTE.dim, 18);
      this.audio.wrongGate();
    } else if (how === 'banish') {
      this.score += 25;
      this.stats.banished += 1;
      this.effects.burst(comet.x, comet.y, PALETTE.voidRim, 18, 200, 0.7, 3.5);
      this.effects.addText(comet.x, Math.max(60, comet.y - 20), 'Banished +25', PALETTE.voidRim, 18);
      this.audio.absorb();
    } else if (how === 'absorb') {
      this.stats.absorbed += 1;
      this.breakCombo('absorb');
      this.starFlash = 0.4;
      this.effects.burst(STAR.x, STAR.y, COMET_COLORS[comet.color], 14, 150, 0.6, 3);
      this.effects.addText(STAR.x, STAR.y - 70, 'Absorbed', PALETTE.dim, 18);
      this.audio.absorb();
    } else if (how === 'drift') {
      this.stats.missed += 1;
      this.breakCombo('drift');
      this.effects.addText(
        Math.max(90, Math.min(VIEW_W - 90, comet.x)),
        Math.max(60, Math.min(VIEW_H - 40, comet.y)),
        'Drifted away',
        PALETTE.dim,
        18,
      );
    }
  }

  damage(comet) {
    this.resolved += 1;
    if (this.shield) {
      this.shield = false;
      this.effects.ring(STAR.x, STAR.y, PALETTE.gold, 30);
      this.effects.addText(STAR.x, STAR.y - 70, 'Shield held!', PALETTE.gold, 22);
      this.audio.shieldBlock();
      return;
    }
    this.hearts -= 1;
    this.breakCombo('hurt');
    this.shake = 0.55;
    this.starFlash = 0.7;
    this.effects.burst(STAR.x, STAR.y, PALETTE.danger, 34, 300, 0.9, 4.5);
    this.audio.hurt();
    if (this.hearts <= 0) {
      this.finish(false);
    }
  }

  finish(won) {
    this.state = won ? 'won' : 'lost';
    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.best);
    }
    if (won) {
      this.audio.win();
      this.effects.burst(STAR.x, STAR.y, PALETTE.gold, 60, 340, 1.4, 4.5);
    } else {
      this.audio.lose();
    }
  }

  chooseUpgrade(index) {
    const upgrade = this.choice[index];
    if (!upgrade) return;
    upgrade.apply(this.mods, this);
    this.effects.addText(VIEW_W / 2, 130, upgrade.title, PALETTE.gold, 26);
    this.audio.click();
    this.choice = [];
    this.state = 'playing';
    this.startWave(this.wave + 1);
  }

  spawnOrb() {
    const kind = this.rng.chance(0.55) ? 'shield' : 'slow';
    const angle = this.rng.range(0, Math.PI * 2);
    const dist = this.rng.range(190, 300);
    this.orbs.push({
      kind,
      x: STAR.x + Math.cos(angle) * dist,
      y: STAR.y + Math.sin(angle) * dist,
      vx: this.rng.range(-14, 14),
      vy: this.rng.range(-14, 14),
      radius: 14,
      life: 14,
      spin: 0,
    });
  }

  collectOrb(orb) {
    if (orb.kind === 'shield') {
      this.shield = true;
      this.effects.addText(orb.x, orb.y - 24, 'Shield up!', PALETTE.gold, 22);
    } else {
      this.slowUntil = this.time + RUN.slowSeconds;
      this.effects.addText(orb.x, orb.y - 24, 'Time slows!', PALETTE.teal, 22);
    }
    this.effects.ring(orb.x, orb.y, orb.kind === 'shield' ? PALETTE.gold : PALETTE.teal, 22);
    this.audio.pickup();
  }

  tryDashAt(x, y) {
    if (this.player.tryDash(x, y, this.mods)) {
      this.stats.dashes += 1;
      this.audio.dash();
      this.effects.trail(this.player.x, this.player.y, PALETTE.teal, 6);
    }
  }

  tryPulse() {
    if (!this.player.tryPulse(this.mods)) return;
    const radius = RUN.pulseRadius * this.mods.pulseMul;
    for (const comet of this.comets) {
      const dx = comet.x - this.player.x;
      const dy = comet.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius || dist < 1) continue;
      const strength = RUN.pulsePower * this.mods.pulseMul * (1.25 - dist / radius);
      comet.vx += (dx / dist) * strength;
      comet.vy += (dy / dist) * strength;
      comet.bumpCd = Math.max(comet.bumpCd, 0.15);
    }
    this.effects.ring(this.player.x, this.player.y, PALETTE.teal, 30);
    this.audio.pulse();
  }

  bumpComets() {
    const p = this.player;
    const pushBase = RUN.bumpImpulse * this.mods.pushMul * (p.dashing ? RUN.dashPush : 1);
    for (const comet of this.comets) {
      if (comet.bumpCd > 0) continue;
      const dx = comet.x - p.x;
      const dy = comet.y - p.y;
      const dist = Math.hypot(dx, dy);
      const touch = comet.radius + p.radius;
      if (dist >= touch || dist < 0.01) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const spec = COMET_TYPES[comet.type];
      const impulse = pushBase * spec.push;
      comet.vx += nx * impulse + p.vx * 0.35 * spec.push;
      comet.vy += ny * impulse + p.vy * 0.35 * spec.push;
      comet.x = p.x + nx * (touch + 1);
      comet.y = p.y + ny * (touch + 1);
      comet.bumpCd = 0.14;
      this.stats.bumps += 1;
      this.effects.burst(comet.x, comet.y, COMET_COLORS[comet.color], 8, 140, 0.45, 3);
      if (this.time - this.lastBumpAt > 0.09) {
        this.lastBumpAt = this.time;
        this.audio.bump();
      }
    }
  }

  separateComets() {
    for (let i = 0; i < this.comets.length; i += 1) {
      for (let j = i + 1; j < this.comets.length; j += 1) {
        const a = this.comets[i];
        const b = this.comets[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const touch = a.radius + b.radius;
        if (dist >= touch || dist < 0.01) continue;
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (touch - dist) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          const push = -rel * 0.5;
          a.vx -= nx * push;
          a.vy -= ny * push;
          b.vx += nx * push;
          b.vy += ny * push;
        }
      }
    }
  }

  updateComets(dt) {
    const scale = this.timeScale;
    const survivors = [];
    for (const comet of this.comets) {
      updateComet(comet, dt, scale);
      // A comet only counts as "in play" once it is well inside the sky,
      // so a fresh spawn crossing a gate mouth on its way in never
      // resolves by accident. Far outside the sky it always resolves,
      // so no comet can drift forever.
      if (!comet.entered && comet.x > 40 && comet.x < VIEW_W - 40 && comet.y > 40 && comet.y < VIEW_H - 40) {
        comet.entered = true;
      }
      if (!comet.entered && (comet.x < -140 || comet.x > VIEW_W + 140 || comet.y < -140 || comet.y > VIEW_H + 140)) {
        if (comet.color === 'void') this.resolveComet(comet, 'banish');
        else this.resolveComet(comet, 'drift');
        continue;
      }
      if (comet.entered) {
        const gate = gateAt(comet.x, comet.y);
        if (gate) {
          if (comet.color === 'void') this.resolveComet(comet, 'banish', gate);
          else if (comet.color === gate.color) this.resolveComet(comet, 'match', gate);
          else this.resolveComet(comet, 'wrong', gate);
          continue;
        }
        const starDist = Math.hypot(comet.x - STAR.x, comet.y - STAR.y);
        if (starDist < STAR.touch + comet.radius * 0.4) {
          if (comet.color === 'void') this.damage(comet);
          else this.resolveComet(comet, 'absorb');
          continue;
        }
        if (comet.x < -60 || comet.x > VIEW_W + 60 || comet.y < -60 || comet.y > VIEW_H + 60) {
          if (comet.color === 'void') this.resolveComet(comet, 'banish');
          else this.resolveComet(comet, 'drift');
          continue;
        }
      }
      survivors.push(comet);
    }
    this.comets = survivors;
  }

  updateOrbs(dt) {
    const p = this.player;
    const survivors = [];
    for (const orb of this.orbs) {
      orb.life -= dt;
      orb.spin += dt * 2;
      if (this.mods.magnet) {
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1 && dist < 420) {
          orb.vx += (dx / dist) * 190 * dt;
          orb.vy += (dy / dist) * 190 * dt;
        }
      }
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      if (orb.x < 30 || orb.x > VIEW_W - 30) orb.vx *= -1;
      if (orb.y < 60 || orb.y > VIEW_H - 30) orb.vy *= -1;
      orb.x = Math.max(24, Math.min(VIEW_W - 24, orb.x));
      orb.y = Math.max(54, Math.min(VIEW_H - 24, orb.y));
      const dist = Math.hypot(orb.x - p.x, orb.y - p.y);
      if (dist < orb.radius + p.radius + 6) {
        this.collectOrb(orb);
        continue;
      }
      if (orb.life > 0) survivors.push(orb);
    }
    this.orbs = survivors;
  }

  tick(dt, input) {
    this.time += dt;
    if (this.state === 'paused') return;
    this.effects.update(dt);
    for (const key of Object.keys(this.flashes)) {
      this.flashes[key] = Math.max(0, this.flashes[key] - dt * 2.2);
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    if (this.starFlash > 0) this.starFlash = Math.max(0, this.starFlash - dt);
    if (this.state !== 'playing') return;

    // Spawning.
    if (this.spawned < this.settings.total) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.comets.push(makeComet(this.rng, this.wave, this.settings));
        this.spawned += 1;
        this.spawnTimer = this.settings.spawnGap * this.rng.range(0.8, 1.2);
      }
    }
    this.orbTimer -= dt;
    if (this.orbTimer <= 0) {
      if (this.orbs.length < 1) this.spawnOrb();
      this.orbTimer = RUN.orbEvery;
    }

    // Player actions.
    if (input.wasPressed('Space')) this.tryPulse();
    if (input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight')) {
      this.tryDashAt(this.player.x + this.player.dashDirX * 120, this.player.y + this.player.dashDirY * 120);
    }
    this.player.update(dt, input, this.mods);
    if (this.player.dashing) {
      this.effects.trail(this.player.x, this.player.y, PALETTE.teal, 2);
    }

    this.bumpComets();
    this.separateComets();
    this.updateComets(dt);
    this.updateOrbs(dt);
    if (this.state !== 'playing') return;

    // Wave completion, with a breath before the choice or the win.
    if (this.spawned >= this.settings.total && this.comets.length === 0) {
      if (this.waveEndTimer < 0) this.waveEndTimer = 0.9;
      this.waveEndTimer -= dt;
      if (this.waveEndTimer <= 0) {
        if (this.wave >= RUN.winWave) {
          this.finish(true);
        } else {
          this.choice = rollChoices(this.rng, 3);
          this.state = 'choice';
          this.audio.waveClear();
        }
      }
    }
  }

  drawComets(ctx) {
    for (const comet of this.comets) drawComet(ctx, comet);
  }
}
