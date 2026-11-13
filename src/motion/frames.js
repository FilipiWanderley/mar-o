// Quadros do vídeo do hero desenhados num <canvas>. Carrega em passadas
// (1 a cada 4, depois 1 a cada 2, depois todos) e desenha o mais próximo pronto.
export const TOTAL = 120; // 8 s a 15 quadros por segundo
const BG = '#0a0505';

export function createFrames(canvas, getStage) {
  const ctx = canvas.getContext('2d');
  const portrait = () => innerWidth / innerHeight < 1;
  const dir = portrait() ? 'm' : 'd';
  const src = (i) => `/frames/${dir}/f_${String(i + 1).padStart(3, '0')}.webp`;
  const imgs = new Array(TOTAL);
  let current = 0, drawn = -1, geo = null;

  const ready = (i) => imgs[i] && imgs[i].complete && imgs[i].naturalWidth > 0;
  function load(i) {
    if (imgs[i]) return imgs[i].decode ? imgs[i].decode().catch(() => {}) : Promise.resolve();
    const img = new Image();
    img.decoding = 'async';
    img.src = src(i);
    imgs[i] = img;
    return new Promise((res) => {
      img.onload = () => { if (drawn === -1 || i === current) draw(current, true); res(); };
      img.onerror = res;
    });
  }

  // Ordem de carregamento: passadas cada vez mais finas
  const order = [];
  for (const step of [4, 2, 1]) for (let i = 0; i < TOTAL; i += step) if (!order.includes(i)) order.push(i);
  const firstPass = order.filter((i) => i % 4 === 0).concat([TOTAL - 1]);

  function nearest(i) {
    for (let d = 0; d < TOTAL; d++) {
      if (ready(i - d)) return i - d;
      if (ready(i + d)) return i + d;
    }
    return -1;
  }

  // Onde o quadro fica na tela.
  // Desktop: tela cheia ("cover"), de borda a borda; o X-Tudo e o Marão um pouco à direita do centro,
  //          e o quadro sobe só o bastante para o papel encostar no letreiro MARÃO.
  // Celular: o hambúrguer e o Marão (x 0.24–0.82 do quadro) ocupam a largura, pousados na palavra.
  const wide = () => canvas.clientWidth / canvas.clientHeight >= 1;
  function layout(iw, ih) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const st = getStage();
    let s, dx, dy;
    if (wide()) {
      s = Math.max(W / iw, H / ih);
      const w = iw * s, h = ih * s;
      dx = Math.min(0, Math.max(W - w, W * 0.56 - 0.53 * w));
      dy = Math.max(-0.05 * h, Math.min(0, st.capTop + 34 - 0.86 * h));
    } else {
      s = (1.08 * W) / (0.58 * iw);
      dx = W / 2 - 0.53 * iw * s;
      dy = st.capTop + 6 - 0.86 * ih * s;
    }
    const w = iw * s, h = ih * s;
    return {
      W, H, s, dx, dy, w, h, full: wide(),
      counterY: st.capTop,
      contentW: 0.58 * w,
      impact: { x0: dx + 0.28 * w, x1: dx + 0.5 * w, y: dy + 0.34 * h },
      paperY: dy + 0.82 * h,
    };
  }

  // Véu (escurecimento suave) desenhado no próprio canvas, para o texto ler bem sobre o vídeo
  function veil(g, x0, y0, x1, y1, a0, a1, rect) {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, `rgba(10,5,5,${a0})`); grad.addColorStop(1, `rgba(10,5,5,${a1})`);
    g.fillStyle = grad; g.fillRect(...rect);
  }

  function feather(g, x, y, w, h, x0, y0, x1, y1) {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, BG); grad.addColorStop(1, 'rgba(10,5,5,0)');
    g.fillStyle = grad; g.fillRect(x, y, w, h);
  }

  function draw(i, force) {
    current = i;
    const j = nearest(i);
    if (j < 0 || (j === drawn && !force)) return;
    const img = imgs[j];
    geo = layout(img.naturalWidth, img.naturalHeight);
    const { W, H, dx, dy, w, h } = geo;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, dx, dy, w, h);
    const cut = dy + 0.885 * h;
    if (geo.full) {
      // tela cheia: véu à esquerda (texto), em cima (nav) e embaixo (letreiro)
      veil(ctx, 0, 0, W * 0.42, 0, 0.78, 0, [0, 0, W * 0.42, H]);
      veil(ctx, W, 0, W * 0.8, 0, 0.55, 0, [W * 0.8, 0, W * 0.2, H]);
      veil(ctx, 0, 0, 0, 120, 0.6, 0, [0, 0, W, 120]);
      const vb = geo.counterY - 40;
      veil(ctx, 0, vb, 0, Math.min(H, cut), 0, 0.92, [0, vb, W, Math.min(H, cut) - vb]);
      if (cut < H) { ctx.fillStyle = BG; ctx.fillRect(0, cut, W, H - cut); }
    } else {
      const f = Math.min(90, h * 0.14);
      if (dx > 0) feather(ctx, dx, dy, f, h, dx, 0, dx + f, 0);
      const ft = Math.min(h * 0.38, 160);
      if (dy > 0) { feather(ctx, dx, dy, w, ft, 0, dy, 0, dy + ft); feather(ctx, dx, dy, w, ft * 0.5, 0, dy, 0, dy + ft * 0.5); }
      if (dx + w < W) feather(ctx, dx + w - f, dy, f, h, dx + w, 0, dx + w - f, 0);
      // Abaixo do papel o balcão some no fundo, para a palavra MARÃO ficar limpa
      if (cut < H) { ctx.fillStyle = BG; ctx.fillRect(0, cut, W, H - cut); feather(ctx, 0, cut - 26, W, 26, 0, cut, 0, cut - 26); }
    }
    drawn = j;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(current, true);
  }

  return {
    resize,
    draw: (p) => draw(Math.round(p * (TOTAL - 1))),
    geometry: () => geo || (ready(0) ? layout(imgs[0].naturalWidth, imgs[0].naturalHeight) : null),
    preloadFirstPass: (onProgress) => {
      let done = 0;
      return Promise.all(firstPass.map((i) => load(i).then(() => onProgress(++done / firstPass.length))));
    },
    loadRest: () => {
      const rest = order.filter((i) => !imgs[i]);
      let k = 0;
      const batch = () => { for (let n = 0; n < 6 && k < rest.length; n++) load(rest[k++]); if (k < rest.length) setTimeout(batch, 60); };
      batch();
    },
  };
}
