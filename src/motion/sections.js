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

// Vídeos em loop tocam só na tela; a chapa solta faíscas quando o burger cai
export function initVideos(reduced) {
  const vids = document.querySelectorAll('video[data-autoplay]');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !reduced) v.play().catch(() => {});
    else v.pause();
  }), { threshold: 0.25 });
  vids.forEach((v) => io.observe(v));

  const chapa = document.querySelector('video[data-sizzle]');
  if (!chapa || reduced) return;
  let prev = 0;
  const AT = 3.15; // segundo em que o burger volta para a chapa
  const check = () => {
    const t = chapa.currentTime;
    if (prev < AT && t >= AT && !chapa.paused) {
      const r = chapa.getBoundingClientRect();
      const x = r.left + r.width * 0.62, y = r.top + r.height * 0.74;
      burst({ x0: x - r.width * 0.08, x1: x + r.width * 0.08, y, count: innerWidth < 760 ? 60 : 130, kinds: { spark: 6, drop: 1 }, floor: r.bottom });
      sizzle({ x0: x - r.width * 0.1, x1: x + r.width * 0.1, y, rate: 14, duration: 0.8 });
    }
    prev = t;
    if ('requestVideoFrameCallback' in chapa) chapa.requestVideoFrameCallback(check);
  };
  if ('requestVideoFrameCallback' in chapa) chapa.requestVideoFrameCallback(check);
  else chapa.addEventListener('timeupdate', check);
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
