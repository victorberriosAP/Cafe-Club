<!-- README.md -->

# Café Club — Plataforma de Fidelización Digital para Cafeterías

Café Club es una aplicación web multipágina orientada a la fidelización de clientes en múltiples cafeterías mediante tarjetas digitales y acumulación de estrellas.

## 📁 Estructura de Carpetas

- `index.html` — Página de presentación y bienvenida.
- `registro.html` — Formulario de registro de clientes (compatible con parámetro `?cafe=slug`).
- `tarjeta.html` — Tarjeta digital interactiva de 10 estrellas y recompensas.
- `premios.html` — Listado de recompensas y beneficios de cumpleaños.
- `cafeterias.html` — Directorio de locales y generador de códigos QR con enlaces públicos.
- `staff.html` — Panel del trabajador para simulación de visitas y suma de estrellas.
- `admin.html` — Panel de administración global.
- `assets/css/styles.css` — Estilos personalizados con identidad visual cálida.
- `assets/js/app.js` — Lógica en JavaScript vanilla y almacenamiento local (`localStorage`).

---

## 🚀 Cómo abrirlo localmente con Visual Studio Code

1. Clona o descarga este repositorio en tu computador.
2. Abre la carpeta del proyecto en **Visual Studio Code**.
3. Instala la extensión **Live Server** (si no la tienes).
4. Haz clic derecho sobre `index.html` y selecciona **"Open with Live Server"**.

---

## 🌐 Cómo publicarlo en Vercel y GitHub

1. **Subir a GitHub:**
   - Crea un repositorio nuevo en tu cuenta de GitHub.
   - Sube todos los archivos raíz (`.html`, carpeta `assets/`, `README.md`).
2. **Desplegar en Vercel:**
   - Inicia sesión en [Vercel](https://vercel.com/) con tu cuenta de GitHub.
   - Haz clic en **"Add New..." > "Project"** e importa el repositorio de Café Club.
   - Mantén la configuración por defecto de sitio estático y haz clic en **Deploy**.

---

## 📱 Cómo probar las páginas desde un teléfono

Una vez publicado en Vercel, copia la URL pública de tu sitio y ábrela en el navegador de tu teléfono móvil para probar la adaptabilidad responsiva y el funcionamiento táctil.

---

## 🖨️ Cómo generar los QR después de publicar

En la sección **Cafeterías** (`cafeterias.html`), haz clic en el botón **"Ver QR"** de cualquier local. El sistema generará automáticamente el código QR utilizando la URL pública definitiva de Vercel y te permitirá copiar el enlace de registro.

---

## ⚠️ Limitaciones del Prototipo

- Utiliza `localStorage` del navegador, por lo que los datos no se sincronizan entre distintos dispositivos ni usuarios reales.
- El panel de Staff es una simulación visual y no cuenta con autenticación segura por contraseñas o tokens.

---

## 🔄 Próximos Pasos (Backend & Google Apps Script)

Para llevar este prototipo a producción comercial:

1. Conectar las solicitudes con un script de Google Apps Script (`Google Sheets` como base de datos central).
2. Implementar autenticación real mediante Google Identity Services (OAuth2).
3. Configurar automatizaciones con Gmail API para correos de bienvenida y campañas de inactividad.
