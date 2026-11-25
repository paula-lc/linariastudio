// Meses pasados: pestañas Dríade / Bruja, cuadrícula por meses y ficha con botón de compra.
import { anadirACesta } from './comun.js';
import { MESES_PASADOS, MESES_PASADOS_EJEMPLO, PRECIO_MES_PASADO, MAESTRAS, euros } from './config.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const panel = $('#archivo');
if (panel) {
  const rejilla = $('.archivo__rejilla', panel);
  const detalle = $('.detalle', panel);
  const pestanas = $$('[role="tab"]');
  $('.archivo__ejemplo').hidden = !MESES_PASADOS_EJEMPLO;

  let maestra = 'driade';
  let indice = 0;

  // la pestaña y el mes viajan en la dirección (#bruja-marzo) para poder compartir el enlace
  const leeHash = () => {
    const [m, mes] = decodeURIComponent(location.hash.slice(1)).toLowerCase().split('-');
    if (MESES_PASADOS[m]) {
      maestra = m;
      const i = MESES_PASADOS[m].findIndex(c => c.mes.toLowerCase() === mes);
      indice = i >= 0 ? i : 0;
    }
  };
  const escribeHash = () => history.replaceState(null, '', `#${maestra}-${MESES_PASADOS[maestra][indice].mes.toLowerCase()}`);

  const pintaRejilla = () => {
    rejilla.innerHTML = MESES_PASADOS[maestra].map((c, i) => `
      <li>
        <button class="mes-carta" type="button" data-i="${i}" aria-pressed="${i === indice}">
          <span class="mes-carta__img"><img src="${c.img}" alt="" loading="lazy" width="400" height="400"></span>
          <span class="mes-carta__mes">${c.mes}</span>
          <span class="mes-carta__tema">${c.tema}</span>
        </button>
      </li>`).join('');
  };

  const pintaDetalle = (animar = true) => {
    const c = MESES_PASADOS[maestra][indice];
    const img = $('.detalle__img img', detalle);
    img.src = c.img;
    img.alt = `Ilustración de la carta de ${c.mes.toLowerCase()}: ${c.tema}`;
    $('.detalle__maestra', detalle).textContent = MAESTRAS[maestra].nombre;
    $('.detalle__mes', detalle).textContent = c.mes;
    $('.detalle__tema', detalle).textContent = c.tema;
    $('.detalle__desc', detalle).textContent = c.texto;
    $('.detalle__cifra', detalle).textContent = euros(PRECIO_MES_PASADO);
    $('.detalle__meses', detalle).innerHTML = MESES_PASADOS[maestra].map((m, i) =>
      `<button class="chip-mes" type="button" data-i="${i}" aria-pressed="${i === indice}">${m.mes}</button>`).join('');
    $$('.mes-carta', rejilla).forEach(b => b.setAttribute('aria-pressed', +b.dataset.i === indice));
    if (animar && !reduce) { detalle.classList.remove('is-cambia'); void detalle.offsetWidth; detalle.classList.add('is-cambia'); }
  };

  const eligeMaestra = (m, foco = false) => {
    maestra = m;
    pestanas.forEach(t => {
      const activa = t.dataset.maestra === m;
      t.setAttribute('aria-selected', activa);
      t.tabIndex = activa ? 0 : -1;
      if (activa && foco) t.focus();
    });
    panel.dataset.maestra = m;
    panel.setAttribute('aria-labelledby', `tab-${m}`);
    pintaRejilla();
    pintaDetalle();
  };

  const eligeMes = (i, bajar) => {
    indice = i;
    pintaDetalle();
    escribeHash();
    // en móvil la ficha está debajo de la cuadrícula: bajamos hasta ella
    if (bajar && matchMedia('(max-width: 860px)').matches) detalle.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  pestanas.forEach(t => {
    t.addEventListener('click', () => { indice = 0; eligeMaestra(t.dataset.maestra); escribeHash(); });
    t.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const i = pestanas.indexOf(t);
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? pestanas.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + pestanas.length) % pestanas.length;
      indice = 0;
      eligeMaestra(pestanas[n].dataset.maestra, true);
      escribeHash();
    });
  });
  rejilla.addEventListener('click', e => { const b = e.target.closest('.mes-carta'); if (b) eligeMes(+b.dataset.i, true); });
  detalle.addEventListener('click', e => { const b = e.target.closest('.chip-mes'); if (b) eligeMes(+b.dataset.i, false); });

  $('.detalle__comprar', detalle).addEventListener('click', e => {
    const c = MESES_PASADOS[maestra][indice];
    anadirACesta({
      id: `mes-${maestra}-${c.mes.toLowerCase()}`,
      nombre: `Carta de ${c.mes.toLowerCase()} · ${MAESTRAS[maestra].nombre}`,
      detalle: c.tema,
      precio: PRECIO_MES_PASADO,
      unico: true,
    }, e.currentTarget);
  });

  leeHash();
  eligeMaestra(maestra);
  addEventListener('hashchange', () => { leeHash(); eligeMaestra(maestra); });
}
