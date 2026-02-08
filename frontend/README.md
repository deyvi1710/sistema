# Frontend - Digitalización de Boletas

Interfaz web moderna para la digitalización de boletas y facturas.

## 🚀 Inicio Rápido

1. Abrir el archivo `index.html` en un navegador web:
```bash
# O servir con un servidor web local
npx serve .
# o
python -m http.server 8000
```

2. Asegurarse que el backend esté corriendo en `http://localhost:3000`

## 📁 Estructura de Archivos

```
frontend/
├── index.html         # Página principal
├── styles.css         # Estilos CSS modernos
├── app.js            # Lógica JavaScript
└── README.md         # Documentación
```

## 🎨 Características de la Interfaz

### Diseño Moderno
- **Gradientes** modernos y atractivos
- **Animaciones** suaves al agregar items
- **Diseño responsive** para móviles y tablets
- **Focus states** accesibles
- **Loading states** durante peticiones

### Funcionalidades
- ✅ Formulario validado
- ✅ Items dinámicos con agregar/eliminar
- ✅ Mensajes de éxito/error animados
- ✅ Autocompletado de fecha actual
- ✅ Carga automática de proveedores y productos
- ✅ Manejo de errores robusto

## 🔧 Configuración

La URL del API se configura en `app.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 📱 Uso

1. **Seleccionar tipo de documento** (Boleta/Factura/Guía)
2. **Ingresar número de documento**
3. **Seleccionar fecha** (se autocompleta con fecha actual)
4. **Elegir proveedor** de la lista cargada desde la API
5. **Ingresar total** del documento
6. **Agregar observaciones** (opcional)
7. **Agregar items** del producto:
   - Seleccionar producto
   - Ingresar cantidad y precio unitario
   - Agregar más items si es necesario
8. **Guardar** la boleta completa

## 🎯 Flujo de Trabajo

```
1. Usuario abre index.html
2. Frontend carga proveedores y productos desde API
3. Usuario completa formulario
4. Al guardar, frontend envía datos a backend
5. Backend procesa y guarda en Supabase
6. Frontend muestra mensaje de éxito
7. Formulario se limpia para siguiente boleta
```

## 🛡️ Validaciones

### Formulario Principal
- Todos los campos obligatorios deben estar completos
- El total debe ser un número válido
- Se debe seleccionar un proveedor

### Items
- Debe haber al menos un item
- Cada item debe tener producto, cantidad y precio
- Cantidades y precios deben ser mayores a 0

## 🎨 Estilos CSS

### Variables de Diseño
- **Colores primarios**: Gradiente púrpura-azul
- **Colores de éxito**: Gradientes verdes
- **Colores de error**: Gradientes rojos
- **Tipografía**: Segoe UI, sans-serif moderno

### Animaciones
- `slideIn` para nuevos items
- `fadeIn` para mensajes
- `hover` effects en botones
- `focus` states accesibles

## 📊 Manejo de Estados

### Loading
- El formulario se deshabilita durante peticiones
- Indicador visual de carga

### Mensajes
- Éxito: Verde con checkmark
- Error: Rojo con X
- Auto-ocultado después de 5 segundos

## 🔍 Depuración

### Console Logs
- Todas las peticiones API se loguean
- Errores se muestran en consola y UI

### Network Tab
- Revisar peticiones en DevTools
- Verificar respuestas del backend

## 🚀 Mejoras Futuras

- [ ] Paginación para grandes volúmenes de datos
- [ ] Búsqueda de productos por SKU o nombre
- [ ] Vista previa de boleta antes de guardar
- [ ] Exportación a PDF
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)
