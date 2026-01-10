// ============================================
// ADMIN PANEL JAVASCRIPT
// ============================================

let currentUser = null;
let siteConfig = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    if (initFirebase()) {
        checkAuthState();
        initEventListeners();
    } else {
        showNotification('Error: No se pudo inicializar Firebase', 'error');
    }
});

// Check authentication state
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
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Logout button
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Save button
    document.getElementById('btn-save').addEventListener('click', saveConfigToFirebase);

    // Share button
    document.getElementById('btn-share').addEventListener('click', handleShare);

    // Preview button
    document.getElementById('btn-preview')?.addEventListener('click', handlePreview);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Add buttons
    document.getElementById('btn-add-servicio')?.addEventListener('click', () => addItem('servicio'));
    document.getElementById('btn-add-testimonio')?.addEventListener('click', () => addItem('testimonio'));
    document.getElementById('btn-add-post')?.addEventListener('click', () => addItem('post'));

    // Reset Horoscopos
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
            showNotification('✅ Configuración cargada de Firebase', 'success');
        } else {
            // Si no existe en Firebase, cargar local
            console.log('No config in Firebase, loading local...');
            throw new Error('Documento no existe en Firestore');
        }

        populateForm();
    } catch (error) {
        console.error('Error loading config:', error);

        // INTENTO DE FALLBACK LOCAL
        try {
            const response = await fetch('config.json');
            siteConfig = await response.json();
            populateForm();
            showNotification(`⚠️ Conexión débil: Datos cargados localmente (${error.message})`, 'warning');
        } catch (localError) {
            showNotification('❌ Error crítico: No se pudo cargar configuración', 'error');
        }
    }
}

// Variable global para rastrear edición activa
let currentEditingSign = null;

// ... (existing code) ...

async function saveConfigToFirebase() {
    try {
        // Verificar autenticación
        if (!currentUser) {
            showNotification('❌ Error: No estás autenticado. Recarga la página.', 'error');
            return;
        }

        // AUTO-SAVE: Guardar editores abiertos pendientes
        // 1. Horóscopos
        if (currentEditingSign) {
            saveHoroscopo(currentEditingSign);
            console.log('Autoguardado horóscopo:', currentEditingSign);
        }

        // 2. Servicios (Buscar tarjetas en modo edición)
        const editingCards = document.querySelectorAll('.item-card.editing');
        editingCards.forEach(card => {
            // Extraer índice del ID de un input interno: edit-serv-title-0
            const input = card.querySelector('input[id^="edit-serv-title-"]');
            if (input) {
                const index = input.id.split('-').pop();
                saveServicio(index);
                console.log('Autoguardado servicio índice:', index);
            }
        });

        // Collect data from general forms
        collectFormData();

        // Intentar guardar en Firebase
        showNotification('⏳ Guardando todos los cambios...', 'info');

        await db.collection('config').doc('site').set(siteConfig);

        showNotification('✅ Cambios guardados exitosamente', 'success');
    } catch (error) {
        console.error('Error saving config:', error);
        if (error.code === 'permission-denied') {
            showNotification('❌ Error: Permisos insuficientes en Firestore.', 'error');
        } else {
            showNotification(`❌ Error al guardar: ${error.message}`, 'error');
        }
    }
}

// ============================================
// FORM POPULATION
// ============================================

function populateForm() {
    if (!siteConfig) return;

    // Ensure horoscopos exists (Fallback for new dbs)
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

    // General
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
    }

    // Redes Sociales
    if (siteConfig.redesSociales) {
        document.getElementById('social-instagram').value = siteConfig.redesSociales.instagram || '';
        document.getElementById('social-facebook').value = siteConfig.redesSociales.facebook || '';
        document.getElementById('social-tiktok').value = siteConfig.redesSociales.tiktok || '';
        document.getElementById('social-youtube').value = siteConfig.redesSociales.youtube || '';
    }

    // QR Code
    if (!siteConfig.qrSticker) {
        siteConfig.qrSticker = {
            title: "Tarot Místico",
            text1: "Escanea para",
            text2: "Descubrir tu Destino",
            image: "https://via.placeholder.com/200x200?text=QR+Code" // Default placeholder
        };
    }
    document.getElementById('qr-title').value = siteConfig.qrSticker.title || 'Tarot Místico';
    document.getElementById('qr-text-1').value = siteConfig.qrSticker.text1 || 'Escanea para';
    document.getElementById('qr-text-2').value = siteConfig.qrSticker.text2 || 'Descubrir tu Destino';
    document.getElementById('qr-image-url').value = siteConfig.qrSticker.image || '';

    // Initial Preview Update
    updateQRPreview();

    // Listas
    renderServiciosList();
    renderTestimoniosList();
    renderBlogList();
    renderHoroscoposSelector();
}

// ============================================
// COLLECT FORM DATA
// ============================================

function collectFormData() {
    // Asegurar estructura base
    if (!siteConfig.contact) siteConfig.contact = {};
    if (!siteConfig.hero) siteConfig.hero = {};
    if (!siteConfig.redesSociales) siteConfig.redesSociales = {};

    // General
    siteConfig.siteName = document.getElementById('siteName').value;
    siteConfig.tagline = document.getElementById('tagline').value;

    // Contacto
    siteConfig.contact.email = document.getElementById('contact-email').value;
    siteConfig.contact.whatsapp = document.getElementById('contact-whatsapp').value;
    siteConfig.contact.horario = document.getElementById('contact-horario').value;

    // Hero
    siteConfig.hero.title = document.getElementById('hero-title').value;
    siteConfig.hero.subtitle = document.getElementById('hero-subtitle').value;

    // Redes Sociales
    siteConfig.redesSociales.instagram = document.getElementById('social-instagram').value;
    siteConfig.redesSociales.facebook = document.getElementById('social-facebook').value;
    siteConfig.redesSociales.tiktok = document.getElementById('social-tiktok').value;
    siteConfig.redesSociales.youtube = document.getElementById('social-youtube').value;

    // QR Sticker
    if (!siteConfig.qrSticker) siteConfig.qrSticker = {};
    siteConfig.qrSticker.title = document.getElementById('qr-title').value;
    siteConfig.qrSticker.text1 = document.getElementById('qr-text-1').value;
    siteConfig.qrSticker.text2 = document.getElementById('qr-text-2').value;
    siteConfig.qrSticker.image = document.getElementById('qr-image-url').value;
}

// ============================================
// SERVICIOS MANAGEMENT
// ============================================

function renderServiciosList() {
    const container = document.getElementById('servicios-list');
    if (!container) return;
    container.innerHTML = '';

    if (siteConfig.servicios) {
        siteConfig.servicios.forEach((servicio, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <h5>${servicio.title}</h5>
                    <div class="item-actions">
                        <button class="btn-small btn-edit" onclick="editServicio(${index})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-small btn-delete" onclick="deleteServicio(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p>${servicio.description}</p>
                <p><strong>Precio:</strong> ${servicio.precio}</p>
            `;
            container.appendChild(card);
        });
    }
}

window.deleteServicio = function (index) {
    if (confirm('¿Eliminar este servicio?')) {
        siteConfig.servicios.splice(index, 1);
        renderServiciosList();
    }
};

window.editServicio = function (index) {
    const servicio = siteConfig.servicios[index];
    const container = document.getElementById('servicios-list');
    const cards = container.getElementsByClassName('item-card');

    if (cards[index]) {
        const card = cards[index];
        card.classList.add('editing');
        card.innerHTML = `
            <div class="edit-form">
                <h4>Editar Servicio</h4>
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" id="edit-sev-title-${index}" class="form-control" value="${servicio.title}">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="edit-sev-desc-${index}" class="form-control" rows="3">${servicio.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Precio</label>
                    <input type="text" id="edit-sev-precio-${index}" class="form-control" value="${servicio.precio}">
                </div>
                <div class="form-group">
                    <label>Icono (FontAwesome)</label>
                    <input type="text" id="edit-sev-icon-${index}" class="form-control" value="${servicio.icon}">
                </div>
                <div class="form-group">
                    <label>Duración</label>
                    <input type="text" id="edit-sev-duration-${index}" class="form-control" value="${servicio.duracion}">
                </div>
                
                 <div class="form-group" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                    <label>Imagen (Opcional)</label>
                    <input type="text" id="edit-sev-image-${index}" class="form-control" value="${servicio.image || ''}" placeholder="URL de la imagen">
                     <div style="margin-top:10px;">
                        <input type="file" onchange="uploadImage(this, 'edit-sev-image-${index}', 'upload-status-sev-${index}')" accept="image/*" style="font-size:0.9rem;">
                        <small id="upload-status-sev-${index}" style="margin-left:10px; color:#aaa;"></small>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn-success" onclick="saveServicio(${index})"><i class="fas fa-check"></i> Guardar</button>
                    <button class="btn-secondary" onclick="renderServiciosList()"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </div>
        `;
    }
};

window.saveServicio = function (index) {
    siteConfig.servicios[index] = {
        ...siteConfig.servicios[index],
        title: document.getElementById(`edit-sev-title-${index}`).value,
        description: document.getElementById(`edit-sev-desc-${index}`).value,
        precio: document.getElementById(`edit-sev-precio-${index}`).value,
        icon: document.getElementById(`edit-sev-icon-${index}`).value,
        duracion: document.getElementById(`edit-sev-duration-${index}`).value,
        image: document.getElementById(`edit-sev-image-${index}`).value
    };
    renderServiciosList();
    showNotification('Servicio actualizado en memoria', 'info');
};

// ============================================
// TESTIMONIOS MANAGEMENT & MODERATION
// ============================================

async function loadPendingReviews() {
    const container = document.getElementById('pending-reviews-list');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Cargando reseñas...</p>';

    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('reviews').where('status', '==', 'pending').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#ccc;">No hay reseñas pendientes.</p>';
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const review = doc.data();
            const id = doc.id;

            const card = document.createElement('div');
            card.className = 'item-card';
            card.style.borderLeft = '3px solid var(--color-accent)';
            card.innerHTML = `
                <div class="item-header">
                    <h5>${review.nombre} <small style="font-weight:normal;">(${review.ubicacion})</small></h5>
                    <div class="item-actions">
                        <button class="btn-small btn-success" onclick="approveReview('${id}')" title="Aprobar">
                            <i class="fas fa-check"></i>
                        </button>
                         <button class="btn-small btn-delete" onclick="rejectReview('${id}')" title="Rechazar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="testimonio-rating" style="color: gold; margin-bottom: 5px;">
                     ${'<i class="fas fa-star"></i>'.repeat(review.rating || 5)}
                </div>
                <p>"${review.texto}"</p>
                <p><small style="color:gray;">${review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Fecha desconocida'}</small></p>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = '<p style="text-align:center; color:red;">Error cargando reseñas (Verifica índices en consola).</p>';
    }
}

window.approveReview = async function (id) {
    try {
        const db = firebase.firestore();
        const docRef = db.collection('reviews').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return;

        const review = doc.data();

        // Add to siteConfig
        if (!siteConfig.testimonios) siteConfig.testimonios = [];

        siteConfig.testimonios.push({
            nombre: review.nombre,
            ubicacion: review.ubicacion,
            texto: review.texto,
            rating: review.rating,
            avatar: review.nombre.charAt(0).toUpperCase()
        });

        // Update Firestore status
        await docRef.update({ status: 'approved' });

        // Refresh UI
        renderTestimoniosList();
        loadPendingReviews();

        showNotification('✅ Reseña aprobada (recuerda GUARDAR CAMBIOS)', 'success');

    } catch (error) {
        console.error('Error approving review:', error);
        showNotification('Error aprobando reseña', 'error');
    }
};

window.rejectReview = async function (id) {
    if (!confirm('¿Rechazar y eliminar esta reseña permanentemente?')) return;

    try {
        const db = firebase.firestore();
        await db.collection('reviews').doc(id).delete();
        loadPendingReviews();
        showNotification('Reseña rechazada', 'info');
    } catch (error) {
        console.error('Error rejecting review:', error);
    }
};

function renderTestimoniosList() {
    const container = document.getElementById('testimonios-list');
    if (!container) return;
    container.innerHTML = '';

    if (siteConfig.testimonios) {
        siteConfig.testimonios.forEach((testimonio, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <h5>${testimonio.nombre}</h5>
                    <div class="item-actions">
                        <button class="btn-small btn-delete" onclick="deleteTestimonio(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p>"${testimonio.texto}"</p>
                <p><small>${testimonio.ubicacion}</small></p>
            `;
            container.appendChild(card);
        });
    }
}

window.deleteTestimonio = function (index) {
    if (confirm('¿Eliminar este testimonio?')) {
        siteConfig.testimonios.splice(index, 1);
        renderTestimoniosList();
    }
};

// ============================================
// BLOG MANAGEMENT
// ============================================

function renderBlogList() {
    const container = document.getElementById('blog-list');
    if (!container) return;
    container.innerHTML = '';

    if (siteConfig.blog) {
        siteConfig.blog.forEach((post, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <h5>${post.title}</h5>
                    <div class="item-actions">
                         <button class="btn-small btn-edit" onclick="editPost(${index})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-small btn-delete" onclick="deletePost(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p>${post.excerpt}</p>
                <p><small><i class="far fa-calendar"></i> ${post.fecha}</small></p>
                ${post.youtubeUrl ? `<p><small><i class="fab fa-youtube" style="color:red;"></i> Video Adjunto</small></p>` : ''}
            `;
            container.appendChild(card);
        });
    }
}

// ============================================
// IMAGE UPLOAD UTILS
// ============================================

window.uploadImage = async function (inputElement, targetInputId, statusId) {
    const file = inputElement.files[0];
    if (!file) return;

    const statusEl = document.getElementById(statusId);
    if (statusEl) {
        statusEl.textContent = '⏳ Subiendo a nube externa...';
        statusEl.style.color = '#ffd700'; // Gold warning color
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'aalhodea'); // Tu preset de Cloudinary

    try {
        // Cloudinary API Call
        const response = await fetch('https://api.cloudinary.com/v1_1/diq9jnrm2/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Falló la subida a Cloudinary');

        const data = await response.json();
        const imageUrl = data.secure_url; // URL HTTPS segura

        const targetInput = document.getElementById(targetInputId);
        if (targetInput) {
            targetInput.value = imageUrl;
            // Visual feedback
            targetInput.style.borderColor = 'lightgreen';
            targetInput.style.boxShadow = '0 0 10px rgba(144, 238, 144, 0.2)';
        }

        if (statusEl) {
            statusEl.textContent = '✅ Imagen lista (Guardada)';
            statusEl.style.color = 'lightgreen';
        }

        console.log('Imagen subida exitosamente:', imageUrl);

    } catch (error) {
        console.error('Cloudinary Upgrade Error:', error);
        if (statusEl) {
            statusEl.textContent = '❌ Error de subida.';
            statusEl.style.color = 'red';
        }
        showNotification('Error subiendo imagen. Verifica tu conexión.', 'error');
    }
};

window.editPost = function (index) {
    const post = siteConfig.blog[index];
    const container = document.getElementById('blog-list');
    const cards = container.getElementsByClassName('item-card');

    if (cards[index]) {
        const card = cards[index];
        card.classList.add('editing');
        card.innerHTML = `
            <div class="edit-form">
                <h4>Editar Artículo</h4>
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" id="edit-post-title-${index}" class="form-control" value="${post.title}">
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="text" id="edit-post-date-${index}" class="form-control" value="${post.fecha}">
                </div>
                <div class="form-group">
                    <label>Resumen (Tarjeta)</label>
                    <textarea id="edit-post-excerpt-${index}" class="form-control" rows="2">${post.excerpt}</textarea>
                </div>
                <div class="form-group">
                    <label>URL de YouTube (Opcional)</label>
                    <input type="text" id="edit-post-youtube-${index}" class="form-control" value="${post.youtubeUrl || ''}" placeholder="https://www.youtube.com/watch?v=...">
                </div>
                
                <div class="form-group" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                    <label>Imagen Miniatura</label>
                    <input type="text" id="edit-post-image-${index}" class="form-control" value="${post.image || ''}" placeholder="URL de la imagen">
                    <div style="margin-top:10px;">
                        <input type="file" onchange="uploadImage(this, 'edit-post-image-${index}', 'upload-status-${index}')" accept="image/*" style="font-size:0.9rem;">
                        <small id="upload-status-${index}" style="margin-left:10px; color:#aaa;"></small>
                    </div>
                </div>

                <div class="form-group">
                    <label>Contenido Completo (HTML permitido)</label>
                    <textarea id="edit-post-content-${index}" class="form-control" rows="6">${post.content || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-success" onclick="savePost(${index})"><i class="fas fa-check"></i> Guardar</button>
                    <button class="btn-secondary" onclick="renderBlogList()"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </div>
        `;
    }
};

window.savePost = function (index) {
    siteConfig.blog[index] = {
        ...siteConfig.blog[index],
        title: document.getElementById(`edit-post-title-${index}`).value,
        fecha: document.getElementById(`edit-post-date-${index}`).value,
        excerpt: document.getElementById(`edit-post-excerpt-${index}`).value,
        youtubeUrl: document.getElementById(`edit-post-youtube-${index}`).value,
        image: document.getElementById(`edit-post-image-${index}`).value,
        content: document.getElementById(`edit-post-content-${index}`).value
    };

    renderBlogList();
    showNotification('Artículo actualizado en memoria', 'info');
};

window.deletePost = function (index) {
    if (confirm('¿Eliminar este post?')) {
        siteConfig.blog.splice(index, 1);
        renderBlogList();
    }
};

// ============================================
// HORÓSCOPOS MANAGEMENT
// ============================================

function renderHoroscoposSelector() {
    const container = document.getElementById('horoscopo-selector');
    if (!container || !siteConfig.horoscopos) return;

    const signos = Object.keys(siteConfig.horoscopos);
    const timestamp = new Date().getTime(); // Cache buster

    container.innerHTML = signos.map(signoRaw => {
        const signo = signoRaw.trim(); // Handle potential spaces

        // Map Spanish names to English filenames
        const fileMap = {
            "Aries": "aries", "Tauro": "taurus", "Géminis": "gemini", "Cáncer": "cancer",
            "Leo": "leo", "Virgo": "virgo", "Libra": "libra", "Escorpio": "scorpio",
            "Sagitario": "sagittarius", "Capricornio": "capricorn", "Acuario": "aquarius", "Piscis": "pisces"
        };
        // Normalize for case-insensitive matching if direct match fails
        let baseName = fileMap[signo] || fileMap[Object.keys(fileMap).find(k => k.toLowerCase() === signo.toLowerCase())] || signo.toLowerCase();
        let fileName = `${baseName}-card`; // New naming convention to force cache break

        return `
        <div class="mystical-selector mystical-card" onclick="editHoroscopo('${signoRaw}')" style="background-image: url('images/zodiac/${fileName}.png?v=${timestamp}');">
            <div class="card-overlay">
                <div class="symbol">${siteConfig.horoscopos[signoRaw].symbol}</div>
                <div class="name">${signo.toUpperCase()}</div>
            </div>
        </div>
    `}).join('');
}

// Modificar editHoroscopo para rastrear el signo actual
window.editHoroscopo = function (signo) {
    currentEditingSign = signo; // TRACKING

    // Safety check structure
    if (!siteConfig.horoscopos[signo]) {
        siteConfig.horoscopos[signo] = { symbol: '', prediction: '', amor: '', trabajo: '', finanzas: '', color: '', numero: '' };
    }

    const data = siteConfig.horoscopos[signo];
    const editor = document.getElementById('horoscopo-editor');

    // Highlight selected sign
    document.querySelectorAll('.mystical-selector').forEach(btn => btn.classList.remove('active'));
    // Fix: event might not be defined if called programmatically, use finding logic
    const btns = document.querySelectorAll('.mystical-selector');
    btns.forEach(btn => {
        // Loose matching for safety
        if (btn.textContent.includes(signo.toUpperCase()) || btn.getAttribute('onclick').includes(signo)) {
            btn.classList.add('active');
        }
    });

    // Auto-scroll to editor (User Request)
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });

    editor.innerHTML = `
        <h4>Editando: ${signo} ${data.symbol || ''}</h4>
        <div class="form-section">
            <div class="form-group">
                <label>Predicción General</label>
                <textarea class="form-control" id="pred-${signo}" rows="3">${data.prediction || ''}</textarea>
            </div>
            <div class="form-group">
                <label><i class="fas fa-heart"></i> Amor</label>
                <input type="text" class="form-control" id="amor-${signo}" value="${data.amor || ''}">
            </div>
            <div class="form-group">
                <label><i class="fas fa-briefcase"></i> Trabajo</label>
                <input type="text" class="form-control" id="trabajo-${signo}" value="${data.trabajo || ''}">
            </div>
            <div class="form-group">
                <label><i class="fas fa-coins"></i> Finanzas</label>
                <input type="text" class="form-control" id="finanzas-${signo}" value="${data.finanzas || ''}">
            </div>
            <div class="form-group">
                <label>Color de la Suerte</label>
                <input type="text" class="form-control" id="color-${signo}" value="${data.color || ''}">
            </div>
            <div class="form-group">
                <label>Número de la Suerte</label>
                <input type="text" class="form-control" id="numero-${signo}" value="${data.numero || ''}">
            </div>
            <button class="btn-success" onclick="saveHoroscopo('${signo}')">
                <i class="fas fa-save"></i> Confirmar Edición
            </button>
        </div>
    `;

    editor.classList.add('active');
};

window.saveHoroscopo = function (signo) {
    if (!siteConfig.horoscopos[signo]) return; // Safety

    const predEl = document.getElementById(`pred-${signo}`);
    // Si el elemento no existe (porque se cambió de tab), no hacemos nada o usamos el valor previo
    if (!predEl) return;

    siteConfig.horoscopos[signo].prediction = predEl.value;
    siteConfig.horoscopos[signo].amor = document.getElementById(`amor-${signo}`).value;
    siteConfig.horoscopos[signo].trabajo = document.getElementById(`trabajo-${signo}`).value;
    siteConfig.horoscopos[signo].finanzas = document.getElementById(`finanzas-${signo}`).value;
    siteConfig.horoscopos[signo].color = document.getElementById(`color-${signo}`).value;
    siteConfig.horoscopos[signo].numero = document.getElementById(`numero-${signo}`).value;

    // No mostramos notificación si es llamado desde auto-save para no spammear
    // Pero si es click manual sí. Podemos diferenciarlo o simplemente mostrarlo siempre.
    // showNotification(`✅ Horóscopo de ${signo} actualizado en memoria`, 'success');
};

window.resetAllHoroscopos = async function () {
    if (!confirm('¿ADMIN: Preparar nueva semana?\n\nEsto borrará el texto de TODOS los signos para que escribas los nuevos. Esta acción no se puede deshacer.')) {
        return;
    }

    if (!siteConfig || !siteConfig.horoscopos) return;

    const signos = Object.keys(siteConfig.horoscopos);
    signos.forEach(signo => {
        siteConfig.horoscopos[signo] = {
            ...siteConfig.horoscopos[signo], // Mantener símbolo y metadatos si los hubiera
            prediction: 'Predicción semanal pendiente...',
            amor: '',
            trabajo: '',
            finanzas: '',
            color: 'Dorado',
            numero: '7'
        };
    });

    // Guardar cambios automáticamente
    await saveConfigToFirebase();

    // Refrescar UI si hay un editor abierto
    const editor = document.getElementById('horoscopo-editor');
    editor.classList.remove('active');
    editor.innerHTML = '';

    // Quitar selección visual
    document.querySelectorAll('.horoscopo-btn').forEach(btn => btn.classList.remove('active'));

    showNotification('✨ Todo limpio. Listo para la nueva semana.', 'success');
};

// ============================================
// TAB MANAGEMENT
// ============================================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

// ============================================
// SHARE FUNCTIONALITY
// ============================================

function handleShare() {
    const publicUrl = window.location.origin; // Sin /admin.html

    navigator.clipboard.writeText(publicUrl).then(() => {
        showNotification('✅ Link público copiado al portapapeles', 'success');
    }).catch(() => {
        showNotification('Link: ' + publicUrl, 'info');
    });
}

// ============================================
// PREVIEW FUNCTIONALITY
// ============================================

function handlePreview() {
    const publicUrl = window.location.origin; // Sin /admin.html

    // Abrir el sitio en una nueva pestaña
    window.open(publicUrl, '_blank');

    showNotification('✅ Abriendo vista previa', 'success');
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============================================
// ADD ITEM PLACEHOLDERS
// ============================================

// ============================================
// ADD ITEM PLACEHOLDERS & IMPLEMENTATION
// ============================================

function addItem(type) {
    if (type === 'servicio') {
        const newServicio = {
            id: 'nuevo-' + Date.now(),
            title: 'Nuevo Servicio',
            description: 'Descripción del servicio...',
            precio: '$00 USD',
            icon: 'fas fa-star', // Default icon
            features: ['Característica 1', 'Característica 2'],
            featured: false
        };
        siteConfig.servicios.push(newServicio);
        renderServiciosList();
        // Abrir editor inmediatamente para el nuevo item
        editServicio(siteConfig.servicios.length - 1);
    }
    else if (type === 'testimonio') {
        siteConfig.testimonios.push({
            nombre: 'Nuevo Cliente',
            texto: 'Escribe aquí el testimonio...',
            ubicacion: 'Ciudad, País'
        });
        renderTestimoniosList();
        // No hay edición para testimonios aún implementada en UI compleja, pero podríamos agregarla
        // Por ahora, recargamos la lista
    }
    else if (type === 'post') {
        siteConfig.blog.push({
            id: 'post-' + Date.now(),
            title: 'Nuevo Artículo',
            excerpt: 'Resumen del artículo...',
            content: 'Contenido completo del artículo...',
            fecha: new Date().toLocaleDateString(),
            image: '',
            youtubeUrl: ''
        });
        renderBlogList();
        // Abrir editor
        editPost(siteConfig.blog.length - 1);
    }
}

// ============================================
// EDIT IMPLEMENTATIONS
// ============================================

// --- SERVICIOS ---

window.editServicio = function (index) {
    const servicio = siteConfig.servicios[index];
    const container = document.getElementById('servicios-list');
    const cards = container.getElementsByClassName('item-card');

    if (cards[index]) {
        // Convertir card en formulario
        const card = cards[index];
        card.classList.add('editing');
        card.innerHTML = `
            <div class="edit-form">
                <h4>Editar Servicio</h4>
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" id="edit-serv-title-${index}" class="form-control" value="${servicio.title}">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="edit-serv-desc-${index}" class="form-control" rows="2">${servicio.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Precio</label>
                    <input type="text" id="edit-serv-price-${index}" class="form-control" value="${servicio.precio}">
                </div>
                <div class="form-group">
                    <label>Icono (FontAwesome)</label>
                    <input type="text" id="edit-serv-icon-${index}" class="form-control" value="${servicio.icon}">
                    <small>Ej: fas fa-star, fas fa-heart, fas fa-crystal-ball</small>
                </div>
                <div class="form-group">
                    <label>Características (una por línea)</label>
                    <textarea id="edit-serv-features-${index}" class="form-control" rows="3">${servicio.features ? servicio.features.join('\n') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-success" onclick="saveServicio(${index})"><i class="fas fa-check"></i> Guardar</button>
                    <button class="btn-secondary" onclick="renderServiciosList()"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </div>
        `;
    }
};

window.saveServicio = function (index) {
    const featuresText = document.getElementById(`edit-serv-features-${index}`).value;

    // Actualizar objeto en memoria
    siteConfig.servicios[index] = {
        ...siteConfig.servicios[index],
        title: document.getElementById(`edit-serv-title-${index}`).value,
        description: document.getElementById(`edit-serv-desc-${index}`).value,
        precio: document.getElementById(`edit-serv-price-${index}`).value,
        icon: document.getElementById(`edit-serv-icon-${index}`).value,
        features: featuresText.split('\n').filter(line => line.trim() !== '') // Convertir líneas en array
    };

    // Volver a renderizar lista
    renderServiciosList();
    showNotification('Servicio actualizado (recuerda Guardar Cambios global)', 'info');
};

// --- BLOG & TESTIMONIOS (Simple delete por ahora, editar próximamente si se requiere) ---
// Para cumplir con "TODO editable", permitiremos editar testimonios también de forma simple

window.editTestimonio = null; // Placeholder si se necesita
// (La implementación se puede expandir igual que servicios si el usuario lo pide)

// ============================================
// QR STICKER MANAGEMENT
// ============================================

window.updateQRPreview = function() {
    const title = document.getElementById('qr-title').value;
    const text1 = document.getElementById('qr-text-1').value;
    const text2 = document.getElementById('qr-text-2').value;
    const imgUrl = document.getElementById('qr-image-url').value;

    document.getElementById('prev-title').textContent = title;
    document.getElementById('prev-text-1').textContent = text1;
    document.getElementById('prev-text-2').textContent = text2;
    
    const qrImg = document.getElementById('prev-qr-img');
    if (imgUrl) {
        qrImg.src = imgUrl;
        qrImg.style.display = 'block';
    } else {
        qrImg.style.display = 'none';
        // Placeholder or hide?
        // Let's keep it clean
    }
};

window.printSticker = function() {
    const title = document.getElementById('qr-title').value;
    const text1 = document.getElementById('qr-text-1').value;
    const text2 = document.getElementById('qr-text-2').value;
    const imgUrl = document.getElementById('qr-image-url').value;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(\
        <!DOCTYPE html>
        <html lang='es'>
        <head>
            <meta charset='UTF-8'>
            <title>Sticker Tarot M�stico</title>
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
                    margin-bottom: 20px; z-index: 2; font-weight: 700;
                }
                .qr-frame {
                    background: white; padding: 15px; border-radius: 20px; z-index: 2; position: relative; border: 2px solid #D4AF37;
                }
                .qr-image { width: 200px; height: 200px; display: block; }
                .cta-text {
                    margin-top: 20px; font-family: 'Poppins', sans-serif; font-size: 18px; color: white;
                    z-index: 2; text-align: center; font-weight: 500;
                }
                .stars { position: absolute; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
                .star { position: absolute; color: #D4AF37; opacity: 0.7; font-size: 20px; }
            </style>
        </head>
        <body onload='window.print()'>
            <div class='sticker-container'>
                <div class='stars'>
                    <div class='star' style='top: 15%; left: 20%;'></div>
                    <div class='star' style='top: 15%; right: 20%;'></div>
                    <div class='star' style='bottom: 20%; left: 15%;'></div>
                    <div class='star' style='bottom: 20%; right: 15%;'></div>
                </div>
                <div class='brand-name'>\</div>
                <div class='qr-frame'>
                    <img src='\' class='qr-image' alt='QR Code'>
                </div>
                <div class='cta-text'>
                    \<br>
                    <span style='color: #D4AF37; font-weight: 700;'>\</span>
                </div>
            </div>
        </body>
        </html>
    \);
    printWindow.document.close();
};

