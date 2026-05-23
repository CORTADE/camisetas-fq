const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));
document.querySelectorAll('.product.reveal').forEach((el, i) => { el.style.transitionDelay = (i * 80) + 'ms'; });

window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.style.background = window.scrollY > 40 ? 'rgba(5,5,5,0.95)' : 'rgba(10,10,10,0.85)';
});
