// Blessings: the choice offered after each cleared wave. Three are drawn
// at random and the player keeps one for the rest of the run. Each one
// changes how the next waves are played, so the choice is the run's
// strategy, not a decoration.

export const UPGRADES = [
  {
    id: 'swift',
    title: 'Swift Sails',
    desc: 'The skiff sails 18% faster. Reach stray comets before they drift away.',
    apply(mods) { mods.speedMul *= 1.18; },
  },
  {
    id: 'longdash',
    title: 'Long Dash',
    desc: 'Dash returns 30% sooner. Dash more, and push comets harder, more often.',
    apply(mods) { mods.dashCdMul *= 0.7; },
  },
  {
    id: 'widepulse',
    title: 'Wide Pulse',
    desc: 'The pulse reaches 40% further and pushes comets harder.',
    apply(mods) { mods.pulseMul *= 1.4; },
  },
  {
    id: 'sturdy',
    title: 'Sturdy Star',
    desc: 'The home star gains a heart, up to five. Room for one more mistake.',
    apply(mods, world) { world.hearts = Math.min(world.maxHearts, world.hearts + 1); },
  },
  {
    id: 'gentle',
    title: 'Gentle Hands',
    desc: 'Bumps push comets 25% harder. Heavy comets finally listen.',
    apply(mods) { mods.pushMul *= 1.25; },
  },
  {
    id: 'keeper',
    title: 'Combo Keeper',
    desc: 'The first miss of each wave no longer breaks the combo.',
    apply(mods) { mods.comboKeeper = true; },
  },
  {
    id: 'magnet',
    title: 'Star Magnet',
    desc: 'Starlight orbs drift toward the skiff from far away.',
    apply(mods) { mods.magnet = true; },
  },
  {
    id: 'secondwind',
    title: 'Second Wind',
    desc: 'A shield forms around the star at once, absorbing the next void hit.',
    apply(mods, world) { world.shield = true; },
  },
];

export function defaultMods() {
  return {
    speedMul: 1,
    dashCdMul: 1,
    pulseMul: 1,
    pushMul: 1,
    comboKeeper: false,
    magnet: false,
  };
}

export function rollChoices(rng, count = 3) {
  return rng.shuffle(UPGRADES).slice(0, count);
}
