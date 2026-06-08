let editandoCodigo = null;
let filtroBusqueda = '';

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('vehiculoForm');
    const btnCancelar = document.getElementById('btnCancelar');
    const buscador = document.getElementById('buscador');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (editandoCodigo) {
            actualizarVehiculo();
        } else {
            guardarVehiculo();
        }
    });

    btnCancelar.addEventListener('click', cancelarEdicion);

    buscador.addEventListener('input', function () {
        filtroBusqueda = this.value.trim().toLowerCase();
        mostrarVehiculos();
    });

    initIntersectionObserver();
    mostrarVehiculos();
    mostrarDestacado();
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
    mostrarDestacado();
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
    mostrarDestacado();
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
    const countEl = document.getElementById('catalogoCount');
    tbody.innerHTML = '';

    let vehiculos = obtenerTodos();

    if (filtroBusqueda) {
        vehiculos = vehiculos.filter(function (v) {
            return v.codigo.toLowerCase().includes(filtroBusqueda) ||
                   v.marca.toLowerCase().includes(filtroBusqueda);
        });
    }

    if (vehiculos.length === 0) {
        vacio.classList.remove('hidden');
        if (filtroBusqueda) {
            vacio.querySelector('p').textContent = 'Sin resultados para "' + filtroBusqueda + '"';
            vacio.querySelector('span').textContent = 'Intenta con otro término de búsqueda';
        } else {
            vacio.querySelector('p').textContent = 'No hay vehículos registrados';
            vacio.querySelector('span').textContent = 'Usa el formulario para agregar el primero';
        }
        countEl.textContent = '0 vehículos registrados';
        return;
    }

    vacio.classList.add('hidden');

    const total = vehiculos.length;
    const totalStock = vehiculos.reduce(function (sum, v) { return sum + v.cantidad; }, 0);
    countEl.textContent = total + ' vehículo' + (total !== 1 ? 's' : '') + ' registrado' + (total !== 1 ? 's' : '') + ' (' + totalStock + ' en stock)';

    vehiculos.forEach(function (v) {
        const tr = document.createElement('tr');
        tr.innerHTML = [
            '<td><strong>' + escapeHtml(v.codigo) + '</strong></td>',
            '<td>' + escapeHtml(v.marca) + '</td>',
            '<td>' + escapeHtml(v.modelo) + '</td>',
            '<td>' + v.anio + '</td>',
            '<td><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:' + colorToHex(v.color) + ';vertical-align:middle;margin-right:6px;border:1px solid #e2e8f0;"></span>' + escapeHtml(v.color) + '</td>',
            '<td><span class="badge badge-' + slugify(v.combustible) + '">' + escapeHtml(v.combustible) + '</span></td>',
            '<td class="price">$' + formatearPrecio(v.precio) + '</td>',
            '<td>' + v.cantidad + '</td>',
            '<td><div class="acciones"><button class="btn-accion btn-editar" onclick="editarVehiculo(\'' + escapeHtml(v.codigo) + '\')">Editar</button><button class="btn-accion btn-eliminar" onclick="eliminarVehiculo(\'' + escapeHtml(v.codigo) + '\')">Eliminar</button></div></td>'
        ].join('');
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
            } catch (e) {}
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
        mostrarDestacado();
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

function mostrarDestacado() {
    const vehiculos = obtenerTodos();
    const body = document.getElementById('heroCardBody');

    if (vehiculos.length === 0) {
        body.innerHTML = [
            '<div class="hero-card-placeholder">',
            '<svg width="48" height="48" viewBox="0 0 64 64" fill="none">',
            '<rect width="64" height="64" rx="16" fill="rgba(255,255,255,0.08)"/>',
            '<path d="M20 36L22 28H42L44 36H20Z" fill="rgba(255,255,255,0.2)"/>',
            '<circle cx="25" cy="36" r="3" fill="rgba(255,255,255,0.2)"/>',
            '<circle cx="39" cy="36" r="3" fill="rgba(255,255,255,0.2)"/>',
            '<path d="M22 32H42" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>',
            '</svg>',
            '<p class="hero-card-placeholder-text">Registra tu primer vehículo</p>',
            '</div>'
        ].join('');
        return;
    }

    const v = vehiculos[Math.floor(Math.random() * vehiculos.length)];

    body.innerHTML = [
        '<div class="hero-card-vehicle">',
        '<div class="hero-card-model">' + escapeHtml(v.modelo) + '</div>',
        '<div class="hero-card-brand">' + escapeHtml(v.marca) + '</div>',
        '<div class="hero-card-specs">',
        '<div class="hero-card-spec"><span class="hero-card-spec-label">Año</span><span class="hero-card-spec-value">' + v.anio + '</span></div>',
        '<div class="hero-card-spec"><span class="hero-card-spec-label">Precio</span><span class="hero-card-spec-value price">$' + formatearPrecio(v.precio) + '</span></div>',
        '<div class="hero-card-spec"><span class="hero-card-spec-label">Color</span><span class="hero-card-spec-value">' + escapeHtml(v.color) + '</span></div>',
        '<div class="hero-card-spec"><span class="hero-card-spec-label">Stock</span><span class="hero-card-spec-value">' + v.cantidad + '</span></div>',
        '</div>',
        '<a href="#catalogo" class="hero-card-link">Ver en catálogo &rarr;</a>',
        '</div>'
    ].join('');
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

function initIntersectionObserver() {
    const sections = document.querySelectorAll('section[data-section]');
    const navLinks = document.querySelectorAll('.nav-link');
    const animatedEls = document.querySelectorAll('.animate-in');

    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-section');
                navLinks.forEach(function (link) {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, {
        threshold: 0.4
    });

    sections.forEach(function (s) {
        sectionObserver.observe(s);
    });

    const animObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                animObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15
    });

    animatedEls.forEach(function (el) {
        animObserver.observe(el);
    });
}
