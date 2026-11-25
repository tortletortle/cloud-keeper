/* Deterministic ecology rules; time advances only while the game is active. */
(function(root){'use strict';
const MAX=6, HATCH=60, GROW=180, PERIOD=45, DAY_LENGTH=PERIOD*4;
const dayAt=elapsed=>Math.floor(Math.max(0,Number.isFinite(elapsed)?elapsed:0)/DAY_LENGTH)+1;
const weather=['sun','rain','rainbow','sun','storm','rain','rainbow'];
const stage=c=>c.growth>=GROW?'成年':c.growth>=60?'少年':'幼年';
function normalize(s){s.clouds.forEach(c=>{c.growth=Number.isFinite(c.growth)?Math.max(0,Math.min(GROW,c.growth)):GROW;c.parents=Array.isArray(c.parents)?c.parents.slice(0,2):[];c.lastNest=Number.isFinite(c.lastNest)?c.lastNest:-10000;});const n=s.nest;if(!n||!Array.isArray(n.parents)||n.parents.length!==2||n.parents[0]===n.parents[1]||!s.clouds.every(c=>c.id!==n.id)||!n.parents.every(id=>s.clouds.some(c=>c.id===id))||!Number.isFinite(n.remaining)||n.remaining<0||s.clouds.length>=MAX||!s.clouds.some(c=>c.type===n.type&&n.parents.includes(c.id)))s.nest=null;else n.remaining=Math.min(HATCH,n.remaining);s.day=dayAt(s.elapsed);return s;}
function current(s){return weather[Math.floor(Math.max(0,s.elapsed||0)/PERIOD)%weather.length];}
function ancestors(clouds, cloud) {
    const byId = new Map(clouds.map(c => [c.id, c]));
    const ids = new Set([cloud.id]);
    const pending = [...cloud.parents];
    while (pending.length) {
        const id = pending.pop();
        if (ids.has(id)) continue;
        ids.add(id);
        pending.push(...(byId.get(id)?.parents || []));
    }
    return ids;
}

function related(clouds, a, b) {
    const family = ancestors(clouds, a);
    return [...ancestors(clouds, b)].some(id => family.has(id));
}

function canGrow(c) {
    return c.water >= 45 && c.mood >= 40 && c.energy >= 30;
}

function eligible(s,a,b,r){if(s.nest)return '育云窝已有一颗云种';if(s.clouds.length>=MAX)return '牧场空间不足';if(!a||!b||a.id===b.id)return '需要两只不同云朵';if(a.growth<GROW||b.growth<GROW)return '需要成年云朵';if(related(s.clouds,a,b))return '近亲云朵不能共同育云';if(r.affinity<30||r.tension>10)return '需要成为好朋友且没有闹别扭';if([a,b].some(c=>c.rest||c.water<60||c.energy<60||c.mood<60))return '双方心情、水分和精力均需达到60，且保持清醒';if([a,b].some(c=>s.elapsed-c.lastNest<180))return '小伙伴正在恢复';if(s.water<6)return '需要6颗水滴';return '';}
function start(s,a,b,r,random){if(eligible(s,a,b,r))return false;s.water-=6;for(const c of [a,b]){c.energy-=12;c.lastNest=s.elapsed;}s.nest={id:s.nextId++,parents:[a.id,b.id],type:random<.5?a.type:b.type,remaining:HATCH};return true;}
function advance(s,spawn,spot){const w=current(s),events=[];for(const c of s.clouds){if(c.growth<GROW){let old=stage(c);if(canGrow(c))c.growth=Math.min(GROW,c.growth+1);if(old!==stage(c))events.push(c.name+'成长为'+stage(c)+'啦！');}if(s.elapsed%10===0){if(w==='rain')c.water=Math.min(100,c.water+3);if(w==='rainbow')c.mood=Math.min(100,c.mood+4);if(w==='storm'&&c.type==='storm')c.mood=Math.min(100,c.mood+4);}}
if(s.nest){s.nest.remaining=Math.max(0,s.nest.remaining-1);if(s.nest.remaining===0&&s.clouds.length<MAX){let n=s.nest,pos=spot(),c=spawn(n.type,n.id,pos.x,pos.y);c.name=c.name+'·小'+n.id;c.growth=0;c.parents=n.parents.slice();c.lastNest=-10000;s.clouds.push(c);s.nest=null;events.push(c.name+'从云种里诞生啦！');}}return events;}
const api={MAX,HATCH,GROW,PERIOD,DAY_LENGTH,dayAt,stage,canGrow,normalize,current,eligible,start,advance};if (typeof module === 'object' && module !== null && module.exports) module.exports = api;
root.CloudKeeper = root.CloudKeeper || {};
root.CloudKeeper.CloudEcology = api;
})(typeof globalThis!=='undefined'?globalThis:this);