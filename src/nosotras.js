// Sobre nosotras: cada carta de personaje se gira (rotateY 180°) y enseña a su ilustradora.
import './comun.js';

const $ = (s, c = document) => c.querySelector(s);

document.querySelectorAll('.naipe').forEach(naipe => {
  const frente = $('.naipe__cara--frente', naipe);
  const dorso = $('.naipe__cara--dorso', naipe);
  const girar = $('.naipe__girar', naipe);
  const volver = $('.naipe__volver', naipe);

  const gira = vuelta => {
    naipe.classList.toggle('is-girada', vuelta);
    girar.setAttribute('aria-expanded', vuelta);
    // solo la cara visible se puede leer y recorrer con el teclado
    dorso.inert = !vuelta;
    frente.inert = vuelta;
    (vuelta ? volver : girar).focus({ preventScroll: true });
  };
  girar.addEventListener('click', () => gira(true));
  volver.addEventListener('click', () => gira(false));
  naipe.addEventListener('keydown', e => { if (e.key === 'Escape' && naipe.classList.contains('is-girada')) gira(false); });
});
