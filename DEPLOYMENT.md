# Guía de Despliegue - Sistema de Seguridad Ciudadana

Arquitectura: React Frontend (Vercel) + Node.js Backend (Render) + MySQL (Clever Cloud)

## 1. Instalación Local

### Frontend
```bash
cd project
npm install
npm run dev  # http://localhost:5173
```

### Backend
```bash
cd project/server
npm install
npm run dev  # http://localhost:3000
```

### Base de Datos Local
```bash
# Crear base de datos MySQL localmente
mysql -u root < server/db/init.sql

# Configurar .env en server/
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=security_system
JWT_SECRET=tu-super-secreto
```

## 2. Despliegue en Vercel (Frontend)

### Paso 1: Conectar repositorio
1. Ve a [Vercel](https://vercel.com)
2. Haz click en "New Project"
3. Importa tu repositorio de Git

### Paso 2: Configurar variables de entorno
En Vercel Dashboard → Project Settings → Environment Variables:
```
VITE_API_URL=https://tu-backend.onrender.com/api
```

### Paso 3: Desplegar
```bash
# Automático al hacer push a main
git push origin main
```

## 3. Despliegue en Render (Backend)

### Paso 1: Preparar backend
```bash
npm run build  # Crear dist/
```

### Paso 2: Crear servicio en Render
1. Ve a [Render](https://render.com)
2. Haz click en "New +"
3. Selecciona "Web Service"
4. Conecta tu repositorio

### Paso 3: Configurar servicio
- **Name**: security-system-api
- **Root Directory**: server
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  ```
  DB_HOST=tu-base-datos.clever.cloud
  DB_PORT=3306
  DB_USER=tu-usuario
  DB_PASSWORD=tu-password
  DB_NAME=security_system
  JWT_SECRET=tu-super-secreto-seguro
  FRONTEND_URL=https://tu-frontend.vercel.app
  NODE_ENV=production
  PORT=3000
  ```

### Paso 4: Desplegar
- Click en "Create Web Service"
- Render desplegará automáticamente

## 4. Despliegue en Clever Cloud (MySQL)

### Paso 1: Crear base de datos
1. Ve a [Clever Cloud](https://www.clever-cloud.com)
2. Crea una cuenta y haz login
3. Click en "Create an application"
4. Selecciona "MySQL"

### Paso 2: Configurar MySQL
- **Plan**: Selecciona plan según tus necesidades
- **Region**: Elige tu región
- **Version**: MySQL 8.0+

### Paso 3: Obtener credenciales
Una vez creada, Clever Cloud proporciona:
- Host: `xxx.db.clever.cloud`
- User: `tu-usuario`
- Password: `tu-password`
- Port: `3306`

### Paso 4: Importar esquema
```bash
# Desde tu máquina local:
mysql -h tu-host.db.clever.cloud -u tu-usuario -p < server/db/init.sql

# O usa Clever Cloud Console para ejecutar el SQL
```

### Paso 5: Actualizar variables en Render
En Render, actualiza las variables de entorno con las credenciales de Clever Cloud.

## 5. Flujo de Despliegue

```
Local Development
    ↓
    git push origin main
    ↓
    ├─→ Vercel (Frontend)
    ├─→ Render (Backend)
    └─→ Clever Cloud (Database - manual si es necesario)
```

## 6. Checklist de Despliegue

- [ ] Frontend `.env` con `VITE_API_URL`
- [ ] Backend `.env` con credenciales MySQL
- [ ] JWT_SECRET configurado y seguro
- [ ] CORS habilitado (FRONTEND_URL en backend)
- [ ] Base de datos inicializada en Clever Cloud
- [ ] Tests pasando en local
- [ ] Build producción exitoso

## 7. Monitoreo

### Vercel
- Dashboard: https://vercel.com/projects
- Logs: Vercel → Deployments → Logs

### Render
- Dashboard: https://dashboard.render.com
- Logs: Services → Logs

### Clever Cloud
- Console: https://console.clever-cloud.com
- Monitoreo: Metrics

## 8. Variables de Entorno Requeridas

### Frontend (.env)
```
VITE_API_URL=URL-DEL-BACKEND
```

### Backend (.env)
```
PORT=3000
DB_HOST=HOST-MYSQL
DB_PORT=3306
DB_USER=USUARIO-MYSQL
DB_PASSWORD=PASSWORD-MYSQL
DB_NAME=security_system
JWT_SECRET=TU-SECRETO-SEGURO
JWT_EXPIRATION=7d
FRONTEND_URL=URL-DEL-FRONTEND
NODE_ENV=production
```

## 9. Troubleshooting

### Error: "Cannot connect to database"
- Verificar credenciales en `.env`
- Verificar IP whitelist en Clever Cloud
- Verificar puerto MySQL (default: 3306)

### Error: "CORS error"
- Asegúrate que `FRONTEND_URL` está correcto en backend
- Recarga el servidor backend

### Error: "Token inválido"
- Asegúrate que `JWT_SECRET` es el mismo en producción
- Regenera token si cambia el secret

### Verificar conexión:
```bash
# Terminal
curl https://tu-backend.onrender.com/health
```

Debería responder: `{"status":"ok"}`
