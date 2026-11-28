/* Keep acquisition overlays inside the same game viewport on phones/tablets. */
(() => {
  const sync = () => {
    const overlay = document.getElementById('wd-acq');
    if (!overlay) return;
    const host = document.getElementById('wdl-app');
    const rect = host?.getBoundingClientRect();
    const width = rect?.width > 0 ? Math.min(innerWidth, rect.width) : Math.min(innerWidth, innerHeight * .46);
    const left = rect?.width > 0 ? Math.max(0, Math.min(innerWidth - width, rect.left)) : (innerWidth - width) / 2;
    const height = innerHeight;
    overlay.style.setProperty('inset', 'auto', 'important');
    overlay.style.setProperty('left', left + 'px', 'important');
    overlay.style.setProperty('top', '0px', 'important');
    overlay.style.setProperty('width', width + 'px', 'important');
    overlay.style.setProperty('height', height + 'px', 'important');
    overlay.style.setProperty('--cu', Math.min(width, height * .46) / 390 + 'px', 'important');
    overlay.style.boxSizing = 'border-box';
  };
  const boot = () => {
    new MutationObserver(sync).observe(document.body, {childList: true});
    const host = document.getElementById('wdl-app');
    if (host) new ResizeObserver(sync).observe(host);
    addEventListener('resize', sync, {passive: true});
    window.visualViewport?.addEventListener('resize', sync, {passive: true});
    sync();
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
})();
