// Fichas que se giran (rotateY 180°): por delante el personaje, por detrás su ilustradora.
// Un clic en cualquier punto de la ficha la gira, por las dos caras; los enlaces del reverso
// funcionan como enlaces. Con teclado: los botones "Darle la vuelta" / "Volver a la carta" y Escape.
// Solo la cara visible se puede leer y recorrer con el teclado.
const $ = (s, c = document) => c.querySelector(s);

export function iniciarNaipes(raiz = document) {
  raiz.querySelectorAll('.ident').forEach(carta => {
    const frente = $('.ident__cara--frente', carta);
    const dorso = $('.ident__cara--dorso', carta);
    const girar = $('.ident__girar', carta);
    const volver = $('.ident__volver', carta);
    if (!frente || !dorso || !girar || !volver) return;

    const gira = (vuelta, conTeclado) => {
      carta.classList.toggle('is-girada', vuelta);
      girar.setAttribute('aria-expanded', vuelta);
      dorso.inert = !vuelta;
      frente.inert = vuelta;
      // el foco acompaña a la cara visible (sin anillo si se ha girado con el ratón)
      const destino = vuelta ? volver : girar;
      destino.focus({ preventScroll: true, focusVisible: !!conTeclado });
    };

    carta.addEventListener('click', e => {
      if (e.target.closest('a')) return;            // Portfolio, Instagram…
      if (getSelection()?.toString()) return;       // seleccionar texto no gira la ficha
      const conTeclado = e.detail === 0;            // Intro / Espacio sobre los botones
      gira(!carta.classList.contains('is-girada'), conTeclado);
    });
    carta.addEventListener('keydown', e => { if (e.key === 'Escape' && carta.classList.contains('is-girada')) gira(false, true); });
  });
}
