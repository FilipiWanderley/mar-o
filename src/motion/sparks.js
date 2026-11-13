// Faíscas, gotas, milho e batata palha num <canvas> de tela cheia.
// burst() solta uma rajada; sizzle() mantém um chiado por um tempo.
const canvas = document.querySelector('.sparks');
const ctx = canvas.getContext('2d');
const parts = [];
let dpr = 1, W = 0, H = 0, running = false, last = 0, sizzles = [];

const COLORS = { spark: ['#fff6e0', '#ffffff', '#ffd27a', '#d4424d'], drop: ['#d4424d', '#b8323c'], corn: ['#f2c230', '#f7d354'], stick: ['#e0a63a', '#f0c060'] };
const GRAV = { spark: 1100, drop: 1700, corn: 1900, stick: 1800 };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

function spawn(kind, x, y, opts) {
  const ang = rnd(-Math.PI * 0.95, -Math.PI * 0.05); // para cima e para os lados
  const sp = kind === 'spark' ? rnd(400, 1400) : kind === 'drop' ? rnd(250, 700) : rnd(300, 850);
  parts.push({
    kind, x, y, vx: Math.cos(ang) * sp * (opts.wide ?? 1), vy: Math.sin(ang) * sp,
    life: kind === 'spark' ? rnd(0.4, 0.9) : rnd(0.7, 1.4), age: 0,
    size: kind === 'drop' ? rnd(2, 6) : kind === 'corn' ? rnd(4, 7) : kind === 'stick' ? rnd(10, 18) : 1,
    rot: rnd(0, Math.PI), vr: rnd(-12, 12), color: pick(COLORS[kind]), floor: opts.floor ?? Infinity,
  });
}

function mix(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(weights)) { if ((r -= w) <= 0) return k; }
  return 'spark';
}

export function burst({ x0, x1 = x0, y, count = 200, kinds = { spark: 1 }, floor, wide } = {}) {
  for (let i = 0; i < count; i++) spawn(mix(kinds), rnd(x0, x1), y + rnd(-4, 4), { floor, wide });
  start();
}

export function sizzle({ x0, x1, y, rate = 18, duration = 1.2, kinds = { spark: 1 }, floor }) {
  sizzles.push({ x0, x1, y, rate, until: performance.now() + duration * 1000, kinds, floor, acc: 0 });
  start();
}

function start() {
  if (running) return;
  running = true; last = performance.now();
  canvas.style.visibility = 'visible';
  requestAnimationFrame(tick);
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  sizzles = sizzles.filter((s) => now < s.until);
  for (const s of sizzles) {
    s.acc += s.rate * dt;
    while (s.acc >= 1) { s.acc--; spawn(mix(s.kinds), rnd(s.x0, s.x1), s.y, { floor: s.floor }); }
  }
  ctx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.age += dt;
    p.vy += GRAV[p.kind] * dt; p.vx *= 0.995;
    const px = p.x, py = p.y;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.age > p.life || p.y > p.floor || p.y > H + 40) { parts.splice(i, 1); continue; }
    const a = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.4));
    if (p.kind === 'spark') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(px - p.vx * 0.018, py - p.vy * 0.018); ctx.lineTo(p.x, p.y); ctx.stroke();
    } else if (p.kind === 'drop') {
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * 0.7, p.size, Math.atan2(p.vy, p.vx), 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      if (p.kind === 'corn') { ctx.beginPath(); ctx.roundRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.85, 2); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -1.2, p.size, 2.4);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  if (parts.length || sizzles.length) requestAnimationFrame(tick);
  else { running = false; ctx.clearRect(0, 0, W, H); canvas.style.visibility = 'hidden'; }
}
