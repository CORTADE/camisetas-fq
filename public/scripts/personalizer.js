const persSection = document.getElementById('personaliza');
const iname = document.getElementById('iname');
const inum = document.getElementById('inum');
const italla = document.getElementById('italla');
const pname = document.getElementById('pname');
const pnum = document.getElementById('pnum');
const persAdd = document.getElementById('persAdd');

if (iname && pname) iname.addEventListener('input', () => { pname.textContent = iname.value.toUpperCase(); });
if (inum && pnum) inum.addEventListener('input', () => { pnum.textContent = inum.value; });

if (persAdd && persSection) {
  const phone = persSection.dataset.whatsapp;
  const template = persSection.dataset.template;
  persAdd.addEventListener('click', () => {
    const msg = template
      .replace('{nombre}', iname?.value || 'CAMPEÓN')
      .replace('{dorsal}', inum?.value || '10')
      .replace('{talla}', italla?.value || 'L');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}
