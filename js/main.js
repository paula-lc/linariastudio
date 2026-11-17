/* Linaria Studio · interacciones */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Entrada ---------- */
  // las piezas de "Lo que cabe en un sobre" reutilizan las del sobre de la portada
  $$('[data-clona]').forEach(d => { const o = $(d.dataset.clona); if (o) d.append(o.cloneNode(true)); });
  $$('.lema__palabra, .lema__script').forEach((el, i) => el.style.setProperty('--w', i));
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('listo')));

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
  const abrir = () => estado('abierto');
  sobre.addEventListener('click', () => estado(escena.dataset.estado === 'abierto' ? 'cerrado' : 'abierto'));
  $('.apertura__dentro').addEventListener('click', () => {
    abrir();
    escena.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

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

  /* ---------- Lo que cabe en un sobre: texto y piezas se señalan entre sí ---------- */
  const piezas = $$('.sobre-contenido [data-pieza]');
  const enfoca = k => piezas.forEach(el => el.classList.toggle('is-foco', el.dataset.pieza === k));
  piezas.forEach(el => {
    el.addEventListener('pointerenter', () => enfoca(el.dataset.pieza));
    el.addEventListener('pointerleave', () => enfoca(''));
  });

  /* ---------- Idioma ---------- */
  const aviso = $('.idioma__aviso');
  $('[data-lang="ca"]').addEventListener('click', () => {
    aviso.textContent = 'Aviat en català';
    aviso.classList.add('is-visible');
    clearTimeout(aviso._t);
    aviso._t = setTimeout(() => aviso.classList.remove('is-visible'), 2200);
  });

  /* ---------- Plan del Mail Club ---------- */
  const PLANES = {
    bruja: { id: 'club-bruja', nombre: 'Mail Club · la bruja', precio: 13 },
    driade: { id: 'club-driade', nombre: 'Mail Club · la dríade', precio: 13 },
    ambas: { id: 'club-ambas', nombre: 'Mail Club · las dos', precio: +(26 * .88).toFixed(2) },
  };
  const EXTRAS = {
    regalo: { id: 'regalo', nombre: 'Regalo · 3 meses', precio: 36, unico: true },
    encargo: { id: 'encargo', nombre: 'Carta por encargo', precio: 65, unico: true },
  };
  let plan = '';
  const cifra = $('.plan__cifra');
  const euros = n => n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  // se puede elegir una carta o las dos; con las dos se aplica el descuento
  const elegidas = new Set();
  $$('.plan__elige [role="checkbox"]').forEach(b => {
    b.addEventListener('click', () => {
      const q = b.dataset.quien;
      elegidas.has(q) ? elegidas.delete(q) : elegidas.add(q);
      b.setAttribute('aria-checked', elegidas.has(q));
      plan = elegidas.size === 2 ? 'ambas' : ([...elegidas][0] || '');
      const pl = $('.plan');
      pl.dataset.elegido = plan ? 'si' : 'no';
      pl.dataset.plan = plan;
      if (!plan) return;
      pl.classList.remove('is-remueve'); void pl.offsetWidth; pl.classList.add('is-remueve');
      const nuevo = euros(PLANES[plan].precio);
      if (cifra.textContent !== nuevo) {
        cifra.textContent = nuevo;
        cifra.classList.remove('is-cambia'); void cifra.offsetWidth; cifra.classList.add('is-cambia');
      }
    });
  });

  /* ---------- Cesta (índice) ---------- */
  const indice = $('#indice');
  const btnCesta = $('.cesta__btn');
  const num = $('.cesta__num');
  const lista = $('.indice__lista');
  let cesta = [];
  try { cesta = JSON.parse(localStorage.getItem('linaria-cesta')) || []; } catch (_) {}
  const guarda = () => { try { localStorage.setItem('linaria-cesta', JSON.stringify(cesta)); } catch (_) {} };
  const romano = n => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || n + 1;

  const pinta = () => {
    lista.innerHTML = cesta.map((it, i) => `
      <li style="--i:${i}" data-id="${it.id}">
        <p class="indice__cap">Capítulo ${romano(i)}</p>
        <p class="indice__linea"><span class="nombre">${it.nombre}${it.cant > 1 ? ' ×' + it.cant : ''}</span><span class="indice__puntos"></span><span class="precio">${euros(it.precio * it.cant)} €${it.unico ? '' : '/mes'}</span><button class="indice__quitar" type="button" aria-label="Quitar ${it.nombre}">×</button></p>
      </li>`).join('');
    const total = cesta.reduce((s, it) => s + it.precio * it.cant, 0);
    const alMes = cesta.filter(it => !it.unico).reduce((s, it) => s + it.precio * it.cant, 0);
    const unaVez = total - alMes;
    $('.indice__suma').textContent = euros(+total.toFixed(2)) + ' €';
    $('.indice__desglose').textContent = alMes && unaVez
      ? `${euros(+alMes.toFixed(2))} € al mes + ${euros(+unaVez.toFixed(2))} € de pago único`
      : alMes ? 'al mes, envío incluido' : unaVez ? 'pago único, envío incluido' : '';
    num.textContent = cesta.reduce((s, it) => s + it.cant, 0);
    indice.classList.toggle('tiene', cesta.length > 0);
  };
  pinta();

  const abreIndice = () => {
    indice.hidden = false;
    requestAnimationFrame(() => indice.classList.add('is-abierto'));
    btnCesta.setAttribute('aria-expanded', 'true');
  };
  const cierraIndice = (devolver) => {
    indice.classList.remove('is-abierto');
    btnCesta.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!indice.classList.contains('is-abierto')) indice.hidden = true; }, 420);
    if (devolver) btnCesta.focus();
  };
  btnCesta.addEventListener('click', () => indice.classList.contains('is-abierto') ? cierraIndice() : (abreIndice(), $('.indice__cerrar').focus({ preventScroll: true })));
  $('.indice__cerrar').addEventListener('click', () => cierraIndice(true));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && indice.classList.contains('is-abierto')) cierraIndice(true); });
  document.addEventListener('pointerdown', e => {
    if (indice.classList.contains('is-abierto') && !e.target.closest('.cesta') && !e.target.closest('[data-anadir]')) cierraIndice();
  });
  lista.addEventListener('click', e => {
    const b = e.target.closest('.indice__quitar');
    if (!b) return;
    const li = b.closest('li');
    li.classList.add('is-sale');
    setTimeout(() => { cesta = cesta.filter(it => it.id !== li.dataset.id); guarda(); pinta(); }, reduce ? 0 : 420);
  });

  const salta = () => { num.classList.remove('is-salta'); void num.offsetWidth; num.classList.add('is-salta'); };
  const vuela = (desde, fin) => {
    if (reduce) return fin();
    const a = desde.getBoundingClientRect(), b = btnCesta.getBoundingClientRect();
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const el = document.createElement('span');
    el.className = 'vuela';
    document.body.append(el);
    const altura = Math.min(y0, y1) - 120;
    const anim = el.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.4) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${x0}px, ${y0 - 30}px) scale(1.15) rotate(-10deg)`, opacity: 1, offset: .15 },
      { transform: `translate(${(x0 + x1) / 2}px, ${altura}px) scale(1) rotate(12deg)`, offset: .55 },
      { transform: `translate(${x1}px, ${y1}px) scale(.35) rotate(-4deg)`, opacity: .9 },
    ], { duration: 950, easing: 'cubic-bezier(.45,.05,.4,1)' });
    anim.onfinish = () => { el.remove(); fin(); };
  };

  $$('[data-anadir]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.anadir === 'plan' && !plan) return;
    const p = b.dataset.anadir === 'plan' ? PLANES[plan] : EXTRAS[b.dataset.anadir];
    const ya = cesta.find(it => it.id === p.id);
    if (ya) { if (p.unico) ya.cant++; }
    else {
      // un solo plan de club a la vez
      if (p.id.startsWith('club-')) cesta = cesta.filter(it => !it.id.startsWith('club-'));
      cesta.push({ ...p, cant: 1 });
    }
    guarda();
    vuela(b, () => { pinta(); salta(); abreIndice(); });
  }));

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

  /* ---------- Las guirnaldas avanzan un poco con el scroll ---------- */
  if (!reduce) {
    const seps = $$('.separador__vid');
    let pend = false;
    const deriva = () => { pend = false; seps.forEach((v, i) => v.style.setProperty('--desp', (scrollY * (i % 2 ? -.12 : .12)).toFixed(1) + 'px')); };
    addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(deriva); } }, { passive: true });
    deriva();
  }

  /* ---------- Preguntas: abrir y cerrar con muelle ---------- */
  $$('.faq details').forEach(d => {
    const sum = d.querySelector('summary'), r = d.querySelector('.faq__r');
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

  /* ---------- Nota de contacto ---------- */
  const form = $('.nota-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('.nota-form__ok');
    if (!form.checkValidity()) {
      form.classList.remove('is-error'); void form.offsetWidth; form.classList.add('is-error');
      ok.textContent = 'Falta algún dato.';
      return;
    }
    form.classList.remove('is-error', 'is-enviada'); void form.offsetWidth; form.classList.add('is-enviada');
    // TODO: conectar con el servicio de formularios (Formspree, Netlify Forms…)
    ok.textContent = 'Versión de prueba: esta nota todavía no se envía.';
    form.reset();
  });

  /* ---------- Franjas: mensajitos que van cambiando ---------- */
  $$('.franja[data-mensajes]').forEach((f, n) => {
    let ms; try { ms = JSON.parse(f.dataset.mensajes); } catch (_) { return; }
    const p = f.querySelector('p');
    let i = 0, pausa = false;
    f.addEventListener('pointerenter', () => { pausa = true; });
    f.addEventListener('pointerleave', () => { pausa = false; });
    const cambia = () => {
      if (pausa || document.hidden) return;
      i = (i + 1) % ms.length;
      if (reduce) { p.textContent = '• ' + ms[i] + ' •'; return; }
      p.classList.add('is-sale');
      setTimeout(() => {
        p.textContent = '• ' + ms[i] + ' •';
        p.classList.remove('is-sale'); p.classList.add('is-entra');
        void p.offsetWidth;
        p.classList.remove('is-entra');
      }, 380);
    };
    setTimeout(() => setInterval(cambia, 4200), n * 1300);
  });

  /* ---------- Barra fija en móvil ---------- */
  const barra = $('.barra-movil');
  const apertura = $('.apertura'), unete = $('#unete');
  const vis = { apertura: true, unete: false };
  new IntersectionObserver(es => {
    es.forEach(en => { vis[en.target === apertura ? 'apertura' : 'unete'] = en.isIntersecting; });
    barra.classList.toggle('is-visible', !vis.apertura && !vis.unete);
  }).observe(apertura);
  new IntersectionObserver(es => {
    es.forEach(en => { vis.unete = en.isIntersecting; });
    barra.classList.toggle('is-visible', !vis.apertura && !vis.unete);
  }).observe(unete);
})();
