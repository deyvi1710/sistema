# 📋 Digitalización de Boletas y Facturas

Sistema web completo para la digitalización y gestión de boletas, facturas y guías de remisión.

## 🏗️ Arquitectura

```
programacion/
├── frontend/           # Interfaz de usuario
│   ├── index.html     # Página principal
│   ├── styles.css     # Estilos modernos
│   ├── app.js         # Lógica JavaScript
│   └── README.md      # Documentación frontend
├── backend/           # API RESTful
│   ├── server.js      # Servidor Express
│   ├── package.json   # Dependencias
│   ├── .env          # Variables de entorno
│   └── README.md     # Documentación backend
└── README.md          # Este archivo
```

## 🚀 Puesta en Marcha

### 1. Backend (Node.js + Express + Supabase)

```bash
cd backend
npm install
npm run dev
```

El backend iniciará en `http://localhost:3000`

### 2. Frontend (HTML + CSS + JavaScript)

```bash
cd frontend
# Abrir index.html en navegador o:
npx serve .
```

El frontend estará disponible en `http://localhost:8000` (con serve) o directamente abriendo el HTML.

## 📋 Requisitos Previos

- **Node.js** (v14 o superior)
- **Navegador web moderno**
- **Cuenta de Supabase** con tablas configuradas

## 🗄️ Estructura de Base de Datos (Supabase)

### Tablas Requeridas:
- `oltp_proveedores` - Proveedores activos
- `oltp_productos` - Productos activos  
- `oltp_compras` - Cabeceras de compras
- `oltp_compras_detalle` - Detalles de compras

## 🔧 Configuración

1. **Backend**: Configurar `.env` con credenciales de Supabase
2. **Frontend**: La URL del API está configurada en `app.js`

## 📊 Flujo de Trabajo

```
1. Usuario ingresa datos en frontend
2. Frontend valida y envía a backend API
3. Backend procesa y guarda en Supabase
4. Backend responde con confirmación
5. Frontend muestra resultado al usuario
```

## 🛡️ Seguridad

- Las credenciales de Supabase están en backend (.env)
- Frontend no expone información sensible
- Validación de datos en ambos lados
- CORS configurado adecuadamente

## 🎯 Características

### Frontend
- ✅ Diseño moderno y responsive
- ✅ Formulario validado
- ✅ Items dinámicos
- ✅ Mensajes animados
- ✅ Manejo de errores

### Backend
- ✅ API RESTful completa
- ✅ Conexión segura a Supabase
- ✅ Manejo de errores
- ✅ Logging de peticiones
- ✅ Health check

## 📚 Documentación

- [Documentación Frontend](./frontend/README.md)
- [Documentación Backend](./backend/README.md)

## 🚀 Tecnologías

### Frontend
- HTML5 Semántico
- CSS3 Moderno (Gradientes, Animaciones)
- JavaScript ES6+
- Fetch API

### Backend
- Node.js
- Express.js
- Supabase Client
- CORS
- dotenv

## 📈 Mejoras Futuras

- [ ] Autenticación de usuarios
- [ ] Roles y permisos
- [ ] Dashboard de estadísticas
- [ ] Exportación a Excel/PDF
- [ ] Búsqueda avanzada
- [ ] Modo offline con PWA

## 🤝 Contribuir

1. Fork del proyecto
2. Crear feature branch
3. Commit con cambios
4. Push al branch
5. Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles
