import ruido from './ruido.glsl.js';

// uCrumple: 1 = bola, 0 = plano. Las normales se recalculan por diferencias finitas.
export default /* glsl */ `
uniform float uCrumple;
uniform float uRadio;
uniform float uIntensidad;
uniform float uRetardo;
uniform float uTransito;
uniform vec2 uTamano;
uniform vec2 uPaso;
uniform float uSemilla;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangente;
varying vec3 vBitangente;
varying vec3 vPosVista;

${ruido}

vec3 plano(vec2 uv) {
  return vec3((uv.x - 0.5) * uTamano.x, (uv.y - 0.5) * uTamano.y, 0.0);
}

// Cuánto sigue arrugado este punto: el centro se abre antes que las esquinas.
float arrugaLocal(vec2 uv) {
  float d = length((uv - 0.5) * vec2(1.0, uTamano.y / uTamano.x)) / 0.87;
  d = clamp(d, 0.0, 1.0);
  float abre = 1.0 - uCrumple;
  float ini = d * uRetardo;
  return 1.0 - smoothstep(ini, ini + (1.0 - uRetardo), abre);
}

// La hoja envuelta en una bola: la hoja se reparte sobre una esfera y el ruido la pliega.
vec3 bola(vec2 uv) {
  // proyección radial: el centro de la hoja queda delante y los bordes se envuelven por detrás
  vec2 pc = (uv - 0.5) * uTamano;
  float rr = length(pc) / (0.5 * length(uTamano));
  float phi = atan(pc.y, pc.x);
  float th = rr * 2.95;
  vec3 dir = vec3(sin(th) * cos(phi), sin(th) * sin(phi), cos(th));
  // pocas caras grandes con aristas marcadas, como una bola de papel de verdad
  vec3 q = vec3(uv * uTamano / 230.0, uSemilla);
  float r = 1.0 - abs(snoise(q)); r *= r;                  // aristas grandes
  r += 0.35 * (1.0 - abs(snoise(q * 2.2 + 4.0)));          // algún pliegue más fino
  float f = facetas(q * 0.7 + 3.1);
  float radio = uRadio * (0.84 + uIntensidad * (0.2 * r - 0.22 * f));
  vec3 lateral = vec3(snoise(q * 0.6 + 11.0), snoise(q * 0.6 + 23.0), snoise(q * 0.6 + 37.0)) * uRadio * 0.09 * uIntensidad;
  return dir * radio + lateral;
}

vec3 forma(vec2 uv) {
  float c = arrugaLocal(uv);
  vec3 p = mix(plano(uv), bola(uv), c);
  // durante el despliegue la hoja sigue llena de arrugas que se van planchando
  vec3 q = vec3(uv * uTamano / 120.0, uSemilla + 5.0);
  float transito = c * (1.0 - c) * 4.0;
  float arr = (ridged(q) - 0.45) * uTamano.x * uTransito * (transito + c * 0.35);
  p.z += arr;
  return p;
}

void main() {
  vUv = uv;
  vec3 p = forma(uv);
  vec3 t = forma(uv + vec2(uPaso.x, 0.0)) - forma(uv - vec2(uPaso.x, 0.0));
  vec3 b = forma(uv + vec2(0.0, uPaso.y)) - forma(uv - vec2(0.0, uPaso.y));
  vec3 n = normalize(cross(t, b));
  vNormal = normalize(normalMatrix * n);
  vTangente = normalize(normalMatrix * t);
  vBitangente = normalize(normalMatrix * b);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vPosVista = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
