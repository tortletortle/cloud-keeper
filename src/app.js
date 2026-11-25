(()=>{'use strict';const $=id=>document.getElementById(id), KEY='cloud-ranch-v01', A=n=>ASSETS[n], clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const CK=window.CloudKeeper,B=CK.CloudBrain,S=CK.CloudSocial,E=CK.CloudEcology,CloudSaves=CK.CloudSaves,ASSETS=CK.ASSETS,APP_VERSION='V0.12.1',reducedMotionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');const types={happy:['棉棉','开朗 · 喜欢亲近','贴贴！','喜欢被摸摸，常常主动靠近你。'],sleepy:['困困','慵懒 · 喜欢睡觉','呼……','通常比其他云朵更需要休息。'],shy:['桃桃','害羞 · 温柔细腻','唔，好害羞……','不喜欢太热闹，但熟悉后很亲人。'],playful:['跳跳','活泼 · 好奇心旺盛','再玩一次！','喜欢蹦蹦跳跳，消耗精力较快。'],storm:['雷雷','倔强 · 容易生气','哼……还不错。','心情低落时会释放小闪电。'],rainy:['滴滴','敏感 · 容易落泪','谢谢你……','水分不足或心情低落时容易下雨。']};
const spawn=(type,id,x,y)=>({id,type,name:types[type][0],x,y,mood:65,water:68,energy:80,rest:false,lastPet:0,bond:0,careCount:0,lastCare:0,lastCareKind:"",autoDrinks:0,growth:E.GROW,parents:[],lastNest:-10000});
const fresh=()=>({version:1,nest:null,relationships:{},water:24,coins:15,nextId:4,clouds:[spawn('happy',1,29,78),spawn('sleepy',2,49,68),spawn('shy',3,69,80)],day:1,night:false,selected:1,journal:['今天，三只小云朵来到了新牧场。'],lastCollect:0,elapsed:0,sound:true});
const saveRules = {types, ecology: E, social: S};
let storageOK = true, loaded = false, protectedRaw = null, s = fresh();
try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) {
        protectedRaw = raw;
        s = CloudSaves.parse(raw, saveRules);
        loaded = true;
        if (s.recoveryWarnings?.length) {
            try {
                CloudSaves.write(localStorage, KEY, s, raw, true);
                protectedRaw = null;
            } catch {
                storageOK = false;
            }
        } else {
            protectedRaw = null;
        }
    }
} catch {
    storageOK = false;
}
let running=false,drag=null,feedDrag=null,skipFeedClick=false,toastTimer,ac;const nodes=new Map(),runtime=new Map(),caretakers=new Map();
const pendingTimers=new Set();function scheduleTimeout(fn,delay){const timer=setTimeout(()=>{pendingTimers.delete(timer);fn()},delay);pendingTimers.add(timer);return timer}function clearScheduledTimeout(timer){clearTimeout(timer);pendingTimers.delete(timer)}function clearAllScheduledTimeouts(){for(const timer of pendingTimers)clearTimeout(timer);pendingTimers.clear()}
function save(next = s, replace = false) {
    try {
        storageOK = CloudSaves.write(localStorage, KEY, next, protectedRaw, replace);
        if (storageOK) protectedRaw = null;
    } catch {
        storageOK = false;
    }
    const foot = document.querySelector('.foot');
    const message = storageOK
        ? '自动保存于本机 · '+APP_VERSION
        : protectedRaw !== null
            ? APP_VERSION+' · 旧档无法读取，原数据已保留'
            : APP_VERSION+' · 本地自动保存不可用';
    if (foot.textContent !== message) foot.textContent = message;
    return storageOK;
}
function log(msg){s.journal.unshift(msg);s.journal=s.journal.slice(0,40)}function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;clearScheduledTimeout(toastTimer);toastTimer=scheduleTimeout(()=>$('toast').hidden=true,2300)}function tone(freq=570){if(!s.sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume().catch(()=>{});const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*1.27,t+.14);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.065,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.23)}catch(e){/* Audio is optional when the browser does not support it. */}}
function selected(){return s.clouds.find(c=>c.id===s.selected)||s.clouds[0]}function select(id){s.selected=id;render();save()}
const emotionText={sleep:'睡得香甜',thirsty:'有点口渴',angry:'气鼓鼓',sad:'需要安慰',tired:'有点困了',joy:'超级开心',shy:'有点害羞',calm:'悠闲自在'};function moodLabel(c){return emotionText[B.emotion(c)]}
function appearance(c){return c.type}
function addNode(c){let b=document.createElement('button');b.type='button';b.className='cloud';b.dataset.id=c.id;b.setAttribute('aria-label',c.name+'，'+moodLabel(c)+'，心情 '+Math.round(c.mood)+'，水分 '+Math.round(c.water)+'，精力 '+Math.round(c.energy));let body=document.createElement('span');body.className='body';let im=document.createElement('img');im.draggable=false;im.alt='';body.append(im);let tag=document.createElement('span');tag.className='tag';tag.textContent=c.name;let say=document.createElement('span');say.className='say';say.setAttribute('role','status');say.setAttribute('aria-live','polite');b.append(body,tag,say);$('scene').append(b);nodes.set(c.id,b);runtime.set(c.id,{tx:c.x,ty:c.y,wait:Math.random()*3+1,soft:{x:0,y:0,z:0,vx:0,vy:0,vz:0,size:1,phase:Math.random()*6.28},held:false,action:'idle',decideIn:5+Math.random()*2,actionAge:0,wakeGrace:0,drinkCooldown:0,playClock:0,socialCooldown:0,session:null});b.addEventListener('pointerdown',e=>{if(e.button!==0||drag||feedDrag)return;e.preventDefault();select(c.id);const rt=runtime.get(c.id);drag={id:c.id,pointer:e.pointerId,px:e.clientX,py:e.clientY,x:c.x,y:c.y,moved:false,held:false};b.setPointerCapture(e.pointerId);drag.timer=scheduleTimeout(()=>{if(drag?.id!==c.id||drag.moved)return;drag.held=true;rt.held=true;b.classList.add('held');pet(c);},380)});b.addEventListener('pointermove',e=>{if(!drag||drag.id!==c.id||drag.pointer!==e.pointerId)return;const r=$('scene').getBoundingClientRect(),dx=e.clientX-drag.px,dy=e.clientY-drag.py,rt=runtime.get(c.id);if(drag.held){rt.soft.vx+=clamp(e.movementX||dx*.05,-8,8)*.13;return}if(Math.hypot(dx,dy)>9){drag.moved=true;clearScheduledTimeout(drag.timer)}if(drag.moved){b.classList.add('dragging');c.x=clamp(drag.x+dx/r.width*100,12,88);c.y=clamp(drag.y+dy/r.height*100,60,89);rt.tx=c.x;rt.ty=c.y;position(c)}});const up=e=>{if(!drag||drag.id!==c.id||drag.pointer!==e.pointerId)return;clearScheduledTimeout(drag.timer);let {moved,held}=drag;drag=null;const rt=runtime.get(c.id);rt.held=false;b.classList.remove('dragging','held');if(e.type==='pointerup'&&moved){cancelSocial(c.id);kick(c,.9,2.1,-1.5);speak(c,'呼～飘起来啦！');save()}else if(e.type==='pointerup'&&!held){pet(c)}};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);b.addEventListener('click',e=>{if(e.detail===0){select(c.id);pet(c)}});position(c)}
function position(c){let b=nodes.get(c.id);if(!b)return;b.style.left=c.x+'%';b.style.top=c.y+'%';b.style.zIndex=Math.round(c.y);b.classList.toggle('selected',c.id===selected().id)}
function renderCare(cloud) {
    const action = B.careSuggestion(cloud, s.water);
    const status = $('careStatus');
    const text = moodLabel(cloud) + (action === 'collect' ? '，先去收集露水' : '');
    if (status.textContent !== text) status.textContent = text;
    for (const id of ['pet', 'feed', 'sleep', 'collect']) {
        $(id).classList.toggle('suggested', id === action);
    }
}
function render(){for(let c of s.clouds){if(!nodes.has(c.id))addNode(c);let b=nodes.get(c.id),img=b.querySelector('img'),path=A(appearance(c));if(img.getAttribute('src')!==path)img.src=path;b.classList.toggle('rest',c.rest);position(c);let rain=b.querySelector('.rain');let emotion=B.emotion(c);b.dataset.emotion=emotion;b.dataset.stage=E.stage(c);b.setAttribute('aria-label',c.name+'，'+moodLabel(c)+'，心情 '+Math.round(c.mood)+'，水分 '+Math.round(c.water)+'，精力 '+Math.round(c.energy));b.querySelector('.tag').textContent=c.name+(c.growth<E.GROW?' · '+E.stage(c):'');b.dataset.action=c.rest?'rest':runtime.get(c.id).action;let wet=emotion==='sad'||(emotion==='thirsty'&&c.type==='rainy');if(wet&&!rain){rain=document.createElement('span');rain.className='rain';for(let i=0;i<5;i++){let d=document.createElement('i');d.className='drop';d.style.left=(i*20)+'%';d.style.animationDelay=(i*.14)+'s';rain.append(d)}b.append(rain)}else if(!wet&&rain)rain.remove();let badge=b.querySelector('.emotion-badge');if(!badge){badge=document.createElement('span');badge.className='emotion-badge';b.append(badge)}badge.textContent=({sleep:' zZ',thirsty:'💧',angry:'ϟ',sad:'…',tired:'☾',joy:'♡',shy:'· ·'})[emotion]||'';badge.hidden=!badge.textContent}const c=selected();$('waterCount').textContent=s.water;$('coinCount').textContent=s.coins;$('population').textContent=`名册 · ${s.clouds.length}/${E.MAX}`;const portrait=$('portrait'),portraitPath=A(appearance(c));if(portrait.getAttribute('src')!==portraitPath)portrait.src=portraitPath;portrait.alt=c.name;$('cloudName').textContent=c.name;renderCare(c);for(let row of document.querySelectorAll('.stat')){let n=Math.round(c[row.dataset.key]);row.querySelector('.fill').style.width=n+'%';row.querySelector('b').textContent=n;row.querySelector('.track').setAttribute('aria-valuenow',n)}$('note').textContent=types[c.type][3];renderSocial(c);$('behavior').textContent=(socialLabels[runtime.get(c.id)?.action]||B.labels[c.rest?'rest':runtime.get(c.id)?.action])||'四处闲逛';$('memory').textContent=c.careCount?`记得你照顾过它 ${c.careCount} 次`:'还在慢慢认识你';$('bondLabel').textContent=c.bond>=80?'形影不离':c.bond>=40?'亲密伙伴':c.bond>=15?'逐渐熟悉':'初次相遇';$('bondFill').style.width=c.bond+'%';$('bondValue').textContent=Math.round(c.bond)+'/100';$('sleepText').textContent=c.rest?'唤醒':'休息';$('feed').disabled=s.water<3;$('adopt').disabled=s.clouds.length+(s.nest?1:0)>=E.MAX;$('scene').classList.toggle('night',s.night);$('night').querySelector('span').textContent=s.night?'切换白天':'切换夜晚';renderEcology(c);$('dayText').textContent='牧场第 '+s.day+' 天';let rem=Math.max(0,Math.ceil((s.lastCollect+12000-Date.now())/1000));$('collect').disabled=rem>0;$('collectSub').textContent=rem?`${rem} 秒后可收集`:'+8 水滴';}
function speak(c,msg){let b=nodes.get(c.id),el=b.querySelector('.say');el.textContent=msg;el.classList.add('show');clearScheduledTimeout(b.sayTimer);b.sayTimer=scheduleTimeout(()=>el.classList.remove('show'),1700)}// Damped spring deformation: x = lateral squish, y = vertical stretch, z = lift.
function kick(c,x,y,z){const q=runtime.get(c.id)?.soft;if(!q)return;q.vx+=x;q.vy+=y;q.vz+=z}
function softStep(c,rt,dt){if(reducedMotionQuery.matches)return;const q=rt.soft;let left=dt;while(left>0){const h=Math.min(left,1/120);left-=h;let target=rt.held?.06:0;q.vx+=(115*(target-q.x)-12*q.vx)*h;q.x+=q.vx*h;target=rt.held?-.09:0;q.vy+=(115*(target-q.y)-12*q.vy)*h;q.y+=q.vy*h;target=drag?.id===c.id&&drag.moved?-.12:0;q.vz+=(80*(target-q.z)-11*q.vz)*h;q.z+=q.vz*h;}q.phase+=dt*(c.rest?1.65:2.5);const w=(.87+.0021*c.water)*(c.growth>=E.GROW?1:.65+.35*c.growth/E.GROW);q.size+=(w-q.size)*(1-Math.exp(-dt*3));const wave=Math.sin(q.phase),squish=c.rest?.035:.022,b=nodes.get(c.id);b.style.setProperty('--sx',(q.size*(1+clamp(q.x,-.23,.27)+wave*squish)).toFixed(4));b.style.setProperty('--sy',(q.size*(1+clamp(q.y,-.25,.25)-wave*squish)).toFixed(4));b.style.setProperty('--lift',((clamp(q.z,-.32,.08)-(1+wave)*(c.rest?.004:.022))*100).toFixed(2)+'%');}
function particles(c,icon,count=5){for(let i=0;i<count;i++){let p=document.createElement('span');p.className='particle';p.textContent=icon;p.style.left=c.x+'%';p.style.top=(c.y-17)+'%';p.style.setProperty('--dx',((i-(count-1)/2)*25+Math.random()*10)+'px');p.style.setProperty('--dy',(-38-Math.random()*38)+'px');p.style.animationDelay=i*45+'ms';$('scene').append(p);scheduleTimeout(()=>p.remove(),1250)}}
function bond(c,n){let before=c.bond;c.bond=clamp(before+n);for(const [level,label] of [[15,'开始熟悉你'],[40,'成为亲密伙伴'],[80,'与你形影不离']])if(before<level&&c.bond>=level){log(c.name+label+'啦！');toast(c.name+label+'啦！')}}
function remember(c,kind){c.lastCare=Date.now();c.careCount++;c.lastCareKind=kind;caretakers.set(c.id,{x:c.x,y:c.y,until:Date.now()+45000});}function pet(c=selected()){cancelSocial(c.id);if(c.rest){speak(c,'嘘……睡得好香。');return}let now=Date.now(),reward=now-c.lastPet>=2500;if(reward){c.mood=clamp(c.mood+12);c.lastPet=now;s.coins+=3;bond(c,3);remember(c,"pet");log(`你摸摸了${c.name}，收获 3 颗星星。`)}speak(c,types[c.type][2]);kick(c,2.7,-3.4,-1.9);particles(c,'♥',reward?5:2);tone();render();save()}
function feed(c=selected()){if(c.rest)return toast('小云朵在睡觉，醒来再喂吧。');if(s.water<3)return toast('水滴不够啦，先收集露水吧。');if(c.water>=98)return toast(c.name+'已经喝饱啦！');let rt=runtime.get(c.id);if(rt.feeding)return toast(c.name+'正在喝水，稍等一下。');cancelSocial(c.id);rt.feeding=true;s.water-=3;c.water=clamp(c.water+26);c.mood=clamp(c.mood+5);s.coins+=2;bond(c,4);remember(c,"feed");speak(c,'咕噜咕噜！');let b=nodes.get(c.id),bottle=document.createElement('img');bottle.className='feeding-bottle';bottle.alt='';bottle.src=A('feed');b.append(bottle);b.classList.add('feeding');kick(c,-1.2,1.7,0);scheduleTimeout(()=>{if(runtime.get(c.id)!==rt)return;kick(c,2.1,-2.2,-1.6);particles(c,'✦',5);speak(c,'喝饱啦，软乎乎～');tone(620)},420);scheduleTimeout(()=>{rt.feeding=false;bottle.remove();b.classList.remove('feeding');if(runtime.get(c.id)===rt)render()},820);tone(420);log(`给${c.name}喂了水。`);render();save()}
function dropTarget(x,y){let hit=document.elementsFromPoint(x,y).map(e=>e.closest('.cloud')).find(Boolean);return hit&&s.clouds.find(c=>String(c.id)===hit.dataset.id)}
function dragFeedStart(e){if(e.button!==0||!$('feed').matches(':enabled')||drag||feedDrag)return;feedDrag={pointer:e.pointerId,x:e.clientX,y:e.clientY,active:false};$('feed').setPointerCapture(e.pointerId);e.preventDefault()}
function dragFeedMove(e){if(!feedDrag||feedDrag.pointer!==e.pointerId)return;let d=feedDrag;if(!d.active&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>8){d.active=true;d.ghost=document.createElement('img');d.ghost.className='feed-ghost';d.ghost.src=A('feed');d.ghost.alt='';document.body.append(d.ghost);$('scene').classList.add('feeding-targets')}if(!d.active)return;d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';let c=dropTarget(e.clientX,e.clientY);for(let [id,b] of nodes)b.classList.toggle('feed-target',c?.id===id)}
function dragFeedEnd(e){if(!feedDrag||feedDrag.pointer!==e.pointerId)return;const d=feedDrag;feedDrag=null;if(!d.active)return;d.ghost.remove();$('scene').classList.remove('feeding-targets');for(let b of nodes.values())b.classList.remove('feed-target');skipFeedClick=true;scheduleTimeout(()=>skipFeedClick=false,0);if(e.type==='pointerup'){let c=dropTarget(e.clientX,e.clientY);if(c){select(c.id);feed(c)}else toast('把奶瓶拖到想喂养的云朵身上。')}}
function sleep(){let c=selected(),rt=runtime.get(c.id);if(rt.feeding)return toast(c.name+'正在喝水，等一会儿再休息。');cancelSocial(c.id);c.rest=!c.rest;rt.action=c.rest?'rest':'idle';rt.decideIn=4;rt.wakeGrace=c.rest?0:18;speak(c,c.rest?'晚安～':'睡饱啦！');kick(c,c.rest?1.4:-1.4,c.rest?-2:2,c.rest?0:-1.2);tone(350);render();save()}
function openSpot(){let best={x:50,y:78},score=-1;for(let y of [65,77,87])for(let x of [16,32,48,64,80]){let d=Math.min(...s.clouds.map(c=>Math.hypot(x-c.x,(y-c.y)*1.5)));if(d>score){score=d;best={x,y}}}return best}
let modalReturnFocus=null;function modal(title,body){modalReturnFocus=document.activeElement;stopLoop();$('modalTitle').textContent=title;$('modalBody').replaceChildren(body);$('overlay').hidden=false;$('app').inert=true;$('title').inert=true;$('closeModal').focus()}function closeModal(){$('overlay').hidden=true;$('app').inert=!$('title').hidden;$('title').inert=false;if(modalReturnFocus?.isConnected)modalReturnFocus.focus();modalReturnFocus=null;scheduleTick()}function p(text){let e=document.createElement('p');e.textContent=text;return e}function btn(text,fn){let e=document.createElement('button');e.textContent=text;e.onclick=fn;return e}
if (protectedRaw !== null) $('startLabel').textContent = '旧档无法读取，原数据已保留';
else $('startLabel').textContent=loaded?'欢迎回来':'';$('app').inert=true;$('app').setAttribute('aria-hidden','true');$('start').onclick=()=>{$('title').hidden=true;$('app').inert=false;$('app').removeAttribute('aria-hidden');running=true;prev=performance.now();scheduleTick();render();save();if(s.recoveryWarnings?.length)toast('旧存档已修复 '+s.recoveryWarnings.length+' 项，修复前数据已备份到本机。');else if(!loaded)toast('欢迎！点击小云朵就可以摸摸它。');tone()};$('pet').onclick=()=>pet();$('feed').onclick=()=>{if(!skipFeedClick)feed()};$('feed').addEventListener('dragstart',e=>e.preventDefault());$('feed').addEventListener('pointerdown',dragFeedStart);$('feed').addEventListener('pointermove',dragFeedMove);$('feed').addEventListener('pointerup',dragFeedEnd);$('feed').addEventListener('pointercancel',dragFeedEnd);$('feed').addEventListener('lostpointercapture',dragFeedEnd);$('sleep').onclick=sleep;$('collect').onclick=()=>{if(Date.now()-s.lastCollect<12000)return;s.water+=8;s.lastCollect=Date.now();toast('收集到 8 颗晶莹的水滴');tone(660);render();save()};$('night').onclick=()=>{s.night=!s.night;render();save()};$('adopt').onclick=()=>{let wrap=document.createElement('div');wrap.append(p('用 30 颗星星邀请一只新的小云朵来到牧场。'));let grid=document.createElement('div');grid.className='adopt-grid';for(let [t,d] of Object.entries(types)){if(s.clouds.some(c=>c.type===t))continue;let b=btn(d[0],()=>{if(s.coins<30||s.clouds.length+(s.nest?1:0)>=E.MAX)return;s.coins-=30;let spot=openSpot(),c=spawn(t,s.nextId++,spot.x,spot.y);s.clouds.push(c);s.selected=c.id;log(`${c.name}加入了牧场。`);closeModal();render();save();speak(c,'你好呀！');toast('欢迎 '+c.name+'！');tone(740)});let im=document.createElement('img');im.src=A(t);im.alt='';b.prepend(im);b.disabled=s.coins<30;grid.append(b)}wrap.append(grid);modal('新的小伙伴',wrap)};
$('journal').onclick=()=>{let w=document.createElement('div');for(let e of s.journal.slice(0,12))w.append(p(e));modal('牧场日记',w)};function openRoster() {
    const wrap = document.createElement('div');
    wrap.className = 'roster';
    const current = selected();
    const ordered = [...s.clouds].sort((a, b) => B.carePriority(a) - B.carePriority(b));
    for (const cloud of ordered) {
        const row = document.createElement('div');
        row.className = 'friend-row';
        const image = document.createElement('img');
        image.src = A(cloud.type);
        image.alt = '';
        const details = document.createElement('div');
        const name = document.createElement('strong');
        const state = document.createElement('small');
        name.textContent = cloud.name;
        state.textContent = [E.stage(cloud), moodLabel(cloud), '水分 ' + Math.round(cloud.water),
            '精力 ' + Math.round(cloud.energy)].join(' · ');
        details.append(name, state);
        const choose = btn(cloud === current ? '已选中' : '去照料', () => {
            select(cloud.id);
            closeModal();
            nodes.get(cloud.id)?.focus();
        });
        choose.disabled = cloud === current;
        choose.setAttribute('aria-label', cloud === current ? cloud.name + '已选中' : '去照料' + cloud.name);
        row.append(image, details, choose);
        wrap.append(row);
    }
    const form = document.createElement('form');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const message = p('');
    message.setAttribute('role', 'status');
    input.value = current.name;
    input.autocomplete = 'off';
    label.append('给选中的云朵起名', input);
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = '保存名字';
    form.append(label, submit, message);
    form.onsubmit = event => {
        event.preventDefault();
        const name = B.cloudName(input.value);
        if (!name) {
            message.textContent = '请输入 1–20 个字，名字中不能有控制字符。';
            return;
        }
        current.name = name;
        render();
        const saved = save();
        openRoster();
        toast(saved ? '新名字已保存。' : '已改名，可导出存档保留新名字。');
    };
    wrap.append(form);
    modal('云朵名册', wrap);
}
$('population').onclick = openRoster;

function switchRanch(next) {
    clearAllScheduledTimeouts();
    clearScheduledTimeout(drag?.timer);
    drag = null;
    feedDrag?.ghost?.remove();
    feedDrag = null;
    $('scene').classList.remove('feeding-targets');
    for (const node of nodes.values()) node.remove();
    nodes.clear();
    runtime.clear();
    sessions.clear();
    socialTimer = 0;
    caretakers.clear();
    acc = 0;
    s = next;
    closeModal();
    render();
}

function downloadSave(text, filename) {
    const data = new Blob([text], {type: 'application/json'});
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    scheduleTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已请求下载牧场存档。');
}

function exportRanch() {
    downloadSave(JSON.stringify(s, null, 2), 'CloudRanch-save.json');
}

function openImport(fromTitle) {
    const wrap = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    const status = p('');
    status.setAttribute('role', 'status');
    let readSequence = 0;
    input.onchange = async () => {
        const file = input.files[0];
        input.value = '';
        if (!file) return;
        const sequence = ++readSequence;
        status.textContent = '正在读取存档…';
        try {
            if (file.size > CloudSaves.MAX_BYTES) throw new Error('存档文件超过 128 KB。');
            const candidate = CloudSaves.parse(await file.text(), saveRules);
            if (!input.isConnected || $('overlay').hidden || sequence !== readSequence) return;
            const summary = '第 ' + candidate.day + ' 天 · ' + candidate.clouds.length + ' 只云朵' +
                (candidate.nest ? ' · 有一颗云种正在孵育' : '');
            const preview = document.createElement('div');
            const restoreStatus = p('');
            restoreStatus.setAttribute('role', 'status');
            preview.append(p(summary), p(candidate.recoveryWarnings?.length ? '检测到 '+candidate.recoveryWarnings.length+' 项可修复问题。无效记录会被隔离，其他云朵进度会保留。' : (fromTitle ? '恢复后会覆盖这个浏览器里的当前牧场。' : '恢复后会覆盖当前进度。可先回到设置导出备份。')), 
                btn('确认恢复', () => {
                    if (!save(candidate, true)) {
                        restoreStatus.textContent = '无法写入本地存档，当前牧场已保留。';
                        return;
                    }
                    if (fromTitle) {
                        $('title').hidden = true;
                        running = true;
                    }
                    switchRanch(candidate);
                    toast('牧场已恢复。');
                }),
                btn(fromTitle ? '返回开始画面' : '返回设置', fromTitle ? closeModal : openSettings), restoreStatus);
            modal('恢复牧场存档', preview);
        } catch (error) {
            if (sequence === readSequence) {
                status.textContent = error instanceof SyntaxError ? '文件不是有效的 JSON 存档。' : error.message;
            }
        }
    };
    wrap.append(p('选择之前导出的牧场 JSON 存档。'),
        btn('选择存档文件', () => input.click()), input, status);
    if (protectedRaw !== null) {
        wrap.append(btn('下载原始旧档', () => downloadSave(protectedRaw, 'CloudRanch-old-save.json')));
    }
    modal('导入牧场存档', wrap);
}
$('restoreAtStart').onclick = () => openImport(true);

function openSettings() {
    const wrap = document.createElement('div');
    const audio = document.createElement('div');
    audio.className = 'settings-row';
    audio.append('互动音效', btn(s.sound ? '关闭音效' : '开启音效', () => {
        s.sound = !s.sound;
        save();
        openSettings();
    }));
    let repairBackup = null;
    try { repairBackup = localStorage.getItem(KEY + '-unreadable-backup'); } catch { /* Storage may be unavailable under browser privacy policies. */ }
    const backupAction = repairBackup ? btn('下载修复前存档', () => downloadSave(repairBackup, 'CloudRanch-pre-repair-backup.json')) : null;
    wrap.append(audio, p(storageOK ? '进度自动保存在本浏览器，可以导出备份。' : '本地自动保存不可用，可以导出备份。'),
        btn('导出存档', exportRanch), btn('导入存档', () => openImport(false)), ...(backupAction ? [backupAction] : []),
        btn('重新开始', () => {
            if (confirm('确定清空当前牧场吗？此操作不可撤销。')) {
                const next = fresh();
                save(next, true);
                switchRanch(next);
                toast('新的牧场开始啦');
            }
        }));
    modal('牧场设置', wrap);
}
$('settings').onclick = openSettings;
$('closeModal').onclick=closeModal;$('overlay').onclick=e=>{if(e.target===$('overlay'))closeModal()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('overlay').hidden){e.preventDefault();closeModal()}});
// V0.5: pair sessions own both participants until completion or interruption.
const socialLabels={meet:'去找小伙伴',socialPlay:'一起蹦蹦跳',socialComfort:'互相陪伴',socialApology:'正在和好'};
const sessions=new Map();let socialTimer=0;
function byId(id){return s.clouds.find(c=>c.id===id)}
function relation(a,b){return s.relationships[S.key(a.id,b.id)]||S.empty()}
function available(c){const rt=runtime.get(c.id);return S.ready(c)&&rt&&!rt.session&&!rt.feeding&&!rt.held&&drag?.id!==c.id&&rt.socialCooldown<=0;}
function renderSocial(c){const peers=s.clouds.filter(o=>o!==c).sort((a,b)=>relation(c,b).affinity-relation(c,a).affinity);const rt=runtime.get(c.id),session=rt?.session&&sessions.get(rt.session);let text='还没有熟悉的伙伴';if(session){const other=byId(session.a===c.id?session.b:session.a);text='与 '+other.name+' · '+(session.phase==='meet'?'正在碰面':socialLabels[rt.action]);}else if(peers.length){const best=peers[0],r=relation(c,best);if(r.affinity!==0||r.tension||r.last)text=best.name+' · '+S.label(r);}const el=$('socialSummary');if(el.textContent!==text)el.textContent=text;}
function openFriends(){const c=selected(),wrap=document.createElement('div');wrap.className='friends-list';wrap.append(p(c.name+'的小伙伴 · 云朵可能接受、拒绝或闹别扭。'));for(const o of s.clouds.filter(o=>o!==c)){const r=relation(c,o),row=document.createElement('div');row.className='friend-row';const im=document.createElement('img');im.src=A(o.type);im.alt='';const info=document.createElement('div'),title=document.createElement('strong'),desc=document.createElement('small');title.textContent=o.name+' · '+S.label(r);desc.textContent=`好感 ${r.affinity} · 玩耍 ${r.plays} 次 · 陪伴 ${r.comforts} 次 · 和好 ${r.apologies} 次`;info.append(title,desc);const kind=S.propose(c,o,r,B.traits);const button=btn(({play:'邀请玩耍',comfort:'去陪陪它',apology:'试着和好'})[kind]||'暂不打扰',()=>{closeModal();invite(c,o,true)});button.dataset.peer=o.id;button.disabled=!kind||!available(c)||!available(o);row.append(im,info,button);wrap.append(row);}modal('云朵朋友圈',wrap)}
$('friends').onclick=openFriends;
function invite(a,b,manual=false){if(!available(a)||!available(b)){if(manual)toast('小伙伴现在想休息一下。');return false;}const r=relation(a,b),kind=S.propose(a,b,r,B.traits);if(!kind){if(manual)toast('现在不太适合一起玩。');return false;}const outcome=S.response(a,b,r,B.traits,kind,Math.random());if(outcome!=='accept'){runtime.get(a.id).socialCooldown=14;runtime.get(b.id).socialCooldown=10;speak(a,'那下次再一起玩吧～');if(outcome==='conflict'){s.relationships[S.key(a.id,b.id)]=S.apply(r,'conflict');a.mood=clamp(a.mood-3);b.mood=clamp(b.mood-5);speak(b,'哼，想自己待一会儿！');log(a.name+'和'+b.name+'闹了点小别扭。');render();save();}else speak(b,'现在想自己待一会儿～');return false;}
const id=S.key(a.id,b.id),middle=clamp((a.x+b.x)/2,25,75),y=clamp((a.y+b.y)/2,66,85),left=a.x<=b.x?a:b,right=left===a?b:a;const gap=$('scene').clientWidth<540?24:18;const session={id,a:a.id,b:b.id,kind,phase:'meet',age:0,pulse:0};sessions.set(id,session);for(const [c,x] of [[left,middle-gap/2],[right,middle+gap/2]]){const rt=runtime.get(c.id);rt.session=id;rt.action='meet';rt.tx=x;rt.ty=y;}speak(a,({play:'一起玩呀！',comfort:'我来陪你啦。',apology:'我们和好吧？'})[kind]);speak(b,'嗯，好呀～');render();return true;}
function moveSocial(c,rt,dt){const dx=rt.tx-c.x,dy=rt.ty-c.y,d=Math.hypot(dx,dy);if(d>.1){const step=Math.min(d,5.8*dt);c.x+=dx/d*step;c.y+=dy/d*step;position(c);}}
function endSocial(session,completed){if(!sessions.has(session.id))return;sessions.delete(session.id);const a=byId(session.a),b=byId(session.b);for(const c of [a,b]){if(!c)continue;const rt=runtime.get(c.id);if(!rt)continue;rt.session=null;rt.socialCooldown=completed?26:10;rt.action=c.rest?'rest':'idle';rt.tx=c.x;rt.ty=c.y;rt.decideIn=2;}
if(completed&&a&&b){const k=session.kind;s.relationships[session.id]=S.apply(relation(a,b),k);if(k==='play'){for(const c of [a,b]){c.mood=clamp(c.mood+7);c.energy=clamp(c.energy-5);c.water=clamp(c.water-2);}}else if(k==='comfort'){a.mood=clamp(a.mood+3);b.mood=clamp(b.mood+14);}else{a.mood=clamp(a.mood+6);b.mood=clamp(b.mood+6);}const msg=({play:'一起玩了蹦蹦跳。',comfort:'静静地互相陪伴。',apology:'终于和好啦！'})[k];log(a.name+'和'+b.name+msg);for(const c of [a,b]){particles(c,'♥',3);speak(c,k==='apology'?'还是好朋友！':'好开心呀～');}render();save();}}
function cancelSocial(id){const key=runtime.get(id)?.session;if(key&&sessions.has(key))endSocial(sessions.get(key),false);}
function stepSocial(dt){for(const session of [...sessions.values()]){const a=byId(session.a),b=byId(session.b),ra=runtime.get(session.a),rb=runtime.get(session.b);if(!a||!b||!S.ready(a)||!S.ready(b)||ra.feeding||rb.feeding||drag?.id===a.id||drag?.id===b.id){endSocial(session,false);continue;}session.age+=dt;if(session.phase==='meet'){if(session.age>20){endSocial(session,false);continue;}if(Math.hypot(a.x-ra.tx,a.y-ra.ty)<.8&&Math.hypot(b.x-rb.tx,b.y-rb.ty)<.8){session.phase='active';session.age=0;for(const rt of [ra,rb])rt.action=({play:'socialPlay',comfort:'socialComfort',apology:'socialApology'})[session.kind];}}else{session.pulse+=dt;if(session.pulse>=1.3){session.pulse=0;if(session.kind==='play'){kick(a,1.7,-2.1,-2.3);kick(b,1.7,-2.1,-2.3);}else{kick(a,.6,-.7,-.5);kick(b,.6,-.7,-.5);}particles(b,session.kind==='play'?'✧':'♥',2);}if(session.age>=4.4)endSocial(session,true);}}
socialTimer+=dt;if(socialTimer<6)return;socialTimer=0;let candidates=[];for(const a of s.clouds)for(const b of s.clouds){if(a===b||!available(a)||!available(b))continue;const r=relation(a,b),kind=S.propose(a,b,r,B.traits),score=S.score(a,b,r,B.traits,kind,Math.hypot(a.x-b.x,a.y-b.y));if(score>32)candidates.push({a,b,score});}candidates.sort((x,y)=>y.score-x.score);if(candidates.length&&Math.random()<.8)invite(candidates[0].a,candidates[0].b);}

// Utility decisions are throttled; motion remains frame-rate independent.
function changeAction(c,rt,action){const old=rt.action;rt.action=action;rt.actionAge=0;rt.playClock=0;rt.decideIn=4+Math.random()*3;
 if(action==='drink'){rt.tx=65;rt.ty=66;}
 else if(action==='hide'){rt.tx=c.x<50?17:83;rt.ty=83;}
 else if(action==='approach'){const target=caretakers.get(c.id);if(target&&target.until>Date.now()){rt.tx=clamp(target.x+(c.x<target.x?-10:10),12,88);rt.ty=clamp(target.y,60,89)}}
 else if(action==='wander'||action==='play'){rt.tx=clamp(c.x+(Math.random()-.5)*(action==='play'?31:19),12,88);rt.ty=clamp(c.y+(Math.random()-.5)*12,60,89);}
 else {rt.tx=c.x;rt.ty=c.y;}
 if(action==='nap'){c.rest=true;rt.action='rest';speak(c,'想睡个小觉……');log(c.name+'自己找了个地方睡着了。');save();}
 else if(old!==action&&['drink','approach','hide','wait','play'].includes(action)){speak(c,({drink:'去喝一点露水～',approach:'想和你待一会儿',hide:'这里安静一点……',wait:'没有露水啦……',play:'嘿咻！'})[action]);}
}
function autoStep(c,rt,dt){rt.wakeGrace=Math.max(0,rt.wakeGrace-dt);rt.drinkCooldown=Math.max(0,rt.drinkCooldown-dt);rt.socialCooldown=Math.max(0,rt.socialCooldown-dt);if(c.rest||drag?.id===c.id||rt.feeding)return;if(rt.session){const session=sessions.get(rt.session);if(session){if(session.phase==='meet')moveSocial(c,rt,dt);return;}}rt.actionAge+=dt;rt.decideIn-=dt;
 if(rt.decideIn<=0){const crowded=s.clouds.some(o=>o!==c&&Math.hypot(o.x-c.x,(o.y-c.y)*1.5)<14);const careTarget=caretakers.get(c.id);const ctx={stock:s.water,drinkCooldown:rt.drinkCooldown,caretaker:careTarget&&careTarget.until>Date.now(),recentCare:Date.now()-c.lastCare<45000,crowded,wakeGrace:rt.wakeGrace>0};let action=B.decide(c,ctx,rt.action).action;if(action!==rt.action||['wander','play','approach'].includes(action))changeAction(c,rt,action);else rt.decideIn=3+Math.random()*3;}
 if(c.rest)return;
 let dx=rt.tx-c.x,dy=rt.ty-c.y,len=Math.hypot(dx,dy);
 if(rt.action==='drink'&&len<3&&rt.drinkCooldown<=0){if(s.water>0&&c.water<60){s.water--;c.water=clamp(c.water+15);c.mood=clamp(c.mood+3);c.autoDrinks++;rt.drinkCooldown=12;kick(c,1.4,-1.7,-.9);particles(c,'✦',3);speak(c,'咕噜，自助喝水！');log(c.name+'自己喝了露水（消耗 1 水滴）。');changeAction(c,rt,'idle');render();save();}else changeAction(c,rt,s.water?'idle':'wait');return;}
 if(rt.action==='play'){rt.playClock+=dt;if(rt.playClock>=1.5){rt.playClock=0;kick(c,1.6,-2,-2.4);if(Math.random()<.35)particles(c,'✧',2);}}
 for(let other of s.clouds){if(other===c)continue;let ax=c.x-other.x,ay=(c.y-other.y)*1.5,dist=Math.hypot(ax,ay);if(dist<13&&dist>.01){let f=(13-dist)*.24*dt;c.x=clamp(c.x+ax/dist*f,12,88);c.y=clamp(c.y+ay/dist*f/1.5,60,89)}}
 if(len>.15){let speed=rt.action==='drink'?4.6:rt.action==='play'?4.3:1.4+B.traits[c.type].activity;let step=Math.min(len,speed*dt);c.x=clamp(c.x+dx/len*step,12,88);c.y=clamp(c.y+dy/len*step,60,89);}position(c);
}
const weatherNames={sun:'☀ 晴朗',rain:'☂ 露水细雨',rainbow:'☀ 彩虹时刻',storm:'ϟ 雷雨'};
function renderEcology(c){let w=E.current(s);$('scene').dataset.weather=w;$('weatherText').textContent=(s.night?'☾ 夜 · ':'')+weatherNames[w];$('growthLabel').textContent=E.stage(c)+' '+Math.floor(c.growth/E.GROW*100)+'%';$('nursery').querySelector('small').textContent=s.nest?'孵育中 · '+s.nest.remaining+'秒':'云种与成长';}
function familyText(c) {
    const parents = c.parents.map(id => byId(id)?.name || '未记录的云朵');
    const children = s.clouds.filter(other => other.parents.includes(c.id)).map(other => other.name);
    return [
        '双亲：' + (parents.join('、') || '暂无记录'),
        '子代：' + (children.join('、') || '暂无')
    ];
}

function updateNursery(c) {
    const progress = $('nurseryProgress');
    if (!progress) return;
    let summary = c.name + ' · ' + E.stage(c);
    if (c.growth < E.GROW) {
        const milestone = c.growth < 60 ? 60 : E.GROW;
        const next = milestone === 60 ? '少年' : '成年';
        summary += E.canGrow(c)
            ? ' · 距' + next + '还需 ' + (milestone - c.growth) + ' 秒'
            : ' · 成长暂停，水分需达 45、心情 40、精力 30';
    }
    progress.textContent = summary;
    const [parents, children] = familyText(c);
    $('nurseryParents').textContent = parents;
    $('nurseryChildren').textContent = children;
    const hatch = $('nurseryHatch');
    const nest = s.nest;
    hatch.textContent = nest
        ? nest.parents.map(id => byId(id)?.name).join(' 和 ') + '的云种 · 还需 ' + nest.remaining + ' 秒'
        : hatch.dataset.newborn ? hatch.dataset.newborn + '已经破壳啦！' : '';
    for (const row of $('modalBody').querySelectorAll('[data-nursery-peer]')) {
        const other = byId(Number(row.dataset.nurseryPeer));
        const reason = E.eligible(s, c, other, relation(c, other));
        row.querySelector('p').textContent = other.name + ' · ' + (reason || '可以共同育云');
        row.querySelector('button').disabled = !!reason;
    }
}

function openNursery(newborn = '') {
    const c = selected();
    const wrap = document.createElement('div');
    for (const id of ['nurseryProgress', 'nurseryParents', 'nurseryChildren', 'nurseryHatch']) {
        const line = p('');
        line.id = id;
        wrap.append(line);
    }
    wrap.querySelector('#nurseryHatch').dataset.newborn = newborn;
    if (!s.nest) {
        for (const other of s.clouds.filter(cloud => cloud !== c)) {
            const row = document.createElement('div');
            row.className = 'friend-row';
            row.dataset.nurseryPeer = other.id;
            const portrait = document.createElement('img');
            portrait.src = A(other.type);
            portrait.alt = '';
            const info = p('');
            const action = btn('共同育云', () => {
                if (!E.start(s, c, other, relation(c, other), Math.random())) return;
                log(c.name + '和' + other.name + '种下了一颗云种。');
                openNursery();
                render();
                save();
                toast('云种正在慢慢长大！');
            });
            row.append(portrait, info, action);
            wrap.append(row);
        }
    }
    modal('小小育云窝', wrap);
    updateNursery(c);
}
$('nursery').onclick=()=>openNursery();
let prev=performance.now(),acc=0,frameId=null;
function scheduleTick(){if(frameId===null&&running&&!document.hidden&&$('overlay').hidden)frameId=requestAnimationFrame(tick)}
function stopLoop(){if(frameId!==null){cancelAnimationFrame(frameId);frameId=null}}
function tick(t){frameId=null;if(!running||document.hidden||!$('overlay').hidden)return;const dt=Math.min((t-prev)/1000,.1);prev=t;try{stepSocial(dt);for(const c of s.clouds){const rt=runtime.get(c.id);if(!rt)continue;softStep(c,rt,dt);autoStep(c,rt,dt);}acc+=dt;if(acc>=1){acc-=1;s.elapsed++;s.day=E.dayAt(s.elapsed);const nest=s.nest;const events=E.advance(s,spawn,openSpot);for(const msg of events){log(msg);toast(msg)}if(events.length){render();save()}if(s.elapsed%10===0){for(const c of s.clouds){const rt=runtime.get(c.id);if(!rt)continue;Object.assign(c,B.metabolism(c,rt.action));if(c.rest&&c.energy>=100){c.rest=false;rt.wakeGrace=18;changeAction(c,rt,'idle');speak(c,'睡得真舒服！')}}save()}if(!$('overlay').hidden&&$('nurseryProgress')){if(nest&&!s.nest)openNursery(byId(nest.id).name);else updateNursery(selected())}render()}}catch(error){running=false;stopLoop();console.error('Cloud Keeper game loop stopped safely:',error);const foot=document.querySelector('.foot');if(foot)foot.textContent='牧场遇到运行错误，已暂停。请导出存档后刷新页面。';toast('牧场暂时暂停，当前进度不会被自动覆盖。');return}scheduleTick()}
render();window.addEventListener('pagehide',()=>{if(running)save()});window.addEventListener('beforeunload',()=>{if(running)save()});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopLoop();if(running)save()}else{prev=performance.now();scheduleTick()}});
$('overlay').addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeModal();return}if(event.key!=='Tab')return;const focusable=[...$('overlay').querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden);if(!focusable.length){event.preventDefault();$('closeModal').focus();return}const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});

})();