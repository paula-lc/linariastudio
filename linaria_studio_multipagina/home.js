/* LINARIA · PORTADA — trazado SVG en vivo + festón + interacción del sobre
   No toca script.js ni cart.js. */
(() => {
  /* 1. Festón inferior de la cabecera, a medida del ancho real */
  const scallop = document.querySelector(".lh-scallop");
  const buildScallop = () => {
    if (!scallop) return;
    const w = Math.round(scallop.getBoundingClientRect().width);
    if (!w) return;
    const n = Math.max(8, Math.round(w / 34));
    const step = w / n, base = 4, depth = 16;
    let wave = `M0 ${base}`;
    for (let i = 0; i < n; i++) {
      const x0 = i * step, x1 = x0 + step;
      const d = depth + ((i * 7) % 3) - 1;
      wave += ` C${(x0 + step * .15).toFixed(1)} ${base + d} ${(x1 - step * .15).toFixed(1)} ${base + d} ${x1.toFixed(1)} ${base}`;
    }
    let dots = "";
    for (let i = 0; i < n; i++) {
      dots += `<circle class="lh-scallop__dot" style="--i:${i}" cx="${((i + .5) * step).toFixed(1)}" cy="${base + depth + 9}" r="2.2"/>`;
    }
    scallop.setAttribute("viewBox", `0 0 ${w} 34`);
    scallop.innerHTML =
      `<path class="lh-scallop__fill" d="M0 -2 L0 ${base} ${wave.slice(wave.indexOf("C"))} L${w} -2 Z"/>` +
      `<path class="lh-scallop__line draw" pathLength="1" style="--dur:1.6s;--delay:.3s" d="${wave}"/>` +
      dots;
  };
  buildScallop();
  let rt, lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW) return;          // ignora la barra del móvil
    lastW = window.innerWidth;
    clearTimeout(rt); rt = setTimeout(buildScallop, 150);
  });

  /* 2. Dibujar / revelar al entrar en pantalla */
  const targets = document.querySelectorAll("[data-draw], .lh-reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        requestAnimationFrame(() => requestAnimationFrame(() => e.target.classList.add("is-drawn")));
        io.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add("is-drawn"));
  }

  /* 3. Sobre: clic/toque alterna, teclado con Enter/Espacio.
        (click en vez de touchstart: no se dispara al hacer scroll) */
  const envelope = document.querySelector(".lh-envelope");
  if (envelope) {
    const toggle = () => envelope.classList.toggle("is-peek");
    envelope.addEventListener("click", toggle);
    envelope.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  }
})();
