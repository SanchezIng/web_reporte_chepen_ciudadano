# Inicio Rápido - Sistema de Seguridad Ciudadana

## 📋 Checklist de Lectura

Antes de empezar, lee en este orden:

1. **Este archivo** (estás aquí) - Visión general
2. `RESUMEN_MIGRACION.md` - Qué cambió
3. `VERCEL_RENDER_SETUP.md` - Paso a paso para despliegue
4. `DEPLOYMENT.md` - Referencia técnica

## 🚀 Despliegue en 5 Pasos

### Paso 1: Crear Cuenta en Clever Cloud (MySQL)
```
1. Ve a https://www.clever-cloud.com
2. Crea una cuenta
3. Click "Create an application" → MySQL
4. Copia: Host, User, Password
```

### Paso 2: Crear BD en Clever Cloud
```bash
# Opción A: Desde tu máquina local
mysql -h <HOST> -u <USER> -p < server/db/init.sql

# Opción B: Desde Clever Cloud Console
# Copia/pega el contenido de server/db/init.sql en SQL Editor
```

### Paso 3: Desplegar Backend en Render
```
1. Ve a https://dashboard.render.com
2. Click "New +" → Web Service
3. Conecta tu GitHub
4. Configura:
   - Name: security-system-api
   - Root Directory: server
   - Build: npm install && npm run build
   - Start: npm start
5. Agrega variables de entorno (DB_HOST, DB_USER, etc)
6. Click "Create Web Service"
```

Espera 5 minutos. Anota tu URL (ej: https://security-system-api.onrender.com)

### Paso 4: Desplegar Frontend en Vercel
```
1. Ve a https://vercel.com
2. Importa tu repositorio
3. Agrega variable:
   VITE_API_URL=https://tu-backend.onrender.com/api
4. Click "Deploy"
```

Espera 2 minutos. Anota tu URL (ej: https://security-system.vercel.app)

### Paso 5: Actualizar FRONTEND_URL en Render
```
1. Ve a Render Dashboard
2. Selecciona security-system-api
3. Environment → Busca FRONTEND_URL
4. Cambia a: https://tu-vercel-url.vercel.app
5. Click "Save"
```

## ✅ Verificar que Funciona

1. Abre tu URL de Vercel
2. Registra un usuario
3. Intenta iniciar sesión
4. Reporta una incidencia

Si todo funciona, ¡está deployado!

## 🛠️ Desarrollo Local

```bash
# Terminal 1: Frontend
npm install
npm run dev              # http://localhost:5173

# Terminal 2: Backend (necesitas MySQL local)
cd server
npm install
npm run dev              # http://localhost:3000

# Terminal 3: MySQL
mysql -u root -p
USE security_system;
SHOW TABLES;
```

## 📚 Archivos Importantes

| Archivo | Para |
|---------|------|
| `VERCEL_RENDER_SETUP.md` | 👈 **LEE ESTO PRIMERO** |
| `RESUMEN_MIGRACION.md` | Entender cambios |
| `server/db/init.sql` | SQL de BD |
| `server/.env` | Config backend |
| `.env` | Config frontend |
| `DEPLOYMENT.md` | Referencia técnica |

## 🔐 Seguridad

⚠️ **IMPORTANTE**:
- Nunca compartas tu `.env`
- Cambia `JWT_SECRET` en producción
- Usa contraseñas fuertes en MySQL
- CORS está restringido a tu frontend

## 📍 URLs de Producción (Después de desplegar)

```
Frontend:   https://tu-app.vercel.app
Backend:    https://tu-api.onrender.com
BD:         tu-host.db.clever.cloud
```

## ❓ Problemas Comunes

**"Cannot connect to database"**
- ¿Está correcto DB_HOST en Render?
- ¿Existe la BD security_system?

**"CORS error"**
- ¿FRONTEND_URL está correcto en Render?
- Espera a que reinicie (1-2 min)

**"Login no funciona"**
- Abre DevTools (F12)
- Ve a Network
- Intenta login
- ¿Qué error devuelve /api/auth/login?

## 🎯 Arquitectura Final

```
Usuario → Vercel (Frontend React)
            ↓
        HTTPS/REST
            ↓
        Render (Backend Express)
            ↓
        MySQL (Clever Cloud)
```

## 📞 Soporte

- Vercel: https://vercel.com/help
- Render: https://render.com/docs
- Clever Cloud: https://doc.clever-cloud.com

## ✨ Lo que funciona

✅ Registro de usuarios
✅ Login con JWT
✅ Reportar incidencias
✅ Filtrar incidencias
✅ Panel de autoridades
✅ Actualizar estado de incidencias
✅ Búsqueda y filtros

## 🎉 Siguientes Pasos

1. Leer `VERCEL_RENDER_SETUP.md` completamente
2. Crear cuentas en Clever Cloud, Render, Vercel
3. Seguir los 5 pasos de arriba
4. Verificar que funciona
5. ¡Celebrar! 🎊

---

**¡Listo para comenzar!**

Próximo: Lee `VERCEL_RENDER_SETUP.md`
