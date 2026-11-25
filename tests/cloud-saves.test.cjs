const test = require('node:test');
const assert = require('node:assert/strict');
const {types, ecology, social, saves, cloud, state} = require('./helpers.cjs');
const rules = {types, ecology, social};
const parse = value => saves.parse(JSON.stringify(value), rules);

test('round-trips a valid V1 save', () => {
  const original = state({clouds: [cloud(1), cloud(2, {type: 'sleepy', name: '困困'})], nextId: 3});
  const restored = parse(original);
  assert.equal(restored.clouds.length, 2);
  assert.equal(restored.nextId, 3);
  assert.equal(restored.clouds[1].type, 'sleepy');
});

test('repairs legacy missing fields and invalid scalar values', () => {
  const legacy = state({
    nextId: null, journal: 'not-an-array', relationships: 'broken',
    clouds: [cloud(4, {lastPet: undefined, lastCare: undefined, mood: null, water: 'bad', energy: NaN})]
  });
  const restored = parse(legacy);
  assert.equal(restored.nextId, 5);
  assert.equal(restored.selected, 4);
  assert.equal(restored.journal.length, 1);
  assert.equal(restored.relationships && Object.keys(restored.relationships).length, 0);
  assert.equal(restored.clouds[0].lastPet, 0);
  assert.ok(restored.recoveryWarnings.length > 0);
  assert.equal(restored.clouds[0].mood, 65);
  assert.equal(restored.clouds[0].water, 68);
  assert.equal(restored.clouds[0].energy, 80);
});

test('filters an individually malformed cloud but retains valid cloud progress', () => {
  const mixed = state({clouds: [cloud(1), {id: 2, type: 'not-a-cloud'}, cloud(3, {name: ''})], selected: 2});
  const restored = parse(mixed);
  assert.equal(restored.clouds.length, 2);
  assert.equal(restored.selected, 1);
  assert.equal(restored.clouds[1].name, '棉棉');
  assert.ok(restored.recoveryWarnings.length > 0);
});

test('rejects duplicate ids without replacing the current save', () => {
  const duplicate = state({clouds: [cloud(1), cloud(1)]});
  assert.throws(() => parse(duplicate), /重复或无效/);
});

test('sanitizes relationship keys and preserves valid relationship state', () => {
  const ranch = state({
    clouds: [cloud(1), cloud(2)],
    relationships: {'1:2': {affinity: 80, tension: 5, plays: 2}, '1:99': {affinity: 99}, bad: {affinity: 10}}
  });
  const restored = parse(ranch);
  assert.deepEqual(Object.keys(restored.relationships), ['1:2']);
  assert.equal(restored.relationships['1:2'].affinity, 80);
});

test('normalizes invalid nest and selected id', () => {
  const ranch = state({nest: {id: 1, type: 'happy', parents: [1, 2], remaining: 30}, selected: 999});
  const restored = parse(ranch);
  assert.equal(restored.nest, null);
  assert.equal(restored.selected, 1);
});

test('rejects unsupported versions and oversized payloads', () => {
  assert.throws(() => parse(state({version: 99})), /不支持/);
  assert.throws(() => saves.parse(' '.repeat(saves.MAX_BYTES + 1), rules), /超过/);
});

test('does not overwrite protected unreadable data unless explicitly replaced', () => {
  const values = new Map([['ranch', 'old-corrupt-data']]);
  const storage = {setItem: (key, value) => values.set(key, value)};
  assert.equal(saves.write(storage, 'ranch', state(), 'old-corrupt-data', false), false);
  assert.equal(values.get('ranch'), 'old-corrupt-data');
  assert.equal(saves.write(storage, 'ranch', state(), 'old-corrupt-data', true), true);
  assert.equal(values.get('ranch-unreadable-backup'), 'old-corrupt-data');
  assert.equal(JSON.parse(values.get('ranch')).version, 1);
});

test('propagates storage quota failures without reporting success', () => {
  const storage = {setItem() { throw new Error('quota exceeded'); }};
  assert.throws(() => saves.write(storage, 'ranch', state()), /quota exceeded/);
});

test('limits restored cloud population and removes dangling family references', () => {
  const ranch = state({clouds: [cloud(1, {parents: [99]}), cloud(2), cloud(3), cloud(4), cloud(5), cloud(6), cloud(7)], selected: 7});
  const restored = parse(ranch);
  assert.equal(restored.clouds.length, ecology.MAX);
  assert.equal(restored.selected, 1);
  assert.deepEqual(restored.clouds[0].parents, []);
});

test('rejects ids that leave no safe next identifier', () => {
  const ranch = state({clouds: [cloud(Number.MAX_SAFE_INTEGER - 1)]});
  assert.throws(() => parse(ranch), /安全上限/);
});

test('recovery warnings are not persisted into the public save schema', () => {
  const restored = parse(state({clouds: [cloud(1, {mood: null})]}));
  assert.ok(restored.recoveryWarnings.length > 0);
  assert.equal(Object.keys(restored).includes('recoveryWarnings'), false);
  assert.equal(JSON.stringify(restored).includes('recoveryWarnings'), false);
});

test('preserves millisecond timestamps for pet, care and dew collection cooldowns', () => {
  const timestamp = 1_795_000_000_000;
  const restored = parse(state({
    lastCollect: timestamp,
    clouds: [cloud(1, {lastPet: timestamp, lastCare: timestamp, careCount: 3})]
  }));
  assert.equal(restored.lastCollect, timestamp);
  assert.equal(restored.clouds[0].lastPet, timestamp);
  assert.equal(restored.clouds[0].lastCare, timestamp);
});

test('derives the displayed day from elapsed simulation time', () => {
  const restored = parse(state({day: 999, elapsed: ecology.DAY_LENGTH * 2}));
  assert.equal(restored.day, 3);
});