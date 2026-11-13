import { CONFIG as C } from './config.js';
export function tetrisCelebration(count){return {key:count===5?'fifthTetris':'fourLineClear',variant:count-1};}
export class ArenaEffects {
  constructor(canvas,announcer,video,settings){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.announcer=announcer;this.video=video;this.settings=settings;this.particles=[];this.messageTimer=null;this.videoTimer=null;this.lastMessage=0;this.videoSerial=0;this.clipQueue=[];this.currentClip=null;this.fireworkTimers=[];this.resize();window.addEventListener('resize',()=>this.resize());}
  resize(){this.canvas.width=innerWidth;this.canvas.height=innerHeight;}
  say(title,sub='',duration=C.effects.celebrationDuration){clearTimeout(this.messageTimer);this.announcer.querySelector('strong').textContent=title;this.announcer.querySelector('span').textContent=sub;this.announcer.classList.remove('show');void this.announcer.offsetWidth;this.announcer.classList.add('show');this.lastMessage=performance.now();this.messageTimer=setTimeout(()=>this.announcer.classList.remove('show'),Math.min(duration,900));}

  burst(big=false,silver=false){if(this.settings.reducedMotion)return;document.body.classList.remove('gold-pulse');void document.body.offsetWidth;document.body.classList.add('gold-pulse');const count=big?140:75;for(let i=0;i<count&&this.particles.length<C.effects.maximumParticles;i++){this.particles.push({x:innerWidth/2,y:innerHeight*.42,vx:(Math.random()-.5)*(big?14:10),vy:-Math.random()*9-2,life:1,size:Math.random()*5+2,angle:Math.random()*Math.PI,feather:i%5===0,color:silver?'#e1e7f1':['#fbe3a2','#d7a83e','#fff5cc'][i%3]});}}
  fireworks(big=false){
    if(this.settings.reducedMotion)return;
    const positions=[[.16,.22],[.84,.25],[.30,.12],[.70,.14]];
    positions.slice(0,big?4:3).forEach(([x,y],i)=>{
      this.fireworkTimers.push(setTimeout(()=>{
        if(this.settings.reducedMotion)return;
        for(let n=0;n<40&&this.particles.length<C.effects.maximumParticles;n++){
          const angle=n/40*Math.PI*2,speed=2.5+Math.random()*3;
          this.particles.push({x:innerWidth*x,y:innerHeight*y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,size:2+Math.random()*2,angle:0,feather:false,color:n%3===0?'#fff6d4':'#e5bc57'});
        }
      },i*240));
    });
  }
  update(dt){const ctx=this.ctx;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);const f=Math.min(dt/16.67,3);this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=.10*f;p.life-=.009*f;p.angle+=.03*f;ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.angle);if(p.feather){ctx.beginPath();ctx.ellipse(0,0,p.size*3,p.size*.65,0,0,Math.PI*2);ctx.fill();}else ctx.fillRect(0,0,p.size,p.size);ctx.restore();}}
  // Every configured clip finishes naturally. Subsequent events wait their turn.
  clip(key,{takeover=false,onFinish=null,variant=null}={}){
    const clips=C.media.videos[key]?.length?C.media.videos[key]:(key==='backToBack'?C.media.videos.fourLineClear:[]);
    if(!clips?.length)return false;
    if(key==='impressivePoints'&&variant===null){variant=this.goodPlayIndex||0;this.goodPlayIndex=variant+1;}
    const item={src:clips[variant===null?Math.floor(Math.random()*clips.length):variant%clips.length],takeover,onFinish};
    if(this.currentClip){this.clipQueue.push(item);return true;}
    this.startClip(item);return true;
  }
  startClip(item){
    this.currentClip=item;this.takeover=item.takeover;this.videoPaused=false;
    const serial=++this.videoSerial,v=this.video.querySelector('video');
    this.video.classList.toggle?.('takeover',item.takeover);this.video.classList.remove('needs-play');
    v.src=item.src;v.volume=C.effects.videoVolume;v.muted=!this.settings.sfx;v.loop=false;
    const finish=()=>{if(serial===this.videoSerial)this.finishClip();};
    v.onended=finish;v.onerror=finish;v.ontimeupdate=null;
    v.onplaying=()=>{if(serial===this.videoSerial)clearTimeout(this.videoTimer);};
    v.onloadeddata=()=>{
      if(serial!==this.videoSerial)return;clearTimeout(this.videoTimer);this.video.hidden=false;
      if(!this.videoPaused)this.playCurrent();
    };
    this.video.hidden=false;v.load();
    // Timeout protects only loading; never cuts off a playing or buffering clip.
    this.videoTimer=setTimeout(finish,C.effects.videoLoadTimeout);
  }
  playCurrent(){
    if(!this.currentClip)return;const serial=this.videoSerial,v=this.video.querySelector('video');
    v.play().catch(()=>{if(serial!==this.videoSerial)return;this.video.classList.add('needs-play');});
  }
  finishClip({drain=true,notify=true}={}){
    const item=this.currentClip;this.currentClip=null;this.videoSerial++;clearTimeout(this.videoTimer);this.takeover=false;this.videoPaused=false;
    const v=this.video.querySelector('video');v.pause();v.onended=null;v.onerror=null;v.onloadeddata=null;v.onplaying=null;v.ontimeupdate=null;v.removeAttribute('src');v.load();
    this.video.hidden=true;this.video.classList.remove('takeover');this.video.classList.remove('needs-play');
    if(notify)item?.onFinish?.();
    if(drain&&this.clipQueue.length)this.startClip(this.clipQueue.shift());
  }
  hideVideo(){this.finishClip();}
  flyby(){if(this.settings.reducedMotion)return;const layer=document.getElementById('goose-flybys');if(!layer)return;layer.replaceChildren();for(let i=0;i<3;i++){const bird=document.createElement('span');const goose=document.createElement('span');goose.textContent='🪿';bird.append(goose);bird.className='flying-goose';bird.style.top=`${22+i*24}%`;bird.style.animationDelay=`${i*.18}s`;if(i===1)bird.classList.add('reverse');bird.addEventListener('animationend',()=>bird.remove(),{once:true});layer.append(bird);}}
  pause(){this.videoPaused=true;this.video.querySelector('video').pause();}
  resume(){this.videoPaused=false;this.playCurrent();}
  clear(){clearTimeout(this.messageTimer);this.announcer.classList.remove('show');this.clipQueue=[];this.finishClip({drain:false,notify:false});this.fireworkTimers.forEach(clearTimeout);this.fireworkTimers=[];document.getElementById?.('goose-flybys')?.replaceChildren();this.particles=[];}
}
