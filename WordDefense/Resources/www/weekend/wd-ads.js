(function(root){'use strict';
// Rewarded-ad hook for 불타는 주말 extra runs. b174: on/off comes from the remote switch
// (Firestore config/app ads.enabled, read by the main game as WDRemote). While it is off, or on
// the web, every request resolves as rewarded without showing anything (same as before).
// When on, the native wrapper's WDAdsNative.showRewarded(placement) (AdMob rewarded) decides.
function top(){try{return root.top||root.parent}catch{return null}}
function enabled(){try{const t=top();return !!(t&&t.WDRemote&&t.WDRemote.adsEnabled())}catch{return false}}
function native(){try{return root.WDAdsNative||root.parent?.WDAdsNative||top()?.WDAdsNative||null}catch{return null}}
function showRewarded(placement){
 const n=native();
 if(!enabled()||!n?.showRewarded)return Promise.resolve({rewarded:true,placement,stub:true});
 return Promise.resolve(n.showRewarded(placement)).then(r=>({rewarded:r===true||!!r?.rewarded||!!(r?.error&&r.error!=='dismissed'),placement}),()=>({rewarded:true,placement}));
}
root.WDAds={get ADS_ENABLED(){return enabled()},showRewarded};
})(window);
