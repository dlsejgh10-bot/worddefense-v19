(()=>{'use strict';
const $=s=>document.querySelector(s);let generation=0,cursor=null,busy=false,exhausted=false,rows=0,lastScore=null;
const service=()=>window.RhythmLeaderboard;
function profile(el,p){el.replaceChildren();el.classList.remove('profile-unavailable','has-profile');const host=window.WeekendClient?.host;if(host?.avatarHTML&&Number.isInteger(p?.avatar)){el.innerHTML=host.avatarHTML(p.avatar,p.frame||0);el.classList.add('has-profile');}else{el.textContent='?';el.classList.add('profile-unavailable');}}
function rate(stats){const value=stats?.attempts>0?stats.clears/stats.attempts*100:null;$('#clear-success-value').textContent=value===null?'—':value.toFixed(1)+'%';$('#clear-success-fill').style.width=(value||0)+'%';$('#clear-success-context').textContent=stats?.attempts>0?`${stats.attempts.toLocaleString()}회 도전 · ${stats.clears.toLocaleString()}회 완주`:'아직 집계된 기록이 없어요';}
async function refreshRate(){try{rate(await service()?.stats());}catch{$('#clear-success-value').textContent='—';$('#clear-success-context').textContent='완주 기록을 불러오지 못했어요';}}
function status(message){$('#ranking-message').textContent=message;$('#ranking-message').hidden=!message;}
async function load(){if(busy||exhausted)return;busy=true;const ticket=generation;status(rows?'':'순위를 불러오는 중…');
 try{const page=await service().page(cursor);if(ticket!==generation)return;cursor=page.cursor;exhausted=!cursor;
  for(const item of page.entries){const row=document.createElement('div');row.className='ranking-row'+(item.rank<=3?' podium podium-'+item.rank:'');const rank=document.createElement('strong');rank.className='ranking-place';rank.textContent=item.rank;const face=document.createElement('span');face.className='ranking-avatar';profile(face,item.profile);const nick=document.createElement('span');nick.className='ranking-nick';nick.textContent=item.profile?.nick||'이름 정보 없음';const score=document.createElement('b');score.className='ranking-score';score.textContent=item.score.toLocaleString();row.append(rank,face,nick,score);$('#ranking-list').append(row);rows++;}
  const me=page.me;$('#my-ranking-place').textContent=me?.rank?me.rank+'위':'—';$('#my-ranking-nick').textContent=me?.profile?.nick||window.WeekendClient?.snapshot().profile?.nick||'나';$('#my-ranking-score').textContent=me?.score?.toLocaleString()||'—';profile($('#my-ranking-avatar'),me?.profile||window.WeekendClient?.snapshot().profile);
  status(rows?'':'아직 이 곡의 순위 기록이 없어요');$('#ranking-more').hidden=exhausted;
 }catch(error){if(ticket!==generation)return;status(error?.code==='account-required'?'단어디펜스 계정으로 접속하면 곡별 순위를 볼 수 있어요.':'순위를 불러오지 못했어요. 다시 눌러 주세요.');$('#ranking-more').hidden=true;}
 finally{if(ticket===generation)busy=false;}
}
function open(){generation++;rows=0;cursor=null;busy=false;exhausted=false;$('.result-panel:not(.song-ranking-panel)').hidden=true;$('#song-ranking-panel').hidden=false;$('#ranking-song').textContent=window.SONG_CHART.title;$('#ranking-list').replaceChildren();$('#ranking-list').scrollTop=0;$('#ranking-back').focus({preventScroll:true});load();}
function close(){generation++;$('#song-ranking-panel').hidden=true;$('.result-panel:not(.song-ranking-panel)').hidden=false;$('#show-song-ranking').focus({preventScroll:true});}
function present(score){lastScore=score;$('#song-ranking-panel').hidden=true;$('.result-panel:not(.song-ranking-panel)').hidden=false;$('#clear-success-value').textContent='—';$('#clear-success-fill').style.width='0%';$('#clear-success-context').textContent='완주 기록을 집계하는 중…';refreshRate();service()?.finish(score).then(refreshRate).catch(()=>{});}
$('#show-song-ranking').onclick=open;$('#ranking-back').onclick=close;$('#ranking-more').onclick=load;$('#ranking-retry').onclick=()=>{if(!busy){exhausted=false;load();}};$('#ranking-list').addEventListener('scroll',e=>{const el=e.currentTarget;if(el.scrollTop+el.clientHeight>=el.scrollHeight-60)load();});
window.RankUI={present,open,close,refreshRate};
})();
