/* assets/js/app.js */

/**
 * Café Club — Lógica frontend para multisucursal y Google Sheets / localStorage
 */

document.addEventListener('DOMContentLoaded', () => {
  inicializarDatosDemo();
  manejarRegistro();
  renderizarTarjeta();
  renderizarSucursales();
  manejarStaff();
  renderizarAdmin();
});

const SUCURSALES_DATA = [
  { id: 'suc_providencia', nombre: 'Café Club — Providencia', slug: 'providencia', direccion: 'Av. Providencia 1234' },
  { id: 'suc_santiago', nombre: 'Café Club — Centro Histórico', slug: 'centro', direccion: 'Calle Huérfanos 567' },
  { id: 'suc_vitacura', nombre: 'Café Club — Vitacura', slug: 'vitacura', direccion: 'Vitacura 4000' }
];

function inicializarDatosDemo() {
  if (!localStorage.getItem('cafe_club_clientes')) {
    localStorage.setItem('cafe_club_clientes', JSON.stringify([]));
  }
  if (!localStorage.getItem('cafe_club_visitas')) {
    localStorage.setItem('cafe_club_visitas', JSON.stringify([]));
  }
}

/**
 * Callback de Google Sign-In (OAuth)
 */
window.handleGoogleSignIn = function(response) {
  try {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const identidad = JSON.parse(jsonPayload);

    let clientes = JSON.parse(localStorage.getItem('cafe_club_clientes')) || [];
    let clienteExistente = clientes.find(c => c.email === identidad.email);

    if (clienteExistente) {
      localStorage.setItem('cafe_club_activo', JSON.stringify(clienteExistente));
    } else {
      const nuevoCliente = {
        clienteId: 'cli_' + Math.random().toString(36).substr(2, 9),
        googleSub: identidad.sub,
        nombre: identidad.name,
        email: identidad.email,
        fechaNacimiento: '',
        estrellas: 0,
        fechaRegistro: new Date().toISOString()
      };
      clientes.push(nuevoCliente);
      localStorage.setItem('cafe_club_clientes', JSON.stringify(clientes));
      localStorage.setItem('cafe_club_activo', JSON.stringify(nuevoCliente));
    }

    const alerta = document.getElementById('alerta-registro');
    if (alerta) {
      alerta.className = 'alert alert-success';
      alerta.textContent = `¡Bienvenido/a ${identidad.name}! Redirigiendo a tu tarjeta...`;
      alerta.classList.remove('d-none');
    }

    setTimeout(() => {
      window.location.href = 'tarjeta.html';
    }, 1500);
  } catch (error) {
    console.error('Error Google OAuth:', error);
  }
};

function manejarRegistro() {
  const formRegistro = document.getElementById('form-registro');
  if (!formRegistro) return;

  formRegistro.addEventListener('submit', (e) => {
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

    let clientes = JSON.parse(localStorage.getItem('cafe_club_clientes')) || [];
    let clienteExistente = clientes.find(c => c.email === email);

    if (clienteExistente) {
      localStorage.setItem('cafe_club_activo', JSON.stringify(clienteExistente));
    } else {
      const nuevoCliente = {
        clienteId: 'cli_' + Math.random().toString(36).substr(2, 9),
        nombre,
        email,
        fechaNacimiento,
        estrellas: 0,
        fechaRegistro: new Date().toISOString()
      };
      clientes.push(nuevoCliente);
      localStorage.setItem('cafe_club_clientes', JSON.stringify(clientes));
      localStorage.setItem('cafe_club_activo', JSON.stringify(nuevoCliente));
    }

    alerta.className = 'alert alert-success';
    alerta.textContent = '¡Registro exitoso! Redirigiendo a tu tarjeta digital...';
    alerta.classList.remove('d-none');

    setTimeout(() => {
      window.location.href = 'tarjeta.html';
    }, 1500);
  });
}

function renderizarTarjeta() {
  const sinTarjeta = document.getElementById('sin-tarjeta');
  const conTarjeta = document.getElementById('con-tarjeta');
  if (!sinTarjeta || !conTarjeta) return;

  const clienteActivo = JSON.parse(localStorage.getItem('cafe_club_activo'));

  if (!clienteActivo) {
    sinTarjeta.classList.remove('d-none');
    conTarjeta.classList.add('d-none');
    return;
  }

  sinTarjeta.classList.add('d-none');
  conTarjeta.classList.remove('d-none');

  document.getElementById('tarjeta-nombre').textContent = clienteActivo.nombre;
  document.getElementById('tarjeta-estrellas-num').textContent = clienteActivo.estrellas;

  const grid = document.getElementById('tarjeta-estrellas-grid');
  grid.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const slot = document.createElement('div');
    slot.className = `star-slot ${i <= clienteActivo.estrellas ? 'filled' : ''}`;
    slot.innerHTML = i <= clienteActivo.estrellas ? '⭐' : i;
    grid.appendChild(slot);
  }

  const estadoReq = document.getElementById('tarjeta-estado-recompensa');
  if (clienteActivo.estrellas >= 10) {
    estadoReq.textContent = '🎉 ¡Felicidades! Tienes un café gratis disponible en cualquier sucursal.';
  } else {
    estadoReq.textContent = `¡Te faltan ${10 - clienteActivo.estrellas} estrellas para tu café gratis!`;
  }

  const btnCerrar = document.getElementById('btn-cerrar-sesion');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      localStorage.removeItem('cafe_club_activo');
      location.reload();
    });
  }
}

function renderizarSucursales() {
  const contenedor = document.getElementById('lista-sucursales');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  const urlBase = window.location.origin + window.location.pathname.replace('cafeterias.html', '');
  const urlRegistroUniversal = `${urlBase}registro.html`;

  // QR Universal
  const imgQR = document.getElementById('imagen-qr-universal');
  const inputUrl = document.getElementById('input-url-qr');
  if (imgQR && inputUrl) {
    inputUrl.value = urlRegistroUniversal;
    imgQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlRegistroUniversal)}`;
  }

  const btnCopiar = document.getElementById('btn-copiar-enlace');
  if (btnCopiar) {
    btnCopiar.addEventListener('click', () => {
      inputUrl.select();
      navigator.clipboard.writeText(inputUrl.value);
      const toast = document.getElementById('toast-copiado');
      toast.classList.remove('d-none');
      setTimeout(() => toast.classList.add('d-none'), 2000);
    });
  }

  SUCURSALES_DATA.forEach(suc => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white d-flex flex-column">
        <h3 class="h5 fw-bold mb-2">${suc.nombre}</h3>
        <p class="text-muted small mb-3">📍 ${suc.direccion}</p>
        <div class="mt-auto">
          <a href="registro.html" class="btn btn-primary btn-sm w-100">Registrarse con QR Universal</a>
        </div>
      </div>
    `;
    contenedor.appendChild(col);
  });
}

function manejarStaff() {
  const selectSucursal = document.getElementById('staff-select-sucursal');
  if (!selectSucursal) return;

  selectSucursal.innerHTML = '';
  SUCURSALES_DATA.forEach(suc => {
    const opt = document.createElement('option');
    opt.value = suc.id;
    opt.textContent = suc.nombre;
    selectSucursal.appendChild(opt);
  });

  const btnBuscar = document.getElementById('staff-btn-buscar');
  const inputBuscar = document.getElementById('staff-input-buscar');
  const resultadoCliente = document.getElementById('staff-resultado-cliente');
  const estadoVacio = document.getElementById('staff-estado-vacio');
  const alertaStaff = document.getElementById('staff-alerta');
  const btnSumar = document.getElementById('staff-btn-sumar');

  let clienteCache = null;

  btnBuscar.addEventListener('click', () => {
    const query = inputBuscar.value.trim().toLowerCase();
    if (!query) return;

    let clientes = JSON.parse(localStorage.getItem('cafe_club_clientes')) || [];
    clienteCache = clientes.find(c => c.nombre.toLowerCase().includes(query) || c.email.toLowerCase().includes(query));

    if (clienteCache) {
      document.getElementById('staff-cliente-nombre').textContent = clienteCache.nombre;
      document.getElementById('staff-cliente-email').textContent = clienteCache.email;
      document.getElementById('staff-cliente-estrellas').textContent = clienteCache.estrellas;
      
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
  });

  btnSumar.addEventListener('click', () => {
    if (!clienteCache) return;

    if (clienteCache.estrellas < 10) {
      clienteCache.estrellas += 1;
    } else {
      clienteCache.estrellas = 1;
    }

    let clientes = JSON.parse(localStorage.getItem('cafe_club_clientes')) || [];
    clientes = clientes.map(c => c.clienteId === clienteCache.clienteId ? clienteCache : c);
    localStorage.setItem('cafe_club_clientes', JSON.stringify(clientes));

    let activo = JSON.parse(localStorage.getItem('cafe_club_activo'));
    if (activo && activo.clienteId === clienteCache.clienteId) {
      localStorage.setItem('cafe_club_activo', JSON.stringify(clienteCache));
    }

    let visitas = JSON.parse(localStorage.getItem('cafe_club_visitas')) || [];
    const sucActualId = selectSucursal.value;
    const sucObj = SUCURSALES_DATA.find(s => s.id === sucActualId);

    visitas.unshift({
      fechaHora: new Date().toLocaleString(),
      clienteNombre: clienteCache.nombre,
      sucursalNombre: sucObj ? sucObj.nombre : 'Sucursal',
      accion: '+1 Estrella (Visita)'
    });
    localStorage.setItem('cafe_club_visitas', JSON.stringify(visitas));

    document.getElementById('staff-cliente-estrellas').textContent = clienteCache.estrellas;
    alertaStaff.className = 'alert alert-success';
    alertaStaff.textContent = `¡Estrella agregada con éxito para ${clienteCache.nombre}! Total: ${clienteCache.estrellas}/10`;
    alertaStaff.classList.remove('d-none');

    renderizarHistorialStaff();
  });

  renderizarHistorialStaff();
}

function renderizarHistorialStaff() {
  const tbody = document.getElementById('staff-tabla-historial');
  if (!tbody) return;

  const visitas = JSON.parse(localStorage.getItem('cafe_club_visitas')) || [];
  if (visitas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No hay registros recientes en esta sesión.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  visitas.slice(0, 10).forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><small class="text-muted">${v.fechaHora}</small></td>
      <td class="fw-semibold">${v.clienteNombre}</td>
      <td>${v.sucursalNombre}</td>
      <td><span class="badge bg-success">${v.accion}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderizarAdmin() {
  const totalSuc = document.getElementById('admin-total-sucursales');
  if (!totalSuc) return;

  totalSuc.textContent = SUCURSALES_DATA.length;
  const clientes = JSON.parse(localStorage.getItem('cafe_club_clientes')) || [];
  const visitas = JSON.parse(localStorage.getItem('cafe_club_visitas')) || [];

  document.getElementById('admin-total-clientes').textContent = clientes.length;
  document.getElementById('admin-total-visitas').textContent = visitas.length;
}