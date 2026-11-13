import { gsap } from 'gsap';

// Palavra gigante "MARÃO": ocupa a largura toda (tinta encostando nas bordas)
// e cresce como massa, letra a letra, a partir da linha de base.
export function fitWords() {
  document.querySelectorAll('.word').forEach((w) => {
    const spans = [...w.children];
    w.style.fontSize = '100px';
    const sum = spans.reduce((a, s) => a + s.getBoundingClientRect().width / (gsap.getProperty(s, 'scaleX') || 1), 0);
    const avail = w.clientWidth;
    const size = Math.max(40, (avail / sum) * 100 * 0.985);
    w.style.setProperty('--word-size', size + 'px');
    w.style.fontSize = '';
  });
}

const shuffle = (n) => [...Array(n).keys()].sort(() => Math.random() - 0.5);

// Cresce: passa de 100%, volta um tico e assenta. Ordem irregular.
export function grow(word, { delay = 0, from = 0 } = {}) {
  const spans = [...word.children];
  const order = shuffle(spans.length);
  const tl = gsap.timeline({ delay });
  order.forEach((i, k) => {
    const s = spans[i];
    tl.fromTo(s, { scaleY: from, scaleX: from ? 1.1 : 1 }, { scaleY: 1.07, scaleX: 0.98, duration: 0.5, ease: 'power3.out' }, k * 0.07)
      .to(s, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' }, k * 0.07 + 0.5);
  });
  return tl;
}

// Murcha afundando na base
export function sink(word, dur = 0.35) {
  return gsap.to(word.children, { scaleY: 0, duration: dur, ease: 'power3.in', stagger: 0.03 });
}

// Quebra um texto em letras (para os nomes do cardápio)
export function splitLetters(el) {
  const t = el.textContent;
  el.setAttribute('aria-label', t);
  el.textContent = '';
  [...t].forEach((c) => {
    const s = document.createElement('span');
    s.textContent = c === ' ' ? ' ' : c;
    s.setAttribute('aria-hidden', 'true');
    el.appendChild(s);
  });
  return [...el.children];
}
