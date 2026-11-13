import { CONFIG as C } from './config.js';
export class SharedScores {
 constructor(storage,request=globalThis.fetch){
  if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
  this.storage=storage;this.request=request.bind(globalThis);this.records=[];this.total=0;this.available=false;this.pending=this.read('goose-score-outbox',[]);this.cached=this.read('goose-shared-scores',[]);this.records=Array.isArray(this.cached)?this.cached:[];this.pending=Array.isArray(this.pending)?this.pending:[];this.chain=Promise.resolve();
  const legacy=this.read(C.leaderboard.storageKey,[]);
  for(const r of legacy){if(!r.sharedId){r.sharedId=crypto.randomUUID();r.sharedToken=crypto.randomUUID();this.pending.push({id:r.sharedId,token:r.sharedToken,name:r.name,score:r.score,level:r.level||1,lines:r.lines||0,bestCombo:r.bestCombo||0,date:r.date||new Date().toISOString()});}}
  this.write(C.leaderboard.storageKey,legacy);this.write('goose-score-outbox',this.pending);
 }
 read(key,fallback){try{return JSON.parse(this.storage.getItem(key))||fallback;}catch{return fallback;}}
 write(key,value){try{this.storage.setItem(key,JSON.stringify(value));}catch{}}
 get high(){return this.records[0]?.score||0;}
 get displayRecords(){const rows=new Map(this.records.map(r=>[r.id,r]));for(const r of this.pending)rows.set(r.id,{...r,pending:true});return [...rows.values()].sort((a,b)=>b.score-a.score||Date.parse(a.date)-Date.parse(b.date)).slice(0,100);}
 rank(score){return this.records.filter(r=>r.score>score).length+1;}
 qualifies(score){return score>=0;}
 get playerName(){return this.read('goose-player-name','THE CHALLENGER');}
 makeRecord(stats){return {id:crypto.randomUUID(),token:crypto.randomUUID(),name:this.playerName,...stats,date:new Date().toISOString()};}
 async refresh(){try{const response=await this.request('/api/scores',{cache:'no-store'});if(!response.ok)throw Error();this.apply(await response.json());}catch{this.available=false;}return this.available;}
 apply(data){this.records=data.records;this.total=data.total;this.available=true;this.write('goose-shared-scores',this.records);}
 save(record,name){
  if(name!==undefined){record.name=name.trim().slice(0,16)||'THE CHALLENGER';this.write('goose-player-name',record.name);}
  const index=this.pending.findIndex(r=>r.id===record.id);if(index<0)this.pending.push({...record});else this.pending[index]={...record};this.write('goose-score-outbox',this.pending);
  return this.sync().then(()=>!this.pending.some(r=>r.id===record.id));
 }
 sync(){this.chain=this.chain.catch(()=>{}).then(async()=>{
  for(const record of [...this.pending]){
   try{const response=await this.request('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)});if(!response.ok)throw Error();const data=await response.json();this.apply(data);this.lastRank=data.rank;
    this.pending=this.pending.filter(r=>r.id!==record.id||r.name!==record.name);this.write('goose-score-outbox',this.pending);
   }catch{this.available=false;break;}
  }
 });return this.chain;}
}
