# Sistema de Seguridad Ciudadana - Versión MySQL

Sistema completo de gestión de incidencias ciudadanas con arquitectura moderna.

**Tecnología**: React + TypeScript + Node.js + Express + MySQL

## Cambios Principales

✅ **Migrado de Supabase a MySQL** - Base de datos propia en Clever Cloud
✅ **Backend Node.js creado** - API REST con Express + TypeScript
✅ **Autenticación con JWT** - Sistema seguro sin dependencias externas
✅ **Listo para producción** - Despliegue en Vercel + Render + Clever Cloud

## Estructura del Proyecto

```
project/
├── src/                    # Frontend React + Vite
│   ├── components/        # Componentes React
│   ├── contexts/          # Context API (Auth)
│   ├── lib/               # Utilidades (API, tipos)
│   └── App.tsx            # Componente principal
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── config/        # BD y autenticación
│   │   ├── middleware/    # Auth, CORS
│   │   ├── routes/        # Endpoints API
│   │   └── index.ts       # Servidor Express
│   ├── db/
│   │   └── init.sql       # Schema MySQL
│   └── package.json       # Dependencias backend
├── DEPLOYMENT.md          # Guía de despliegue
└── VERCEL_RENDER_SETUP.md # Setup paso a paso
```

## Inicio Rápido Local

### Frontend
```bash
npm install
npm run dev              # http://localhost:5173
```

### Backend
```bash
cd server
npm install
cp .env.example .env     # Configurar BD
npm run dev              # http://localhost:3000
```

### Base de Datos
```bash
# Crear BD local (necesitas MySQL)
mysql -u root < server/db/init.sql
```

## Variables de Entorno

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3000/api
```

### Backend (`server/.env`)
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=security_system
JWT_SECRET=tu-secreto-aqui
FRONTEND_URL=http://localhost:5173
```

## Despliegue Producción

**Muy importante**: Lee `VERCEL_RENDER_SETUP.md` para instrucciones paso a paso.

Resumen rápido:
1. **Clever Cloud**: MySQL (base de datos)
2. **Render**: Backend Node.js
3. **Vercel**: Frontend React

Cada push a `main` despliega automáticamente.

## Características

✅ Registro e inicio de sesión
✅ Reportar incidencias ciudadanas
✅ Categorías de incidencias
✅ Panel de autoridades para gestión
✅ Filtros y búsqueda
✅ Geolocalización
✅ JWT para autenticación

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Profiles
- `GET /api/profiles/me` - Mi perfil
- `GET /api/profiles/:id` - Perfil de usuario

### Incidents
- `GET /api/incidents` - Listar incidencias
- `POST /api/incidents` - Crear incidencia
- `PATCH /api/incidents/:id` - Actualizar (solo autoridades)

### Categories
- `GET /api/categories` - Listar categorías

## Roles de Usuario

- **Citizen**: Puede reportar incidencias
- **Authority**: Puede gestionar incidencias (cambiar estado, etc)

## Scripts

### Frontend
```bash
npm run dev       # Desarrollo
npm run build     # Build producción
npm run lint      # Verificar código
```

### Backend
```bash
npm run server:dev     # Desarrollo
npm run server:build   # Build
npm run server:start   # Producción
```

## Seguridad

- ✅ JWT tokens para autenticación
- ✅ Bcrypt para contraseñas
- ✅ CORS configurado
- ✅ Validación de datos en backend
- ✅ Variables de entorno protegidas
- ✅ Errores controlados

## Troubleshooting

**Error: Cannot connect to database**
- Verificar que MySQL está ejecutándose
- Verificar credenciales en `.env`

**Error: CORS error**
- Verificar `FRONTEND_URL` en backend
- Limpiar cache del navegador

**Error: Token inválido**
- Verificar que `JWT_SECRET` es igual en frontend y backend

## Próximos Pasos

1. Configurar Clever Cloud (BD)
2. Desplegar en Render (backend)
3. Desplegar en Vercel (frontend)
4. Monitorear logs

Más detalles: `VERCEL_RENDER_SETUP.md`

## Licencia

MIT

## Soporte

- Vercel: https://vercel.com/support
- Render: https://render.com/docs
- Clever Cloud: https://doc.clever-cloud.com

---

**Migración completada**: Supabase → MySQL + Backend Node.js
**Estado**: Listo para producción
**Última actualización**: 2025-11-30
