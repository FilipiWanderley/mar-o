import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitLines, enterLines, exitLines, hideLines, enterBlock, exitBlock } from './lines.js';
import { burst, sizzle } from './sparks.js';

// A esmagada acontece em 23% do vídeo; ela é levada para 45% da cena, quando a janela começa a crescer
const HIT_V = 0.23, HIT_P = 0.45;
const SMASH = HIT_P;
const videoAt = (p) => (p < HIT_P ? (p / HIT_P) * HIT_V : HIT_V + ((p - HIT_P) / (1 - HIT_P)) * (1 - HIT_V));

// A chapa: o vídeo começa como uma miniatura inteira (16:9, sem corte) no centro, entre o título
// e o texto, e com o scroll cresce até virar um card de largura inteira. Nada do vídeo é cortado
// em momento nenhum: a janela tem sempre a proporção do vídeo e cresce por escala.
export function initChapa({ reduced, mobile }) {
  const sec = document.querySelector('.chapa');
  if (!sec) return;
  const pin = sec.querySelector('.chapa-pin');
  const win = sec.querySelector('.chapa-window');
  const title = sec.querySelector('.chapa-left');
  const text = sec.querySelector('.chapa-right');
  const video = sec.querySelector('video[data-scrub]');
  splitLines(title);

  // O vídeo anda com a rolagem: o progresso da cena vira o tempo do vídeo
  let want = 0, raf = 0, lastP = 0;
  const seek = () => {
    raf = 0;
    if (!video.duration) return;
    const t = videoAt(want) * (video.duration - 0.05);
    if (Math.abs(video.currentTime - t) > 1 / 30) video.currentTime = t;
  };
  const scrubTo = (p) => { want = p; if (!raf) raf = requestAnimationFrame(seek); };
  function smash() {
    const r = win.getBoundingClientRect();
    const x = r.left + r.width * 0.5, y = r.top + r.height * 0.62;
    burst({ x0: x - r.width * 0.12, x1: x + r.width * 0.12, y, count: mobile ? 60 : 150, kinds: { spark: 6, drop: 2 }, floor: r.bottom });
    sizzle({ x0: x - r.width * 0.14, x1: x + r.width * 0.14, y, rate: 16, duration: 1 });
    dispatchEvent(new CustomEvent('marao:smash'));
  }

  // Celular e telas de toque: a cena não fica presa. O vídeo toca sozinho em loop,
  // inteiro, logo abaixo do título (arrastar o tempo do vídeo pela rolagem falha no iPhone).
  const touch = mobile || matchMedia('(hover: none)').matches;
  if (touch) {
    sec.classList.add('chapa--static');
    video.removeAttribute('data-scrub');
    video.setAttribute('data-autoplay', '');
    video.dataset.mobile = '/video/chapa-m.mp4';
    video.loop = true;
    return;
  }

  const R = 26;
  const geo = { s0: 0.4 };
  function place() {
    const W = pin.clientWidth, H = pin.clientHeight;
    const edge = Math.min(48, Math.max(18, W * 0.032));
    const nav = 72;
    let w = W - edge * 2, h = w * 9 / 16;
    const maxH = H - nav - edge - 12;
    if (h > maxH) { h = maxH; w = h * 16 / 9; }
    const y = nav + 12 + (maxH - h) / 2;
    Object.assign(win.style, { left: (W - w) / 2 + 'px', right: 'auto', top: y + 'px', width: w + 'px', height: h + 'px' });
    // tamanho inicial: a miniatura cabe entre o título e o texto (desktop) ou no meio (celular)
    geo.s0 = mobile ? Math.min(0.92, (W * 0.86) / w) : Math.min(0.42, (W * 0.36) / w);
  }
  const radius = () => {
    const s = gsap.getProperty(win, 'scale') || 1;
    win.style.borderRadius = R / s + 'px';
  };
  place();
  addEventListener('resize', place);

  if (reduced) { gsap.set(win, { scale: 1 }); radius(); video.addEventListener('loadedmetadata', () => { video.currentTime = video.duration * 0.9; }); return; }

  hideLines(title); gsap.set(text, { autoAlpha: 0 });
  let shown = false;
  const tl = gsap.timeline({ defaults: { ease: 'none' } })
    .fromTo(win, { scale: () => geo.s0 }, { scale: () => geo.s0, duration: 0.35, onUpdate: radius })
    .fromTo(win, { scale: () => geo.s0 }, { scale: 1, duration: 0.45, ease: 'power2.inOut', immediateRender: false, onUpdate: radius })
    .to({}, { duration: 0.2 });

  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: () => '+=' + innerHeight * (mobile ? 1.2 : 1.8),
    pin, scrub: 0.6, animation: tl, invalidateOnRefresh: true,
    onRefresh: () => { place(); radius(); },
    onLeaveBack: () => { if (shown) { shown = false; exitLines(title); exitBlock(text); } },
  });
  tl.eventCallback('onUpdate', () => {
    const p = tl.progress();
    scrubTo(p);
    if (lastP < SMASH && p >= SMASH) smash();
    lastP = p;
    const show = mobile || p < 0.4;
    if (show === shown) return;
    shown = show;
    if (show) { enterLines(title, { delay: 0.1 }); enterBlock(text, { delay: 0.25 }); }
    else { exitLines(title); exitBlock(text); }
  });
}
