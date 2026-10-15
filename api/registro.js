// Vercel Serverless Function: proxy entre el frontend y Google Apps Script.
// Configura CAFE_CLUB_APPS_SCRIPT_URL en Vercel con la URL publicada que termina en /exec.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ correcto: false, mensaje: "Método no permitido." });
  }

  const scriptUrl = process.env.CAFE_CLUB_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return res.status(500).json({
      correcto: false,
      mensaje: "Falta configurar la URL de Google Apps Script en las variables de entorno de Vercel."
    });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(scriptUrl);
  } catch {
    return res.status(500).json({
      correcto: false,
      mensaje: "La URL configurada para Google Apps Script no es válida."
    });
  }

  if (parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "script.google.com" ||
      !parsedUrl.pathname.includes("/macros/s/") ||
      !parsedUrl.pathname.endsWith("/exec")) {
    return res.status(500).json({
      correcto: false,
      mensaje: "Configura una URL HTTPS válida de una aplicación web de Apps Script que termine en /exec."
    });
  }

  let body = req.body;
  try {
    if (typeof body === "string") body = JSON.parse(body);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
  } catch {
    return res.status(400).json({ correcto: false, mensaje: "La solicitud no contiene JSON válido." });
  }

  if (body.accion !== "registrarCliente" ||
      typeof body.credential !== "string" ||
      typeof body.nombre !== "string" ||
      typeof body.cafe !== "string") {
    return res.status(400).json({
      correcto: false,
      mensaje: "Faltan datos obligatorios para registrar la tarjeta."
    });
  }

  try {
    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow"
    });

    const raw = await upstream.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      console.error("Respuesta inesperada de Apps Script:", raw.slice(0, 500));
      return res.status(502).json({
        correcto: false,
        mensaje: "Google Apps Script devolvió una respuesta que no pudimos interpretar. Revisa que la aplicación web esté desplegada con acceso adecuado."
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al contactar Google Apps Script:", error);
    return res.status(502).json({
      correcto: false,
      mensaje: "No pudimos contactar con Google Apps Script. Revisa el despliegue y vuelve a intentarlo."
    });
  }
}
