import { gsap } from 'gsap';

// "Build your X": escolha o recheio e os adicionais e veja o nome e o preço
// reais do cardápio. Sem script, a página mostra o X-Tudo (o estado inicial).
const PROTEIN = {
  beef: { label: 'Beef patty' },
  chicken: { label: 'Grilled chicken', name: 'X-Chicken', price: '$16.99', note: 'Grilled chicken instead of beef.' },
  calabresa: { label: 'Calabresa sausage', name: 'X-Calabresa', price: '$17.99', note: 'Smoky Brazilian sausage, sliced and griddled.' },
  steak: { label: 'Steak tips', name: 'X-Steak Tips', price: '$18.99', note: 'Steak tips off the flat-top.' },
  veg: { label: 'Two eggs', name: 'X-Vegetariano', price: '$12.99', note: 'Two eggs and two slices of mozzarella. No meat.' },
};
const BEEF = {
  '': ['X-Burguer', '$13.99', 'Where every X starts.'],
  egg: ['X-Egg', '$15.99', 'Plus a fried egg on top of the patty.'],
  bacon: ['X-Bacon', '$16.99', 'Plus crispy bacon.'],
  ham: ['X-Salad', '$14.99', 'Plus ham. Yes, it is called X-Salad.'],
  'bacon+egg': ['X-Egg Bacon', '$17.49', 'Egg and bacon, the breakfast X.'],
  'bacon+egg+ham': ['X-Tudo De Marão', '$19.99', 'The one with everything. Our namesake.'],
};

export function initBuilder() {
  const root = document.querySelector('[data-builder]');
  if (!root) return;
  const proteins = [...root.querySelectorAll('[data-protein]')];
  const adds = [...root.querySelectorAll('[data-add]')];
  const stack = root.querySelector('[data-stack]');
  const out = { name: root.querySelector('[data-result-name]'), price: root.querySelector('[data-result-price]'), note: root.querySelector('[data-result-note]') };
  const protLabel = root.querySelector('[data-protein-label]');
  let protein = 'beef';
  const on = new Set(['egg', 'bacon', 'ham']);

  function result() {
    const key = [...on].sort().join('+');
    if (protein === 'veg') return [PROTEIN.veg.name, PROTEIN.veg.price, PROTEIN.veg.note];
    if (protein === 'beef') {
      return BEEF[key] || ['Not on the menu like that', 'Try $19.99', 'Closest is the X-Tudo De Marão: it has egg, bacon and ham.'];
    }
    const p = PROTEIN[protein];
    if (!key) return [p.name, p.price, p.note];
    if (key === 'bacon+egg+ham') return ['Super X-Tudo De Marão', '$24.99', `The X-Tudo with ${p.label.toLowerCase()} on top. The biggest thing we make.`];
    return ['Not on the menu like that', 'Try $24.99', `Closest is the Super X-Tudo De Marão: everything, plus ${p.label.toLowerCase()}.`];
  }

  function render(changed) {
    const [n, pr, note] = result();
    out.name.textContent = n; out.price.textContent = pr; out.note.textContent = note;
    protLabel.textContent = protein === 'veg' ? 'Two eggs' : PROTEIN[protein].label;
    const lit = new Set(['top', 'sticks', 'corn', 'cheese', 'protein', 'tomato', 'lettuce', 'bottom', ...(protein === 'veg' ? [] : on)]);
    stack.querySelectorAll('li').forEach((li) => {
      const was = li.classList.contains('on');
      const now = lit.has(li.dataset.layer);
      li.classList.toggle('on', now);
      if (changed && now && (!was || li.dataset.layer === 'protein')) gsap.fromTo(li, { yPercent: -60 }, { yPercent: 0, duration: 0.5, ease: 'bounce.out' });
    });
    adds.forEach((b) => { b.disabled = protein === 'veg'; b.setAttribute('aria-pressed', String(on.has(b.dataset.add) && protein !== 'veg')); });
    proteins.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.protein === protein)));
    gsap.fromTo(out.price, { scale: 0.92 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', transformOrigin: '0% 100%' });
  }

  proteins.forEach((b) => b.addEventListener('click', () => { protein = b.dataset.protein; render(true); }));
  // Setas movem entre as opções do grupo de rádio
  root.querySelector('[role="radiogroup"]').addEventListener('keydown', (e) => {
    const i = proteins.indexOf(document.activeElement);
    if (i < 0 || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const n = proteins[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + proteins.length) % proteins.length];
    n.focus(); n.click();
  });
  adds.forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.add;
    on.has(k) ? on.delete(k) : on.add(k);
    render(true);
  }));
  render(false);
}
