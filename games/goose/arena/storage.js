import { CONFIG as C } from './config.js';
export class Scores {
  constructor(storage=globalThis.localStorage){this.storage=storage;this.available=true;this.records=this.read();}
  read(){try{const v=JSON.parse(this.storage.getItem(C.leaderboard.storageKey)||'[]');return Array.isArray(v)?v.filter(r=>typeof r.name==='string'&&Number.isFinite(r.score)&&r.score>=0).sort((a,b)=>b.score-a.score).slice(0,C.leaderboard.size):[];}catch{this.available=false;return [];}}
  get high(){return this.records[0]?.score||0;}
  rank(score){return this.records.filter(r=>r.score>=score).length+1;}
  qualifies(score){return score>0&&this.rank(score)<=C.leaderboard.size;}
  add(name,stats){const record={name:name.trim().slice(0,16)||'THE CHALLENGER',...stats,date:new Date().toISOString()};this.records.push(record);this.records.sort((a,b)=>b.score-a.score);this.records=this.records.slice(0,C.leaderboard.size);try{this.storage.setItem(C.leaderboard.storageKey,JSON.stringify(this.records));}catch{this.available=false;}return this.records.indexOf(record)+1;}
}
export function readSettings(){try{return JSON.parse(localStorage.getItem('goose-settings')||'{}');}catch{return {};}}
export function saveSettings(settings){try{localStorage.setItem('goose-settings',JSON.stringify(settings));return true;}catch{return false;}}
export class MediaStore {
  constructor(){this.db=null;this.urls=[];}
  async open(){if(!globalThis.indexedDB)return;this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open('goose-media-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async load(){if(!this.db)return {};return new Promise((resolve,reject)=>{const out={};const t=this.db.transaction('assets');const r=t.objectStore('assets').openCursor();r.onsuccess=()=>{const c=r.result;if(c){out[c.key]=c.value.map(f=>{const url=URL.createObjectURL(f);this.urls.push(url);return url;});c.continue();}else resolve(out);};r.onerror=()=>reject(r.error);});}
  async put(key,files){if(!this.db)throw new Error('Persistent media storage unavailable.');return new Promise((resolve,reject)=>{const t=this.db.transaction('assets','readwrite');t.objectStore('assets').put([...files],key);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
  async remove(key){if(!this.db)return;return new Promise((resolve,reject)=>{const t=this.db.transaction('assets','readwrite');t.objectStore('assets').delete(key);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}
}
