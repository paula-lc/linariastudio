/* Linaria Studio · interacciones de la portada */
import { anadirACesta } from '../src/comun.js';
import { PLAZAS_LIBRES, REGALO_MESES, MAESTRAS, MESES, precioMensual, precioRegalo, euros } from '../src/config.js';

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Entrada ---------- */
  // las piezas de "Lo que cabe en un sobre" reutilizan las del sobre de la portada
  $$('[data-clona]').forEach(d => { const o = $(d.dataset.clona); if (o) d.append(o.cloneNode(true)); });

  /* ---------- El sobre ---------- */
  const escena = $('.escena');
  const sobre = $('.sobre');
  const CENTRO = { x: 180, y: 162 }; // centro del sobre cerrado, en coordenadas de la escena

  const objetos = $$('.objeto', escena);
  objetos.forEach(o => {
    const { x, y, w, h, r, d } = o.dataset;
    Object.assign(o.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    o.style.setProperty('--r', r + 'deg');
    o.style.setProperty('--d', d);
    o.style.setProperty('--cx', (CENTRO.x - (+x + w / 2)) + 'px');
    o.style.setProperty('--cy', (CENTRO.y - (+y + h / 2)) + 'px');
  });
  $$('.etiqueta', escena).forEach((e, i) => e.style.setProperty('--n', i));

  const estado = s => {
    escena.dataset.estado = s;
    const abierto = s === 'abierto';
    sobre.setAttribute('aria-expanded', abierto);
    sobre.setAttribute('aria-label', abierto ? 'Cerrar el sobre' : 'Abrir el sobre');
    if (!abierto) {
      objetos.forEach(o => { o.querySelector('.objeto__in').style.cssText = ''; o.classList.remove('is-arriba'); o.style.zIndex = ''; });
      $$('.etiqueta', escena).forEach(et => { et.style.removeProperty('--dx'); et.style.removeProperty('--dy'); et.style.zIndex = ''; });
      quitarFoco();
    }
  };
  sobre.addEventListener('click', () => estado(escena.dataset.estado === 'abierto' ? 'cerrado' : 'abierto'));

  // Si nadie lo abre, se entreabre solo (al hacer scroll o tras un rato)
  let asomo = false;
  const asomar = () => {
    if (asomo || escena.dataset.estado !== 'cerrado') return;
    asomo = true;
    estado('asomado');
  };
  // Al cargar, el sobre siempre está cerrado. Solo se entreabre cuando la persona
  // empieza a moverse por la página (no con el scroll que restaura el navegador).
  escena.dataset.estado = 'cerrado';
  if (!reduce) {
    const alMoverse = () => { if (performance.now() > 1500) asomar(); };
    ['wheel', 'touchmove', 'keydown'].forEach(ev => addEventListener(ev, alMoverse, { passive: true }));
    setTimeout(asomar, 8000);
  }

  // Etiquetas <-> objetos
  const parejas = tag => [$(`.objeto[data-tag="${tag}"]`, escena), $(`.etiqueta[data-tag="${tag}"]`, escena)];
  const quitarFoco = () => $$('.is-foco', escena).forEach(e => e.classList.remove('is-foco'));
  const foco = tag => { quitarFoco(); parejas(tag).forEach(e => e && e.classList.add('is-foco')); };
  $$('.etiqueta', escena).forEach(el => {
    el.addEventListener('pointerenter', e => e.pointerType === 'mouse' && foco(el.dataset.tag));
    el.addEventListener('pointerleave', e => e.pointerType === 'mouse' && quitarFoco());
  });
  $$('.etiqueta', escena).forEach(et => {
    et.addEventListener('click', () => et.classList.contains('is-foco') ? quitarFoco() : foco(et.dataset.tag));
    et.addEventListener('focus', () => foco(et.dataset.tag));
    et.addEventListener('blur', quitarFoco);
  });

  // Arrastrar las piezas, con inclinación según la velocidad
  // Todas las piezas se arrastran; la etiqueta viaja con su pieza (y arrastrar la etiqueta mueve la pieza)
  let z = 20;
  objetos.forEach(o => {
    const inn = o.querySelector('.objeto__in');
    const et = o.dataset.tag ? $(`.etiqueta[data-tag="${o.dataset.tag}"]`, escena) : null;
    let ini = null, ultimo = null, movido = false;

    const empieza = (e, asa) => {
      if (escena.dataset.estado !== 'abierto' || e.button > 0) return;
      e.preventDefault();
      asa.setPointerCapture(e.pointerId);
      const dx = parseFloat(inn.style.getPropertyValue('--dx')) || 0;
      const dy = parseFloat(inn.style.getPropertyValue('--dy')) || 0;
      ini = { x: e.clientX - dx, y: e.clientY - dy, x0: e.clientX, y0: e.clientY };
      ultimo = { x: e.clientX, t: performance.now() };
      movido = false;
      $$('.is-arriba', escena).forEach(x => x.classList.remove('is-arriba'));
      o.classList.add('is-arriba', 'is-arrastra');
      o.style.zIndex = z += 2;
      if (et) { et.style.zIndex = z + 1; et.classList.add('is-arrastra'); }
      inn.style.transition = 'rotate .5s var(--muelle), scale .4s var(--muelle)';
    };
    const mueve = e => {
      if (!ini) return;
      const esc = parseFloat(getComputedStyle(escena).scale) || 1;
      const dx = (e.clientX - ini.x) / esc + 'px', dy = (e.clientY - ini.y) / esc + 'px';
      inn.style.setProperty('--dx', dx); inn.style.setProperty('--dy', dy);
      if (et) { et.style.setProperty('--dx', dx); et.style.setProperty('--dy', dy); }
      if (Math.hypot(e.clientX - ini.x0, e.clientY - ini.y0) > 4) movido = true;
      const now = performance.now();
      const v = (e.clientX - ultimo.x) / Math.max(16, now - ultimo.t);
      inn.style.setProperty('--t', Math.max(-14, Math.min(14, v * 18)) + 'deg');
      ultimo = { x: e.clientX, t: now };
    };
    const suelta = () => {
      if (!ini) return;
      ini = null;
      o.classList.remove('is-arrastra');
      if (et) et.classList.remove('is-arrastra');
      inn.style.transition = '';
      inn.style.setProperty('--t', '0deg');
    };
    [inn, et].filter(Boolean).forEach(asa => {
      asa.addEventListener('pointerdown', e => empieza(e, asa));
      asa.addEventListener('pointermove', mueve);
      asa.addEventListener('pointerup', suelta);
      asa.addEventListener('pointercancel', suelta);
    });
    // un arrastre de la etiqueta no cuenta como clic
    if (et) et.addEventListener('click', e => { if (movido) { e.stopImmediatePropagation(); movido = false; } }, true);
  });

  // La escena se encoge en pantallas estrechas
  const ajusta = () => {
    const ancho = escena.parentElement.clientWidth;
    const e = Math.min(1.12, Math.max(.7, ancho / 360));
    escena.style.setProperty('--escala', e);
    escena.style.marginBottom = (310 * (e - 1)) + 'px';
  };
  ajusta();
  addEventListener('resize', ajusta);

  /* ---------- El recetario: configurador de la suscripción ---------- */
  const form = $('#suscripcion');
  if (form) {
    const recetario = $('#recetario');
    const radios = $$('input[name="maestra"]');
    const regalo = $('#para-regalar');
    const cajaMeses = $('.regalo__meses');
    const cumple = $('#cumple');
    const cifra = $('.precio__cifra');
    const unidad = $('.precio__unidad');
    const resumen = $('.receta__maestra');
    const errMaestra = $('#error-maestra'), errCumple = $('#error-cumple');
    const completo = PLAZAS_LIBRES <= 0;

    // plazas: el número vive en src/config.js
    $$('.plazas__num').forEach(n => { n.textContent = PLAZAS_LIBRES; });
    recetario.classList.toggle('is-completo', completo);
    if (completo) $('.receta__anadir').textContent = 'Reservar mi plaza';

    // los meses del regalo salen de la configuración (3, 6, 12)
    $$('input[name="meses"]').forEach(r => { if (!REGALO_MESES.includes(+r.value)) r.closest('label').remove(); });

    const plan = () => radios.find(r => r.checked)?.value || '';
    const meses = () => +($('input[name="meses"]:checked')?.value || REGALO_MESES[0]);

    const actualiza = (animar = true) => {
      const p = plan();
      recetario.dataset.plan = p;
      const esRegalo = regalo.checked;
      cajaMeses.hidden = !esRegalo;
      recetario.classList.toggle('es-regalo', esRegalo);
      const mensual = precioMensual(p || 'bruja');
      const precio = esRegalo ? precioRegalo(mensual, meses()) : mensual;
      const texto = euros(precio);
      if (cifra.textContent !== texto) {
        cifra.textContent = texto;
        if (animar) { cifra.classList.remove('is-cambia'); void cifra.offsetWidth; cifra.classList.add('is-cambia'); }
      }
      unidad.textContent = esRegalo ? `pago único · ${meses()} meses` : 'al mes';
      resumen.textContent = p ? MAESTRAS[p].nombre : 'aún sin elegir';
      resumen.classList.toggle('is-vacio', !p);
      if (p) errMaestra.hidden = true;
    };
    radios.forEach(r => r.addEventListener('change', () => {
      actualiza();
      recetario.classList.remove('is-remueve'); void recetario.offsetWidth; recetario.classList.add('is-remueve');
    }));
    regalo.addEventListener('change', () => actualiza());
    $$('input[name="meses"]').forEach(r => r.addEventListener('change', () => actualiza()));
    cumple.addEventListener('change', () => { if (cumple.value) { errCumple.hidden = true; cumple.removeAttribute('aria-invalid'); } });
    actualiza(false);

    // "Elegir sus cartas" en las fichas: marca a la maestra y baja al recetario
    $$('[data-elegir]').forEach(a => a.addEventListener('click', () => {
      const r = radios.find(x => x.value === a.dataset.elegir);
      if (r) { r.checked = true; r.dispatchEvent(new Event('change')); }
    }));

    form.addEventListener('submit', e => {
      e.preventDefault();
      const p = plan();
      errMaestra.hidden = !!p;
      errCumple.hidden = !!cumple.value;
      cumple.toggleAttribute('aria-invalid', !cumple.value);
      if (!p) { radios[0].focus(); radios[0].closest('.maestras').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); return; }
      if (!cumple.value) { cumple.focus(); return; }

      const mes = MESES[+cumple.value - 1];
      const mensual = precioMensual(p);
      const quien = MAESTRAS[p].nombre;
      const reserva = completo ? ' · reserva para el mes que viene' : '';
      const item = regalo.checked
        ? { id: `regalo-${p}-${meses()}-${cumple.value}`, nombre: `Regalo · ${meses()} meses · ${quien}`, precio: precioRegalo(mensual, meses()), unico: true, plan: p, meses: meses(), cumple: mes, detalle: `Cumpleaños de quien lo recibe: ${mes}${reserva}` }
        : { id: `club-${p}`, nombre: `Mail Club · ${quien}`, precio: mensual, plan: p, cumple: mes, detalle: `Tu cumpleaños: ${mes}${reserva}` };
      anadirACesta(item, $('.receta__anadir'));
    });
  }

  /* ---------- Revelado al hacer scroll ---------- */
  $$('.titulo').forEach(t => { t.innerHTML = '<span class="titulo__texto">' + t.innerHTML + '</span>'; });
  const grupos = new Map();
  $$('.revela').forEach(el => {
    const padre = el.parentElement;
    const i = grupos.get(padre) || 0;
    el.style.setProperty('--i', i);
    grupos.set(padre, i + 1);
  });
  const io = new IntersectionObserver(entradas => entradas.forEach(en => {
    if (en.isIntersecting) { en.target.classList.remove('espera'); en.target.classList.add('is-visto'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  // solo se esconde lo que todavía está por debajo de la pantalla
  if (!reduce) $$('.revela').forEach(el => {
    if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('espera'); io.observe(el); }
    else el.classList.add('is-visto');
  });
  if (reduce) $$('.revela').forEach(el => el.classList.add('is-visto'));

  /* ---------- El camino de una carta: el búho cruza el mapa con el scroll ---------- */
  const camino = $('#camino'), pista = $('.camino__pista'), ruta = $('#ruta'), buho = $('#buho');
  if (camino && ruta && buho) {
    const largo = ruta.getTotalLength();
    const senal = $('#senal'), chispa = $('#chispa');
    const largoSenal = senal ? senal.getTotalLength() : 0;
    const pasos = $$('.historia__pasos li');
    let pedido = false, pasoActual = -1, pActual = 0, manual = false, anim = null;
    const pinta = p => {
      pActual = p;
      // 0–0.14 te apuntas · 0.14–0.3 se prepara en el castillo · 0.3–0.9 vuela · 0.9–1 llega
      const t = Math.max(0, Math.min(1, (p - .3) / .6));
      const pt = ruta.getPointAtLength(t * largo);
      const pt2 = ruta.getPointAtLength(Math.min(largo, t * largo + 3));
      const ang = t > 0 && t < 1 ? Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI * .35 : 0;
      let dy = 0;
      if (p >= .14 && p < .3) dy = -Math.abs(Math.sin((p - .14) / .16 * Math.PI * 2)) * 10; // salta de impaciencia en la torre
      if (p >= .9) dy = Math.sin(Math.min(1, (p - .9) / .1) * Math.PI) * -12;              // aterriza junto al buzón
      buho.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${(pt.y + dy).toFixed(1)}) rotate(${ang.toFixed(1)}) scale(1.25)`);
      camino.classList.toggle('is-vuela', t > 0 && t < 1);
      // la chispa: recorre la señal durante el primer paso
      if (senal) {
        const sp = Math.max(0, Math.min(1, p / .13));
        senal.style.strokeDasharray = largoSenal;
        senal.style.strokeDashoffset = largoSenal * (1 - sp);
        const q = senal.getPointAtLength(sp * largoSenal);
        chispa.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
      }
      const paso = p < .14 ? 0 : p < .3 ? 1 : p < .9 ? 2 : 3;
      if (paso !== pasoActual) {
        pasoActual = paso;
        camino.dataset.paso = paso;
        pasos.forEach((li, i) => { li.classList.toggle('is-activo', i === paso); li.setAttribute('aria-pressed', i === paso); });
      }
    };
    // con el scroll: de cuando el mapa entra por abajo a cuando su centro sube al 30 %
    const avanza = () => {
      pedido = false;
      if (manual) return;
      const r = $('.historia__mapa').getBoundingClientRect();
      const centro = r.top + r.height / 2;
      pinta(reduce ? 1 : Math.max(0, Math.min(1, (innerHeight * .85 - centro) / (innerHeight * .55))));
    };
    // con un clic en un paso: la historia viaja hasta ese momento
    // con un clic en un paso: se reproduce entero el tramo de ese paso
    const TRAMOS = [[0, .139], [.14, .299], [.3, .899], [.9, 1]];
    const viaja = i => {
      manual = true;
      if (anim) cancelAnimationFrame(anim);
      const [desde, hasta] = TRAMOS[i];
      if (reduce) return pinta(hasta);
      const dur = 1500 + (hasta - desde) * 4000, t0 = performance.now();
      const suave = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      pinta(desde);
      const paso = now => {
        const k = Math.min(1, (now - t0) / dur);
        pinta(desde + (hasta - desde) * suave(k));
        if (k < 1) anim = requestAnimationFrame(paso);
      };
      anim = requestAnimationFrame(paso);
    };
    pasos.forEach((li, i) => {
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.addEventListener('click', () => viaja(i));
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viaja(i); } });
    });
    // al volver a hacer scroll, la historia vuelve a seguirlo
    ['wheel', 'touchmove'].forEach(ev => addEventListener(ev, () => { if (manual) { manual = false; if (anim) cancelAnimationFrame(anim); } }, { passive: true }));
    addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(avanza); } }, { passive: true });
    addEventListener('resize', avanza);
    avanza();
  }

  /* ---------- Preguntas: abrir y cerrar con muelle ---------- */
  $$('.acordeon details').forEach(d => {
    const sum = d.querySelector('summary'), r = d.querySelector('.acordeon__r');
    sum.addEventListener('click', e => {
      if (reduce) return;
      e.preventDefault();
      if (d._anim) d._anim.cancel();
      if (!d.open) {
        d.open = true;
        const h = r.scrollHeight;
        d._anim = r.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }],
          { duration: 700, easing: getComputedStyle(document.documentElement).getPropertyValue('--suave').trim() || 'ease' });
      } else {
        const h = r.scrollHeight;
        d._anim = r.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' });
        d._anim.onfinish = () => { d.open = false; };
      }
    });
  });

  /* ---------- Desplegable de la postal (lista accesible con teclado) ---------- */
  $$('.lista').forEach(lista => {
    const boton = $('.lista__boton', lista), caja = $('.lista__opciones', lista), valor = $('.lista__valor', lista);
    const oculto = $('input[type=hidden]', lista), ops = $$('[role=option]', caja);
    let activa = 0;
    const marca = i => { activa = (i + ops.length) % ops.length; ops.forEach((o, k) => o.classList.toggle('is-activa', k === activa)); caja.setAttribute('aria-activedescendant', ops[activa].id); };
    const abre = () => { caja.hidden = false; requestAnimationFrame(() => lista.classList.add('is-abierta')); boton.setAttribute('aria-expanded', 'true'); marca(ops.findIndex(o => o.getAttribute('aria-selected') === 'true')); caja.focus(); };
    const cierra = (devolver = true) => { lista.classList.remove('is-abierta'); boton.setAttribute('aria-expanded', 'false'); setTimeout(() => { if (!lista.classList.contains('is-abierta')) caja.hidden = true; }, 260); if (devolver) boton.focus(); };
    const elige = i => { ops.forEach((o, k) => o.setAttribute('aria-selected', k === i)); valor.textContent = oculto.value = ops[i].dataset.valor; cierra(); };
    boton.addEventListener('click', () => lista.classList.contains('is-abierta') ? cierra() : abre());
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
    lista.closest('form')?.addEventListener('reset', () => setTimeout(() => elige(0), 0));
  });

  /* ---------- Postal de contacto ---------- */
  const postal = $('#postal');
  if (postal) {
    const nota = $('#postal-nota'), nombre = $('#postal-nombre'), email = $('#postal-email');
    const firma = $('.postal__firma'), fecha = $('.postal__fecha'), hecho = $('.postal__hecho'), marco = $('.postal__marco');
    const ponFecha = () => { const d = new Date(); fecha.textContent = `A ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };
    ponFecha();
    // la firma de la carta se escribe sola con el nombre del remite
    nombre.addEventListener('input', () => { firma.textContent = nombre.value.trim(); });
    const campos = [[nota, 'error-nota', v => v.trim()], [nombre, 'error-nombre', v => v.trim()], [email, 'error-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())]];
    campos.forEach(([el, id]) => el.addEventListener('input', () => { $('#' + id).hidden = true; el.removeAttribute('aria-invalid'); }));
    postal.addEventListener('submit', e => {
      e.preventDefault();
      let primero = null;
      campos.forEach(([el, id, ok]) => {
        const bien = !!ok(el.value);
        $('#' + id).hidden = bien;
        el.toggleAttribute('aria-invalid', !bien);
        if (!bien && !primero) primero = el;
      });
      if (primero) { primero.focus(); return; }
      // TODO: conectar con el servicio de formularios (Formspree, Netlify Forms…)
      $('.postal__gracias').textContent = `Gracias, ${nombre.value.trim()}. Te contestaremos a ${email.value.trim()}.`;
      marco.hidden = true;
      hecho.hidden = false;
      $('.postal__estampa').classList.remove('is-estampa'); void hecho.offsetWidth; $('.postal__estampa').classList.add('is-estampa');
      $('[data-otra]', postal).focus();
    });
    $('[data-otra]', postal).addEventListener('click', () => {
      postal.reset(); firma.textContent = ''; ponFecha();
      hecho.hidden = true; marco.hidden = false; nota.focus();
    });
  }

})();
