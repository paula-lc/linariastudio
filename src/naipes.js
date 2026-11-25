// Fichas que se giran (rotateY 180°): por delante el personaje, por detrás su ilustradora.
// Solo la cara visible se puede leer y recorrer con el teclado.
const $ = (s, c = document) => c.querySelector(s);

export function iniciarNaipes(raiz = document) {
  raiz.querySelectorAll('.ident').forEach(carta => {
    const frente = $('.ident__cara--frente', carta);
    const dorso = $('.ident__cara--dorso', carta);
    const girar = $('.ident__girar', carta);
    const volver = $('.ident__volver', carta);
    if (!frente || !dorso || !girar || !volver) return;

    const gira = vuelta => {
      carta.classList.toggle('is-girada', vuelta);
      girar.setAttribute('aria-expanded', vuelta);
      dorso.inert = !vuelta;
      frente.inert = vuelta;
      (vuelta ? volver : girar).focus({ preventScroll: true });
    };
    girar.addEventListener('click', () => gira(true));
    volver.addEventListener('click', () => gira(false));
    carta.addEventListener('keydown', e => { if (e.key === 'Escape' && carta.classList.contains('is-girada')) gira(false); });
  });
}
