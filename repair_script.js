
const fs = require('fs');

try {
    // Read as buffer to avoid encoding crashes immediately, then convert to stringignoring errors if possible?
    // standard utf8 might fail if there's BOM or binary.
    const buffer = fs.readFileSync('script.js');
    // We expect the first part to be valid UTF8. The end might be garbage.
    let content = buffer.toString('utf8');

    // Split by lines to find the safe cut point.
    const lines = content.split(/\r?\n/);

    let cutIndex = -1;
    // Look for the end of cascadeParticles / styles injection
    // We know it ends with document.head.appendChild(style); }

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('document.head.appendChild(style);')) {
            // Check next line for }
            if (lines[i + 1] && lines[i + 1].trim() === '}') {
                cutIndex = i + 2;
                break;
            }
        }
    }

    if (cutIndex !== -1) {
        console.log(`Found cut point at line ${cutIndex}. Truncating and appending.`);
        const cleanLines = lines.slice(0, cutIndex);

        const reviewCode = `
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
`;
        const newContent = cleanLines.join('\n') + '\n' + reviewCode;
        fs.writeFileSync('script.js', newContent, 'utf8');
        console.log('script.js repaired successfully.');
    } else {
        console.error('Could not find the target code to cut at.');
        process.exit(1);
    }

} catch (e) {
    console.error('Error repairing script:', e);
    process.exit(1);
}
