const STORAGE_KEY = 'camisetas-fq:favoritos';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function save(slugs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs)); }
  catch {}
  window.dispatchEvent(new CustomEvent('favoritos-changed'));
}
function toggle(slug) {
  const list = load();
  const i = list.indexOf(slug);
  if (i >= 0) list.splice(i, 1); else list.push(slug);
  save(list);
}

// Mark hearts on initial render
function updateHearts() {
  const set = new Set(load());
  document.querySelectorAll('[data-fav-toggle]').forEach(btn => {
    const slug = btn.getAttribute('data-fav-toggle');
    btn.classList.toggle('is-fav', set.has(slug));
    btn.textContent = set.has(slug) ? '♥' : '♡';
  });
  const badge = document.getElementById('favBadge');
  if (badge) {
    badge.textContent = String(set.size);
    badge.hidden = set.size === 0;
  }
}

// Wire toggle buttons on product cards
document.querySelectorAll('[data-fav-toggle]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle(btn.getAttribute('data-fav-toggle'));
  });
});

// Drawer open/close
const drawer = document.getElementById('favDrawer');
const overlay = document.getElementById('favOverlay');
const favBtn = document.getElementById('favBtn');
const favClose = document.getElementById('favClose');
const favList = document.getElementById('favList');
const favEmpty = document.getElementById('favEmpty');
const favFooter = document.getElementById('favFooter');
const favTitle = document.getElementById('favTitle');
const favCta = document.getElementById('favCta');
const favClear = document.getElementById('favClear');
const favEmptyCta = document.getElementById('favEmptyCta');

function openDrawer() {
  if (!drawer) return;
  drawer.classList.add('open');
  overlay.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  renderDrawer();
}
function closeDrawer() {
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}

favBtn?.addEventListener('click', openDrawer);
favClose?.addEventListener('click', closeDrawer);
overlay?.addEventListener('click', closeDrawer);
favEmptyCta?.addEventListener('click', closeDrawer);

function renderDrawer() {
  if (!drawer) return;
  const items = JSON.parse(drawer.dataset.items || '[]');
  const itemsBySlug = new Map(items.map(it => [it.slug, it]));
  const favSlugs = load();
  const active = favSlugs.map(s => itemsBySlug.get(s)).filter(Boolean);
  favTitle.textContent = `TUS FAVORITOS · ${active.length} ${active.length === 1 ? 'pieza' : 'piezas'}`;
  if (active.length === 0) {
    favList.innerHTML = '';
    favEmpty.style.display = '';
    favFooter.hidden = true;
    return;
  }
  favEmpty.style.display = 'none';
  favFooter.hidden = false;
  favList.innerHTML = active.map(it => `
    <div class="fav-item">
      <img src="${it.foto}" alt="${it.titulo}" />
      <div>
        <div class="fav-item-name">${it.titulo}</div>
        <div class="fav-item-team">${it.equipo}</div>
        <div class="fav-item-price">${it.precio}€</div>
      </div>
      <button class="fav-item-remove" type="button" data-remove="${it.slug}" aria-label="Quitar">✕</button>
    </div>
  `).join('');
  favList.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => toggle(btn.getAttribute('data-remove')));
  });
}

favCta?.addEventListener('click', () => {
  const items = JSON.parse(drawer.dataset.items || '[]');
  const itemsBySlug = new Map(items.map(it => [it.slug, it]));
  const active = load().map(s => itemsBySlug.get(s)).filter(Boolean);
  if (active.length === 0) return;
  const lista = active.map(it => `• ${it.titulo} (${it.equipo}) - ${it.precio}€`).join('\n');
  const template = drawer.dataset.template;
  const phone = drawer.data.whatsapp;
  const msg = template.replace('{lista}', lista);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
});

favClear?.addEventListener('click', () => save([]));

window.addEventListener('favoritos-changed', () => {
  updateHearts();
  if (drawer?.classList.contains('open')) renderDrawer();
});

updateHearts();
