const menuButton=document.querySelector(".menu-toggle");
const nav=document.querySelector(".main-nav");
if(menuButton && nav){
  menuButton.addEventListener("click",()=>{
    const open=nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded",String(open));
    menuButton.textContent=open?"×":"☰";
  });
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded","false");
    menuButton.textContent="☰";
  }));
}

// ANUNCIO MENSAJE CAMBIANTE

const announcementMessages = [
    "ENVÍO GRATIS EN TODA ESPAÑA",
    "¡DESCUBRE NUESTRO MAIL CLUB! 💌",
    "NUEVOS PRINTS DISPONIBLES EN LA TIENDA ✿",
    "GRACIAS POR APOYAR EL ARTE INDEPENDIENTE ♡",
    "DOS ARTISTAS, UNA ÚNICA WEB!"
];

const announcementText = document.querySelector("#announcement-text");

let currentMessage = 0;

setInterval(() => {

    announcementText.classList.add("changing");

    setTimeout(() => {

        currentMessage = (currentMessage + 1) % announcementMessages.length;

        announcementText.textContent = announcementMessages[currentMessage];

        announcementText.classList.remove("changing");

    }, 250);

}, 3500);

// DESPLEGABLE MENU

document.addEventListener("DOMContentLoaded", () => {

    const dropdown = document.querySelector(".nav-dropdown");

    if (!dropdown) return;

    const button = dropdown.querySelector(".nav-dropdown-toggle");
    const hoverEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function openMenu() {
        dropdown.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
        dropdown.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
    }

    // Ordenador: abrir al pasar el ratón
    if (hoverEnabled) {
        dropdown.addEventListener("mouseenter", openMenu);
        dropdown.addEventListener("mouseleave", closeMenu);
    }

    // Móvil: abrir al pulsar
    button.addEventListener("click", () => {
        if (dropdown.classList.contains("is-open")) {
            if (!hoverEnabled) closeMenu();
        } else {
            openMenu();
        }
    });

    // Cerrar al pulsar fuera
    document.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) {
            closeMenu();
        }
    });

    // Cerrar con Escape
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

});

// CURSOR DECORADO FLORA STUDIO

document.addEventListener("DOMContentLoaded", () => {

    const desktop = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    ).matches;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!desktop || reducedMotion) return;

    const flower = document.createElement("span");



    document.body.appendChild(flower);

    const decorations = ["✧", "✦", "⋆", "✩", "✧"];
    
    let lastX = 0;
    let lastY = 0;
    let decorationIndex = 0;

    document.addEventListener("pointermove", (event) => {

        flower.style.left = `${event.clientX}px`;
        flower.style.top = `${event.clientY}px`;
        flower.classList.add("is-visible");

        const distance = Math.hypot(
            event.clientX - lastX,
            event.clientY - lastY
        );

        if (distance < 50) return;

        lastX = event.clientX;
        lastY = event.clientY;

        const particle = document.createElement("span");

        particle.className = "flora-cursor-particle";
        particle.textContent =
    decorations[decorationIndex % decorations.length];

        decorationIndex++;

        particle.style.left = `${event.clientX}px`;
        particle.style.top = `${event.clientY}px`;

        document.body.appendChild(particle);

        requestAnimationFrame(() => {
            particle.classList.add("show");
        });

        setTimeout(() => particle.remove(), 1000);

    });

    document.addEventListener("pointerover", (event) => {
        if (event.target.closest("a, button, summary")) {
            flower.classList.add("is-hovering");
        }
    });

    document.addEventListener("pointerout", (event) => {
        if (
            event.target.closest("a, button, summary") &&
            !event.relatedTarget?.closest?.("a, button, summary")
        ) {
            flower.classList.remove("is-hovering");
        }
    });

});

// FLORA STUDIO - ANIMACIONES AL HACER SCROLL

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {

    // Aplicar animación automáticamente a todas las secciones
document.querySelectorAll("section:not(.hero)").forEach(section => {
    section.setAttribute("data-reveal", "");
});

// También animar las tarjetas de productos
document.querySelectorAll(".product-card").forEach(card => {
    card.setAttribute("data-reveal", "");
});

const elements = document.querySelectorAll("[data-reveal]");

    // Si el navegador no admite IntersectionObserver
    if (!("IntersectionObserver" in window)) {
        elements.forEach(element => {
            element.classList.add("is-visible");
        });
        return;
    }

    const observer = new IntersectionObserver((entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("is-visible");

                // Dejar de observar una vez que aparece
                observer.unobserve(entry.target);

            }

        });

    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px"
    });

    elements.forEach(element => {
        observer.observe(element);
    });

});