/* Pairwise relationship state and encounter rules. No DOM or wall clock dependencies. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const key=(a,b)=>[Number(a),Number(b)].sort((x,y)=>x-y).join(':');
const empty=()=>({affinity:0,plays:0,comforts:0,conflicts:0,apologies:0,last:'',tension:0});
function normalize(v){const r=empty();if(!v||typeof v!=='object')return r;for(const k of ['plays','comforts','conflicts','apologies'])r[k]=Number.isFinite(v[k])?Math.max(0,Math.floor(v[k])):0;r.affinity=Number.isFinite(v.affinity)?clamp(v.affinity,-30,100):0;r.tension=Number.isFinite(v.tension)?clamp(v.tension,0,100):0;r.last=['play','comfort','conflict','apology'].includes(v.last)?v.last:'';return r;}
function label(r){return r.tension>=20?'闹别扭':r.affinity>=65?'形影不离':r.affinity>=30?'好朋友':r.affinity>=10?'逐渐熟悉':'刚刚认识';}
function ready(c){return !c.rest&&c.water>=35&&c.energy>=35;}
function propose(a,b,r,traits){if(!ready(a)||!ready(b))return null;if(r.tension>=20&&a.mood>=35&&b.mood>=35)return 'apology';if(b.mood<42&&a.mood>=42&&traits[a.type].social>=.45)return 'comfort';if(a.mood<30||b.mood<25)return null;return 'play';}
function score(a,b,r,traits,kind,distance=0){if(!kind)return -Infinity;return (kind==='apology'?44:kind==='comfort'?36:15)+traits[a.type].social*14+traits[b.type].social*10+r.affinity*.18-distance*.24+(kind==='play'?(a.energy+b.energy-130)*.12:0);}
function response(a,b,r,traits,kind,random){if(!ready(a)||!ready(b))return 'decline';if(kind==='apology')return b.mood>=35?'accept':'decline';if(kind==='comfort')return b.mood<42?'accept':'decline';if(b.mood<45&&traits[b.type].sensitivity>=.8&&random<.65)return 'conflict';let chance=clamp(.46+traits[b.type].social*.32+r.affinity*.004+(b.mood-50)*.004-(r.tension*.008),.12,.98);return random<chance?'accept':'decline';}
function apply(r,kind){r=normalize(r);const changes={play:[9,-5,'plays'],comfort:[12,-10,'comforts'],conflict:[-7,25,'conflicts'],apology:[8,-28,'apologies']}[kind];if(!changes)return r;r.affinity=clamp(r.affinity+changes[0],-30,100);r.tension=clamp(r.tension+changes[1],0,100);r[changes[2]]++;r.last=kind;return r;}
const api={key,empty,normalize,label,ready,propose,score,response,apply};if (typeof module === 'object' && module !== null && module.exports) module.exports = api;
root.CloudKeeper = root.CloudKeeper || {};
    root.CloudKeeper.CloudSocial = api;
})(typeof globalThis!=='undefined'?globalThis:this);