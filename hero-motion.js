document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) hero.classList.add('is-typography-ready');
  let pending = false;
  const update = () => {
    pending = false;
    if (reduced) return;
    const progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight));
    const mobile = innerWidth < 1024;
    hero.style.setProperty('--hero-spread', `${progress * (mobile ? 26 : 58)}px`);
    hero.style.setProperty('--hero-drift', `${progress * (mobile ? 6 : 22)}px`);
  };
  const schedule = () => {if (!pending) {pending = true; requestAnimationFrame(update);}};
  if (!reduced) {
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule, {passive:true});
    update();
  }
});
