# API Backend - Sistema de Seguridad Ciudadana

Backend Node.js + Express + MySQL para el sistema de gestión de incidencias ciudadanas.

## Requisitos

- Node.js 16+
- MySQL 8.0+
- npm o yarn

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

Variables requeridas:
- `DB_HOST`: Host de MySQL
- `DB_PORT`: Puerto de MySQL (default: 3306)
- `DB_USER`: Usuario de MySQL
- `DB_PASSWORD`: Contraseña de MySQL
- `DB_NAME`: Nombre de la base de datos
- `JWT_SECRET`: Clave secreta para JWT (cambiar en producción)
- `FRONTEND_URL`: URL del frontend (para CORS)

## Base de Datos

Inicializar la base de datos:

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD < db/init.sql
```

## Desarrollo

```bash
npm run dev
```

El servidor correrá en `http://localhost:3000`

## Producción

Build:
```bash
npm run build
```

Iniciar:
```bash
npm start
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Perfiles
- `GET /api/profiles/me` - Obtener perfil actual
- `GET /api/profiles/:id` - Obtener perfil por ID

### Incidencias
- `GET /api/incidents` - Listar incidencias
- `GET /api/incidents/:id` - Obtener incidencia
- `POST /api/incidents` - Crear incidencia
- `PATCH /api/incidents/:id` - Actualizar incidencia (solo autoridades)

### Categorías
- `GET /api/categories` - Listar categorías

## Estructura

```
src/
├── config/          # Configuración (BD, Auth)
├── middleware/      # Middlewares (Auth, Roles)
├── routes/          # Rutas de API
├── db/              # Scripts SQL
└── index.ts         # Punto de entrada
```

## Despliegue en Render

1. Conectar repositorio a Render
2. Crear Web Service
3. Configurar:
   - Root Directory: `server`
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Environment variables desde `.env`

## Health Check

```bash
curl http://localhost:3000/health
```

Respuesta: `{"status":"ok"}`
