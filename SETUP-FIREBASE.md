# 🔥 Configuración de Firebase para Panel de Administración

## Paso 1: Crear Usuario de Administrador en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **tarot-a6939**
3. En el menú lateral, click en **Authentication**
4. Click en **Get Started** (si es tu primera vez)
5. Click en **Sign-in method**
6. Habilita **Email/Password**
7. Click en la pestaña **Users**
8. Click en **Add User**
9. Ingresa:
   - **Email**: tu-email@gmail.com (el que quieras usar)
   - **Password**: Una contraseña segura
10. Click en **Add User**

---

## Paso 2: Configurar Firestore Database

1. En Firebase Console, menú lateral → **Firestore Database**
2. Click en **Create database**
3. Selecciona **Start in production mode** (configuraremos reglas después)
4. Selecciona ubicación: **us-central** (o la más cercana)
5. Click en **Enable**

---

## Paso 3: Configurar Reglas de Seguridad

1. En Firestore Database, ve a la pestaña **Rules**
2. Reemplaza el contenido con estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura pública de la configuración
    // Solo usuarios autenticados pueden escribir
    match /config/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click en **Publish**

---

## Paso 4: Cargar Configuración Inicial a Firebase

### Opción A: Desde el Panel de Administración (Recomendado)

1. Abre `http://localhost:8080/admin.html` (o tu URL de Vercel)
2. Inicia sesión con el email y contraseña que creaste
3. Edita cualquier campo
4. Click en **Guardar Cambios**
5. ¡Listo! La configuración se guardó en Firebase

### Opción B: Manualmente desde Firebase Console

1. En Firestore Database, click en **Start collection**
2. Collection ID: `config`
3. Document ID: `site`
4. Copia y pega el contenido de `config.json` en los campos
5. Click en **Save**

---

## Paso 5: Verificar Integración

1. Abre el sitio principal: `https://tu-sitio.vercel.app`
2. Abre la consola del navegador (F12)
3. Deberías ver: `✅ Configuración cargada desde Firebase`
4. Si vez: `✅ Configuración cargada desde config.json` → Firebase no está conectado (pero funciona con fallback)

---

## Paso 6: Acceder al Panel de Administración

1. Abre: `https://tu-sitio.vercel.app/admin.html`
2. Inicia sesión con tus credenciales
3. Edita contenido (servicios, blog, horóscopos)
4. Click en **Guardar Cambios**
5. Los cambios se reflejan automáticamente en el sitio público

---

## 🔗 URLs Importantes

- **Sitio Público**: https://tu-sitio.vercel.app
- **Panel Admin**: https://tu-sitio.vercel.app/admin.html
- **Firebase Console**: https://console.firebase.google.com/project/tarot-a6939

---

## 🔐 Seguridad

### ✅ Qué está Protegido:
- Solo usuarios autenticados pueden editar contenido
- El email/contraseña se manejan por Firebase Auth
- Las reglas de Firestore impiden escritura no autorizada

### ⚠️ Recomendaciones:
1. **Cambia tu contraseña** después del primer login
2. **NO compartas** tu email/contraseña de admin
3. **Habilita 2FA** en Firebase Console (Settings → Authentication)
4. **Revisa logs** regularmente en Firebase Console

---

## 🔄 Flujo de Trabajo Diario

### Para Actualizar Horóscopos:
1. Abre `https://tu-sitio.vercel.app/admin.html`
2. Inicia sesión
3. Click en tab **Horóscopos**
4. Selecciona el signo (ej: Libra)
5. Edita la predicción del día:
   ```
   Predicción: "Hoy la luna favorece tus decisiones..."
   Amor: "Romance inesperado en el horizonte"
   Trabajo: "Nueva oportunidad se presenta"
   Finanzas: "Gastos controlados traen estabilidad"
   ```
6. Click en **Guardar Horóscopo de Libra**
7. Click en **Guardar Cambios** (botón superior)
8. ¡Listo! El horóscopo se actualiza en el sitio público

---

## 🚀 Compartir Link Público

1. Desde el panel de admin, click en **Compartir Link Público**
2. El link se copia al portapapeles: `https://tu-sitio.vercel.app`
3. Este link NO incluye `/admin.html`
4. Los usuarios solo ven el sitio, sin opciones de edición

---

## ❓ Solución de Problemas

### "No puedo iniciar sesión"
- Verifica email y contraseña en Firebase Console → Authentication → Users
- Resetea contraseña desde Firebase Console

### "Error loading from Firebase"
- Verifica que las credenciales en `firebase-config.js` sean correctas
- Verifica que Firestore esté habilitado
- Revisa las reglas de seguridad

### "Los cambios no se reflejan"
- Limpia caché del navegador (Ctrl + F5)
- Verifica que clickeaste "Guardar Cambios"
- Revisa la consola del navegador para errores

---

¡Tu panel de administración está listo! 🎉
