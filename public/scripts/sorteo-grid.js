const grid = document.getElementById('grid100');
if (grid) {
  const wrap = grid.closest('.sorteo-grid-wrap');
  const phone = wrap.dataset.whatsapp;
  const tituloSorteo = wrap.dataset.sorteoTitulo;
  const precio = wrap.dataset.sorteoPrecio;
  const template = wrap.dataset.template;
  const cta = document.getElementById('gridCta');
  const ctaNum = document.getElementById('gridCtaNum');
  const ctaBtn = document.getElementById('gridCtaBtn');
  let selected = null;

  grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('avail')) return;
    if (selected) {
      const prev = grid.querySelector(`.cell[data-num="${selected}"]`);
      if (prev) { prev.classList.remove('selected'); prev.classList.add('avail'); }
    }
    selected = cell.dataset.num;
    cell.classList.remove('avail');
    cell.classList.add('selected');
    ctaNum.textContent = '#' + selected;
    cta.classList.add('show');
    cta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  ctaBtn.addEventListener('click', () => {
    if (!selected) return;
    const msg = template
      .replace('{numero}', selected)
      .replace('{titulo_sorteo}', tituloSorteo)
      .replace('{precio}', precio);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}
