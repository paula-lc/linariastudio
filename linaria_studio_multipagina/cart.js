(() => {
  "use strict";

  const CART_KEY = "flora-studio-cart-v1";
  const API_BASE = String(window.FLORA_CONFIG?.API_BASE || "").replace(/\/+$/, "");
  const productsById = new Map();
  let productsLoaded = false;
  let cart = readCart();
  let cartButton;
  let drawer;
  let backdrop;
  let cartItemsContainer;
  let cartSummary;
  let cartMessage;
  let checkoutButton;

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.id === "string" && Number.isInteger(item.quantity))
        .map((item) => ({ id: item.id, quantity: Math.min(10, Math.max(1, item.quantity)) }));
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartButton();
    renderCart();
    window.dispatchEvent(new CustomEvent("flora:cart-updated", { detail: { cart } }));
  }

  function euro(cents) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildCartUI() {
   const headerTarget = document.querySelector(".header-top");
    if (headerTarget) {
      cartButton = make("button", "flora-cart-trigger");
      cartButton.type = "button";
      cartButton.setAttribute("aria-label", "Abrir carrito");
     cartButton.innerHTML = `
    <svg class="flora-cart-icon"
         xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="1.6"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="19" cy="21" r="1"/>
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
    </svg>
    <span class="flora-cart-trigger-label">Carrito</span>
    <span class="flora-cart-count">0</span>
`;

      cartButton.addEventListener("click", openCart);
      headerTarget.append(cartButton);
    }

    backdrop = make("div", "flora-cart-backdrop");
    backdrop.hidden = true;
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeCart();
    });

    drawer = make("aside", "flora-cart-drawer");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Tu carrito");
    drawer.setAttribute("tabindex", "-1");

    const header = make("div", "flora-cart-heading");
    const headingText = make("div", "flora-cart-heading-copy");
    headingText.append(make("p", "flora-cart-eyebrow", "FLORA STUDIO"));
    headingText.append(make("h2", "", "Tu carrito"));
    const closeButton = make("button", "flora-cart-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Cerrar carrito");
    closeButton.addEventListener("click", closeCart);
    header.append(headingText, closeButton);

    cartItemsContainer = make("div", "flora-cart-items");
    cartItemsContainer.setAttribute("aria-live", "polite");
    cartSummary = make("div", "flora-cart-summary");
    cartMessage = make("p", "flora-cart-message");
    cartMessage.setAttribute("role", "status");

    const footer = make("div", "flora-cart-footer");
    checkoutButton = make("button", "flora-checkout-button", "Continuar al pago");
    checkoutButton.type = "button";
    checkoutButton.addEventListener("click", goToCheckout);
    const note = make("p", "flora-cart-note", "El pago se realizará de forma segura en Stripe.");
    footer.append(cartSummary, cartMessage, checkoutButton, note);

    drawer.append(header, cartItemsContainer, footer);
    backdrop.append(drawer);
    document.body.append(backdrop);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !backdrop.hidden) closeCart();
    });
  }

  function openCart() {
    if (!backdrop) return;
    backdrop.hidden = false;
    document.body.classList.add("flora-cart-is-open");
    renderCart();
    drawer.focus();
  }

  function closeCart() {
    if (!backdrop) return;
    backdrop.hidden = true;
    document.body.classList.remove("flora-cart-is-open");
    cartButton?.focus();
  }

  function updateCartButton() {
    if (!cartButton) return;
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countNode = cartButton.querySelector(".flora-cart-count");
    if (countNode) countNode.textContent = String(count);
    cartButton.setAttribute("aria-label", `Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`);
  }

  function addToCart(productId) {
    const product = productsById.get(productId);
    if (!product) return;
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      if (existing.quantity >= 10) {
        cartMessage.textContent = "Puedes añadir hasta 10 unidades de un mismo producto.";
        openCart();
        return;
      }
      existing.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }
    saveCart();
    openCart();
    cartMessage.textContent = `${product.name} se ha añadido al carrito. ♡`;
  }

  function updateQuantity(productId, delta) {
    const item = cart.find((entry) => entry.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== productId);
    if (item.quantity > 10) item.quantity = 10;
    saveCart();
  }

  function removeItem(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
  }

  function renderCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.replaceChildren();
    cartMessage.textContent = "";

    const validItems = cart
      .map((item) => ({ ...item, product: productsById.get(item.id) }))
      .filter((item) => item.product);

    if (validItems.length === 0) {
      cartItemsContainer.append(make("p", "flora-cart-empty", productsLoaded
        ? "Tu carrito está esperando cositas bonitas. ♡"
        : "Cargando tu carrito…"));
      cartSummary.replaceChildren();
      checkoutButton.disabled = true;
      updateCartButton();
      return;
    }

    let initialTotal = 0;
    let monthlyTotal = 0;

    validItems.forEach(({ id, quantity, product }) => {
      const itemTotal = product.price_cents * quantity;
      initialTotal += itemTotal;
      if (product.product_type === "subscription") monthlyTotal += itemTotal;

      const row = make("article", "flora-cart-item");
      const visual = make("div", "flora-cart-item-visual", product.symbol || "✿");
      const details = make("div", "flora-cart-item-details");
      details.append(make("h3", "", product.name));
      details.append(make("p", "flora-cart-seller", product.seller_name));
      details.append(make("p", "flora-cart-price", product.product_type === "subscription"
        ? `${euro(product.price_cents)} / mes`
        : euro(product.price_cents)));

      const actions = make("div", "flora-cart-item-actions");
      const minus = make("button", "flora-quantity-button", "−");
      minus.type = "button";
      minus.setAttribute("aria-label", `Quitar una unidad de ${product.name}`);
      minus.addEventListener("click", () => updateQuantity(id, -1));
      const quantityNode = make("span", "flora-quantity-value", String(quantity));
      const plus = make("button", "flora-quantity-button", "+");
      plus.type = "button";
      plus.setAttribute("aria-label", `Añadir una unidad de ${product.name}`);
      plus.disabled = quantity >= 10;
      plus.addEventListener("click", () => updateQuantity(id, 1));
      const remove = make("button", "flora-remove-button", "Eliminar");
      remove.type = "button";
      remove.addEventListener("click", () => removeItem(id));
      actions.append(minus, quantityNode, plus, remove);
      details.append(actions);

      const price = make("p", "flora-cart-line-total", product.product_type === "subscription"
        ? `${euro(itemTotal)} / mes`
        : euro(itemTotal));
      row.append(visual, details, price);
      cartItemsContainer.append(row);
    });

    cartSummary.replaceChildren();
    const todayRow = make("div", "flora-cart-total-row");
    todayRow.append(make("span", "", "Total inicial"), make("strong", "", euro(initialTotal)));
    cartSummary.append(todayRow);
    if (monthlyTotal > 0) {
      const recurringRow = make("div", "flora-cart-total-row flora-cart-recurring-row");
      recurringRow.append(make("span", "", "Renovación mensual"), make("strong", "", `${euro(monthlyTotal)} / mes`));
      cartSummary.append(recurringRow);
      cartSummary.append(make("p", "flora-cart-small-note", "Los Mail Clubs se cobrarán mensualmente hasta que se cancelen."));
    }

    checkoutButton.disabled = !API_BASE || !productsLoaded;
    updateCartButton();
  }

  function renderProductCard(product, index) {
    const card = make("article", "product-card flora-product-card");
    if (product.image_url) {
      const image = make("img", "flora-product-image");
      image.src = product.image_url;
      image.alt = product.name;
      image.loading = "lazy";
      image.onerror = () => {
        const fallback = make("div", "product-art flora-product-placeholder", product.symbol || "✿");
        image.replaceWith(fallback);
      };
      card.append(image);
    } else {
      const placeholder = make("div", `product-art flora-product-placeholder flora-art-${index % 4}`, product.symbol || "✿");
      card.append(placeholder);
    }

    card.append(make("p", "flora-product-seller", product.seller_name));
    card.append(make("h3", "", product.name));
    card.append(make("p", "flora-product-description", product.description || ""));
    card.append(make("p", "flora-product-price", product.product_type === "subscription"
      ? `${euro(product.price_cents)} / mes`
      : euro(product.price_cents)));

    const button = make("button", "button flora-add-button", product.product_type === "subscription"
      ? "Añadir Mail Club"
      : "Añadir al carrito");
    button.type = "button";
    button.addEventListener("click", () => addToCart(product.id));
    card.append(button);
    return card;
  }

  function renderCatalogs(products) {
    document.querySelectorAll("[data-flora-product-grid]").forEach((grid) => {
      const type = grid.dataset.floraProductGrid || "all";
      const sellerFilter = grid.dataset.floraSeller || "all";
      const visible = products.filter((product) =>
        (type === "all" || product.product_type === type) &&
        (sellerFilter === "all" || product.seller_key === sellerFilter)
      );
      grid.replaceChildren();
      if (visible.length === 0) {
        grid.append(make("p", "flora-catalog-empty", "Todavía no hay productos publicados en esta sección."));
        return;
      }
      visible.forEach((product, index) => grid.append(renderProductCard(product, index)));
    });
  }

  async function loadProducts() {
    if (!API_BASE) {
      showCatalogError("Falta configurar la dirección del backend en flora-config.js.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/products`, { headers: { "Accept": "application/json" } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se ha podido cargar el catálogo.");
      const products = Array.isArray(data.products) ? data.products : [];
      products.forEach((product) => productsById.set(product.id, product));
      productsLoaded = true;
      renderCatalogs(products);
      renderCart();
    } catch (error) {
      showCatalogError(error.message || "No se ha podido conectar con la tienda.");
      if (cartMessage) cartMessage.textContent = error.message || "No se ha podido conectar con la tienda.";
    }
  }

  function showCatalogError(message) {
    document.querySelectorAll("[data-flora-product-grid]").forEach((grid) => {
      grid.replaceChildren(make("p", "flora-catalog-error", message));
    });
  }

  async function goToCheckout() {
    if (!API_BASE || cart.length === 0 || checkoutButton.disabled) return;
    checkoutButton.disabled = true;
    checkoutButton.textContent = "Preparando el pago…";
    cartMessage.textContent = "Estamos preparando tu compra de forma segura.";

    try {
      const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ items: cart })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se ha podido iniciar el pago.");
      const checkoutUrl = new URL(data.url);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
        throw new Error("Stripe ha devuelto una dirección de pago no reconocida.");
      }
      window.location.assign(checkoutUrl.href);
    } catch (error) {
      cartMessage.textContent = error.message || "No se ha podido iniciar el pago.";
      checkoutButton.disabled = false;
      checkoutButton.textContent = "Volver a intentarlo";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildCartUI();
    updateCartButton();
    loadProducts();

    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancelado") {
      openCart();
      if (cartMessage) cartMessage.textContent = "No se ha realizado el pago. Tu carrito sigue guardado. ♡";
    }
  });
})();
