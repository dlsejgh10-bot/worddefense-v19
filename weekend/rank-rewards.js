(function(root){'use strict';
const ENERGY_COST=5,tiers={F:{gold:[10,500],gem:[10,50],key:0,stone:0},C:{gold:[200,1000],gem:[20,100],key:.10,stone:.01},B:{gold:[300,1500],gem:[30,200],key:.20,stone:.02},A:{gold:[500,3000],gem:[50,300],key:.30,stone:.05},S:{gold:[1000,3000],gem:[100,500],key:.50,stone:.20}};
function random(){if(typeof crypto!=='undefined'&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}return Math.random();}
function roll(rank,rng=random){const tier=tiers[rank];if(!tier)throw Error('Invalid rank');const between=range=>range[0]+Math.floor(rng()*(range[1]-range[0]+1));const rewards=[{type:'gold',icon:'coin',amount:between(tier.gold)},{type:'gem',icon:'gem',amount:between(tier.gem)}];for(const type of ['key','stone'])if(tier[type]>0&&rng()<tier[type])rewards.push({type,icon:type,amount:1});return rewards;}
function normalizePending(receipt){
 if(receipt?.rank==='S'&&!receipt.granted){
  for(const reward of receipt.rewards||[]){
   if(reward.type==='gem'&&reward.amount>tiers.S.gem[1])reward.amount=tiers.S.gem[1];
  }
 }
 return receipt;
}
const api={ENERGY_COST,tiers,roll,normalizePending};root.RankRewards=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
