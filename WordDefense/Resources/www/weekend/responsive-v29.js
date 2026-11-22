(()=>{'use strict';
function fit(){const L=window.GameLayout;if(!L)return;const body=getComputedStyle(document.body),vv=window.visualViewport,w=Math.max(1,Math.min(document.documentElement.clientWidth,vv?.width||innerWidth)-(parseFloat(body.paddingLeft)||0)-(parseFloat(body.paddingRight)||0)),h=Math.max(1,(vv?.height||innerHeight)-(parseFloat(body.paddingTop)||0)-(parseFloat(body.paddingBottom)||0)),timeline=document.querySelector('#timeline'),extra=timeline&&!timeline.hidden?44:0,available=h-extra;
 const height=Math.max(1600,Math.min(2200,Math.round(available/w*L.W))),width=Math.min(w,available*L.W/height),canvas=document.querySelector('#screen');
 Object.assign(L,{H:height,hitY:height-278,keyY:height-181,touchTop:height-338,touchBottom:height-31});
 if(canvas.height!==height)canvas.height=height;
 const pause=document.querySelector('#pause-control');pause.style.left=(501/L.W*100)+'%';pause.style.width=(95/L.W*100)+'%';pause.style.top=(44/height*100)+'%';pause.style.height=(94/height*100)+'%';
 document.querySelector('#play-shell').style.width=width+'px';document.querySelector('#game').style.aspectRatio=L.W+' / '+height;
 window.viewportFitInfo={width:Math.round(width*100)/100,height:height/L.W*width,logicalHeight:height,safeTop:parseFloat(body.paddingTop)||0,safeBottom:parseFloat(body.paddingBottom)||0,timelineVisible:extra>0,layout:'anchored-header-flexible-lanes-anchored-keys'};
}
let pending=false;function queue(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fit()})}
window.GameViewport={fit};addEventListener('resize',queue);window.visualViewport?.addEventListener('resize',queue);addEventListener('orientationchange',queue);
})();
