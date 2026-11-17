// ============================================================
//  "Lo que cabe en un sobre": una bola de papel que se despliega con el scroll.
//  0.00–0.60 se abre · 0.60–0.85 plano y legible · 0.85–1.00 fundido al HTML real.
// ============================================================
import * as THREE from 'three';
import { crearEscena, hayWebGL } from './scene.js';
import { crearPapel } from './paper.js';
import { crearTexturas } from './posterTexture.js';
import { fijarSeccion, iniciarScroll, ScrollTrigger } from './scroll.js';
import { ANCHO, ALTO, SCROLL, ARRUGAS, ROTACION_FINAL } from './ajustes.js';

const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mezcla = (a, b, t) => a + (b - a) * t;
const suave = t => t * t * (3 - 2 * t);
const suaveMas = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export async function iniciarPapel() {
  try {
    await arrancar();
  } catch (error) {
    console.error('[papel] no se pudo iniciar la animación, se muestra el papel estático:', error);
    const seccion = document.querySelector('.papel-seccion');
    if (seccion) { seccion.classList.remove('papel--vivo'); seccion.classList.add('papel--estatico'); }
    document.querySelectorAll('.papel-html, .papel-mesa').forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
  }
}

async function arrancar() {
  const seccion = document.querySelector('.papel-seccion');
  if (!seccion) return;
  const pin = seccion.querySelector('.papel-pin');
  const canvas = seccion.querySelector('.papel-canvas');
  const html = seccion.querySelector('.papel-html');
  const lienzo = seccion.querySelector('.papel-lienzo');
  const hueco = seccion.querySelector('.papel-hueco');
  const mesa = seccion.querySelector('.papel-mesa:not(.papel-mesa--movil)');

  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  iniciarScroll({ suave: !sinMovimiento });

  // el póster HTML se escala desde su tamaño de diseño (600 × 848) al hueco
  const ajustaLienzo = () => lienzo.style.setProperty('--k', hueco.clientWidth / ANCHO);
  ajustaLienzo();
  addEventListener('resize', ajustaLienzo);

  if (sinMovimiento || !hayWebGL()) {
    seccion.classList.add('papel--estatico');
    try {
      const { fondoHTML } = await crearTexturas(lienzo);
      html.style.backgroundImage = `url(${fondoHTML})`;
      html.classList.add('horneado');
    } catch (_) { /* sin textura: se queda el papel liso */ }
    return;
  }

  seccion.classList.add('papel--vivo');
  const texturas = await crearTexturas(lienzo);
  html.style.backgroundImage = `url(${texturas.fondoHTML})`;
  html.classList.add('horneado');

  const movil = innerWidth < 760;
  const { renderer, escena, camara, redimensionar, medida, render } = crearEscena(canvas);
  const { hoja, sombra, material } = crearPapel(texturas, { movil });
  escena.add(sombra, hoja);

  // dónde acaba el papel: el centro y el tamaño del hueco del HTML, en píxeles desde el centro del canvas
  const destino = { x: 0, y: 0, escala: 1 };
  const medir = () => {
    const rc = pin.getBoundingClientRect();
    redimensionar(rc.width, rc.height);
    ajustaLienzo();
    const rh = hueco.getBoundingClientRect();
    destino.x = rh.left + rh.width / 2 - (rc.left + rc.width / 2);
    destino.y = -(rh.top + rh.height / 2 - (rc.top + rc.height / 2));
    destino.escala = rh.width / ANCHO;
  };
  medir();

  // progreso: el scroll fija el objetivo y el dibujo lo sigue con suavidad
  let objetivo = 0, progreso = 0, giro = 0, ultimo = performance.now();
  let visible = false, raf = 0, quieto = 0;
  const trigger = fijarSeccion(pin, SCROLL.duracion, p => { objetivo = p; despierta(); });
  ScrollTrigger.addEventListener('refresh', medir);

  const qGiro = new THREE.Quaternion(), qFinal = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, ROTACION_FINAL));
  const euler = new THREE.Euler();

  const pinta = (p, dt) => {
    const abre = limita(p / SCROLL.finApertura);       // 0 → 1 mientras se despliega
    const k = suaveMas(abre);
    material.uniforms.uCrumple.value = 1 - abre;

    // gira despacio mientras es bola y se va poniendo de frente
    giro += dt * ARRUGAS.giro * (1 - k);
    euler.set(giro * 0.55, giro, giro * 0.25);
    qGiro.setFromEuler(euler);
    hoja.quaternion.copy(qGiro).slerp(qFinal, k);

    const s = mezcla(ARRUGAS.escalaInicial, 1, k) * destino.escala;
    hoja.scale.setScalar(s);
    // la bola empieza ya en su sitio, a la izquierda, y se despliega ahí mismo
    hoja.position.set(destino.x, destino.y, 0);

    // sombra: de redonda (bola) a rectangular (papel), un poco desplazada
    const ladoBola = ANCHO * ARRUGAS.radioBola * 2.5;
    sombra.scale.set(mezcla(ladoBola, ANCHO * 1.45, k) * s, mezcla(ladoBola, ALTO * 1.4, k) * s, 1);
    sombra.position.set(hoja.position.x + 14 * destino.escala, hoja.position.y - 22 * destino.escala, -ANCHO * ARRUGAS.radioBola * s * 1.1);
    sombra.rotation.z = ROTACION_FINAL * k;
    sombra.material.opacity = mezcla(0.22, 0.32, k);

    // 0.85 → 1: fundido al papel HTML
    const f = suave(limita((p - SCROLL.inicioFundido) / (1 - SCROLL.inicioFundido)));
    canvas.style.opacity = 1 - f;
    html.style.opacity = f;
    html.style.pointerEvents = f > 0.5 ? 'auto' : 'none';

    // las piezas del sobre aparecen cuando el papel ya está casi abierto
    if (mesa) {
      const m = suave(limita((p - 0.5) / 0.3));
      mesa.style.opacity = m;
      mesa.style.transform = `translateX(${(1 - m) * 40}px)`;
    }
  };

  // solo se dibuja mientras la sección está a la vista
  const bucle = ahora => {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    progreso += (objetivo - progreso) * Math.min(1, dt * 9);
    if (Math.abs(objetivo - progreso) < 0.0005) progreso = objetivo;
    pinta(progreso, dt);
    render();
    // cuando el papel está quieto y abierto, deja de dibujar
    quieto = (progreso === objetivo && progreso >= SCROLL.finApertura) ? quieto + 1 : 0;
    raf = (visible && quieto < 3) ? requestAnimationFrame(bucle) : 0;
  };
  function despierta() {
    quieto = 0;
    if (visible && !raf) { ultimo = performance.now(); raf = requestAnimationFrame(bucle); }
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) despierta(); }, { rootMargin: '100px' }).observe(pin);
  addEventListener('resize', () => { medir(); despierta(); });

  progreso = objetivo = trigger.progress;
  pinta(progreso, 0);
  render();

  // para pruebas: llevar el scroll a un progreso concreto
  window.__papel = {
    trigger,
    irA: p => {
      const y = trigger.start + (trigger.end - trigger.start) * p;
      const lenis = iniciarScroll({ suave: false });
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
      ScrollTrigger.update();
      objetivo = progreso = p;
      pinta(p, 0); render();
    },
  };
}
