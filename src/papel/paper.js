// La hoja: un plano A5 muy subdividido que el vertex shader arruga y despliega.
import * as THREE from 'three';
import vertex from './shaders/papel.vert.js';
import fragment from './shaders/papel.frag.js';
import { ANCHO, ALTO, ARRUGAS, RESIDUALES, LUZ, COLOR_PAPEL } from './ajustes.js';

function texturaSombra() {
  const c = Object.assign(document.createElement('canvas'), { width: 256, height: 256 });
  const x = c.getContext('2d');
  // sombra difusa dibujada con shadowBlur (ctx.filter no existe en Safari)
  x.shadowColor = 'rgba(38, 58, 34, 1)';
  x.shadowBlur = 40;
  x.shadowOffsetX = 1000;
  x.fillStyle = '#000';
  x.fillRect(64 - 1000, 64, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function crearPapel({ albedo, normales }, { movil }) {
  const seg = movil ? [64, 90] : [128, 180];
  const geo = new THREE.PlaneGeometry(1, 1, seg[0], seg[1]);

  const mapa = new THREE.CanvasTexture(albedo);
  const mapaNormales = new THREE.CanvasTexture(normales);
  for (const t of [mapa, mapaNormales]) {
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 4;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    uniforms: {
      uCrumple: { value: 1 },
      uRadio: { value: ANCHO * ARRUGAS.radioBola },
      uIntensidad: { value: ARRUGAS.intensidad },
      uRetardo: { value: ARRUGAS.retardoEsquinas },
      uTransito: { value: ARRUGAS.arrugasTransito },
      uTamano: { value: new THREE.Vector2(ANCHO, ALTO) },
      uPaso: { value: new THREE.Vector2(2 / seg[0], 2 / seg[1]) }, // paso doble: normales más suaves
      uSemilla: { value: 3.7 },
      uMapa: { value: mapa },
      uNormales: { value: mapaNormales },
      uLuz: { value: new THREE.Vector3(...LUZ.dir) },
      uAmbiente: { value: LUZ.ambiente },
      uDifusa: { value: LUZ.difusa },
      uEnvoltura: { value: LUZ.envoltura },
      uFuerzaNormales: { value: RESIDUALES.fuerza },
      uColorDorso: { value: new THREE.Vector3(...COLOR_PAPEL.map(v => (v - 4) / 255)) },
    },
  });

  const hoja = new THREE.Mesh(geo, material);
  hoja.frustumCulled = false;

  // sombra suave sobre el fondo; no gira con la bola
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, opacity: 0.3, depthWrite: false }),
  );
  sombra.renderOrder = -1;

  return { hoja, sombra, material };
}
