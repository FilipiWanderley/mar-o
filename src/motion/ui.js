import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { grow } from './words.js';
import { splitLines, enterLines, hideLines, setFast } from './lines.js';

// A cor do fundo acompanha o scroll (escuro ↔ vermelho), sem corte seco
export function initBackground() {
  const colors = { dark: '#0a0505', red: '#d4424d' };
  document.querySelectorAll('main [data-bg]').forEach((s) => {
    ScrollTrigger.create({
      trigger: s, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) gsap.to(document.body, { backgroundColor: colors[s.dataset.bg], duration: 0.8, ease: 'power2.inOut', overwrite: true }); },
    });
  });
}

// Enquanto a página rola, o hover descansa; volta no primeiro movimento do mouse depois de parar
export function initScrolling(lenis) {
  const html = document.documentElement;
  let stopAt = 0, lx = -1, ly = -1, timer;
  const onScroll = () => {
    html.classList.add('is-scrolling');
    clearTimeout(timer);
    timer = setTimeout(() => { stopAt = performance.now(); }, 120);
    const v = Math.abs(lenis ? lenis.velocity : 0);
    setFast(v > 60);
  };
  if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  addEventListener('mousemove', (e) => {
    const moved = Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) > 2;
    lx = e.clientX; ly = e.clientY;
    if (moved && stopAt && performance.now() - stopAt > 0) html.classList.remove('is-scrolling');
  }, { passive: true });
}

// Toque no celular: o visual do hover depois de 70 ms parado na peça, por 380 ms depois de soltar
export function initTouch() {
  const sel = '.btn, .lnk, .row, .chip, .tab, .seal';
  let el = null, t = 0, startY = 0;
  addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    el = e.target.closest(sel); if (!el) return;
    startY = e.clientY;
    const target = el;
    t = setTimeout(() => target.classList.add('is-touch'), 70);
  }, { passive: true });
  addEventListener('pointermove', (e) => { if (el && Math.abs(e.clientY - startY) > 8) { clearTimeout(t); el.classList.remove('is-touch'); el = null; } }, { passive: true });
  const end = () => {
    if (!el) return;
    clearTimeout(t);
    const target = el; el = null;
    target.classList.add('is-touch');
    setTimeout(() => target.classList.remove('is-touch'), 380);
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', () => { if (el) { clearTimeout(t); el.classList.remove('is-touch'); el = null; } });
}

// Abas do cardápio completo (setas movem entre as abas)
export function initTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (t, focus) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    gsap.fromTo(panel.querySelectorAll('.dish'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.025, ease: 'expo.out' });
    ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });
}

// Títulos de seção: entram por máscara de linha quando o scroll cruza o marco (por tempo)
export function initTitles(reduced) {
  document.querySelectorAll('main section:not(.hero):not(.chapa) .lines, .footer .lines').forEach((el) => {
    splitLines(el);
    if (reduced) return;
    hideLines(el);
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => enterLines(el) });
  });
}

// Rodapé: sobe por cima do card de pedido (o card fica na sombra e sobe mais devagar);
// a palavra MARÃO cresce como massa quando aparece
export function initFooter(reduced) {
  const card = document.querySelector('.order-card');
  const word = document.querySelector('.word--footer');
  if (!word) return;
  if (reduced) return;
  gsap.set(word.children, { scaleY: 0 });
  ScrollTrigger.create({
    trigger: word, start: 'top 92%',
    onEnter: () => grow(word, { from: 0 }),
    onLeaveBack: () => gsap.to(word.children, { scaleY: 0, duration: 0.3, ease: 'power3.in', stagger: 0.03 }),
  });
}
