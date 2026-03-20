/**
 * Scroll suave para âncoras - com delay para aguardar carregamento da página
 */
document.addEventListener('DOMContentLoaded', function() {
    // Interceptar cliques em links de âncora
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Ignorar se for apenas #
            if (href === '#') return;
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            
            // Função para fazer scroll para o elemento
            const scrollToTarget = () => {
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Calcular offset da navbar sticky
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                    const headerTopHeight = document.querySelector('.header-top')?.offsetHeight || 0;
                    const totalOffset = navbarHeight + headerTopHeight + 20;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - totalOffset;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Fechar menu mobile se estiver aberto
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                            toggle: false
                        });
                        bsCollapse.hide();
                    }
                }
            };
            
            // Aguardar um tempo para a página carregar completamente
            // Usar requestAnimationFrame para garantir que o DOM está pronto
            setTimeout(() => {
                requestAnimationFrame(() => {
                    scrollToTarget();
                });
            }, 500); // 500ms de delay para aguardar imagens e conteúdo carregarem
        });
    });
    
    // Se a URL já tem hash quando a página carrega, fazer scroll após carregamento completo
    if (window.location.hash) {
        const hash = window.location.hash;
        window.addEventListener('load', function() {
            setTimeout(() => {
                const targetElement = document.getElementById(hash.substring(1));
                if (targetElement) {
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                    const headerTopHeight = document.querySelector('.header-top')?.offsetHeight || 0;
                    const totalOffset = navbarHeight + headerTopHeight + 20;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - totalOffset;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 800); // Maior delay para quando a página carrega pela primeira vez
        });
    }
});
