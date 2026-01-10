// ============================================
// SISTEMA DE CONFIGURACIÓN DINÁMICA
// ============================================

let siteConfig = null;

// Cargar configuración desde Firebase o config.json
async function loadConfig() {
    try {
        // Try loading from Firebase first
        if (typeof firebase !== 'undefined') {
            const firebaseLoaded = await loadFromFirebase();
            if (firebaseLoaded) {
                console.log('✅ Configuración cargada desde Firebase');
                renderDynamicContent();
                return;
            }
        }

        // Fallback to config.json
        const response = await fetch('config.json');
        siteConfig = await response.json();
        console.log('✅ Configuración cargada desde config.json');
        renderDynamicContent();
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
    }
}

// Load from Firebase
async function loadFromFirebase() {
    try {
        // Check if Firebase is initialized
        if (!firebase.apps || firebase.apps.length === 0) {
            return false;
        }

        const db = firebase.firestore();
        const doc = await db.collection('config').doc('site').get();

        if (doc.exists) {
            siteConfig = doc.data();
            console.log('📦 Datos crudos de Firebase:', siteConfig); // DEBUG
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        return false;
    }
}

// Renderizar todo el contenido dinámico
function renderDynamicContent() {
    if (!siteConfig) return;

    // LIMPIEZA FORZADA DE SOBRAS ANTERIORES
    // Si existe el logo de texto generado dinámicamente, eliminarlo
    const legacyLogoText = document.querySelector('.main-logo-text');
    if (legacyLogoText) legacyLogoText.remove();

    // Asegurar que el logo de imagen está visible
    const mainLogoImg = document.querySelector('.main-logo');
    if (mainLogoImg) mainLogoImg.style.display = 'block';

    updateSiteInfo();
    renderServicios();
    renderTestimonios();
    renderBlog();
    updateContactInfo();
    updateSocialLinks();
    updateSocialLinks();
    renderSobreMi(); // ← NUEVO: Renderizar sección Sobre Mí dinámica
    updateHoroscopoCardImages(); // ← NUEVO: Actualizar imágenes de cartas de horóscopo
    populateServiciosSelect(); // ← NUEVO: Poblar dropdown de servicios en modal
    updateModalWhatsAppLink(); // ← NUEVO: Actualizar enlace de WhatsApp en modal

    console.log('✅ App v2.0 - Logo Restaurado');
}

// Actualizar información general del sitio
function updateSiteInfo() {
    // Title tag
    document.title = `${siteConfig.siteName} - ${siteConfig.tagline}`;

    // Nav Logo - Actualizar texto header
    const navLogoFn = document.querySelector('.nav-logo span');
    if (navLogoFn) navLogoFn.textContent = siteConfig.siteName;

    // NOTA: Logo de portada (imagen) se mantiene intacto.

    // Hero Section
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) heroTitle.textContent = siteConfig.hero.title;

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) heroSubtitle.textContent = siteConfig.hero.subtitle;

    const heroImage = document.getElementById('home-horoscope-image');
    if (heroImage && siteConfig.hero && siteConfig.hero.horoscopeImage) {
        heroImage.src = siteConfig.hero.horoscopeImage;
    }
}

// Renderizar servicios dinámicamente
function renderServicios() {
    const serviciosGrid = document.querySelector('.servicios-grid');
    if (!serviciosGrid) return;

    // Validar que existan servicios
    if (!siteConfig || !siteConfig.servicios || !Array.isArray(siteConfig.servicios)) {
        console.warn('⚠️ No hay servicios configurados');
        return;
    }

    // Connect to footer Links
    const footerLinks = document.getElementById('footer-services-list');
    if (footerLinks) {
        footerLinks.innerHTML = siteConfig.servicios.map(servicio => `
            <li><a href="#servicios">${servicio.title}</a></li>
        `).join('');
    }

    serviciosGrid.innerHTML = siteConfig.servicios.map(servicio => `
        <div class="servicio-card glass-effect ${servicio.featured ? 'featured' : ''}">
            ${servicio.featured ? `<div class="featured-badge">${servicio.featuredText || 'Destacado'}</div>` : ''}
            <div class="servicio-icon">
                <i class="${servicio.icon || 'fas fa-star'}"></i>
            </div>
            <h3 class="servicio-title">${servicio.title || 'Servicio'}</h3>
            <p class="servicio-description">${servicio.description || ''}</p>
            <div class="servicio-features">
                <p><i class="fas fa-check"></i> ${servicio.duracion || 'Duración a consultar'}</p>
                ${(servicio.features && Array.isArray(servicio.features)) ? servicio.features.map(feature =>
        `<p><i class="fas fa-check"></i> ${feature}</p>`
    ).join('') : ''}
            </div>
            <div class="servicio-precio">${servicio.precio || '$0'}</div>
            <a href="#" class="btn btn-servicio reservar-btn">Reservar Ahora</a>
        </div>
    `).join('');

    // Re-attach event listeners to new buttons
    attachReservaListeners();
}

// Poblar select de servicios en modal de reserva
function populateServiciosSelect() {
    const servicioSelect = document.getElementById('servicio');
    if (!servicioSelect || !siteConfig || !siteConfig.servicios) return;

    // Mantener solo el placeholder
    servicioSelect.innerHTML = '<option value="">Selecciona un servicio</option>';

    // Agregar cada servicio desde config
    siteConfig.servicios.forEach(servicio => {
        const option = document.createElement('option');
        option.value = servicio.title.toLowerCase().replace(/\s+/g, '-');
        option.textContent = `${servicio.title} - ${servicio.precio}`;
        servicioSelect.appendChild(option);
    });

    console.log(`✅ ${siteConfig.servicios.length} servicios cargados en modal de reserva`);
}

// Renderizar testimonios dinámicamente
function renderTestimonios() {
    const testimoniosGrid = document.querySelector('.testimonios-grid');
    if (!testimoniosGrid) return;

    // Validar que existan testimonios
    if (!siteConfig || !siteConfig.testimonios || !Array.isArray(siteConfig.testimonios)) {
        console.warn('⚠️ No hay testimonios configurados');
        return;
    }

    // Filtrar solo testimonios con contenido real (no placeholders)
    const testimoniosReales = siteConfig.testimonios.filter(testimonio => {
        return testimonio.texto &&
            testimonio.texto.trim() !== '' &&
            !testimonio.texto.includes('Escribe aquí el testimonio') &&
            testimonio.nombre &&
            testimonio.nombre !== 'Nuevo Cliente';
    });

    testimoniosGrid.innerHTML = testimoniosReales.map(testimonio => `
        <div class="testimonio-card glass-effect">
            <div class="testimonio-rating">
                ${'<i class="fas fa-star"></i>'.repeat(testimonio.rating || 5)}
            </div>
            <p class="testimonio-text">"${testimonio.texto}"</p>
            <div class="testimonio-author">
                <div class="author-avatar">${testimonio.avatar || 'U'}</div>
                <div class="author-info">
                    <h4>${testimonio.nombre}</h4>
                    <p>${testimonio.ubicacion || 'Cliente'}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar blog dinámicamente
// Helper para YouTube ID
function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function renderBlog() {
    const blogGrid = document.querySelector('.blog-grid');
    if (!blogGrid) return;

    // Validar que existan posts de blog
    if (!siteConfig || !siteConfig.blog || !Array.isArray(siteConfig.blog)) {
        console.warn('⚠️ No hay posts de blog configurados');
        return;
    }

    blogGrid.innerHTML = siteConfig.blog.map((post, index) => {
        const videoId = getYouTubeId(post.youtubeUrl);
        // Thumbnail priority: Custom Image > YouTube > Default Placeholder
        let thumbUrl = 'images/blog-default.jpg';
        if (post.image) {
            thumbUrl = post.image;
        } else if (videoId) {
            thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }

        // Determinar si hay contenido extra para abrir modal
        const hasContent = post.content && post.content.length > 50;
        const clickAction = (videoId || hasContent) ? `onclick="openBlogModal(${index}); return false;"` : '';

        return `
        <article class="blog-card glass-effect" ${clickAction} style="cursor: pointer;">
            <div class="blog-image">
                <img src="${thumbUrl}" alt="${post.title || 'Blog Post'}" style="width:100%; height:200px; object-fit:cover; border-radius: 8px 8px 0 0;">
                ${videoId ? '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:3rem; color:white; text-shadow:0 0 10px black;"><i class="fas fa-play-circle"></i></div>' : ''}
                <div class="blog-category">Blog</div>
            </div>
            <div class="blog-content">
                <h3 class="blog-title">${post.title || 'Sin título'}</h3>
                <p class="blog-excerpt">${post.excerpt || 'Sin descripción'}</p>
                <div class="blog-meta">
                    <span><i class="far fa-calendar"></i> ${post.fecha || 'Fecha no disponible'}</span>
                </div>
                <a href="#" class="blog-link" ${clickAction}>Leer más <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `}).join('');
}

// Lógica del Modal de Blog
const blogModal = document.getElementById('modal-blog');

window.openBlogModal = function (postIndex) {
    if (!blogModal || !siteConfig.blog) return;

    // Obtener el post por índice
    const post = siteConfig.blog[postIndex];

    if (!post) {
        console.error('Post no encontrado en índice:', postIndex);
        return;
    }

    document.getElementById('blog-modal-title').textContent = post.title;
    document.getElementById('blog-modal-date').textContent = post.fecha;

    // Mostrar excerpt + contenido
    let contentHTML = '';
    if (post.excerpt) {
        contentHTML += `<p class="blog-excerpt-intro"><em>${post.excerpt}</em></p>`;
    }
    if (post.content) {
        contentHTML += post.content;
    }
    document.getElementById('blog-modal-content').innerHTML = contentHTML || post.excerpt || '<p>Contenido no disponible.</p>';

    const videoContainer = document.getElementById('blog-video-container');
    const imageHeader = document.getElementById('blog-image-header');

    const videoId = getYouTubeId(post.youtubeUrl);

    // Prioridad: Imagen > Video YouTube
    if (post.image) {
        // Si hay imagen, mostrar la imagen y ocultar el video
        videoContainer.style.display = 'none';
        videoContainer.innerHTML = '';
        imageHeader.style.display = 'block';
        document.getElementById('blog-modal-image').src = post.image;
    } else if (videoId) {
        // Si NO hay imagen pero SÍ hay video, mostrar el video
        videoContainer.style.display = 'block';
        imageHeader.style.display = 'none';
        videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        // No hay ni imagen ni video
        videoContainer.style.display = 'none';
        videoContainer.innerHTML = '';
        imageHeader.style.display = 'none';
    }

    blogModal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Cerrar modal blog
const blogCloseBtn = document.getElementById('modal-blog-close');
if (blogCloseBtn) {
    blogCloseBtn.addEventListener('click', () => {
        blogModal.classList.remove('active');
        document.body.style.overflow = '';
        const vc = document.getElementById('blog-video-container');
        if (vc) vc.innerHTML = ''; // Stop video
    });
}

// Actualizar información de contacto
function updateContactInfo() {
    // Update WhatsApp links (href)
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        const oldHref = link.href;
        link.href = `https://wa.me/${siteConfig.contact.whatsapp}`;

        // Si el texto del enlace es el número anterior, actualízalo también
        // Pero sé cuidadoso de no cambiar texto como "Chatear ahora"
        const cleanOldText = link.textContent.replace(/\D/g, ''); // Solo números
        const cleanNewNumber = siteConfig.contact.whatsapp.replace(/\D/g, '');

        // Si el texto visible se parece a un número de teléfono, actualízalo
        if (cleanOldText.length > 6 && !isNaN(cleanOldText)) {
            link.textContent = siteConfig.contact.whatsapp;
        }
    });

    // Update email
    document.querySelectorAll('a[href^="mailto"]').forEach(link => {
        link.href = `mailto:${siteConfig.contact.email}`;
        // Para email es seguro actualizar el texto si contiene @
        if (link.textContent.includes('@')) {
            link.textContent = siteConfig.contact.email;
        }
    });

    // Intentar buscar elementos específicos de contacto en el footer/contacto
    const contactSection = document.getElementById('contacto');
    if (contactSection) {
        // Buscar elementos 'p' que contengan números y reemplazarlos inteligentemente
        // O mejor aún, buscaremos por iconos si la estructura lo permite

        const phoneItems = Array.from(document.querySelectorAll('.contact-item i.fa-whatsapp, .contact-item i.fa-phone'));
        phoneItems.forEach(icon => {
            const parent = icon.parentElement;
            // Asumimos que el texto está en el padre o en un span hermano
            // Limpiaremos nodos de texto y pondremos el nuevo número
            // Esta es una estrategia segura para no borrar el icono
            let textNode = null;
            parent.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                    textNode = node;
                }
            });

            if (textNode) {
                textNode.textContent = ` ${siteConfig.contact.whatsapp}`;
            } else {
                // Si no hay nodo de texto directo, quizás es un enlace dentro
                const link = parent.querySelector('a');
                if (link) link.textContent = siteConfig.contact.whatsapp;
            }
        });
    }
}

// Actualizar links de redes sociales
// Actualizar links de redes sociales
function updateSocialLinks() {
    const socialLinks = document.querySelectorAll('.social-link');

    // Mapping icon classes to config keys
    const socialMap = {
        'fa-instagram': siteConfig.redesSociales.instagram,
        'fa-facebook': siteConfig.redesSociales.facebook,
        'fa-tiktok': siteConfig.redesSociales.tiktok,
        'fa-youtube': siteConfig.redesSociales.youtube
    };

    socialLinks.forEach(link => {
        const icon = link.querySelector('i');
        if (!icon) return;

        for (const [cls, url] of Object.entries(socialMap)) {
            if (icon.classList.contains(cls)) {
                if (url && url !== '#' && url.trim() !== '') {
                    link.href = url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";

                    // Remove duplicate listeners if any by cloning
                    const newLink = link.cloneNode(true);
                    if (link.parentNode) link.parentNode.replaceChild(newLink, link);
                } else {
                    // Validar si no hay link real, desactivar click
                    link.removeAttribute('href'); // Use removeAttribute to avoid any click behavior
                    link.style.opacity = "0.5";
                    link.style.cursor = "default";
                    link.style.pointerEvents = "none";
                }
                break;
            }
        }
    });
}

// Actualizar enlace de WhatsApp en modal
function updateModalWhatsAppLink() {
    if (!siteConfig || !siteConfig.contact) return;

    const whatsappBtn = document.getElementById('modal-whatsapp-btn');
    if (whatsappBtn && siteConfig.contact.whatsapp) {
        const phoneNumber = siteConfig.contact.whatsapp;
        whatsappBtn.href = `https://wa.me/${phoneNumber}`;
        console.log(`✅ Enlace de WhatsApp actualizado: ${phoneNumber}`);
    }
}

// Actualizar imágenes de tarjetas de horóscopo con URLs personalizadas
function updateHoroscopoCardImages() {
    if (!siteConfig || !siteConfig.horoscopos) return;

    // Mapeo de nombre de signo a nombre de archivo
    const fileMap = {
        "Aries": "aries", "Tauro": "taurus", "Géminis": "gemini", "Cáncer": "cancer",
        "Leo": "leo", "Virgo": "virgo", "Libra": "libra", "Escorpio": "scorpio",
        "Sagitario": "sagittarius", "Capricornio": "capricorn", "Acuario": "aquarius", "Piscis": "pisces"
    };

    // Obtener todas las tarjetas de horóscopo
    const cards = document.querySelectorAll('.horoscopo-card');

    cards.forEach(card => {
        const signoName = card.querySelector('.horoscopo-nombre');
        if (!signoName) return;

        // Obtener nombre del signo en formato title case
        const signo = signoName.textContent.trim();
        const signoKey = signo.charAt(0).toUpperCase() + signo.slice(1).toLowerCase();

        // Verificar si hay datos para este signo
        const data = siteConfig.horoscopos[signoKey];
        if (!data) return;

        // Si tiene imagen personalizada, usarla; sino, usar imagen estática por defecto
        if (data.image && data.image.trim() !== '') {
            card.style.backgroundImage = `url('${data.image}')`;
            // Agregar clase para overlay compacto
            card.classList.add('has-custom-image');
            console.log(`✅ Imagen personalizada cargada para ${signoKey}: ${data.image}`);
        } else {
            // Mantener imagen por defecto (ya está en el HTML)
            const baseName = fileMap[signoKey] || signoKey.toLowerCase();
            card.style.backgroundImage = `url('images/zodiac/${baseName}-card.png')`;
            // Remover clase de overlay compacto si existía
            card.classList.remove('has-custom-image');
        }
    });
}

// Renderizar sección Sobre Mí
function renderSobreMi() {
    const section = document.querySelector('.sobre-mi-content');
    if (!section || !siteConfig || !siteConfig.sobreMi) return;

    const sm = siteConfig.sobreMi;

    // 1. Imagen y Badge de Experiencia
    const imageContainer = section.querySelector('.sobre-mi-image');
    if (imageContainer) {
        // Remove existing placeholder icon if present
        const placeholder = imageContainer.querySelector('.image-placeholder');
        if (placeholder) placeholder.remove();

        // Check if image element exists, if not create it
        let img = imageContainer.querySelector('img.profile-dynamic');
        if (!img) {
            img = document.createElement('img');
            img.className = 'profile-dynamic';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '20px'; // Match CSS
            imageContainer.insertBefore(img, imageContainer.firstChild);
        }

        img.src = sm.image || 'images/bruja-mistica.png';
        img.alt = 'Perfil Tarotista';

        // Update Experience Badge
        const expNumber = section.querySelector('.experience-number');
        if (expNumber) expNumber.textContent = sm.experiencia || '15+';
    }

    // 2. Textos
    const intro = section.querySelector('.sobre-mi-intro');
    if (intro) intro.textContent = sm.intro || 'Bienvenido, soy tu guía en el camino de la iluminación espiritual.';

    const descriptions = section.querySelectorAll('.sobre-mi-description');
    if (descriptions.length >= 1) descriptions[0].textContent = sm.bio1 || '';
    if (descriptions.length >= 2) descriptions[1].textContent = sm.bio2 || '';

    // 3. Stats
    const nums = section.querySelectorAll('.stat-number');
    if (nums.length >= 2) {
        // Assuming order: [0] = Clientes, [1] = Rating
        nums[0].textContent = sm.clientes || '3,500+';
        nums[1].textContent = sm.rating || '4.9/5';
    }
}

// Attach event listeners to reserve buttons

// Attach event listeners to reserve buttons
function attachReservaListeners() {
    const reservarBtns = document.querySelectorAll('.reservar-btn');
    reservarBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            populateServiciosSelect(); // Llenar servicios al abrir modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
}

// Inicializar carga de configuración cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
} else {
    loadConfig();
}

// ============================================
// SPLASH SCREEN / PORTAL TRANSITION
// ============================================

const splashScreen = document.getElementById('splash-screen');
const btnEnter = document.getElementById('btn-enter');
const portalEffect = document.querySelector('.portal-effect');
const mainLogo = document.querySelector('.main-logo');

// Función para activar la transición del portal
function activatePortalTransition() {
    // Desactivar el botón
    btnEnter.disabled = true;

    // Hacer que el logo empiece a girar
    if (mainLogo) {
        mainLogo.classList.add('spinning');
    }

    // Crear partículas explosivas
    createExplosionParticles();

    // Activar efecto de portal
    portalEffect.classList.add('active');

    // Agregar sonido místico (opcional - comentado por ahora)
    // const audio = new Audio('audio/portal.mp3');
    // audio.play();

    // Transición del splash screen
    setTimeout(() => {
        splashScreen.classList.add('portal-transition');
    }, 500);

    // Ocultar splash screen completamente
    setTimeout(() => {
        splashScreen.classList.add('hide');
        setTimeout(() => {
            splashScreen.remove();
        }, 1000);
    }, 2000);
}

// Crear partículas explosivas al hacer click
function createExplosionParticles() {
    const btn = btnEnter.getBoundingClientRect();
    const centerX = btn.left + btn.width / 2;
    const centerY = btn.top + btn.height / 2;

    // Crear 50 partículas
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        const angle = (Math.PI * 2 * i) / 50;
        const velocity = 200 + Math.random() * 300;
        const size = 4 + Math.random() * 8;

        particle.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            background: ${getRandomColor()};
            border-radius: 50%;
            left: ${centerX}px;
            top: ${centerY}px;
            pointer-events: none;
            z-index: 10001;
            box-shadow: 0 0 ${size * 2}px ${getRandomColor()};
        `;

        document.body.appendChild(particle);

        // Animar partícula
        const moveX = Math.cos(angle) * velocity;
        const moveY = Math.sin(angle) * velocity;

        particle.animate([
            {
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${moveX}px, ${moveY}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.4, 0, 0.6, 1)'
        }).onfinish = () => particle.remove();
    }
}

// Obtener color aleatorio místico
function getRandomColor() {
    const colors = [
        'rgba(212, 175, 55, 0.8)',  // Dorado
        'rgba(139, 92, 246, 0.8)',  // Púrpura
        'rgba(236, 72, 153, 0.8)',  // Rosa
        'rgba(255, 255, 255, 0.8)'  // Blanco
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Event listener del botón
btnEnter.addEventListener('click', activatePortalTransition);

// También activar con Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !splashScreen.classList.contains('hide')) {
        activatePortalTransition();
    }
});

// Smooth scroll for navigation links
// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Critical Fix: If the link has been changed to an external URL (e.g. social links), ignore this handler
        if (!href.startsWith('#')) return;

        // Si estamos en modo "App Móvil" (<= 768px), interceptamos la navegación
        if (window.innerWidth <= 768) {
            e.preventDefault();
            // Buscar si el link corresponde a una sección válida
            const targetId = href.replace('#', '');
            const targetSection = document.getElementById(targetId);

            // Si existe la sección, cambiar a ella
            if (targetSection && (targetSection.tagName === 'SECTION' || targetSection.tagName === 'FOOTER')) {
                // Reutilizamos la lógica de cambio de pestaña
                // Creamos un objeto "fake" que simula ser un link del nav inferior
                // o llamamos directo a la lógica (mejor refactorizar si fuera necesario, 
                // pero aquí replicamos para simplicidad o llamamos activateBottomNav si existe el boton)

                // Opción A: Simular click en el botón de navegación inferior correspondiente
                const correspondingNavBtn = document.querySelector(`.bottom-nav-item[href="${href}"]`);
                if (correspondingNavBtn) {
                    activateBottomNav(correspondingNavBtn);
                } else {
                    // Opción B: Si no hay botón en el nav (ej. botón "Agendar Lectura"), cambio manual
                    document.querySelectorAll('section, footer').forEach(el => el.classList.remove('mobile-active'));
                    targetSection.classList.add('mobile-active');
                    targetSection.scrollTop = 0;

                    // Desactivar todos los botones del nav visualmente
                    document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active'));

                    // Caso especial: si vamos a Contacto, quizas activar el boton de 'Menú' como fallback o nada
                }
            } else if (href === '#') {
                // Links vacíos (ej. "Reservar Consulta") que abren modal
                // Dejar que el otro event listener lo maneje (no hacer nada aquí si no hay target)
            }
            return;
        }

        // Si es la carta de la bruja (#horoscopo), activar animación de cascada
        if (href === '#horoscopo' && this.classList.contains('card-1')) {
            e.preventDefault();
            activarCascadaCartas();
            return;
        }

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            if (navMenu) navMenu.classList.remove('active');
        }
    });
});

// Mobile menu toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function activateNavLink() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', activateNavLink);

// Header shadow on scroll
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
    } else {
        header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
    }
});

// Modal functionality
const modal = document.getElementById('modal-reserva');
const modalClose = document.getElementById('modal-close');
const reservarBtns = document.querySelectorAll('.reservar-btn, #btn-reserva-header, #btn-reserva-hero');

// Open modal
reservarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Close modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// Form submission
const reservaForm = document.getElementById('reserva-form');

reservaForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(reservaForm);
    const nombre = formData.get('nombre');
    const email = formData.get('email');
    const telefono = formData.get('telefono');
    const servicio = formData.get('servicio');
    const mensaje = formData.get('mensaje') || 'Sin mensaje adicional';

    // Create WhatsApp message
    const whatsappMessage = `Hola! Me gustaría reservar una consulta de tarot.
    
✦ *Datos de contacto:*
Nombre: ${nombre}
Email: ${email}
Teléfono: ${telefono}

✦ *Servicio solicitado:*
${servicio}

✦ *Mensaje:*
${mensaje}`;

    // URL encode the message
    const encodedMessage = encodeURIComponent(whatsappMessage);

    // WhatsApp number from config
    const whatsappNumber = siteConfig?.contact?.whatsapp || '1234567890';

    // Open WhatsApp
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');

    // Close modal and reset form
    closeModal();
    reservaForm.reset();

    // Show success message (optional)
    alert('¡Gracias! Te estamos redirigiendo a WhatsApp para completar tu reserva.');
});

// Floating stars animation
const starsContainer = document.getElementById('stars');

function createStars() {
    const numberOfStars = 50;

    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: white;
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.7 + 0.3};
            animation: twinkle ${Math.random() * 3 + 2}s infinite alternate;
        `;
        starsContainer.appendChild(star);
    }
}

createStars();

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.8s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.querySelectorAll('.servicio-card, .testimonio-card, .blog-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// Counter animation for stats
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 20);
}

// Animate stats when in view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                if (text.includes('+')) {
                    const number = parseInt(text.replace(/\D/g, ''));
                    stat.textContent = '0+';
                    animateCounter(stat, number);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

const sobreMiSection = document.querySelector('.sobre-mi');
if (sobreMiSection) {
    statsObserver.observe(sobreMiSection);
}

// Particle effect on mouse move (subtle)
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function createParticle() {
    if (Math.random() > 0.98) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: var(--color-accent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${mouseX}px;
            top: ${mouseY}px;
            opacity: 1;
            animation: particleFade 1s ease-out forwards;
        `;
        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}

// Add particle fade animation to document
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFade {
        to {
            opacity: 0;
            transform: translateY(-20px) scale(0.5);
        }
    }
`;
document.head.appendChild(style);

setInterval(createParticle, 50);

// Service card pre-selection from service parameter
const urlParams = new URLSearchParams(window.location.search);
const selectedService = urlParams.get('servicio');
if (selectedService) {
    const servicioSelect = document.getElementById('servicio');
    if (servicioSelect) {
        servicioSelect.value = selectedService;
    }
}

// Add loading animation on page load
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

console.log('🔮 Tarot Místico - Website loaded successfully');

// ============================================
// MODAL DE HORÓSCOPO
// ============================================

const horoscopoModal = document.getElementById('modal-horoscopo');
const horoscopoClose = document.getElementById('modal-horoscopo-close');
const horoscopoCards = document.querySelectorAll('.horoscopo-card');

// Abrir modal de horóscopo (usa datos de config.json)
horoscopoCards.forEach(card => {
    card.addEventListener('click', () => {
        if (!siteConfig || !siteConfig.horoscopos) {
            console.error('❌ Horóscopos no cargados desde config.json');
            return;
        }

        const signo = card.querySelector('.horoscopo-nombre').textContent.trim();
        const data = siteConfig.horoscopos[signo];

        if (data) {
            // Actualizar contenido del modal
            document.getElementById('horoscopo-symbol').textContent = data.symbol;
            document.getElementById('horoscopo-nombre').textContent = signo;
            document.getElementById('horoscopo-fechas').textContent = data.dates;
            document.getElementById('prediction-text').textContent = data.prediction;
            document.getElementById('amor-text').textContent = data.amor;
            document.getElementById('trabajo-text').textContent = data.trabajo;
            document.getElementById('finanzas-text').textContent = data.finanzas;
            document.getElementById('lucky-color').textContent = data.color;
            document.getElementById('lucky-number').textContent = data.numero;

            // Mostrar modal con animación
            horoscopoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

// Cerrar modal de horóscopo
function closeHoroscopoModal() {
    horoscopoModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Función global para abrir modal de horóscopo (llamada desde HTML onclick)
window.openHoroscopoModal = function (signo) {
    if (!siteConfig || !siteConfig.horoscopos) {
        console.error('❌ Horóscopos no cargados desde config.json');
        return;
    }

    const data = siteConfig.horoscopos[signo];

    if (data) {
        // Actualizar contenido del modal
        const symbolElement = document.getElementById('horoscopo-symbol');
        symbolElement.textContent = data.symbol || '';

        document.getElementById('horoscopo-nombre').textContent = signo;
        document.getElementById('horoscopo-fechas').textContent = data.dates || '';
        document.getElementById('prediction-text').textContent = data.prediction || 'Próximamente...';
        document.getElementById('amor-text').textContent = data.amor || 'Próximamente...';
        document.getElementById('trabajo-text').textContent = data.trabajo || 'Próximamente...';
        document.getElementById('finanzas-text').textContent = data.finanzas || 'Próximamente...';
        document.getElementById('lucky-color').textContent = data.color || 'Dorado';
        document.getElementById('lucky-number').textContent = data.numero || '7';

        // Actualizar imagen de fondo de la carta en el modal
        const tarotCard = document.querySelector('.tarot-card-front');

        // Mapeo de archivos estáticos
        const fileMap = {
            "Aries": "aries", "Tauro": "taurus", "Géminis": "gemini", "Cáncer": "cancer",
            "Leo": "leo", "Virgo": "virgo", "Libra": "libra", "Escorpio": "scorpio",
            "Sagitario": "sagittarius", "Capricornio": "capricorn", "Acuario": "aquarius", "Piscis": "pisces"
        };

        if (tarotCard) {
            // Usar imagen personalizada SI existe, sino usar imagen por defecto
            const baseName = fileMap[signo] || signo.toLowerCase();
            const imageUrl = (data.image && data.image.trim() !== '')
                ? data.image
                : `images/zodiac/${baseName}-card.png`;

            tarotCard.style.backgroundImage = `url('${imageUrl}')`;
            tarotCard.style.backgroundSize = 'cover';
            tarotCard.style.backgroundPosition = 'center';
            tarotCard.style.backgroundRepeat = 'no-repeat';
            console.log(`✅ Imagen mostrada en modal: ${imageUrl}`);
        }

        // Mostrar modal con animación
        horoscopoModal.classList.add('active');
        document.body.style.overflow = 'hidden';

    } else {
        console.error(`❌ No se encontraron datos para el signo: ${signo}`);
    }
};

horoscopoClose.addEventListener('click', closeHoroscopoModal);

// Cerrar modal al hacer click fuera
horoscopoModal.addEventListener('click', (e) => {
    if (e.target === horoscopoModal || e.target.classList.contains('horoscopo-overlay')) {
        closeHoroscopoModal();
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && horoscopoModal.classList.contains('active')) {
        closeHoroscopoModal();
    }
});

// ============================================
// CASCADA DE CARTAS ZODIACALES
// ============================================

const zodiacData = [
    { symbol: '♈', name: 'ARIES', constellation: '···*··*···' },
    { symbol: '♉', name: 'TAURO', constellation: '*··*··*·' },
    { symbol: '♊', name: 'GÉMINIS', constellation: '··*··*··*' },
    { symbol: '♋', name: 'CÁNCER', constellation: '*·*··*·*' },
    { symbol: '♌', name: 'LEO', constellation: '··*··*··' },
    { symbol: '♍', name: 'VIRGO', constellation: '*··*··*' },
    { symbol: '♎', name: 'LIBRA', constellation: '··*··*·' },
    { symbol: '♏', name: 'ESCORPIO', constellation: '*··*··*··' },
    { symbol: '♐', name: 'SAGITARIO', constellation: '··*··*··*·' },
    { symbol: '♑', name: 'CAPRICORNIO', constellation: '*··*··*·' },
    { symbol: '♒', name: 'ACUARIO', constellation: '··*··*··' },
    { symbol: '♓', name: 'PISCIS', constellation: '*··*··*' }
];

function activarCascadaCartas() {
    // Crear contenedor de animación
    const cascadeContainer = document.createElement('div');
    cascadeContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        pointer-events: none;
    `;
    document.body.appendChild(cascadeContainer);

    // Oscurecer la pantalla gradualmente
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        z-index: 9999;
        pointer-events: none;
        transition: background 0.5s ease-out;
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    }, 100);

    // Crear y animar cada carta
    zodiacData.forEach((zodiac, index) => {
        setTimeout(() => {
            createTarotCard(cascadeContainer, zodiac, index);
        }, index * 150); // Delay progresivo
    });

    // Después de que caigan todas las cartas, navegar a la sección
    setTimeout(() => {
        const horoscopoSection = document.getElementById('horoscopo'); // FIX: Define variable
        if (horoscopoSection) {
            horoscopoSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

        // Limpiar después de la navegación
        setTimeout(() => {
            cascadeContainer.remove();
            overlay.remove();
        }, 1500);
    }, zodiacData.length * 150 + 2000);
}

function createTarotCard(container, zodiac, index) {
    const card = document.createElement('div');
    const randomLeft = 10 + (index * 6.5) + (Math.random() * 3 - 1.5);

    // Obtener imagen dinámica desde la configuración si existe
    let backgroundStyle = 'background: linear-gradient(135deg, #3d2b5d 0%, #2d1b4d 100%);';

    // Normalizar nombre para buscar en config (Aries, Tauro...)
    const nameMap = {
        'ARIES': 'Aries', 'TAURO': 'Tauro', 'GÉMINIS': 'Géminis', 'CÁNCER': 'Cáncer',
        'LEO': 'Leo', 'VIRGO': 'Virgo', 'LIBRA': 'Libra', 'ESCORPIO': 'Escorpio',
        'SAGITARIO': 'Sagitario', 'CAPRICORNIO': 'Capricornio', 'ACUARIO': 'Acuario', 'PISCIS': 'Piscis'
    };

    const cleanName = nameMap[zodiac.name] || zodiac.name;
    const hasImage = siteConfig && siteConfig.horoscopos && siteConfig.horoscopos[cleanName] && siteConfig.horoscopos[cleanName].image;

    let innerContentHTML = '';

    if (hasImage) {
        const imageUrl = siteConfig.horoscopos[cleanName].image;
        backgroundStyle = `
            background-image: url('${imageUrl}'); 
            background-size: cover; 
            background-position: center;
        `;
        // Si hay imagen, NO generamos contenido interno (símbolos, texto)
        innerContentHTML = '';
    } else {
        // Si NO hay imagen, generamos el diseño por defecto con símbolos y texto
        innerContentHTML = `
           <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: center;">
                <!-- Fases lunares superiores -->
                <div style="
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    gap: 4px;
                    font-size: 10px;
                    color: #D4AF37;
                ">
                    <span>🌑</span><span>🌒</span><span>🌓</span><span>🌕</span><span>🌗</span>
                </div>
                
                <!-- Símbolo zodiacal principal -->
                <div style="
                    font-size: 70px;
                    color: #f0d068;
                    text-shadow: 0 0 25px rgba(212, 175, 55, 0.8);
                    margin: 10px 0;
                ">${zodiac.symbol}</div>
                
                <!-- Nombre del signo -->
                <div style="
                    font-family: 'Cinzel', serif;
                    font-size: 16px;
                    font-weight: 700;
                    color: #f0d068;
                    letter-spacing: 2px;
                    margin: 5px 0;
                ">${zodiac.name}</div>
                
                <!-- Constelación -->
                <div style="
                    font-size: 14px;
                    color: #D4AF37;
                    letter-spacing: 3px;
                    margin: 5px 0;
                ">${zodiac.constellation}</div>
                
                <!-- Fases lunares inferiores -->
                <div style="
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    gap: 4px;
                    font-size: 10px;
                    color: #D4AF37;
                ">
                    <span>🌗</span><span>🌕</span><span>🌓</span><span>🌒</span><span>🌑</span>
                </div>
            </div>
        `;
    }

    card.style.cssText = `
        position: absolute;
        width: 140px;
        height: 220px;
        left: ${randomLeft}%;
        top: -300px;
        transform-style: preserve-3d;
        animation: cardFallAnimation 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    `;

    // HTML de la carta tipo tarot
    card.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            ${backgroundStyle}
            border-radius: 12px;
            border: 3px solid #D4AF37;
            box-shadow: 0 10px 40px rgba(212, 175, 55, 0.6), inset 0 0 30px rgba(212, 175, 55, 0.1);
            position: relative;
            overflow: hidden;
        ">
            ${innerContentHTML}
            <!-- Estrellas decorativas en las esquinas -->
            <div style="position: absolute; top: 45px; left: 15px; color: #D4AF37; font-size: 12px;">✦</div>
            <div style="position: absolute; top: 45px; right: 15px; color: #D4AF37; font-size: 12px;">✦</div>
            <div style="position: absolute; bottom: 45px; left: 15px; color: #D4AF37; font-size: 12px;">✦</div>
            <div style="position: absolute; bottom: 45px; right: 15px; color: #D4AF37; font-size: 12px;">✦</div>
            
            <!-- Decoración superior -->
            <div style="position: absolute; top: 8px; left: 8px; width: 8px; height: 8px; border-radius: 50%; background: #D4AF37;"></div>
            <div style="position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #D4AF37;"></div>
            <div style="position: absolute; bottom: 8px; left: 8px; width: 8px; height: 8px; border-radius: 50%; background: #D4AF37;"></div>
            <div style="position: absolute; bottom: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #D4AF37;"></div>
        </div>
    `;

    container.appendChild(card);

    // Crear partículas doradas de rastro
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            createGoldenTrail(card, container);
        }, i * 100);
    }
}

function createGoldenTrail(card, container) {
    const rect = card.getBoundingClientRect();
    const particle = document.createElement('div');

    particle.style.cssText = `
        position: fixed;
        width: ${6 + Math.random() * 6}px;
        height: ${6 + Math.random() * 6}px;
        background: radial-gradient(circle, #D4AF37, #f0d068);
        border-radius: 50%;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        pointer-events: none;
        z-index: 9998;
        box-shadow: 0 0 20px #D4AF37;
    `;

    container.appendChild(particle);

    particle.animate([
        { opacity: 1, transform: 'scale(1) translateY(0)' },
        { opacity: 0, transform: 'scale(0) translateY(60px)' }
    ], {
        duration: 1000,
        easing: 'ease-out'
    }).onfinish = () => particle.remove();
}

// Agregar estilos de animación si no existen
if (!document.getElementById('cascade-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'cascade-animation-styles';
    style.textContent = `
        @keyframes cardFallAnimation {
            0% {
                transform: translateY(-300px) rotateX(180deg) rotateZ(${Math.random() * 90 - 45}deg) scale(0.5);
                opacity: 0;
            }
            60% {
                transform: translateY(55vh) rotateX(15deg) rotateZ(0deg) scale(1);
                opacity: 1;
            }
            100% {
                transform: translateY(50vh) rotateX(0) rotateZ(0) scale(1);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// REVIEW SYSTEM (PUBLIC) - RESTORED
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const reviewModal = document.getElementById('modal-review');
    const reviewBtn = document.getElementById('btn-dejar-resena');
    const reviewClose = document.getElementById('modal-review-close');
    const reviewForm = document.getElementById('review-form');

    if (reviewBtn && reviewModal) {
        reviewBtn.addEventListener('click', () => {
            reviewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (reviewClose) {
        reviewClose.addEventListener('click', () => {
            reviewModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Star Rating Interaction
    const starInputs = document.querySelectorAll('.star-rating-input i');
    const ratingValue = document.getElementById('review-rating');

    if (starInputs.length > 0 && ratingValue) {
        starInputs.forEach(star => {
            star.addEventListener('click', () => {
                const val = star.dataset.value;
                ratingValue.value = val;
                updateStars(val);
            });
        });

        function updateStars(val) {
            starInputs.forEach(star => {
                if (star.dataset.value <= val) {
                    star.classList.remove('far');
                    star.classList.add('fas'); // Solid
                } else {
                    star.classList.remove('fas');
                    star.classList.add('far'); // Outline
                }
            });
        }
        // Init stars
        updateStars(5);
    }

    // Handle Review Submit
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const formData = new FormData(reviewForm);
            const reviewData = {
                nombre: formData.get('nombre'),
                ubicacion: formData.get('ubicacion'),
                rating: parseInt(formData.get('rating')),
                texto: formData.get('texto'),
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            try {
                if (typeof firebase !== 'undefined') {
                    const db = firebase.firestore();
                    await db.collection('reviews').add(reviewData);

                    alert('¡Gracias por tu opinión! Tu reseña ha sido enviada y será publicada tras moderación. ✨');
                    reviewModal.classList.remove('active');
                    reviewForm.reset();
                } else {
                    throw new Error('Firebase no disponible');
                }
            } catch (error) {
                console.error('Error enviando reseña:', error);
                alert('Hubo un problema enviando tu reseña. Por favor intenta de nuevo.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                document.body.style.overflow = '';
            }
        });
    }
});

// ============================================
// MOBILE APP NAVIGATION LOGIC
// ============================================

function activateBottomNav(element) {
    if (!element) return;

    // 1. Visual Update
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');


    // 2. Logic for Mobile App Mode
    if (window.innerWidth <= 768) {
        // Prevent default link behavior handled by other listeners
        // (We rely on class removal/addition for visibility)

        const targetId = element.getAttribute('href').replace('#', '');

        // Hide all sections AND FOOTER
        document.querySelectorAll('section, footer').forEach(el => {
            el.classList.remove('mobile-active');
        });

        // Show target section or footer
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('mobile-active');
            targetSection.scrollTop = 0; // Reset scroll
        }

        // Special Case: "Contacto" might be the footer
        if (targetId === 'contacto') {
            const footer = document.querySelector('footer');
            if (footer) footer.classList.add('mobile-active');
        }
    }
}

// Initialize Mobile View
function initMobileAppMode() {
    if (window.innerWidth <= 768) {
        console.log('📱 Mobile App Mode Initialized');

        // Set default active section (Inicio)
        const homeSection = document.getElementById('inicio');
        if (homeSection) homeSection.classList.add('mobile-active');

        // Ensure footer is hidden initially
        const footer = document.querySelector('footer');
        if (footer) footer.classList.remove('mobile-active');

        // Set default active nav
        const homeNav = document.querySelector('.bottom-nav-item[href="#inicio"]');
        if (homeNav) homeNav.classList.add('active');
    }
}

// Run on load and resize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileAppMode);
} else {
    initMobileAppMode();
}

window.addEventListener('resize', () => {
    // Optional: handle dynamic resizing if user rotates device
    // Check if we just crossed the threshold
    if (window.innerWidth <= 768 && !document.querySelector('.mobile-active')) {
        initMobileAppMode();
    }
});

function renderSobreMi() {
    if (!siteConfig || !siteConfig.sobreMi) return;

    // Config Data
    const data = siteConfig.sobreMi;

    // Elements
    const imgElement = document.getElementById('sobre-mi-img-dynamic');
    const badgeNum = document.getElementById('exp-badge-number');
    const badgeText = document.getElementById('exp-badge-text');
    const subtitle = document.getElementById('sobre-mi-subtitle');
    const title = document.getElementById('sobre-mi-title');
    const desc = document.getElementById('sobre-mi-desc');
    const stat1Num = document.getElementById('stat-1-number');
    const stat1Label = document.getElementById('stat-1-label');
    const stat2Num = document.getElementById('stat-2-number');
    const stat2Label = document.getElementById('stat-2-label');

    // Mappings
    if (imgElement && data.image) imgElement.src = data.image;
    if (badgeNum && data.experience) badgeNum.textContent = data.experience;
    if (badgeText && data.experienceLabel) badgeText.innerHTML = data.experienceLabel.replace(/\n/g, '<br>'); // Handle newlines
    if (subtitle && data.subtitle) subtitle.textContent = data.subtitle;
    if (title && data.title) title.textContent = data.title;
    if (desc && data.description) desc.textContent = data.description;

    // Stats
    if (data.stats && Array.isArray(data.stats)) {
        if (data.stats[0]) {
            if (stat1Num) stat1Num.textContent = data.stats[0].number;
            if (stat1Label) stat1Label.textContent = data.stats[0].label;
        }
        if (data.stats[1]) {
            if (stat2Num) stat2Num.textContent = data.stats[1].number;
            if (stat2Label) stat2Label.textContent = data.stats[1].label;
        }
    }
}

