// Som opcional (o site começa mudo). Ligado: o chiado da chapa toca enquanto o hero está na tela
// e o baque do pão toca no impacto. Os sons vêm do próprio vídeo gerado.
export function initSound() {
  const btn = document.querySelector('[data-sound]');
  if (!btn) return;
  const sizzle = new Audio('/audio/hero-sizzle.m4a');
  sizzle.loop = true; sizzle.volume = 0; sizzle.preload = 'none';
  const thud = new Audio('/audio/hero-thud.m4a');
  thud.preload = 'none'; thud.volume = 0.9;
  const smash = new Audio('/audio/chapa-smash.m4a');
  smash.preload = 'none'; smash.volume = 0.8;
  const loops = [...document.querySelectorAll('video[data-autoplay]')];
  loops.forEach((v) => { v.volume = 0.45; });
  let on = false, heroVisible = true, fade = 0;

  const ramp = (to) => {
    cancelAnimationFrame(fade);
    const from = sizzle.volume, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 600);
      sizzle.volume = from + (to - from) * k;
      if (k < 1) fade = requestAnimationFrame(step);
      else if (to === 0) sizzle.pause();
    };
    fade = requestAnimationFrame(step);
  };
  const update = () => {
    if (on && heroVisible) { sizzle.play().catch(() => {}); ramp(0.55); }
    else ramp(0);
  };

  btn.addEventListener('click', () => {
    on = !on;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    btn.classList.toggle('is-on', on);
    loops.forEach((v) => { v.muted = !on; });
    update();
  });
  addEventListener('marao:impact', () => { if (on) { thud.currentTime = 0; thud.play().catch(() => {}); } });
  addEventListener('marao:smash', () => { if (on) { smash.currentTime = 0; smash.play().catch(() => {}); } });

  const hero = document.querySelector('.hero');
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }, { threshold: 0.05 }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) ramp(0); else update(); });
}
