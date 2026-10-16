const API_URL = 'https://script.google.com/macros/s/AKfycbzhvEmDqDTEGoSeW6eRCycvmedrly7oog0gkx9tKz3EkiexndIaKTiXS2kY12AOJ694/exec';

document.addEventListener('DOMContentLoaded', () => {
  cargarClientes();

  const form = document.getElementById('form-crud-clientes');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cliente = {
      clienteId: document.getElementById('clienteId').value,
      nombre: document.getElementById('nombre').value,
      email: document.getElementById('email').value,
      fechaNacimiento: document.getElementById('fechaNacimiento').value,
      estado: document.getElementById('estado').value,
      consentimientoEmail: document.getElementById('consentimientoEmail').checked
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ accion: 'guardarCliente', cliente })
      });
      const data = await res.json();

      if (data.correcto) {
        alert(data.mensaje);
        form.reset();
        document.getElementById('clienteId').value = '';
        cargarClientes();
      } else {
        alert('Error: ' + data.mensaje);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar.');
    }
  });
});

async function cargarClientes() {
  const tbody = document.getElementById('tabla-clientes');
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Cargando...</td></tr>`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ accion: 'obtenerClientes' })
    });
    const data = await res.json();

    if (data.correcto && data.clientes) {
      tbody.innerHTML = '';
      if (data.clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay clientes registrados.</td></tr>`;
        return;
      }

      data.clientes.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${c.nombre}</td>
          <td>${c.email}</td>
          <td>${formatearFecha(c.fechaNacimiento)}</td>
          <td><span class="badge bg-${c.estado === 'activo' ? 'success' : 'secondary'}">${c.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" onclick='editarCliente(${JSON.stringify(c)})'>Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarCliente('${c.clienteId}')">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error de conexión.</td></tr>`;
  }
}

// Función auxiliar de formateo idéntica a la de app.js para mantener consistencia
function formatearFecha(fechaStr) {
  if (!fechaStr) return '-';
  
  const soloFecha = String(fechaStr).split('T')[0];
  const partes = soloFecha.split(/[-/]/);
  
  if (partes.length === 3) {
    if (partes[0].length === 4) {
      return `${partes[2].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[0]}`;
    }
    return `${partes[0].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[2]}`;
  }
  
  return soloFecha;
}

function editarCliente(c) {
  document.getElementById('clienteId').value = c.clienteId || '';
  document.getElementById('nombre').value = c.nombre || '';
  document.getElementById('email').value = c.email || '';
  document.getElementById('fechaNacimiento').value = c.fechaNacimiento || '';
  document.getElementById('estado').value = c.estado || 'activo';
  document.getElementById('consentimientoEmail').checked = c.consentimientoEmail === 'true' || c.consentimientoEmail === true;
}

async function eliminarCliente(clienteId) {
  if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ accion: 'eliminarCliente', clienteId })
    });
    const data = await res.json();

    if (data.correcto) {
      cargarClientes();
    } else {
      alert('No se pudo eliminar: ' + data.mensaje);
    }
  } catch (err) {
    console.error(err);
    alert('Error al intentar eliminar.');
  }
}