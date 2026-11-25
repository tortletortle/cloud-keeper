const test = require('node:test');
const assert = require('node:assert/strict');
const brain = require('../src/cloud-brain.js');
const {cloud} = require('./helpers.cjs');

test('emotion follows need and mood thresholds', () => {
  assert.equal(brain.emotion(cloud(1, {water: 20, mood: 90})), 'thirsty');
  assert.equal(brain.emotion(cloud(1, {mood: 20, type: 'storm'})), 'angry');
  assert.equal(brain.emotion(cloud(1, {mood: 20, type: 'happy'})), 'sad');
  assert.equal(brain.emotion(cloud(1, {rest: true})), 'sleep');
});

test('decision is deterministic for the same input', () => {
  const c = cloud(1, {water: 10, energy: 70});
  assert.deepEqual(brain.decide(c, {stock: 10}), brain.decide(c, {stock: 10}));
  assert.equal(brain.decide(c, {stock: 10}).action, 'drink');
});

test('metabolism returns bounded finite values', () => {
  const result = brain.metabolism(cloud(1, {water: 0, energy: 0, mood: 0}), 'play');
  for (const key of ['water', 'energy', 'mood']) {
    assert.ok(Number.isFinite(result[key]));
    assert.ok(result[key] >= 0 && result[key] <= 100);
  }
});

test('cloud names reject blank/control/overlong values', () => {
  assert.equal(brain.cloudName('  棉棉  '), '棉棉');
  assert.equal(brain.cloudName('  '), null);
  assert.equal(brain.cloudName('坏\n名字'), null);
  assert.equal(brain.cloudName('云'.repeat(21)), null);
});

test('drink cooldown is not confused with an empty water inventory', () => {
  const thirsty = cloud(1, {water: 10, energy: 70});
  assert.equal(brain.decide(thirsty, {stock: 8, drinkCooldown: 5}).action, 'wait');
  assert.equal(brain.decide(thirsty, {stock: 8, drinkCooldown: 0}).action, 'drink');
  assert.equal(brain.decide(thirsty, {stock: 0, drinkCooldown: 0}).action, 'wait');
});

test('browser and CommonJS builds share one CloudKeeper namespace without dropping globals', () => {
  assert.equal(globalThis.CloudKeeper.CloudBrain, brain);
  assert.equal(globalThis.CloudKeeper.CloudSocial, require('../src/cloud-social.js'));
  assert.equal(globalThis.CloudKeeper.CloudEcology, require('../src/cloud-ecology.js'));
  assert.equal(globalThis.CloudKeeper.CloudSaves, require('../src/cloud-saves.js'));
});