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
  }
  return lenis;
}

// Fija la sección y devuelve el progreso 0 → 1 mientras se recorren `alturas` pantallas.
export function fijarSeccion(pin, alturas, alCambiar) {
  return ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => '+=' + Math.round(window.innerHeight * alturas),
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: self => alCambiar(self.progress),
  });
}

export { ScrollTrigger };
