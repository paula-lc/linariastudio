// Lo que comparten todas las páginas: cabecera, menús, cesta lateral y carta de bienvenida.
import { PLAZAS_LIBRES, euros } from './config.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
// en la portada los enlaces al recetario se quedan en la misma página
const enPortada = () => !!document.getElementById('recetario');
const aRecetario = () => (enPortada() ? '#recetario' : 'index.html#recetario');

/* ---------- Filtro de trazo a mano (para ornamentos y marcos) ---------- */
function filtrosDeTinta() {
  if ($('#filtros-tinta')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <svg id="filtros-tinta" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <filter id="mano" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="r"/>
        <feDisplacementMap in="SourceGraphic" in2="r" scale="2.4"/>
      </filter>
      <symbol id="esquina" viewBox="0 0 60 60"> <path d="M4 56V22C4 12 12 4 22 4h34" fill="none" stroke="currentColor" stroke-width="1.2"/> <path d="M10 56V24c0-8 6-14 14-14h32" fill="none" stroke="currentColor" stroke-width=".7"/> <path d="M16 22c0-4 3-6 6-6 4 0 5 4 3 6s-5 1-5-1" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/> <circle cx="4" cy="4" r="2.2" fill="currentColor"/></symbol>
      <symbol id="ramita" viewBox="0 0 240 40">
        <path d="M6 21c40-3 78-4 114-1s74 3 114-1" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round">
          <path d="M60 20c-6-8-14-11-22-10 5 7 13 10 22 10z"/><path d="M78 20c-4 7-11 11-19 11 3-7 10-11 19-11z"/>
          <path d="M162 20c6-8 14-11 22-10-5 7-13 10-22 10z"/><path d="M180 20c4 7 11 11 19 11-3-7-10-11-19-11z"/>
          <path d="M112 19c-3-7-1-13 4-16 3 6 1 12-4 16z"/><path d="M128 19c3-7 1-13-4-16-3 6-1 12 4 16z"/>
        </g>
        <g fill="currentColor"><circle cx="120" cy="22" r="2.6"/><circle cx="30" cy="21" r="1.4"/><circle cx="210" cy="21" r="1.4"/></g>
      </symbol>
    </svg>`);
}

/* ---------- Cabecera fija que se encoge al hacer scroll ---------- */
function cabeceraFija() {
  const barra = $('.barra-superior');
  if (!barra) return;
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
  const mira = () => { pendiente = false; barra.classList.toggle('is-mini', scrollY > 40); };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(mira); } }, { passive: true });
  mira();
}

/* ---------- Desplegables del menú (Servicios, Idioma) ---------- */
function desplegables() {
  const todos = $$('.desplegable');
  const cierra = (d, devolver) => {
    const b = $('.desplegable__btn', d);
    b.setAttribute('aria-expanded', 'false');
    d.classList.remove('is-abierto');
    if (devolver) b.focus();
  };
  todos.forEach(d => {
    const b = $('.desplegable__btn', d);
    b.addEventListener('click', () => {
      const abrir = b.getAttribute('aria-expanded') !== 'true';
      todos.forEach(o => o !== d && cierra(o));
      b.setAttribute('aria-expanded', abrir);
      d.classList.toggle('is-abierto', abrir);
      if (abrir) $('a, button:not(.desplegable__btn)', $('.desplegable__menu', d))?.focus({ preventScroll: true });
    });
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && d.classList.contains('is-abierto')) { e.stopPropagation(); cierra(d, true); } });
    d.addEventListener('focusout', e => { if (!d.contains(e.relatedTarget)) cierra(d); });
  });
  document.addEventListener('pointerdown', e => todos.forEach(d => { if (!d.contains(e.target)) cierra(d); }));
}

/* ---------- Idioma ---------- */
function idioma() {
  $$('[data-lang="ca"]').forEach(b => b.addEventListener('click', () => {
    $$('.idioma__aviso').forEach(a => {
      a.textContent = 'Aviat en català';
      a.classList.add('is-visible');
      clearTimeout(a._t);
      a._t = setTimeout(() => a.classList.remove('is-visible'), 2400);
    });
  }));
}

/* ---------- Menú móvil: un panel que baja desde la barra ---------- */
function menuMovil() {
  const cabecera = $('.cabecera');
  const boton = $('.menu-btn');
  if (!cabecera || !boton) return;
  const servicios = $$('.desplegable--servicios .desplegable__menu a').map(a => `<li><a href="${a.getAttribute('href')}">${a.textContent}</a></li>`).join('');
  const sueltos = $$('.nav > a.nav__link').map(a => `<li><a class="menu-movil__grande" href="${a.getAttribute('href')}">${a.textContent}</a></li>`).join('');
  cabecera.insertAdjacentHTML('afterend', `
    <nav class="menu-movil" id="menu-movil" aria-label="Menú" hidden>
      <p class="menu-movil__grupo">Servicios</p>
      <ul class="menu-movil__servicios">${servicios}</ul>
      <ul class="menu-movil__lista">${sueltos}</ul>
      <div class="menu-movil__idioma" role="group" aria-label="Idioma">
        <button type="button" class="is-activo" aria-pressed="true">Castellano</button>
        <button type="button" data-lang="ca" aria-pressed="false">Català</button>
        <span class="idioma__aviso" role="status" aria-live="polite"></span>
      </div>
    </nav>`);
  const panel = $('#menu-movil');
  const abre = () => {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-abierto'));
    boton.setAttribute('aria-expanded', 'true');
    boton.setAttribute('aria-label', 'Cerrar el menú');
    document.body.classList.add('menu-abierto');
  };
  const cierra = devolver => {
    panel.classList.remove('is-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir el menú');
    document.body.classList.remove('menu-abierto');
    setTimeout(() => { if (!panel.classList.contains('is-abierto')) panel.hidden = true; }, 380);
    if (devolver) boton.focus();
  };
  boton.addEventListener('click', () => (boton.getAttribute('aria-expanded') === 'true' ? cierra() : abre()));
  panel.addEventListener('click', e => { if (e.target.closest('a')) cierra(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') cierra(true); });
  matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) cierra(); });
}

/* ---------- Cesta: un cajón lateral con un índice de libro ---------- */
const CLAVE = 'linaria-cesta';
let cesta = [];
let cajon, lista, btnCesta, nums;
const romano = n => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || n + 1;
const escapa = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cesta)); } catch (_) {} };

function pintaCesta() {
  lista.innerHTML = cesta.map((it, i) => `
    <li style="--i:${i}" data-id="${escapa(it.id)}">
      <p class="cajon__cap">Capítulo ${romano(i)}</p>
      <p class="cajon__linea"><span class="cajon__nombre">${escapa(it.nombre)}${it.cant > 1 ? ' ×' + it.cant : ''}</span><span class="cajon__puntos" aria-hidden="true"></span><span class="cajon__precio">${euros(it.precio * it.cant)} €${it.unico ? '' : '/mes'}</span></p>
      ${it.detalle ? `<p class="cajon__detalle">${escapa(it.detalle)}</p>` : ''}
      <button class="cajon__quitar" type="button">Quitar<span class="sr"> ${escapa(it.nombre)}</span></button>
    </li>`).join('');
  const total = cesta.reduce((s, it) => s + it.precio * it.cant, 0);
  const alMes = cesta.filter(it => !it.unico).reduce((s, it) => s + it.precio * it.cant, 0);
  const unaVez = total - alMes;
  $('.cajon__suma', cajon).textContent = euros(+total.toFixed(2)) + ' €';
  $('.cajon__desglose', cajon).textContent = alMes && unaVez
    ? `${euros(+alMes.toFixed(2))} € al mes + ${euros(+unaVez.toFixed(2))} € de pago único`
    : alMes ? 'al mes' : unaVez ? 'pago único' : '';
  const n = cesta.reduce((s, it) => s + it.cant, 0);
  nums.forEach(el => { el.textContent = n; });
  cajon.classList.toggle('tiene', cesta.length > 0);
}

let ultimoFoco = null;
function abreCesta() {
  if (cajon.open) return;
  ultimoFoco = document.activeElement;
  $('#bienvenida')?.open && $('#bienvenida').close();
  cajon.showModal();
  document.documentElement.classList.add('sin-scroll');
  requestAnimationFrame(() => cajon.classList.add('is-abierto'));
  btnCesta.forEach(b => b.setAttribute('aria-expanded', 'true'));
  $('.cajon__cerrar', cajon).focus({ preventScroll: true });
}
function cierraCesta() {
  if (!cajon.open) return;
  cajon.classList.remove('is-abierto');
  btnCesta.forEach(b => b.setAttribute('aria-expanded', 'false'));
  document.documentElement.classList.remove('sin-scroll');
  setTimeout(() => { cajon.close(); ultimoFoco?.focus?.({ preventScroll: true }); }, reduce ? 0 : 420);
}

function montaCesta() {
  btnCesta = $$('.cesta__btn');
  nums = $$('.cesta__num');
  if (!btnCesta.length) return;
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="cajon" id="cesta" aria-labelledby="cesta-titulo"><div class="cajon__in">
      <header class="cajon__cabeza">
        <p class="antetitulo">Tu cesta</p>
        <h2 class="cajon__titulo" id="cesta-titulo">Índice</h2>
        <button class="cajon__cerrar" type="button" aria-label="Cerrar la cesta">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 4.2c4 3.6 7.4 7.4 11 11.4M15.6 4.4c-3.9 3.7-7.3 7.4-11.2 11.2"/></svg>
        </button>
      </header>
      <ol class="cajon__lista"></ol>
      <div class="cajon__vacio">
        <svg class="cajon__ramita" viewBox="0 0 240 40" aria-hidden="true"><use href="#ramita"/></svg>
        <p>Esta historia está por escribir.</p>
        <p class="cajon__script">Escoge tus cartas para sumergirte en el mundo.</p>
        <a class="boton" href="${aRecetario()}">Elegir mis cartas</a>
      </div>
      <footer class="cajon__pie">
        <p class="cajon__total"><span>Precio final</span><span class="cajon__puntos" aria-hidden="true"></span><span class="cajon__suma">0 €</span></p>
        <p class="cajon__desglose"></p>
        <p class="cajon__envio">Gastos de envío e impuestos incluidos</p>
        <a class="boton boton--ancho" href="#pagar">Pasar página</a>
      </footer>
    </div></dialog>`);
  cajon = $('#cesta');
  lista = $('.cajon__lista', cajon);

  try { cesta = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (_) { cesta = []; }
  // fuera lo que se guardó con el formato anterior (precios viejos y la carta por encargo, ya retirada)
  const antes = cesta.length;
  cesta = cesta.filter(it => it && it.v === 2);
  if (cesta.length !== antes) guarda();
  pintaCesta();

  btnCesta.forEach(b => b.addEventListener('click', () => (cajon.open ? cierraCesta() : abreCesta())));
  $('.cajon__cerrar', cajon).addEventListener('click', cierraCesta);
  cajon.addEventListener('cancel', e => { e.preventDefault(); cierraCesta(); });
  // clic fuera del panel (en el fondo oscuro del propio dialog)
  cajon.addEventListener('click', e => { if (e.target === cajon) cierraCesta(); });
  cajon.addEventListener('click', e => { if (e.target.closest('.cajon__vacio a')) cierraCesta(); });
  lista.addEventListener('click', e => {
    const b = e.target.closest('.cajon__quitar');
    if (!b) return;
    const li = b.closest('li');
    li.classList.add('is-sale');
    setTimeout(() => {
      cesta = cesta.filter(it => it.id !== li.dataset.id);
      guarda(); pintaCesta();
      (lista.querySelector('.cajon__quitar') || $('.cajon__cerrar', cajon)).focus({ preventScroll: true });
    }, reduce ? 0 : 380);
  });
  // si otra pestaña cambia la cesta, esta se entera
  addEventListener('storage', e => { if (e.key === CLAVE) { try { cesta = JSON.parse(e.newValue) || []; } catch (_) { cesta = []; } pintaCesta(); } });
}

const salta = () => nums.forEach(n => { n.classList.remove('is-salta'); void n.offsetWidth; n.classList.add('is-salta'); });
function vuela(desde, fin) {
  const destino = btnCesta.find(b => b.offsetParent);
  if (reduce || !desde || !destino) return fin();
  const a = desde.getBoundingClientRect(), b = destino.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
  const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const el = document.createElement('span');
  el.className = 'vuela';
  document.body.append(el);
  const altura = Math.min(y0, y1) - 120;
  const anim = el.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(.4) rotate(0deg)`, opacity: 0 },
    { transform: `translate(${x0}px, ${y0 - 30}px) scale(1.15) rotate(-10deg)`, opacity: 1, offset: 0.15 },
    { transform: `translate(${(x0 + x1) / 2}px, ${altura}px) scale(1) rotate(12deg)`, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1}px) scale(.35) rotate(-4deg)`, opacity: 0.9 },
  ], { duration: 900, easing: 'cubic-bezier(.45,.05,.4,1)' });
  anim.onfinish = () => { el.remove(); fin(); };
}

/**
 * Añade un artículo a la cesta y abre el cajón.
 * item: { id, nombre, precio, unico?, detalle?, cumple? } — las suscripciones (id "club-…") son excluyentes.
 */
export function anadirACesta(item, desde) {
  const p = { ...item, v: 2 };
  const ya = cesta.find(it => it.id === p.id);
  if (ya) { if (p.unico) ya.cant++; else Object.assign(ya, p, { cant: 1 }); }
  else {
    if (p.id.startsWith('club-')) cesta = cesta.filter(it => !it.id.startsWith('club-'));
    cesta.push({ ...p, cant: 1 });
  }
  guarda();
  vuela(desde, () => { pintaCesta(); salta(); abreCesta(); });
}

/* ---------- Carta de bienvenida (una sola vez) ---------- */
function bienvenida() {
  const CLAVE_B = 'linaria-bienvenida';
  let vista = false;
  try { vista = !!localStorage.getItem(CLAVE_B); } catch (_) { vista = true; }
  if (vista || !('HTMLDialogElement' in window)) return;
  const plazas = PLAZAS_LIBRES > 0 ? `Quedan <strong>${PLAZAS_LIBRES}</strong> plazas este mes.` : 'Este mes ya no quedan plazas: puedes reservar la tuya para el siguiente.';
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="bienvenida" id="bienvenida" aria-labelledby="bienvenida-titulo">
      <div class="bienvenida__carta">
        <button class="bienvenida__cerrar" type="button" aria-label="Cerrar">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 4.2c4 3.6 7.4 7.4 11 11.4M15.6 4.4c-3.9 3.7-7.3 7.4-11.2 11.2"/></svg>
        </button>
        <svg class="bienvenida__lacre" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3c5 0 6 3 10 4s7 4 6 9 2 7 0 11-6 5-9 8-8 3-12 0-8-2-10-7-3-7-1-11 2-8 7-10 4-4 9-4z"/><path class="bienvenida__l" d="M20 28s-8-5-8-10a4.2 4.2 0 0 1 8-2 4.2 4.2 0 0 1 8 2c0 5-8 10-8 10z"/></svg>
        <p class="antetitulo">Mail Club · Linaria Studio</p>
        <h2 class="bienvenida__titulo" id="bienvenida-titulo" tabindex="-1" autofocus>Suscríbete y recibe <em>cartas desde el bosque</em></h2>
        <svg class="bienvenida__ramita" viewBox="0 0 240 40" aria-hidden="true"><use href="#ramita"/></svg>
        <p class="bienvenida__texto">Una vez al mes, una bruja o una dríade te escriben a mano desde su rincón del bosque. ${plazas}</p>
        <div class="bienvenida__botones">
          <a class="boton" href="${aRecetario()}" data-cierra>Elegir mis cartas</a>
          <button class="enlace" type="button" data-cierra>Ahora no</button>
        </div>
      </div>
    </dialog>`);
  const d = $('#bienvenida');
  const cierra = () => {
    d.classList.remove('is-abierto');
    setTimeout(() => d.close(), reduce ? 0 : 320);
  };
  d.addEventListener('cancel', e => { e.preventDefault(); cierra(); });
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-cierra], .bienvenida__cerrar')) cierra(); });
  setTimeout(() => {
    if (cajon?.open || document.body.classList.contains('menu-abierto')) return; // no interrumpir
    try { localStorage.setItem(CLAVE_B, String(Date.now())); } catch (_) {}
    d.showModal();
    requestAnimationFrame(() => d.classList.add('is-abierto'));
  }, 4500);
}

/* ---------- Arranque ---------- */
let iniciado = false;
export function iniciarComun() {
  if (iniciado) return;
  iniciado = true;
  filtrosDeTinta();
  cabeceraFija();
  desplegables();
  menuMovil();
  idioma();
  montaCesta();
  bienvenida();
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('listo')));
}
iniciarComun();
