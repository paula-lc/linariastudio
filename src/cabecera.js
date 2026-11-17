// La barra de arriba se queda fija y se encoge al hacer scroll.
export function iniciarCabecera() {
  const barra = document.querySelector('.barra-superior');
  if (!barra) return;
  // reserva el alto de la barra grande para que el contenido no salte al fijarla
  const reserva = () => {
    const mini = barra.classList.contains('is-mini');
    barra.classList.remove('is-mini');
    document.documentElement.style.setProperty('--alto-barra', barra.offsetHeight + 'px');
    barra.classList.toggle('is-mini', mini);
  };
  reserva();
  addEventListener('resize', reserva);
  document.fonts?.ready.then(reserva);

  let pendiente = false;
  const mira = () => {
    pendiente = false;
    barra.classList.toggle('is-mini', scrollY > 40);
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(mira); } }, { passive: true });
  mira();
}
