const fs = require('fs');
const path = 'c:\\Users\\anton\\.gemini\\antigravity\\scratch\\TARO\\admin-v4.js';

let content = fs.readFileSync(path, 'utf8');

// Target the saveHoroscopo function definition
// We used async function in previous attempt, so look for that or the original
const regex = /window\.saveHoroscopo\s*=\s*(async\s*)?function\s*\(\s*signo\s*\)\s*\{[\s\S]*?\}\s*;/;

const newFunction = `window.saveHoroscopo = async function (signo, triggerSave = true) {
    const btn = document.querySelector('#horoscopo-editor .btn-success');
    const originalText = btn ? btn.innerHTML : 'Guardar';

    if (triggerSave && btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;
    }

    try {
        siteConfig.horoscopos[signo].prediction = document.getElementById(\`pred-\${signo}\`).value;
        siteConfig.horoscopos[signo].amor = document.getElementById(\`amor-\${signo}\`).value;
        siteConfig.horoscopos[signo].trabajo = document.getElementById(\`trabajo-\${signo}\`).value;
        siteConfig.horoscopos[signo].finanzas = document.getElementById(\`finanzas-\${signo}\`).value;
        siteConfig.horoscopos[signo].color = document.getElementById(\`color-\${signo}\`).value;
        siteConfig.horoscopos[signo].numero = document.getElementById(\`numero-\${signo}\`).value;

        const img = document.getElementById(\`image-\${signo}\`);
        if (img) siteConfig.horoscopos[signo].image = img.value;

        // Auto-save key changes to Firebase immediately ONLY if triggered manually
        if (triggerSave) {
            await saveConfigToFirebase();
        }

    } catch (e) {
        console.error(e);
        showNotification('Error al guardar horóscopo: ' + e.message, 'error');
    } finally {
        if (triggerSave && btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};`;

if (regex.test(content)) {
    content = content.replace(regex, newFunction);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully replaced saveHoroscopo");
} else {
    console.log("Could not find saveHoroscopo function to replace");
    // Debug: print what we might be looking at
    const match = content.match(/window\.saveHoroscopo/);
    if (match) {
        console.log("Found window.saveHoroscopo start at index " + match.index);
        console.log(content.substring(match.index, match.index + 200));
    }
}
