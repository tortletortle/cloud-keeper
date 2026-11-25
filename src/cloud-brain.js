/* Pure utility-based autonomy: decisions are deterministic for a supplied state. */
(function(root){'use strict';
const traits={happy:{social:.9,curiosity:.55,sensitivity:.35,sleep:.4,activity:.7},sleepy:{social:.3,curiosity:.25,sensitivity:.35,sleep:.95,activity:.25},shy:{social:.25,curiosity:.35,sensitivity:.85,sleep:.5,activity:.4},playful:{social:.7,curiosity:.95,sensitivity:.3,sleep:.25,activity:.95},storm:{social:.35,curiosity:.55,sensitivity:.8,sleep:.4,activity:.65},rainy:{social:.6,curiosity:.4,sensitivity:.95,sleep:.55,activity:.35}};
const labels={wander:'四处闲逛',idle:'发呆晒太阳',play:'自己玩耍',drink:'寻找露水',nap:'自主休息',approach:'想靠近你',hide:'找安静角落',rest:'正在睡觉',wait:'稍作等待'};
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
function emotion(c){if(c.rest)return 'sleep';if(c.water<25)return 'thirsty';if(c.mood<32)return c.type==='storm'?'angry':'sad';if(c.energy<25)return 'tired';if(c.mood>83)return 'joy';if(c.type==='shy'&&c.bond<15)return 'shy';return 'calm'}
function decide(c,ctx={},previous='idle'){
 const t=traits[c.type]||traits.happy,water=c.water,energy=c.energy,mood=c.mood,bond=c.bond||0;
 if(c.rest)return {action:'rest',scores:{rest:100}};
 const recent=ctx.recentCare?1:0, socialTarget=ctx.caretaker, safe=ctx.safe!==false;
 const scores={wander:17+t.curiosity*9,idle:20+(1-t.activity)*12,play:12+t.activity*31+(mood-45)*.22-(100-energy)*.38-(100-water)*.2,
 drink:water<48&&ctx.stock>0&&(ctx.drinkCooldown||0)<=0?40+(48-water)*1.8:-100,
 wait:water<24&&(ctx.stock<=0||(ctx.drinkCooldown||0)>0)?65+(24-water)*1.4:-100,
 nap:!ctx.wakeGrace?24+t.sleep*27+(55-energy)*1.05:-100,
 approach:socialTarget?9+t.social*26+bond*.30+recent*12-(100-energy)*.20: -100,
 hide:12+t.sensitivity*18+(45-mood)*.8+(ctx.crowded?13:0)-bond*.22};
 if(energy<18&&!ctx.wakeGrace&&water>=18)scores.nap+=55;
 if(!safe)scores.play=-100;
 if(water<24&&ctx.stock>0)scores.drink+=45;
 if(energy<45||water<43)scores.play=-100;
 if(previous in scores&&scores[previous]>-100)scores[previous]+=4;
 let action=Object.keys(scores).sort((a,b)=>scores[b]-scores[a])[0];return {action,scores};
}
function metabolism(c,action){const t=traits[c.type]||traits.happy;let water=-(.65+t.activity*.55+(action==='play'?.7:0)),energy=c.rest?12:-(.7+t.activity*.8+(action==='play'?1.5:0)),mood=0;
 if(c.water<30)mood-=2+t.sensitivity;else if(c.water>=50&&c.energy>=35)mood+=.7;
 if(!c.rest&&c.energy<25)mood-=1.5;
 if(action==='play'&&c.water>=35&&c.energy>=25)mood+=1.6;
 if(action==='hide'&&c.mood<60)mood+=1.2;
 return {water:clamp(c.water+water),energy:clamp(c.energy+energy),mood:clamp(c.mood+mood)};
}
function careSuggestion(cloud, stock) {
    switch (emotion(cloud)) {
        case 'sleep': return null;
        case 'thirsty': return stock >= 3 ? 'feed' : 'collect';
        case 'tired': return 'sleep';
        default: return 'pet';
    }
}

function carePriority(cloud) {
    return ['thirsty', 'sad', 'angry', 'tired'].includes(emotion(cloud)) ? 0 : 1;
}

function cloudName(value) {
    const name = value.trim();
    if (!name || Array.from(name).length > 20 || /[\u0000-\u001f\u007f]/u.test(name)) return null;
    return name;
}

const api={traits,labels,emotion,decide,metabolism,careSuggestion,carePriority,cloudName};if (typeof module === 'object' && module !== null && module.exports) module.exports = api;
root.CloudKeeper = root.CloudKeeper || {};
    root.CloudKeeper.CloudBrain = api;
})(typeof globalThis!=='undefined'?globalThis:this);