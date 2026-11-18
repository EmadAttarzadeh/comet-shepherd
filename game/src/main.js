// Comet Shepherd: boot, frame loop and click routing. The world owns the
// rules, the renderer owns the picture; this file only wires them together
// with input, audio and the browser window.

import { VIEW_H, VIEW_W } from './config.js';
import { Input, pointInRect } from './input.js';
import { AudioEngine } from './audio.js';
import { Effects } from './particles.js';
import { World } from './world.js';
import {
  CARD_RECTS,
  MUTE_RECT,
  PAUSE_BTN_RECT,
  PAUSE_RESTART_RECT,
  RESUME_RECT,
  RESTART_RECT,
  START_RECT,
  drawScene,
} from './render.js';
import { applyStaging } from './staging.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const audio = new AudioEngine();
const effects = new Effects();
const world = new World(audio, effects);
const input = new Input(canvas);

let muted = false;
let lastFrame = performance.now();

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function startRun() {
  audio.ensure();
  audio.startMusic();
  world.newRun();
  announce('A new watch begins. Wave 1.');
}

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function toggleMute() {
  muted = !muted;
  audio.setMuted(muted);
}

function handleClicks() {
  for (const click of input.takeClicks()) {
    audio.ensure();
    if (world.state === 'title') {
      if (pointInRect(click.x, click.y, START_RECT)) {
        audio.click();
        startRun();
      }
      continue;
    }
    if (world.state === 'won' || world.state === 'lost') {
      if (pointInRect(click.x, click.y, RESTART_RECT)) {
        audio.click();
        startRun();
      }
      continue;
    }
    if (world.state === 'choice') {
      for (let i = 0; i < CARD_RECTS.length; i += 1) {
        if (pointInRect(click.x, click.y, CARD_RECTS[i])) {
          world.chooseUpgrade(i);
          announce(`Blessing chosen. Wave ${world.wave}.`);
        }
      }
      continue;
    }
    if (world.state === 'paused') {
      if (pointInRect(click.x, click.y, RESUME_RECT)) {
        audio.click();
        world.togglePause();
      } else if (pointInRect(click.x, click.y, PAUSE_RESTART_RECT)) {
        audio.click();
        startRun();
      }
      continue;
    }
    if (world.state === 'playing') {
      if (pointInRect(click.x, click.y, MUTE_RECT)) {
        toggleMute();
        continue;
      }
      if (pointInRect(click.x, click.y, PAUSE_BTN_RECT)) {
        audio.click();
        world.togglePause();
        continue;
      }
      world.tryDashAt(click.x, click.y);
    }
  }
}

function handleKeys() {
  if (input.wasPressed('KeyM')) toggleMute();
  if (input.wasPressed('Enter') || input.wasPressed('NumpadEnter')) {
    if (world.state === 'title') {
      audio.ensure();
      startRun();
    }
  }
  if (input.wasPressed('Space') && world.state === 'title') {
    audio.ensure();
    startRun();
    // The same press must not also fire the pulse in the new run.
    input.pressed.delete('Space');
  }
  if (input.wasPressed('KeyR')) {
    if (world.state === 'won' || world.state === 'lost' || world.state === 'paused') {
      audio.ensure();
      startRun();
    }
  }
  if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
    if (world.state === 'playing' || world.state === 'paused') {
      audio.click();
      world.togglePause();
    }
  }
  if (world.state === 'choice') {
    if (input.wasPressed('Digit1')) world.chooseUpgrade(0);
    if (input.wasPressed('Digit2')) world.chooseUpgrade(1);
    if (input.wasPressed('Digit3')) world.chooseUpgrade(2);
  }
  // Any key on the title screen wakes audio so the first notes are ready.
  if (input.pressed.size > 0) audio.ensure();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && world.state === 'playing') world.togglePause();
});

applyStaging(world);

// A handle for automated play-testing: the state is readable, nothing here
// changes how the game plays.
window.__cometShepherd = { world, input, audio };

function frame(now) {
  const dt = Math.min(0.033, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  handleKeys();
  handleClicks();
  world.tick(dt, input);
  if (world.state !== 'paused') audio.update();
  drawScene(ctx, world, input, muted);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
