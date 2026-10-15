/* Café Club - JavaScript de demostración.
   Importante: localStorage NO es una base de datos compartida ni segura.
   Sirve para probar pantallas. En producción, reemplazar por llamadas a una API. */
(() => {
  "use strict";

  const STORAGE_KEY = "cafeClubPrototypeData";
  const CAFE_NAMES = { aroma: "Café Aroma", central: "Café Central", sur: "Café del Sur" };

  // Datos iniciales para que las páginas se vean completas desde la primera apertura.
  function demoData() {
    return {
      clients: [{
        id: "demo-ana", cafeId: "aroma", name: "Ana Pérez", email: "ana.demo@example.com",
        birthday: "", privacyConsent: true, marketingConsent: false, stars: 6, createdAt: new Date().toISOString()
      }],
      activity: [
        { id: "act-1", cafeId: "aroma", clientId: "demo-ana", name: "Ana Pérez", type: "Registro demo", date: new Date().toISOString() }
      ],
      redemptions: []
    };
  }
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : demoData();
    } catch (error) {
      console.warn("No se pudieron leer los datos demo.", error);
      return demoData();
    }
  }
  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  }

  // Registro real: Google Identity Services + API de Vercel + Google Apps Script.
  // El token de Google solo se mantiene en memoria; nunca se guarda en localStorage.
  const registrationForm = document.querySelector("#registrationForm");
  if (registrationForm) {
    const params = new URLSearchParams(window.location.search);
    const cafeParam = params.get("cafe");
    const cafeSelect = document.querySelector("#cafeId");
    const nameInput = document.querySelector("#fullName");
    const emailInput = document.querySelector("#email");
    const birthdayInput = document.querySelector("#birthday");
    const privacyInput = document.querySelector("#privacyConsent");
    const marketingInput = document.querySelector("#marketingConsent");
    const message = document.querySelector("#registrationMessage");
    const googleButton = document.querySelector("#googleSignInButton");
    const googleStatus = document.querySelector("#googleSignInStatus");
    const submitButton = registrationForm.querySelector('button[type="submit"]');

    let googleCredential = null;
    let googleIdentity = null;
    let registrationComplete = false;

    if (cafeParam && CAFE_NAMES[cafeParam]) cafeSelect.value = cafeParam;

    function showRegistrationMessage(type, text) {
      message.replaceChildren();
      const alert = document.createElement("div");
      alert.className = "alert alert-" + type;
      alert.setAttribute("role", "status");
      alert.textContent = text;
      message.appendChild(alert);
    }

    function decodeGoogleCredential(credential) {
      try {
        const payload = credential.split(".")[1]
          .replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(payload.padEnd(payload.length + (4 - payload.length % 4) % 4, "="));
        return JSON.parse(decodeURIComponent(
          Array.from(decoded, char => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")).join("")
        ));
      } catch (error) {
        return null;
      }
    }

    function handleGoogleCredential(response) {
      if (!response || !response.credential) {
        googleCredential = null;
        googleIdentity = null;
        googleStatus.textContent = "No se pudo iniciar sesión con Google. Inténtalo nuevamente.";
        googleStatus.className = "small text-danger mt-2";
        return;
      }

      const identity = decodeGoogleCredential(response.credential);
      if (!identity || !identity.email) {
        googleCredential = null;
        googleIdentity = null;
        googleStatus.textContent = "Google no devolvió un correo válido. Inténtalo nuevamente.";
        googleStatus.className = "small text-danger mt-2";
        return;
      }

      googleCredential = response.credential;
      googleIdentity = identity;
      if (!nameInput.value.trim() && identity.name) nameInput.value = identity.name;
      emailInput.value = identity.email;
      emailInput.readOnly = true;
      emailInput.setAttribute("aria-readonly", "true");
      googleStatus.textContent = "Sesión iniciada como " + identity.email + ". Ya puedes crear tu tarjeta.";
      googleStatus.className = "small text-success mt-2";
      showRegistrationMessage("info", "Cuenta de Google verificada en el navegador. Completa el formulario y crea tu tarjeta.");
    }

    function initializeGoogleSignIn() {
      const clientId = "31756994840-b1a3hbpdal3bu5tb2jfq3vb0atvthn24.apps.googleusercontent.com";
      const google = window.google;
      if (!google || !google.accounts || !google.accounts.id) {
        googleStatus.textContent = "No se pudo cargar el inicio de sesión de Google. Comprueba tu conexión y recarga la página.";
        googleStatus.className = "small text-danger mt-2";
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        google.accounts.id.renderButton(googleButton, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: 320,
          locale: "es"
        });
      } catch (error) {
        console.error("No se pudo inicializar Google Identity Services.", error);
        googleStatus.textContent = "No se pudo preparar el botón de Google. Revisa la configuración del cliente OAuth.";
        googleStatus.className = "small text-danger mt-2";
      }
    }

    window.addEventListener("load", initializeGoogleSignIn);
    // En algunos navegadores el evento load puede haberse disparado antes de ejecutar este bloque.
    if (document.readyState === "complete") initializeGoogleSignIn();

    registrationForm.addEventListener("submit", async event => {
      event.preventDefault();
      registrationForm.classList.add("was-validated");

      if (!registrationForm.checkValidity()) {
        showRegistrationMessage("warning", "Revisa los campos obligatorios antes de continuar.");
        registrationForm.querySelector(":invalid")?.focus();
        return;
      }

      if (!googleCredential || !googleIdentity) {
        showRegistrationMessage("warning", "Primero inicia sesión con Google usando el botón de arriba.");
        googleButton.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (!privacyInput.checked) {
        showRegistrationMessage("warning", "Debes aceptar el aviso de privacidad para crear tu tarjeta.");
        privacyInput.focus();
        return;
      }

      const payload = {
        accion: "registrarCliente",
        credential: googleCredential,
        nombre: nameInput.value.trim(),
        fechaNacimiento: birthdayInput.value,
        cafe: cafeSelect.value,
        aceptaPrivacidad: privacyInput.checked,
        aceptaMarketing: marketingInput.checked
      };

      submitButton.disabled = true;
      submitButton.textContent = "Creando tu tarjeta…";
      showRegistrationMessage("info", "Estamos guardando tu registro. No cierres esta página todavía.");

      try {
        const response = await fetch("/api/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin"
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result) {
          throw new Error(result && result.mensaje
            ? result.mensaje
            : "No pudimos comunicarnos con el servidor. Inténtalo nuevamente.");
        }
        if (!result.correcto) {
          throw new Error(result.mensaje || "No se pudo crear la tarjeta.");
        }

        if (result.existente) {
          showRegistrationMessage("info", result.mensaje || "Ya existe una tarjeta asociada a esta cuenta de Google.");
          registrationComplete = true;
          submitButton.textContent = "Tarjeta ya registrada";
        } else {
          showRegistrationMessage("success", result.mensaje || "Tu tarjeta se ha creado correctamente en Café Club.");
          registrationComplete = true;
          submitButton.textContent = "Tarjeta creada";
          googleStatus.textContent = "Registro completado correctamente.";
          googleStatus.className = "small text-success mt-2";
        }
      } catch (error) {
        console.error("Error al registrar cliente:", error);
        showRegistrationMessage("danger", error.message || "Ocurrió un error al guardar tu registro.");
      } finally {
        // Solo se desactiva después de confirmar que la tarjeta ya existe o se creó.
        // Si hubo un error de red o validación del servidor, el usuario puede reintentar.
        submitButton.disabled = registrationComplete;
        if (!registrationComplete) submitButton.textContent = "Crear mi tarjeta";
      }
    });
  }

  // Tarjeta: muestra la ficha más reciente del navegador. No es una identificación segura.
  if (document.querySelector("#starGrid")) {
    const data = loadData();
    const client = data.clients[data.clients.length - 1] || demoData().clients[0];
    const stars = Math.max(0, Math.min(10, Number(client.stars) || 0));
    document.querySelector("#cardName").textContent = "¡Hola, " + client.name.split(" ")[0] + "!";
    document.querySelector("#cardCafe").textContent = CAFE_NAMES[client.cafeId] || "Cafetería";
    document.querySelector("#starCount").textContent = stars;
    document.querySelector("#progressLabel").textContent = (stars * 10) + "% completado";
    document.querySelector("#cardProgress").style.width = (stars * 10) + "%";
    document.querySelector("#nextReward").textContent = stars >= 10 ? "¡Recompensa disponible! Pide al equipo que valide el canje." : "Te faltan " + (10 - stars) + " estrellas para un café gratis.";
    document.querySelector("#starGrid").innerHTML = Array.from({ length: 10 }, (_, i) =>
      '<span class="star-dot ' + (i < stars ? "earned" : "") + '" aria-label="Estrella ' + (i + 1) + '">' + (i < stars ? "★" : "☆") + "</span>"
    ).join("");
    document.querySelector("#coffeeRewardStatus").textContent = stars >= 10 ? "Disponible (demo)" : "En progreso";
    document.querySelector("#coffeeRewardStatus").className = "badge mt-1 " + (stars >= 10 ? "text-bg-success" : "text-bg-secondary");
  }

  // Panel de personal: búsqueda, suma de una estrella e historial demo.
  const staffSearch = document.querySelector("#clientSearch");
  if (staffSearch) {
    let selectedClientId = null;
    const cafeSelect = document.querySelector("#staffCafe");
    const result = document.querySelector("#clientResult");
    const addButton = document.querySelector("#addStarBtn");
    const message = document.querySelector("#staffMessage");

    function renderPanel() {
      const data = loadData();
      const cafeId = cafeSelect.value;
      const clients = data.clients.filter(c => c.cafeId === cafeId);
      document.querySelector("#statClients").textContent = clients.length;
      document.querySelector("#statStars").textContent = clients.reduce((sum, c) => sum + (Number(c.stars) || 0), 0);
      document.querySelector("#statRedeemed").textContent = data.redemptions.filter(r => r.cafeId === cafeId).length;
      const activity = data.activity.filter(a => a.cafeId === cafeId).slice(0, 8);
      document.querySelector("#activityTable").innerHTML = activity.length ? activity.map(a =>
        "<tr><td>" + escapeHtml(a.name) + "</td><td>" + escapeHtml(a.type) + "</td><td>" + formatDate(a.date) + "</td></tr>"
      ).join("") : '<tr><td colspan="3" class="text-secondary">Aún no hay movimientos.</td></tr>';
      renderSearch();
    }
    function renderSearch() {
      const data = loadData();
      const query = staffSearch.value.trim().toLowerCase();
      const matches = data.clients.filter(c => c.cafeId === cafeSelect.value &&
        (!query || c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)));
      result.innerHTML = matches.slice(0, 5).map(c =>
        '<button type="button" class="client-result w-100 text-start mb-2 ' + (c.id === selectedClientId ? "selected" : "") + '" data-client-id="' + c.id + '">' +
        '<strong>' + escapeHtml(c.name) + '</strong><div class="small text-secondary">' + escapeHtml(c.email) + '</div><div class="small mt-1">Estrellas: ' + c.stars + '/10</div></button>'
      ).join("") || '<p class="small text-secondary">No se encontraron clientes en esta cafetería.</p>';
      result.querySelectorAll("[data-client-id]").forEach(button => button.addEventListener("click", () => {
        selectedClientId = button.dataset.clientId;
        addButton.disabled = false;
        renderSearch();
      }));
      if (selectedClientId && !matches.some(c => c.id === selectedClientId)) {
        selectedClientId = null;
        addButton.disabled = true;
      }
    }
    staffSearch.addEventListener("input", renderSearch);
    cafeSelect.addEventListener("change", () => { selectedClientId = null; addButton.disabled = true; message.innerHTML = ""; renderPanel(); });
    addButton.addEventListener("click", () => {
      const data = loadData();
      const client = data.clients.find(c => c.id === selectedClientId && c.cafeId === cafeSelect.value);
      if (!client) return;
      if (client.stars >= 10) {
        message.innerHTML = '<div class="alert alert-warning">Este cliente ya alcanzó 10 estrellas. El canje todavía debe implementarse.</div>';
        return;
      }
      client.stars += 1;
      data.activity.unshift({ id: makeId("act"), cafeId: client.cafeId, clientId: client.id, name: client.name, type: "Visita +1 estrella", date: new Date().toISOString() });
      saveData(data);
      message.innerHTML = '<div class="alert alert-success">Estrella demo registrada para ' + escapeHtml(client.name) + '.</div>';
      renderPanel();
    });
    document.querySelector("#resetDemoBtn").addEventListener("click", () => {
      if (!confirm("¿Reiniciar los datos de demostración de este navegador?")) return;
      saveData(demoData());
      selectedClientId = null; addButton.disabled = true; message.innerHTML = "";
      renderPanel();
    });
    renderPanel();
  }

  // QR de muestra: la imagen se genera desde un servicio externo. Usar solo al publicar URLs públicas.
  document.querySelectorAll("[data-qr-url]").forEach(button => {
    button.addEventListener("click", () => {
      const preview = button.parentElement.querySelector(".qr-preview");
      const fullUrl = new URL(button.dataset.qrUrl, window.location.href).href;
      preview.classList.remove("d-none");
      preview.innerHTML = "<strong>" + escapeHtml(button.dataset.cafeName) + "</strong>" +
        '<img alt="QR de registro para ' + escapeHtml(button.dataset.cafeName) + '" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(fullUrl) + '">' +
        '<div class="small text-secondary">Destino del QR:</div><code></code><button type="button" class="btn btn-sm btn-outline-secondary mt-2">Copiar enlace</button>';
      preview.querySelector("code").textContent = fullUrl;
      preview.querySelector("button").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(fullUrl);
          preview.querySelector("button").textContent = "Enlace copiado";
        } catch {
          preview.querySelector("code").textContent = fullUrl + " (cópialo manualmente)";
        }
      });
    });
  });

  // Evita insertar nombres/correos como HTML en los resultados del panel.
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }
})();
