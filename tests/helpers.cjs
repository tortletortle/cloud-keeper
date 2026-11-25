const types = {
  happy: ['棉棉'], sleepy: ['困困'], shy: ['桃桃'],
  playful: ['跳跳'], storm: ['雷雷'], rainy: ['滴滴']
};
const ecology = require('../src/cloud-ecology.js');
const social = require('../src/cloud-social.js');
const saves = require('../src/cloud-saves.js');
function cloud(id = 1, overrides = {}) {
  return {
    id, type: 'happy', name: '棉棉', x: 30, y: 70,
    mood: 65, water: 68, energy: 80, rest: false,
    bond: 0, careCount: 0, lastCare: 0, lastPet: 0,
    lastCareKind: '', autoDrinks: 0, growth: ecology.GROW,
    parents: [], lastNest: -10000, ...overrides
  };
}
function state(overrides = {}) {
  return {
    version: 1, nest: null, relationships: {}, water: 24, coins: 15,
    nextId: 2, clouds: [cloud()], day: 1, night: false,
    selected: 1, journal: ['起始记录'], lastCollect: 0, elapsed: 0, sound: true,
    ...overrides
  };
}
module.exports = {types, ecology, social, saves, cloud, state};