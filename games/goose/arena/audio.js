import { CONFIG as C } from './config.js';
// All fallback audio is synthesized here; no third-party music or samples.
export class ArenaAudio {
  constructor(settings){this.settings=settings;this.ctx=null;this.players=[];this.current=null;this.trackKey=null;this.fade=null;this.synthTimer=null;this.step=0;this.paused=false;this.fallback=false;this.blocked=false;this.sequence='menu';}
  unlock(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch{}}this.ctx?.resume().catch(()=>{});}
  tone(frequency,duration=.12,type='triangle',volume=.06,delay=0){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=frequency;o.connect(g);g.connect(this.ctx.destination);const t=this.ctx.currentTime+delay;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.start(t);o.stop(t+duration+.01);}
  sfx(key){if(!this.settings.sfx)return;const path=C.media.sfx[key];if(path){const a=new Audio(path);a.volume=this.settings.sfxVolume;a.play().catch(()=>this.fallbackSfx(key));return;}this.fallbackSfx(key);}
  fallbackSfx(key){if(key==='crowdCheer'||key==='crowdChant'){this.crowdCheer();return;}const v=this.settings.sfxVolume*.12;const riffs={button:[392],pause:[330,220],gameOver:[330,277,220,165],highScore:[392,494,587,784],fourLineClear:[196,392,494,587,784],celebration:[392,587,784],crowdCheer:[147,196,294],crowdChant:[196,196,294],levelUp:[330,440,660],combo:[440,554,659]};(riffs[key]||[196]).forEach((n,i)=>this.tone(n,.18,'triangle',v,i*.075));if(['crowdCheer','crowdChant','celebration'].includes(key))this.noise(.6,v);}
  crowdCheer(){if(!this.ctx)return;const ctx=this.ctx,t=ctx.currentTime,volume=this.settings.sfxVolume;
    // Layer applause and a chorus of rising, vowel-like crowd whoops.
    this.noise(1.8,volume*.3);
    for(let i=0;i<18;i++){const start=t+Math.random()*.55,duration=.5+Math.random()*.7,voice=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();voice.type='sawtooth';const pitch=150+Math.random()*220;voice.frequency.setValueAtTime(pitch,start);voice.frequency.exponentialRampToValueAtTime(pitch*1.65,start+duration*.45);voice.frequency.exponentialRampToValueAtTime(pitch*.85,start+duration);filter.type='bandpass';filter.frequency.value=650+Math.random()*650;filter.Q.value=2;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*.014,start+.08);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);voice.connect(filter);filter.connect(gain);gain.connect(ctx.destination);voice.start(start);voice.stop(start+duration+.02);}
    for(let i=0;i<35;i++)setTimeout(()=>{if(this.settings.sfx)this.noise(.035,volume*.12);},i*45);
  }
  noise(duration,volume){if(!this.ctx)return;const b=this.ctx.createBuffer(1,this.ctx.sampleRate*duration,this.ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.sin(i/d.length*Math.PI);const source=this.ctx.createBufferSource();source.buffer=b;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=1100;const g=this.ctx.createGain();g.gain.value=volume;source.connect(f);f.connect(g);g.connect(this.ctx.destination);source.start();}
  musicFor(level){return level>=C.audio.enduranceTrackAt?'enduranceTrack':'mainTrack';}
  beginGame(){this.sequence='game';this.track('entranceTrack',true);}
  gameplayTracks(){return ['mainTrack','gooseTrack','anthemTrack'].filter(key=>C.media.music[key]);}
  advanceLevel(level){if(level>=C.audio.enduranceTrackAt)this.track('enduranceTrack');else if(!['entranceTrack',...this.gameplayTracks()].includes(this.trackKey))this.track('mainTrack');}
  loops(key){return !(this.sequence==='game'&&['entranceTrack',...this.gameplayTracks()].includes(key));}
  playPlayer(player){
    if(!player||this.paused||!this.settings.music)return;
    player.play().then(()=>{if(this.current!==player)return;this.blocked=false;if(this.paused||!this.settings.music)player.pause();}).catch(error=>{
      if(this.current!==player||this.paused||!this.settings.music)return;
      if(error.name==='NotAllowedError'){this.blocked=true;return;}
      if(error.name==='AbortError')return;
      this.fallback=true;this.startSynth();
    });
  }
  ended(player){
    if(this.current!==player)return;
    if(this.sequence==='game'&&['entranceTrack',...this.gameplayTracks()].includes(this.trackKey)){
      // Reuse the player unlocked by PLAY instead of creating a new autoplay target.
      const rotation=this.gameplayTracks();
      const nextKey=rotation[(rotation.indexOf(this.trackKey)+1)%rotation.length]||'mainTrack';
      const path=C.media.music[nextKey];if(!path){this.track(nextKey);return;}
      this.cancelFade();this.trackKey=nextKey;this.blocked=false;
      player.src=path;player.loop=this.loops(nextKey);player.currentTime=0;player.volume=this.settings.musicVolume;
      this.playPlayer(player);
    }else if(player.loop){player.currentTime=0;this.playPlayer(player);}
  }
  maintain(dt){
    this.recoveryTime=(this.recoveryTime||0)+dt;if(this.recoveryTime<2000)return;this.recoveryTime=0;
    if(!this.current||this.paused||!this.settings.music||this.fallback||this.blocked)return;
    if(this.current.ended)this.ended(this.current);
    else if(this.current.paused)this.playPlayer(this.current);
  }
  track(key,force=false){if(this.trackKey===key&&!force)return;this.trackKey=key;this.blocked=false;this.cancelFade();clearInterval(this.synthTimer);this.synthTimer=null;this.fallback=false;const old=this.players.slice();const path=C.media.music[key];let next=null;if(path){next=new Audio(path);next.preload='auto';next.loop=this.loops(key);next.onended=()=>this.ended(next);next.volume=0;this.players.push(next);this.current=next;this.playPlayer(next);}else{this.current=null;this.fallback=true;this.startSynth();}
    const start=performance.now(),volumes=old.map(a=>a.volume);this.fade=setInterval(()=>{const p=Math.min(1,(performance.now()-start)/C.audio.fadeDuration);old.forEach((a,i)=>a.volume=volumes[i]*(1-p));if(next)next.volume=this.settings.musicVolume*p;if(p===1){clearInterval(this.fade);this.fade=null;old.forEach(a=>{a.pause();a.src='';});this.players=next?[next]:[];}},30);
    if(this.paused||!this.settings.music)this.players.forEach(a=>a.pause());
  }
  cancelFade(){if(this.fade){clearInterval(this.fade);this.fade=null;}if(this.players.length>1){const keep=this.current;this.players.forEach(a=>{if(a!==keep){a.pause();a.src='';}});this.players=keep?[keep]:[];}}
  startSynth(){clearInterval(this.synthTimer);this.synthTimer=setInterval(()=>{if(this.paused||!this.settings.music||!this.fallback)return;const notes=this.trackKey==='enduranceTrack'?[147,175,220,294,262,220,175,165]:this.trackKey==='highLevelTrack'?[165,220,247,330,294,247,220,196]:[131,196,262,330,294,262,196,147];this.tone(notes[this.step++%notes.length],.22,'triangle',this.settings.musicVolume*.1);if(this.step%4===0)this.tone(notes[0]/2,.34,'sine',this.settings.musicVolume*.12);},this.trackKey==='enduranceTrack'?180:250);}
  pause(){this.paused=true;this.players.forEach(a=>a.pause());}
  resume(){this.paused=false;this.unlock();if(this.current?.ended)this.ended(this.current);else this.players.forEach(a=>this.playPlayer(a));}
  apply(){this.cancelFade();this.players.forEach(a=>{a.volume=this.settings.musicVolume;if(!this.settings.music||this.paused)a.pause();else this.playPlayer(a);});}
  stop(){clearInterval(this.synthTimer);this.cancelFade();this.players.forEach(a=>{a.pause();a.src='';});this.players=[];this.current=null;this.trackKey=null;this.fallback=false;this.sequence='menu';}
}
