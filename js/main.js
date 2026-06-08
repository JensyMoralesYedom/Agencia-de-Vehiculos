let editandoCodigo = null;

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('vehiculoForm');
    const btnCancelar = document.getElementById('btnCancelar');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (editandoCodigo) {
            actualizarVehiculo();
        } else {
            guardarVehiculo();
        }
    });

    btnCancelar.addEventListener('click', cancelarEdicion);

    mostrarVehiculos();
});

function guardarVehiculo() {
    limpiarError();

    const datos = obtenerDatosFormulario();

    if (!validarDatos(datos)) return;

    if (localStorage.getItem('vehiculo_' + datos.codigo)) {
        mostrarError('Ya existe un vehículo con el código "' + datos.codigo + '". Usa un código diferente.');
        return;
    }

    localStorage.setItem('vehiculo_' + datos.codigo, JSON.stringify(datos));
    document.getElementById('vehiculoForm').reset();
    mostrarVehiculos();
}

function actualizarVehiculo() {
    limpiarError();

    const datos = obtenerDatosFormulario();

    if (!validarDatos(datos)) return;

    if (datos.codigo !== editandoCodigo && localStorage.getItem('vehiculo_' + datos.codigo)) {
        mostrarError('Ya existe un vehículo con el código "' + datos.codigo + '". Usa un código diferente.');
        return;
    }

    localStorage.removeItem('vehiculo_' + editandoCodigo);
    localStorage.setItem('vehiculo_' + datos.codigo, JSON.stringify(datos));

    cancelarEdicion();
    mostrarVehiculos();
}

function obtenerDatosFormulario() {
    return {
        codigo: document.getElementById('codigo').value.trim(),
        marca: document.getElementById('marca').value.trim(),
        modelo: document.getElementById('modelo').value.trim(),
        anio: parseInt(document.getElementById('anio').value, 10),
        color: document.getElementById('color').value.trim(),
        combustible: document.getElementById('combustible').value,
        precio: parseFloat(document.getElementById('precio').value),
        cantidad: parseInt(document.getElementById('cantidad').value, 10),
        descripcion: document.getElementById('descripcion').value.trim()
    };
}

function validarDatos(d) {
    const anioActual = new Date().getFullYear();

    if (!d.codigo || !d.marca || !d.modelo || !d.color || !d.combustible || !d.descripcion) {
        mostrarError('Todos los campos son obligatorios.');
        return false;
    }

    if (isNaN(d.anio) || d.anio < 1886 || d.anio > anioActual + 1) {
        mostrarError('El año debe ser válido (entre 1886 y ' + (anioActual + 1) + ').');
        return false;
    }

    if (isNaN(d.precio) || d.precio <= 0) {
        mostrarError('El precio debe ser un número mayor que cero.');
        return false;
    }

    if (isNaN(d.cantidad) || d.cantidad < 0 || !Number.isInteger(d.cantidad)) {
        mostrarError('La cantidad debe ser un número entero válido (0 o más).');
        return false;
    }

    return true;
}

function mostrarVehiculos() {
    const tbody = document.getElementById('tablaVehiculos');
    const vacio = document.getElementById('mensajeVacio');
    tbody.innerHTML = '';

    const vehiculos = obtenerTodos();

    if (vehiculos.length === 0) {
        vacio.classList.remove('hidden');
        return;
    }

    vacio.classList.add('hidden');

    vehiculos.forEach(function (v) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(v.codigo)}</strong></td>
            <td>${escapeHtml(v.marca)}</td>
            <td>${escapeHtml(v.modelo)}</td>
            <td>${v.anio}</td>
            <td><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${colorToHex(v.color)};vertical-align:middle;margin-right:6px;border:1px solid #e2e8f0;"></span>${escapeHtml(v.color)}</td>
            <td><span class="badge badge-${slugify(v.combustible)}">${escapeHtml(v.combustible)}</span></td>
            <td class="price">$${formatearPrecio(v.precio)}</td>
            <td>${v.cantidad}</td>
            <td>
                <div class="acciones">
                    <button class="btn-accion btn-editar" onclick="editarVehiculo('${escapeHtml(v.codigo)}')">Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarVehiculo('${escapeHtml(v.codigo)}')">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function obtenerTodos() {
    const vehiculos = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vehiculo_')) {
            try {
                vehiculos.push(JSON.parse(localStorage.getItem(key)));
            } catch (e) {
                // skip corrupted entry
            }
        }
    }
    vehiculos.sort(function (a, b) {
        return a.codigo.localeCompare(b.codigo);
    });
    return vehiculos;
}

function eliminarVehiculo(codigo) {
    if (confirm('¿Estás seguro de eliminar el vehículo con código "' + codigo + '"?')) {
        localStorage.removeItem('vehiculo_' + codigo);
        mostrarVehiculos();
    }
}

function editarVehiculo(codigo) {
    const data = localStorage.getItem('vehiculo_' + codigo);
    if (!data) return;

    const v = JSON.parse(data);

    document.getElementById('codigo').value = v.codigo;
    document.getElementById('marca').value = v.marca;
    document.getElementById('modelo').value = v.modelo;
    document.getElementById('anio').value = v.anio;
    document.getElementById('color').value = v.color;
    document.getElementById('combustible').value = v.combustible;
    document.getElementById('precio').value = v.precio;
    document.getElementById('cantidad').value = v.cantidad;
    document.getElementById('descripcion').value = v.descripcion;

    editandoCodigo = v.codigo;

    document.getElementById('btnGuardar').textContent = 'Actualizar Vehículo';
    document.getElementById('btnCancelar').style.display = 'block';

    document.getElementById('formulario').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
    editandoCodigo = null;
    document.getElementById('vehiculoForm').reset();
    document.getElementById('btnGuardar').textContent = 'Guardar Vehículo';
    document.getElementById('btnCancelar').style.display = 'none';
    limpiarError();
}

function mostrarError(msg) {
    const el = document.getElementById('mensajeError');
    el.textContent = msg;
    el.classList.add('visible');
}

function limpiarError() {
    const el = document.getElementById('mensajeError');
    el.textContent = '';
    el.classList.remove('visible');
}

function formatearPrecio(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function colorToHex(color) {
    const map = {
        rojo: '#ef4444', red: '#ef4444',
        azul: '#2563eb', blue: '#2563eb',
        verde: '#16a34a', green: '#16a34a',
        negro: '#1e293b', black: '#1e293b',
        blanco: '#f8fafc', white: '#f8fafc',
        gris: '#64748b', gray: '#64748b', grey: '#64748b',
        plateado: '#cbd5e1', silver: '#cbd5e1',
        amarillo: '#eab308', yellow: '#eab308',
        naranja: '#ea580c', orange: '#ea580c',
        marron: '#7c2d12', brown: '#7c2d12',
        cafe: '#7c2d12',
        morado: '#7c3aed', purple: '#7c3aed',
        rosado: '#ec4899', pink: '#ec4899',
        beige: '#d6d3d1',
        vino: '#831843',
        granate: '#831843',
        dorado: '#ca8a04', gold: '#ca8a04'
    };
    return map[color.toLowerCase().trim()] || '#94a3b8';
}

function slugify(str) {
    return str.toLowerCase()
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/á/g, 'a')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]/g, '');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
