const fs = require('fs');
const path = 'c:\\Users\\anton\\.gemini\\antigravity\\scratch\\TARO\\admin-v4.js';

let content = fs.readFileSync(path, 'utf8');

// 1. UPDATE editServicio
const editRegex = /window\.editServicio\s*=\s*function\s*\(\s*index\s*\)\s*\{[\s\S]*?\}\s*;/;
const newEditHeader = `window.editServicio = function (index) {
    const servicio = siteConfig.servicios[index];
    const container = document.getElementById('servicios-list');
    const cards = container.getElementsByClassName('servicio-admin-card');

    if (cards[index]) {
        cards[index].classList.add('editing');
        cards[index].innerHTML = \`
            <div class="edit-form" style="padding: 20px; background: var(--parchment);">
                <input id="edit-serv-title-\${index}" class="form-control" value="\${servicio.title || ''}" placeholder="Título">
                <textarea id="edit-serv-desc-\${index}" class="form-control" placeholder="Descripción">\${servicio.description || ''}</textarea>
                <input id="edit-serv-precio-\${index}" class="form-control" value="\${servicio.precio || ''}" placeholder="Precio">
                <!-- NEW FIELDS -->
                <input id="edit-serv-duracion-\${index}" class="form-control" value="\${servicio.duracion || ''}" placeholder="Duración (ej. 30 minutos)">
                <input id="edit-serv-icon-\${index}" class="form-control" value="\${servicio.icon || 'fas fa-star'}" placeholder="Icono (ej. fas fa-star)">
                
                <label style="margin-top:10px; display:block; color:var(--burgundy); font-family:var(--font-heading);">Incluye (1 por línea):</label>
                <textarea id="edit-serv-features-\${index}" class="form-control" rows="5" placeholder="Una pregunta específica&#10;Interpretación detallada...API-Driven">\${(servicio.features || []).join('\\n')}</textarea>

                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button class="btn-success" onclick="saveServicio(\${index})">Guardar</button>
                    <button class="btn-secondary" onclick="renderServiciosList()">Cancelar</button>
                </div>
            </div>
        \`;
    }
};`;

if (editRegex.test(content)) {
    content = content.replace(editRegex, newEditHeader);
    console.log("Updated editServicio");
} else {
    console.error("Could not find editServicio");
}

// 2. UPDATE saveServicio
const saveRegex = /window\.saveServicio\s*=\s*function\s*\(\s*index\s*\)\s*\{[\s\S]*?\}\s*;/;
const newSave = `window.saveServicio = function (index) {
    const title = document.getElementById(\`edit-serv-title-\${index}\`).value;
    const description = document.getElementById(\`edit-serv-desc-\${index}\`).value;
    const precio = document.getElementById(\`edit-serv-precio-\${index}\`).value;
    const duracion = document.getElementById(\`edit-serv-duracion-\${index}\`).value;
    const icon = document.getElementById(\`edit-serv-icon-\${index}\`).value;
    
    // Parse features from textarea
    const featuresRaw = document.getElementById(\`edit-serv-features-\${index}\`).value;
    const features = featuresRaw.split('\\n').map(l => l.trim()).filter(l => l !== '');

    siteConfig.servicios[index] = { 
        ...siteConfig.servicios[index], 
        title, 
        description, 
        precio,
        duracion,
        icon,
        features 
    };
    renderServiciosList();
};`;

if (saveRegex.test(content)) {
    content = content.replace(saveRegex, newSave);
    console.log("Updated saveServicio");
} else {
    console.error("Could not find saveServicio");
}

fs.writeFileSync(path, content, 'utf8');
