import { gsap } from 'gsap';

// Títulos .lines: quebrados em linhas reais, cada uma atrás de uma máscara.
// Entram subindo (0,9–1,05 s) e saem no lugar (0,4 s), sempre por tempo, nunca presos ao scroll.
const tweens = new WeakMap();

export function splitLines(el) {
  if (el.dataset.split) return;
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  const spans = words.map((w, i) => {
    const s = document.createElement('span');
    s.textContent = w + (i < words.length - 1 ? ' ' : '');
    s.style.display = 'inline-block';
    s.style.whiteSpace = 'pre';
    el.appendChild(s);
    return s;
  });
  const rows = [];
  spans.forEach((s) => {
    const top = Math.round(s.offsetTop);
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.top - top) < 4) last.items.push(s);
    else rows.push({ top, items: [s] });
  });
  el.textContent = '';
  rows.forEach((r) => {
    const line = document.createElement('span');
    line.className = 'line';
    const inner = document.createElement('span');
    inner.className = 'line-in';
    inner.textContent = r.items.map((s) => s.textContent).join('').trimEnd();
    line.appendChild(inner);
    el.appendChild(line);
  });
  el.dataset.split = '1';
}

const kill = (el) => { (tweens.get(el) || []).forEach((t) => t.kill()); tweens.set(el, []); };
const keep = (el, t) => { tweens.get(el)?.push(t) ?? tweens.set(el, [t]); return t; };

// Rolagem rápida: nenhuma entrada começa; as saídas encurtam
let fast = false;
export const setFast = (v) => { fast = v; };

export function enterLines(el, { delay = 0 } = {}) {
  kill(el);
  const ins = el.querySelectorAll('.line-in');
  if (fast) { gsap.set(ins, { yPercent: 0 }); return; }
  keep(el, gsap.fromTo(ins, { yPercent: 108 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay }));
}

export function exitLines(el) {
  kill(el);
  const ins = el.querySelectorAll('.line-in');
  keep(el, gsap.to(ins, { yPercent: -108, duration: fast ? 0.12 : 0.4, ease: 'power3.in', stagger: fast ? 0 : 0.03 }));
}

export function hideLines(el) {
  kill(el);
  gsap.set(el.querySelectorAll('.line-in'), { yPercent: 108 });
}

// Bloco comum (parágrafos, botões): sobe com opacidade
export function enterBlock(els, { delay = 0 } = {}) {
  if (fast) return gsap.set(els, { autoAlpha: 1, y: 0 });
  return gsap.fromTo(els, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay });
}
export function exitBlock(els) {
  return gsap.to(els, { autoAlpha: 0, y: -14, duration: fast ? 0.12 : 0.35, ease: 'power2.in' });
}
