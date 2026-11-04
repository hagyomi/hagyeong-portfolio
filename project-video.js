// Each standalone project cover plays only while visible.
// Match category-to-content spacing across all three project sections.
(() => {
  const reference = document.querySelector('#workDetail3');
  const cover = document.querySelector('#shortForm .shortform-cover');
  if (!reference || !cover) return;
  const align = () => {
    const children = [...reference.querySelectorAll('.reference-cover-devices, .reference-cover-info')];
    if (!children.length) return;
    const gap = Math.max(0, Math.min(...children.map(el => el.getBoundingClientRect().top)) - reference.getBoundingClientRect().top);
    cover.style.setProperty('--ai-cover-top-gap', `${Math.max(0, gap - cover.offsetTop).toFixed(2)}px`);
    const events = document.querySelector('.event-pages');
    const preview = events?.querySelector('.event-card__preview');
    if (preview) {
      const currentGap = preview.getBoundingClientRect().top - events.getBoundingClientRect().top;
      const padding = parseFloat(getComputedStyle(events).paddingTop);
      events.style.setProperty('--event-cover-top-gap', `${Math.max(0, padding + gap - currentGap).toFixed(2)}px`);
    }
  };
  new ResizeObserver(align).observe(reference);
  window.addEventListener('resize', align);
  document.fonts.ready.then(align);
})();

// Fit the longer brand name to its heading column without changing other titles.
(() => {
  const heading = document.querySelector('#workTouslesjours .work-detail__title');
  const text = heading?.querySelector('.work-detail__title-en');
  if (!text) return;
  const fit = () => {
    const available = Math.min(heading.clientWidth, document.documentElement.clientWidth - heading.getBoundingClientRect().left - 24);
    if (available <= 0) return;
    const reference = document.querySelector('#workDetail3 .work-detail__title-en');
    let low = 20;
    let high = reference ? parseFloat(getComputedStyle(reference).fontSize) : 90;
    for (let i = 0; i < 12; i++) {
      const size = (low + high) / 2;
      text.style.fontSize = `${size}px`;
      if (text.getBoundingClientRect().width <= available - 2) low = size;
      else high = size;
    }
    text.style.fontSize = `${Math.floor(low * 10) / 10}px`;
  };
  const observer = new ResizeObserver(fit);
  observer.observe(heading);
  window.addEventListener('resize', fit);
  document.fonts.ready.then(fit);
})();

(() => {
  const videos = [...document.querySelectorAll('.project-cover-video')];
  if (!videos.length) return;
  const visible = new Set();
  const update = () => videos.forEach(video => {
    if (visible.has(video) && !document.hidden) video.play().catch(() => {});
    else video.pause();
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    update();
  }, { threshold: 0.1 });
  videos.forEach(video => observer.observe(video));
  document.addEventListener('visibilitychange', update);
})();
