// ============================================
// ADMIN PANEL JAVASCRIPT
// ============================================

let currentUser = null;
let siteConfig = null;
let currentEditingSign = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (initFirebase()) {
        checkAuthState();
        initEventListeners();
    } else {
        showNotification('Error: No se pudo inicializar Firebase', 'error');
    }
});

function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showAdminPanel();
            loadConfigFromFirebase();
        } else {
            showLoginScreen();
        }
    });
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('admin-screen').classList.remove('active');
}

function showAdminPanel() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('admin-screen').classList.add('active');
}

// ============================================
// AUTHENTICATION
// ============================================

function initEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-save').addEventListener('click', saveConfigToFirebase);
    document.getElementById('btn-share').addEventListener('click', handleShare);
    document.getElementById('btn-preview')?.addEventListener('click', handlePreview);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('btn-add-servicio')?.addEventListener('click', () => addItem('servicio'));
    document.getElementById('btn-add-testimonio')?.addEventListener('click', () => addItem('testimonio'));
    document.getElementById('btn-add-post')?.addEventListener('click', () => addItem('post'));
    document.getElementById('btn-reset-horoscopos')?.addEventListener('click', resetAllHoroscopos);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        await auth.signInWithEmailAndPassword(email, password);
        errorDiv.classList.remove('show');
    } catch (error) {
        errorDiv.textContent = 'Email o contraseña incorrectos';
        errorDiv.classList.add('show');
    }
}

async function handleLogout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
        await auth.signOut();
        showLoginScreen();
    }
}

// ============================================
// FIREBASE DATA MANAGEMENT
// ============================================

async function loadConfigFromFirebase() {
    try {
        const doc = await db.collection('config').doc('site').get();

        if (doc.exists) {
            siteConfig = doc.data();
            showNotification('Configuración cargada', 'success');
        } else {
            throw new Error('Documento no existe en Firestore');
        }

        populateForm();
    } catch (error) {
        console.error('Error loading config:', error);
        try {
            const response = await fetch('config.json');
            siteConfig = await response.json();
            populateForm();
            showNotification('Datos cargados localmente', 'warning');
        } catch (localError) {
            showNotification('Error crítico al cargar configuración', 'error');
        }
    }
}

async function saveConfigToFirebase() {
    const btnSave = document.getElementById('btn-save');
    const originalText = btnSave.innerHTML;

    try {
        if (!currentUser) {
            showNotification('Error: No autenticado.', 'error');
            return;
        }

        // Visual Feedback
        btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btnSave.disabled = true;

        if (currentEditingSign) {
            await saveHoroscopo(currentEditingSign, false);
        }

        const editingCards = document.querySelectorAll('.item-card.editing');
        editingCards.forEach(card => {
            const input = card.querySelector('input[id^="edit-serv-title-"]');
            if (input) {
                const index = input.id.split('-').pop();
                saveServicio(index);
            }
        });

        collectFormData();

        showNotification('Guardando cambios...', 'info');

        // Timeout wrapper logic
        const savePromise = db.collection('config').doc('site').set(siteConfig);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tiempo de espera agotado. Verifica tu conexión.')), 10000)
        );

        await Promise.race([savePromise, timeoutPromise]);

        showNotification('¡Cambios guardados con éxito!', 'success');
    } catch (error) {
        console.error('Error saving:', error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        // Always reset button state
        if (btnSave) {
            btnSave.innerHTML = originalText;
            btnSave.disabled = false;
        }
    }
}

// ============================================
// FORM POPULATION
// ============================================

function populateForm() {
    if (!siteConfig) return;

    if (!siteConfig.horoscopos) {
        siteConfig.horoscopos = {
            "Aries": { "symbol": "♈", "dates": "21 Mar - 19 Abr" },
            "Tauro": { "symbol": "♉", "dates": "20 Abr - 20 May" },
            "Géminis": { "symbol": "♊", "dates": "21 May - 20 Jun" },
            "Cáncer": { "symbol": "♋", "dates": "21 Jun - 22 Jul" },
            "Leo": { "symbol": "♌", "dates": "23 Jul - 22 Ago" },
            "Virgo": { "symbol": "♍", "dates": "23 Ago - 22 Sep" },
            "Libra": { "symbol": "♎", "dates": "23 Sep - 22 Oct" },
            "Escorpio": { "symbol": "♏", "dates": "23 Oct - 21 Nov" },
            "Sagitario": { "symbol": "♐", "dates": "22 Nov - 21 Dic" },
            "Capricornio": { "symbol": "♑", "dates": "22 Dic - 19 Ene" },
            "Acuario": { "symbol": "♒", "dates": "20 Ene - 18 Feb" },
            "Piscis": { "symbol": "♓", "dates": "19 Feb - 20 Mar" }
        };
    }

    // Inicializar sección Sobre Mí si no existe
    if (!siteConfig.sobreMi) {
        siteConfig.sobreMi = {
            image: 'images/bruja-mistica.png',
            intro: 'Bienvenido, soy tu guía en el camino de la iluminación espiritual.',
            bio1: 'Con más de 15 años de experiencia en la lectura del tarot, he ayudado a miles de personas a encontrar claridad, paz interior y dirección en sus vidas.',
            bio2: 'Cada lectura es única y personalizada, diseñada para resonar con tu energía y responder a tus preguntas más profundas.',
            experiencia: '15+',
            clientes: '3,500+',
            rating: '4.9/5'
        };
    }

    document.getElementById('siteName').value = siteConfig.siteName || '';
    document.getElementById('tagline').value = siteConfig.tagline || '';

    if (siteConfig.contact) {
        document.getElementById('contact-email').value = siteConfig.contact.email || '';
        document.getElementById('contact-whatsapp').value = siteConfig.contact.whatsapp || '';
        document.getElementById('contact-horario').value = siteConfig.contact.horario || '';
    }

    if (siteConfig.hero) {
        document.getElementById('hero-title').value = siteConfig.hero.title || '';
        document.getElementById('hero-subtitle').value = siteConfig.hero.subtitle || '';

        // Cargar imagen de carta horóscopo
        const heroImg = siteConfig.hero.horoscopeImage || 'images/bruja-mistica.png';
        const heroImgInput = document.getElementById('hero-horoscope-image');
        const heroImgPreview = document.getElementById('hero-horoscope-preview');

        if (heroImgInput) heroImgInput.value = heroImg;
        if (heroImgPreview) heroImgPreview.src = heroImg;
    }

    if (siteConfig.redesSociales) {
        document.getElementById('social-instagram').value = siteConfig.redesSociales.instagram || '';
        document.getElementById('social-facebook').value = siteConfig.redesSociales.facebook || '';
        document.getElementById('social-tiktok').value = siteConfig.redesSociales.tiktok || '';
        document.getElementById('social-youtube').value = siteConfig.redesSociales.youtube || '';
    }

    if (!siteConfig.qrSticker) {
        siteConfig.qrSticker = {
            title: "Tarot Místico",
            text1: "Escanea para",
            text2: "Descubrir tu Destino",
            image: "https://dummyimage.com/200x200/dbdbdb/7a7a7a?text=QR+Code"
        };
    }
    const qrTitle = document.getElementById('qr-title');
    if (qrTitle) {
        qrTitle.value = siteConfig.qrSticker.title || 'Tarot Místico';
        document.getElementById('qr-text-1').value = siteConfig.qrSticker.text1 || 'Escanea para';
        document.getElementById('qr-text-2').value = siteConfig.qrSticker.text2 || 'Descubrir tu Destino';
        document.getElementById('qr-image-url').value = siteConfig.qrSticker.image || 'https://dummyimage.com/200x200/dbdbdb/7a7a7a?text=QR+Code';
        if (window.updateQRPreview) setTimeout(updateQRPreview, 500);
    }

    renderServiciosList();
    renderTestimoniosList();
    renderBlogList();
    renderHoroscoposSelector();
}

function collectFormData() {
    if (!siteConfig.contact) siteConfig.contact = {};
    if (!siteConfig.hero) siteConfig.hero = {};
    if (!siteConfig.redesSociales) siteConfig.redesSociales = {};
    if (!siteConfig.qrSticker) siteConfig.qrSticker = {};

    siteConfig.siteName = document.getElementById('siteName').value;
    siteConfig.tagline = document.getElementById('tagline').value;

    siteConfig.contact.email = document.getElementById('contact-email').value;
    siteConfig.contact.whatsapp = document.getElementById('contact-whatsapp').value;
    siteConfig.contact.horario = document.getElementById('contact-horario').value;

    siteConfig.hero.title = document.getElementById('hero-title').value;
    siteConfig.hero.subtitle = document.getElementById('hero-subtitle').value;
    siteConfig.hero.horoscopeImage = document.getElementById('hero-horoscope-image').value;

    siteConfig.redesSociales.instagram = document.getElementById('social-instagram').value;
    siteConfig.redesSociales.facebook = document.getElementById('social-facebook').value;
    siteConfig.redesSociales.tiktok = document.getElementById('social-tiktok').value;
    siteConfig.redesSociales.youtube = document.getElementById('social-youtube').value;

    const qrTitle = document.getElementById('qr-title');
    if (qrTitle) {
        siteConfig.qrSticker.title = qrTitle.value;
        siteConfig.qrSticker.text1 = document.getElementById('qr-text-1').value;
        siteConfig.qrSticker.text2 = document.getElementById('qr-text-2').value;
        siteConfig.qrSticker.image = document.getElementById('qr-image-url').value || 'https://dummyimage.com/200x200/dbdbdb/7a7a7a?text=QR+Code';
    }
}

// ============================================
// SERVICIOS
// ============================================

function renderServiciosList() {
    const container = document.getElementById('servicios-list');
    if (!container) return;
    container.innerHTML = '';
    container.className = 'servicios-grid';

    if (!siteConfig.servicios || siteConfig.servicios.length === 0) {
        container.innerHTML = '<p class="text-center p-4">No hay servicios.</p>';
        return;
    }

    siteConfig.servicios.forEach((servicio, index) => {
        const card = document.createElement('div');
        card.className = `servicio-admin-card ${servicio.featured ? 'featured' : ''}`;
        card.innerHTML = `
            ${servicio.featured ? `<div class="servicio-featured-badge">${servicio.featuredText || 'Destacado'}</div>` : ''}
            <div class="servicio-card-header">
                <div class="servicio-card-icon"><i class="${servicio.icon || 'fas fa-star'}"></i></div>
                <h3 class="servicio-card-title">${servicio.title}</h3>
                <div class="servicio-card-precio">${servicio.precio}</div>
            </div>
            <div class="servicio-card-actions">
                <button class="servicio-btn-edit" onclick="editServicio(${index})"><i class="fas fa-edit"></i> Editar</button>
                <button class="servicio-btn-delete" onclick="deleteServicio(${index})"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.deleteServicio = function (index) {
    if (confirm('¿Eliminar servicio?')) {
        siteConfig.servicios.splice(index, 1);
        renderServiciosList();
    }
};

window.editServicio = function (index) {
    const servicio = siteConfig.servicios[index];
    const container = document.getElementById('servicios-list');
    const cards = container.getElementsByClassName('servicio-admin-card');

    if (cards[index]) {
        cards[index].classList.add('editing');
        cards[index].innerHTML = `
            <div class="edit-form" style="padding: 20px; background: var(--parchment);">
                <input id="edit-serv-title-${index}" class="form-control" value="${servicio.title || ''}" placeholder="Título">
                <textarea id="edit-serv-desc-${index}" class="form-control" placeholder="Descripción">${servicio.description || ''}</textarea>
                <input id="edit-serv-precio-${index}" class="form-control" value="${servicio.precio || ''}" placeholder="Precio">
                <!-- NEW FIELDS -->
                <input id="edit-serv-duracion-${index}" class="form-control" value="${servicio.duracion || ''}" placeholder="Duración (ej. 30 minutos)">
                <input id="edit-serv-icon-${index}" class="form-control" value="${servicio.icon || 'fas fa-star'}" placeholder="Icono (ej. fas fa-star)">
                
                <label style="margin-top:10px; display:block; color:var(--burgundy); font-family:var(--font-heading);">Incluye (1 por línea):</label>
                <textarea id="edit-serv-features-${index}" class="form-control" rows="5" placeholder="Una pregunta específica&#10;Interpretación detallada...API-Driven">${(servicio.features || []).join('\n')}</textarea>

                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button class="btn-success" onclick="saveServicio(${index})">Guardar</button>
                    <button class="btn-secondary" onclick="renderServiciosList()">Cancelar</button>
                </div>
            </div>
        `;
    }
};

window.saveServicio = function (index) {
    const title = document.getElementById(`edit-serv-title-${index}`).value;
    const description = document.getElementById(`edit-serv-desc-${index}`).value;
    const precio = document.getElementById(`edit-serv-precio-${index}`).value;
    const duracion = document.getElementById(`edit-serv-duracion-${index}`).value;
    const icon = document.getElementById(`edit-serv-icon-${index}`).value;

    // Parse features from textarea
    const featuresRaw = document.getElementById(`edit-serv-features-${index}`).value;
    const features = featuresRaw.split('\n').map(l => l.trim()).filter(l => l !== '');

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
};

// ============================================
// TESTIMONIOS & BLOG
// ============================================

function renderTestimoniosList() {
    const container = document.getElementById('testimonios-list');
    if (!container) return;
    container.innerHTML = '';
    if (siteConfig.testimonios) {
        siteConfig.testimonios.forEach((t, i) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <h5>${t.nombre}</h5>
                </div>
                <p>${t.texto}</p>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="editTestimonio(${i})"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-small btn-delete" onclick="deleteTestimonio(${i})"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

window.deleteTestimonio = function (i) { if (confirm('¿Eliminar testimonio?')) { siteConfig.testimonios.splice(i, 1); renderTestimoniosList(); } };

window.editTestimonio = function (index) {
    const t = siteConfig.testimonios[index];
    const container = document.getElementById('testimonios-list');
    /* Find the specific card to replace or just re-render list with edit mode? 
       To keep it simple like Services/Blog: replace content of list or popup?
       Let's inject into the list container for simplicity or replace the innerHTML of that card.
       Actually, re-rendering the whole list with one item in edit mode is easier if we track state,
       but here we can just replace the card's HTML content like editServicio does.
    */
    // But editServicio replaces cards[index].innerHTML. Let's do that.
    const cards = container.getElementsByClassName('item-card');
    if (cards[index]) {
        cards[index].innerHTML = `
            <div class="edit-form" style="padding: 10px; background: var(--parchment); border-radius: 4px;">
                <div class="form-group">
                    <label>Nombre Cliente</label>
                    <input id="edit-test-nombre-${index}" class="form-control" value="${t.nombre}" placeholder="Nombre">
                </div>
                <div class="form-group">
                    <label>Testimonio</label>
                    <textarea id="edit-test-texto-${index}" class="form-control" rows="3" placeholder="Opinión del cliente...">${t.texto}</textarea>
                </div>
                <div class="form-group">
                    <label>Rating (1-5)</label>
                    <input type="number" id="edit-test-rating-${index}" class="form-control" value="${t.rating || 5}" min="1" max="5">
                </div>
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button class="btn-success" onclick="saveTestimonio(${index})"><i class="fas fa-save"></i> Guardar</button>
                    <button class="btn-secondary" onclick="renderTestimoniosList()"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </div>
        `;
    }
};

window.saveTestimonio = function (index) {
    const nombre = document.getElementById(`edit-test-nombre-${index}`).value;
    const texto = document.getElementById(`edit-test-texto-${index}`).value;
    const rating = document.getElementById(`edit-test-rating-${index}`).value;
    siteConfig.testimonios[index] = { ...siteConfig.testimonios[index], nombre, texto, rating: parseInt(rating) || 5 };
    renderTestimoniosList();
};

// ============================================
// BLOG: SPLIT LAYOUT (Option 1 Implementation)
// ============================================

function renderBlogList() {
    const list = document.getElementById('blog-list');
    if (!list) return;
    list.innerHTML = '';
    list.className = 'blog-tarot-grid';
    // Uses the new grid CSS

    if (siteConfig.blog) {
        siteConfig.blog.forEach((post, index) => {
            const card = document.createElement('div');
            card.className = 'card-split'; // New Split Card Class

            // Image Section (Visual separation)
            const bgImage = post.image || 'https://res.cloudinary.com/diq9jnrm2/image/upload/v1734324157/tarot-card-back_j8xdtb.jpg';

            card.innerHTML = `
                <div class="img-container" style="background-image: url('${bgImage}')"></div>
                
                <div class="content">
                    <h3 class="blog-card-title">${post.title}</h3>
                    
                    <div class="actions">
                        <button class="btn-edit" onclick="editPost(${index})"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn-delete" onclick="deletePost(${index})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }
}
window.deletePost = function (i) { if (confirm('Eliminar?')) { siteConfig.blog.splice(i, 1); renderBlogList(); } };
window.editPost = function (index) {
    const post = siteConfig.blog[index];
    const list = document.getElementById('blog-list');
    const imagePreview = post.image || 'https://res.cloudinary.com/diq9jnrm2/image/upload/v1734324157/tarot-card-back_j8xdtb.jpg';

    list.innerHTML = `
        <div class="edit-form" style="padding: 20px; background: var(--parchment); border-radius: 8px;">
            <div class="form-group">
                <label>Título</label>
                <input id="edit-post-title-${index}" class="form-control" value="${post.title}" placeholder="Título del post">
            </div>
            
            <div class="form-group">
                <label>Imagen Principal</label>
                <!-- POLISHED UPLOAD UI -->
                <div class="upload-container">
                    <img src="${imagePreview}" id="preview-post-${index}" class="img-preview-thumb" alt="Vista previa">
                    
                    <div style="flex-grow: 1;">
                        <input type="file" id="file-post-${index}" style="display: none;" onchange="uploadImage(this, 'edit-post-image-${index}', 'status-post-${index}')">
                        
                        <button class="btn-upload-gold" onclick="document.getElementById('file-post-${index}').click()">
                            <i class="fas fa-cloud-upload-alt"></i> Subir Nueva Foto
                        </button>
                        
                        <input id="edit-post-image-${index}" class="input-url-subtle" value="${post.image || ''}" placeholder="O pega la URL de la imagen aquí...">
                        <small id="status-post-${index}" style="color: var(--burgundy); display: block; margin-top: 5px;"></small>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>Contenido</label>
                <textarea id="edit-post-content-${index}" class="form-control" rows="8" placeholder="Escribe el contenido aquí...">${post.content}</textarea>
            </div>
            <div style="margin-top: 25px; display: flex; gap: 15px; justify-content: flex-end;">
                <button class="btn-secondary" onclick="renderBlogList()"><i class="fas fa-times"></i> Cancelar</button>
                <button class="btn-success" onclick="savePost(${index})"><i class="fas fa-save"></i> Guardar Cambios</button>
            </div>
        </div>
    `;
};
window.savePost = function (index) {
    siteConfig.blog[index].title = document.getElementById(`edit-post-title-${index}`).value;
    siteConfig.blog[index].content = document.getElementById(`edit-post-content-${index}`).value;
    siteConfig.blog[index].image = document.getElementById(`edit-post-image-${index}`).value;
    renderBlogList();
};

// ============================================
// IMAGE UPLOAD
// ============================================

window.uploadImage = async function (inputElement, targetInputId, statusId, previewId) {
    const file = inputElement.files[0];
    if (!file) return;

    const statusEl = document.getElementById(statusId);
    if (statusEl) statusEl.textContent = '⏳ Subiendo...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'aalhodea');

    try {
        const response = await fetch('https://api.cloudinary.com/v1_1/diq9jnrm2/image/upload', { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Error en subida de imagen');
        }

        const imageUrl = data.secure_url;

        const targetInput = document.getElementById(targetInputId);
        if (targetInput) targetInput.value = imageUrl;
        if (previewId) {
            const previewEl = document.getElementById(previewId);
            if (previewEl) previewEl.src = imageUrl;
        }

        if (statusEl) statusEl.textContent = '✅';

        if (targetInputId === 'qr-image-url' && window.updateQRPreview) {
            window.updateQRPreview();
        }

    } catch (error) {
        console.error('CLOUDINARY ERROR:', error);
        if (statusEl) {
            statusEl.textContent = '❌ Error';
            statusEl.title = error.message; // Show error on hover
        }
        alert('Error al subir imagen: ' + error.message);
    }
};

window.uploadHoroscopoImageWithEditor = function (targetInputId, statusId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function () { window.uploadImage(this, targetInputId, statusId); };
    input.click();
};

// ============================================
// HOROSCOPOS
// ============================================

// ZODIAC DATA
const ZODIAC_ICONS = {
    aries: '♈', tauro: '♉', geminis: '♊', cancer: '♋',
    leo: '♌', virgo: '♍', libra: '♎', escorpio: '♏',
    sagitario: '♐', capricornio: '♑', acuario: '♒', piscis: '♓'
};

function renderHoroscoposSelector() {
    const container = document.getElementById('horoscopo-selector');
    if (!container || !siteConfig.horoscopos) return;

    // Ensure grid container class
    container.className = 'zodiac-grid';

    const signos = Object.keys(siteConfig.horoscopos);
    container.innerHTML = signos.map(signo => {
        const icon = ZODIAC_ICONS[signo.toLowerCase()] || '✨';
        const isEditing = currentEditingSign === signo;
        const statusClass = isEditing ? 'active-sign' : '';
        const statusText = siteConfig.horoscopos[signo].prediction === 'PENDIENTE' ? 'Pendiente' : 'Actualizado';
        const statusColorClass = statusText === 'Actualizado' ? 'done' : '';

        return `
            <div class="zodiac-card ${statusClass}" onclick="editHoroscopo('${signo}')">
                <div class="zodiac-icon">${icon}</div>
                <div class="zodiac-name">${signo}</div>
                <div class="zodiac-status ${statusColorClass}">
                    ${isEditing ? 'Editando...' : statusText}
                </div>
            </div>
        `;
    }).join('');
}

window.editHoroscopo = function (signo) {
    if (currentEditingSign === signo) {
        cerrarEditorHoroscopo();
        return;
    }

    currentEditingSign = signo;
    renderHoroscoposSelector(); // Re-render to show active state

    const editor = document.getElementById('horoscopo-editor');
    const data = siteConfig.horoscopos[signo];
    const icon = ZODIAC_ICONS[signo.toLowerCase()] || '✨';

    editor.className = 'horoscope-editor-container active'; // Trigger animation

    editor.innerHTML = `
        <div class="editor-header">
            <div style="font-size: 3rem; color: var(--gold);">${icon}</div>
            <div>
                <h3>Editando: ${signo.toUpperCase()}</h3>
                <small style="color: #888;">Actualiza la predicción diaria</small>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="grid-column: span 2;" class="form-group">
                <label>Predicción General</label>
                <textarea id="pred-${signo}" class="form-control" rows="4">${data.prediction}</textarea>
            </div>

            <div class="form-group">
                <label>❤️ Amor</label>
                <input id="amor-${signo}" class="form-control" value="${data.amor || ''}">
            </div>

            <div class="form-group">
                <label>💼 Trabajo</label>
                <input id="trabajo-${signo}" class="form-control" value="${data.trabajo || ''}">
            </div>

            <div class="form-group">
                <label>💰 Finanzas</label>
                <input id="finanzas-${signo}" class="form-control" value="${data.finanzas || ''}">
            </div>

             <div class="form-group">
                <label>🍀 Número de la suerte</label>
                <input id="numero-${signo}" class="form-control" value="${data.numero || ''}">
            </div>
            
            <div class="form-group">
                <label>🎨 Color de Poder</label>
                 <input id="color-${signo}" class="form-control" value="${data.color || ''}">
            </div>

             <div class="form-group" style="grid-column: span 2;">
                <label>Imagen (Opcional)</label>
                <div style="display: flex; gap: 10px;">
                     <input id="image-${signo}" class="form-control" value="${data.image || ''}" placeholder="URL imagen">
                     <button class="btn-secondary" onclick="uploadHoroscopoImageWithEditor('image-${signo}', 'status-${signo}')"><i class="fas fa-upload"></i></button>
                </div>
                <small id="status-${signo}"></small>
            </div>
        </div>

        <div style="margin-top: 25px; display: flex; gap: 15px; justify-content: flex-end;">
            <button class="btn-secondary" onclick="cerrarEditorHoroscopo()"><i class="fas fa-times"></i> Cerrar</button>
            <button class="btn-success" onclick="saveHoroscopo('${signo}')"><i class="fas fa-save"></i> Guardar Cambios</button>
        </div>
    `;

    // Scroll to editor smoothly
    editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.saveHoroscopo = async function (signo, triggerSave = true) {
    const btn = document.querySelector('#horoscopo-editor .btn-success');
    const originalText = btn ? btn.innerHTML : 'Guardar';

    if (triggerSave && btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;
    }

    try {
        siteConfig.horoscopos[signo].prediction = document.getElementById(`pred-${signo}`).value;
        siteConfig.horoscopos[signo].amor = document.getElementById(`amor-${signo}`).value;
        siteConfig.horoscopos[signo].trabajo = document.getElementById(`trabajo-${signo}`).value;
        siteConfig.horoscopos[signo].finanzas = document.getElementById(`finanzas-${signo}`).value;
        siteConfig.horoscopos[signo].color = document.getElementById(`color-${signo}`).value;
        siteConfig.horoscopos[signo].numero = document.getElementById(`numero-${signo}`).value;

        const img = document.getElementById(`image-${signo}`);
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
};

window.cerrarEditorHoroscopo = function () {
    const editor = document.getElementById('horoscopo-editor');
    if (editor) {
        editor.classList.remove('active');
        editor.style.display = 'none'; // Ensure hidden
    }
    currentEditingSign = null;
    renderHoroscoposSelector(); // Refresh grid to remove active state
};

window.resetAllHoroscopos = async function () {
    if (!confirm('Reset all?')) return;
    Object.keys(siteConfig.horoscopos).forEach(s => siteConfig.horoscopos[s].prediction = 'PENDIENTE');
    await saveConfigToFirebase();
    showNotification('Reset OK', 'success');
};

// ============================================
// UTILS
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === `tab-${tabName}`));
}

function handleShare() {
    navigator.clipboard.writeText(window.location.origin);
    showNotification('Link copiado', 'success');
}

function handlePreview() {
    window.open(window.location.origin, '_blank');
}

function showNotification(msg, type) {
    const n = document.getElementById('notification');
    if (n) {
        n.textContent = msg;
        n.classList.add('show');
        setTimeout(() => n.classList.remove('show'), 3000);
    }
}

// ============================================
// ADD ITEM
// ============================================

window.addItem = function (type) {
    if (type === 'servicio') {
        if (!siteConfig.servicios) siteConfig.servicios = [];
        siteConfig.servicios.push({ title: 'Nuevo', description: '', precio: '' });
        renderServiciosList();
    } else if (type === 'testimonio') {
        if (!siteConfig.testimonios) siteConfig.testimonios = [];
        siteConfig.testimonios.push({ nombre: 'Nuevo', texto: '' });
        renderTestimoniosList();
    } else if (type === 'post') {
        if (!siteConfig.blog) siteConfig.blog = [];
        siteConfig.blog.push({ title: 'Nuevo', content: '' });
        renderBlogList();
    }
};

// ==========================================
// GESTIÓN DE SECCIÓN SOBRE MÍ
// ==========================================

window.renderSobreMiEditor = function () {
    if (!siteConfig || !siteConfig.sobreMi) return;

    const sm = siteConfig.sobreMi;

    // Poblar campos
    document.getElementById('sobre-mi-preview').src = sm.image || 'images/bruja-mistica.png';
    document.getElementById('sobre-mi-image-url').value = sm.image || '';

    document.getElementById('sobre-mi-intro').value = sm.intro || '';
    document.getElementById('sobre-mi-experiencia').value = sm.experiencia || '';
    document.getElementById('sobre-mi-clientes').value = sm.clientes || '';
    document.getElementById('sobre-mi-rating').value = sm.rating || '';

    document.getElementById('sobre-mi-bio1').value = sm.bio1 || '';
    document.getElementById('sobre-mi-bio2').value = sm.bio2 || '';
}

window.saveSobreMi = async function () {
    const btn = document.querySelector('#tab-sobre-mi .btn-success');
    const originalText = btn.innerHTML; // Fixed: was referencing btn before definition if not careful, but scope is ok here
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;
    }

    try {
        const newData = {
            image: document.getElementById('sobre-mi-image-url').value,
            intro: document.getElementById('sobre-mi-intro').value,
            experiencia: document.getElementById('sobre-mi-experiencia').value,
            clientes: document.getElementById('sobre-mi-clientes').value,
            rating: document.getElementById('sobre-mi-rating').value,
            bio1: document.getElementById('sobre-mi-bio1').value,
            bio2: document.getElementById('sobre-mi-bio2').value
        };

        siteConfig.sobreMi = newData;

        // Guardar en Firebase
        if (typeof firebase !== 'undefined') {
            const db = firebase.firestore();
            await db.collection('config').doc('site').set(siteConfig);
            showNotification('Sección Sobre Mí actualizada correctamente', 'success');
        } else {
            // Fallback local (no persistente si es estático, pero ok para demo)
            console.warn('Firebase no disponible, guardando en memoria local');
            showNotification('Cambios guardados localmente (Firebase no conectado)', 'warning');
        }

    } catch (error) {
        console.error('Error guardando Sobre Mí:', error);
        showNotification('Error al guardar cambios: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// ============================================
// QR STICKER
// ============================================

window.updateQRPreview = function () {
    const title = document.getElementById('qr-title').value;
    const text1 = document.getElementById('qr-text-1').value;
    const text2 = document.getElementById('qr-text-2').value;
    const imgUrl = document.getElementById('qr-image-url').value;

    const prevTitle = document.getElementById('prev-title');
    if (prevTitle) prevTitle.textContent = title;

    const prevText1 = document.getElementById('prev-text-1');
    if (prevText1) prevText1.textContent = text1;

    const prevText2 = document.getElementById('prev-text-2');
    if (prevText2) prevText2.textContent = text2;

    const qrImg = document.getElementById('prev-qr-img');
    if (qrImg) {
        if (imgUrl) {
            qrImg.src = imgUrl;
            qrImg.style.display = 'block';
        } else {
            qrImg.style.display = 'none';
        }
    }
};

window.printSticker = function () {
    const title = document.getElementById('qr-title').value;
    const text1 = document.getElementById('qr-text-1').value;
    const text2 = document.getElementById('qr-text-2').value;
    const imgUrl = document.getElementById('qr-image-url').value;

    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Permite pop-ups para imprimir'); return; }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang='es'>
        <head>
            <meta charset='UTF-8'>
            <title>Sticker Tarot</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Poppins:wght@300;500&display=swap');
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Cinzel', serif; background: white; }
                .sticker-container {
                    position: relative; width: 500px; height: 500px; border-radius: 50%;
                    background: linear-gradient(135deg, #2a0845 0%, #6441A5 50%, #2a0845 100%);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    border: 8px solid #D4AF37; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
                .sticker-container::before {
                    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                    background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 60%);
                }
                .brand-name {
                    font-size: 28px; color: #D4AF37; text-transform: uppercase; letter-spacing: 4px;
                    margin-bottom: 20px; z-index: 2; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .qr-frame {
                    background: white; padding: 15px; border-radius: 20px; z-index: 2; position: relative; border: 2px solid #D4AF37;
                }
                .qr-image { width: 200px; height: 200px; display: block; object-fit:contain; }
                .cta-text {
                    margin-top: 20px; font-family: 'Poppins', sans-serif; font-size: 18px; color: white;
                    z-index: 2; text-align: center; font-weight: 500;
                }
                .stars { position: absolute; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
                .star { position: absolute; color: #D4AF37; opacity: 0.7; font-size: 20px; }
            </style>
        </head>
        <body>
            <div class='sticker-container'>
                <div class='stars'>
                    <div class='star' style='top: 15%; left: 20%;'>✦</div>
                    <div class='star' style='top: 15%; right: 20%;'>✦</div>
                    <div class='star' style='bottom: 20%; left: 15%;'>✦</div>
                    <div class='star' style='bottom: 20%; right: 15%;'>✦</div>
                </div>
                <div class='brand-name'>${title}</div>
                <div class='qr-frame'>
                    <img src='${imgUrl}' class='qr-image' alt='QR Code'>
                </div>
                <div class='cta-text'>
                    ${text1}<br>
                    <span style='color: #D4AF37; font-weight: 700;'>${text2}</span>
                </div>
            </div>
            <script>
                setTimeout(() => { window.print(); }, 800);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
