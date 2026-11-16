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

  /* 1b. Ondas punteadas entre secciones */
  const waves = document.querySelectorAll(".lh-wave");
  const buildWaves = () => waves.forEach((svg, k) => {
    const w = Math.round(svg.getBoundingClientRect().width);
    if (!w) return;
    const H = 26, mid = 13, amp = 7;
    const len = Math.max(140, w / Math.max(4, Math.round(w / 220)));   // longitud de onda
    const phase = k * 1.7;
    const y = (x) => mid + Math.sin((x / len) * Math.PI * 2 + phase) * amp;
    let d = `M0 ${H + 2} L0 ${y(0).toFixed(1)}`;
    for (let x = 6; x <= w; x += 6) d += ` L${x} ${y(x).toFixed(1)}`;
    d += ` L${w} ${y(w).toFixed(1)} L${w} ${H + 2} Z`;
    let dots = "";
    for (let x = 6; x < w; x += 13) dots += `<circle class="lh-wave__dot" cx="${x}" cy="${(y(x) + 6).toFixed(1)}" r="2"/>`;
    svg.setAttribute("viewBox", `0 0 ${w} ${H}`);
    svg.innerHTML = `<path class="lh-wave__fill" d="${d}"/>${dots}`;
  });
  buildWaves();
  let rt, lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW) return;          // ignora la barra del móvil
    lastW = window.innerWidth;
    clearTimeout(rt); rt = setTimeout(() => { buildScallop(); buildWaves(); if (!bfly?.classList.contains('is-flying')) aimButterfly(); }, 150);
  });

  /* 1c. Escalonado de las tarjetas dentro de cada grupo */
  document.querySelectorAll(".lh-shop__grid, .lh-services").forEach((g) =>
    g.querySelectorAll(".lh-reveal").forEach((el, i) => el.style.setProperty("--i", i)));

  /* 1d. Mariposa: calcula el vuelo desde la boca del sobre hasta el titular */
  const bfly = document.querySelector(".lh-butterfly");
  const env = document.querySelector(".lh-envelope");
  const aimButterfly = () => {
    if (!bfly || !env) return;
    const e = env.getBoundingClientRect(), b = bfly.getBoundingClientRect();
    const fromX = e.left + e.width * .5, fromY = e.top + e.height * .5;
    bfly.style.setProperty("--fx", `${Math.round(fromX - (b.left + b.width / 2))}px`);
    bfly.style.setProperty("--fy", `${Math.round(fromY - (b.top + b.height / 2))}px`);
  };
  aimButterfly();
  if (bfly && env) new MutationObserver(() => {
    if (env.classList.contains("is-drawn")) bfly.classList.add("is-flying");
  }).observe(env, { attributes: true, attributeFilter: ["class"] });

  /* 1e. Clic en la mariposa: da una vuelta y vuelve a su sitio */
  if (bfly) {
    bfly.addEventListener("click", () => {
      if (bfly.classList.contains("is-looping")) return;
      bfly.classList.add("is-looping");
    });
    bfly.addEventListener("animationend", (e) => {
      if (e.animationName === "lh-loop") bfly.classList.remove("is-looping");
    });
  }

  /* 2. Dibujar / revelar al entrar en pantalla */
  const targets = document.querySelectorAll("[data-draw], .lh-reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        requestAnimationFrame(() => requestAnimationFrame(() => e.target.classList.add("is-drawn")));
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add("is-drawn"));
  }

  /* 3. Postales: en táctil, tocar una la saca del sobre (en escritorio basta el hover) */
  document.querySelectorAll(".lh-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".lh-card.is-up").forEach((c) => c !== card && c.classList.remove("is-up"));
      card.classList.toggle("is-up");
    });
  });

  /* 4. Rastro del ratón: trazo de tinta continuo + pétalos.
        Se intensifica sobre enlaces, botones, el sobre y los productos. */
  const canvas = document.querySelector(".lh-trail");
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canvas && fine && !calm) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener("resize", size);

    const COLORS = ["#d9828d", "#ffec8e", "#c6c954", "#667436", "#621e3e"];
    const HOT = "a, button, .lh-envelope, .lh-product, [role='button']";
    const points = [];      // estela de tinta
    const bits = [];        // pétalos y estrellitas
    let mx = -100, my = -100, px = -100, py = -100, hot = 0, hotTarget = 0, running = false;

    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      hotTarget = e.target.closest && e.target.closest(HOT) ? 1 : 0;
      if (!running) { running = true; px = mx; py = my; requestAnimationFrame(tick); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => { mx = my = -100; });

    const spawn = (x, y, boost) => {
      const star = Math.random() < (boost ? .45 : .2);
      bits.push({
        x, y,
        vx: (Math.random() - .5) * (boost ? 2.4 : 1),
        vy: (Math.random() - .2) * (boost ? 2 : .8) + .3,
        r: (boost ? 4 : 2.4) + Math.random() * (boost ? 4 : 2),
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .12,
        c: COLORS[(Math.random() * (boost ? 3 : 5)) | 0],
        life: 1, decay: .012 + Math.random() * .012, star
      });
    };

    const petal = (b) => {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.globalAlpha = b.life; ctx.fillStyle = b.c;
      ctx.strokeStyle = "rgba(29,29,27,.55)"; ctx.lineWidth = .8;
      ctx.beginPath();
      if (b.star) {
        const r = b.r * 1.2;
        ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .15, -r * .15, r, 0);
        ctx.quadraticCurveTo(r * .15, r * .15, 0, r);
        ctx.quadraticCurveTo(-r * .15, r * .15, -r, 0);
        ctx.quadraticCurveTo(-r * .15, -r * .15, 0, -r);
      } else {
        ctx.ellipse(0, 0, b.r, b.r * .55, 0, 0, Math.PI * 2);
      }
      ctx.fill(); if (b.r > 4) ctx.stroke();
      ctx.restore();
    };

    function tick() {
      hot += (hotTarget - hot) * .15;
      // suavizado del cursor: el trazo "persigue" al ratón como una plumilla
      px += (mx - px) * .35; py += (my - py) * .35;
      if (mx > -50) points.push({ x: px, y: py, life: 1 });

      const speed = Math.hypot(mx - px, my - py);
      const rate = .08 + hot * .55 + Math.min(speed / 60, .4);
      if (mx > -50 && Math.random() < rate) spawn(px, py, hot > .5);
      if (hot > .5 && Math.random() < .25) spawn(px, py, true);

      ctx.clearRect(0, 0, innerWidth, innerHeight);

      // tinta
      for (let i = points.length - 1; i >= 0; i--) {
        points[i].life -= .045 - hot * .015;
        if (points[i].life <= 0) points.splice(i, 1);
      }
      if (points.length > 2) {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1], b = points[i];
          ctx.globalAlpha = b.life * .7;
          ctx.strokeStyle = hot > .5 ? "#d9828d" : "#621e3e";
          ctx.lineWidth = b.life * (1.6 + hot * 2.2);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      // pétalos
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.x += b.vx; b.y += b.vy; b.vy += .025; b.vx *= .98; b.rot += b.vr; b.life -= b.decay;
        if (b.life <= 0) { bits.splice(i, 1); continue; }
        petal(b);
      }
      ctx.globalAlpha = 1;

      if (points.length || bits.length || mx > -50) requestAnimationFrame(tick);
      else running = false;
    }
  }
})();
