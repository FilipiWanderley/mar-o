import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { burst, sizzle } from './sparks.js';
import { grow } from './words.js';
import { splitLines, enterLines, exitLines, hideLines, enterBlock, exitBlock } from './lines.js';

// Roteiro do hero (progresso do pin, 0 → 1)
const VIDEO_END = 0.8;           // o vídeo ocupa 0 → 0.8
// Speed ramp: perto do pouso do pão (68% do vídeo) a rolagem anda devagar, como câmera lenta.
// [progresso do pin, progresso do vídeo]
const RAMP = [[0, 0], [0.36, 0.6], [0.62, 0.74], [VIDEO_END, 0.93]];
const LAND = 0.68;
const IMPACT = 0.36 + (0.62 - 0.36) * ((LAND - 0.6) / (0.74 - 0.6));
const ZONES = [[0, 0.12], [0.16, 0.34], [0.4, 0.8]]; // momentos de texto

export function createHero() {
  const hero = document.querySelector('.hero');
  const pin = hero.querySelector('.hero-pin');
  const word = hero.querySelector('.word--hero');
  const letters = [...word.children];
  const moments = [...hero.querySelectorAll('.moment')];
  const red = hero.querySelector('.hero-red');
  const counter = hero.querySelector('.hero-counter');
  const temp = hero.querySelector('.hero-temp');

  // Medidas: topo das maiúsculas da palavra, largura das colunas laterais
  const stage = { top: 80, capTop: innerHeight * 0.7 };
  function measure() {
    const pr = pin.getBoundingClientRect();
    const sy = gsap.getProperty(letters[0], 'scaleY');
    gsap.set(letters, { scaleY: 1 });
    const r = letters[0].getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(word).fontSize);
    stage.capTop = r.bottom - pr.top - fs * 0.72;
    gsap.set(letters, { scaleY: sy });
    stage.top = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72) + 10;
    pin.style.setProperty('--word-top', stage.capTop + 'px');
  }
  function sides(geo) {
    if (!geo) return;
    const edge = word.getBoundingClientRect().left - pin.getBoundingClientRect().left;
    const left = geo.dx + 0.24 * geo.w - edge - 24;
    const right = geo.W - (geo.dx + 0.82 * geo.w) - edge - 16;
    const sideW = geo.full ? Math.min(geo.W * 0.3, Math.max(380, left)) : Math.max(220, left);
    pin.style.setProperty('--side-w', sideW + 'px');
    pin.style.setProperty('--side-r', Math.max(150, right) + 'px');
  }
  return { hero, pin, word, letters, moments, red, counter, temp, stage, measure, sides };
}

export function initHero(h, frames, { reduced, mobile }) {
  const { hero, pin, word, letters, moments, red, stage } = h;
  moments.forEach((m) => m.querySelectorAll('.lines').forEach(splitLines));

  if (reduced) { frames.draw(1); return { st: null, sync() {} }; }

  // Momentos de texto: entram e saem por tempo quando o scroll cruza o marco
  let zone = 0;
  const blocks = (m) => [...m.children].filter((c) => !c.classList.contains('lines'));
  function show(i) {
    if (i === zone) return;
    const prev = moments[zone];
    if (prev) {
      prev.querySelectorAll('.lines').forEach(exitLines);
      exitBlock(blocks(prev)).eventCallback('onComplete', () => { if (zone !== moments.indexOf(prev)) gsap.set(prev, { visibility: 'hidden' }); });
      prev.setAttribute('aria-hidden', 'true');
    }
    zone = i;
    const next = moments[i];
    if (next) {
      gsap.set(next, { visibility: 'visible' });
      next.removeAttribute('aria-hidden');
      next.querySelectorAll('.lines').forEach((l) => enterLines(l, { delay: 0.15 }));
      enterBlock(blocks(next), { delay: 0.3 });
    }
  }
  moments.forEach((m, i) => { if (i) { m.querySelectorAll('.lines').forEach(hideLines); gsap.set(blocks(m), { autoAlpha: 0 }); } });

  // Impacto: o pão pousa e achata a palavra; voltando, ela cresce de novo
  let squashed = false;
  function impact(on) {
    if (on === squashed) return;
    squashed = on;
    gsap.killTweensOf(letters);
    if (on) {
      dispatchEvent(new CustomEvent('marao:impact'));
      const mid = (letters.length - 1) / 2;
      gsap.timeline()
        .to(letters, { scaleY: 0.48, scaleX: 1.07, x: (i) => (i - mid) * (mobile ? 3 : 9), duration: 0.14, ease: 'power4.in' })
        .to(letters, { scaleY: 0.56, scaleX: 1.05, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      const g = frames.geometry();
      if (g) {
        const k = mobile ? 0.45 : 1;
        burst({ x0: g.impact.x0, x1: g.impact.x1, y: g.impact.y, count: Math.round(150 * k), kinds: { spark: 5, corn: 3, stick: 3 }, floor: g.paperY, wide: 0.9 });
        burst({ x0: g.impact.x0, x1: g.impact.x1, y: g.paperY - 6, count: Math.round(70 * k), kinds: { corn: 2, stick: 2, drop: 1 }, floor: g.paperY + 10, wide: 0.6 });
        sizzle({ x0: g.impact.x0, x1: g.impact.x1, y: g.impact.y + 20, rate: 22, duration: 1.1 });
      }
      // o tranco vai no vídeo (nunca no elemento preso: o ScrollTrigger usa o transform dele)
      gsap.fromTo(pin.querySelector('.hero-canvas'), { x: 0, y: 0 }, { keyframes: [{ x: -5, y: 3 }, { x: 4, y: -2 }, { x: -2, y: 1 }, { x: 0, y: 0 }], duration: 0.32, ease: 'none' });
    } else {
      gsap.to(letters, { x: 0, scaleX: 1, scaleY: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    }
  }

  // A poça vermelha nasce na linha da palavra e cobre a tela (essa parte segue o scroll: é imagem)
  const state = { v: 0 };
  const tl = gsap.timeline({ defaults: { ease: 'none' } })
    .to(state, { v: RAMP[1][1], duration: RAMP[1][0], onUpdate: () => frames.draw(state.v) }, 0)
    .to(state, { v: RAMP[2][1], duration: RAMP[2][0] - RAMP[1][0], onUpdate: () => frames.draw(state.v) }, RAMP[1][0])
    .to(state, { v: RAMP[3][1], duration: RAMP[3][0] - RAMP[2][0], onUpdate: () => frames.draw(state.v) }, RAMP[2][0])
    // a folha vermelha sobe de baixo como uma cortina e cobre tudo
    .fromTo(red, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.1, ease: 'power2.inOut' }, 0.8)
    .to({}, { duration: 0.1 }, 0.9);

  let vFast = false;
  const st = ScrollTrigger.create({
    trigger: hero, start: 'top top', end: () => '+=' + innerHeight * (mobile ? 2.2 : 3),
    pin, scrub: 0.6, animation: tl, invalidateOnRefresh: true,
    onUpdate(self) { vFast = Math.abs(self.getVelocity()) > innerHeight * 2.5; },
    onRefresh: () => frames.draw(state.v),
  });
  // Os estados seguem o progresso real da linha do tempo (que continua andando depois do scroll, com o scrub)
  tl.eventCallback('onUpdate', () => {
    const p = tl.progress();
    let z = -1;
    ZONES.forEach(([a, b], i) => { if (p >= a && p < b) z = i; });
    if (!vFast || z === -1) show(z);
    impact(p >= IMPACT);
    hero.classList.toggle('hero--red', p > 0.86);
    hero.classList.toggle('hero--stamped', p >= IMPACT + 0.03 && p < 0.84);
  });
  // Rolagem rápida: quando para numa cena, ela entra
  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (!st.isActive) return;
    const p = tl.progress();
    ZONES.forEach(([a, b], i) => { if (p >= a && p < b) show(i); });
  });
  // Depois da abertura: reaplica o estado certo da palavra para a posição atual
  const sync = () => { const on = tl.progress() >= IMPACT; squashed = !on; impact(on); };
  return { st, sync };
}

// Abertura: a palavra está no lugar, a 60% da altura, e cresce enquanto as fotos carregam.
// No fim, assenta com o tranco de massa e o X-Tudo entra subindo.
export function runIntro(h, { load, reduced }) {
  const { letters, temp, counter, word } = h;
  const root = document.documentElement;
  const copy = h.hero.querySelector('.moment--1');

  return new Promise((resolve) => {
    if (reduced) { gsap.set(letters, { scaleX: 1, scaleY: 1 }); root.classList.remove('carregando'); resolve(); return; }

    const vary = letters.map(() => 0.8 + Math.random() * 0.4);
    gsap.set(letters, { scaleX: 1.1, scaleY: 0.6 });
    copy.querySelectorAll('.lines').forEach(hideLines);
    gsap.set([...copy.children].filter((c) => !c.classList.contains('lines')), { autoAlpha: 0 });

    let real = 0, shown = 0;
    const t0 = performance.now(), MIN = 1400, MAX = 7000;
    load((p) => { real = Math.max(real, p); }).then(() => { real = 1; });

    const tick = () => {
      const el = performance.now() - t0;
      const target = el > MAX ? 1 : Math.min(real, el / MIN);
      shown += (target - shown) * 0.1;
      if (target - shown < 0.003) shown = target;
      temp.textContent = String(Math.round(75 + shown * 375)).padStart(3, '0');
      letters.forEach((l, i) => gsap.set(l, { scaleY: 0.6 + 0.2 * Math.min(1, shown * vary[i]) }));
      if (shown >= 1 && el >= MIN) finish();
    };
    gsap.ticker.add(tick);

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      gsap.ticker.remove(tick);
      gsap.to(counter, { y: 30, autoAlpha: 0, duration: 0.4, ease: 'power3.in' });
      const g = grow(word, { from: 0.8, delay: 0.25 });
      g.add(() => {
        root.classList.remove('carregando');
        gsap.fromTo('.hero-canvas', { y: 80, scale: 0.94 }, { y: 0, scale: 1, duration: 1.3, ease: 'expo.out', clearProps: 'transform' });
        copy.querySelectorAll('.lines').forEach((l) => enterLines(l, { delay: 0.35 }));
        enterBlock([...copy.children].filter((c) => !c.classList.contains('lines')), { delay: 0.55 });
        gsap.fromTo('.nav, .hero-side', { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.6, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
      }, 0.55);
      g.add(resolve, 0.9);
    }
  });
}
