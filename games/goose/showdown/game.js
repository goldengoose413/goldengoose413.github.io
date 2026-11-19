'use strict';
const $=id=>document.getElementById(id),c=$('game'),g=c.getContext('2d');
const roster=[{name:'GOLDEN GOOSE',image:'assets/fighter0.png',color:'#f4c563',move:'GOLD RUSH',desc:'Springfield’s golden champion. Gold Rush launches a blazing golden projectile.'},{name:'CRIMSON CHALLENGER',image:'assets/fighter2.png',color:'#ff5a58',move:'CRIMSON FLARE',desc:'Relentless pressure. Crimson Flare burns a path through the competition.'},{name:'THE RINGMASTER',image:'assets/fighter3.png',color:'#c185ff',move:'CURTAIN CALL',desc:'The show belongs to him. Curtain Call unleashes a burst of carnival energy.'},
{name:'DARK VAPOR',image:'assets/fighter4.png',color:'#55ddeb',move:'VAPE CLOUD',kind:'vapor',desc:'The armored cloud machine. Vape Cloud slows opponents for two seconds. Special: 40 power.'},
{name:'LOST CITY WARRIOR',image:'assets/fighter5.png',color:'#d9bc8b',move:'RUIN RUSH',kind:'dash',desc:'The blade of the Lost City. Ruin Rush closes the distance with a charging sword strike. Special: 40 power.'},
{name:'STAR COMMANDER',image:'assets/fighter6.png',color:'#80b8fa',move:'STAR RETURN',kind:'star',desc:'A Springfield defender in mirrored gold. Star Return throws a star that curves back for a second pass. Special: 40 power.'},
{name:'SUPER GOOSE',image:'assets/fighter7.png',color:'#ffe183',move:'SONIC HONK',kind:'honk',desc:'The feathered powerhouse. Sonic Honk knocks back nearby opponents with a golden shockwave. Special: 40 power.'},
{name:'THE VIKING',image:'assets/fighter8.png',color:'#b4d4e8',move:'FROST AXE',kind:'axe',desc:'Fur, steel, and fury. Frost Axe arcs through the air for a heavy hit. Special: 40 power.'},
{name:'PAYROLL CUTTER',image:'assets/fighter9.png',color:'#82f49b',move:'BUDGET CUT',kind:'cut',desc:'Every hour is accounted for. Budget Cut fires energy scissors that drain the opponent’s power. Special: 40 power.'},
{name:'ANTHONY SILVER',image:'assets/fighter10.png',color:'#dce7ff',move:'SILVER SURGE',kind:'silver',desc:'The executive enters the arena. Silver Surge launches a crackling burst of silver energy. Special: 40 power.'},
{name:'CHIPPY',image:'assets/fighter11.png',color:'#68e6a2',move:'SURPRISE PRESENT',kind:'gift',desc:'Small elf. Big surprise. Surprise Present tosses a gift box that briefly stuns on an unblocked hit. Special: 40 power.'},
{name:'THE PUPPET QUEEN',image:'assets/fighter12.png',color:'#f79bcc',move:'ROYAL CACKLE',kind:'cackle',desc:'Drama, hair, and a dangerous laugh. Royal Cackle pushes back opponents within its sonic ring. Special: 40 power.'},
{name:'RADIO COMMANDER',image:'assets/fighter14.png',color:'#84d7ff',move:'RADIO WAVE',kind:'radio',desc:'Clear the channel. Radio Wave fires a signal pulse that briefly disrupts an unguarded opponent. Special: 40 power.'},
// Fighter 19 — THE QUEEN OF THE HOUSE (Carmen, the Dark Queen). Added Nov 19, 2026 on Daniel's explicit approval ("you can add her") — a normal playable roster fighter.
{name:'THE QUEEN OF THE HOUSE',color:'#ff6f91',move:'PETAL STORM',kind:'petals',image:'assets/fighter18.png?v=stance-2026-11-19',desc:'The Dark Queen takes her throne in the arena. Petal Storm sends a whirlwind of hibiscus petals down the lane. Special: 40 power.'}];

const imgs=roster.map((f,i)=>{let im=new Image();im.src=f.image||'assets/fighter'+i+'.png';return im});
let selected=0, opponentPick=3, nextSeat=0, fighters=[],state='menu', paused=false,round=1,timer=60,particles=[],shots=[],notice='',noticeT=0,shake=0,clock=0,last=0,roundDelay=0,activeStage='carnival',activeMode='cpu',level='normal',audioOn=false,ctx,stats={wins:0,matches:0};
try{stats=JSON.parse(localStorage.getItem('circusStats'))||stats}catch{}
const keys=new Set();
function showInfo(i){$('selected-name').textContent=roster[i].name;$('fighter-info').textContent=roster[i].desc.replace(' Special: 40 power.','')+'  ·  Speed '+Math.round(roster[i].speed*100)+'  /  Power '+Math.round(roster[i].powerStat*100)+'  /  Defense '+Math.round(roster[i].defense*100)+'  ·  '+roster[i].superName+'  ·  String '+roster[i].string.map(a=>({punch:'X',kick:'A',heavyPunch:'Y',heavyKick:'B',special:'RB'})[a]).join(' → ')}
function renderPicks(){document.querySelectorAll('.fighter').forEach((b,j)=>{b.classList.toggle('selected',j===selected);b.classList.toggle('oppick',j===opponentPick);b.setAttribute('aria-pressed',String(j===selected))});const s=$('pick-status');if(s)s.textContent='P1 · '+roster[selected].name+'  vs  P2 · '+roster[opponentPick].name+'   —   tap a fighter for P1, tap another for P2'}
function choose(i){selected=i;showInfo(i);renderPicks();idle()}
function setOpponent(i){opponentPick=i;showInfo(i);renderPicks();idle()}
function tileClick(i){if(nextSeat===0)choose(i);else setOpponent(i);nextSeat=1-nextSeat}
roster.forEach((f,i)=>{let b=document.createElement('button');b.className='fighter';b.setAttribute('aria-label','Choose '+f.name);b.innerHTML='<img src="'+imgs[i].src+'" alt=""><span>'+f.name+'</span>';b.onclick=()=>tileClick(i);$('roster').append(b)});renderPicks();
// Match state and round transitions.
function fighter(i,x,side){return {i,x,side,y:0,vy:0,hp:100,power:100,wins:0,cd:0,action:'idle',anim:0,stun:0,block:false,combo:0,lastHit:-Infinity,queued:null,pendingStrike:null,chainReady:false,dashTime:0,dashLock:0,slow:0,fx:0,thrownUntil:0,diveUntil:0,retreat:false}}
function idle(){if(state==='menu'||state==='matchover'){fighters=[fighter(selected,320,1),fighter(opponentPick,880,-1)]}}
$('stage').onchange=()=>{if(state==='menu'||state==='matchover'){activeStage=$('stage').value;$('arena-label').textContent=$('stage').selectedOptions[0].textContent}};
function show(title,txt,button){$('overlay-title').textContent=title;$('overlay-text').textContent=txt;$('start').textContent=button;$('overlay').classList.remove('hidden')}
function begin(){pairedMatch=false;document.body.classList.add('playing');document.querySelector('.arena-shell').scrollIntoView({block:'start'});keys.clear();activeStage=$('stage').value;activeMode=$('mode').value;level=$('difficulty').value;$('arena-label').textContent=$('stage').selectedOptions[0].textContent;fighters=[fighter(selected,320,1),fighter(opponentPick,880,-1)];historyKeys.length=0;$('inputs').textContent='Inputs';$('inputs').hidden=activeMode!=='training';round=1;paused=false;$('pause').textContent='Pause';newRound();$('overlay').classList.add('hidden');unlock()}
function newRound(){cinema=null;fighters.forEach((f,i)=>Object.assign(f,{x:i?880:320,y:0,vy:0,hp:100,power:100,counterUntil:0,blackoutUntil:0,comboDamage:0,prevX:i?880:320,prevY:0,cd:0,stun:0,anim:0,action:'idle',block:false,slow:0,fx:0,combo:0,lastHit:-Infinity,queued:null,pendingStrike:null,chainReady:false,dashTime:0,dashLock:0,thrownUntil:0,diveUntil:0,retreat:false}));shots=[];particles=[];timer=60;state='countdown';roundDelay=2.6;notice=round===1?roster[fighters[0].i].name+'  vs  '+roster[fighters[1].i].name:'Round '+round;cameraPush=.09;noticeT=2.6;$('status').textContent=activeMode==='cpu'?'YOU VS COMPUTER':'LOCAL TWO PLAYER'}
$('start').onclick=()=>{if(state==='paused'){togglePause()}else begin()};
function togglePause(){if(paused&&pairedMatch&&padState.indexes.length<2)return;if(state==='menu'||state==='matchover')return;paused=!paused;$('pause').textContent=paused?'Resume':'Pause';keys.clear();fighters.forEach(f=>{f.queued=null});if(paused){$('exit-match').hidden=false;show('Show on hold','Take a breath. Your fight will be waiting.','Resume');storeState=state;state='paused'}else{$('exit-match').hidden=true;state=storeState;$('overlay').classList.add('hidden')}}let storeState='fight';$('pause').onclick=togglePause;
$('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.querySelector('.arena-shell').requestFullscreen();else await document.exitFullscreen()}catch{$('status').textContent='Fullscreen unavailable · rotate your phone'}};
$('share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('share').textContent='Link copied ✓'}catch{$('share').textContent=location.href}};
// Audio: synthesized voices are silent until the user enables sound.
let soundMuted=false,noiseBuffer;
function syncSound(){
 const enabled=audioOn&&ctx?.state==='running';
 $('sound').textContent=soundMuted?'Sound off':enabled?'Sound on':'Enable sound';
 $('sound').setAttribute('aria-pressed',String(!!enabled));
 $('unlock-sound').hidden=!!enabled||soundMuted;
}
async function initAudio(){
 if(soundMuted)return;
 try{
   ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();
   ctx.onstatechange=syncSound;
   if(ctx.state!=='running')await ctx.resume();
   audioOn=ctx.state==='running';syncSound();
 }catch{audioOn=false;syncSound()}
}
function unlock(){if(!soundMuted&&(!audioOn||ctx?.state!=='running')){$('unlock-sound').hidden=false;initAudio()}}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#sound'))unlock()},{capture:true});
document.addEventListener('keydown',unlock);
$('unlock-sound').onclick=unlock;
// Short noise bursts model cloth, leather contact and the low body of an impact.
// Two original, sample-aligned loops share one clock so the percussion can enter mid-bar.
let musicEnabled=true;
// Background music: the Golden Goose Tetris soundtrack as separate files in
// music/, played in the same order the songs play in Tetris, on loop.
const playlist=[
 {title:'THE GOLDEN GOOSE',src:'music/01-the-golden-goose.mp3'},
 {title:'THE GOLDEN GOOSE (ARENA)',src:'music/02-the-golden-goose-arena.mp3'},
 {title:'THE GOLDEN GOOSE — MAIN EVENT 2',src:'music/03-main-event-2.mp3'},
 {title:'WELCOME, SILVER GOOSE',src:'music/04-welcome-silver-goose.mp3'}
];
let trackIndex=0;
const bgm=new Audio();bgm.preload='auto';bgm.src=playlist[0].src;
bgm.addEventListener('ended',()=>{trackIndex=(trackIndex+1)%playlist.length;bgm.src=playlist[trackIndex].src;updateMusic()});
try{musicEnabled=localStorage.getItem('circusMusic')!=='off'}catch{}
function musicLabel(){
 $('music').textContent=musicEnabled?'Music on':'Music off';
 $('music').setAttribute('aria-pressed',String(musicEnabled));
}
$('music').onclick=()=>{
 musicEnabled=!musicEnabled;
 try{localStorage.setItem('circusMusic',musicEnabled?'on':'off')}catch{}
 musicLabel();if(musicEnabled)unlock();updateMusic();
};
musicLabel();
function updateMusic(){
 const playing=state!=='menu'&&state!=='matchover'&&!paused&&!document.hidden;
 const want=musicEnabled&&!soundMuted&&audioOn&&playing;
 const np=$('now-playing');
 if(state==='menu'||state==='matchover'){
   if(trackIndex!==0){trackIndex=0;bgm.src=playlist[0].src}
   try{bgm.currentTime=0}catch{}
 }
 if(want){
   if(bgm.paused)bgm.play().catch(()=>{});
   if(np)np.textContent='♪ '+playlist[trackIndex].title;
 }else{
   if(!bgm.paused)bgm.pause();
   if(np)np.textContent='';
 }
}
document.addEventListener('visibilitychange',updateMusic);

function foleyBand(at, duration, frequency, endFrequency, volume, rise=.002, q=.72) {
 if(!noiseBuffer){
   noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
   const samples=noiseBuffer.getChannelData(0);
   for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
 }
 const src=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), env=ctx.createGain();
 src.buffer=noiseBuffer; filter.type='bandpass';filter.Q.value=q;
 filter.frequency.setValueAtTime(frequency,at);
 filter.frequency.exponentialRampToValueAtTime(endFrequency,at+duration);
 env.gain.setValueAtTime(.0001,at);
 env.gain.exponentialRampToValueAtTime(volume,at+rise);
 env.gain.exponentialRampToValueAtTime(.0001,at+duration);
 src.connect(filter);filter.connect(env);env.connect(ctx.destination);
 src.start(at,Math.random()*.6);src.stop(at+duration);
 src.onended=()=>{src.disconnect();filter.disconnect();env.disconnect()};
}
function swingSound(move){
 if(!audioOn||ctx?.state!=='running')return;
 const kick=/kick/i.test(move);
 foleyBand(ctx.currentTime,kick?.15:.09,kick?1400:2400,kick?480:740,kick?.15:.09,.025);
}
function impactSound(move,guard){
 if(!audioOn||ctx?.state!=='running')return;
 const t=ctx.currentTime, pitch=.89+Math.random()*.22;
 const heavy=/heavy|special/.test(move),kick=/kick/i.test(move);
 if(guard){
   foleyBand(t,.075,1500*pitch,670,.52);
   foleyBand(t+.008,.095,430*pitch,210,.60);return;
 }
 foleyBand(t,heavy?.07:.048,(kick?1650:2600)*pitch,820,heavy?.65:.48);
 foleyBand(t+.003,heavy?.19:.125,(kick?245:335)*pitch,heavy?85:135,heavy?1.9:1.35,.005,.62);
 foleyBand(t+.012,heavy?.16:.09,700*pitch,275,kick?.9:.55,.004);
 if(heavy)foleyBand(t+.029,.08,1250*pitch,390,.24);
}
function tone(freq,duration=.08,type='triangle'){if(!audioOn||!ctx)return;let o=ctx.createOscillator(),a=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq/3),ctx.currentTime+duration);a.gain.setValueAtTime(.09,ctx.currentTime);a.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(a);a.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration)}
$('sound').onclick=()=>{soundMuted=audioOn&&ctx?.state==='running';audioOn=false;if(!soundMuted)initAudio().then(()=>tone(480));syncSound()};
const playerBindings = [
  {left:'a', right:'d', jump:'w', block:'s', punch:'j', heavyPunch:'u', kick:'k', heavyKick:'i', special:'l', dash:'h',super:'o',breaker:'b',throw:'g'},
  {left:'arrowleft', right:'arrowright', jump:'arrowup', block:'arrowdown', punch:'1', heavyPunch:'4', kick:'2', heavyKick:'5', special:'3', dash:'6',super:'9',breaker:'8',throw:'7'}
];
const strikes = {
  punch:      {damage:7,  range:150, startup:.035, recovery:.18, height:175},
  heavyPunch: {damage:13, range:170, startup:.09,  recovery:.32, height:165},
  kick:       {damage:9,  range:183, startup:.055, recovery:.24, height:98},
  heavyKick:  {damage:17, range:210, startup:.12,  recovery:.41, height:124},
  airPunch:   {damage:8,  range:155, startup:.04,  recovery:.2,  height:175},
  airKick:    {damage:12, range:190, startup:.06,  recovery:.26, height:120}
};

// Editable fighter tuning, cinematic choreography and move definitions.
const GAME={fighters:roster,moves:strikes};
const signatures=[
 ['Gilded Orbit','The crown stays in Springfield.',1.04,1.02,.98],
 ['Midnight Watch','The city sleeps easy.',.96,1.05,1.08],
 ['Scarlet Comet','Keep up next time.',1.13,.98,.92],
 ['Three Ring Eclipse','Take your bow.',1.02,1.03,.96],
 ['Cloud Chamber','Lost in the fog again?',.95,1.04,1.09],
 ['Sunken Spire','The city remembers.',1.08,1.02,.94],
 ['Orbital Salute','Clear skies ahead.',1.05,1,.99],
 ['Flight of Gold','That was the warm-up honk.',.94,1.12,1.02],
 ['Winter Solstice','Even winter yields.',.87,1.16,1.12],
 ['Closing Ledger','Consider us even.',1.09,.97,.98],
 ['Silver Dividend','Meeting adjourned.',1.1,1.01,.93],
 ['Gift Avalanche','Here’s your receipt!',1.18,.91,.9],
 ['Velvet Ovation','One more curtain call.',1.03,1.06,.95],
 ['Alliance Anthem','Together we stand.',.91,1.09,1.14],
 ['Dead Air','Over and out.',1.12,.96,.97],
 ['Satin Knockout','You saw the jacket. You should’ve ducked.',1.09,1.04,.95],
 ['The Last Lock','Keep the cuffs.',.99,1.07,1.04],
 ['Midnight Bloom','Sweet dreams, darling.',1.08,1.01,.95],
 ['Royal Decree','The house always wins.',1,1.06,1.05]
];
signatures.forEach(([superName,quote,speed,powerStat,defense],i)=>{
 Object.assign(GAME.fighters[i],{superName,quote,speed,powerStat,defense,beats:3+i%3,arc:(i-7)*.18,
 string:['punch','kick','heavyPunch','heavyKick','special'].slice(0,3+i%3)});
});
let cinema=null;
function meterAction(f,action){
 const enemy=fighters[1-fighters.indexOf(f)];
 if(action==='breaker'){
   if(f.stun>0 && f.power>=200){f.power-=200;f.stun=0;enemy.stun=.45;enemy.combo=0;enemy.lastHit=-Infinity;enemy.pendingStrike=null;shots=[];enemy.x-=f.side*-70;burst(f.x,340-f.y,'#fff',32);notice='Combo break';noticeT=.55}
   return;
 }
 if(f.stun>0||f.cd>0)return;
 if(action==='super' && f.power>=300){
   f.power=0;f.block=false;f.cd=.8;
   if(Math.abs(enemy.x-f.x)>330||enemy.block){notice='Super avoided';noticeT=.55;return}
   cinema={f,enemy,time:0,beat:0};notice=roster[f.i].superName;noticeT=1.6;freezeFrames=6;cameraPush=.12;
 }
 if(action==='enhanced' && f.power>=100){f.power-=100;f.block=false;f.enhanced=true;attack(f,'special');f.enhanced=false}
}
// Fifteen distinct paths: use original roster colors and motifs for each spotlight.
function drawSuper(){
 if(!cinema)return;
 const {f,enemy,time}=cinema, data=roster[f.i];
 const motif=['orbit','shadow','flare','rings','vapor','spire','star','wings','axe','cut','silver','gift','cackle','crest','radio','wings','rings','wings','petals'][f.i];
 g.save();g.fillStyle='#07081560';g.fillRect(0,0,1200,580);
 g.translate(enemy.x,330-enemy.y);g.strokeStyle=data.color;g.fillStyle=data.color;
 g.lineWidth=4;g.rotate(Math.sin(time*3)*data.arc);
 for(let n=0;n<data.beats+2;n++){
   g.save();g.rotate(time*(1+f.i*.11)+n*Math.PI*2/(data.beats+2));g.translate(62+time*27,0);
   if(['orbit','rings','radio','cackle'].includes(motif)){g.beginPath();g.ellipse(0,0,12+n*3,5+f.i,0,0,7);g.stroke()}
   else if(['gift','crest','shadow','spire'].includes(motif)){g.strokeRect(-9,-8,18,18+n*5)}
   else if(['axe','cut','silver','star'].includes(motif)){g.beginPath();g.moveTo(-24,8);g.lineTo(0,-18);g.lineTo(5,-2);g.lineTo(24,-8);g.stroke()}
   else{g.globalAlpha=.5;g.beginPath();g.ellipse(0,0,16+n*2,8+f.i,.4,0,7);g.fill()}
   g.restore();
 }
 g.restore();
}
function cinematicTick(dt){
 const seq=cinema,data=roster[seq.f.i];seq.time+=dt;clock+=dt*.25;cameraPush=.10;
 seq.f.anim=.2;seq.f.action='heavyPunch';seq.f.fx=.4;
 if(seq.time>.32+seq.beat*.18 && seq.beat<data.beats){
   seq.beat++;seq.f.y=Math.abs(Math.sin(seq.beat+data.arc))*48;
   seq.enemy.y=Math.abs(Math.sin(seq.beat*data.arc))*65;
   hit(seq.enemy,seq.f,34/data.beats,true);
 }
 if(seq.time>.6+data.beats*.18){seq.f.y=0;seq.enemy.y=0;cinema=null;noticeT=.2;if(seq.enemy.hp<=0&&activeMode!=='training')endRound()}
}
function queueAction(player, action) {
  if(cinema)return;
  if (state !== 'fight' || (player === 1 && activeMode !== 'versus')) return;
  const f=fighters[player];
  if(activeMode==='training'){historyKeys.push(action);if(historyKeys.length>7)historyKeys.shift();$('inputs').textContent=historyKeys.join(' › ')}
  if(inputDown(playerBindings[player].block) && Object.hasOwn(strikes,action))action='enhanced';
  if(['enhanced','breaker','super'].includes(action)){meterAction(f,action);return}
  f.queued = {action, expires:clock + .16};
}
function pressKey(key) {
  keys.add(key);
  playerBindings.forEach((bindings, player) => {
    for (const [action, binding] of Object.entries(bindings)) {
      if (binding === key && !['left','right','block'].includes(action)) queueAction(player, action);
    }
  });
}
const used = new Set(playerBindings.flatMap(bindings => Object.values(bindings)));
addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['SELECT','INPUT'].includes(event.target.tagName)) return;
  if (used.has(key)) {
    event.preventDefault();
    if (!event.repeat) pressKey(key);
  }
  if (!event.repeat && key==='escape' && paused){padReturnToMenu();return}
  if (!event.repeat && (key === 'escape' || key === 'p')) togglePause();
});
addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
addEventListener('blur', () => {
  keys.clear();
  if (!paused && ['fight','countdown','roundover'].includes(state)) togglePause();
});
document.querySelectorAll('[data-key]').forEach(button => {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pressKey(button.dataset.key);
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    button.addEventListener(event, () => keys.delete(button.dataset.key));
  }
});

function resolveStrike(fighter, opponent, dt) {
  const pending = fighter.pendingStrike;
  if (!pending) return;
  pending.remaining -= dt;
  if (pending.remaining > 0) return;
  fighter.pendingStrike = null;
  const move = strikes[pending.type];
  const distance = (opponent.x - fighter.x) * pending.direction;
  const yTol = pending.type.startsWith('air') ? 180 : 105;
  if (distance >= 0 && distance <= move.range && Math.abs(opponent.y - fighter.y) < yTol) {
    if (opponent.counterUntil > clock && !opponent.stun) {
      opponent.counterUntil = 0;
      opponent.action = 'heavyPunch';
      opponent.anim = .24;
      hit(fighter, opponent, opponent.counterDamage, true, 'heavyPunch');
      return;
    }
    fighter.chainReady = !opponent.block && fighter.combo<4;
    hit(opponent, fighter, move.damage, false, pending.type);
  }
}
// Throw/grapple: close-range and unblockable — it beats a held block, pops
// the victim into the air and slides them away. Whiffing costs real recovery.
function attemptThrow(f){
 if(f.cd>0||f.stun>0||f.block||state!=='fight'||f.y>0)return;
 const enemy=fighters[1-fighters.indexOf(f)];
 f.action='throw';f.anim=.45;f.cd=.55;swingSound('heavyPunch');
 const dist=(enemy.x-f.x)*f.side;
 if(dist>=-15&&dist<=128&&enemy.y===0){
   enemy.block=false;
   hit(enemy,f,11,false,'heavyPunch');
   enemy.stun=.55;enemy.vy=300;enemy.y=Math.max(1,enemy.y);enemy.thrownUntil=clock+.5;
   enemy.x=Math.max(90,Math.min(1110,enemy.x+f.side*110));
   notice='THROW!';noticeT=.6;
 }
}
function attack(f,type){if(f.cd>0||f.stun>0||f.block||state!=='fight')return;
// Jumping attacks: strikes thrown mid-air become air strikes; a heavy kick
// in the air turns into a diving kick that carries the fighter forward-down.
if(f.y>0){
  if(type==='punch'||type==='heavyPunch')type='airPunch';
  else if(type==='kick')type='airKick';
  else if(type==='heavyKick'){type='airKick';f.diveUntil=clock+.45;f.vy=Math.min(f.vy,-280)}
}
if (strikes[type]) {
  const move = strikes[type];
  f.chainReady = false;
  f.action = type;
  f.anim = f.cd = move.startup + move.recovery;
  f.pendingStrike = {type, direction:f.side, remaining:move.startup};
  swingSound(type);
  return;
}
f.action=type;f.anim=.32;f.cd=type==='punch'?.34:type==='kick'?.58:.8;swingSound(type);let enemy=fighters[1-fighters.indexOf(f)];if(type==='special'){f.chainReady=false;f.fx=.6;let kind=roster[f.i].kind||'orb';notice=roster[f.i].move;noticeT=.9;
if(kind==='counter'){
  f.counterUntil=clock+.35;
  f.counterDamage=f.enhanced?30:22;
  burst(f.x+f.side*35,330-f.y,roster[f.i].color,12);
}
else if(kind==='dash'){let travel=Math.min(260,Math.max(0,Math.abs(enemy.x-f.x)-105));f.x=Math.max(90,Math.min(1110,f.x+f.side*travel));burst(f.x-f.side*45,390-f.y,roster[f.i].color,25);if(Math.abs(enemy.x-f.x)<200&&Math.abs(f.y-enemy.y)<100)hit(enemy,f,f.enhanced?32:23)}
else if(kind==='honk'||kind==='cackle'){burst(f.x,340-f.y,roster[f.i].color,38);if(Math.abs(enemy.x-f.x)<310&&Math.abs(f.y-enemy.y)<140){let blocked=enemy.block;hit(enemy,f,f.enhanced?32:22);enemy.x=Math.max(90,Math.min(1110,enemy.x+f.side*(blocked?20:100)))}}
else shots.push({x:f.x+f.side*65,y:350-f.y,v:(.81+.04*f.i)*f.side*(kind==='vapor'?330:kind==='axe'?470:620),vy:kind==='axe'?-260:kind==='gift'?-160:0,owner:f,enhanced:f.enhanced,life:kind==='star'?2.4:2,color:roster[f.i].color,kind,age:0,turned:false,hits:0,grace:0});}}
// Combat resolution: only confirmed hits advance a string. Cap total combo damage at 40 HP.
function hit(v,a,base,special=base>=18,sound='special') {
 const blocked=v.block && !v.y;
 const perfect=blocked && clock-(v.guardStart??-1)<.1;
 if(clock-a.lastHit>.68){a.combo=0;a.comboDamage=0}
 let damage=base*(roster[a.i].powerStat||1)/(roster[v.i].defense||1);
 damage=blocked?(special&&!perfect?damage*.12:0):Math.min(40-(a.comboDamage||0),damage*Math.max(.38,1-a.combo*.17));
 v.hp=Math.max(0,v.hp-damage);
 v.counterUntil=0;v.pendingStrike=null;v.chainReady=false;v.dashTime=0;
 v.stun=perfect?.035:blocked?.12:.24;
 if(!blocked){a.combo++;a.comboDamage=(a.comboDamage||0)+damage;a.lastHit=clock}
 if(!blocked && (v.y>0 || a.combo===3)){v.vy=260;v.y=Math.max(1,v.y)}
 const corner=v.x<115||v.x>1085;
 v.x=Math.max(90,Math.min(1110,v.x+a.side*(blocked?25:9)));
 if(corner&&!blocked&&base>=13){v.vy=280;v.y+=4;v.x-=a.side*38}
 a.power=Math.min(300,a.power+damage*2);v.power=Math.min(300,v.power+damage*1.35+(perfect?12:0));
 const weight=special?6:base>=12?4:2;
 freezeFrames=blocked?2:weight;impact=blocked?.04:weight*.025;cameraPush=weight>=4?.012*weight:0;shake=blocked?2:weight*1.6;
 burst(v.x,345-v.y,blocked?'#a6d7ed':roster[a.i].color,blocked?10:24);
 impactSound(sound,blocked);
 if(navigator.vibrate && v===fighters[0])navigator.vibrate(weight*5);
 if(perfect){notice='Perfect block';noticeT=.45}
}
function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*450,vy:(Math.random()-.65)*350,life:.3+Math.random()*.35,color})}
// Physics: movement, jump direction, dashes and attack recovery.
function control(f, dt, bindings) {
  const direction = Number(inputDown(bindings.right)) - Number(inputDown(bindings.left));
  if(!f.y)f.airDash=false;
  const wasBlocking=f.block;
  f.block = inputDown(bindings.block) && f.y === 0 && f.cd <= 0 && f.dashTime <= 0;
  if(f.block&&!wasBlocking)f.guardStart=clock;
  f.dashLock = Math.max(0, f.dashLock - dt);
  if (f.queued && f.queued.expires < clock) f.queued = null;
  if (f.stun > 0 || f.block) return;
  if (f.chainReady && f.queued && (Object.hasOwn(strikes,f.queued.action)||f.queued.action==='special') && f.cd<.32 && clock-f.lastHit<.32) {
    f.cd = 0;
    f.chainReady = false;
  }
  if (f.queued && f.cd <= 0 && f.dashTime <= 0) {
    const action = f.queued.action;
    f.queued = null;
    if (action === 'throw') {
      attemptThrow(f);
    } else if (action === 'dash') {
      if ((!f.y || !f.airDash) && f.dashLock === 0) {
        f.airDash=!!f.y;
        f.dashDirection = direction || f.side;
        f.retreat = f.dashDirection === -f.side;
        f.dashTime = f.retreat ? .17 : .145;
        f.dashLock = .37;
      }
    } else if (action === 'jump') {
      if (f.y === 0) f.vy = 650;
    } else attack(f, action);
  }
  if (f.dashTime > 0) {
    f.x += f.dashDirection * (f.retreat ? 940 : 830) * Math.min(dt,f.dashTime) * (f.slow > 0 ? .5 : 1);
    f.dashTime = Math.max(0,f.dashTime-dt);
    f.action = 'dashStep';
  } else {
    const speed = f.cd > 0 && f.y === 0 ? 62 : 330;
    f.x += direction * speed * (roster[f.i].speed||1) * dt * (f.slow > 0 ? .5 : 1);
    if (direction && f.anim <= 0) f.action = 'walk';
  }
}
// AI samples visible spacing and animations on a difficulty-dependent reaction clock.
let aiT=0,aiDirection=0;
function ai(f,dt){
 const enemy=fighters[0],distance=Math.abs(enemy.x-f.x);
 aiT-=dt;
 if(aiT<=0){
   const hard=level==='hard',rookie=level==='easy';
   aiT=(hard?.17:rookie?.52:.29)+Math.random()*.14;
   const roll=Math.random();
   f.block=!f.stun&&!f.cd&&distance<230&&roll<(rookie?.07:hard?.36:.25);
   if(f.block)f.guardStart=clock;
   aiDirection=distance>150?1:roll<.25?-1:0;
   if(hard&&f.stun&&f.power>=200){meterAction(f,'breaker');return}
   if(f.stun||f.block||(rookie&&roll<.32))return;
   if(hard&&distance<260&&f.power>=300&&roll>.5){meterAction(f,'super');return}
   if(hard&&distance<205&&enemy.cd>.12&&!enemy.pendingStrike){attack(f,'heavyPunch');return}
   if(f.y>0&&distance<215&&!f.pendingStrike){attack(f,Math.random()<.5?'kick':'punch');return}
   if(distance<132&&enemy.block&&roll<.55){attemptThrow(f);return}
   if(distance<210 && roster[f.i].kind==='counter' && enemy.pendingStrike)attack(f,'special');
   else if(distance<210)attack(f,['punch','kick','heavyPunch','heavyKick'][Math.floor(Math.random()*4)]);
   else if(distance>250&&distance<440&&roll>.88&&!f.y)f.vy=650;
   else if(roll>.74){if(hard&&f.power>=100)meterAction(f,'enhanced');else attack(f,'special')}
 }
 if(!f.block&&!f.stun&&!f.cd){f.x+=aiDirection*f.side*roster[f.i].speed*235*dt*(f.slow?.5:1);if(aiDirection)f.action='walk'}
}
function endRound(){state='roundover';roundDelay=2.5;let a=fighters[0],b=fighters[1];let win=a.hp===b.hp?null:a.hp>b.hp?a:b;if(win)win.wins++;tone(145,.45,'sawtooth');notice=win?roster[win.i].name+' WINS':'DRAW';noticeT=2.5;tone(500,.5);if(win&&win.wins===2){stats.matches++;if(win===a)stats.wins++;try{localStorage.setItem('circusStats',JSON.stringify(stats))}catch{}}}
// Finale is optional. Expiry and skip both lead to the same rematch screen.
let finalTime=0,finalWinner=0;
function victory(){
 const data=roster[fighters[finalWinner].i];state='matchover';noticeT=0;
 document.body.classList.remove('playing');$('finale').hidden=true;
 show(data.name+' wins',data.quote,'Rematch');record();
}
function finish(player){
 if(state!=='finishPrompt'||player!==finalWinner)return;
 state='finale';finalTime=2.9;$('finale').hidden=true;noticeT=0;
 const winner=fighters[player],side=winner.side;
 winner.x=600-side*100;winner.prevX=winner.x;winner.y=0;winner.anim=0;
 shots=[];particles=[];shake=0;swingSound('heavyKick');

}
$('finale').onclick=()=>finish(finalWinner);
addEventListener('keydown',event=>{if(event.key==='f'||event.key==='0')finish(event.key==='f'?0:1)});
function finalTick(dt){
 finalTime-=dt;
 if(state==='finishPrompt'&&activeMode==='cpu'&&finalWinner===1&&finalTime<6.9)finish(1);
 if(state==='finale' && finalTime<=1.95 && finalTime+dt>1.95)impactSound('heavyPunch',false);
 if(finalTime<=0)victory();
}
// Training dummy and bounded input history.
const historyKeys=[];
$('mode').onchange=()=>{$('dummy-label').hidden=$('mode').value!=='training'};
function dummyTick(f){
 f.block=$('dummy').value==='Block' && !f.y;
 if($('dummy').value==='Jump'&&!f.y)f.vy=650;
}
function update(dt){if(state==='finishPrompt'||state==='finale'){clock+=dt;finalTick(dt);return}if(cinema){cinematicTick(dt);return}clock+=dt;noticeT=Math.max(0,noticeT-dt);shake=Math.max(0,shake-dt*30);particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=450*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);if(state==='countdown'){roundDelay-=dt;if(roundDelay<.65)notice='FIGHT!';if(roundDelay<=0){state='fight';noticeT=.5}return}if(state==='roundover'){roundDelay-=dt;if(roundDelay<=0){if(fighters.some(f=>f.wins===2)){state='finishPrompt';finalWinner=fighters.findIndex(f=>f.wins===2);finalTime=8;notice='Finish the act';noticeT=1.4;$('finale').hidden=activeMode==='cpu'&&finalWinner===1;$('status').textContent='Finish · R3 or '+(finalWinner?'0':'F')}else{round++;newRound()}}return}if(state!=='fight')return;if(activeMode==='training'){fighters.forEach(f=>{f.hp=100;f.power=300})}else timer-=dt;fighters.forEach((f,i)=>{f.cd=Math.max(0,f.cd-dt);f.stun=Math.max(0,f.stun-dt);f.anim=Math.max(0,f.anim-dt);if(f.cd<=0)f.chainReady=false;f.slow=Math.max(0,f.slow-dt);f.fx=Math.max(0,f.fx-dt);f.side=f.x<fighters[1-i].x?1:-1;if(f.anim<=0)f.action='idle';f.y=Math.max(0,f.y+f.vy*dt);f.vy-=1550*dt;if(f.y===0){f.vy=0;if(f.pendingStrike&&f.pendingStrike.type.startsWith('air'))f.pendingStrike=null}if(f.diveUntil>clock&&f.y>0)f.x+=f.side*380*dt});control(fighters[0],dt,playerBindings[0]);if(activeMode==='cpu')ai(fighters[1],dt);else if(activeMode==='training')dummyTick(fighters[1]);else control(fighters[1],dt,playerBindings[1]);let [a,b]=fighters;resolveStrike(a,b,dt);resolveStrike(b,a,dt);if(Math.abs(a.x-b.x)<100&&Math.abs(a.y-b.y)<130){let mid=Math.max(140,Math.min(1060,(a.x+b.x)/2));let sign=a.x<=b.x?-1:1;a.x=mid+sign*50;b.x=mid-sign*50}fighters.forEach(f=>f.x=Math.max(90,Math.min(1110,f.x)));shots.forEach(s=>{s.x+=s.v*dt;if(s.kind==='orb')s.y+=Math.sin(s.age*8+s.owner.i)*(s.owner.i*65)*dt;if(s.kind==='petals')s.y+=Math.sin(s.age*7+s.owner.i)*46*dt;s.life-=dt;s.age+=dt;s.grace=Math.max(0,s.grace-dt);if(s.kind==='axe'||s.kind==='gift'){s.y+=s.vy*dt;s.vy+=(s.kind==='gift'?400:500)*dt}if(s.kind==='star'&&!s.turned&&(s.age>1.1||s.x>1130||s.x<70)){s.v=-s.v;s.turned=true;s.grace=0}let target=fighters.find(f=>f!==s.owner);let reach=s.kind==='vapor'?85:55;if(s.life>0&&s.grace<=0&&Math.abs(s.x-target.x)<reach&&Math.abs(s.y-(350-target.y))<105){let guarded=target.block&&target.y===0;hit(target,s.owner,s.enhanced?30:s.kind==='vapor'?12:s.kind==='gift'?18:s.kind==='axe'?25:s.kind==='star'?12:s.kind==='cut'?16:20,true);if(s.kind==='moths'&&!guarded){
 const caster=s.owner, direction=Math.sign(s.v);
 target.x=Math.max(90+Number(direction<0)*105,Math.min(1110-Number(direction>0)*105,target.x));
 caster.x=target.x+direction*105;
 caster.prevX=caster.x;caster.side=-direction;target.side=direction;
 caster.fx=.28;caster.blackoutUntil=clock+.28;
 burst(caster.x,340-caster.y,s.color,28);
}if(s.kind==='vapor'&&!guarded)target.slow=2;if(s.kind==='gift'&&!guarded)target.stun=.65;if(s.kind==='radio'&&!guarded)target.stun=.4;if(s.kind==='cut'&&!guarded)target.power=Math.max(0,target.power-25);s.hits++;if(s.kind==='star'&&s.hits<2)s.grace=.45;else s.life=0}});shots=shots.filter(s=>s.life>0&&s.x>0&&s.x<1200);if(activeMode!=='training'&&(timer<=0||fighters.some(f=>f.hp<=0)))endRound()}
function text(t,x,y,size,color='#e8dfd1',align='left'){g.textAlign=align;g.fillStyle=color;g.font='800 '+size+'px "Barlow Condensed",Impact,sans-serif';g.fillText(t,x,y)}
function background(){let bg=g.createLinearGradient(0,0,0,580);bg.addColorStop(0,'#111320');bg.addColorStop(.65,activeStage==='street'?'#3e2d33':'#4b2328');bg.addColorStop(1,'#100e16');g.fillStyle=bg;g.fillRect(0,0,1200,580);g.fillStyle='#cac0a050';g.beginPath();g.arc(890,110,59,0,7);g.fill();if(activeStage==='carnival'){for(let x=-130;x<1300;x+=340){g.fillStyle='#17121a';g.fillRect(x,240,330,240);g.beginPath();g.moveTo(x-55,245);g.quadraticCurveTo(x+140,160,x+165,95);g.quadraticCurveTo(x+190,160,x+385,245);g.closePath();g.fillStyle='#4b2028';g.fill();for(let j=0;j<7;j++){g.beginPath();g.moveTo(x+165,95);g.lineTo(x+j*55,245);g.lineTo(x+j*55+22,245);g.closePath();g.fillStyle='#23151e';g.fill()}g.fillStyle='#080910';g.beginPath();g.ellipse(x+165,388,65,106,0,Math.PI,0);g.fill();for(let k=0;k<12;k++){let bx=x+k*30,by=235+Math.sin(k/11*Math.PI)*22;g.fillStyle='#f0ba70';g.shadowColor='#f5a94d';g.shadowBlur=10;g.fillRect(bx,by,4,4);g.shadowBlur=0}}text('CIRCUS OF HORRORS',600,264,30,'#c9966870','center')}else{for(let i=0;i<13;i++){let x=i*110,h=150+(i*73%170);g.fillStyle=i%2?'#201d29':'#191b26';g.fillRect(x,460-h,105,h);for(let a=0;a<4;a++)for(let b=0;b<5;b++){g.fillStyle=(i+a+b)%3?'#c2974b44':'#090d16';g.fillRect(x+12+a*22,477-h+b*34,10,17)}}text('SPRINGFIELD',600,224,60,'#e0bf8b22','center')}
let floor=g.createLinearGradient(0,465,0,580);floor.addColorStop(0,'#49404b');floor.addColorStop(1,'#15131b');g.fillStyle=floor;g.fillRect(0,465,1200,115);g.strokeStyle='#b1a0a61a';g.lineWidth=1;for(let x=-1000;x<2200;x+=150){g.beginPath();g.moveTo(600+(x-600)*.4,465);g.lineTo(x,580);g.stroke()}for(let y=475;y<580;y+=(y-455)*.5){g.beginPath();g.moveTo(0,y);g.lineTo(1200,y);g.stroke()}for(let i=0;i<40;i++){let x=(i*137.1+Math.sin(clock+i)*20)%1200,y=480-((clock*24+i*31)%460);g.globalAlpha=.15+Math.sin(clock+i)*.13;g.fillStyle='#ffc578';g.fillRect(x,y,2,3)}g.globalAlpha=1}
// Scenery moves at a fraction of the fighters’ displacement.
function crowd(){
 const drift=(fighters.reduce((sum,f)=>sum+f.x,0)/2-600)*.12;
 g.save();g.translate(-drift,0);
 if(activeStage==='vault'){
   g.fillStyle='#162c39';g.fillRect(-100,0,1400,462);
   for(let i=0;i<9;i++){const x=i*165-30;g.strokeStyle='#b2995b';g.lineWidth=7;g.beginPath();g.arc(x,265,87,Math.PI,0);g.stroke();g.fillStyle='#394f53';g.fillRect(x-90,265,12,180)}
 }
 for(let i=0;i<5;i++){
   const x=i*310+Math.sin(clock*.7+i)*55;
   g.fillStyle=activeStage==='vault'?'#a8ebff12':'#ffe6a410';g.beginPath();g.moveTo(i*300,0);g.lineTo(x+95,462);g.lineTo(x-95,462);g.fill();
 }
 g.fillStyle='#100f18';for(let i=0;i<72;i++){const x=i*19-65,y=450+Math.sin(clock*2+i*7)*3;g.beginPath();g.arc(x,y,7,0,7);g.fill();g.fillRect(x-7,y+4,14,12)}
 g.restore();
}
// Joint landmarks in the source pose, measured at 140 pixels tall.
// shoulder, elbow, fist, hip, knee, boot; coordinates start at the image edge.
const joints=[
 [37,39,45,53,43,34,29,75,43,99,39,126],
 [36,41,46,51,46,33,31,74,44,96,43,126],
 [35,40,47,54,44,36,28,74,46,100,39,126],
 [35,41,45,53,46,38,31,76,45,99,37,127],
 [51,41,56,53,61,65,39,79,57,98,62,129],
 [47,41,53,58,62,65,36,79,54,100,60,131],
 [52,42,55,57,62,67,36,79,61,102,58,131],
 [50,44,57,59,61,43,38,80,57,98,49,126],
 [47,43,55,59,50,48,37,80,56,101,59,130],
 [47,46,54,61,61,55,36,80,57,101,55,129],
 [61,38,78,36,96,27,53,77,76,102,100,130],
 [42,53,46,67,52,56,29,85,46,104,39,125],
 [50,55,60,70,72,53,41,88,52,107,61,130],
 [51,44,61,55,58,31,41,81,56,105,60,130],
 [48,44,52,58,58,42,34,80,54,103,55,130],
 [42,31,55,44,47,23,38,71,46,98,56,131],
 [52,36,63,48,77,32,48,72,69,97,77,132],
 [50,37,61,47,81,34,48,73,62,96,68,132]
];
// Cut each moving limb out of the original stance before articulating it.
// Coordinates are local to a 140-unit-tall reference pose. The contour follows
// the inside seam; the remaining boundary lies outside the sprite.
const limbSeams = [
 [[36,35,38,45,38,57,54,61],[27,76,24,84,31,99,27,115,24,139]],
 [[35,32,35,44,36,55,55,60],[30,74,27,84,34,98,29,121,28,140]],
 [[35,37,35,45,39,59,54,63],[28,75,26,84,35,97,28,120,26,140]],
 [[36,38,36,49,38,60,55,62],[31,78,27,88,33,102,25,118,24,140]],
 [[47,31,45,43,52,56,58,70],[36,69,33,80,47,96,46,118,44,140]],
 [[44,35,44,46,49,57,57,69],[37,75,32,84,48,101,46,122,43,140]],
 [[47,35,45,46,53,58,57,70],[36,75,32,84,47,99,45,119,44,140]],
 [[52,42,51,52,53,62,70,64],[39,81,34,89,45,100,38,119,37,140]],
 [[48,40,45,54,48,64,66,63],[39,83,34,91,44,103,40,121,39,140]],
 [[46,38,46,49,49,62,67,71],[39,78,33,87,45,100,39,121,38,140]],
 [[61,27,56,36,58,44,84,43],[51,69,43,79,64,101,83,127,84,140]],
 [[40,57,38,66,43,77,60,78],[29,85,22,91,37,103,30,117,29,140]],
 [[52,61,49,70,56,79,77,75],[46,111,48,118,49,124,48,140]],
 [[48,35,47,45,50,55,69,58],[48,118,46,123,45,129,43,140]],
 [[47,35,45,45,49,56,67,58],[35,76,31,85,45,101,45,120,44,140]],
 [[42,28,41,33,42,40,51,49],[31,72,28,81,36,99,45,120,49,140]],
 [[52,34,54,42,58,50,67,55],[47,72,45,82,56,99,62,119,65,140]],
 [[52,39,52,43,53,47,53,51],[49,73,48,81,54,97,56,112,57,139]]
];
const rigCache = new Map();
function jointLayer(w,h) {
 const canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 return canvas;
}
function limbTexture(im,x,y,ex,ey,radius){
 const length=Math.hypot(ex-x,ey-y),angle=Math.atan2(ey-y,ex-x);
 const part=document.createElement('canvas');part.width=Math.ceil((length+2*radius)*3);part.height=radius*6;
 const brush=part.getContext('2d');brush.scale(3,3);brush.translate(radius,radius);
 brush.beginPath();brush.moveTo(0,0);brush.lineTo(length,0);brush.lineWidth=radius*2;brush.lineCap='round';brush.stroke();
 brush.globalCompositeOperation='source-in';brush.rotate(-angle);
 brush.drawImage(im,-x,-y,140*im.naturalWidth/im.naturalHeight,140);
 return {part,length,radius};
}
function putLimb(tex,x,y,ex,ey){
 const angle=Math.atan2(ey-y,ex-x),length=Math.hypot(ex-x,ey-y),r=tex.radius;
 g.save();g.translate(x,y);g.rotate(angle);g.drawImage(tex.part,-r,-r,length+2*r,2*r);g.restore();
}

function makeRig(f,im,kick){
 const unit=3, h=140*unit,w=Math.round(h*im.naturalWidth/im.naturalHeight);
 const points=limbSeams[f.i][+kick],j=joints[f.i].slice(kick?6:0,kick?12:6);
 const [sx,sy,mx,my,tx,ty]=j;
 const top=kick?points[1]-3:Math.min(points[1]-3,ty-8);
 const outline=new Path2D();outline.moveTo(points[0],points[1]);
 for(let i=2;i<points.length;i+=2)outline.lineTo(points[i],points[i+1]);
 outline.lineTo(w/unit+2,points.at(-1));outline.lineTo(w/unit+2,top);
 // Keep the head, especially the puppet queen's hair, on the body.
 outline.lineTo(points[0]+3,top);outline.closePath();
 const body=jointLayer(w,h),arm=jointLayer(w,h);
 for(const [surface,mode] of [[body,'destination-out'],[arm,'destination-in']]){
   const b=surface.getContext('2d');b.drawImage(im,0,0,w,h);
   const mask=jointLayer(w,h),m=mask.getContext('2d');m.scale(unit,unit);m.fill(outline);
   b.globalCompositeOperation=mode;b.drawImage(mask,0,0);
 }
 // Rigid rotation preserves the original boot or fist, including its proportions.
 const bent=!kick&&Math.hypot(tx-sx,ty-sy)<21;
 const segments=bent?[limbTexture(im,sx,sy,mx,my,5.3),limbTexture(im,mx,my,tx,ty,4.6),limbTexture(im,tx-2,ty,tx+2,ty,4.5)]:null;
 return {body,arm,segments,j,pivotX:points[0],pivotY:points[1],width:w/unit,
   angle:Math.atan2(ty-sy,tx-sx), nearHem:kick&&(f.i===12||f.i===13)};
}
function drawStrikeBody(f,im){
 const move=strikes[f.action],kick=f.action.toLowerCase().includes('kick');
 const key=f.i*2+Number(kick);if(!rigCache.has(key))rigCache.set(key,makeRig(f,im,kick));
 const r=rigCache.get(key),heavy=f.action.startsWith('heavy');
 const u=f.pendingStrike?0:Math.min(1,f.anim/(move.recovery*.78));
 const drive=u*u*(3-2*u),wind=f.pendingStrike?1-f.pendingStrike.remaining/move.startup:0;
 const legAngle=r.nearHem?-1.12:-(r.angle+(heavy?.18:-.15));
 const armAngle=r.angle>.2?-Math.min(1.35,r.angle+.1):.52;
 const swing=(kick?legAngle:armAngle)*drive+wind*.10;
 g.save();g.translate(-164*im.naturalWidth/im.naturalHeight,-315);g.scale(328/140,328/140);
 const lean=(kick?-.09:.14)*drive,reach=(kick?4:12)*drive;
 g.translate(r.width/2,130);g.rotate(lean);g.translate(-r.width/2+reach,-130);
 g.drawImage(r.body,0,0,r.width,140);
 if(r.segments && drive>.02){
   const [sx,sy,mx,my,tx,ty]=r.j;
   const elbowX=mx+(sx+15-mx)*drive,elbowY=my+(sy+5-my)*drive;
   const fistX=tx+(sx+(heavy?35:31)-tx)*drive,fistY=ty+(sy-(heavy?8:2)-ty)*drive;
   putLimb(r.segments[0],sx,sy,elbowX,elbowY);putLimb(r.segments[1],elbowX,elbowY,fistX,fistY);
   putLimb(r.segments[2],fistX-2,fistY,fistX+2,fistY);g.restore();return;
 }
 g.translate(r.pivotX,r.pivotY);
 // A sliding shoulder and rotating torso carry the fist forward on a cross.
 g.transform(1+(kick?0:.12)*drive,0,(kick?0:-.18)*drive,1,0,0);
 g.rotate(swing);g.drawImage(r.arm,-r.pivotX,-r.pivotY,r.width,140);
 g.restore();
}
function drawFighter(f){let im=imgs[f.i],color=roster[f.i].color;g.fillStyle='#0007';g.beginPath();g.ellipse(f.x,480,78,12,0,0,7);g.fill();let bob=Math.sin(clock*4+f.i)*3,walk=f.action==='walk'?Math.sin(clock*17)*6:0;let lunge=f.anim>0?(f.action==='kick'?25:15)*Math.sin(f.anim/.32*Math.PI)*f.side:0;g.save();g.translate(f.x+lunge,480-f.y+bob+walk);g.scale(f.side*(f.stun>0?1.04:1),f.stun>0?.96:1);if(f.hp<=0){g.rotate(-1.25);g.globalAlpha=.7}if(f.stun>0)g.rotate(-.10);if(f.thrownUntil>clock)g.rotate(-.38);if(f.action==='dashStep')g.rotate(.12);if(strikes[f.action]&&f.anim>0)g.rotate(f.pendingStrike?-.065:.075);if(f.block){g.scale(.94,.93);g.strokeStyle='#b2dffa';g.lineWidth=3;g.shadowBlur=15;g.shadowColor='#6bc8ff';g.beginPath();g.ellipse(40,-145,55,120,-.1,-1.5,1.5);g.stroke();g.shadowBlur=0}if(state==='matchover'&&f.wins===2)g.scale(1.12,1.12);if(im.complete&&im.naturalWidth){let w=328*im.naturalWidth/im.naturalHeight;if(f.anim>0&&strikes[f.action])drawStrikeBody(f,im);else g.drawImage(im,-w/2,-315,w,328)}else{g.fillStyle=color;g.fillRect(-35,-230,70,220)}g.restore();if(f.slow>0){g.fillStyle='#55ddebaa';g.beginPath();g.ellipse(f.x,470-f.y,65,15,0,0,7);g.fill();text('SLOWED',f.x,153,14,'#55ddeb','center')}if(f.fx>0&&['honk','cackle'].includes(roster[f.i].kind)){g.strokeStyle=roster[f.i].color;g.lineWidth=5;g.globalAlpha=f.fx;g.beginPath();g.ellipse(f.x,340-f.y,310*(1-f.fx/.7),130,0,0,7);g.stroke();if(roster[f.i].kind==='cackle')text('HA!',f.x+f.side*140,300-f.y,40,roster[f.i].color,'center');g.globalAlpha=1}if(f.fx>0&&roster[f.i].kind==='dash'){g.strokeStyle=roster[f.i].color;g.lineWidth=4;g.beginPath();g.moveTo(f.x-f.side*100,360-f.y);g.lineTo(f.x+f.side*110,310-f.y);g.stroke()}if(f.power>=100){g.fillStyle=color+'66';g.fillRect(f.x-25,491,50,2)}}
function hud(){fighters.forEach((f,i)=>{let x=i?700:45,w=455,col=roster[f.i].color;text(roster[f.i].name,i?1155:45,39,25,col,i?'right':'left');g.fillStyle='#070910bb';g.fillRect(x,53,w,18);g.fillStyle='#4c252b';g.fillRect(x,53,w,18);g.fillStyle='#dd9e7c';const trail=f.trail??f.hp;g.fillRect(i?x+w*(1-trail/100):x,53,w*trail/100,18);g.fillStyle=col;g.fillRect(i?x+w*(1-f.hp/100):x,53,w*f.hp/100,18);g.fillStyle='#0b0c13';g.fillRect(x,80,w,5);g.fillStyle=col;g.fillRect(i?x+w*(1-f.power/300):x,80,w*f.power/300,5);g.fillStyle='#17131a';for(let bar=1;bar<3;bar++)g.fillRect(x+w*bar/3,79,4,8);
if(f.combo>1 && clock-f.lastHit<.68){text(f.combo+' HITS',i?1155:45,168,34,col,i?'right':'left');text(Math.round(f.comboDamage||0)+' DMG',i?1155:45,192,15,'#e8dfd1',i?'right':'left');g.fillStyle=col;g.fillRect(i?1035:45,198,120*Math.max(0,1-(clock-f.lastHit)/.68),3)}
for(let k=0;k<2;k++){g.beginPath();g.arc(i?1146-k*18:54+k*18,101,4,0,7);g.fillStyle=f.wins>k?col:'#776a6555';g.fill()}text(Math.floor(f.hp)+' HP',i?1155:45,123,11,'#b9aa9e',i?'right':'left')});text(String(Math.max(0,Math.ceil(timer))).padStart(2,'0'),600,77,58,'#e7bf78','center');text('ROUND '+round,600,101,11,'#a39088','center')}

function drawShot(s){g.save();g.translate(s.x,s.y);g.fillStyle=s.color;g.strokeStyle=s.color;g.shadowColor=s.color;g.shadowBlur=25;
if(s.kind==='moths'){
 for(let i=0;i<7;i++){
   const phase=s.age*12+i*2.4;
   const x=Math.cos(phase)*28,y=Math.sin(phase+i)*18;
   const wing=3+Math.abs(Math.sin(phase*2))*5;
   for(const side of [-1,1]){
     g.beginPath();g.ellipse(x+side*4,y,wing,3,side*.65,0,Math.PI*2);g.fill();
   }
 }
}
else if(s.kind==='vapor'){for(let i=0;i<7;i++){g.globalAlpha=.25+i*.05;g.beginPath();g.ellipse(Math.sin(s.age*6+i)*32,Math.cos(s.age*5+i)*22,35,25,0,0,7);g.fill()}g.globalAlpha=1}
else if(s.kind==='gift'){g.rotate(Math.sin(s.age*6)*.2);g.fillStyle='#31b35c';g.fillRect(-20,-20,40,40);g.fillStyle='#ffd66e';g.fillRect(-4,-20,8,40);g.fillRect(-20,-4,40,8);g.lineWidth=4;g.strokeStyle='#ffd66e';for(let side of [-1,1]){g.beginPath();g.ellipse(side*9,-24,10,6,side*.5,0,7);g.stroke()}}
else if(s.kind==='radio'){g.lineWidth=4;for(let i=0;i<3;i++){g.beginPath();g.arc(0,0,12+i*11,-1.15,1.15);g.stroke()}g.fillStyle='#fff';g.beginPath();g.arc(0,0,5,0,7);g.fill()}
else if(s.kind==='silver'){g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();g.moveTo(-35,-15+i*15);g.lineTo(-12,-30+i*20);g.lineTo(4,-5+i*10);g.lineTo(27,-20+i*16);g.lineTo(39,5+i*8);g.stroke()}g.fillStyle='#fff';g.beginPath();g.arc(0,0,12,0,7);g.fill()}
else if(s.kind==='star'){g.rotate(s.age*12);g.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,r=i%2?10:26;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill()}
else if(s.kind==='axe'){g.rotate(s.age*9);g.lineWidth=7;g.beginPath();g.moveTo(0,28);g.lineTo(0,-24);g.stroke();g.beginPath();g.moveTo(-4,-24);g.lineTo(28,-29);g.lineTo(28,-2);g.lineTo(-4,-10);g.closePath();g.fill()}
else if(s.kind==='cut'){g.rotate(s.age*8);g.lineWidth=4;for(let side of [-1,1]){g.beginPath();g.arc(-15,side*11,8,0,7);g.stroke();g.beginPath();g.moveTo(-8,side*8);g.lineTo(26,-side*18);g.stroke()}}
else if(s.kind==='petals'){
 for(let i=0;i<9;i++){
   const ph=s.age*11+i*2.2, px=Math.cos(ph)*26, py=Math.sin(ph*1.3+i)*17;
   g.save();g.translate(px,py);g.rotate(ph);
   g.fillStyle=i%3?'#ff5f7e':'#ffd66e';
   g.beginPath();g.ellipse(0,0,11,5.5,0,0,7);g.fill();g.restore();
 }
 g.fillStyle='#fff';g.beginPath();g.arc(0,0,5,0,7);g.fill()
}
else{g.beginPath();g.ellipse(0,0,25,17,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(0,0,8,0,7);g.fill()}g.restore()}

// The opponent becomes a painted carnival dummy as the winner pulls its release cord.
function drawFatality(){
 const winner=fighters[finalWinner],victim=fighters[1-finalWinner], side=winner.side;
 const time=2.9-finalTime, pull=Math.min(1,Math.max(0,(time-.95)/.42));
 const eased=1-(1-pull)**3, x=600+side*18, floor=480;
 const headX=x-side*96*eased, headY=floor-222-72*eased-23*Math.sin(Math.PI*pull);
 g.fillStyle='rgba(12,4,15,.62)';g.fillRect(0,0,1200,580);
 g.save();g.translate(x,floor);
 const accent=roster[victim.i].color;
 g.strokeStyle='#9a6942';g.lineWidth=12;g.lineCap='round';
 for(const sign of [-1,1]){
   g.beginPath();g.moveTo(sign*19,-91);g.lineTo(sign*29,-5);g.stroke();
   g.beginPath();g.moveTo(sign*28,-165);g.lineTo(sign*39,-104);g.stroke();
 }
 g.fillStyle=accent;g.beginPath();g.moveTo(-30,-180);g.lineTo(30,-180);
 g.lineTo(23,-86);g.lineTo(-23,-86);g.closePath();g.fill();
 g.fillStyle='#9a6942';g.fillRect(-6,-208,12,30);
 g.fillStyle='#38251b';g.fillRect(-24,-98,48,9);g.restore();
 // A joint seam, bolts and painted cheeks identify the detachable prop.
 g.save();g.translate(headX,headY);g.rotate(-side*eased*.34);
 g.fillStyle='#d39e68';g.beginPath();g.ellipse(0,0,27,35,0,0,7);g.fill();
 g.fillStyle=accent;g.fillRect(-27,-23,54,9);g.fillStyle='#31211b';
 for(const sign of [-1,1]){g.fillRect(sign*11-2,-6,5,6);g.fillRect(sign*14,12,2,14);}
 g.fillRect(-13,12,27,3);g.restore();
 const handX=winner.x+side*42,handY=310;
 g.strokeStyle='#e1bf7d';g.lineWidth=3;g.beginPath();g.moveTo(handX,handY);
 g.quadraticCurveTo((handX+headX)/2,handY+(1-eased)*36,headX,headY+28);g.stroke();
 if(pull>0&&pull<1){g.strokeStyle=accent;g.lineWidth=3;for(let i=0;i<10;i++){
   const a=i*.628,r=10+pull*53;g.beginPath();g.moveTo(x+r*Math.cos(a),floor-194+r*Math.sin(a));
   g.lineTo(x+(r+9)*Math.cos(a),floor-194+(r+9)*Math.sin(a));g.stroke();
 }}
 if(time>1.32){text('FATALITY',600,157,66,'#e8bf70','center');text('THE PUPPET PULL',600,194,18,'#fff1d6','center');}
}
// Render: arena, interpolated fighters, impact effects, then fixed HUD.
function draw(){g.save();if(shake)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);g.save();g.translate(600,340);g.scale(1+cameraPush,1+cameraPush);g.translate(-600,-340);background();crowd();
fighters.forEach((f,i)=>{if(state==='finale'&&i!==finalWinner)return;g.save();g.translate(((f.prevX??f.x)-f.x)*(1-alpha),(f.y-(f.prevY??f.y))*(1-alpha));drawFighter(f);g.restore()});shots.forEach(drawShot);drawSuper();particles.forEach(p=>{g.globalAlpha=Math.min(1,p.life*3);g.fillStyle=p.color;g.fillRect(p.x,p.y,4,4)});g.globalAlpha=1;g.restore();const darkness=Math.max(0,...fighters.map(f=>(f.blackoutUntil||0)-clock));if(darkness){g.fillStyle='rgba(15,5,24,'+Math.min(.8,darkness*3)+')';g.fillRect(0,0,1200,580)}if(impact>0){g.fillStyle="rgba(255,230,185,"+impact+")";g.fillRect(0,0,1200,580)}if(state==='finale')drawFatality();hud();if(noticeT>0){g.shadowColor='#000';g.shadowBlur=15;text(notice,600,185,notice==='FIGHT!'?66:36,'#f5d59c','center');g.shadowBlur=0}g.restore()}
// Standard Gamepad layout: supports Backbone's Xbox and PlayStation face labels.
const padKeys=new Set();
const padState={previous:new Map(),indexes:[],menuDirection:0,menuWait:0,focused:true,message:''};
const inputDown=key=>keys.has(key)||padKeys.has(key);
function padPressed(p,index){const b=p.buttons?.[index];return typeof b==='number'?b>.5:!!(b?.pressed||b?.value>.5)}
function padMessage(message,connected=false){if(padState.message!==message){$('controller-status').textContent=message;padState.message=message}$('controller-status').classList.toggle('connected',connected)}
function padMenu(){return state==='menu'||state==='matchover'}
function padReturnToMenu(){$('exit-match').hidden=true;$('finale').hidden=true;document.body.classList.remove('playing');cinema=null;keys.clear();padKeys.clear();paused=false;state='menu';$('pause').textContent='Pause';noticeT=0;idle();show('Choose your fighter','Controller: ← / → choose · LB / RB opponent · X / □ arena · A / ✕ fight','Fight now');$('status').textContent='Choose your next challenger'}
function cyclePadOpponent(direction){setOpponent((opponentPick+direction+roster.length)%roster.length)}
function mapPadCombat(pad, player, previous) {
  const bindings = playerBindings[player];
  const x = pad.axes?.[0] || 0;
  const y = pad.axes?.[1] || 0;
  if (x < -.28 || padPressed(pad,14)) padKeys.add(bindings.left);
  if (x > .28 || padPressed(pad,15)) padKeys.add(bindings.right);
  if (padPressed(pad,7)) padKeys.add(bindings.block);
  const jump = padPressed(pad,12) || y < -.72;
  if (jump && !previous.jump) queueAction(player,'jump');
  if(padPressed(pad,4)&&padPressed(pad,5)){if(!previous[4]||!previous[5])queueAction(player,'breaker');return}
  if(padPressed(pad,5)&&padPressed(pad,7)){if(!previous[5]||!previous[7])queueAction(player,'super');return}
  if (padPressed(pad,10) && !previous[10]) queueAction(player,'throw');
  const actions = ['kick','heavyKick','punch','heavyPunch','dash','special'];
  actions.forEach((action,index) => {
    if (padPressed(pad,index) && !previous[index]) queueAction(player,action);
  });
}
const pickSeats=[{},{}];
let pickerVisible=false, pairedMatch=false;
function clearPick(seat){Object.assign(seat,{ready:false,direction:0,wait:0,display:''})}
function showPicker(visible){
 if(visible===pickerVisible)return;
 pickerVisible=visible;
 $('dual-picks').hidden=true;
 document.body.classList.toggle('dual-picking',visible);
 pickSeats.forEach(clearPick);
}
function gridCols(){try{return getComputedStyle($('roster')).gridTemplateColumns.split(' ').length||5}catch{return 5}}
function dualPick(pads,current,prior,dt){
 const cols=gridCols();
 for(let i=0;i<2;i++){
   const seat=pickSeats[i], pad=pads[i], buttons=current[i];
   const edge=n=>buttons[n]&&!prior[i][n];
   let fighterIndex=i?opponentPick:selected;
   if(seat.pick!==fighterIndex)seat.ready=false;
   const axisX=pad.axes?.[0]||0, axisY=pad.axes?.[1]||0;
   const dx=Number(axisX>.5||buttons[15])-Number(axisX<-.5||buttons[14]);
   const dy=Number(axisY>.5||buttons[13])-Number(axisY<-.5||buttons[12]);
   const dirKey=dx+dy*10;
   seat.wait-=dt;
   if(!seat.ready&&(dx||dy)&&(seat.direction!==dirKey||seat.wait<=0)){
     let next=Math.max(0,Math.min(roster.length-1,fighterIndex+dx+dy*cols));
     if(next!==fighterIndex){if(i)setOpponent(next);else choose(next);fighterIndex=next}
     seat.wait=seat.direction===dirKey?.24:.42;
   }
   seat.pick=fighterIndex;seat.direction=dirKey;
   if(edge(1))seat.ready=false;
   else if(edge(0)||edge(9))seat.ready=true;
   const display=[fighterIndex,seat.ready].join('/');
   if(display!==seat.display){
     seat.display=display;
     const s=$('pick-status');if(s)s.textContent='P1 · '+roster[selected].name+(pickSeats[0].ready?' ✓ READY':'')+'  vs  P2 · '+roster[opponentPick].name+(pickSeats[1].ready?' ✓ READY':'')+'   —   move on the grid · A to ready · B to change';
   }
 }
 if(pickSeats.every(seat=>seat.ready)){showPicker(false);begin();pairedMatch=true}
}
function pollGamepads(dt){padKeys.clear();if(document.hidden||!padState.focused)return;
 let pads;try{if(typeof navigator.getGamepads!=='function'){padMessage('Controller unavailable here — open this game in Safari.');return}pads=Array.from(navigator.getGamepads()).filter(p=>p&&p.connected!==false).sort((a,b)=>Number(/backbone/i.test(b.id))-Number(/backbone/i.test(a.id))||Number(/xbox/i.test(a.id))-Number(/xbox/i.test(b.id))||a.index-b.index)}catch{padMessage('Controller access blocked — open the game directly in Safari.');return}
 const indexes=pads.map(p=>p.index),lost=padState.indexes.some(i=>!indexes.includes(i));if(padState.indexes.join()!==indexes.join())pickSeats.forEach(clearPick);
 padState.indexes=indexes;
 for(const i of padState.previous.keys())if(!indexes.includes(i))padState.previous.delete(i);
 if(lost&&['fight','countdown','roundover'].includes(state)&&!paused){togglePause();padMessage('Controller disconnected — match paused. Reconnect and press A / ✕.');return}
 const dual=padMenu()&&$('mode').value==='versus'&&pads.length>=2;
 showPicker(dual);
 if(paused&&pairedMatch&&pads.length<2){padMessage('Match paused · Reconnect both controllers to resume.');return}
 if(!pads.length){padMessage('BACKBONE READY · Connect your controller, then press a button.');return}
 const primary=pads[0],standard=primary.mapping==='standard';
 if(!padMenu()||pads.length<2)padMessage((/backbone/i.test(primary.id)?'BACKBONE CONNECTED':'CONTROLLER CONNECTED')+(pads.length>1?' · '+pads.length+' controllers':'')+(!standard?' · check button layout':''),true);
 const current=pads.map(p=>Array.from({length:Math.max(17,p.buttons?.length||0)},(_,i)=>padPressed(p,i)));
 const prior=pads.map(p=>padState.previous.get(p.index)||[]);
 current.forEach((buttons,i)=>buttons.jump=buttons[12] || (pads[i].axes?.[1]||0)<-.72);
 const before=prior[0],pressed=i=>current[0][i]&&!before[i];
 pads.forEach((p,i)=>padState.previous.set(p.index,current[i]));
 padState.menuWait=Math.max(0,padState.menuWait-dt);
 if(padMenu()&&pads[1]&&!dual&&current[1][0]&&!prior[1][0]){
   $('mode').value='versus';$('mode').onchange();showPicker(true);
   dualPick(pads,current,current,dt);return;
 }
 if(dual){
   padMessage('LOCAL TWO PLAYER · Both players press A when ready',true);
   dualPick(pads,current,prior,dt);return;
 }
 if(padMenu()&&pads.length>=2)padMessage('P2 · Press A on the second controller to join',true);
 if(state==='finishPrompt'){current.forEach((buttons,i)=>{if(buttons[11]&&!prior[i][11])finish(i)});}
 if(pressed(9)){if(padMenu())begin();else togglePause();return}
 if(paused){if(pressed(0))togglePause();else if(pressed(1))padReturnToMenu();return}
 if(padMenu()){
  const axis=Number(primary.axes?.[0])||0,direction=(axis>.5||current[0][15]?1:0)-(axis<-.5||current[0][14]?1:0);
  if(direction&&(direction!==padState.menuDirection||padState.menuWait<=0)){choose((selected+direction+roster.length)%roster.length);padState.menuWait=direction===padState.menuDirection?.18:.35}
  padState.menuDirection=direction;if(!direction)padState.menuWait=0;
  if(pressed(12)||pressed(13)){const m=$('mode');m.selectedIndex=(m.selectedIndex+(pressed(13)?1:m.options.length-1))%m.options.length;m.onchange()}
  if(pressed(3)){$('difficulty').selectedIndex=($('difficulty').selectedIndex+1)%3}
  if(pressed(4))cyclePadOpponent(-1);if(pressed(5))cyclePadOpponent(1);
  if(pressed(2)){$('stage').selectedIndex=($('stage').selectedIndex+1)%3;$('stage').onchange()}
  if(pressed(0))begin();return;
 }
 padState.menuDirection=0;
 if(state==='fight'){mapPadCombat(primary,0,prior[0]);if(activeMode==='versus'&&pads[1])mapPadCombat(pads[1],1,prior[1])}
}
addEventListener('gamepadconnected',()=>{padState.message=''});
addEventListener('gamepaddisconnected',e=>{padKeys.clear();padState.previous.delete(e.gamepad.index);if(!paused&&['fight','countdown','roundover'].includes(state))togglePause();padMessage('Controller disconnected — reconnect to continue.')});
addEventListener('blur',()=>{padState.focused=false;padKeys.clear()});
addEventListener('focus',()=>{padState.focused=true});
$('exit-match').onclick=padReturnToMenu;

// Fixed simulation time. Interpolate fighter positions between completed ticks.
const STEP = 1 / 60;
let accumulated = 0, freezeFrames = 0, impact = 0, cameraPush = 0, alpha = 1;
function loop(t) {
  const elapsed = last ? Math.min(.2, (t-last)/1000) : 0;
  last = t;
  pollGamepads(elapsed);
  updateMusic();
  accumulated += elapsed;
  while (accumulated >= STEP) {
    for (const f of fighters) { f.prevX=f.x; f.prevY=f.y; if(!paused)f.trail=Math.max(f.hp,(f.trail??f.hp)-.45); }
    if (!paused) {
      if (freezeFrames > 0) freezeFrames--;
      else update(STEP);
      impact = Math.max(0, impact-.025);
      cameraPush *= .91;
    }
    accumulated -= STEP;
  }
  alpha=accumulated/STEP;
  draw();
  requestAnimationFrame(loop);
}
function record(){$('record').textContent=stats.matches?stats.wins+' SOLO / P1 WINS • '+stats.matches+' MATCHES ON THIS DEVICE':''}choose(0);record();requestAnimationFrame(loop);
