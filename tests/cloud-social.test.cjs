const test = require('node:test');
const assert = require('node:assert/strict');
const social = require('../src/cloud-social.js');
const brain = require('../src/cloud-brain.js');
const {cloud} = require('./helpers.cjs');

test('relationship keys are stable and symmetric', () => {
  assert.equal(social.key(2, 1), '1:2');
  assert.equal(social.key(1, 2), '1:2');
});

test('normalization clamps malformed relationship values', () => {
  const value = social.normalize({affinity: 500, tension: -5, plays: 2.8, last: 'unknown'});
  assert.deepEqual(value, {affinity: 100, tension: 0, plays: 2, comforts: 0, conflicts: 0, apologies: 0, last: ''});
});

test('successful interaction increases affinity and reduces tension', () => {
  const result = social.apply({affinity: 10, tension: 20}, 'apology');
  assert.equal(result.affinity, 18);
  assert.equal(result.tension, 0);
  assert.equal(result.apologies, 1);
});

test('unready clouds cannot initiate social interaction', () => {
  const sleepy = cloud(1, {rest: true});
  assert.equal(social.propose(sleepy, cloud(2), social.empty(), brain.traits), null);
});