// Playback follows the visible film; native controls keep sound and seeking available.
(() => {
  document.querySelectorAll('.ai-video-preview').forEach(link => {
    link.addEventListener('click', event => {
      const scene = document.getElementById(link.hash.slice(1));
      if (!scene) return;
      event.preventDefault();
      if (window.innerWidth > 1023) {
        const root = scene.closest('.work-detail');
        const progress = Number(scene.dataset.workScrollProgress);
        if (!root || !Number.isFinite(progress)) return;
        const top = root.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + (root.offsetHeight - innerHeight) * Math.min(1, progress + 0.005), behavior: 'instant' });
      } else {
        scene.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
      const heading = scene.querySelector('h3');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
  });
})();

(() => {
  const videos = [...document.querySelectorAll('video[data-ai-video]')];
  const visible = new Set();
  const update = () => videos.forEach(video => {
    if (visible.has(video) && !document.hidden) video.play().catch(() => {});
    else video.pause();
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
      if (isIntersecting && intersectionRatio >= 0.25) visible.add(target);
      else visible.delete(target);
    });
    update();
  }, { threshold: [0, 0.25] });
  videos.forEach(video => observer.observe(video));
  document.addEventListener('visibilitychange', update);
})();
