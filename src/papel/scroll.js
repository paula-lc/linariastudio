// Scroll suave (Lenis) sincronizado con GSAP ScrollTrigger.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

export function iniciarScroll({ suave }) {
  if (suave && !lenis) {
    lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis; // para que otras partes de la web puedan desplazar con suavidad
  }
  return lenis;
}

// Fija la sección durante `alturas` pantallas, pero el progreso (0 → 1) empieza antes:
// en cuanto la sección asoma por abajo al hacer scroll, la bola ya empieza a abrirse.
export function fijarSeccion(pin, alturas, alCambiar) {
  ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => '+=' + Math.round(window.innerHeight * alturas),
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  });
  return ScrollTrigger.create({
    trigger: pin,
    start: 'top bottom',
    end: () => '+=' + Math.round(window.innerHeight * (1 + alturas)),
    invalidateOnRefresh: true,
    onUpdate: self => alCambiar(self.progress),
  });
}

export { ScrollTrigger };
