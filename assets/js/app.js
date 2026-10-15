/* assets/js/app.js — Conectado a Google Sheets Apps Script */

// PEGA AQUÍ TU URL DE LA APLICACIÓN WEB DE GOOGLE APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycbwSVgDzlYoT2DT5V4JjPN73TOQVnlV3Ea9-TWYxfmxuZ8BHJEoda-ohiFNCNGk7lgos/exec';

document.addEventListener('DOMContentLoaded', () => {
  inicializarAppReal();
});

async function inicializarAppReal() {
  await cargarCafeteriasRemotas();
  manejarRegistroReal();
  renderizarTarjetaReal();
  manejarStaffReal();
  renderizarAdminReal();
}

/**
 * Obtiene las cafeterías desde Google Sheets
 */
async function cargarCafeteriasRemotas() {
  try {
    const respuesta = await fetch(`${API_URL}?accion=obtenerDatosPublicos`);
    const resultado = await respuesta.json();
    if (resultado.correcto && resultado.cafeterias.length > 0) {
      window.CAFETERIAS_DATA = resultado.cafeterias;
    } else {
      cargarCafeteriasFallback();
    }
  } catch (e) {
    console.warn('Usando respaldo local de cafeterías por fallo de red:', e);
    cargarCafeteriasFallback();
  }
  renderizarCafeteriasDirectorio();
  poblarSelectsStaff();
}

function cargarCafeteriasFallback() {
  window.CAFETERIAS_DATA = [
    { cafeteriaId: 'cafe_aroma', nombre: 'Aroma de Barrio', slug: 'aroma', direccion: 'Av. Providencia 1234' },
    { cafeteriaId: 'cafe_moka', nombre: 'Moka Express', slug: 'moka', direccion: 'Calle Huérfanos 567' },
    { cafeteriaId: 'cafe_zen', nombre: 'Zenith Specialty Coffee', slug: 'zen', direccion: 'Vitacura 4000' }
  ];
}

/**
 * Manejo del Registro (formulario y Google Sign-In)
 */
window.handleCredentialResponse = async function(response) {
  try {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const identidad = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    
    const urlParams = new URLSearchParams(window.location.search);
    const cafeSlug = urlParams.cafe || urlParams.get('cafe') || 'aroma';

    const datosEnvio = {
      accion: 'registrarCliente',
      googleSub: identidad.sub,
      nombre: identidad.name,
      email: identidad.email,
      fechaNacimiento: '',
      cafe: cafeSlug,
      aceptaMarketing: true
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(datosEnvio)
    });
    const resultado = await res.json();

    if (resultado.correcto) {
      localStorage.setItem('cafe_club_email_activo', identidad.email);
      mostrarAlertaRegistro('alert-success', '¡Autenticación con Google exitosa! Redirigiendo a tu tarjeta...');
      setTimeout(() => window.location.href = 'tarjeta.html', 1500);
    } else {
      mostrarAlertaRegistro('alert-danger', resultado.mensaje);
    }
  } catch (err) {
    mostrarAlertaRegistro('alert-danger', 'Error al procesar tu cuenta de Google.');
  }
};

function manejarRegistroReal() {
  const formRegistro = document.getElementById('form-registro');
  if (!formRegistro) return;

  const urlParams = new URLSearchParams(window.location.search);
  const cafeSlug = urlParams.cafe || urlParams.get('cafe');
  const subtituloCafe = document.getElementById('subtitulo-cafe');

  setTimeout(() => {
    const cafes = window.CAFETERIAS_DATA || [];
    const encontrada = cafes.find(c => c.slug === cafeSlug) || cafes[0];
    if (encontrada && subtituloCafe) {
      subtituloCafe.textContent = `Registrándote en ${encontrada.nombre}`;
    }
  }, 500);

  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const terminos = document.getElementById('terminos').checked;
    const promos = document.getElementById('promos').checked;

    if (!nombre || !email || !terminos) {
      mostrarAlertaRegistro('alert-danger', 'Completa los campos obligatorios y acepta los términos.');
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          accion: 'registrarCliente',
          nombre,
          email,
          fechaNacimiento,
          cafe: cafeSlug || 'aroma',
          aceptaMarketing: promos
        })
      });
      const resultado = await res.json();

      if (resultado.correcto) {
        localStorage.setItem('cafe_club_email_activo', email);
        mostrarAlertaRegistro('alert-success', resultado.mensaje + ' Redirigiendo...');
        setTimeout(() => window.location.href = 'tarjeta.html', 1500);
      } else {
        mostrarAlertaRegistro('alert-danger', resultado.mensaje);
      }
    } catch (err) {
      mostrarAlertaRegistro('alert-danger', 'Error de conexión con Google Sheets.');
    }
  });
}

function mostrarAlertaRegistro(clase, mensaje) {
  const alerta = document.getElementById('alerta-registro');
  if (!alerta) return;
  alerta.className = `alert ${clase}`;
  alerta.textContent = mensaje;
  alerta.classList.remove('d-none');
}

/**
 * Tarjeta Digital consultando directamente Google Sheets
 */
async function renderizarTarjetaReal() {
  const sinTarjeta = document.getElementById('sin-tarjeta');
  const conTarjeta = document.getElementById('con-tarjeta');
  if (!sinTarjeta || !conTarjeta) return;

  const emailActivo = localStorage.getItem('cafe_club_email_activo');
  if (!emailActivo) {
    sinTarjeta.classList.remove('d-none');
    conTarjeta.classList.add('d-none');
    return;
  }

  try {
    const res = await fetch(`${API_URL}?accion=consultarCliente&email=${encodeURIComponent(emailActivo)}`);
    const resultado = await res.json();

    if (!resultado.correcto) {
      sinTarjeta.classList.remove('d-none');
      conTarjeta.classList.add('d-none');
      return;
    }

    const cliente = resultado.cliente;
    sinTarjeta.classList.add('d-none');
    conTarjeta.classList.remove('d-none');

    document.getElementById('tarjeta-nombre').textContent = cliente.nombre;
    const cafes = window.CAFETERIAS_DATA || [];
    const cafeObj = cafes.find(c => c.cafeteriaId === cliente.cafeteriaId) || cafes[0];
    document.getElementById('tarjeta-cafe').textContent = cafeObj ? cafeObj.nombre : 'Café Club';
    document.getElementById('tarjeta-estrellas-num').textContent = cliente.estrellas;

    const grid = document.getElementById('tarjeta-estrellas-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const slot = document.createElement('div');
      slot.className = `star-slot ${i <= cliente.estrellas ? 'filled' : ''}`;
      slot.innerHTML = i <= cliente.estrellas ? '⭐' : i;
      grid.appendChild(slot);
    }

    const estadoReq = document.getElementById('tarjeta-estado-recompensa');
    if (cliente.estrellas >= 10) {
      estadoReq.textContent = '🎉 ¡Felicidades! Tienes un café gratis disponible para canjear.';
    } else {
      estadoReq.textContent = `¡Te faltan ${10 - cliente.estrellas} estrellas para tu café gratis!`;
    }

    const btnReset = document.getElementById('btn-reset-demo');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        localStorage.removeItem('cafe_club_email_activo');
        location.reload();
      });
    }
  } catch (e) {
    console.error('Error al cargar tarjeta desde Google Sheets:', e);
  }
}

/**
 * Directorio y códigos QR públicos
 */
function renderizarCafeteriasDirectorio() {
  const contenedor = document.getElementById('lista-cafeterias');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  const urlBase = window.location.origin + window.location.pathname.replace('cafeterias.html', '');
  const cafes = window.CAFETERIAS_DATA || [];

  cafes.forEach(cafe => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    const enlaceRegistro = `${urlBase}registro.html?cafe=${cafe.slug}`;

    col.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white d-flex flex-column">
        <h3 class="h5 fw-bold mb-2">${cafe.nombre}</h3>
        <p class="text-muted small mb-3">📍 ${cafe.direccion}</p>
        <div class="mt-auto d-flex gap-2">
          <a href="registro.html?cafe=${cafe.slug}" class="btn btn-primary btn-sm flex-grow-1">Registrarse</a>
          <button class="btn btn-outline-secondary btn-sm btn-ver-qr" data-nombre="${cafe.nombre}" data-url="${enlaceRegistro}">Ver QR</button>
        </div>
      </div>
    `;
    contenedor.appendChild(col);
  });

  document.querySelectorAll('.btn-ver-qr').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nombre = e.target.getAttribute('data-nombre');
      const url = e.target.getAttribute('data-url');
      document.getElementById('qr-nombre-cafe').textContent = `Registro para ${nombre}`;
      document.getElementById('input-url-qr').value = url;
      document.getElementById('imagen-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      new bootstrap.Modal(document.getElementById('modalQR')).show();
    });
  });

  const btnCopiar = document.getElementById('btn-copiar-enlace');
  if (btnCopiar) {
    btnCopiar.addEventListener('click', () => {
      const inputUrl = document.getElementById('input-url-qr');
      inputUrl.select();
      navigator.clipboard.writeText(inputUrl.value);
      const toast = document.getElementById('toast-copiado');
      toast.classList.remove('d-none');
      setTimeout(() => toast.classList.add('d-none'), 2000);
    });
  }
}

function poblarSelectsStaff() {
  const selectCafe = document.getElementById('staff-select-cafe');
  if (!selectCafe) return;
  selectCafe.innerHTML = '';
  (window.CAFETERIAS_DATA || []).forEach(cafe => {
    const opt = document.createElement('option');
    opt.value = cafe.cafeteriaId;
    opt.textContent = cafe.nombre;
    selectCafe.appendChild(opt);
  });
}

/**
 * Panel de Staff buscando directo en Google Sheets y registrando visitas en la hoja
 */
function manejarStaff() {
  const btnBuscar = document.getElementById('staff-btn-buscar');
  const inputBuscar = document.getElementById('staff-input-buscar');
  if (!btnBuscar) return;

  let clienteCache = null;

  btnBuscar.addEventListener('click', async () => {
    const query = inputBuscar.value.trim().toLowerCase();
    if (!query) return;

    try {
      const res = await fetch(`${API_URL}?accion=consultarCliente&email=${encodeURIComponent(query)}`);
      const resultado = await res.json();
      const alertaStaff = document.getElementById('staff-alerta');

      if (resultado.correcto) {
        clienteCache = resultado.cliente;
        document.getElementById('staff-cliente-nombre').textContent = clienteCache.nombre;
        document.getElementById('staff-cliente-email').textContent = clienteCache.email;
        document.getElementById('staff-cliente-estrellas').textContent = clienteCache.estrellas;
        
        document.getElementById('staff-resultado-cliente').classList.remove('d-none');
        document.getElementById('staff-estado-vacio').classList.add('d-none');
        alertaStaff.classList.add('d-none');
      } else {
        document.getElementById('staff-resultado-cliente').classList.add('d-none');
        document.getElementById('staff-estado-vacio').classList.remove('d-none');
        alertaStaff.className = 'alert alert-warning';
        alertaStaff.textContent = 'Cliente no encontrado en Google Sheets.';
        alertaStaff.classList.remove('d-none');
      }
    } catch (e) {
      console.error(e);
    }
  });

  const btnSumar = document.getElementById('staff-btn-sumar');
  if (btnSumar) {
    btnSumar.addEventListener('click', async () => {
      if (!clienteCache) return;
      const selectCafe = document.getElementById('staff-select-cafe');
      const cafeteriaId = selectCafe ? selectCafe.value : 'cafe_aroma';

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            accion: 'registrarVisitaStaff',
            clienteId: clienteCache.clienteId,
            cafeteriaId: cafeteriaId,
            registradoPor: 'Barista Staff'
          })
        });
        const resultado = await res.json();
        const alertaStaff = document.getElementById('staff-alerta');

        if (resultado.correcto) {
          clienteCache.estrellas = resultado.estrellasActuales;
          document.getElementById('staff-cliente-estrellas').textContent = clienteCache.estrellas;
          alertaStaff.className = 'alert alert-success';
          alertaStaff.textContent = `¡Estrella guardada en Google Sheets! Total: ${clienteCache.estrellas}/10`;
          alertaStaff.classList.remove('d-none');
          renderizarAdminReal();
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
}

/**
 * Panel de Administración extrayendo totales reales de Google Sheets
 */
async function renderizarAdminReal() {
  const totalCafes = document.getElementById('admin-total-cafes');
  if (!totalCafes) return;

  try {
    const res = await fetch(`${API_URL}?accion=obtenerAdminDatos`);
    const data = await res.json();

    if (data.correcto) {
      document.getElementById('admin-total-cafes').textContent = data.cafeterias.length;
      document.getElementById('admin-total-clientes').textContent = data.clientes.length;
      document.getElementById('admin-total-visitas').textContent = data.visitas.length;
    }
  } catch (e) {
    console.error('No se pudo cargar estadísticas de Admin:', e);
  }
}