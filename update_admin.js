const fs = require('fs');
const path = 'c:\\Users\\anton\\.gemini\\antigravity\\scratch\\TARO\\admin.html';

let content = fs.readFileSync(path, 'utf8');

const startHelper = '<div id="tab-general" class="tab-content active">';
const endHelper = '<!-- Servicios Tab -->';

const startIndex = content.indexOf(startHelper);
const endIndex = content.indexOf(endHelper);

if (startIndex !== -1 && endIndex !== -1) {
    console.log(`Found block from index ${startIndex} to ${endIndex}`);

    const preBlock = content.substring(0, startIndex);
    const postBlock = content.substring(endIndex);

    const newContentInner = `
                <div id="tab-general" class="tab-content active">
                    <h3><i class="fas fa-cog"></i> Configuración General</h3>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start;">
                        <!-- Left Column: All Text Inputs -->
                        <div class="left-col">
                            <div class="form-section">
                                <h4>Información del Sitio</h4>
                                <div class="form-group">
                                    <label>Nombre del Sitio</label>
                                    <input type="text" id="siteName" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Tagline</label>
                                    <input type="text" id="tagline" class="form-control">
                                </div>
                            </div>

                            <div class="form-section">
                                <h4>Textos Portada (Hero)</h4>
                                <div class="form-group">
                                    <label>Título Principal</label>
                                    <input type="text" id="hero-title" class="form-control" placeholder="Descubre el mensaje de tu alma">
                                </div>
                                <div class="form-group">
                                    <label>Subtítulo</label>
                                    <textarea id="hero-subtitle" class="form-control" rows="3" placeholder="Encuentra claridad y orientación a través de las cartas del tarot..."></textarea>
                                </div>
                            </div>

                            <div class="form-section">
                                <h4>Contacto</h4>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" id="contact-email" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>WhatsApp (solo número)</label>
                                    <input type="text" id="contact-whatsapp" class="form-control" placeholder="5215512345678">
                                </div>
                                <div class="form-group">
                                    <label>Horario de Atención</label>
                                    <input type="text" id="contact-horario" class="form-control">
                                </div>
                            </div>
                        </div>

                        <!-- Right Column: Hero Image ONLY -->
                        <div class="right-col">
                            <div class="form-section" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
                                <h4>Imagen Portada</h4>
                                <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                    <label style="display: block; margin-bottom: 20px; color: var(--gold); font-size: 1.2em;">"Conoce tu Horóscopo"</label>
                                    
                                    <img src="images/bruja-mistica.png" id="hero-horoscope-preview" style="display: block; margin: 0 auto 25px auto; max-width: 100%; height: auto; max-height: 400px; border-radius: 12px; border: 2px solid var(--gold); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                    
                                    <div style="display: flex; justify-content: center; gap: 10px; width: 100%; margin: 0 auto;">
                                        <!-- Hidden File Input -->
                                        <input type="file" id="file-hero-horoscope" style="display: none;" onchange="uploadImage(this, 'hero-horoscope-image', 'upload-status-hero', 'hero-horoscope-preview')">

                                        <input type="text" id="hero-horoscope-image" class="form-control" value="images/bruja-mistica.png" readonly style="text-align: center; flex: 1; min-width: 0;">
                                        
                                        <button class="btn-secondary" onclick="document.getElementById('file-hero-horoscope').click()" style="white-space: nowrap; padding: 0 25px; flex-shrink: 0;">
                                            <i class="fas fa-camera"></i>
                                        </button>
                                    </div>
                                    <small id="upload-status-hero" style="display: block; margin-top: 10px;"></small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                `;

    const finalContent = preBlock + newContentInner + postBlock;
    fs.writeFileSync(path, finalContent, 'utf8');
    console.log("File updated successfully with anchor method.");

} else {
    console.log("Anchors NOT found.");
    console.log("Start: " + startIndex);
    console.log("End: " + endIndex);
}
