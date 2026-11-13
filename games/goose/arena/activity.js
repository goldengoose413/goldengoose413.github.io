export class Activity {
 constructor(request=globalThis.fetch){this.request=request.bind(globalThis);this.chain=Promise.resolve();this.enabled=!new URLSearchParams(globalThis.location?.search||'').has('qa');this.visitorId=this.read('goose-visitor-id',null)||crypto.randomUUID();this.write('goose-visitor-id',this.visitorId);this.pending=this.read('goose-activity-outbox',[]);if(!Array.isArray(this.pending))this.pending=[];}
 read(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}}
 write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
 track(kind){if(!this.enabled)return Promise.resolve();this.pending.push({id:crypto.randomUUID(),visitorId:this.visitorId,kind});this.write('goose-activity-outbox',this.pending);return this.flush();}
 flush(){this.chain=this.chain.catch(()=>{}).then(async()=>{for(const event of [...this.pending]){try{const response=await this.request('/api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),keepalive:true});if(!response.ok)break;this.pending=this.pending.filter(e=>e.id!==event.id);this.write('goose-activity-outbox',this.pending);}catch{break;}}});return this.chain;}
 async summary(){await this.flush();const response=await this.request('/api/activity',{cache:'no-store'});if(!response.ok)throw Error('Activity unavailable');return response.json();}
}
