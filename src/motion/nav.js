// Nav: some ao descer, volta ao subir (com fundo), fica vermelha sobre áreas vermelhas.
// O botão Menu abre a tela cheia vermelha; Esc fecha.
export function initNav(lenis) {
  const nav = document.querySelector('[data-nav]');
  const btn = nav.querySelector('.nav-menu');
  const overlay = document.getElementById('overlay');
  let lastY = 0, open = false, raf = 0;

  function toneCheck() {
    raf = 0;
    const y = nav.offsetHeight + 2;
    const els = document.elementsFromPoint(innerWidth / 2, y);
    const el = els.find((e) => !e.closest('[data-nav], .overlay, .sparks, .seal'));
    const red = !!el && (!!el.closest('[data-tone="red"]') || (!!el.closest('.hero--red') && !el.closest('.hero-copy')));
    nav.classList.toggle('nav--red', red || open);
  }

  function onScroll(y) {
    if (open) return;
    const down = y > lastY;
    nav.classList.toggle('nav--hidden', down && y > 120);
    nav.classList.toggle('nav--solid', y > 40);
    lastY = y;
    if (!raf) raf = requestAnimationFrame(toneCheck);
  }
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  function setOpen(v) {
    open = v;
    overlay.hidden = !v;
    btn.setAttribute('aria-expanded', String(v));
    btn.textContent = v ? 'Close' : 'Menu';
    nav.classList.remove('nav--hidden');
    toneCheck();
    if (v) { lenis?.stop(); overlay.querySelector('a').focus(); }
    else { lenis?.start(); btn.focus(); }
  }
  btn.addEventListener('click', () => setOpen(!open));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  overlay.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) setOpen(false); });

  toneCheck();
  return { refresh: toneCheck };
}

// Links internos rolam com o Lenis
export function initAnchors(lenis) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else (target === 0 ? document.body : target).scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', id);
  });
}
