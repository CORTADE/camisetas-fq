// Multi-select sorteo grid — client-side only.
// Selection lives in memory: when user opens WhatsApp the message includes all picked
// numbers and the selection is wiped (editor marks vendidos/reservados manually in /admin).
// The rendering logic here mirrors `renderSorteoTemplate` in src/lib/whatsapp.ts —
// see whatsapp.test.ts for the canonical behavior tests.

const grid = document.getElementById('grid100');
if (grid) {
  const wrap = grid.closest('.sorteo-grid-wrap');
  const phone = wrap.dataset.whatsapp;
  const tituloSorteo = wrap.dataset.sorteoTitulo;
  const precio = Number(wrap.dataset.sorteoPrecio);
  const template = wrap.dataset.template;
  const cta = document.getElementById('gridCta');
  const ctaInfo = cta.querySelector('.grid-cta-info');
  const ctaBtn = document.getElementById('gridCtaBtn');
  const ctaClear = document.getElementById('gridCtaClear');
  const selected = new Set();

  function renderSorteoMessage(tpl, nums) {
    if (nums.length === 0) return '';
    const cantidadTexto = nums.length === 1 ? 'el número' : `los ${nums.length} números`;
    const numerosFmt = nums.map(n => `#${n}`).join(', ');
    const total = nums.length * precio;
    return tpl
      .replace(/\{numero\}/g, nums[0])
      .replace(/\{numeros\}/g, numerosFmt)
      .replace(/\{cantidad_texto\}/g, cantidadTexto)
      .replace(/\{total\}/g, String(total))
      .replace(/\{titulo_sorteo\}/g, tituloSorteo)
      .replace(/\{precio\}/g, String(precio));
  }

  function renderCta() {
    if (selected.size === 0) {
      cta.classList.remove('show');
      return;
    }
    const nums = [...selected].sort();
    const numerosFmt = nums.map(n => `#${n}`).join(', ');
    const total = nums.length * precio;
    if (nums.length === 1) {
      ctaInfo.innerHTML = `<div class="grid-cta-label">Has elegido el número</div><div class="grid-cta-num">#${nums[0]}</div>`;
      ctaBtn.textContent = `RESERVAR EL #${nums[0]} POR WHATSAPP`;
    } else {
      ctaInfo.innerHTML = `<div class="grid-cta-label">Has elegido ${nums.length} números</div><div class="grid-cta-num">${numerosFmt}</div><div class="grid-cta-total">Total: ${total}€</div>`;
      ctaBtn.textContent = `RESERVAR LOS ${nums.length} NÚMEROS POR WHATSAPP`;
    }
    cta.classList.add('show');
  }

  function clearSelection() {
    selected.forEach(num => {
      const cell = grid.querySelector(`.cell[data-num="${num}"]`);
      if (cell) {
        cell.classList.remove('selected');
        cell.classList.add('avail');
      }
    });
    selected.clear();
    renderCta();
  }

  grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const num = cell.dataset.num;
    const wasEmpty = selected.size === 0;
    if (cell.classList.contains('selected')) {
      cell.classList.remove('selected');
      cell.classList.add('avail');
      selected.delete(num);
    } else if (cell.classList.contains('avail')) {
      cell.classList.remove('avail');
      cell.classList.add('selected');
      selected.add(num);
    } else {
      return;
    }
    renderCta();
    if (wasEmpty && selected.size === 1) {
      cta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  ctaBtn.addEventListener('click', () => {
    if (selected.size === 0) return;
    const nums = [...selected].sort();
    const msg = renderSorteoMessage(template, nums);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    clearSelection();
  });

  ctaClear?.addEventListener('click', clearSelection);
}
