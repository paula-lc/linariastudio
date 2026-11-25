// La postal de contacto: desplegable accesible del asunto, validación y envío.
// Se usa en la portada, en Eventos y en Editorial.
import { FORMULARIO_URL, MESES } from './config.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- Desplegable del asunto (lista accesible con teclado) ---------- */
function listas() {
  $$('.lista').forEach(lista => {
    const boton = $('.lista__boton', lista), caja = $('.lista__opciones', lista), valor = $('.lista__valor', lista);
    const oculto = $('input[type=hidden]', lista), ops = $$('[role=option]', caja);
    const inicial = Math.max(0, ops.findIndex(o => o.getAttribute('aria-selected') === 'true'));
    let activa = 0;
    const marca = i => { activa = (i + ops.length) % ops.length; ops.forEach((o, k) => o.classList.toggle('is-activa', k === activa)); caja.setAttribute('aria-activedescendant', ops[activa].id); };
    const abre = () => { caja.hidden = false; requestAnimationFrame(() => lista.classList.add('is-abierta')); boton.setAttribute('aria-expanded', 'true'); marca(ops.findIndex(o => o.getAttribute('aria-selected') === 'true')); caja.focus(); };
    const cierra = (devolver = true) => { lista.classList.remove('is-abierta'); boton.setAttribute('aria-expanded', 'false'); setTimeout(() => { if (!lista.classList.contains('is-abierta')) caja.hidden = true; }, 260); if (devolver) boton.focus(); };
    const elige = (i, devolver = true) => { ops.forEach((o, k) => o.setAttribute('aria-selected', k === i)); valor.textContent = oculto.value = ops[i].dataset.valor; cierra(devolver); };
    boton.addEventListener('click', () => (lista.classList.contains('is-abierta') ? cierra() : abre()));
    boton.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); abre(); } });
    ops.forEach((o, i) => { o.addEventListener('click', () => elige(i)); o.addEventListener('pointermove', () => marca(i)); });
    caja.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); marca(activa + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marca(activa - 1); }
      else if (e.key === 'Home') { e.preventDefault(); marca(0); }
      else if (e.key === 'End') { e.preventDefault(); marca(ops.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elige(activa); }
      else if (e.key === 'Escape') { e.preventDefault(); cierra(); }
      else if (e.key === 'Tab') cierra(false);
    });
    document.addEventListener('pointerdown', e => { if (lista.classList.contains('is-abierta') && !lista.contains(e.target)) cierra(false); });
    // al reiniciar el formulario vuelve al asunto con el que nació la página
    lista.closest('form')?.addEventListener('reset', () => setTimeout(() => elige(inicial, false), 0));
  });
}

/* ---------- La postal ---------- */
function postal() {
  const form = $('#postal');
  if (!form) return;
  const nota = $('#postal-nota'), nombre = $('#postal-nombre'), email = $('#postal-email');
  const firma = $('.postal__firma'), fecha = $('.postal__fecha'), hecho = $('.postal__hecho'), marco = $('.postal__marco');
  const enviar = $('.postal__enviar .boton', form);
  const ponFecha = () => { const d = new Date(); fecha.textContent = `A ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };
  ponFecha();
  // la firma de la carta se escribe sola con el nombre del remite
  nombre.addEventListener('input', () => { firma.textContent = nombre.value.trim(); });
  const campos = [[nota, 'error-nota', v => v.trim()], [nombre, 'error-nombre', v => v.trim()], [email, 'error-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())]];
  campos.forEach(([el, id]) => el.addEventListener('input', () => { $('#' + id).hidden = true; el.removeAttribute('aria-invalid'); }));

  const sella = texto => {
    $('.postal__gracias').textContent = texto;
    marco.hidden = true;
    hecho.hidden = false;
    $('.postal__estampa').classList.remove('is-estampa'); void hecho.offsetWidth; $('.postal__estampa').classList.add('is-estampa');
    $('[data-otra]', form).focus();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let primero = null;
    campos.forEach(([el, id, ok]) => {
      const bien = !!ok(el.value);
      $('#' + id).hidden = bien;
      el.toggleAttribute('aria-invalid', !bien);
      if (!bien && !primero) primero = el;
    });
    if (primero) { primero.focus(); return; }

    const gracias = `Gracias, ${nombre.value.trim()}. Te contestaremos a ${email.value.trim()}.`;
    const aviso = $('.postal__aviso');
    // sin servicio de formularios configurado, la postal se queda en modo de prueba
    if (!FORMULARIO_URL) { aviso.hidden = false; sella(gracias); return; }

    enviar.disabled = true;
    enviar.textContent = 'Sellando…';
    try {
      const r = await fetch(FORMULARIO_URL, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      aviso.hidden = true;
      sella(gracias);
    } catch (_) {
      $('#error-envio').hidden = false;
    } finally {
      enviar.disabled = false;
      enviar.textContent = 'Sellar y enviar';
    }
  });
  $('[data-otra]', form).addEventListener('click', () => {
    form.reset(); firma.textContent = ''; ponFecha();
    $('#error-envio').hidden = true;
    hecho.hidden = true; marco.hidden = false; nota.focus();
  });
}

listas();
postal();
