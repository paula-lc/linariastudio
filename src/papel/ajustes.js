// ============================================================
//  Parámetros del papel arrugado. Todo lo que se puede afinar está aquí.
// ============================================================

// Tamaño de diseño del póster (A5 vertical): el HTML y la textura usan estas unidades.
export const ANCHO = 600;
export const ALTO = 848;

// Duración del scroll fijado (en alturas de pantalla) y tramos de la animación (0 → 1).
export const SCROLL = {
  duracion: 2,        // la sección se queda fijada durante 200vh (el despliegue empieza ya al asomar, 1vh antes)
  finApertura: 0.6,   // 0 → 0.6: la bola se abre (empieza en cuanto la sección asoma por abajo)
  inicioFundido: 0.85, // 0.85 → 1: fundido de WebGL a HTML
};

// Forma de la bola y de los pliegues.
export const ARRUGAS = {
  radioBola: 0.27,      // radio de la bola, en proporción al ancho del papel
  intensidad: 1.0,      // fuerza de los pliegues de la bola (0.5 suaves, 1.5 muy marcados)
  retardoEsquinas: 0.35, // cuánto tardan en abrirse las esquinas respecto al centro (0 = todo a la vez)
  arrugasTransito: 0.11, // arrugas extra mientras se despliega (en proporción al ancho)
  escalaInicial: 0.7,   // tamaño de la bola al principio, respecto al papel final
  giro: 0.35,           // velocidad de giro de la bola (radianes por segundo)
};

// Arrugas residuales del papel ya abierto (mapa de normales).
export const RESIDUALES = {
  fuerza: 0.15,   // intensidad del mapa de normales sobre el papel plano
  relieve: 14,    // cuánto relieve se saca del sombreado de la hoja ilustrada (assets/img/papel.webp)
};

// Luz: la misma en el shader y en el horneado del HTML, para que el fundido no salte.
const l = [-0.42, 0.5, 0.76];
const m = Math.hypot(...l);
export const LUZ = {
  dir: l.map(v => v / m),
  ambiente: 0.5,
};
// Difusa calibrada para que el papel plano y de frente salga con brillo 1.
LUZ.difusa = (1 - LUZ.ambiente) / LUZ.dir[2];

// el papel queda un poco torcido, como en la maqueta (en Three el giro positivo es antihorario = rotate(-2deg) en CSS)
export const ROTACION_FINAL = 2 * Math.PI / 180;
export const COLOR_PAPEL = [252, 251, 247];
