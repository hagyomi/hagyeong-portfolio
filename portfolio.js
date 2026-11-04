// Small local accessibility additions; the reference script owns its animations.
const menuButton = document.querySelector('#hamburgerBtn');
const mobileMenu = document.querySelector('#mobileNav');
if (menuButton && mobileMenu) {
  const syncMenu = () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    mobileMenu.inert = !open;
    menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  };
  new MutationObserver(syncMenu).observe(menuButton, { attributes: true, attributeFilter: ['aria-expanded'] });
  syncMenu();
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      menuButton.click();
      menuButton.focus();
    }
  });
}


document.querySelectorAll('.quick-qa__item').forEach((item, index) => {
  const question = item.querySelector('.quick-qa__question');
  const answer = item.querySelector('.quick-qa__answer');
  if (!question || !answer) return;
  answer.id ||= `portfolio-answer-${index + 1}`;
  question.setAttribute('aria-controls', answer.id);
});

// Keep the hero's scroll distances editable through the supplied token file.
const hero = document.querySelector('.hero');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.hero-word > span, .hero-word > em').forEach((word, index) => {
  word.style.setProperty('--word-delay', `calc(${index} * var(--pf-delay-hero-step))`);
});
if (!reducedMotion.matches) hero?.classList.add('is-typography-ready');
let scheduled = false;
function updateHero() {
  scheduled = false;
  if (!hero) return;
  const style = getComputedStyle(hero);
  const progress = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight));
  const drift = parseFloat(style.getPropertyValue('--pf-hero-drift-max')) || 0;
  const spread = parseFloat(style.getPropertyValue('--pf-hero-spread-max')) || 0;
  hero.style.setProperty('--hero-drift', `${progress * drift}px`);
  hero.style.setProperty('--hero-spread', `${progress * spread}px`);
}
function scheduleHero() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateHero); }
}
addEventListener('scroll', scheduleHero, { passive: true });
addEventListener('resize', scheduleHero, { passive: true });
reducedMotion.addEventListener('change', scheduleHero);
updateHero();
