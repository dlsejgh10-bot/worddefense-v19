(()=>{'use strict';let attempt=null;const profileCache=new Map(),OUTBOX='wd-rhythm-results-v59',RECEIPTS='wd-rhythm-receipts-v61';
function queued(){try{return JSON.parse(localStorage.getItem(OUTBOX)||'[]')}catch{return[]}}
function saveJob(job){const items=queued().filter(j=>j.id!==job.id);items.push(job);localStorage.setItem(OUTBOX,JSON.stringify(items.slice(-30)));}
function dropJob(id){localStorage.setItem(OUTBOX,JSON.stringify(queued().filter(j=>j.id!==id)));}
function receipt(id){try{return JSON.parse(localStorage.getItem(RECEIPTS)||'[]').find(r=>r.id===id)?.info}catch{return null}}
function remember(job,info){let items=[];try{items=JSON.parse(localStorage.getItem(RECEIPTS)||'[]')}catch{}items=items.filter(r=>r.id!==job.id);items.push({id:job.id,info});localStorage.setItem(RECEIPTS,JSON.stringify(items.slice(-20)));if(window.dispatchEvent&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('rhythm-record-saved',{detail:{token:job.token,song:job.song,info}}));return info;}
function unavailable(){return Object.assign(new Error('Account bridge required'),{code:'account-required'});}
async function account(){const host=window.WeekendClient?.host;let net;try{net=parent!==window?parent.WDNet:null;}catch{}if(!host||!net?._?.token)throw unavailable();const auth=await net._.token(),p=host.profile();if(!auth?.uid||!p?.nick)throw unavailable();return{net,auth,profile:{uid:auth.uid,nick:p.nick,avatar:Number.isInteger(p.avatar)?p.avatar:4,frame:Number.isInteger(p.frame)?p.frame:0}};}
const root=sid=>'/rhythm_songs/'+encodeURIComponent(sid),sid=()=>window.SONG_CHART.id;
const decode=(net,doc)=>Object.fromEntries(Object.entries(doc?.fields||{}).map(([k,v])=>[k,net._.dec(v)]));
const name=(net,path)=>`projects/${net.cfg.projectId}/databases/(default)/documents${path}`;
function write(net,path,data,transforms=[],precondition){const result={update:{name:name(net,path),fields:net._.encF(data)}};if(transforms.length)result.updateTransforms=transforms.map(field=>({fieldPath:field,setToServerValue:'REQUEST_TIME'}));if(precondition)result.currentDocument=precondition;return result;}
async function get(c,path){try{const doc=await c.net._.call(path,null,'GET',c.auth);return{...decode(c.net,doc),_doc:doc};}catch(error){if(error.status===404)return null;throw error;}}
async function commit(c,writes){return c.net._.call(':commit',{writes},'POST',c.auth);}
function token(){const data=new Uint32Array(4);crypto.getRandomValues(data);return[...data].map(n=>n.toString(16).padStart(8,'0')).join('');}
function begin(){const run={token:token(),song:sid(),version:window.SongDB.revision,ended:false};attempt=run;
 run.ready=(async()=>{const c=await account();run.client=c;run.id=c.auth.uid+'_'+run.token;const data={uid:c.auth.uid,song:run.song,token:run.token,version:window.SongDB.revision,ended:false,clearedCount:0,score:0,accuracy:0,maxCombo:0};
  await commit(c,[write(c.net,'/rhythm_profiles/'+c.auth.uid,c.profile,['updatedAt']),write(c.net,root(run.song)+'/runs/'+run.id,data,['startedAt'],{exists:false})]);return run;})();
 run.ready.catch(error=>{window.songRankingError=String(error);});return run;
}
async function finish(result){const run=attempt;if(!run||run.ended||result.record===false)return;if(run.finishing)return run.finishing;
 run.finishing=(async()=>{await run.ready.catch(()=>{});if(!run.client)throw unavailable();const job={id:run.id,uid:run.client.auth.uid,token:run.token,song:run.song,version:run.version,result};saveJob(job);const info=await submit(run.client,job);run.ended=true;return info;})().finally(()=>{run.finishing=null});return run.finishing;
}
async function submit(c,job){const run=job,result=job.result;if(job.uid!==c.auth.uid)throw unavailable();
 const data={uid:c.auth.uid,song:run.song,token:run.token,version:run.version,ended:true,clearedCount:result.failed?0:1,score:Math.round(result.score),accuracy:Math.round(result.accuracy*100)/100,maxCombo:Math.round(result.maxCombo)};
 for(let retry=0;retry<3;retry++){
  const current=await get(c,root(run.song)+'/scores/'+c.auth.uid);let oldRun=await get(c,root(run.song)+'/runs/'+run.id);if(oldRun?.ended){dropJob(job.id);return receipt(job.id)||{bestScore:current?.score||null,recorded:!!current};}
  if(!oldRun){await commit(c,[write(c.net,root(run.song)+'/runs/'+run.id,{...data,ended:false,clearedCount:0,score:0,accuracy:0,maxCombo:0},['startedAt'],{exists:false})]);oldRun=await get(c,root(run.song)+'/runs/'+run.id);}
  const update=write(c.net,root(run.song)+'/runs/'+run.id,data,['finishedAt'],{updateTime:oldRun._doc.updateTime});update.update.fields.startedAt=oldRun._doc.fields.startedAt;
  const writes=[update,write(c.net,'/rhythm_profiles/'+c.auth.uid,c.profile,['updatedAt'])];
  const improved=data.score>0&&(!current||data.score>current.score||(data.score===current.score&&data.accuracy>current.accuracy));
  if(improved)writes.push(write(c.net,root(run.song)+'/scores/'+c.auth.uid,{uid:c.auth.uid,song:run.song,runId:run.id,score:data.score,accuracy:data.accuracy,maxCombo:data.maxCombo,cleared:data.clearedCount===1},['at'],current?{updateTime:current._doc.updateTime}:{exists:false}));
  try{await commit(c,writes);profileCache.delete(c.auth.uid);dropJob(job.id);return remember(job,{recorded:!!current||improved,firstRecord:!current&&improved,newBest:!!current&&data.score>current.score,accuracyImproved:!!current&&data.score===current.score&&data.accuracy>current.accuracy,bestScore:improved?data.score:current?.score||null});}catch(error){if(retry===2||![400,409,412].includes(error.status))throw error;}
 }
}
function abandon(){const run=attempt;if(!run||run.ended)return;finish({score:0,accuracy:0,maxCombo:0,failed:true,record:true}).catch(error=>{window.songRankingError=String(error);});}
async function aggregate(c,query,aggregations){const response=await c.net._.call(root(sid())+':runAggregationQuery',{structuredAggregationQuery:{structuredQuery:query,aggregations}},'POST',c.auth);return Object.fromEntries(Object.entries(response.find(r=>r.result)?.result?.aggregateFields||{}).map(([k,v])=>[k,c.net._.dec(v)]));}
async function flush(c){for(const job of queued().filter(j=>j.uid===c.auth.uid))await submit(c,job);}
async function stats(){const c=await account();await flush(c);const result=await aggregate(c,{from:[{collectionId:'runs'}]},[{alias:'attempts',count:{}},{alias:'clears',sum:{field:{fieldPath:'clearedCount'}}}]);return{attempts:Number(result.attempts)||0,clears:Number(result.clears)||0};}
async function profiles(c,uids){const missing=[...new Set(uids)].filter(uid=>!profileCache.has(uid)||Date.now()-(profileCache.get(uid)?._cachedAt||0)>10000);if(missing.length){const docs=missing.map(uid=>name(c.net,'/rhythm_profiles/'+uid));const response=await c.net._.call(':batchGet',{documents:docs},'POST',c.auth);for(const item of response){if(item.found){const p=decode(c.net,item.found);profileCache.set(p.uid,{...p,_cachedAt:Date.now()});}}}return uid=>profileCache.get(uid)||null;}
async function rankFor(c,score){const count=await aggregate(c,{from:[{collectionId:'scores'}],where:{fieldFilter:{field:{fieldPath:'score'},op:'GREATER_THAN',value:{integerValue:String(score)}}}},[{alias:'higher',count:{}}]);return Number(count.higher||0)+1;}
async function own(c){const score=await get(c,root(sid())+'/scores/'+c.auth.uid),p=await profiles(c,[c.auth.uid]);return score?{uid:c.auth.uid,score:score.score,rank:await rankFor(c,score.score),profile:p(c.auth.uid)||c.profile}:{uid:c.auth.uid,profile:c.profile};}
async function mine(){const c=await account();await flush(c);return own(c);}
async function aroundMe(){const c=await account();await flush(c);const me=await own(c),ownScore=await get(c,root(sid())+'/scores/'+c.auth.uid);if(!ownScore)return{entries:[],me,cursor:null,around:true};
 const query=async(direction,limit)=>{const response=await c.net._.call(root(sid())+':runQuery',{structuredQuery:{from:[{collectionId:'scores'}],orderBy:[{field:{fieldPath:'score'},direction},{field:{fieldPath:'__name__'},direction}],startAt:{values:[{integerValue:String(ownScore.score)},{referenceValue:ownScore._doc.name}],before:false},limit}},'POST',c.auth);return response.filter(r=>r.document).map(r=>decode(c.net,r.document));};
 const [higher,lower]=await Promise.all([query('ASCENDING',3),query('DESCENDING',6)]),docs=[...higher.reverse(),ownScore,...lower],p=await profiles(c,docs.map(d=>d.uid)),ranks=new Map();
 await Promise.all([...new Set(docs.map(d=>d.score))].map(async score=>ranks.set(score,await rankFor(c,score))));
 return{entries:docs.map(d=>({uid:d.uid,score:d.score,rank:ranks.get(d.score),profile:p(d.uid),isMe:d.uid===c.auth.uid})),me,cursor:null,around:true};
}
async function page(cursor){const c=await account();await flush(c);const query={from:[{collectionId:'scores'}],orderBy:[{field:{fieldPath:'score'},direction:'DESCENDING'},{field:{fieldPath:'__name__'},direction:'DESCENDING'}],limit:30};if(cursor)query.startAt={values:[{integerValue:String(cursor.score)},{referenceValue:cursor.doc}],before:false};
 const response=await c.net._.call(root(sid())+':runQuery',{structuredQuery:query},'POST',c.auth);const docs=response.filter(r=>r.document).map(r=>({...decode(c.net,r.document),_doc:r.document}));const own=await get(c,root(sid())+'/scores/'+c.auth.uid);const p=await profiles(c,[...docs.map(d=>d.uid),c.auth.uid]);
 let offset=cursor?.offset||0,previous=cursor?.previousScore,rank=cursor?.previousRank||0;const entries=docs.map((d,i)=>{if(d.score!==previous){rank=offset+i+1;previous=d.score;}return{uid:d.uid,score:d.score,rank,profile:p(d.uid),isMe:d.uid===c.auth.uid};});
 let myRank=null;if(own)myRank=await rankFor(c,own.score);
 const last=docs.at(-1);return{entries,me:own?{uid:c.auth.uid,score:own.score,rank:myRank,profile:p(c.auth.uid)}:{uid:c.auth.uid,profile:c.profile},cursor:docs.length===30?{score:last.score,doc:last._doc.name,offset:offset+docs.length,previousScore:last.score,previousRank:rank}:null};
}
window.RhythmLeaderboard={begin,finish,abandon,stats,page,mine,aroundMe,currentToken:()=>attempt?.token};
})();
