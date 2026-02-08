// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

let itemCount = 0;
let ventaItemCount = 0;
let proveedores = [];
let productos = [];
let compras = [];
let ventas = [];
let productosDisplayToId = new Map();

// Función genérica para hacer peticiones a la API
async function api(endpoint, method = 'GET', data = null) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        opts.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, opts);

        if (response.status === 204) {
            return null;
        }
        
        if (!response.ok) {
            let message = `Error HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                message = errorData.message || message;
            } catch {
                // ignore
            }
            throw new Error(message);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();
    } catch (error) {
        console.error('Error en petición API:', error);
        throw error;
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getFechaActualLocal() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const día = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${día}`;
}

function setActiveView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.style.display = 'none');

    const view = document.getElementById(`view-${viewName}`);
    if (view) view.style.display = 'block';

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
}

function renderVentasTable() {
    const tbl = document.getElementById('tblVentas');
    if (!tbl) return;
    const tbody = tbl.querySelector('tbody');
    tbody.innerHTML = '';

    ventas.forEach(v => {
        const cliente = v.cliente_nombre ? `${v.cliente_nombre}${v.cliente_documento ? ` (${v.cliente_documento})` : ''}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(v.id_venta)}</td>
            <td>${escapeHtml(v.tipo_documento)} - ${escapeHtml(v.numero_documento)}</td>
            <td>${escapeHtml(v.fecha_venta)}</td>
            <td>${escapeHtml(cliente)}</td>
            <td>${escapeHtml(v.total)}</td>
            <td>
                <div class="actions">
                    <button type="button" class="btn-small btn-danger" data-action="delete" data-id="${v.id_venta}">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            if (!confirm('¿Eliminar venta y sus detalles?')) return;
            await api(`/ventas/${id}`, 'DELETE');
            await cargarVentas();
            mostrar('✅ Venta eliminada', 'exito');
        });
    });
}

function agregarItemVenta() {
    ventaItemCount++;
    const div = document.createElement('div');
    div.className = 'item';
    div.id = 'v_item' + ventaItemCount;

    div.innerHTML = `
        <label>Producto:</label>
        <div class="autocomplete">
            <input type="text" id="v_prod_txt${ventaItemCount}" placeholder="Escriba para buscar..." autocomplete="off" required>
            <div class="suggestions" id="v_sug${ventaItemCount}" style="display:none"></div>
        </div>
        <input type="hidden" id="v_prod_id${ventaItemCount}">

        <label>Cantidad:</label>
        <input type="number" step="0.01" id="v_cant${ventaItemCount}" required min="0.01">

        <label>Precio Unitario:</label>
        <input type="number" step="0.01" id="v_precio${ventaItemCount}" required min="0.01">

        <button type="button" onclick="eliminarItemVenta(${ventaItemCount})">🗑️ Eliminar</button>
    `;

    const container = document.getElementById('v_items');
    if (container) container.appendChild(div);

    const cant = document.getElementById('v_cant' + ventaItemCount);
    const precio = document.getElementById('v_precio' + ventaItemCount);
    const prodTxt = document.getElementById('v_prod_txt' + ventaItemCount);
    const prodId = document.getElementById('v_prod_id' + ventaItemCount);
    if (cant) cant.addEventListener('input', recalcularTotalVenta);
    if (precio) precio.addEventListener('input', recalcularTotalVenta);

    if (prodTxt && prodId) {
        prodTxt.addEventListener('input', () => {
            const id = resolveProductoIdFromDisplay(prodTxt.value);
            prodId.value = id ? String(id) : '';
            renderSugerenciasProductos(ventaItemCount, prodTxt.value);
            recalcularTotalVenta();
        });

        prodTxt.addEventListener('focus', () => {
            renderSugerenciasProductos(ventaItemCount, prodTxt.value);
        });

        prodTxt.addEventListener('blur', () => {
            setTimeout(() => {
                const box = document.getElementById('v_sug' + ventaItemCount);
                if (box) {
                    box.innerHTML = '';
                    box.style.display = 'none';
                }
            }, 150);
        });
    }

    recalcularTotalVenta();
}

function eliminarItemVenta(numero) {
    const el = document.getElementById('v_item' + numero);
    if (el) el.remove();
    recalcularTotalVenta();
}

function recalcularTotalVenta() {
    const totalInput = document.getElementById('v_total');
    if (!totalInput) return;

    let total = 0;
    for (let i = 1; i <= ventaItemCount; i++) {
        const prodIdEl = document.getElementById('v_prod_id' + i);
        if (!prodIdEl || !prodIdEl.value) continue;

        const cantEl = document.getElementById('v_cant' + i);
        const precioEl = document.getElementById('v_precio' + i);
        const cant = cantEl ? Number(cantEl.value) : 0;
        const precio = precioEl ? Number(precioEl.value) : 0;
        if (!Number.isFinite(cant) || !Number.isFinite(precio)) continue;
        total += cant * precio;
    }

    totalInput.value = total ? total.toFixed(2) : '';
}

async function guardarVenta(event) {
    event.preventDefault();

    const form = document.getElementById('ventaForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const items = document.querySelectorAll('#v_items .item');
    if (items.length === 0) {
        mostrar('❌ Debe agregar al menos un item a la venta', 'error');
        return;
    }

    // Validar que el número de documento no exista
    const numeroDoc = document.getElementById('v_nro_doc').value.trim();
    if (numeroDoc) {
        try {
            const check = await api(`/ventas/check-documento/${encodeURIComponent(numeroDoc)}`);
            if (check.exists) {
                mostrar('❌ El número de documento ya existe. Use otro número.', 'error');
                document.getElementById('v_nro_doc').focus();
                return;
            }
        } catch (err) {
            // Si falla la validación, dejamos que el backend decida
            console.warn('No se pudo validar duplicado de número de documento:', err);
        }
    }

    try {
        form.classList.add('loading');

        recalcularTotalVenta();

        const ventaData = {
            numero_documento: document.getElementById('v_nro_doc').value,
            tipo_documento: document.getElementById('v_tipo_doc').value,
            fecha_venta: document.getElementById('v_fecha').value,
            cliente_nombre: document.getElementById('v_cliente_nombre').value,
            cliente_documento: document.getElementById('v_cliente_doc').value,
            total: Number(document.getElementById('v_total').value),
            observaciones: document.getElementById('v_obs').value
        };

        if (!ventaData.total || !Number.isFinite(ventaData.total)) {
            throw new Error('Total inválido. Complete cantidad y precio unitario en los items.');
        }

        const venta = await api('/ventas', 'POST', ventaData);

        const promises = [];
        for (let i = 1; i <= ventaItemCount; i++) {
            const prodIdEl = document.getElementById('v_prod_id' + i);
            if (prodIdEl && prodIdEl.value) {
                const cantidad = Number(document.getElementById('v_cant' + i).value);
                const precio = Number(document.getElementById('v_precio' + i).value);
                const payload = {
                    id_venta: venta.id_venta,
                    numero_linea: i,
                    id_producto: Number(prodIdEl.value),
                    cantidad,
                    precio_unitario: precio,
                    total_linea: cantidad * precio
                };
                promises.push(api('/ventas-detalles', 'POST', payload));
            }
        }

        await Promise.all(promises);

        mostrar('✅ Venta guardada correctamente!', 'exito');
        await cargarVentas();

        setTimeout(() => {
            form.reset();
            const itemsDiv = document.getElementById('v_items');
            if (itemsDiv) itemsDiv.innerHTML = '';
            ventaItemCount = 0;
            const fecha = document.getElementById('v_fecha');
            if (fecha) fecha.value = getFechaActualLocal();
            agregarItemVenta();
            recalcularTotalVenta();
        }, 1200);
    } catch (error) {
        mostrar('❌ Error al guardar venta: ' + error.message, 'error');
    } finally {
        form.classList.remove('loading');
    }
}

// Cargar proveedores desde el backend
async function cargarProveedores() {
    try {
        proveedores = await api('/proveedores');

        const selectCompra = document.getElementById('proveedor');
        if (selectCompra) {
            selectCompra.innerHTML = '<option value="">Seleccione...</option>';
            proveedores.filter(p => p.estado === 'ACTIVO').forEach(p => {
                selectCompra.innerHTML += `<option value="${p.id_proveedor}">${escapeHtml(p.nombre_comercial)} (${escapeHtml(p.ruc)})</option>`;
            });
        }

        renderProveedoresTable();
    } catch (error) {
        mostrar('❌ Error cargando proveedores: ' + error.message, 'error');
    }
}

// Cargar productos desde el backend
async function cargarProductos() {
    try {
        productos = await api('/productos');
        actualizarDatalistProductos();
        renderProductosTable();
        renderDetalleSelects();
    } catch (error) {
        mostrar('❌ Error cargando productos: ' + error.message, 'error');
    }
}

function actualizarDatalistProductos() {
    productosDisplayToId = new Map();
    productos.filter(p => p.estado === 'ACTIVO').forEach(p => {
        const display = `${p.sku_producto} - ${p.nombre_producto} (${p.unidad_medida || 'UN'})`;
        productosDisplayToId.set(display, p.id_producto);
    });
}

function resolveProductoIdFromDisplay(display) {
    if (!display) return null;
    const id = productosDisplayToId.get(display);
    return Number.isFinite(Number(id)) ? Number(id) : null;
}

function normalizarTexto(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function buscarProductos(query) {
    const q = normalizarTexto(query);
    if (!q) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    return productos
        .filter(p => p.estado === 'ACTIVO') // Solo productos activos
        .map(p => {
            const text = normalizarTexto(`${p.sku_producto} ${p.nombre_producto}`);
            return { p, text };
        })
        .filter(({ text }) => tokens.every(t => text.includes(t)))
        .slice(0, 10)
        .map(({ p }) => p);
}

function renderSugerenciasProductos(itemIndex, query) {
    const box = document.getElementById('v_sug' + itemIndex) || document.getElementById('sug' + itemIndex);
    if (!box) return;

    const matches = buscarProductos(query);
    if (!query || matches.length === 0) {
        box.innerHTML = '';
        box.style.display = 'none';
        return;
    }

    box.innerHTML = '';
    matches.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'suggestion-item';
        btn.textContent = `${p.sku_producto} - ${p.nombre_producto} (${p.unidad_medida || 'UN'})`;
        btn.addEventListener('click', () => {
            const txtInput = document.getElementById('v_prod_txt' + itemIndex) || document.getElementById('prod_txt' + itemIndex);
            const hiddenInput = document.getElementById('v_prod_id' + itemIndex) || document.getElementById('prod' + itemIndex);
            if (txtInput) txtInput.value = btn.textContent;
            if (hiddenInput) hiddenInput.value = p.id_producto;
            box.innerHTML = '';
            box.style.display = 'none';
            
            // Recalcular total
            const totalFunction = document.getElementById('v_total') ? recalcularTotalVenta : recalcularTotal;
            totalFunction();
        });
        box.appendChild(btn);
    });
    box.style.display = 'block';
}

async function cargarCompras() {
    try {
        compras = await api('/compras');
        renderComprasTable();
        renderDetalleSelects();
    } catch (error) {
        mostrar('❌ Error cargando compras: ' + error.message, 'error');
    }
}

async function cargarVentas() {
    try {
        ventas = await api('/ventas');
        renderVentasTable();
    } catch (error) {
        mostrar('❌ Error cargando ventas: ' + error.message, 'error');
    }
}

async function cargarDetalles() {
    try {
        const detalles = await api('/compras-detalles');
        renderDetallesTable(detalles);
    } catch (error) {
        mostrar('❌ Error cargando detalles: ' + error.message, 'error');
    }
}

function limpiarFormProveedor() {
    const id = document.getElementById('prov_id_proveedor');
    if (!id) return;
    id.value = '';
    document.getElementById('prov_ruc').value = '';
    document.getElementById('prov_razon_social').value = '';
    document.getElementById('prov_nombre_comercial').value = '';
    document.getElementById('prov_direccion').value = '';
    document.getElementById('prov_estado').value = 'ACTIVO';
}

function cargarProveedorEnForm(p) {
    document.getElementById('prov_id_proveedor').value = p.id_proveedor ?? '';
    document.getElementById('prov_ruc').value = p.ruc ?? '';
    document.getElementById('prov_razon_social').value = p.razon_social ?? '';
    document.getElementById('prov_nombre_comercial').value = p.nombre_comercial ?? '';
    document.getElementById('prov_direccion').value = p.direccion ?? '';
    document.getElementById('prov_estado').value = p.estado ?? 'ACTIVO';
}

function renderProveedoresTable() {
    const tbl = document.getElementById('tblProveedores');
    if (!tbl) return;
    const tbody = tbl.querySelector('tbody');
    tbody.innerHTML = '';

    proveedores.forEach(p => {
        const tr = document.createElement('tr');
        const estadoClass = p.estado === 'INACTIVO' ? 'style="color: #ef4444; font-style: italic;"' : '';
        tr.innerHTML = `
            <td>${escapeHtml(p.id_proveedor)}</td>
            <td>${escapeHtml(p.ruc)}</td>
            <td>${escapeHtml(p.nombre_comercial)}</td>
            <td ${estadoClass}>${escapeHtml(p.estado)}</td>
            <td>
                <div class="actions">
                    <button type="button" class="btn-small btn-secondary" data-action="edit" data-id="${p.id_proveedor}">Editar</button>
                    <button type="button" class="btn-small btn-danger" data-action="delete" data-id="${p.id_proveedor}">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const p = proveedores.find(x => x.id_proveedor === id);
            if (p) cargarProveedorEnForm(p);
        });
    });

    tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            if (!confirm('¿Eliminar proveedor?')) return;
            await api(`/proveedores/${id}`, 'DELETE');
            await cargarProveedores();
            mostrar('✅ Proveedor eliminado', 'exito');
        });
    });
}

async function guardarProveedor(event) {
    event.preventDefault();

    const id = document.getElementById('prov_id_proveedor').value;
    const payload = {
        ruc: document.getElementById('prov_ruc').value,
        razon_social: document.getElementById('prov_razon_social').value,
        nombre_comercial: document.getElementById('prov_nombre_comercial').value,
        direccion: document.getElementById('prov_direccion').value,
        estado: document.getElementById('prov_estado').value
    };

    if (id) {
        await api(`/proveedores/${Number(id)}`, 'PUT', payload);
        mostrar('✅ Proveedor actualizado', 'exito');
    } else {
        await api('/proveedores', 'POST', payload);
        mostrar('✅ Proveedor creado', 'exito');
    }

    limpiarFormProveedor();
    await cargarProveedores();
}

function limpiarFormProducto() {
    document.getElementById('prod_id_producto').value = '';
    document.getElementById('prod_sku_producto').value = '';
    document.getElementById('prod_nombre_producto').value = '';
    document.getElementById('prod_unidad_medida').value = '';
    document.getElementById('prod_categoria').value = '';
    document.getElementById('prod_estado').value = 'ACTIVO';
    syncSkuProductoDesdeNombre();
}

function cargarProductoEnForm(p) {
    document.getElementById('prod_id_producto').value = p.id_producto ?? '';
    document.getElementById('prod_sku_producto').value = p.sku_producto ?? '';
    document.getElementById('prod_nombre_producto').value = p.nombre_producto ?? '';
    document.getElementById('prod_categoria').value = p.categoria ?? '';
    document.getElementById('prod_unidad_medida').value = p.unidad_medida ?? '';
    document.getElementById('prod_estado').value = p.estado ?? 'ACTIVO';
}

function generarSkuDesdeNombre(nombre) {
    const cleaned = String(nombre ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) return '';

    const words = cleaned.split(' ').filter(Boolean);

    const initials = words
        .map(w => w[0])
        .filter(Boolean)
        .join('');

    return initials.substring(0, 10);
}

function syncSkuProductoDesdeNombre() {
    const id = document.getElementById('prod_id_producto');
    const sku = document.getElementById('prod_sku_producto');
    const nombre = document.getElementById('prod_nombre_producto');
    if (!id || !sku || !nombre) return;

    if (id.value) return;
    sku.value = generarSkuDesdeNombre(nombre.value);
}

function renderProductosTable() {
    const tbl = document.getElementById('tblProductos');
    if (!tbl) return;
    const tbody = tbl.querySelector('tbody');
    tbody.innerHTML = '';

    productos.forEach(p => {
        const tr = document.createElement('tr');
        const estadoClass = p.estado === 'INACTIVO' ? 'style="color: #ef4444; font-style: italic;"' : '';
        tr.innerHTML = `
            <td>${escapeHtml(p.id_producto)}</td>
            <td>${escapeHtml(p.sku_producto)}</td>
            <td>${escapeHtml(p.nombre_producto)}</td>
            <td ${estadoClass}>${escapeHtml(p.estado)}</td>
            <td>
                <div class="actions">
                    <button type="button" class="btn-small btn-secondary" data-action="edit" data-id="${p.id_producto}">Editar</button>
                    <button type="button" class="btn-small btn-danger" data-action="delete" data-id="${p.id_producto}">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const p = productos.find(x => x.id_producto === id);
            if (p) cargarProductoEnForm(p);
        });
    });

    tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            if (!confirm('¿Eliminar producto?')) return;
            await api(`/productos/${id}`, 'DELETE');
            await cargarProductos();
            mostrar('✅ Producto eliminado', 'exito');
        });
    });
}

async function guardarProducto(event) {
    event.preventDefault();

    const id = document.getElementById('prod_id_producto').value;
    const payload = {
        sku_producto: document.getElementById('prod_sku_producto').value,
        nombre_producto: document.getElementById('prod_nombre_producto').value,
        unidad_medida: document.getElementById('prod_unidad_medida').value,
        categoria: document.getElementById('prod_categoria').value,
        estado: document.getElementById('prod_estado').value
    };

    try {
        if (id) {
            await api(`/productos/${id}`, 'PUT', payload);
            mostrar('✅ Producto actualizado', 'exito');
        } else {
            await api('/productos', 'POST', payload);
            mostrar('✅ Producto creado', 'exito');
        }
        limpiarFormProducto();
        await cargarProductos();
    } catch (error) {
        mostrar('❌ Error al guardar producto: ' + error.message, 'error');
    }
}

function renderComprasTable() {
    const tbl = document.getElementById('tblCompras');
    if (!tbl) return;
    const tbody = tbl.querySelector('tbody');
    tbody.innerHTML = '';

    compras.forEach(c => {
        const prov = c.oltp_proveedores ? `${c.oltp_proveedores.nombre_comercial} (${c.oltp_proveedores.ruc})` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(c.id_compra)}</td>
            <td>${escapeHtml(c.tipo_documento)} - ${escapeHtml(c.numero_documento)}</td>
            <td>${escapeHtml(c.fecha_compra)}</td>
            <td>${escapeHtml(prov)}</td>
            <td>${escapeHtml(c.total)}</td>
            <td>
                <div class="actions">
                    <button type="button" class="btn-small btn-danger" data-action="delete" data-id="${c.id_compra}">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            if (!confirm('¿Eliminar compra y sus detalles?')) return;
            await api(`/compras/${id}`, 'DELETE');
            await cargarCompras();
            await cargarDetalles();
            mostrar('✅ Compra eliminada', 'exito');
        });
    });
}

function renderDetalleSelects() {
    const selCompra = document.getElementById('det_id_compra');
    const selProducto = document.getElementById('det_id_producto');
    if (!selCompra || !selProducto) return;

    selCompra.innerHTML = '<option value="">Seleccione...</option>';
    compras.forEach(c => {
        selCompra.innerHTML += `<option value="${c.id_compra}">${escapeHtml(c.tipo_documento)} - ${escapeHtml(c.numero_documento)}</option>`;
    });

    selProducto.innerHTML = '<option value="">Seleccione...</option>';
    productos.filter(p => p.estado === 'ACTIVO').forEach(p => {
        const display = `${p.sku_producto} - ${p.nombre_producto} (${p.unidad_medida || 'UN'})`;
        selProducto.innerHTML += `<option value="${p.id_producto}">${escapeHtml(display)}</option>`;
    });
}

function limpiarFormDetalle() {
    const id = document.getElementById('det_id_detalle');
    if (!id) return;
    id.value = '';
    document.getElementById('det_id_compra').value = '';
    document.getElementById('det_numero_linea').value = '';
    document.getElementById('det_id_producto').value = '';
    document.getElementById('det_cantidad').value = '';
    document.getElementById('det_precio_unitario').value = '';
    document.getElementById('det_total_linea').value = '';
}

function cargarDetalleEnForm(d) {
    document.getElementById('det_id_detalle').value = d.id_detalle ?? '';
    document.getElementById('det_id_compra').value = d.id_compra ?? '';
    document.getElementById('det_numero_linea').value = d.numero_linea ?? '';
    document.getElementById('det_id_producto').value = d.id_producto ?? '';
    document.getElementById('det_cantidad').value = d.cantidad ?? '';
    document.getElementById('det_precio_unitario').value = d.precio_unitario ?? '';
    document.getElementById('det_total_linea').value = d.total_linea ?? '';
}

function renderDetallesTable(detalles) {
    const tbl = document.getElementById('tblDetalles');
    if (!tbl) return;
    const tbody = tbl.querySelector('tbody');
    tbody.innerHTML = '';

    detalles.forEach(d => {
        const compraLabel = d.oltp_compras ? `${d.oltp_compras.tipo_documento} - ${d.oltp_compras.numero_documento}` : d.id_compra;
        const prodLabel = d.oltp_productos ? `${d.oltp_productos.sku_producto} - ${d.oltp_productos.nombre_producto}` : d.id_producto;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(d.id_detalle)}</td>
            <td>${escapeHtml(compraLabel)}</td>
            <td>${escapeHtml(prodLabel)}</td>
            <td>${escapeHtml(d.cantidad)}</td>
            <td>${escapeHtml(d.precio_unitario)}</td>
            <td>${escapeHtml(d.total_linea)}</td>
            <td>
                <div class="actions">
                    <button type="button" class="btn-small btn-secondary" data-action="edit" data-id="${d.id_detalle}">Editar</button>
                    <button type="button" class="btn-small btn-danger" data-action="delete" data-id="${d.id_detalle}">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            const d = await api(`/compras-detalles/${id}`);
            cargarDetalleEnForm(d);
        });
    });

    tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            if (!confirm('¿Eliminar detalle?')) return;
            await api(`/compras-detalles/${id}`, 'DELETE');
            await cargarDetalles();
            mostrar('✅ Detalle eliminado', 'exito');
        });
    });
}

async function guardarDetalle(event) {
    event.preventDefault();

    const id = document.getElementById('det_id_detalle').value;
    const payload = {
        id_compra: Number(document.getElementById('det_id_compra').value),
        numero_linea: document.getElementById('det_numero_linea').value ? Number(document.getElementById('det_numero_linea').value) : null,
        id_producto: Number(document.getElementById('det_id_producto').value),
        cantidad: Number(document.getElementById('det_cantidad').value),
        precio_unitario: Number(document.getElementById('det_precio_unitario').value),
        total_linea: Number(document.getElementById('det_total_linea').value)
    };

    if (!payload.id_compra || !payload.id_producto) {
        mostrar('❌ Seleccione compra y producto', 'error');
        return;
    }

    if (id) {
        await api(`/compras-detalles/${Number(id)}`, 'PUT', payload);
        mostrar('✅ Detalle actualizado', 'exito');
    } else {
        await api('/compras-detalles', 'POST', payload);
        mostrar('✅ Detalle creado', 'exito');
    }

    limpiarFormDetalle();
    await cargarDetalles();
}

// Agregar un nuevo item al formulario
function agregarItem() {
    itemCount++;
    const div = document.createElement('div');
    div.className = 'item';
    div.id = 'item' + itemCount;

    const opcionesProductos = productos.filter(p => p.estado === 'ACTIVO').map(p =>
        `<option value="${p.id_producto}">${escapeHtml(p.sku_producto)} - ${escapeHtml(p.nombre_producto)} (${p.unidad_medida || 'UN'})</option>`
    ).join('');

    div.innerHTML = `
        <label>Producto:</label>
        <select id="prod${itemCount}" required>
            <option value="">Seleccione...</option>
            ${opcionesProductos}
        </select>

        <label>Cantidad:</label>
        <input type="number" step="0.01" id="cant${itemCount}" required min="0.01">

        <label>Precio Unitario:</label>
        <input type="number" step="0.01" id="precio${itemCount}" required min="0.01">

        <button type="button" onclick="eliminarItem('item${itemCount}')">🗑️ Eliminar</button>
    `;

    const container = document.getElementById('items');
    if (container) container.appendChild(div);

    const cant = document.getElementById('cant' + itemCount);
    const precio = document.getElementById('precio' + itemCount);
    const prod = document.getElementById('prod' + itemCount);
    if (cant) {
        cant.addEventListener('input', recalcularTotal);
        aplicarConversionFracciones(cant);
    }
    if (precio) precio.addEventListener('input', recalcularTotal);
    if (prod) prod.addEventListener('change', recalcularTotal);

    recalcularTotal();
}

function recalcularTotal() {
    const totalInput = document.getElementById('total');
    if (!totalInput) return;

    let total = 0;
    for (let i = 1; i <= itemCount; i++) {
        const prod = document.getElementById('prod' + i);
        if (!prod || !prod.value) continue;

        const cantEl = document.getElementById('cant' + i);
        const precioEl = document.getElementById('precio' + i);
        const cant = cantEl ? Number(cantEl.value) : 0;
        const precio = precioEl ? Number(precioEl.value) : 0;
        if (!Number.isFinite(cant) || !Number.isFinite(precio)) continue;
        total += cant * precio;
    }

    totalInput.value = total ? total.toFixed(2) : '';
}

// Eliminar un item
function eliminarItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
        item.remove();
        recalcularTotal();
    }
}

// Validar formulario
function validarFormulario() {
    const form = document.getElementById('boletaForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    
    // Validar que haya al menos un item
    const items = document.querySelectorAll('.item');
    if (items.length === 0) {
        mostrar('❌ Debe agregar al menos un item', 'error');
        return false;
    }
    
    // Validar que todos los items tengan datos completos
    for (let i = 1; i <= itemCount; i++) {
        const prod = document.getElementById('prod' + i);
        if (prod && prod.value) {
            const cant = document.getElementById('cant' + i);
            const precio = document.getElementById('precio' + i);
            
            if (!cant.value || !precio.value || cant.value <= 0 || precio.value <= 0) {
                mostrar('❌ Complete todos los campos del item correctamente', 'error');
                return false;
            }
        }
    }
    
    return true;
}

// Guardar la boleta completa
async function guardar(event) {
    event.preventDefault();
    
    if (!validarFormulario()) {
        return;
    }
    
    try {
        // Mostrar estado de carga
        document.getElementById('boletaForm').classList.add('loading');
        
        // Preparar datos de la compra
        const compraData = {
            numero_documento: document.getElementById('nro_doc').value,
            tipo_documento: document.getElementById('tipo_doc').value,
            fecha_compra: document.getElementById('fecha').value,
            id_proveedor: parseInt(document.getElementById('proveedor').value),
            total: parseFloat(document.getElementById('total').value),
            observaciones: document.getElementById('obs').value
        };
        
        // Guardar compra
        const compra = await api('/compras', 'POST', compraData);
        
        // Guardar items
        const itemsPromises = [];
        for (let i = 1; i <= itemCount; i++) {
            const prod = document.getElementById('prod' + i);
            if (prod && prod.value) {
                const itemData = {
                    id_compra: compra.id_compra,
                    numero_linea: i,
                    id_producto: parseInt(prod.value),
                    cantidad: parseFloat(document.getElementById('cant' + i).value),
                    precio_unitario: parseFloat(document.getElementById('precio' + i).value)
                };
                itemData.total_linea = itemData.cantidad * itemData.precio_unitario;
                
                itemsPromises.push(api('/compras-detalles', 'POST', itemData));
            }
        }
        
        await Promise.all(itemsPromises);
        
        mostrar('✅ Boleta guardada correctamente!', 'exito');
        
        // Limpiar formulario después de 2 segundos
        setTimeout(() => {
            document.getElementById('boletaForm').reset();
            document.getElementById('items').innerHTML = '';
            itemCount = 0;
            agregarItem();
            document.getElementById('fecha').value = getFechaActualLocal();
        }, 2000);
        
    } catch (error) {
        mostrar('❌ Error al guardar: ' + error.message, 'error');
    } finally {
        document.getElementById('boletaForm').classList.remove('loading');
    }
}

// Mostrar mensajes al usuario
function mostrar(texto, tipo = 'exito') {
    const el = document.getElementById('mensaje');
    if (!el) return;
    el.textContent = texto;
    el.className = `mensaje ${tipo}`;
    el.classList.add('show');
    setTimeout(() => {
        el.classList.remove('show');
    }, 2000);
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const view = btn.dataset.view;
            setActiveView(view);

            if (view === 'ventas') {
                await Promise.all([cargarProductos(), cargarVentas()]);
                const vFecha = document.getElementById('v_fecha');
                if (vFecha) vFecha.value = getFechaActualLocal();
            }
            if (view === 'proveedores') await cargarProveedores();
            if (view === 'productos') await cargarProductos();
            if (view === 'compras') await cargarCompras();
            if (view === 'detalles') {
                await Promise.all([cargarCompras(), cargarProductos()]);
                await cargarDetalles();
            }
        });
    });

    const btnAgregarItemVenta = document.getElementById('btnAgregarItemVenta');
    if (btnAgregarItemVenta) btnAgregarItemVenta.addEventListener('click', agregarItemVenta);

    const ventaForm = document.getElementById('ventaForm');
    if (ventaForm) ventaForm.addEventListener('submit', guardarVenta);

    const btnRefrescarVentas = document.getElementById('btnRefrescarVentas');
    if (btnRefrescarVentas) btnRefrescarVentas.addEventListener('click', cargarVentas);

    // Validación en tiempo real del número de documento de ventas
    const nroDocInput = document.getElementById('v_nro_doc');
    const nroDocHelp = document.getElementById('v_nro_doc_help');
    if (nroDocInput && nroDocHelp) {
        let timeout;
        nroDocInput.addEventListener('input', async () => {
            clearTimeout(timeout);
            const val = nroDocInput.value.trim();
            if (!val) {
                nroDocHelp.textContent = '';
                nroDocHelp.style.color = '';
                return;
            }
            nroDocHelp.textContent = 'Verificando...';
            nroDocHelp.style.color = '#666';
            timeout = setTimeout(async () => {
                try {
                    const check = await api(`/ventas/check-documento/${encodeURIComponent(val)}`);
                    if (check.exists) {
                        nroDocHelp.textContent = '⚠️ Este número de documento ya existe.';
                        nroDocHelp.style.color = '#ef4444';
                    } else {
                        nroDocHelp.textContent = '✅ Disponible';
                        nroDocHelp.style.color = '#10b981';
                    }
                } catch {
                    nroDocHelp.textContent = '';
                }
            }, 400);
        });
    }

    // Validación en tiempo real del número de documento de compras
    const nroDocCompraInput = document.getElementById('nro_doc');
    const nroDocCompraHelp = document.getElementById('nro_doc_help');
    if (nroDocCompraInput && nroDocCompraHelp) {
        let timeout;
        nroDocCompraInput.addEventListener('input', async () => {
            clearTimeout(timeout);
            const val = nroDocCompraInput.value.trim();
            if (!val) {
                nroDocCompraHelp.textContent = '';
                nroDocCompraHelp.style.color = '';
                return;
            }
            nroDocCompraHelp.textContent = 'Verificando...';
            nroDocCompraHelp.style.color = '#666';
            timeout = setTimeout(async () => {
                try {
                    const check = await api(`/compras/check-documento/${encodeURIComponent(val)}`);
                    if (check.exists) {
                        nroDocCompraHelp.textContent = '⚠️ Este número de documento ya existe.';
                        nroDocCompraHelp.style.color = '#ef4444';
                    } else {
                        nroDocCompraHelp.textContent = '✅ Disponible';
                        nroDocCompraHelp.style.color = '#10b981';
                    }
                } catch {
                    nroDocCompraHelp.textContent = '';
                }
            }, 400);
        });
    }

    const btnAgregarItem = document.getElementById('btnAgregarItem');
    if (btnAgregarItem) btnAgregarItem.addEventListener('click', agregarItem);

    const boletaForm = document.getElementById('boletaForm');
    if (boletaForm) boletaForm.addEventListener('submit', guardar);

    const formProveedor = document.getElementById('formProveedor');
    if (formProveedor) formProveedor.addEventListener('submit', guardarProveedor);

    const formProducto = document.getElementById('formProducto');
    if (formProducto) formProducto.addEventListener('submit', guardarProducto);

    const prodNombre = document.getElementById('prod_nombre_producto');
    if (prodNombre) prodNombre.addEventListener('input', syncSkuProductoDesdeNombre);

    const formDetalle = document.getElementById('formDetalle');
    if (formDetalle) formDetalle.addEventListener('submit', guardarDetalle);

    const btnNuevoProveedor = document.getElementById('btnNuevoProveedor');
    if (btnNuevoProveedor) btnNuevoProveedor.addEventListener('click', limpiarFormProveedor);

    const btnRefrescarProveedores = document.getElementById('btnRefrescarProveedores');
    if (btnRefrescarProveedores) btnRefrescarProveedores.addEventListener('click', cargarProveedores);

    const btnNuevoProducto = document.getElementById('btnNuevoProducto');
    if (btnNuevoProducto) btnNuevoProducto.addEventListener('click', () => {
        limpiarFormProducto();
        syncSkuProductoDesdeNombre();
    });

    const btnRefrescarProductos = document.getElementById('btnRefrescarProductos');
    if (btnRefrescarProductos) btnRefrescarProductos.addEventListener('click', cargarProductos);

    const btnRefrescarCompras = document.getElementById('btnRefrescarCompras');
    if (btnRefrescarCompras) btnRefrescarCompras.addEventListener('click', cargarCompras);

    const btnNuevoDetalle = document.getElementById('btnNuevoDetalle');
    if (btnNuevoDetalle) btnNuevoDetalle.addEventListener('click', limpiarFormDetalle);

    const btnRefrescarDetalles = document.getElementById('btnRefrescarDetalles');
    if (btnRefrescarDetalles) btnRefrescarDetalles.addEventListener('click', cargarDetalles);

    await Promise.all([
        cargarProveedores(),
        cargarProductos(),
        cargarCompras(),
        cargarVentas()
    ]);

    const fecha = document.getElementById('fecha');
    if (fecha) fecha.value = getFechaActualLocal();

    const vFecha = document.getElementById('v_fecha');
    if (vFecha) vFecha.value = getFechaActualLocal();

    const itemsDiv = document.getElementById('items');
    if (itemsDiv) agregarItem();

    const vItemsDiv = document.getElementById('v_items');
    if (vItemsDiv) agregarItemVenta();

    setActiveView('ventas');
});
