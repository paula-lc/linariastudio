/* Linaria Studio · interacciones */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Entrada ---------- */
  $$('.lema__palabra, .lema__script').forEach((el, i) => el.style.setProperty('--w', i));
  $$('.nav__link').forEach(a => a.insertAdjacentHTML('beforeend', '<span class="enredadera" aria-hidden="true"><img class="enredadera__tallo" src="assets/img/enredadera-tallo.svg" alt=""><img class="enredadera__flores" src="assets/img/enredadera-flores.svg" alt=""></span>'));
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
  if (reduce) estado('abierto');
  else {
    addEventListener('scroll', () => scrollY > 30 && asomar(), { passive: true });
    setTimeout(asomar, 6000);
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
  let plan = 'bruja';
  const cifra = $('.plan__cifra');
  const euros = n => n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  $$('.plan__elige [role="radio"]').forEach((b, i, todos) => {
    b.addEventListener('click', () => {
      todos.forEach(x => x.setAttribute('aria-checked', x === b));
      $('.plan').dataset.elegido = 'si';
      plan = b.dataset.plan;
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
    $('.indice__suma').textContent = euros(total) + ' €';
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
  });

  /* ---------- El camino de una carta ---------- */
  const senda = $('#senda'), sobrecito = $('.camino__sobrecito'), mapa = $('.camino__mapa');
  if (senda && sobrecito) {
    const largo = senda.getTotalLength();
    let pedido = false;
    const mueve = () => {
      pedido = false;
      if (!mapa.offsetParent) return;
      const r = mapa.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * .85 - r.top) / (innerHeight * .6)));
      const k = mapa.clientWidth / 900;
      const pt = senda.getPointAtLength(p * largo);
      const pt2 = senda.getPointAtLength(Math.min(largo, p * largo + 2));
      const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      sobrecito.style.transform = `translate(${pt.x * k}px, ${pt.y * k}px) rotate(${ang * .6}deg)`;
    };
    addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(mueve); } }, { passive: true });
    addEventListener('resize', mueve);
    mueve();
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
