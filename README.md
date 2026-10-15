<!-- README.md -->
# Café Club — Plataforma de Fidelización Digital Multisucursal

Café Club es una plataforma web modular adaptada para una tienda de café con distintas sucursales. Permite a los clientes registrarse mediante Google OAuth o formulario, acumular estrellas universales y canjear premios en cualquier local.

## 📁 Estructura de Archivos

- `index.html` — Inicio y presentación.
- `registro.html` — Registro con Google Sign-In y formulario.
- `tarjeta.html` — Tarjeta digital multisucursal con 10 casillas de estrellas.
- `premios.html` — Recompensas, café gratis y beneficios de cumpleaños.
- `cafeterias.html` — Listado de sucursales y generador de código QR universal.
- `staff.html` — Panel del trabajador para simulación de visitas.
- `index_admin.html` — Panel de administración global protegido.
- `assets/css/styles.css` — Estilos personalizados con identidad visual cálida.
- `assets/js/app.js` — Lógica frontend en JavaScript vanilla.
- `README.md` — Documentación del proyecto.

---

## 🚀 Cómo abrirlo localmente con VS Code y Live Server
1. Abre la carpeta del proyecto en **Visual Studio Code**.
2. Instala la extensión **Live Server**.
3. Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

---

## 🌐 Cómo publicarlo en GitHub y Vercel
1. Sube todos los archivos a un repositorio nuevo en **GitHub**.
2. Entra a [Vercel](https://vercel.com/), haz clic en **"Add New Project"** e importa tu repositorio de GitHub.
3. Mantén los ajustes por defecto de sitio estático y haz clic en **Deploy**.

---

## 📱 Cómo probar desde un teléfono
Abre la URL pública generada por Vercel en el navegador móvil para verificar la adaptabilidad responsive y el escaneo del QR universal.

---

## 🔄 Conexión con Google Apps Script y Google Sheets
El código está preparado modularmente para conectar con un Web App de Google Apps Script que almacene datos en Google Sheets y despache correos automatizados (como alertas de cumpleaños con Gmail API).