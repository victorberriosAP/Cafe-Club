/**
 * Café Club — Lógica frontend para multisucursal y Google Sheets / Apps Script
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbw3A0HdzFRp8BRrky26doLBj_exT2A37sYJi0ufwemH1Sgf66S40k01V7eNUui8j3l9/exec';

document.addEventListener('DOMContentLoaded', () => {
  manejarRegistro();
  renderizarTarjeta();
  renderizarSucursales();
  manejarStaff();
  renderizarAdmin();
});

/**
 * Callback de Google Sign-In (OAuth)
 */
window.handleGoogleSignIn = async function(response) {
  try {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const identidad = JSON.parse(jsonPayload);

    const datosEnvio = {
      accion: 'registrarCliente',
      googleSub: identidad.sub,
      nombre: identidad.name,
      email: identidad.email,
      fechaNacimiento: ''
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(datosEnvio)
    });
    const resultado = await res.json();

    const alerta = document.getElementById('alerta-registro');
    if (resultado.correcto) {
      localStorage.setItem('cafe_club_email', identidad.email);
      if (alerta) {
        alerta.className = 'alert alert-success';
        alerta.textContent = `¡Bienvenido/a ${identidad.name}! Redirigiendo a tu tarjeta...`;
        alerta.classList.remove('d-none');
      }
      setTimeout(() => window.location.href = 'tarjeta.html', 1500);
    } else {
      if (alerta) {
        alerta.className = 'alert alert-danger';
        alerta.textContent = resultado.mensaje;
        alerta.classList.remove('d-none');
      }
    }
  } catch (error) {
    console.error('Error Google OAuth:', error);
    const alerta = document.getElementById('alerta-registro');
    if (alerta) {
      alerta.className = 'alert alert-danger';
      alerta.textContent = 'Error al procesar la cuenta de Google.';
      alerta.classList.remove('d-none');
    }
  }
};

function manejarRegistro() {
  const formRegistro = document.getElementById('form-registro');
  if (!formRegistro) return;

  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const terminos = document.getElementById('terminos').checked;
    const alerta = document.getElementById('alerta-registro');

    if (!nombre || !email || !terminos) {
      alerta.className = 'alert alert-danger';
      alerta.textContent = 'Por favor completa los campos obligatorios y acepta los términos.';
      alerta.classList.remove('d-none');
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          accion: 'registrarCliente',
          nombre,
          email,
          fechaNacimiento
        })
      });
      const data = await res.json();

      if (data.correcto) {
        localStorage.setItem('cafe_club_email', email);
        alerta.className = 'alert alert-success';
        alerta.textContent = '¡Registro exitoso! Redirigiendo a tu tarjeta digital...';
        alerta.classList.remove('d-none');
        setTimeout(() => window.location.href = 'tarjeta.html', 1500);
      } else {
        alerta.className = 'alert alert-danger';
        alerta.textContent = data.mensaje;
        alerta.classList.remove('d-none');
      }
    } catch (err) {
      alerta.className = 'alert alert-danger';
      alerta.textContent = 'Error de conexión con el servidor.';
      alerta.classList.remove('d-none');
    }
  });
}

async function renderizarTarjeta() {
  const sinTarjeta = document.getElementById('sin-tarjeta');
  const conTarjeta = document.getElementById('con-tarjeta');
  if (!sinTarjeta || !conTarjeta) return;

  const email = localStorage.getItem('cafe_club_email');

  if (!email) {
    sinTarjeta.classList.remove('d-none');
    conTarjeta.classList.add('d-none');
    return;
  }

  try {
    const res = await fetch(`${API_URL}?accion=consultarCliente&email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (data.correcto && data.cliente) {
      sinTarjeta.classList.add('d-none');
      conTarjeta.classList.remove('d-none');

      document.getElementById('tarjeta-nombre').textContent = data.cliente.nombre;
      document.getElementById('tarjeta-estrellas-num').textContent = data.cliente.estrellas;

      const grid = document.getElementById('tarjeta-estrellas-grid');
      grid.innerHTML = '';
      for (let i = 1; i <= 10; i++) {
        const slot = document.createElement('div');
        slot.className = `star-slot ${i <= data.cliente.estrellas ? 'filled' : ''}`;
        slot.innerHTML = i <= data.cliente.estrellas ? '⭐' : i;
        grid.appendChild(slot);
      }

      const estadoReq = document.getElementById('tarjeta-estado-recompensa');
      if (data.cliente.estrellas >= 10) {
        estadoReq.textContent = '🎉 ¡Felicidades! Tienes un café gratis disponible en cualquier sucursal.';
      } else {
        estadoReq.textContent = `¡Te faltan ${10 - data.cliente.estrellas} estrellas para tu café gratis!`;
      }
    } else {
      sinTarjeta.classList.remove('d-none');
      conTarjeta.classList.add('d-none');
    }
  } catch (e) {
    console.error('Error al obtener la tarjeta:', e);
  }

  const btnCerrar = document.getElementById('btn-cerrar-sesion');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      localStorage.removeItem('cafe_club_email');
      location.reload();
    });
  }
}

async function renderizarSucursales() {
  const contenedor = document.getElementById('lista-sucursales');
  if (!contenedor) return;

  try {
    const res = await fetch(`${API_URL}?accion=obtenerCafeterias`);
    const data = await res.json();

    if (data.correcto && data.cafeterias && data.cafeterias.length > 0) {
      contenedor.innerHTML = '';
      data.cafeterias.forEach(suc => {
        const nombreSuc = suc.nombre || 'Café Club';
        const direccionSuc = suc.direccion || 'Dirección no especificada';
        const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(nombreSuc + ' ' + direccionSuc)}`;

        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white d-flex flex-column">
            <h3 class="h5 fw-bold mb-2">${nombreSuc}</h3>
            <p class="text-muted small mb-0">
              📍 <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-muted fw-medium">${direccionSuc}</a>
            </p>
          </div>
        `;
        contenedor.appendChild(col);
      });
    } else {
      contenedor.innerHTML = `<div class="col-12 text-center text-muted"><p>No hay sucursales disponibles en este momento.</p></div>`;
    }
  } catch (e) {
    contenedor.innerHTML = `<div class="col-12 text-center text-danger"><p>Error al conectar con Google Sheets.</p></div>`;
  }
}

async function manejarStaff() {
  const selectSucursal = document.getElementById('staff-select-sucursal');
  if (!selectSucursal) return;

  try {
    const res = await fetch(`${API_URL}?accion=obtenerCafeterias`);
    const data = await res.json();
    if (data.correcto && data.cafeterias) {
      selectSucursal.innerHTML = '';
      data.cafeterias.forEach(suc => {
        const opt = document.createElement('option');
        opt.value = suc.cafeteriaId || suc.id;
        opt.textContent = suc.nombre;
        selectSucursal.appendChild(opt);
      });
    }
  } catch (e) {
    console.error('Error cargando sucursales para staff');
  }

  const btnBuscar = document.getElementById('staff-btn-buscar');
  const inputBuscar = document.getElementById('staff-input-buscar');
  const resultadoCliente = document.getElementById('staff-resultado-cliente');
  const estadoVacio = document.getElementById('staff-estado-vacio');
  const alertaStaff = document.getElementById('staff-alerta');
  const btnSumar = document.getElementById('staff-btn-sumar');

  let clienteCache = null;

  if (btnBuscar) {
    btnBuscar.addEventListener('click', async () => {
      const email = inputBuscar.value.trim();
      if (!email) return;

      try {
        const res = await fetch(`${API_URL}?accion=consultarCliente&email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (data.correcto && data.cliente) {
          clienteCache = data.cliente;
          document.getElementById('staff-cliente-nombre').textContent = data.cliente.nombre;
          document.getElementById('staff-cliente-email').textContent = data.cliente.email;
          document.getElementById('staff-cliente-estrellas').textContent = data.cliente.estrellas;
          
          resultadoCliente.classList.remove('d-none');
          estadoVacio.classList.add('d-none');
          alertaStaff.classList.add('d-none');
        } else {
          resultadoCliente.classList.add('d-none');
          estadoVacio.classList.remove('d-none');
          alertaStaff.className = 'alert alert-warning';
          alertaStaff.textContent = 'Cliente no encontrado.';
          alertaStaff.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Error al buscar cliente:', err);
      }
    });
  }

  if (btnSumar) {
    btnSumar.addEventListener('click', async () => {
      if (!clienteCache) return;

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            accion: 'registrarVisitaStaff',
            clienteId: clienteCache.clienteId,
            cafeteriaId: selectSucursal.value
          })
        });
        const data = await res.json();

        if (data.correcto) {
          alertaStaff.className = 'alert alert-success';
          alertaStaff.textContent = '¡Estrella agregada con éxito en Google Sheets!';
          alertaStaff.classList.remove('d-none');
          
          clienteCache.estrellas = data.estrellasActuales;
          document.getElementById('staff-cliente-estrellas').textContent = clienteCache.estrellas;
        } else {
          alertaStaff.className = 'alert alert-danger';
          alertaStaff.textContent = data.mensaje;
          alertaStaff.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Error al registrar visita:', err);
      }
    });
  }
}

async function renderizarAdmin() {
  const totalSuc = document.getElementById('admin-total-sucursales');
  if (!totalSuc) return;

  try {
    const res = await fetch(`${API_URL}?accion=obtenerAdminDatos`);
    const data = await res.json();

    if (data.correcto) {
      document.getElementById('admin-total-sucursales').textContent = data.cafeterias.length;
      document.getElementById('admin-total-clientes').textContent = data.clientes.length;
      document.getElementById('admin-total-visitas').textContent = data.visitas.length;

      const tbodySuc = document.getElementById('admin-tabla-sucursales');
      if (tbodySuc && data.cafeterias.length > 0) {
        tbodySuc.innerHTML = '';
        data.cafeterias.forEach(suc => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><code>${suc.cafeteriaId || suc.id || '-'}</code></td>
            <td class="fw-semibold">${suc.nombre || '-'}</td>
            <td><code>${suc.slug || suc.direccion || '-'}</code></td>
          `;
          tbodySuc.appendChild(tr);
        });
      }

      const tbodyCli = document.getElementById('admin-tabla-clientes');
      if (tbodyCli && data.clientes.length > 0) {
        tbodyCli.innerHTML = '';
        data.clientes.slice(-5).reverse().forEach(cli => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="fw-semibold">${cli.nombre || '-'}</td>
            <td>${cli.email || '-'}</td>
            <td><small class="text-muted">${cli.fechaRegistro ? new Date(cli.fechaRegistro).toLocaleDateString() : '-'}</small></td>
          `;
          tbodyCli.appendChild(tr);
        });
      }
    }
  } catch (e) {
    console.error('Error al cargar datos del panel admin:', e);
  }
}