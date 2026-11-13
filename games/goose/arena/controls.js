import { CONFIG as C } from './config.js';
export class Controls {
  constructor(game,actions){this.game=game;this.actions=actions;this.held=new Map();const keys={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate',KeyX:'rotate',KeyZ:'counter',Space:'drop',KeyC:'hold',ShiftLeft:'hold',ShiftRight:'hold',KeyP:'pause',Escape:'pause'};
    document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;const action=keys[e.code];if(!action)return;e.preventDefault();if(e.repeat)return;this.press(action);});
    document.addEventListener('keyup',e=>{const action=keys[e.code];if(action)this.release(action);});window.addEventListener('blur',()=>{this.clear();this.actions.blur();});
    // Safari can still rubber-band or pinch when a gesture starts in a HUD gap.
    // Keep dialogs scrollable and leave browser zoom available outside gameplay.
    const guard=e=>{if(document.body?.classList.contains('arena-active')&&!e.target.closest?.('dialog')&&e.cancelable)e.preventDefault();};
    document.addEventListener('touchmove',guard,{passive:false});
    document.addEventListener('gesturestart',guard,{passive:false});
    this.bindBoard(document.querySelector?.('#board'));
    document.querySelectorAll('[data-control]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.press(b.dataset.control);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>this.release(b.dataset.control));});
  }
  bindBoard(board){
    if(!board)return;
    board.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'||this.game.status!=='playing'||this.gesture)return;
      e.preventDefault();board.setPointerCapture(e.pointerId);
      this.gesture={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
    });
    board.addEventListener('pointermove',e=>{
      const g=this.gesture;if(!g||g.id!==e.pointerId)return;e.preventDefault();
      const step=Math.max(14,board.getBoundingClientRect().width/10);
      const dx=e.clientX-g.x,dy=e.clientY-g.y;
      if(Math.abs(dx)>=step){const direction=dx>0?1:-1;const count=Math.floor(Math.abs(dx)/step);for(let i=0;i<count;i++)this.execute(direction>0?'right':'left');g.x+=direction*count*step;g.moved=true;}
      if(dy>=step){const count=Math.floor(dy/step);for(let i=0;i<count;i++)this.execute('down');g.y+=count*step;g.moved=true;}
      if(Math.hypot(e.clientX-g.startX,e.clientY-g.startY)>10)g.moved=true;
    });
    board.addEventListener('pointerup',e=>{
      const g=this.gesture;if(!g||g.id!==e.pointerId)return;e.preventDefault();
      const dx=e.clientX-g.startX,dy=e.clientY-g.startY;
      const threshold=Math.max(60,board.getBoundingClientRect().height*.12);
      if(dy>=threshold&&dy>Math.abs(dx)*1.5)this.execute('drop');
      else if(!g.moved&&Math.hypot(dx,dy)<10)this.execute('rotate');
      this.gesture=null;
    });
    for(const event of ['pointercancel','lostpointercapture'])board.addEventListener(event,()=>{this.gesture=null;});
  }
  execute(action){const g=this.game;if(action==='pause'){this.actions.pause();return;}if(g.status!=='playing')return;if(action==='left')g.move(-1);if(action==='right')g.move(1);if(action==='down')g.drop(true);if(action==='rotate')g.rotate();if(action==='counter')g.rotate(-1);if(action==='drop')g.hardDrop();if(action==='hold')g.hold();}
  press(action){if(this.held.has(action))return;this.execute(action);if(['left','right','down'].includes(action))this.held.set(action,{elapsed:0,next:action==='down'?35:C.gameplay.repeatDelay});}
  release(action){this.held.delete(action);}
  clear(){this.held.clear();this.gesture=null;}
  update(dt){for(const [action,h] of this.held){h.elapsed+=dt;if(h.elapsed>=h.next){this.execute(action);h.next=h.elapsed+(action==='down'?35:C.gameplay.repeatInterval);}}}
}
