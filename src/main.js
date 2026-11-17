// Punto de entrada de Vite.
import '../js/main.js';          // interacciones de la landing (sobre, cesta, receta, camino…)
import { iniciarCabecera } from './cabecera.js';

iniciarCabecera();
// la bola de papel (Three.js, GSAP, Lenis) se carga aparte para no frenar el resto de la página
import('./papel/index.js').then(m => m.iniciarPapel());
