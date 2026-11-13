import { CONFIG as C } from './config.js';
import { SHAPES } from './engine.js';
export const COLORS=['#e5bd5e','#f6dfa2','#bb944b','#c7d1da','#ae7846','#e0a271','#8bafaa'];
export class Renderer {
  constructor(board,next,hold){this.canvas=board;this.ctx=board.getContext('2d');this.next=next;this.nextCtx=next.getContext('2d');this.hold=hold;this.holdCtx=hold.getContext('2d');hold.width=180;hold.height=88;this.cell=30;board.width=C.board.columns*this.cell;board.height=(C.board.rows-C.board.hiddenRows)*this.cell;next.width=180;next.height=190;}
  cellAt(ctx,x,y,color,size=this.cell,ghost=false){ctx.save();if(ghost){ctx.strokeStyle=color;ctx.globalAlpha=.4;ctx.lineWidth=1.5;ctx.strokeRect(x+2,y+2,size-4,size-4);ctx.fillStyle=color;ctx.globalAlpha=.06;ctx.fillRect(x+2,y+2,size-4,size-4);}else{const g=ctx.createLinearGradient(x,y,x+size,y+size);g.addColorStop(0,color);g.addColorStop(1,'#594421');ctx.fillStyle=g;ctx.fillRect(x+1.5,y+1.5,size-3,size-3);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x+3,y+3,size-6,3);ctx.strokeStyle='rgba(255,245,214,.35)';ctx.strokeRect(x+2.5,y+2.5,size-5,size-5);ctx.fillStyle='rgba(0,0,0,.13)';ctx.fillRect(x+6,y+7,size-12,size-13);}ctx.restore();}
  matrix(ctx,m,x,y,color,size=this.cell,ghost=false){m.forEach((r,dy)=>r.forEach((v,dx)=>{if(v&&y+dy*size>=0)this.cellAt(ctx,x+dx*size,y+dy*size,color,size,ghost);}));}
  draw(game){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#0b1015';c.fillRect(0,0,w,h);c.strokeStyle='#ffffff08';c.lineWidth=1;for(let x=0;x<=w;x+=this.cell){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<=h;y+=this.cell){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    if(!game.board)return;game.board.slice(C.board.hiddenRows).forEach((r,y)=>r.forEach((v,x)=>{if(v)this.cellAt(c,x*this.cell,y*this.cell,COLORS[v-1]);}));
    const a=game.active;if(a&&game.status!=='over'){this.matrix(c,a.matrix,a.x*this.cell,(game.ghostY()-C.board.hiddenRows)*this.cell,COLORS[a.id],this.cell,true);this.matrix(c,a.matrix,a.x*this.cell,(a.y-C.board.hiddenRows)*this.cell,COLORS[a.id]);}
    const hc=this.holdCtx;hc.clearRect(0,0,this.hold.width,this.hold.height);if(game.heldPiece!==null){const id=game.heldPiece,m=SHAPES[id],size=25;hc.save();hc.globalAlpha=game.holdUsed?.45:1;this.matrix(hc,m,(180-m.length*size)/2,(88-m.length*size)/2,COLORS[id],size);hc.restore();}
    const n=this.nextCtx;n.clearRect(0,0,this.next.width,this.next.height);game.queue.slice(0,3).forEach((id,i)=>{const m=SHAPES[id];this.matrix(n,m,Math.round((180-m.length*23)/2),i*61+4,COLORS[id],23);});
  }
}
