(function(root){'use strict';
// Rewarded-ad hook for 불타는 주말 extra runs. The game has no ads yet, so with
// ADS_ENABLED=false every request resolves as rewarded without showing anything.
// When ads ship, the native wrapper provides WDAdsNative.showRewarded(placement)
// (AdMob rewarded) returning a promise/boolean for whether the reward was earned.
const ADS_ENABLED=false;
function native(){try{return root.WDAdsNative||root.parent?.WDAdsNative||null}catch{return null}}
function showRewarded(placement){
 if(!ADS_ENABLED)return Promise.resolve({rewarded:true,placement,stub:true});
 const n=native();if(!n?.showRewarded)return Promise.resolve({rewarded:false,placement,reason:'unavailable'});
 return Promise.resolve(n.showRewarded(placement)).then(r=>({rewarded:r===true||!!r?.rewarded,placement}),()=>({rewarded:false,placement}));
}
root.WDAds={ADS_ENABLED,showRewarded};
})(window);
