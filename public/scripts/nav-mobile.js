const burger = document.getElementById('navBurger');
const menu = document.getElementById('navMenu');
if (burger && menu) {
  burger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    burger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    burger.textContent = isOpen ? '✕' : '☰';
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    burger.textContent = '☰';
    burger.setAttribute('aria-label', 'Abrir menú');
  }));
}
