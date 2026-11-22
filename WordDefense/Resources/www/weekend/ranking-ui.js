(()=>{'use strict';
const $=s=>document.querySelector(s),service=()=>window.RhythmLeaderboard;
let generation=0,cursor=null,busy=false,exhausted=false,rows=0,around=false,timer=0,resultToken=null,lastMineRank=null;
const shownUsers=new Set();
function profile(el,p){
 el.replaceChildren();el.classList.remove('profile-unavailable','has-profile');
 const host=window.WeekendClient?.host;
 if(host?.avatarHTML&&Number.isInteger(p?.avatar)){el.innerHTML=host.avatarHTML(p.avatar,p.frame||0);el.classList.add('has-profile');}
 else{el.textContent='?';el.classList.add('profile-unavailable');}
}
function rate(stats){const value=stats?.attempts>0?stats.clears/stats.attempts*100:null;$('#clear-success-value').textContent=value===null?'—':value.toFixed(1)+'%';$('#clear-success-fill').style.width=(value||0)+'%';}
async function refreshRate(){try{rate(await service()?.stats());}catch{$('#clear-success-value').textContent='—';}}
function status(message){$('#ranking-message').textContent=message;$('#ranking-message').hidden=!message;}
function meCard(me){
 const rank=me?.rank;
 $('#my-ranking-place').textContent=rank?rank+'위':'—';
 $('#my-ranking-nick').textContent=me?.profile?.nick||window.WeekendClient?.snapshot().profile?.nick||'나';
 $('#my-ranking-score').textContent=me?.score?.toLocaleString()||'—';
 profile($('#my-ranking-avatar'),me?.profile||window.WeekendClient?.snapshot().profile);
 const card=$('#my-ranking-card'),change=$('#my-ranking-change');
 card.disabled=!rank;card.setAttribute('aria-label',around?'전체 순위 보기':'내 순위 주변 보기');
 $('#my-ranking-action').textContent=rank?(around?'전체 순위 보기 ›':'내 순위 보기 ›'):'아직 기록 없음';
 change.classList.remove('rank-up','rank-down');
 if(rank&&lastMineRank&&rank!==lastMineRank){const down=rank>lastMineRank;change.textContent=(down?'▼ ':'▲ ')+Math.abs(rank-lastMineRank);change.classList.add(down?'rank-down':'rank-up');}
 else if(!lastMineRank)change.textContent='최고 기록';
 lastMineRank=rank||null;
}
function row(item){
 const el=document.createElement('div');el.dataset.uid=item.uid;el.className='ranking-row'+(item.rank<=3?' podium podium-'+item.rank:'')+(item.isMe?' is-mine':'');
 const rank=document.createElement('strong');rank.className='ranking-place';rank.textContent=item.rank;
 const face=document.createElement('span');face.className='ranking-avatar';profile(face,item.profile);
 const nick=document.createElement('span');nick.className='ranking-nick';nick.textContent=item.profile?.nick||'이름 정보 없음';
 const score=document.createElement('b');score.className='ranking-score';score.textContent=item.score.toLocaleString();
 el.append(rank,face,nick,score);return el;
}
function paint(data,reset){
 if(reset){shownUsers.clear();$('#ranking-list').replaceChildren();rows=0;}
 for(const item of data.entries){if(shownUsers.has(item.uid))continue;shownUsers.add(item.uid);$('#ranking-list').append(row(item));rows++;}
 cursor=data.cursor;exhausted=!cursor;meCard(data.me);status(rows?'':'아직 이 곡의 순위 기록이 없어요');
 $('#ranking-more').hidden=around||exhausted;$('#ranking-retry').hidden=true;
}
async function load({reset=false,near=false,quiet=false}={}){
 if(busy||(!reset&&exhausted))return;busy=true;const ticket=generation;$('#ranking-retry').hidden=true;
 if(!quiet&&!rows)status('순위를 불러오는 중…');
 try{const data=near?await service().aroundMe():await service().page(reset?null:cursor);if(ticket!==generation)return;
  if(reset)around=near;paint(data,reset);
 }catch(error){if(ticket!==generation)return;status(error?.code==='account-required'?'단어디펜스 계정으로 접속하면 곡별 순위를 볼 수 있어요.':'순위를 불러오지 못했어요. 다시 시도해 주세요.');$('#ranking-more').hidden=true;$('#ranking-retry').hidden=error?.code==='account-required';}
 finally{if(ticket===generation)busy=false;}
}
function ensureTimer(){if(!timer)timer=setInterval(()=>{if(!document.hidden&&!$('#results').hidden)refreshVisible();},10000);}
function open(){
 generation++;rows=0;cursor=null;busy=false;exhausted=false;around=false;lastMineRank=null;shownUsers.clear();
 meCard(null);$('#ranking-more').hidden=true;$('#ranking-retry').hidden=true;
 $('.result-panel:not(.song-ranking-panel)').hidden=true;$('#song-ranking-panel').hidden=false;$('#ranking-song').textContent=window.SONG_CHART.title;
 $('#ranking-list').replaceChildren();$('#ranking-list').scrollTop=0;$('#ranking-back').focus({preventScroll:true});ensureTimer();load({reset:true});
}
function close(){generation++;busy=false;$('#song-ranking-panel').hidden=true;$('.result-panel:not(.song-ranking-panel)').hidden=false;$('#show-song-ranking').focus({preventScroll:true});}
async function refreshVisible(){
 if($('#song-ranking-panel').hidden){refreshRate();return;}
 if(busy)return;
 if(around||$('#ranking-list').scrollTop<2){load({reset:true,near:around,quiet:true});return;}
 const ticket=generation;busy=true;
 try{const me=await service().mine();if(ticket===generation)meCard(me);}
 catch{if(ticket===generation)status('연결이 복구되면 순위를 갱신해요');}
 finally{if(ticket===generation)busy=false;}
}
function recordNote(info){
 const el=$('#result-record-note');el.hidden=!info?.bestScore;if(el.hidden)return;
 el.classList.toggle('is-new',!!(info.firstRecord||info.newBest));
 el.textContent=info.firstRecord?'첫 기록':info.newBest?'신기록!':info.accuracyImproved?'정확도 향상':'최고 기록 '+info.bestScore.toLocaleString();
}
function present(score){
 $('#song-ranking-panel').hidden=true;$('.result-panel:not(.song-ranking-panel)').hidden=false;$('#clear-success-value').textContent='—';$('#clear-success-fill').style.width='0%';$('#result-record-note').hidden=true;
 resultToken=service()?.currentToken();const token=resultToken;ensureTimer();
 Promise.resolve(service()?.finish(score)).then(info=>{if(token===resultToken){recordNote(info);refreshRate();}}).catch(error=>{if(token===resultToken){const el=$('#result-record-note');el.hidden=error?.code==='account-required';el.classList.remove('is-new');el.textContent='기록 동기화 대기';refreshRate();}});
}
function stop(){generation++;busy=false;clearInterval(timer);timer=0;resultToken=null;lastMineRank=null;}
$('#show-song-ranking').onclick=open;$('#ranking-back').onclick=close;$('#ranking-more').onclick=()=>load();$('#ranking-retry').onclick=()=>{if(!busy)open();};
$('#my-ranking-card').onclick=()=>{if(!busy){generation++;$('#ranking-list').scrollTop=0;load({reset:true,near:!around});}};
$('#ranking-list').addEventListener('scroll',e=>{const el=e.currentTarget;if(!around&&el.scrollHeight>el.clientHeight+2&&el.scrollTop+el.clientHeight>=el.scrollHeight-60)load();});
addEventListener('rhythm-record-saved',e=>{if(e.detail.token===resultToken&&e.detail.song===window.SONG_CHART.id)recordNote(e.detail.info);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('#results').hidden)refreshVisible();});
window.RankUI={present,open,close,stop,refreshVisible};
})();
