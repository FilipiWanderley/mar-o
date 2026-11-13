import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/fraunces/full-italic.css';
import './styles/tokens.css';
import './styles/torn.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createFrames } from './motion/frames.js';
import { onWidthChange } from './motion/viewport.js';
import { createHero, initHero, runIntro } from './motion/hero.js';
import { initNav, initAnchors } from './motion/nav.js';
import { initBuilder } from './motion/builder.js';
import { initChapa } from './motion/chapa.js';
import { initPlatter } from './motion/platter.js';
import { initLight, initVideos, initFaq, initReveal } from './motion/sections.js';
import { initHours } from './motion/hours.js';
import { initSound } from './motion/sound.js';
import { initScrolling, initTouch, initTabs, initTitles, initFooter } from './motion/ui.js';

gsap.registerPlugin(ScrollTrigger);
// No celular a barra de endereço muda a altura da tela ao rolar: isso não deve recalcular a página
ScrollTrigger.config({ ignoreMobileResize: true });

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px)').matches;
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
history.scrollRestoration = 'manual';
scrollTo(0, 0);

const hero = createHero();
const frames = createFrames(document.querySelector('.hero-canvas'), () => hero.stage);

// Começa a carregar os quadros já (a abertura mostra esse progresso)
let firstPass;
const load = (onProgress) => {
  let f = 0, fontsOk = 0;
  const report = () => onProgress(f * 0.85 + fontsOk * 0.15);
  return Promise.all([
    firstPass.then(() => { f = 1; report(); }),
    document.fonts.ready.then(() => { fontsOk = 1; report(); }),
  ]);
};
let frameProgress = () => {};
firstPass = frames.preloadFirstPass((p) => frameProgress(p));

function layoutHero() {
  hero.measure();
  frames.resize();
  hero.sides(frames.geometry());
}

// 1. Esperar as fontes (a palavra gigante é medida), 2. criar os pins ANTES do Lenis
document.fonts.ready.then(() => {
  layoutHero();
  const h = initHero(hero, frames, { reduced, mobile });
  initChapa({ reduced, mobile });

  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  initPlatter({ reduced, mobile, lenis });
  initBuilder();
  initLight(reduced);
  initTitles(reduced);
  initTabs();
  initVideos(reduced);
  initFaq();
  initHours();
  initSound();
  initReveal(reduced);
  initFooter(reduced);
  initNav(lenis);
  initAnchors(lenis);
  initScrolling(lenis);
  initTouch();

  onWidthChange(() => { layoutHero(); ScrollTrigger.refresh(); });

  // 3. A abertura libera a rolagem no fim
  runIntro(hero, {
    reduced,
    load: (onProgress) => { frameProgress = (p) => onProgress(p * 0.85); return load(onProgress); },
  }).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      layoutHero();
      ScrollTrigger.refresh();
      lenis?.resize();
      lenis?.start();
      h.sync();
      frames.loadRest();
    }));
  });
});
