# 📝 Guía de Edición del Sitio Web de Tarot

## 🎯 Cómo Editar el Contenido del Sitio

Todo el contenido editable del sitio está centralizado en el archivo **`config.json`**.  
Solo necesitas editar este archivo JSON para cambiar textos, precios, testimonios, blog posts, etc.

---

## 📂 Estructura del Archivo `config.json`

### 1. **Información General del Sitio**
```json
"siteName": "Luna Predictions",
"tagline": "Descubre tu Destino"
```

### 2. **Información de Contacto**
```json
"contact": {
  "email": "info@tarotmistico.com",
  "whatsapp": "1234567890",
  "whatsappLink": "https://wa.me/1234567890",
  "horario": "Lun - Vie: 9:00 AM - 8:00 PM"
}
```
- **whatsapp**: Solo el número sin  el +, sin espacios (ej: `5215512345678`)
- Este número se usa automáticamente en todos los botones de WhatsApp

### 3. **Sección Hero (Portada)**
```json
"hero": {
  "title": "Descubre tu Destino",
  "subtitle": "Encuentra claridad y orientación a través de las cartas del tarot",
  "primaryButton": "Explorar Servicios",
  "secondaryButton": "Agendar Lectura"
}
```

### 4. **Servicios** ⭐
```json
"servicios": [
  {
    "id": "3-cartas",
    "icon": "fas fa-star",
    "title": "Lectura de 3 Cartas",
    "description": "Descripción del servicio...",
    " duracion": "15 minutos",
    "precio": "$25 USD",
    "featured": false,
    "featuredText": "Más Popular",
    "features": [
      "Una pregunta específica",
      "Interpretación detallada"
    ]
  }
]
```
- **icon**: Código de icon de FontAwesome (ej: `fas fa-star`, `fas fa-heart`, `fas fa-gem`)
- **featured**: `true` para marcar como destacado, `false` para normal
- **features**: Lista de características/beneficios del servicio

### 5. **Testimonios**
```json
"testimonios": [
  {
    "nombre": "María González",
    "ubicacion": "Ciudad de México",
   "avatar": "M",
    "rating": 5,
    "texto": "La lectura fue increíblemente precisa..."
  }
]
```
- **avatar**: Una sola letra (generalmente la inicial del nombre)
- **rating**: Número de estrellas (1-5)

### 6. **Blog Posts** 📝
```json
"blog": [
  {
    "id": "arcanos-mayores",
    "categoria": "Guías",
    "title": "El Significado de los Arcanos Mayores",
    "excerpt": "Descubre la profunda sabiduría...",
    "fecha": "10 Dic 2025",
    "tiempoLectura": "5 min lectura",
    "videoUrl": ""
  }
]
```
- **videoUrl**: Para agregar un video de YouTube/Vimeo:
  - YouTube: `https://www.youtube.com/embed/VIDEO_ID`
  - Vimeo: `https://player.vimeo.com/video/VIDEO_ID`
  - Dejar vacío `""` si no hay video

### 7. **Redes Sociales**
```json
"redesSociales": {
  "instagram": "https://instagram.com/tuperfil",
  "facebook": "https://facebook.com/tupagina",
  "tiktok": "https://tiktok.com/@tuusuario",
  "youtube": "https://youtube.com/@tucanal"
}
```
- Cambia `#` por tus URLs reales de redes sociales

---

## 🚀 Cómo Aplicar los Cambios

### Opción A: Edición Local y Deployment

1. **Edita** el archivo `config.json` con tus cambios
2. **Guarda** el archivo
3. **Abre** `index.html` en tu navegador para probar los cambios localmente
4. **Deploy** a Vercel:
   ```powershell
   cd C:\Users\anton\.gemini\antigravity\scratch\TARO
   vercel --prod
   ```

### Opción B: Edición Directa en Vercel

1. Sube el archivo `config.json` actualizado a tu repositorio Git
2. Vercel detectará automáticamente el cambio y redesplegará el sitio

---

## 💡 Tips y Consejos

### ✅ Formato JSON Correcto
- Asegúrate de mantener las **comillas dobles** `"` en los textos
- No olvides las **comas** `,` entre elementos (excepto el último)
- Usa un validador JSON si tienes dudas: https://jsonlint.com/

### ✅ Agregar Nuevos Elementos

**Para agregar un nuevo servicio:**
```json
{
  "id": "mi-nuevo-servicio",
  "icon": "fas fa-crystal-ball",
  "title": "Lectura Personalizada",
  "description": "Análisis único...",
  "duracion": "60 minutos",
  "precio": "$80 USD",
  "featured": false,
  "features": [
    "Característica 1",
    "Característica 2",
    "Característica 3"
  ]
}
```

**Para agregar un nuevo testimonio:**
```json
{
  "nombre": "Juan Pérez",
  "ubicacion": "Madrid",
  "avatar": "J",
  "rating": 5,
  "texto": "Excelente experiencia..."
}
```

**Para agregar un nuevo Post de Blog con Video de YouTube:**
```json
{
  "id": "nuevo-post",
  "categoria": "Tutoriales",
  "title": "Cómo Interpretar las Cartas",
  "excerpt": "Aprende a leer el tarot...",
  "fecha": "20 Dic 2025",
  "tiempoLectura": "10 min lectura",
  "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
}
```

---

## 🎥 Agregar Videos de YouTube al Blog

1. Ve a tu video en YouTube
2. Haz click en **Compartir** → **Insertar**
3. Copia el URL que  aparece en `src="..."`
4. Pega ese URL en el campo `videoUrl` del blog post

**Ejemplo:**
```json
"videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
```

---

## ⚡ Comandos Útiles

```powershell
# Ver el sitio localmente (solo abre index.html en el navegador)
start index.html

# Desplegar a producción en Vercel
vercel --prod

# Ver lista de deployments
vercel ls

# Abrir dashboard de Vercel
vercel --open
```

---

## 🆘 Solución de Problemas

**El sitio no muestra cambios:**
- Recarga la página con Ctrl + F5 (limpiar caché)
- Espera 1-2 minutos después del deployment

**Error en el JSON:**
- Valida tu JSON en: https://jsonlint.com/
- Revisa que todas las comillas y comas estén correctas

**Los videos de YouTube no se ven:**
- Usa el formato `/embed/` en la URL
- No uses el URL normal de YouTube (youtu.be o watch?v=)

---

¡Listo! Ahora puedes editar todo el contenido del sitio simplemente modificando `config.json` 🔮✨
