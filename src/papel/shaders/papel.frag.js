// Luz difusa + ambiente, con el mapa de normales del papel arrugado aplicado siempre.
// Los colores se tratan igual que en el horneado del HTML (posterTexture.js) para que el fundido no salte.
export default /* glsl */ `
uniform sampler2D uMapa;
uniform sampler2D uNormales;
uniform vec3 uLuz;
uniform float uAmbiente;
uniform float uDifusa;
uniform float uFuerzaNormales;
uniform vec3 uColorDorso;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangente;
varying vec3 vBitangente;

void main() {
  vec4 hoja = texture2D(uMapa, vUv);
  if (hoja.a < 0.5) discard;             // bordes irregulares de la hoja
  vec3 n = normalize(vNormal);
  vec3 t = normalize(vTangente);
  vec3 b = normalize(vBitangente);
  if (!gl_FrontFacing) n = -n;
  vec2 nt = texture2D(uNormales, vUv).xy * 2.0 - 1.0;
  n = normalize(n + (nt.x * t + nt.y * b) * uFuerzaNormales);
  float luz = uAmbiente + uDifusa * max(dot(n, uLuz), 0.0);
  vec3 color = gl_FrontFacing ? hoja.rgb : uColorDorso;
  gl_FragColor = vec4(color * luz, 1.0);
}
`;
