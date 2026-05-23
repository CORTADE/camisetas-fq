const cd = document.getElementById('cd');
if (cd) {
  const target = new Date(cd.dataset.fechaLimite);
  const D = document.getElementById('cd-d');
  const H = document.getElementById('cd-h');
  const M = document.getElementById('cd-m');
  const S = document.getElementById('cd-s');
  const pad = n => String(Math.max(0, n)).padStart(2, '0');
  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      [D, H, M, S].forEach(el => el && (el.textContent = '00'));
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (D) D.textContent = pad(d);
    if (H) H.textContent = pad(h);
    if (M) M.textContent = pad(m);
    if (S) S.textContent = pad(s);
  }
  setInterval(tick, 1000);
  tick();
}
