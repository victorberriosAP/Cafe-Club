# Parche de registro de Café Club

Este paquete reemplaza el formulario de registro y su integración JavaScript, y agrega una función de Vercel para comunicar el frontend con Google Apps Script sin depender de CORS en el navegador.

## Archivos incluidos

- `registro.html`: formulario actualizado, inicio de sesión con Google y crédito obligatorio de ITERA.
- `assets/js/app.js`: versión basada en el JavaScript original del proyecto. La integración real reemplaza únicamente el flujo de registro; las demás pantallas de demostración se conservan.
- `api/registro.js`: proxy de Vercel hacia la aplicación web de Google Apps Script.

## Antes de publicar

1. Copia `registro.html` a la raíz del proyecto.
2. Reemplaza `assets/js/app.js` por el incluido.
3. Crea la carpeta `api` en la raíz y coloca allí `registro.js`.
4. En la configuración del proyecto de Vercel, agrega una variable de entorno:
   - Nombre: `CAFE_CLUB_APPS_SCRIPT_URL`
   - Valor: la URL de implementación de Apps Script que termina en `/exec`
5. Vuelve a desplegar el proyecto.
6. En Google Cloud Console, revisa que el ID de cliente OAuth usado por el formulario tenga autorizados los orígenes JavaScript de tu web, por ejemplo `https://TU-DOMINIO.vercel.app` y tu dominio personalizado si tienes uno.
7. En Apps Script, confirma que la implementación está actualizada y que el usuario que ejecuta la aplicación tiene acceso de escritura a la hoja de cálculo.

## Comprobación de datos

- La pestaña `Cafeterias` debe tener cafeterías con `slug` iguales a `aroma`, `central` y `sur` (o ajusta las opciones del formulario) y `estado` igual a `activo`.
- La pestaña `Clientes` debe conservar los encabezados esperados por `Code.gs`.
- El formulario envía el ID token de Google a Apps Script; el servidor verifica el token antes de guardar.
- El correo mostrado en el formulario es solo informativo: Apps Script utiliza el correo obtenido del token verificado.

## Limitaciones que se mantienen

Las páginas de tarjeta y panel de personal continúan utilizando los datos demo de `localStorage` del JavaScript original. Este parche conecta el alta del cliente a Google Sheets, pero no conecta todavía las consultas de tarjeta, visitas ni canjes con Sheets.

No uses datos personales reales para la primera prueba. Registra un cliente de prueba y verifica que aparece una única fila en `Clientes`.

## Seguridad

No guardes contraseñas ni secretos en el frontend. El Client ID de OAuth no es una contraseña, pero debe tener sus orígenes autorizados correctamente configurados. La URL de Apps Script se guarda en una variable de entorno de Vercel. El backend debe validar siempre los datos; el frontend no es una barrera de seguridad.
