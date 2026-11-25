(()=>{'use strict';
const GAME_SCRIPTS=[
 'song-db.js?v=77',
 'grandpa.js',
 'pose-metrics.js?v=7',
 'rules.js?v=73',
 'combo-atlas.js?v=9',
 'combo-fever-atlas.js?v=14',
 'combo-renderer.js?v=63',
 'note-audio-v44.js?v=72',
 'neon-border-v22.js?v=58',
 'responsive-v29.js?v=57',
 'lyrics-v29/lyrics-renderer.js?v=63',
 'renderer.js?v=63',
 'result-ranks.js?v=11',
 'result-effects.js?v=53',
 'audio-reactive.js?v=53',
 'chord-sound-v24.js?v=24',
 'timeline.js?v=63',
 'song-leaderboard.js?v=70',
 'ranking-ui.js?v=63',
 'game.js?v=73',
 'song-picker.js?v=63',
 'diagnostics-v51.js?v=53'
];
function loadScript(src){
 return new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src=src;s.onload=()=>resolve();s.onerror=()=>reject(new Error('스크립트를 못 불러왔어요: '+src));
  document.body.appendChild(s);
 });
}
window.loadWeekendGame=function(){
 if(window.__wdGameLoadP)return window.__wdGameLoadP;
 window.__wdGameLoadP=GAME_SCRIPTS.reduce((p,src)=>p.then(()=>loadScript(src)),Promise.resolve());
 return window.__wdGameLoadP;
};
})();
