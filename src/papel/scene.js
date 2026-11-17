// Escena de Three.js: una cámara en perspectiva calibrada para que 1 unidad = 1 píxel CSS en z = 0.
import * as THREE from 'three';

const FOV = 30;

export function crearEscena(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  // los colores pasan tal cual: así coinciden con el papel horneado del HTML
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(FOV, 1, 1, 10000);

  const medida = { w: 1, h: 1 };
  const redimensionar = (w, h) => {
    medida.w = w; medida.h = h;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.position.set(0, 0, (h / 2) / Math.tan((FOV / 2) * Math.PI / 180));
    camara.near = 10;
    camara.far = camara.position.z * 4;
    camara.updateProjectionMatrix();
  };

  return { renderer, escena, camara, redimensionar, medida, render: () => renderer.render(escena, camara) };
}

export function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (_) { return false; }
}
