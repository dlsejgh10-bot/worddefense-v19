/* Keep numeric anchors fixed; only position the arrow in the visible gap. */
(() => {
  let queued = false;
  const observed = new WeakSet();
  const resize = new ResizeObserver(schedule);
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      document.querySelectorAll('#wdl .hr-stats .hr-vals').forEach(host => {
        if (!observed.has(host)) { observed.add(host); resize.observe(host); }
        const a = host.querySelector('.hr-rc'), b = host.querySelector('.hr-nx,.hr-nv'), arrow = host.querySelector('.hr-arw');
        if (!a || !b || !arrow || !host.offsetWidth) return;
        const h = host.getBoundingClientRect(), x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
        const scale = h.width / host.offsetWidth;
        if (scale > 0) arrow.style.left = (((x.right + y.left) / 2 - h.left) / scale) + 'px';
      });
      document.querySelectorAll('#wdl .sc.k-gem .sc-art img').forEach(im => {
        if (im.dataset.footAligned || !im.complete || !im.naturalWidth) return;
        try {
          const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
          const g = c.getContext('2d'); g.drawImage(im, 0, 0);
          const rgba = g.getImageData(0, 0, c.width, c.height).data; let bottom = 0;
          for (let i = 3; i < rgba.length; i += 4) if (rgba[i] > 160) bottom = Math.max(bottom, Math.floor((i - 3) / 4 / c.width) + 1);
          im.style.setProperty('--gem-foot-inset', ((1 - bottom / c.height) * 100) + '%'); im.dataset.footAligned = '1';
        } catch (_) {}
      });
      document.querySelectorAll('#wd-acq.hr-acq .acq-body').forEach(body => {
        if (!observed.has(body)) { observed.add(body); resize.observe(body); }
        const overlay = body.closest('#wd-acq');
        overlay.style.setProperty('--bh', 'calc(' + body.offsetHeight + 'px + 12*var(--cu))');
      });
    });
  }
  function start() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('load', schedule, true);
    addEventListener('resize', schedule);
    document.fonts?.ready.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
