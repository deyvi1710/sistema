const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware para manejo de errores
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// Routes API

// GET - Obtener proveedores
app.get('/api/proveedores', async (req, res) => {
    try {
        let query = supabase
            .from('oltp_proveedores')
            .select('*')
            .order('nombre_comercial');

        if (req.query.estado) {
            query = query.eq('estado', req.query.estado);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error obteniendo proveedores:', error);
        res.status(500).json({ message: 'Error obteniendo proveedores' });
    }
});

app.get('/api/proveedores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { data, error } = await supabase
            .from('oltp_proveedores')
            .select('*')
            .eq('id_proveedor', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo proveedor:', error);
        res.status(500).json({ message: 'Error obteniendo proveedor' });
    }
});

app.post('/api/proveedores', async (req, res) => {
    try {
        const proveedorData = req.body;

        if (!proveedorData.ruc || !proveedorData.nombre_comercial) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const { data, error } = await supabase
            .from('oltp_proveedores')
            .insert([proveedorData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creando proveedor:', error);
        res.status(500).json({ message: 'Error creando proveedor' });
    }
});

app.put('/api/proveedores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const proveedorData = req.body;
        const { data, error } = await supabase
            .from('oltp_proveedores')
            .update(proveedorData)
            .eq('id_proveedor', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error actualizando proveedor:', error);
        res.status(500).json({ message: 'Error actualizando proveedor' });
    }
});

app.delete('/api/proveedores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { error } = await supabase
            .from('oltp_proveedores')
            .update({ estado: 'INACTIVO' })
            .eq('id_proveedor', id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando proveedor:', error);
        res.status(500).json({ message: 'Error eliminando proveedor' });
    }
});

// GET - Obtener productos
app.get('/api/productos', async (req, res) => {
    try {
        let query = supabase
            .from('oltp_productos')
            .select('*')
            .order('nombre_producto');

        if (req.query.estado) {
            query = query.eq('estado', req.query.estado);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ message: 'Error obteniendo productos' });
    }
});

app.get('/api/productos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { data, error } = await supabase
            .from('oltp_productos')
            .select('*')
            .eq('id_producto', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ message: 'Error obteniendo producto' });
    }
});

app.post('/api/productos', async (req, res) => {
    try {
        const productoData = req.body;

        if (!productoData.sku_producto || !productoData.nombre_producto || !productoData.unidad_medida) {
            return res.status(400).json({ message: 'Faltan campos obligatorios: sku_producto, nombre_producto, unidad_medida' });
        }

        const { data, error } = await supabase
            .from('oltp_productos')
            .insert([productoData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ message: 'Error creando producto' });
    }
});

app.put('/api/productos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const productoData = req.body;
        const { data, error } = await supabase
            .from('oltp_productos')
            .update(productoData)
            .eq('id_producto', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ message: 'Error actualizando producto' });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        // Soft delete: cambiar estado a INACTIVO en lugar de eliminar
        const { error } = await supabase
            .from('oltp_productos')
            .update({ estado: 'INACTIVO' })
            .eq('id_producto', id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ message: 'Error eliminando producto' });
    }
});

// POST - Crear nueva compra
app.post('/api/compras', async (req, res) => {
    try {
        const compraData = req.body;

        // Validaciones básicas
        if (!compraData.numero_documento || !compraData.id_proveedor || !compraData.total) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const { data, error } = await supabase
            .from('oltp_compras')
            .insert([compraData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creando compra:', error);
        res.status(500).json({ message: 'Error creando compra' });
    }
});

// POST - Crear detalles de compra
app.post('/api/compras-detalles', async (req, res) => {
    try {
        const detalleData = req.body;

        // Validaciones básicas
        if (!detalleData.id_compra || !detalleData.id_producto || !detalleData.cantidad || !detalleData.precio_unitario) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const { data, error } = await supabase
            .from('oltp_compras_detalle')
            .insert([detalleData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creando detalle de compra:', error);
        res.status(500).json({ message: 'Error creando detalle de compra' });
    }
});

app.get('/api/compras-detalles', async (req, res) => {
    try {
        let query = supabase
            .from('oltp_compras_detalle')
            .select(`
                *,
                oltp_compras (numero_documento, tipo_documento, fecha_compra),
                oltp_productos (sku_producto, nombre_producto)
            `)
            .order('id_detalle', { ascending: false });

        if (req.query.id_compra) {
            const idCompra = Number(req.query.id_compra);
            if (!Number.isFinite(idCompra)) {
                return res.status(400).json({ message: 'id_compra inválido' });
            }
            query = query.eq('id_compra', idCompra);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo detalles de compra:', error);
        res.status(500).json({ message: 'Error obteniendo detalles de compra' });
    }
});

app.get('/api/compras-detalles/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { data, error } = await supabase
            .from('oltp_compras_detalle')
            .select('*')
            .eq('id_detalle', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Detalle no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo detalle:', error);
        res.status(500).json({ message: 'Error obteniendo detalle' });
    }
});

app.put('/api/compras-detalles/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const detalleData = req.body;
        const { data, error } = await supabase
            .from('oltp_compras_detalle')
            .update(detalleData)
            .eq('id_detalle', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Detalle no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error actualizando detalle:', error);
        res.status(500).json({ message: 'Error actualizando detalle' });
    }
});

app.delete('/api/compras-detalles/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { error } = await supabase
            .from('oltp_compras_detalle')
            .delete()
            .eq('id_detalle', id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando detalle:', error);
        res.status(500).json({ message: 'Error eliminando detalle' });
    }
});

// GET - Obtener compras con sus detalles
app.get('/api/compras', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('oltp_compras')
            .select(`
                *,
                oltp_proveedores (nombre_comercial, ruc),
                oltp_compras_detalle (
                    *,
                    oltp_productos (nombre_producto, sku_producto)
                )
            `)
            .order('fecha_compra', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error obteniendo compras:', error);
        res.status(500).json({ message: 'Error obteniendo compras' });
    }
});

// GET - Verificar si número de documento de compra ya existe
app.get('/api/compras/check-documento/:numero', async (req, res) => {
    try {
        const numero = req.params.numero;
        if (!numero) {
            return res.status(400).json({ message: 'Número requerido' });
        }

        const { data, error } = await supabase
            .from('oltp_compras')
            .select('id_compra')
            .eq('numero_documento', numero)
            .limit(1);

        if (error) throw error;

        const exists = data && data.length > 0;
        res.json({ exists, id_compra: exists ? data[0].id_compra : null });
    } catch (error) {
        console.error('Error verificando documento de compra:', error);
        res.status(500).json({ message: 'Error verificando documento de compra' });
    }
});

// GET - Obtener compra específica con detalles
app.get('/api/compras/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('oltp_compras')
            .select(`
                *,
                oltp_proveedores (nombre_comercial, ruc),
                oltp_compras_detalle (
                    *,
                    oltp_productos (nombre_producto, sku_producto)
                )
            `)
            .eq('id_compra', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error obteniendo compra:', error);
        res.status(500).json({ message: 'Error obteniendo compra' });
    }
});

// PUT - Actualizar compra
app.put('/api/compras/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const compraData = req.body;

        const { data, error } = await supabase
            .from('oltp_compras')
            .update(compraData)
            .eq('id_compra', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error actualizando compra:', error);
        res.status(500).json({ message: 'Error actualizando compra' });
    }
});

// DELETE - Eliminar compra (y sus detalles en cascada)
app.delete('/api/compras/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Primero eliminar los detalles
        const { error: detallesError } = await supabase
            .from('oltp_compras_detalle')
            .delete()
            .eq('id_compra', id);

        if (detallesError) throw detallesError;

        // Luego eliminar la compra
        const { error: compraError } = await supabase
            .from('oltp_compras')
            .delete()
            .eq('id_compra', id);

        if (compraError) throw compraError;

        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando compra:', error);
        res.status(500).json({ message: 'Error eliminando compra' });
    }
});

app.get('/api/ventas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('oltp_ventas')
            .select(`
                id_venta,
                numero_documento,
                tipo_documento,
                fecha_venta,
                cliente_nombre,
                cliente_documento,
                total,
                observaciones
            `)
            .order('id_venta', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error listando ventas:', error);
        res.status(500).json({ message: 'Error listando ventas' });
    }
});

app.get('/api/ventas/check-documento/:numero', async (req, res) => {
    try {
        const numero = req.params.numero;
        if (!numero) {
            return res.status(400).json({ message: 'Número requerido' });
        }

        const { data, error } = await supabase
            .from('oltp_ventas')
            .select('id_venta')
            .eq('numero_documento', numero)
            .limit(1);

        if (error) throw error;

        const exists = data && data.length > 0;
        res.json({ exists, id_venta: exists ? data[0].id_venta : null });
    } catch (error) {
        console.error('Error verificando documento:', error);
        res.status(500).json({ message: 'Error verificando documento' });
    }
});

app.get('/api/ventas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { data, error } = await supabase
            .from('oltp_ventas')
            .select(`
                *,
                oltp_ventas_detalle (
                    *,
                    oltp_productos (nombre_producto, sku_producto)
                )
            `)
            .eq('id_venta', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Venta no encontrada' });
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo venta:', error);
        res.status(500).json({ message: 'Error obteniendo venta' });
    }
});

app.post('/api/ventas', async (req, res) => {
    try {
        const ventaData = req.body;

        if (!ventaData.numero_documento || !ventaData.tipo_documento || !ventaData.fecha_venta || !ventaData.total) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const { data, error } = await supabase
            .from('oltp_ventas')
            .insert([ventaData])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ message: 'El número de documento ya existe. Debe ser único.' });
            }
            throw error;
        }
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creando venta:', error);
        res.status(500).json({ message: 'Error creando venta' });
    }
});

app.put('/api/ventas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const ventaData = req.body;
        const { data, error } = await supabase
            .from('oltp_ventas')
            .update(ventaData)
            .eq('id_venta', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Venta no encontrada' });
        res.json(data);
    } catch (error) {
        console.error('Error actualizando venta:', error);
        res.status(500).json({ message: 'Error actualizando venta' });
    }
});

app.delete('/api/ventas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { error: detallesError } = await supabase
            .from('oltp_ventas_detalle')
            .delete()
            .eq('id_venta', id);

        if (detallesError) throw detallesError;

        const { error: ventaError } = await supabase
            .from('oltp_ventas')
            .delete()
            .eq('id_venta', id);

        if (ventaError) throw ventaError;

        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando venta:', error);
        res.status(500).json({ message: 'Error eliminando venta' });
    }
});

app.get('/api/ventas-detalles', async (req, res) => {
    try {
        let query = supabase
            .from('oltp_ventas_detalle')
            .select(`
                *,
                oltp_ventas (numero_documento, tipo_documento, fecha_venta),
                oltp_productos (sku_producto, nombre_producto)
            `)
            .order('id_detalle', { ascending: false });

        if (req.query.id_venta) {
            const idVenta = Number(req.query.id_venta);
            if (!Number.isFinite(idVenta)) {
                return res.status(400).json({ message: 'id_venta inválido' });
            }
            query = query.eq('id_venta', idVenta);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo detalles de venta:', error);
        res.status(500).json({ message: 'Error obteniendo detalles de venta' });
    }
});

app.get('/api/ventas-detalles/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { data, error } = await supabase
            .from('oltp_ventas_detalle')
            .select('*')
            .eq('id_detalle', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Detalle no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo detalle de venta:', error);
        res.status(500).json({ message: 'Error obteniendo detalle de venta' });
    }
});

app.post('/api/ventas-detalles', async (req, res) => {
    try {
        const detalleData = req.body;

        if (!detalleData.id_venta || !detalleData.id_producto || !detalleData.cantidad || !detalleData.precio_unitario || !detalleData.total_linea) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const { data, error } = await supabase
            .from('oltp_ventas_detalle')
            .insert([detalleData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creando detalle de venta:', error);
        res.status(500).json({ message: 'Error creando detalle de venta' });
    }
});

app.put('/api/ventas-detalles/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const detalleData = req.body;
        const { data, error } = await supabase
            .from('oltp_ventas_detalle')
            .update(detalleData)
            .eq('id_detalle', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Detalle no encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Error actualizando detalle de venta:', error);
        res.status(500).json({ message: 'Error actualizando detalle de venta' });
    }
});

app.delete('/api/ventas-detalles/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { error } = await supabase
            .from('oltp_ventas_detalle')
            .delete()
            .eq('id_detalle', id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando detalle de venta:', error);
        res.status(500).json({ message: 'Error eliminando detalle de venta' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Ruta por defecto para API no encontrada
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Endpoint no encontrado' });
});

// Middleware de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 API disponible en http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
