'use strict';
// Local-only scoreboard for the hub copy of The Great Escape.
// The shared leaderboard needs the ChatGPT site's Cloudflare Worker (/api/leaderboard),
// which GitHub Pages cannot run. Per the handoff's sanctioned static route, this
// version keeps the player's name and best escapes in browser local storage only.
const Leaderboard=(()=>{const $=id=>document.getElementById(id),key='goose-escape-player-v1';let player=null,latest={};try{player=JSON.parse(localStorage.getItem(key))}catch{}if(!player?.id)player={id:'local',name:''};$('player-name').value=player.name||'';
function remember(){try{localStorage.setItem(key,JSON.stringify(player));}catch{$('score-status').textContent='Browser storage is unavailable; your player may not be remembered.';}}
function totals(){const rows=Object.values(latest||{});return{levels:rows.length,stars:rows.reduce((n,r)=>n+(r.stars||0),0),moves:rows.reduce((n,r)=>n+(r.moves||0),0)};}
function draw(){const body=$('score-rows');body.replaceChildren();const t=totals();if(!t.levels){$('board-status').textContent='No escapes yet. Finish a level to start your record!';return;}$('board-status').textContent='Your best escapes, kept on this device';const tr=document.createElement('tr');tr.className='my-score';[1,player.name||'You',t.levels,t.stars,t.moves].forEach(v=>{const td=document.createElement('td');td.textContent=String(v);tr.append(td)});body.append(tr);}
function saveScores(){if(!player.name){$('score-status').textContent='Enter and save a player name first.';$('player-name').focus();return;}draw();$('score-status').textContent='Saved! Your best results are kept on this device.';}
$('player-form').onsubmit=e=>{e.preventDefault();const name=$('player-name').value.trim();if(!name||name.length>20||/[\u0000-\u001f<>]/.test(name)){$('score-status').textContent='Enter a name or nickname of 1–20 characters.';return;}player.name=name;remember();draw();$('score-status').textContent='Name saved on this device.';};
$('sync-scores').onclick=saveScores;
$('refresh-scores').onclick=()=>draw();
return {update(best,post=false){latest=best||{};draw();if(post&&player.name)$('score-status').textContent='Saved on this device.';},init(best){latest=best||{};draw();}};
})();
