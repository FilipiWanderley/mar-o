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

  // Celular e telas de toque: a cena não fica presa e o vídeo vira uma sequência de quadros
  // num <canvas>, em loop. Imagem não é bloqueada pela economia de bateria/dados do celular,
  // que para vídeos automáticos no primeiro quadro.
  const touch = mobile || matchMedia('(hover: none)').matches;
  if (touch) {
    sec.classList.add('chapa--static');
    video.removeAttribute('data-scrub');
    video.removeAttribute('src');
    video.preload = 'none';
    video.hidden = true;
    playFrames(win, video.getAttribute('poster'), reduced);
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

// Sequência de quadros da chapa (100 quadros, 10 por segundo), carregada perto da tela
function playFrames(win, poster, reduced) {
  const N = 100, FPS = 10;
  const canvas = document.createElement('canvas');
  canvas.className = 'chapa-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Marão smashes a beef patty on the flat-top, sparks fly and the cheese melts');
  win.style.backgroundImage = `url(${poster})`;
  win.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const imgs = [];
  let loaded = 0, visible = false, frame = 0, last = 0, raf = 0, started = false;

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(win.clientWidth * dpr);
    canvas.height = Math.round(win.clientHeight * dpr);
  };
  const draw = (i) => {
    const img = imgs[i];
    if (!img || !img.complete || !img.naturalWidth) return false;
    const cw = canvas.width, ch = canvas.height;
    const k = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    return true;
  };
  const load = () => {
    if (started) return;
    started = true;
    for (let i = 0; i < N; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { loaded++; if (i === 0) draw(0); };
      img.src = `/frames/chapa/c_${String(i + 1).padStart(3, '0')}.webp`;
      imgs.push(img);
    }
  };
  const tick = (t) => {
    raf = 0;
    if (!visible) return;
    if (t - last >= 1000 / FPS && loaded > 10) {
      last = t;
      const next = (frame + 1) % N;
      if (draw(next)) frame = next;
    }
    raf = requestAnimationFrame(tick);
  };
  size();
  addEventListener('resize', () => { size(); draw(frame); });
  new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '800px 0px' }).observe(win);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !reduced;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  }, { threshold: 0.15 }).observe(win);
}
