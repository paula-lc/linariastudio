# Linaria Studio · Sistema de diseño

Alcance: portada (`index.html`, `home.css`, `home.js`). El resto de páginas usan `styles.css` y todavía **no** siguen este sistema.

---

## 1. Auditoría

**Componentes revisados:** 12 · **Problemas:** 9 · **Nota:** 55/100

La identidad visual es coherente; el código no. `home.css` (1.132 líneas) ha crecido añadiendo parches al final, de modo que muchas reglas se definen 3-6 veces y la última gana.

### Cobertura de tokens

| Categoría | Tokens definidos | Valores sueltos encontrados |
|---|---|---|
| Color | 5 de marca + 2 neutros + 5 tintes | 31 `rgba()` con valores a mano, 4 hex fuera de `:root` |
| Tipografía | 4 familias | 49 tamaños distintos (`font-size`) para ~8 roles reales |
| Espaciado | ninguno | todo con `px`/`clamp()` sueltos |
| Radio | ninguno | 8 valores distintos (0, 2, 3, 4, 8, 50%, 999px) |
| Movimiento | `--ease`, `--ease-io` | 9 `cubic-bezier()` escritos a mano, 12 de ellos repiten `--ease` |
| Sombra | ninguno | ~15 sombras distintas |

### Consistencia

| Problema | Dónde | Recomendación |
|---|---|---|
| Reglas duplicadas que se pisan | `.lh-hero__title-hand` ×4, `.lh-services small` ×6, `.lh-envelope__note` ×3 | Una sola regla por componente |
| 41 `!important` | carrito, pálpito, tipografía | Subir especificidad con `.home` en vez de `!important` |
| Código muerto | estilos de `.lh-hero__cta`, `.lh-club__card`, `.lh-stitch` | Borrar: ya no existen en el HTML |
| `--sans` y `--type` son la misma fuente (Barlow) | `:root` | Quedarse con uno: `--label` |
| Nombres mezclados | `lh-` (portada) vs `flora-` (carrito) vs sin prefijo (`styles.css`) | `lh-` para todo lo nuevo |

### Completitud de componentes

| Componente | Estados | Variantes | Accesibilidad | Nota |
|---|---|---|---|---|
| Botón sello | hover, active ✅ · focus ⚠️ (solo el global) | default, light ✅ | ✅ | 8/10 |
| Sobre del inicio | dibujo, apertura, hover por postal, pálpito ✅ | — | `role="img"` ✅, sin teclado ⚠️ | 7/10 |
| Sobre explosivo | entrada, flotar, hover, pálpito ✅ | — | ✅ | 8/10 |
| Mariposa | vuelo, aleteo, hover, clic ✅ | — | decorativa, sin teclado ⚠️ | 7/10 |
| Tarjeta de producto | hover, focus ✅ | 4 colores ✅ | ✅ | 9/10 |
| Onda punteada | — | top, bottom, cap ✅ | `aria-hidden` ✅ | 9/10 |
| Carrito (sello) | hover ✅ · focus ⚠️ | — | `aria-label` ✅ | 7/10 |
| Cinta de texto | pausa al hover ✅ | — | `aria-hidden` ✅ | 9/10 |
| Rastro del ratón | normal, potenciado ✅ | — | se apaga en táctil y movimiento reducido ✅ | 10/10 |

### Acciones prioritarias

1. **Reescribir `home.css` limpio** a partir de los tokens de abajo: quitar duplicados, `!important` y código muerto. Mismo resultado visual, aprox. la mitad de líneas.
2. **Llevar los tokens a `styles.css`** para que Tienda, Mail Club, Contacto, etc. usen la misma paleta y tipografía (ahora usan `#ce7581`, `#d69447`…).
3. **Teclado:** que el sobre y la mariposa respondan a `Enter`, y un foco visible tipo sello en botones y carrito.

---

## 2. Tokens

### Color

| Token | Valor | Uso |
|---|---|---|
| `--butter` | `#FFEC8E` | subrayados, sellos, destellos |
| `--lime` | `#C6C954` | ondas punteadas, washi, estrellas |
| `--olive` | `#667436` | bandas fuertes, iconos, texto secundario |
| `--rose` | `#D9828D` | cinta, lazos, lacre, acentos |
| `--garnet` | `#621E3E` | texto principal, botón principal |
| `--paper` | `#FFFDF6` | tarjetas, sobre, banda tienda |
| `--cream` | `#F7F3E8` | fondo general |
| `--ink` | `#1D1D1B` | trazo de plumilla (líneas dibujadas) |
| `--sage-soft` / `--sage-mid` | lima 28 % / 70 % sobre papel | banda servicios, sombras de marco |
| `--rose-soft` | rosa 40 % sobre papel | cinta, mitad del Mail Club |
| `--butter-soft` | mantequilla 55 % sobre papel | interior de los sobres |

Regla: **ningún color nuevo**; los tintes se sacan con `color-mix()` de la paleta.

### Tipografía

| Token | Fuente | Rol |
|---|---|---|
| `--serif` | Instrument Serif 400 | títulos (H1 en mayúsculas), párrafos |
| `--hand` | Monsieur La Doulaise | frases manuscritas: "un mismo mundo", "para ti", sellos, firma |
| `--sans` / `--type` | Barlow 500-600, mayúsculas, `letter-spacing: .2em` | menú, botones, etiquetas, precios |

Escala propuesta (sustituye los 49 tamaños actuales):

| Rol | Tamaño |
|---|---|
| Display (H1) | `clamp(2.8rem, 6vw, 5.4rem)` |
| Título sección (H2) | `clamp(2.2rem, 4.2vw, 3.6rem)` |
| Manuscrita | `1.05em` del texto al que acompaña (la fuente tiene el ojo muy pequeño) |
| Párrafo destacado | `clamp(1.25rem, 1.6vw, 1.45rem)` |
| Párrafo | `1.15rem` |
| Etiqueta | `.75rem`, mayúsculas, `.2em` |

### Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--ease` | `cubic-bezier(.22, 1, .36, 1)` | todo hover y revelado |
| `--ease-io` | `cubic-bezier(.65, 0, .35, 1)` | vuelos (mariposa, solapa) |
| `--ease-pop` *(nuevo)* | `cubic-bezier(.2, 1.25, .35, 1)` | rebotes: sobre explosivo, pálpito |
| Duraciones | hover `.5–.6s` · revelado `.9–1.1s` · escalonado `110ms` por elemento |

Prohibido `steps()` (se percibe como lag). Todo respeta `prefers-reduced-motion`.

### Forma y elevación (propuesta)

| Token | Valor |
|---|---|
| `--radius-paper` | `3px` (tarjetas, marcos, postales) |
| `--radius-round` | `50%` (sellos redondos, lacres) |
| `--line` | `1.5px solid var(--ink)` |
| `--shadow-paper` | `0 6px 12px rgba(98,30,62,.14)` |
| `--shadow-offset` | `6px 8px 0` del color de sección (sombra "recortada", sin difuminar) |

---

## 3. Componentes

### Botón sello `.lh-stamp-btn`

Botón principal de la web. Parece un sello de correos: borde troquelado, marco interior punteado irregular, florecita de "valor".

| Variante | Uso | Detalle |
|---|---|---|
| default | sobre fondos claros | cara granate, texto papel |
| `--light` | sobre el verde oliva | cara mantequilla, texto granate |

| Propiedad CSS | Por defecto | Para qué |
|---|---|---|
| `--hole` | `--cream` | color de los agujeros: **debe ser el del fondo** donde va |
| `--face` | `--garnet` | color de la cara |
| `--ink-c` | `--paper` | color del texto |

| Estado | Visual |
|---|---|
| Reposo | girado -2.5° |
| Hover | se endereza, sube 4px, aparece matasellos a la derecha |
| Active | baja y se encoge al 97 % |

```html
<a class="lh-stamp-btn" href="mail-club.html"><span>Únete al Mail Club</span></a>
<a class="lh-stamp-btn lh-stamp-btn--light" href="…"><span>…</span></a>
```

| ✅ Sí | ❌ No |
|---|---|
| Un solo botón sello por bloque | Dos sellos juntos compitiendo |
| Ajustar `--hole` al fondo | Dejar agujeros crema sobre verde |
| Texto corto (≤ 4 palabras) | Frases largas: el sello se deforma |

### Onda punteada `.lh-wave`

Separador entre secciones. `home.js` la dibuja al ancho real (sin deformar los puntos).

| Variante | Posición | Relleno |
|---|---|---|
| `--top` | sobresale 25px por encima de su sección | color de **su** sección (`--wave-bg`) |
| `--cap` | dentro, arriba, invertida | color de la sección **anterior** (para bloques de dos colores) |
| `--bottom` | sobresale por debajo | color de su sección |

```html
<section class="lh-section lh-serv">
  <svg class="lh-wave lh-wave--top" aria-hidden="true"></svg>
  …
</section>
```
Variables: `--wave-bg` (relleno), `--wave-dot` (puntos, por defecto `--lime`).

### Sobre animado `.lh-envelope` y sobre explosivo `.lh-burst`

| | Inicio | Mail Club |
|---|---|---|
| Entrada | se dibuja → se abre la solapa → sube y se despliega la carta → salen 3 postales → vuela la mariposa | brillo → salen fotos, pegatinas, flores y destellos con rebote |
| Reposo | postales con vaivén suave | todo flota |
| Hover | cada postal sale 64px | cada foto crece |
| Clic | pálpito escalonado | pálpito en cascada |
| Táctil | tocar una postal la saca | igual que clic |

Los elementos del sobre explosivo se colocan con `--x`, `--y`, `--w`, `--r` (giro) y `--d` (retardo).

### Tarjeta de producto `.lh-product`

Postal con cinta washi; 4 fondos: `lh-art--rose`, `--olive`, `--lime` (mantequilla), `--garnet`. Hover: sube y gira -2°, la washi se despega un poco. **Pendiente:** sustituir los símbolos por fotos reales.

### Otros

| Componente | Clase | Nota |
|---|---|---|
| Etiqueta de sección | `.lh-eyebrow` | Barlow mayúsculas + estrella; `--light` sobre verde |
| Título de sección | `.lh-title` | `--light` sobre verde |
| Enlace con flecha | `.lh-link` | subrayado rosa, la flecha avanza al hover |
| Cinta en movimiento | `.lh-ribbon` | rosa suave; se pausa al hover |
| Bloque partido | `.lh-split` | media (rosa suave) + panel (oliva) |
| Carrito | `.flora-cart-trigger` | sello verde claro + lacre rosa con el número |
| Adornos | `<use href="#lh-sprig|lh-star|lh-heart|lh-daisy|lh-leaf|lh-spark">` | sprite al principio de `index.html` |
| Revelado al scroll | `.lh-reveal` | sube 28px con giro que se asienta; `--i` escalona |
