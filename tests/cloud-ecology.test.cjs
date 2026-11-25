const test = require('node:test');
const assert = require('node:assert/strict');
const {ecology, cloud, state, social} = require('./helpers.cjs');

test('weather is deterministic from elapsed game time', () => {
  assert.equal(ecology.current(state({elapsed: 0})), 'sun');
  assert.equal(ecology.current(state({elapsed: ecology.PERIOD})), 'rain');
});

test('invalid nursery state is discarded without damaging clouds', () => {
  const ranch = state({nest: {id: 2, type: 'happy', parents: [1, 99], remaining: 30}});
  ecology.normalize(ranch);
  assert.equal(ranch.nest, null);
  assert.equal(ranch.clouds.length, 1);
});

test('related clouds are not eligible to form a nest', () => {
  const parent = cloud(1, {parents: []});
  const child = cloud(2, {parents: [1]});
  const ranch = state({clouds: [parent, child], water: 24});
  const relation = social.normalize({affinity: 80});
  assert.equal(ecology.eligible(ranch, parent, child, relation), '近亲云朵不能共同育云');
});

test('nest start consumes resources and creates a unique next id', () => {
  const a = cloud(1), b = cloud(2);
  const ranch = state({clouds: [a, b], water: 24, nextId: 3});
  const relation = social.normalize({affinity: 80});
  assert.equal(ecology.start(ranch, a, b, relation, 0.25), true);
  assert.equal(ranch.water, 18);
  assert.equal(ranch.nest.id, 3);
});

test('牧场日数由模拟时间决定，不能通过反复切换昼夜刷取', () => {
  assert.equal(ecology.dayAt(0), 1);
  assert.equal(ecology.dayAt(ecology.DAY_LENGTH - 1), 1);
  assert.equal(ecology.dayAt(ecology.DAY_LENGTH), 2);
  assert.equal(ecology.dayAt(ecology.DAY_LENGTH * 3), 4);
});