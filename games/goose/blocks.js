"use strict";
const $=id=>document.getElementById(id),W=6,H=10,colors=['#ebca75','#86d6cb','#cd9ade','#8db9ec'];
let board,piece,rows=0,paused=false,elapsed=0,last=0,celebrations=0;
try{rows=Number(localStorage.getItem('little-goose-block-rows'))||0;}catch{}
const shapes=[[[1,1],[1,1]],[[1,1,1]],[[1,0],[1,1]],[[1,1,1],[0,1,0]]];
function fits(m,x,y){return m.every((row,j)=>row.every((v,i)=>!v||(x+i>=0&&x+i<W&&y+j>=0&&y+j<H&&!board[y+j][x+i])));}
function fresh(){board=Array.from({length:H},()=>Array(W).fill(0));board[8]=[1,1,0,0,1,1];board[9]=[2,2,0,0,2,2];spawn(true);elapsed=0;$('block-message').textContent='Fill the empty spaces at the bottom!';draw();}
function spawn(first=false){const index=first?0:Math.floor(Math.random()*shapes.length);piece={m:shapes[index].map(r=>r.slice()),x:Math.floor((W-shapes[index][0].length)/2),y:0,color:index+1};if(!fits(piece.m,piece.x,0)){board=Array.from({length:H},()=>Array(W).fill(0));$('block-message').textContent='A fresh space! Keep playing!';Arena.tryAgain();}elapsed=0;}
function lock(){piece.m.forEach((r,j)=>r.forEach((v,i)=>{if(v)board[piece.y+j][piece.x+i]=piece.color}));const left=board.filter(r=>r.some(v=>!v)),count=H-left.length;board=[...Array.from({length:count},()=>Array(W).fill(0)),...left];if(count){rows+=count;try{localStorage.setItem('little-goose-block-rows',String(rows));}catch{}$('block-message').textContent='You did it! '+count+' row'+(count===1?'':'s')+'!';Arena.celebrate(celebrations++,3);}spawn();}
function step(){if(fits(piece.m,piece.x,piece.y+1))piece.y++;else lock();}
function act(action){if(paused||Arena.busy||document.hidden||!$('intro-screen').classList.contains('hidden'))return;if(action==='left'||action==='right'){const x=piece.x+(action==='left'?-1:1);if(fits(piece.m,x,piece.y))piece.x=x;}else if(action==='rotate'){const m=piece.m[0].map((_,i)=>piece.m.map(r=>r[i]).reverse());for(const dx of [0,-1,1,-2,2]){if(fits(m,piece.x+dx,piece.y)){piece.m=m;piece.x+=dx;break;}}}else if(action==='down')step();else if(action==='drop'){while(fits(piece.m,piece.x,piece.y+1))piece.y++;lock();}elapsed=0;draw();}
function draw(){const c=$('blocks-board').getContext('2d'),s=60;c.clearRect(0,0,W*s,H*s);for(let y=0;y<H;y++)for(let x=0;x<W;x++){c.strokeStyle='#ffffff12';c.strokeRect(x*s,y*s,s,s);if(board[y][x])cell(x,y,board[y][x]);}let ghost=piece.y;while(fits(piece.m,piece.x,ghost+1))ghost++;piece.m.forEach((r,j)=>r.forEach((v,i)=>{if(v){c.strokeStyle='#fff0b7';c.lineWidth=2;c.strokeRect((piece.x+i)*s+6,(ghost+j)*s+6,s-12,s-12);cell(piece.x+i,piece.y+j,piece.color)}}));function cell(x,y,n){c.fillStyle=colors[n-1];c.fillRect(x*s+3,y*s+3,s-6,s-6);c.fillStyle='#ffffff50';c.fillRect(x*s+7,y*s+7,s-14,5);}c.lineWidth=1;$('stars-count').textContent='★ '+rows+' rows';}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));document.addEventListener('keydown',e=>{if(e.target.matches('input,button,a'))return;const key={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down',' ':'drop'}[e.key];if(key){e.preventDefault();act(key);}});
// Touch controls on the board itself, so little fingers can play without the buttons:
// drag sideways to slide the piece, drag down to sink it, quick tap to turn it,
// fast swipe down to place it. (Canvas already has touch-action:none in blocks.css.)
(function(){const cv=$('blocks-board');let sx=0,sy=0,lx=0,ly=0,st=0,moved=false;
const cell=()=>cv.getBoundingClientRect().width/W;
cv.addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=lx=t.clientX;sy=ly=t.clientY;st=Date.now();moved=false;e.preventDefault();},{passive:false});
cv.addEventListener('touchmove',e=>{const t=e.changedTouches[0],dx=t.clientX-lx,dy=t.clientY-ly,c=cell();
if(Math.abs(dx)>=c*0.6){act(dx>0?'right':'left');lx=t.clientX;moved=true;}
if(dy>=c*0.6){act('down');ly=t.clientY;moved=true;}
e.preventDefault();},{passive:false});
cv.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;
if(!moved&&Math.abs(dx)<12&&Math.abs(dy)<12&&dt<400)act('rotate');
else if(dy>90&&dt<300)act('drop');
e.preventDefault();},{passive:false});
cv.addEventListener('touchcancel',()=>{moved=false;});})();
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';elapsed=0;};$('restart').onclick=()=>{if(Arena.busy)return;fresh();};document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;$('pause').textContent='Resume';}elapsed=0;});
function tick(now){const dt=Math.min(100,now-last);last=now;if(!paused&&!Arena.busy&&!document.hidden&&!$('manual').checked&&$('intro-screen').classList.contains('hidden')){elapsed+=dt;if(elapsed>=1800){elapsed=0;step();draw();}}else elapsed=0;requestAnimationFrame(tick);}fresh();requestAnimationFrame(tick);
