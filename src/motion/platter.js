import { gsap } from 'gsap';
import { stableVH } from './viewport.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitLetters } from './words.js';

// O prato giratório: um prato invisível com o centro abaixo da tela e os seis burgers na borda,
// a 60° um do outro. Um marco, um burger. O nome gigante fica atrás, como a palavra no hero.
const ITEMS = [
  { name: 'X-Burguer', price: '$13.99', desc: 'Beef patty, mozzarella, lettuce, tomato, corn, potato sticks and mayo. Where every X starts.' },
  { name: 'X-Egg', price: '$15.99', desc: 'The X-Burguer with a fried egg on top of the patty, yolk still soft.' },
  { name: 'X-Bacon', price: '$16.99', desc: 'Beef patty, crispy bacon, mozzarella, lettuce, tomato, corn, potato sticks and mayo.' },
  { name: 'X-Calabresa', price: '$17.99', desc: 'Smoky Brazilian calabresa sausage instead of beef, with mozzarella, corn and potato sticks.' },
  { name: 'X-Tudo De Marão', price: '$19.99', desc: 'Hamburger, egg, bacon, ham, mozzarella, lettuce, tomato, corn, potato sticks and mayo.' },
  { name: 'Super X-Tudo', price: '$24.99', desc: 'The X-Tudo plus steak tips, chicken or sausage. The biggest thing we make.' },
];
const STEP = 60;

export function initPlatter({ reduced, mobile, lenis }) {
  const sec = document.querySelector('.platter');
  if (!sec) return;
  const pin = sec.querySelector('.platter-pin');
  const items = [...sec.querySelectorAll('.ring-item')];
  const names = [...sec.querySelectorAll('.pname')];
  const nameLetters = names.map(splitLetters);
  const btn = sec.querySelector('[data-ring-next]');
  const dots = [...sec.querySelectorAll('.platter-dots li')];
  const f = {
    title: sec.querySelector('[data-p-title]'), desc: sec.querySelector('[data-p-desc]'),
    price: sec.querySelector('[data-p-price]'), order: sec.querySelector('[data-p-order] .btn-label'),
  };
  const left = sec.querySelector('.pinfo--left'), right = sec.querySelector('.pinfo--right');
  const state = { rot: 0, lift: 0 };
  let idx = 0, geo;

  function measure() {
    const W = pin.clientWidth, H = pin.clientHeight;
    const size = mobile ? Math.min(W * 0.94, H * 0.46) : Math.min(H * 0.6, W * 0.42);
    const cy = mobile ? H * 0.45 : H * 0.5;
    const R = mobile ? W * 1.15 : H * 1.05;
    geo = { W, H, size, cx: W / 2, cy, R };
    pin.style.setProperty('--item', size + 'px');
    pin.style.setProperty('--btn-size', size * 0.78 + 'px');
    pin.style.setProperty('--btn-top', cy + 'px');
    place();
  }
  function place() {
    const { cx, cy, R, size } = geo;
    items.forEach((el, i) => {
      const d = i - state.rot;
      const a = (-90 + d * STEP) * Math.PI / 180;
      const x = cx + R * Math.cos(a) - size / 2;
      const y = cy + R + R * Math.sin(a) - size / 2;
      const lift = Math.abs(d) < 0.5 ? state.lift : 0;
      gsap.set(el, { x, y: y - lift * size * 0.025, rotation: d * 22, scale: 1 + lift * 0.02, autoAlpha: Math.max(0, 1 - Math.abs(d) * 1.15) });
    });
  }

  function setName(i, prev) {
    if (prev != null && reduced) gsap.set(names[prev], { visibility: 'hidden' });
    else if (prev != null) {
      gsap.to(nameLetters[prev], { scaleY: 0, duration: 0.3, ease: 'power3.in', stagger: 0.02, onComplete: () => gsap.set(names[prev], { visibility: 'hidden' }) });
    }
    gsap.set(names[i], { visibility: 'visible' });
    if (reduced) { gsap.set(nameLetters[i], { scaleY: 1 }); return; }
    const order = nameLetters[i].map((_, k) => k).sort(() => Math.random() - 0.5);
    order.forEach((k, n) => {
      const s = nameLetters[i][k];
      gsap.timeline({ delay: 0.35 + n * 0.045 })
        .fromTo(s, { scaleY: 0 }, { scaleY: 1.08, duration: 0.45, ease: 'power3.out' })
        .to(s, { scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    });
  }
  function setInfo(i, animate) {
    const it = ITEMS[i];
    const fill = () => {
      f.title.textContent = it.name; f.desc.textContent = it.desc; f.price.textContent = it.price;
      f.order.textContent = `Order the ${it.name}`;
      const next = ITEMS[(i + 1) % ITEMS.length].name;
      btn.setAttribute('aria-label', `Burger ${i + 1} of ${ITEMS.length}, ${it.name}. Turn the platter to ${next}`);
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    if (!animate || reduced) return fill();
    gsap.to([left, right], { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in', onComplete: () => {
      fill();
      gsap.fromTo([left, right], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.45 });
    } });
  }
  function go(i) {
    if (i === idx) return;
    const prev = idx;
    idx = i;
    gsap.to(state, { rot: i, duration: reduced ? 0 : 1, ease: 'power3.inOut', onUpdate: place });
    setName(i, prev);
    setInfo(i, true);
  }

  measure();
  addEventListener('resize', measure);
  gsap.set(nameLetters.flat(), { scaleY: 0 });
  setName(0); setInfo(0, false);

  const st = ScrollTrigger.create({
    trigger: sec, start: 'top top', end: () => '+=' + stableVH() * (ITEMS.length * 0.7),
    pin, invalidateOnRefresh: true, onRefresh: measure,
    onUpdate(self) { go(Math.min(ITEMS.length - 1, Math.floor(self.progress * ITEMS.length))); },
  });

  // O burger da vez é um botão: gira para o próximo (do último volta ao primeiro)
  const goTo = (i) => {
    const y = st.start + ((i + 0.6) / ITEMS.length) * (st.end - st.start);
    if (lenis) lenis.scrollTo(y, { duration: 0.9, easing: (t) => 1 - Math.pow(2, -10 * t) });
    else window.scrollTo(0, y);
  };
  btn.addEventListener('click', () => goTo((idx + 1) % ITEMS.length));
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo((idx + 1) % ITEMS.length); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo((idx + ITEMS.length - 1) % ITEMS.length); }
  });
  const lift = (v) => gsap.to(state, { lift: v, duration: reduced ? 0 : 0.5, ease: 'power3.out', onUpdate: place });
  btn.addEventListener('pointerenter', () => { if (!document.documentElement.classList.contains('is-scrolling')) lift(1); });
  btn.addEventListener('pointerleave', () => lift(0));
  btn.addEventListener('focus', () => lift(1));
  btn.addEventListener('blur', () => lift(0));
  btn.addEventListener('pointerdown', () => gsap.to(state, { lift: -0.6, duration: 0.12, onUpdate: place }));
  btn.addEventListener('pointerup', () => gsap.to(state, { lift: 1, duration: 0.5, ease: 'back.out(3)', onUpdate: place }));
}
