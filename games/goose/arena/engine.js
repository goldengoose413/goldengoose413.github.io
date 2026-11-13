import { CONFIG as C } from './config.js';
import { clearPoints, levelFor, speedFor, pressureLevel } from './scoring.js';
export const SHAPES = [
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  [[1,1],[1,1]], [[0,1,0],[1,1,1],[0,0,0]],
  [[0,1,1],[1,1,0],[0,0,0]], [[1,1,0],[0,1,1],[0,0,0]],
  [[1,0,0],[1,1,1],[0,0,0]], [[0,0,1],[1,1,1],[0,0,0]]
];
export class Game {
  constructor(onEvent=()=>{}, random=Math.random) { this.onEvent=onEvent; this.random=random; this.status='menu'; }
  start(){
    this.board=Array.from({length:C.board.rows},()=>Array(C.board.columns).fill(0));
    this.queue=[];this.bag=[];this.score=0;this.lines=0;this.level=1;this.combo=0;this.bestCombo=0;
    this.pieces=0;this.lastFour=-Infinity;this.lastClearFour=false;this.elapsed=0;this.survivalMinutes=0;
    this.heldPiece=null;this.holdUsed=false;this.gravity=0;this.lockTime=0;this.resets=0;this.status='playing';this.fillQueue();this.spawn();
    this.onEvent({type:'start'});
  }
  fillQueue(){ while(this.queue.length<4){ if(!this.bag.length){this.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}}this.queue.push(this.bag.pop());} }
  spawn(id){if(id===undefined){id=this.queue.shift();this.fillQueue();}this.holdUsed=false;this.active={id,matrix:SHAPES[id].map(r=>[...r]),x:Math.floor((C.board.columns-SHAPES[id].length)/2),y:0};this.gravity=0;this.lockTime=0;this.resets=0;if(!this.valid())this.finish();}
  hold(){if(this.status!=='playing'||this.holdUsed)return false;const outgoing=this.active.id,incoming=this.heldPiece;this.heldPiece=outgoing;this.spawn(incoming===null?undefined:incoming);this.holdUsed=true;this.onEvent({type:'hold'});return true;}
  valid(matrix=this.active.matrix,x=this.active.x,y=this.active.y){return matrix.every((r,dy)=>r.every((v,dx)=>!v||(x+dx>=0&&x+dx<C.board.columns&&y+dy<C.board.rows&&(y+dy<0||!this.board[y+dy][x+dx]))));}
  grounded(){return !this.valid(this.active.matrix,this.active.x,this.active.y+1);}
  resetLock(wasGrounded){if(wasGrounded&&this.resets<C.gameplay.lockResets){this.lockTime=0;this.resets++;}}
  move(dx){if(this.status!=='playing')return false;const ground=this.grounded();if(this.valid(this.active.matrix,this.active.x+dx,this.active.y)){this.active.x+=dx;this.resetLock(ground);return true;}return false;}
  rotate(direction=1){if(this.status!=='playing')return false;if(this.active.id===1)return true;const m=this.active.matrix;const n=m.length;const rotated=Array.from({length:n},(_,y)=>Array.from({length:n},(_,x)=>direction===1?m[n-1-x][y]:m[x][n-1-y]));const ground=this.grounded();for(const [dx,dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1],[0,-2]]){if(this.valid(rotated,this.active.x+dx,this.active.y+dy)){this.active.matrix=rotated;this.active.x+=dx;this.active.y+=dy;this.resetLock(ground);return true;}}return false;}
  drop(soft=false){if(this.status!=='playing')return false;if(this.valid(this.active.matrix,this.active.x,this.active.y+1)){this.active.y++;this.lockTime=0;if(soft)this.score+=C.scoring.softDrop;return true;}return false;}
  ghostY(){let y=this.active.y;while(this.valid(this.active.matrix,this.active.x,y+1))y++;return y;}
  hardDrop(){if(this.status!=='playing')return;const y=this.ghostY();this.score+=(y-this.active.y)*C.scoring.hardDrop;this.active.y=y;this.onEvent({type:'drop'});this.lock();}
  lock(){
    const a=this.active;let above=false;
    a.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v){if(a.y+y<C.board.hiddenRows)above=true;if(a.y+y>=0)this.board[a.y+y][a.x+x]=a.id+1;}}));
    this.pieces++;const cleared=[];for(let y=0;y<C.board.rows;y++)if(this.board[y].every(Boolean))cleared.push(y);
    if(cleared.length){const count=cleared.length;this.board=this.board.filter((_,y)=>!cleared.includes(y));while(this.board.length<C.board.rows)this.board.unshift(Array(C.board.columns).fill(0));
      this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);const b2b=count===4&&this.lastClearFour&&this.pieces-this.lastFour<=C.gameplay.backToBackWindowPieces;
      const points=clearPoints(count,this.level,this.combo,b2b);this.score+=points;this.lines+=count;
      if(count===4){this.lastFour=this.pieces;this.lastClearFour=true;}else this.lastClearFour=false;
      this.onEvent({type:'clear',count,combo:this.combo,backToBack:b2b,points,rows:cleared});
      const old=this.level;this.level=levelFor(this.lines);for(let l=old+1;l<=this.level;l++)this.onEvent({type:'level',level:l});
    }else this.combo=0;
    // A clear can rescue a piece that reached the hidden spawn rows.
    if(above&&!cleared.length){this.finish();return;}this.spawn();
  }
  update(dt){if(this.status!=='playing')return;dt=Math.min(dt,100);this.elapsed+=dt;const minutes=Math.floor(this.elapsed/60000);if(minutes>this.survivalMinutes){this.score+=(minutes-this.survivalMinutes)*C.scoring.survivalPerMinute*this.level;this.survivalMinutes=minutes;}
    this.gravity+=dt;const speed=speedFor(pressureLevel(this.level,this.elapsed,this.pieces));while(this.gravity>=speed){this.gravity-=speed;if(!this.drop())break;}
    if(this.grounded()){this.lockTime+=dt;if(this.lockTime>=C.gameplay.lockDelay)this.lock();}else this.lockTime=0;
  }
  pause(){if(this.status==='playing'){this.status='paused';this.onEvent({type:'pause'});}}
  resume(){if(this.status==='paused'){this.status='playing';this.onEvent({type:'resume'});}}
  finish(){this.status='over';this.onEvent({type:'over'});}
  stats(){return {score:this.score,level:this.level,lines:this.lines,bestCombo:this.bestCombo};}
}
