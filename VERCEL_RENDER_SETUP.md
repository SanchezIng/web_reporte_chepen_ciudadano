# Setup Completo: Vercel, Render y Clever Cloud

## Paso 1: Preparar el Repositorio

```bash
# Asegúrate de que todo está en Git
git add .
git commit -m "Migración a MySQL con backend Node.js"
git push origin main
```

Asegúrate que el repositorio contiene:
- `/src` - Frontend React
- `/server` - Backend Node.js
- `/server/db/init.sql` - Schema MySQL

## Paso 2: Clever Cloud - Base de Datos MySQL

### 2.1 Crear la Base de Datos

1. Ve a https://www.clever-cloud.com
2. Crea una cuenta (o inicia sesión)
3. Haz click en "Create an application"
4. Selecciona "MySQL"
5. Elige tu región (ej: eu-north-1)
6. Selecciona un plan (recomendado: DEV o STANDARD)
7. Haz click en "Create"

### 2.2 Obtener Credenciales

Una vez creada, ve a tu aplicación MySQL y busca:
- **Host**: algo como `xxx-yyy.db.clever.cloud`
- **User**: algo como `uxyz123456`
- **Password**: tu contraseña generada
- **Port**: 3306

Copia estas en un lugar seguro.

### 2.3 Crear la Base de Datos

Hay dos opciones:

**Opción A: Desde tu máquina local (necesitas MySQL client)**
```bash
mysql -h tu-host.db.clever.cloud -u tu-usuario -p < server/db/init.sql
# Te pedirá la contraseña
```

**Opción B: Desde Clever Cloud Console**
1. Ve a tu aplicación MySQL en Clever Cloud
2. Busca "Adminer" o "phpMyAdmin"
3. Login con tus credenciales
4. Copia todo el contenido de `server/db/init.sql`
5. Ejecuta como query en la interfaz

### 2.4 Verificar

```bash
# Verificar que se creó la BD
mysql -h tu-host.db.clever.cloud -u tu-usuario -p -e "USE security_system; SHOW TABLES;"
```

Debería mostrar las 5 tablas (profiles, incidents, etc).

## Paso 3: Render - Backend API

### 3.1 Crear el Servicio

1. Ve a https://dashboard.render.com
2. Haz click en "New +"
3. Selecciona "Web Service"
4. Conecta tu repositorio de GitHub

### 3.2 Configurar el Servicio

Rellenar con:
- **Name**: `security-system-api`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3.3 Variables de Entorno

En "Environment Variables" agrega:

```
DB_HOST=tu-host.db.clever.cloud
DB_PORT=3306
DB_USER=tu-usuario-mysql
DB_PASSWORD=tu-password-mysql
DB_NAME=security_system
JWT_SECRET=mi-super-secreto-muy-seguro-cambiar-en-produccion
JWT_EXPIRATION=7d
FRONTEND_URL=https://tu-app.vercel.app
NODE_ENV=production
PORT=3000
```

⚠️ **IMPORTANTE**: Nunca compartas estos secretos. Úsalos solo en Render.

### 3.4 Crear

1. Haz click en "Create Web Service"
2. Render desplegará automáticamente (espera ~5 minutos)
3. Una vez listo, ve al URL de tu servicio

### 3.5 Verificar

Visita: `https://tu-api.onrender.com/health`

Debería responder: `{"status":"ok"}`

Si no funciona, ve a "Logs" y busca el error.

## Paso 4: Vercel - Frontend React

### 4.1 Importar el Proyecto

1. Ve a https://vercel.com
2. Haz click en "Add New..."
3. Selecciona "Project"
4. Elige tu repositorio de GitHub
5. Haz click en "Import"

### 4.2 Configurar el Proyecto

- **Project Name**: `security-system-web`
- **Framework**: Vite
- **Root Directory**: `.` (raíz del proyecto)

### 4.3 Variables de Entorno

En "Environment Variables" agrega:

```
VITE_API_URL=https://tu-api.onrender.com/api
```

(Reemplaza con tu URL de Render del paso 3)

### 4.4 Desplegar

Haz click en "Deploy"

Espera ~2 minutos. Una vez listo:
- Te dará un URL como `https://security-system-web.vercel.app`
- Vercel desplegará automáticamente cada push a `main`

### 4.5 Verificar

Visita: `https://tu-app.vercel.app`

Deberías ver la pantalla de login.

## Paso 5: Actualizar FRONTEND_URL en Render

Ahora que tienes el URL de Vercel, actualiza Render:

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio `security-system-api`
3. Environment
4. Busca `FRONTEND_URL`
5. Cambia a: `https://tu-app.vercel.app` (con tu URL real)
6. Haz click en "Save"

El servicio se reiniciará automáticamente.

## Paso 6: Flujo de Desarrollo

Desde ahora, cada vez que hagas push a `main`:

```bash
git add .
git commit -m "Tu mensaje"
git push origin main
```

Automáticamente:
- **Render** deployará tu backend
- **Vercel** deployará tu frontend

## Paso 7: Verificación Final

1. Abre tu URL de Vercel: `https://tu-app.vercel.app`
2. Intenta registrarte con:
   - Email: `test@example.com`
   - Contraseña: `Test123456`
   - Nombre: `Test User`
3. Intenta iniciar sesión
4. Si funciona, ¡todo está listo!

## Troubleshooting

### "Cannot connect to database"
- Verificar credenciales en Render Environment
- En Clever Cloud, verificar que la BD existe
- En Clever Cloud, verificar IP whitelist (debería ser abierta)

### "CORS error"
- Verificar que `FRONTEND_URL` es correcto en Render
- Esperar a que Render reinicie (1-2 min)
- Limpiar cache del navegador (Ctrl+Shift+Del)

### Login no funciona
- Abrir DevTools (F12)
- Ir a Network
- Intentar login
- Ver si `/api/auth/login` devuelve error
- Si está en rojo, revisar logs de Render

### Página en blanco en Vercel
- Abrir DevTools (F12)
- Ver Console para errores
- Ir a Network
- Ver si falla `VITE_API_URL`

## URLs Finales

Después de completar todo, tendrás:

- **Frontend**: `https://tu-app.vercel.app`
- **API**: `https://tu-api.onrender.com`
- **BD**: `tu-host.db.clever.cloud`

Estas URLs puedes compartir con otros (las de API y BD no, son privadas).

## Notas de Seguridad

1. **JWT_SECRET**: Cambiar a algo único y seguro en producción
2. **Credenciales MySQL**: Nunca compartir
3. **FRONTEND_URL**: Solo URL de Vercel
4. **No commitear `.env`**: Está en `.gitignore`

## Monitoreo

- **Vercel Logs**: https://vercel.com/dashboard → Deployments → Logs
- **Render Logs**: https://dashboard.render.com → Seleccionar servicio → Logs
- **Clever Cloud**: https://console.clever-cloud.com → Métricas

## Soporte

- **Vercel**: https://vercel.com/support
- **Render**: https://render.com/docs
- **Clever Cloud**: https://doc.clever-cloud.com

¡Listo! Tu aplicación ahora está desplegada en Vercel, Render y Clever Cloud.
