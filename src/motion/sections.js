import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { burst, sizzle } from './sparks.js';

// Manifesto: as letras acendem uma a uma com a rolagem (a 1ª de cada linha já nasce acesa)
export function initLight(reduced) {
  const root = document.querySelector('[data-light]');
  if (!root) return;
  const chars = [];
  root.querySelectorAll('.ml').forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch' + (i === 0 ? ' lit' : '');
      s.textContent = c;
      line.appendChild(s);
      if (i > 0 && c.trim()) chars.push(s);
    });
  });
  if (reduced) { chars.forEach((c) => c.classList.add('lit')); return; }
  ScrollTrigger.create({
    trigger: root, start: 'top 78%', end: 'bottom 45%', scrub: true,
    onUpdate(self) {
      const n = Math.round(self.progress * chars.length);
      chars.forEach((c, i) => c.classList.toggle('lit', i < n));
    },
  });
}

// Vídeos em loop: tocam só quando estão na tela. No celular usam uma versão menor.
// Celulares (principalmente iPhone) só tocam sozinhos vídeo mudo com playsinline, e às vezes
// só depois do primeiro toque na página: por isso o "destravar" no primeiro toque.
export function initVideos(reduced) {
  const small = matchMedia('(max-width: 760px)').matches;
  const vids = [...document.querySelectorAll('video[data-autoplay]')];
  vids.forEach((v) => {
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    if (small && v.dataset.mobile) { v.src = v.dataset.mobile; }
    v.preload = small ? 'auto' : 'metadata';
  });
  const visible = new Set();
  const tryPlay = (v) => {
    if (reduced) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => { v.addEventListener('canplay', () => visible.has(v) && v.play().catch(() => {}), { once: true }); });
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { visible.add(v); tryPlay(v); }
    else { visible.delete(v); v.pause(); }
  }), { threshold: 0.2 });
  vids.forEach((v) => io.observe(v));
  const unlock = () => { visible.forEach(tryPlay); };
  // O iPhone só conta como "a pessoa tocou" no fim do toque (touchend/click), não no começo
  ['touchend', 'click', 'keydown'].forEach((ev) => addEventListener(ev, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) visible.forEach(tryPlay); });
}

// Perguntas: só uma aberta por vez
export function initFaq() {
  const items = [...document.querySelectorAll('.faq-item')];
  items.forEach((it) => {
    const b = it.querySelector('button');
    b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      items.forEach((o) => {
        const ob = o.querySelector('button');
        const on = o === it && open;
        ob.setAttribute('aria-expanded', String(on));
        o.classList.toggle('open', on);
      });
    });
  });
}

// Entrada das partes de cada seção: em cascata, uma vez, por tempo
export function initReveal(reduced) {
  if (reduced) return;
  const groups = ['.build-intro p', '.builder-controls > *', '.stack', '.manifesto-text', '.menu-head p', '.menu-tabs', '.film', '.faq-item', '.visit-info > *:not(h2)', '.visit-map', '.order-rows li', '.footer-info > div', '.footer-top .btn'];
  groups.forEach((sel) => {
    const els = gsap.utils.toArray(sel);
    if (!els.length) return;
    ScrollTrigger.batch(els, {
      start: 'top 88%', once: true,
      onEnter: (batch) => gsap.fromTo(batch, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }),
    });
  });
  document.querySelectorAll('.film-frame video').forEach((m) => {
    gsap.fromTo(m, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: m.parentElement, start: 'top bottom', end: 'bottom 40%', scrub: true } });
  });
}
