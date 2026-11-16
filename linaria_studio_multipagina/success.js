(() => {
  document.addEventListener("DOMContentLoaded", async () => {
    const message = document.querySelector("[data-payment-status]");
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const apiBase = String(window.FLORA_CONFIG?.API_BASE || "").replace(/\/+$/, "");

    if (!message || !sessionId || !apiBase) {
      if (message) message.textContent = "No hemos podido verificar el pago desde esta página. Comprueba el correo de Stripe antes de dar el pedido por confirmado.";
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/checkout-session-status?session_id=${encodeURIComponent(sessionId)}`);
      const data = await response.json();
      if (!response.ok || !data.paid) {
        message.textContent = "El pago todavía no aparece como confirmado. No te preocupes: consulta el recibo de Stripe o contacta con nosotras antes de repetirlo.";
        return;
      }

      localStorage.removeItem("flora-studio-cart-v1");
      message.textContent = "¡Tu pago está confirmado! Recibirás el recibo de Stripe en tu correo. Estamos preparando tus cositas bonitas. ♡";
    } catch {
      message.textContent = "No hemos podido consultar el estado ahora mismo. Comprueba el recibo de Stripe antes de dar el pedido por confirmado.";
    }
  });
})();
