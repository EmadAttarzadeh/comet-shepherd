// Keyboard and mouse input, translated into game coordinates. The canvas is
// drawn at a fixed logical size and scaled by CSS, so pointer positions are
// mapped through the canvas bounding box before anything else sees them.

import { VIEW_H, VIEW_W } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.mouse = { x: VIEW_W / 2, y: VIEW_H / 2, held: false };
    this.clicks = [];
    this.enabled = true;

    window.addEventListener('keydown', (event) => {
      if (!this.enabled) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.down.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.down.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.down.clear();
      this.mouse.held = false;
    });
    canvas.addEventListener('pointermove', (event) => {
      this.mouse.x = this.toGameX(event);
      this.mouse.y = this.toGameY(event);
    });
    canvas.addEventListener('pointerdown', (event) => {
      this.mouse.x = this.toGameX(event);
      this.mouse.y = this.toGameY(event);
      this.mouse.held = true;
      this.clicks.push({ x: this.mouse.x, y: this.mouse.y });
    });
    window.addEventListener('pointerup', () => {
      this.mouse.held = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  toGameX(event) {
    const rect = this.canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * VIEW_W;
  }

  toGameY(event) {
    const rect = this.canvas.getBoundingClientRect();
    return ((event.clientY - rect.top) / rect.height) * VIEW_H;
  }

  // Normalised movement direction from WASD or arrow keys.
  axis() {
    let x = 0;
    let y = 0;
    if (this.down.has('ArrowLeft') || this.down.has('KeyA')) x -= 1;
    if (this.down.has('ArrowRight') || this.down.has('KeyD')) x += 1;
    if (this.down.has('ArrowUp') || this.down.has('KeyW')) y -= 1;
    if (this.down.has('ArrowDown') || this.down.has('KeyS')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  hasAxis() {
    const a = this.axis();
    return a.x !== 0 || a.y !== 0;
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  takeClicks() {
    const out = this.clicks;
    this.clicks = [];
    return out;
  }

  endFrame() {
    this.pressed.clear();
  }
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
