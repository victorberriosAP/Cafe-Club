const API_URL = 'https://script.google.com/macros/s/AKfycby7fFhKvGR5mwVuXEloDL3yKt2bUn88fYHPRZabWcrho8YwSZPMihhGzqYYAUGqjt8V/exec';

document.addEventListener('DOMContentLoaded', () => {
  cargarLocales();

  const form = document.getElementById('form-crud-locales');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const local = {
        cafeteriaId: document.getElementById('cafeteriaId').value,
        nombre: document.getElementById('nombre').value,
        slug: document.getElementById('slug').value,
        direccion: document.getElementById('direccion').value,
        estado: document.getElementById('estado').value
      };

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({ accion: 'guardarSucursal', sucursal: local })
        });
        const data = await res.json();

        if (data.correcto) {
          alert(data.mensaje || 'Guardado exitosamente');
          form.reset();
          document.getElementById('cafeteriaId').value = '';
          cargarLocales();
        } else {
          alert('Error: ' + data.mensaje);
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión al guardar local.');
      }
    });
  }
});

async function cargarLocales() {
  const tbody = document.getElementById('tabla-locales');
  if (!tbody) return;
  
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Cargando...</td></tr>`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ accion: 'obtenerCafeterias' })
    });
    const data = await res.json();

    // Soportamos tanto 'sucursales' como 'cafeterias' por compatibilidad con el Apps Script
    const lista = data.sucursales || data.cafeterias;

    if (data.correcto && lista) {
      tbody.innerHTML = '';
      if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay sucursales registradas.</td></tr>`;
        return;
      }

      lista.forEach(l => {
        const idLocal = l.cafeteriaId || l.id || '';
        const estadoVal = l.estado || 'activo';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${idLocal || '-'}</code></td>
          <td class="fw-semibold">${l.nombre || '-'}</td>
          <td><code>${l.slug || '-'}</code></td>
          <td>${l.direccion || '-'}</td>
          <td><span class="badge bg-${estadoVal === 'activo' ? 'success' : 'secondary'}">${estadoVal}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick='editarLocal(${JSON.stringify(l)})'>Editar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">No se pudieron cargar los datos.</td></tr>`;
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error de conexión.</td></tr>`;
  }
}

function editarLocal(l) {
  document.getElementById('cafeteriaId').value = l.cafeteriaId || l.id || '';
  document.getElementById('nombre').value = l.nombre || '';
  document.getElementById('slug').value = l.slug || '';
  document.getElementById('direccion').value = l.direccion || '';
  document.getElementById('estado').value = l.estado || 'activo';
}