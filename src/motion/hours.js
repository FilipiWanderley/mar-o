// "Aberto agora": horário real da loja, calculado no fuso de Framingham (America/New_York)
const OPEN = 12 * 60 + 30;
const CLOSE = { 0: 23 * 60 + 59, 1: 23 * 60, 2: 23 * 60, 3: 23 * 60, 4: 23 * 60, 5: 23 * 60 + 59, 6: 23 * 60 + 59 };
const fmt = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

export function initHours() {
  const el = document.querySelector('[data-open-status]');
  if (!el) return;
  const update = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const now = +get('hour') * 60 + +get('minute');
    document.querySelectorAll('.hours tr').forEach((tr) => tr.classList.toggle('today', +tr.dataset.day === day));
    let text, open = false;
    if (now >= OPEN && now < CLOSE[day]) { open = true; text = `Open now · until ${fmt(CLOSE[day])}`; }
    else if (now < OPEN) text = `Closed · opens today at ${fmt(OPEN)}`;
    else text = `Closed · opens tomorrow at ${fmt(OPEN)}`;
    el.textContent = text;
    el.classList.toggle('is-open', open);
    el.classList.toggle('is-closed', !open);
  };
  update();
  setInterval(update, 60000);
}
