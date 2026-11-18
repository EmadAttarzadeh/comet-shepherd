// Screenshot staging: URL parameters that set the game into a real,
// playable state for captures. Every staged state goes through the same
// code paths as normal play (a run is started, waves are completed, the
// end screen is reached through finish), so the pictures show the game
// itself, not a mock-up. With no parameters the game starts normally on
// its title screen.
//
//   stage=play    a run in progress on wave 2 with comets in the sky
//   stage=choice  the blessing choice after a cleared wave
//   stage=win     the completed-constellation end screen
//   stage=lose    the faded-star end screen
//   seed=<number> overrides the run seed used by stage=play

import { COMET_TYPES, VIEW_H, VIEW_W, waveSettings } from './config.js';
import { makeComet } from './comets.js';
import { rollChoices } from './upgrades.js';

function placeComets(world, count) {
  for (let i = 0; i < count; i += 1) {
    const comet = makeComet(world.rng, world.wave, world.settings);
    // Pull the staged comets into the open sky, drifting toward the star,
    // so the capture shows a lively field rather than an empty one.
    const angle = (i / count) * Math.PI * 2 + 0.6;
    const dist = 240 + (i % 3) * 60;
    comet.x = VIEW_W / 2 + Math.cos(angle) * dist;
    comet.y = VIEW_H / 2 + Math.sin(angle) * dist * 0.62;
    // Orbital drift: sideways around the star, so the staged field stays
    // lively for the capture without piling onto the star.
    comet.vx = -Math.sin(angle) * 52 - Math.cos(angle) * 8;
    comet.vy = Math.cos(angle) * 40 - Math.sin(angle) * 6;
    comet.entered = true;
    comet.trail = [];
    for (let t = 1; t <= 10; t += 1) {
      comet.trail.push({ x: comet.x + comet.vx * 0.03 * t, y: comet.y + comet.vy * 0.03 * t });
    }
    world.comets.push(comet);
  }
}

export function applyStaging(world) {
  const params = new URLSearchParams(window.location.search);
  const stage = params.get('stage');
  if (!stage) return;
  const seed = Number(params.get('seed'));
  const useSeed = Number.isFinite(seed) ? seed : 7;

  if (stage === 'play') {
    world.newRun(useSeed);
    world.wave = 2;
    world.settings = waveSettings(2);
    world.spawned = 5;
    world.resolved = 2;
    world.score = 640;
    world.combo = 3;
    world.bestCombo = 4;
    world.stats.guided = 5;
    world.stats.bumps = 9;
    world.player.x = 420;
    world.player.y = 500;
    world.player.vx = 120;
    world.player.vy = -60;
    placeComets(world, 6);
    world.spawnOrb();
    world.orbs[0].x = 900;
    world.orbs[0].y = 250;
  } else if (stage === 'choice') {
    world.newRun(useSeed);
    world.wave = 2;
    world.settings = waveSettings(2);
    world.resolved = world.settings.total;
    world.score = 1180;
    world.combo = 4;
    world.bestCombo = 5;
    world.stats.guided = 9;
    world.choice = rollChoices(world.rng, 3);
    world.state = 'choice';
  } else if (stage === 'win') {
    world.newRun(useSeed);
    world.wave = 6;
    world.settings = waveSettings(6);
    world.resolved = world.settings.total;
    world.score = 4860;
    world.bestCombo = 7;
    world.stats.guided = 34;
    world.stats.banished = 9;
    world.stats.bumps = 61;
    world.stats.dashes = 18;
    world.finish(true);
  } else if (stage === 'lose') {
    world.newRun(useSeed);
    world.wave = 4;
    world.settings = waveSettings(4);
    world.resolved = world.settings.total;
    world.score = 1930;
    world.bestCombo = 4;
    world.stats.guided = 18;
    world.stats.banished = 4;
    world.hearts = 0;
    world.finish(false);
  }
}

export function cometTypeName(comet) {
  return COMET_TYPES[comet.type] ? comet.type : 'normal';
}
