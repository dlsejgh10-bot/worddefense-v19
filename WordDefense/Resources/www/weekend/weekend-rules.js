(function(root){'use strict';
const DAY=86400000,KST=32400000,LIMIT=3,MAX=6;
function calendar(now){const day=Math.floor((now+KST)/DAY),weekday=(day+4)%7;return{day,weekday,open:weekday===5||weekday===6||weekday===0,season:Math.floor((day-1)/7),nextReset:(day+1)*DAY-KST};}
function normalize(raw,now){const c=calendar(now);let s=raw&&typeof raw==='object'?{...raw,claimed:Array.isArray(raw.claimed)?[...raw.claimed]:[],finished:Array.isArray(raw.finished)?[...raw.finished]:[]}:{};
 if(s.season!==c.season)s={season:c.season,plays:0,claimed:[],finished:[]};
 if(s.day!==c.day){s.day=c.day;s.entries=0;}
 s.entries=Math.max(0,Math.min(LIMIT,s.entries|0));s.plays=Math.max(0,Math.min(MAX,s.plays|0));s.claimed=Array.isArray(s.claimed)?[...new Set(s.claimed.filter(n=>Number.isInteger(n)&&n>=1&&n<=MAX))]:[];s.finished=Array.isArray(s.finished)?s.finished.slice(-12):[];return s;
}
function snapshot(raw,now){const s=normalize(raw,now),c=calendar(now);return{...s,...c,entriesLeft:Math.max(0,LIMIT-s.entries),entryLimit:LIMIT,maxPlays:MAX};}
function begin(raw,now,token,options={}){const s=normalize(raw,now);if(!options.unlimitedEntries&&!calendar(now).open)return{ok:false,reason:'금·토·일에 입장할 수 있어요',state:s};if(s.entries>=LIMIT&&!options.unlimitedEntries)return{ok:false,reason:'오늘 입장 3회를 모두 사용했어요',state:s};if(!token)return{ok:false,reason:'입장 정보를 만들지 못했어요',state:s};if(!options.unlimitedEntries)s.entries++;s.active={token,day:s.day,season:s.season,at:now,charged:!options.unlimitedEntries};return{ok:true,token,state:s};}
function refund(raw,now,token){const s=normalize(raw,now);if(s.active?.token===token){if(s.active.day===s.day&&s.active.charged!==false)s.entries=Math.max(0,s.entries-1);delete s.active;}return s;}
function finish(raw,now,token){const s=normalize(raw,now);if(!token||s.active?.token!==token||s.finished.includes(token))return{ok:false,state:s};s.plays=Math.min(MAX,s.plays+1);s.finished.push(token);delete s.active;return{ok:true,state:s};}
function claim(raw,now,stage){const s=normalize(raw,now);if(!Number.isInteger(stage)||stage<1||stage>MAX||s.plays<stage||s.claimed.includes(stage))return{ok:false,state:s};s.claimed.push(stage);return{ok:true,state:s};}
const api={calendar,normalize,snapshot,begin,refund,finish,claim,LIMIT,MAX};root.WeekendRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
