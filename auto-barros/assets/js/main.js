/**
 * Script Principal
 * Funcionalidades gerais do site
 */

document.addEventListener('DOMContentLoaded', function() {
    initScrollEffects();
    initAnimations();
});

// Efeitos de Scroll
function initScrollEffects() {
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (backToTop) {
            if (window.scrollY > 300) {
                backToTop.classList.remove('d-none');
            } else {
                backToTop.classList.add('d-none');
            }
        }
    });

    backToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Animações
function initAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    const elements = document.querySelectorAll('.card, .feature-card');
    elements.forEach(el => observer.observe(el));
}
