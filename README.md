# Café Club — prototipo de fidelización digital

Prototipo multipágina en HTML, Bootstrap 5, CSS y JavaScript para explorar la experiencia antes de conectar un backend.

## Archivos
- `index.html`: inicio y explicación del programa.
- `registro.html`: formulario de registro.
- `tarjeta.html`: tarjeta digital de estrellas y beneficios.
- `premios.html`: catálogo de recompensas.
- `cafeterias.html`: listado demo de cafeterías y generador visual de QR.
- `staff.html`: panel de trabajador para buscar clientes y simular una visita.
- `assets/css/styles.css`: estilos personalizados.
- `assets/js/app.js`: comportamiento de demostración.

## Probar en local
1. Descarga y descomprime el ZIP.
2. Abre la carpeta en VS Code.
3. Recomendado: usa la extensión Live Server y abre `index.html`.
4. Navega por las páginas desde el menú.

También puedes publicar la carpeta en un repositorio GitHub y conectar ese repositorio a Vercel como sitio estático.

## QR
En `cafeterias.html`, el botón “Mostrar QR de registro” genera un QR para la URL actual y el slug de cafetería. Una vez publicado en Vercel, vuelve a abrir la página pública y genera el QR. Para imprimirlo, comprueba que la URL de destino sea la definitiva.

La generación de QR de esta demo usa un servicio externo (api.qrserver.com). No envía datos personales, pero sí recibe la URL que se codifica. Para producción, puedes generar el QR localmente con una biblioteca JavaScript o usar un generador confiable.

## Limitaciones importantes
- Los datos se guardan en `localStorage`: solo existen en el navegador y dispositivo actual; no se comparten entre clientes o trabajadores.
- El panel de trabajador no tiene autenticación. No uses el prototipo para administrar clientes reales.
- El formulario no envía correos y no se conecta a Google Sheets.
- El enlace a tarjeta es una demo visual, no un acceso de cliente autenticado.
- Las rutas de ejemplo no son permisos ni controles de seguridad.

## Siguiente etapa
1. Conectar `registro.html` con un backend (por ejemplo, Google Apps Script).
2. Implementar autenticación real para el personal y autorización por `cafeId`.
3. Registrar cada visita como movimiento único en el servidor.
4. Implementar canjes idempotentes, auditoría y límites para evitar estrellas duplicadas.
5. Configurar correo de forma programada, consentimiento promocional y bajas de suscripción.
6. Probar cuotas, seguridad, CORS/redirecciones y privacidad antes de publicar para uso real.
