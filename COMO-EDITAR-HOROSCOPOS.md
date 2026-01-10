# 📅 Cómo Cambiar las Predicciones Diarias del Horóscopo

## 🎯 Ejemplo: Cambiar Horóscopo de Libra

### Paso 1: Abrir el Archivo de Configuración
Abre el archivo:
```
C:\Users\anton\.gemini\antigravity\scratch\TARO\config.json
```

Con cualquier editor de texto (Notepad, VS Code, etc.)

---

### Paso 2: Buscar el Horóscopo de Libra
Busca en el archivo (Ctrl+F) la palabra **"Libra"**

Encontrarás esta sección:
```json
"Libra": {
    "symbol": "♎",
    "dates": "23 Sep - 22 Oct",
    "prediction": "Encuentra el equilibrio que buscas...",
    "amor": "Armonía y romance florecen naturalmente",
    "trabajo": "Mediación exitosa en situaciones complejas",
    "finanzas": "Balance entre gastos e ingresos mejora",
    "color": "Rosa Pastel",
    "numero": "6"
}
```

---

### Paso 3: Editar la Predicción
Modifica los textos que quieras cambiar. Por ejemplo:

**ANTES:**
```json
"Libra": {
    "prediction": "Encuentra el equilibrio que buscas...",
    "amor": "Armonía y romance florecen naturalmente",
    "trabajo": "Mediación exitosa en situaciones complejas",
    "finanzas": "Balance entre gastos e ingresos mejora"
}
```

**DESPUÉS (Predicción para hoy 17 de Diciembre):**
```json
"Libra": {
    "prediction": "Hoy es un día perfecto para tomar decisiones importantes. La luna nueva te favorece en temas de amor y finanzas.",
    "amor": "Un encuentro inesperado puede cambiar tu perspectiva",
    "trabajo": "Oportunidades de crecimiento profesional aparecen",
    "finanzas": "Buenas noticias económicas están en camino"
}
```

**✅ Importante:**
- Mantén las comillas dobles `"`
- No olvides las comas `,` al final de cada línea (excepto la última)
- Guarda el archivo (Ctrl+S)

---

### Paso 4: Aplicar los Cambios

Abre PowerShell o Terminal y ejecuta:

```powershell
cd C:\Users\anton\.gemini\antigravity\scratch\TARO
vercel --prod
```

Espera 10-30 segundos y ¡listo! El horóscopo se actualizó automáticamente.

---

## 🔄 Actualizar TODOS los Signos

Puedes cambiar todos los signos de una vez editando cada sección en el mismo archivo:

```json
"horoscopos": {
    "Aries": {
        "prediction": "Predicción de hoy para Aries...",
        "amor": "Amor hoy...",
        "trabajo": "Trabajo hoy...",
        "finanzas": "Finanzas hoy..."
    },
    "Tauro": {
        "prediction": "Predicción de hoy para Tauro...",
        ...
    },
    ...
}
```

---

## ⚡ Tips para Predicciones Diarias

### 1. **Usa Plantillas Personalizadas**
Crea un documento con frases tipo para diferentes temas:
- Energía positiva
- Cuidado en relaciones
- Oportunidades laborales
- Advertencias financieras

### 2. **Cambia Solo lo Necesario**
No necesitas cambiar todo cada día. Puedes:
- Dejar `color` y `numero` fijos
- Cambiar solo `prediction`, `amor`, `trabajo`, `finanzas`

### 3. **Automatización (Opcional)**
Si quieres actualizar automáticamente cada día, puedo crear un script que:
- Genere predicciones diferentes cada día
- O que te permita programar predicciones con anticipación

---

## 🎨 Campos Editables de Cada Horóscopo

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `symbol` | Símbolo zodiacal (no cambiar) | "♎" |
| `dates` | Fechas del signo (no cambiar) | "23 Sep - 22 Oct" |
| `prediction` | Predicción general del día | "Hoy es un día especial..." |
| `amor` | Predicción amorosa | "Romance en el aire" |
| `trabajo` | Predicción laboral | "Ascenso a la vista" |
| `finanzas` | Predicción financiera | "Ganancias inesperadas" |
| `color` | Color de la suerte | "Rosa Pastel" |
| `numero` | Número de la suerte | "6" |

---

## ✅ Validar JSON Antes de Desplegar

Si tienes dudas si tu edición está correcta:

1. Copia todo el contenido de `config.json`
2. Pega en: **https://jsonlint.com/**
3. Click en "Validate JSON"
4. Si dice "Valid JSON" ✅ puedes desplegar
5. Si hay errores ❌ revisa las comillas y comas

---

## 🚀 Comando Rápido (Copiar y Pegar)

```powershell
cd C:\Users\anton\.gemini\antigravity\scratch\TARO && vercel --prod
```

Este comando cambia al directorio y despliega automáticamente.

---

¿Quieres que cree un **panel de administración web** para editar los horóscopos sin tocar archivos JSON?  
Te puedo hacer una interfaz visual donde:
- Click en el signo → editar predicción → guardar → desplegar automático

¡Dime si te interesa! 🔮✨
