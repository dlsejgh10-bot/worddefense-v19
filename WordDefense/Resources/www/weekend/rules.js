/* Pure scoring and survival rules shared by play and verification. */
(function(root){
  'use strict';
  const config=Object.freeze({feverDuration:7,feverCooldown:.75,feverCharge:2.5,feverHits:3,damage:8,lowHealth:25,heal:.12,holdTickPoints:30,holdTickBeats:.25,perfectWindow:.035,greatWindow:.075,goodWindow:.12,missWindow:.12,earlyMissWindow:.30});
  function reset(s){Object.assign(s,{hp:100,fever:0,feverActive:false,feverDamage:0,feverBonus:0,feverActivations:0,feverStarted:-10,feverEnded:-10,damageTime:-10,score:0,perfect:0,great:0,good:0,miss:0,combo:0,maxCombo:0,invalidPresses:0,earlyMisses:0,lastPressByLane:[-Infinity,-Infinity,-Infinity,-Infinity],lastPressByHand:[-Infinity,-Infinity],holdTicks:0,comboTime:-10,holdTickTime:-10});}
  function points(s,base){const bonus=s.feverActive?base:0;s.score+=base+bonus;s.feverBonus+=bonus;return base+bonus;}
  function award(s,grade){
    if(!['PERFECT','GREAT','GOOD'].includes(grade))throw Error('Unknown judgement '+grade);
    if(s.feverActive)grade='PERFECT';
    const value={PERFECT:100,GREAT:70,GOOD:40}[grade];
    if(value===undefined)throw Error('Unknown judgement '+grade);
    points(s,value);s.combo++;s.comboTime=s.time;s.maxCombo=Math.max(s.maxCombo,s.combo);s[grade.toLowerCase()]++;
    s.hp=Math.min(100,s.hp+config.heal);
    if(!s.feverActive&&s.time>=s.feverEnded+config.feverCooldown){s.fever=Math.min(100,s.fever+config.feverCharge);if(s.fever>=100){s.feverActive=true;s.feverDamage=0;s.feverStarted=s.time;s.feverActivations++;}}
    return grade;
  }
  function holdTick(s){points(s,config.holdTickPoints);s.holdTicks++;s.combo++;s.comboTime=s.time;s.holdTickTime=s.time;s.maxCombo=Math.max(s.maxCombo,s.combo);}
  function miss(s){s.miss++;s.combo=0;if(!s.feverActive){s.hp=Math.max(0,s.hp-config.damage);s.damageTime=s.time;}
    if(s.feverActive){s.feverDamage++;s.fever=Math.max(0,s.fever-25);if(s.fever<=0){s.feverActive=false;s.fever=0;s.feverEnded=s.time;}}

  }
  function advance(s,seconds){if(!s.feverActive)return;s.fever=Math.max(0,s.fever-seconds*100/config.feverDuration);if(s.fever<=.00001){s.fever=0;s.feverActive=false;s.feverEnded=s.time;}}
  function summary(s){const total=s.perfect+s.great+s.good+s.miss;const accuracy=total?(s.perfect+s.great*.75+s.good*.45)/total*100:0;
    return{total,accuracy,rank:s.hp<=0?'F':accuracy>=95?'S':accuracy>=85?'A':accuracy>=70?'B':'C'};
  }
  function judge(error){const e=Math.abs(error);return e<=config.perfectWindow?'PERFECT':e<=config.greatWindow?'GREAT':e<=config.goodWindow?'GOOD':null;}
  const api={config,reset,points,award,miss,holdTick,summary,judge,advance};root.RhythmRules=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
