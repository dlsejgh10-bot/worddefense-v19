(()=>{'use strict';
window.startDanceMusic=()=>window.parent.GameHome.start();
document.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),y=(e.clientY-r.top)*(canvas.height/(window.homeRenderScale?.()||1))/r.height;if(y<2110)window.parent.GameHome.enableHomeAudio?.()},{capture:true});
window.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();window.parent.GameHome.start()}});
})();
