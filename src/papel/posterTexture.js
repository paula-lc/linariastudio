// ============================================================
//  Texturas del papel, generadas a partir del HTML real del póster.
//  El HTML manda: medimos cada línea en el DOM y la dibujamos en el canvas
//  en el mismo sitio, con la misma fuente. Así WebGL y HTML coinciden.
// ============================================================
import { ANCHO, ALTO, RESIDUALES } from './ajustes.js';
import urlHoja from '../../assets/img/papel.webp';

const ESCALA = 1.5; // resolución de las texturas respecto al diseño (600 × 848)

// Relieve de las arrugas a partir del sombreado de la propia hoja ilustrada:
// las zonas claras están "arriba" y las oscuras "abajo". Normales en espacio tangente (v hacia arriba).
function normalesDesdeHoja(datos, w, h) {
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const d = datos.data;
    lum[i] = d[i * 4 + 3] < 128 ? 1 : (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255;
  }
  const nx = new Float32Array(w * h), ny = new Float32Array(w * h);
  const k = RESIDUALES.relieve, r = 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const dx = lum[y * w + Math.min(w - 1, x + r)] - lum[y * w + Math.max(0, x - r)];
      const dy = lum[Math.min(h - 1, y + r) * w + x] - lum[Math.max(0, y - r) * w + x];
      const a = -dx * k, b = dy * k;           // en el canvas y crece hacia abajo; en la textura v hacia arriba
      const l = Math.hypot(a, b, 1);
      nx[i] = a / l; ny[i] = b / l;
    }
  }
  return { nx, ny };
}

function cargarImagen(src) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

const lienzo = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// Dibuja el SVG del adorno con Path2D, sin pasar por una <img>:
// en Safari una imagen SVG "ensucia" el canvas y luego no se puede leer ni subir a WebGL.
function pintarSvg(ctx, svg, x, y, w, h) {
  const vb = (svg.getAttribute('viewBox') || `0 0 ${w} ${h}`).split(/[\s,]+/).map(Number);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w / vb[2], h / vb[3]);
  ctx.translate(-vb[0], -vb[1]);
  const attr = (el, n) => { for (let e = el; e && e !== svg.parentNode; e = e.parentNode) { const v = e.getAttribute && e.getAttribute(n); if (v) return v; } return null; };
  svg.querySelectorAll('path, circle').forEach(el => {
    let forma;
    if (el.tagName.toLowerCase() === 'path') forma = new Path2D(el.getAttribute('d'));
    else { forma = new Path2D(); forma.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, Math.PI * 2); }
    const relleno = attr(el, 'fill'), trazo = attr(el, 'stroke');
    if (relleno && relleno !== 'none') { ctx.fillStyle = relleno; ctx.fill(forma); }
    if (trazo && trazo !== 'none') {
      ctx.strokeStyle = trazo;
      ctx.lineWidth = +(attr(el, 'stroke-width') || 1);
      ctx.lineCap = attr(el, 'stroke-linecap') || 'butt';
      ctx.stroke(forma);
    }
  });
  ctx.restore();
}

// Mide el póster en el DOM (en unidades de diseño, sin la rotación del papel).
function medir(raiz) {
  const articulo = raiz.closest('.papel-html');
  const giro = articulo.style.rotate;
  articulo.style.rotate = '0deg';
  const r0 = raiz.getBoundingClientRect();
  const k = r0.width / ANCHO;
  const piezas = [];
  raiz.querySelectorAll('[data-pinta]').forEach(el => {
    const tipo = el.dataset.pinta;
    const r = el.getBoundingClientRect();
    const caja = { x: (r.left - r0.left) / k, y: (r.top - r0.top) / k, w: r.width / k, h: r.height / k };
    if (tipo === 'texto') {
      // sonda de línea base: un inline-block vacío se apoya justo en la línea base
      const sonda = document.createElement('i');
      sonda.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.prepend(sonda);
      const rb = sonda.getBoundingClientRect();
      sonda.remove();
      const cs = getComputedStyle(el);
      let texto = el.textContent;
      if (cs.textTransform === 'uppercase') texto = texto.toUpperCase();
      piezas.push({ tipo, texto, x: caja.x, base: (rb.top - r0.top) / k, color: cs.color,
        fuente: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}` });
    } else if (tipo === 'rect') {
      piezas.push({ tipo, ...caja, color: getComputedStyle(el).backgroundColor });
    } else if (tipo === 'svg') {
      piezas.push({ tipo, ...caja, el });
    }
  });
  articulo.style.rotate = giro;
  return piezas;
}

export async function crearTexturas(raiz) {
  await Promise.all([
    document.fonts.load('400 40px "Great Vibes"'),
    document.fonts.load('400 17px "Inter"'),
    document.fonts.load('400 66px "Inter"'),
  ]).catch(() => {});
  await document.fonts.ready;

  const W = Math.round(ANCHO * ESCALA), H = Math.round(ALTO * ESCALA);
  const piezas = medir(raiz);

  // 1. papel liso con los adornos (sin texto)
  const hoja = await cargarImagen(urlHoja);
  const base = lienzo(W, H);
  const cb = base.getContext('2d');
  cb.drawImage(hoja, 0, 0, W, H);
  const datosHoja = cb.getImageData(0, 0, W, H);
  cb.scale(ESCALA, ESCALA);
  for (const p of piezas) {
    if (p.tipo === 'rect') { cb.fillStyle = p.color; cb.fillRect(p.x, p.y, p.w, p.h); }
    if (p.tipo === 'svg') pintarSvg(cb, p.el, p.x, p.y, p.w, p.h);
  }

  // 2. textura de la cara delantera para WebGL: papel + texto
  const albedo = lienzo(W, H);
  const ca = albedo.getContext('2d');
  ca.drawImage(base, 0, 0);
  ca.scale(ESCALA, ESCALA);
  ca.textBaseline = 'alphabetic';
  for (const p of piezas) {
    if (p.tipo !== 'texto') continue;
    ca.font = p.fuente;
    ca.fillStyle = p.color;
    ca.fillText(p.texto, p.x, p.base);
  }

  // 3. arrugas residuales: mapa de normales sacado del sombreado de la hoja
  const { nx, ny } = normalesDesdeHoja(datosHoja, W, H);
  const normales = lienzo(W, H);
  const cn = normales.getContext('2d');
  const dn = cn.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    dn.data[i * 4] = (nx[i] * 0.5 + 0.5) * 255;
    dn.data[i * 4 + 1] = (ny[i] * 0.5 + 0.5) * 255;
    dn.data[i * 4 + 2] = 255;
    dn.data[i * 4 + 3] = 255;
  }
  cn.putImageData(dn, 0, 0);
  return { albedo, normales };
}
