(function (root) {
    'use strict';

    const MAX_BYTES = 128 * 1024;
    const MAX_RESOURCE = 1_000_000;
    const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const isId = value => Number.isSafeInteger(value) && value > 0 && value < Number.MAX_SAFE_INTEGER;
    const isCounter = value => Number.isSafeInteger(value) && value >= 0;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const byteLength = text => typeof TextEncoder === 'function'
        ? new TextEncoder().encode(text).length
        : unescape(encodeURIComponent(text)).length;

    function numberOr(value, fallback, min, max) {
        return typeof value === 'number' && Number.isFinite(value)
            ? clamp(value, min, max)
            : fallback;
    }

    function counterOr(value, fallback = 0) {
        return isCounter(value) ? Math.min(value, MAX_RESOURCE) : fallback;
    }

    function timestampOr(value, fallback = 0) {
        return isCounter(value) ? value : fallback;
    }

    function parse(text, rules) {
        if (typeof text !== 'string' || byteLength(text) > MAX_BYTES) {
            throw new Error('存档文件超过 128 KB 或不是文本。');
        }
        const {types, ecology, social} = rules || {};
        if (!isRecord(types) || !ecology || !Number.isInteger(ecology.MAX) || !social) {
            throw new Error('存档校验规则未正确初始化。');
        }

        const source = JSON.parse(text);
        if (!isRecord(source) || source.version !== 1) {
            throw new Error('不支持此存档格式或版本。');
        }
        if (!Array.isArray(source.clouds) || source.clouds.length === 0) {
            throw new Error('存档中没有可恢复的云朵。');
        }

        const clouds = [];
        const ids = new Set();
        const warnings = [];
        if (source.clouds.length > ecology.MAX) warnings.push('云朵数量超过牧场上限，超出部分未恢复');
        for (let index = 0; index < source.clouds.length && clouds.length < ecology.MAX; index++) {
            const input = source.clouds[index];
            if (!isRecord(input) || !Object.hasOwn(types, input.type)) {
                warnings.push('已跳过无效的云朵记录');
                continue;
            }
            if (!isId(input.id) || ids.has(input.id)) {
                throw new Error('存档中存在重复或无效的云朵编号；原始存档已保留，未覆盖当前进度。');
            }
            if (['x', 'y', 'mood', 'water', 'energy'].some(key => typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < 0 || input[key] > 100)) {
                warnings.push('已修复云朵数值字段');
            }
            if (typeof input.name !== 'string' || !input.name.trim()) warnings.push('已恢复缺失的云朵名称');
            if (['lastPet', 'lastCare', 'careCount', 'autoDrinks'].some(key => !isCounter(input[key]))) warnings.push('已补齐旧存档中的照料记录');
            const typeName = types[input.type]?.[0] || '小云朵';
            const cloud = {
                ...input,
                id: input.id,
                type: input.type,
                name: typeof input.name === 'string' && input.name.trim()
                    ? Array.from(input.name.trim()).slice(0, 20).join('')
                    : typeName,
                x: numberOr(input.x, 50, 0, 100),
                y: numberOr(input.y, 75, 0, 100),
                mood: numberOr(input.mood, 65, 0, 100),
                water: numberOr(input.water, 68, 0, 100),
                energy: numberOr(input.energy, 80, 0, 100),
                rest: input.rest === true,
                bond: numberOr(input.bond, 0, 0, 100),
                careCount: counterOr(input.careCount),
                lastCare: timestampOr(input.lastCare),
                lastPet: timestampOr(input.lastPet),
                autoDrinks: counterOr(input.autoDrinks),
                lastCareKind: typeof input.lastCareKind === 'string' ? input.lastCareKind.slice(0, 32) : '',
                growth: numberOr(input.growth, ecology.GROW, 0, ecology.GROW || 180),
                parents: Array.isArray(input.parents)
                    ? [...new Set(input.parents.filter(parent => isId(parent) && parent !== input.id))].slice(0, 2)
                    : [],
                lastNest: Number.isFinite(input.lastNest) ? input.lastNest : -10000
            };
            ids.add(cloud.id);
            clouds.push(cloud);
        }
        if (clouds.length === 0) throw new Error('存档中的云朵数据均无法恢复。');
        if (clouds.length !== source.clouds.length) warnings.push('部分损坏的云朵记录已隔离，其他云朵进度已保留');
        for (const cloud of clouds) {
            cloud.parents = cloud.parents.filter(parent => ids.has(parent));
        }

        if (!isCounter(source.water) || !isCounter(source.coins)) warnings.push('已修复牧场资源数值');
        if (!Array.isArray(source.journal)) warnings.push('已重建牧场日记列表');
        if (!isRecord(source.relationships)) warnings.push('已重建云朵关系数据');
        if (!isId(source.nextId)) warnings.push('已重新计算云朵编号');
        if (!ids.has(source.selected)) warnings.push('已恢复当前选中的云朵');
        const state = {
            ...source,
            version: 1,
            clouds,
            water: counterOr(source.water, 24),
            coins: counterOr(source.coins, 15),
            day: isId(source.day) ? Math.min(source.day, MAX_RESOURCE) : 1,
            elapsed: timestampOr(source.elapsed),
            lastCollect: timestampOr(source.lastCollect),
            night: source.night === true,
            sound: source.sound !== false,
            selected: ids.has(source.selected) ? source.selected : clouds[0].id,
            journal: Array.isArray(source.journal)
                ? source.journal.filter(entry => typeof entry === 'string').slice(0, 40)
                : ['牧场记录已恢复。'],
            relationships: {}
        };

        const highestCloudId = Math.max(...clouds.map(cloud => cloud.id));
        const nest = source.nest;
        if (isRecord(nest) && isId(nest.id) && nest.id > highestCloudId &&
            Object.hasOwn(types, nest.type) && Array.isArray(nest.parents) && nest.parents.length === 2 &&
            nest.parents.every(id => ids.has(id)) && nest.parents[0] !== nest.parents[1] &&
            Number.isFinite(nest.remaining) && nest.remaining >= 0) {
            state.nest = {
                id: nest.id,
                type: nest.type,
                parents: [...nest.parents],
                remaining: clamp(nest.remaining, 0, ecology.HATCH || 60)
            };
        } else {
            state.nest = null;
        }

        if (isRecord(source.relationships)) {
            state.relationships = Object.fromEntries(Object.entries(source.relationships).flatMap(([key, value]) => {
                const match = /^(\d+):(\d+)$/.exec(key);
                if (!match || !isRecord(value)) return [];
                const [a, b] = match.slice(1).map(Number);
                if (!ids.has(a) || !ids.has(b) || a >= b || key !== social.key(a, b)) return [];
                return [[key, social.normalize(value)]];
            }));
        }

        if (!isId(source.nextId) || source.nextId <= highestCloudId) warnings.push('已重新计算云朵编号');
        if (source.nest != null && state.nest === null) warnings.push('已隔离无效的育云数据');
        state.nextId = Math.max(isId(source.nextId) ? source.nextId : 1, highestCloudId + 1, (state.nest?.id || 0) + 1);
        if (!isId(state.nextId)) throw new Error('存档中的云朵编号已达到安全上限。');
        ecology.normalize(state);
        Object.defineProperty(state, 'recoveryWarnings', {value: [...new Set(warnings)], enumerable: false});
        return state;
    }

    function write(storage, key, state, protectedRaw = null, replace = false) {
        if (!storage || typeof storage.setItem !== 'function') {
            throw new Error('当前环境不支持本地存档。');
        }
        if (protectedRaw !== null && !replace) return false;
        const serialized = JSON.stringify(state);
        if (byteLength(serialized) > MAX_BYTES) throw new Error('存档超过最大允许大小。');
        if (protectedRaw !== null) storage.setItem(key + '-unreadable-backup', protectedRaw);
        storage.setItem(key, serialized);
        return true;
    }

    const api = {MAX_BYTES, parse, write};
    if (typeof module === 'object' && module !== null && module.exports) module.exports = api;
    root.CloudKeeper = root.CloudKeeper || {};
    root.CloudKeeper.CloudSaves = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);