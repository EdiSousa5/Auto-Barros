// Homepage Manager - Sistema Refatorado
// Gestor exclusivo para a página inicial com APENAS produtos em destaque

class HomepageManager {
    constructor() {
        this.products = [];
        this.isLoading = false;
        this.initialized = false;
        this.containerId = 'featured-products';
        
        console.log('🏠 HomepageManager inicializado');
    }

    // Inicializar homepage apenas se estivermos na página correta
    async init() {
        try {
            // Verificar se estamos numa página que precisa de produtos em destaque
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.log('ℹ️ Container de produtos em destaque não encontrado - não é página inicial');
                return;
            }

            if (this.initialized) {
                console.log('ℹ️ Homepage já inicializada');
                return;
            }

            console.log('🏠 Inicializando homepage com produtos em destaque...');
            await this.loadFeaturedProducts();
            this.initialized = true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar homepage:', error);
            this.showError('Erro ao carregar produtos em destaque');
        }
    }

    // Carregar APENAS os produtos em destaque (9 produtos)
    async loadFeaturedProducts() {
        if (this.isLoading) {
            console.log('⏳ Carregamento já em andamento...');
            return;
        }

        try {
            this.isLoading = true;
            this.showLoading();

            console.log('📱 A carregar produtos em destaque da API...');
            
            // Usar apenas o endpoint de produtos em destaque
            const featuredProducts = await apiRequest(urlArtigosDestaque, 'featured_products');
            
            if (!featuredProducts || !Array.isArray(featuredProducts)) {
                throw new Error('Dados de produtos em destaque inválidos');
            }

            // Limitar a 9 produtos conforme especificação
            this.products = featuredProducts.slice(0, CONFIG.HOMEPAGE_ITEMS);
            
            console.log(`✅ ${this.products.length} produtos em destaque carregados`);
            
            this.renderProducts();
            
        } catch (error) {
            console.error('❌ Erro ao carregar produtos em destaque:', error);
            this.showError('Não foi possível carregar os produtos em destaque');
        } finally {
            this.isLoading = false;
        }
    }

    // Renderizar os produtos em destaque
    renderProducts() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('❌ Container de produtos não encontrado');
            return;
        }

        if (!this.products || this.products.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        console.log(`🎨 Renderizando ${this.products.length} produtos em destaque`);

        const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
        
        container.innerHTML = `
            <div class="products-grid featured-grid">
                ${productsHTML}
            </div>
        `;

        // Adicionar event listeners para os produtos
        this.attachProductEvents();
    }

    // Criar card individual de produto - Design premium modernizado
    createProductCard(product) {
        // Usar os campos corretos da API conforme estrutura fornecida
        const imageUrl = this.getProductImageUrl(product);
        const productName = product.Descricao && product.Descricao.trim() ? product.Descricao : 'Produto sem nome';
        const productReference = product.Artigo && product.Artigo.trim() ? product.Artigo : '';
        const productBrand = product.NomeMarca && product.NomeMarca.trim() ? product.NomeMarca : '';
        const productModel = product.NomeModelo && product.NomeModelo.trim() ? product.NomeModelo : '';

        return `
            <div class="product-card featured-product" data-product-id="${product.Artigo}">
                <div class="product-badge">
                    <i class="fas fa-star"></i>
                </div>
                <div class="product-image">
                    <img src="${imageUrl}" 
                         alt="${productName}" 
                         loading="lazy"
                         onerror="if (!this.classList.contains('img-error')) { this.classList.add('img-error'); this.src='http://autobarrossede.ddns.net/api/Image/Image/132924/'; }">
                    <div class="product-overlay">
                        <button class="btn-view-product" data-product-id="${product.Artigo}">
                            <i class="fas fa-eye"></i>
                            Ver Detalhes
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${productName}</h3>
                    <div class="product-meta">
                        ${productReference ? `<div class="product-reference">Ref: ${productReference}</div>` : ''}
                        ${productBrand ? `<div class="product-brand">Marca: ${productBrand}</div>` : ''}
                        ${productModel ? `<div class="product-model">Modelo: ${productModel}</div>` : ''}
                    </div>
                    <button class="btn-ver-mais" data-product-id="${product.Artigo}">
                        <i class="fas fa-info-circle"></i>
                        Ver Mais
                    </button>
                </div>
            </div>
        `;
    }

    // Obter URL da imagem do produto usando dados da API
    getProductImageUrl(product) {
        // 1. Usar ImageUrl se disponível (URL completa da API)
        if (product.ImageUrl && product.ImageUrl !== 'undefined' && product.ImageUrl !== '') {
            return product.ImageUrl;
        }
        
        // 2. Construir URL usando o campo Imagem
        if (product.Imagem && product.Imagem !== 'undefined' && product.Imagem !== '') {
            return `http://autobarrossede.ddns.net/api/Image/Image/${product.Imagem}`;
        }
        
        // 3. Construir URL usando Artigo_Grupo se disponível
        if (product.Artigo_Grupo && product.Artigo_Grupo !== 'undefined' && product.Artigo_Grupo !== '') {
            return `http://autobarrossede.ddns.net/api/Image/Image/${product.Artigo_Grupo}/`;
        }
        
        // 4. Construir URL usando Artigo como último recurso
        if (product.Artigo && product.Artigo !== 'undefined' && product.Artigo !== '') {
            return `http://autobarrossede.ddns.net/api/Image/Image/${product.Artigo}/`;
        }
        
        // 5. Fallback para imagem padrão da API
        return 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
    }

    // Adicionar event listeners aos produtos
    attachProductEvents() {
        // Event listeners para o card inteiro (não só o botão)
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            
            // Adicionar cursor pointer ao card
            card.style.cursor = 'pointer';
            
            // Event listener para clicar em qualquer parte do card
            card.addEventListener('click', (e) => {
                // Prevenir propagação se o clique for no botão (evitar duplo clique)
                if (e.target.closest('.btn-view-product') || e.target.closest('.btn-ver-mais')) {
                    e.stopPropagation();
                    return;
                }
                
                this.showProductModal(productId);
            });
        });

        // Manter os event listeners dos botões para compatibilidade
        document.querySelectorAll('.btn-view-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevenir duplo clique
                const productId = btn.dataset.productId;
                this.showProductModal(productId);
            });
        });

        // Event listeners para o botão Ver Mais
        document.querySelectorAll('.btn-ver-mais').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevenir duplo clique
                const productId = btn.dataset.productId;
                this.showProductModal(productId);
            });
        });
    }

    // Mostrar modal do produto
    showProductModal(productId) {
        const product = this.products.find(p => p.Artigo == productId);
        if (!product) {
            console.error('❌ Produto não encontrado:', productId);
            return;
        }

        // Obter o modal HTML estático
        const modal = document.getElementById('productModal');
        if (!modal) {
            console.error('❌ Modal HTML não encontrado');
            return;
        }

        // Atualizar conteúdo do modal com dados do produto
        this.updateModalContent(product);

        // Mostrar modal sem interferir no scroll da página
        document.body.classList.add('modal-open');
        modal.classList.add('show');

        // Configurar event listeners
        this.setupModalEvents(modal, product);
    }

    // Atualizar conteúdo do modal
    updateModalContent(product) {
        console.log('📝 Atualizando modal com produto:', product);

        // Usar os dados corretos da API
        const productTitle = product.Descricao || 'Produto sem nome';
        const productReference = product.Artigo || '';
        const productDescription = product.Descricao || '';
        const productBrand = product.NomeMarca || '';
        const productModel = product.NomeModelo || '';
        const imageUrl = this.getProductImageUrl(product);

        // Atualizar título
        const titleElement = document.getElementById('modalProductTitle');
        if (titleElement) {
            titleElement.textContent = productTitle;
        }

        // Atualizar imagem
        const imageElement = document.getElementById('modalProductImage');
        if (imageElement) {
            imageElement.src = imageUrl;
            imageElement.alt = productTitle;
            imageElement.onerror = function() {
                this.src = 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
                this.onerror = null;
            };
        }

        // Atualizar referência
        const referenceElement = document.getElementById('modalProductReference');
        if (productReference && referenceElement) {
            referenceElement.style.display = 'block';
            const refValueElement = referenceElement.querySelector('.detail-value');
            if (refValueElement) refValueElement.textContent = productReference;
        } else if (referenceElement) {
            referenceElement.style.display = 'none';
        }

        // Atualizar marca
        const brandElement = document.getElementById('modalProductBrand');
        if (productBrand && brandElement) {
            brandElement.style.display = 'block';
            const brandValueElement = brandElement.querySelector('.detail-value');
            if (brandValueElement) brandValueElement.textContent = productBrand;
        } else if (brandElement) {
            brandElement.style.display = 'none';
        }

        // Atualizar modelo
        const modelElement = document.getElementById('modalProductModel');
        if (productModel && modelElement) {
            modelElement.style.display = 'block';
            const modelValueElement = modelElement.querySelector('.detail-value');
            if (modelValueElement) modelValueElement.textContent = productModel;
        } else if (modelElement) {
            modelElement.style.display = 'none';
        }

        // Atualizar descrição (esconder por enquanto)
        const descriptionElement = document.getElementById('modalProductDescription');
        if (descriptionElement) {
            descriptionElement.style.display = 'none';
        }
        
        console.log('✅ Modal atualizado com sucesso');
    }

    // Configurar event listeners do modal
    setupModalEvents(modal, product) {
        // Resetar scroll do modal para o topo
        const modalBody = modal.querySelector('.modal-info-section-premium');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
        
        // Botão de fechar
        const closeBtn = modal.querySelector('.modal-close-premium');
        const backdrop = modal.querySelector('.modal-backdrop');
        const modalCard = modal.querySelector('.modal-card');
        
        // Função para fechar modal sem interferir no scroll da página
        const closeModal = () => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // Reset scroll position do modal para próxima abertura
            setTimeout(() => {
                const modalContent = modal.querySelector('.modal-body-premium');
                if (modalContent) {
                    modalContent.scrollTop = 0;
                }
            }, 50);
        };

        // Event listeners
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        if (backdrop) {
            backdrop.addEventListener('click', closeModal);
        }

        // Prevenir fechamento ao clicar no conteúdo
        if (modalCard) {
            modalCard.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Fechar com ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Configurar botões de contacto
        const contactEmailBtn = document.getElementById('modalContactEmail');
        const contactPhoneBtn = document.getElementById('modalContactPhone');
        
        if (contactEmailBtn) {
            contactEmailBtn.onclick = () => {
                // Fechar modal primeiro
                closeModal();
                // Aguardar animação de fechamento e navegar para contactos
                setTimeout(() => {
                    document.getElementById('contactos').scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 600);
            };
        }

        if (contactPhoneBtn) {
            contactPhoneBtn.onclick = () => {
                window.open('tel:+351227419201', '_self');
            };
        }
        
        // Configurar funcionalidade de zoom na imagem
        this.setupImageZoom(modal, product);
    }

    // Configurar funcionalidade de zoom na imagem (simplificada)
    setupImageZoom(modal, product) {
        // Verificar se estamos em mobile
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Em mobile, desabilitar completamente o zoom
            const imageContainerLarge = modal.querySelector('.image-container-large');
            const imageContainer = modal.querySelector('.image-container-premium');
            
            if (imageContainerLarge) {
                imageContainerLarge.style.cursor = 'default';
                imageContainerLarge.style.pointerEvents = 'none';
            }
            
            if (imageContainer) {
                imageContainer.style.cursor = 'default';
                imageContainer.style.pointerEvents = 'none';
            }
            
            return; // Sair da função para mobile
        }
        
        // Configurar zoom para .image-container-large (novo modal layout) - apenas desktop
        const imageContainerLarge = modal.querySelector('.image-container-large');
        
        if (imageContainerLarge) {
            const clickHandler = () => {
                const imageElement = modal.querySelector('#modalProductImage');
                const imageSrc = imageElement ? imageElement.src : this.getProductImageUrl(product);
                const productName = product.Descricao || 'Produto';
                console.log('Abrindo zoom da imagem:', productName);
                this.showSimpleImageModal(imageSrc, productName);
            };
            
            imageContainerLarge.addEventListener('click', clickHandler);
            imageContainerLarge.style.cursor = 'pointer';
        }

        // Configurar botão de zoom específico - apenas desktop
        const zoomBtn = modal.querySelector('#imageZoomBtn');
        if (zoomBtn) {
            zoomBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const imageElement = modal.querySelector('#modalProductImage');
                const imageSrc = imageElement ? imageElement.src : this.getProductImageUrl(product);
                const productName = product.Descricao || 'Produto';
                console.log('Abrindo zoom via botão:', productName);
                this.showSimpleImageModal(imageSrc, productName);
            });
        }

        // Compatibilidade com layout antigo - apenas desktop
        const imageContainer = modal.querySelector('.image-container-premium');
        if (imageContainer) {
            const clickHandler = () => {
                const imageElement = modal.querySelector('#modalProductImage');
                const imageSrc = imageElement ? imageElement.src : this.getProductImageUrl(product);
                const productName = product.Descricao || 'Produto';
                console.log('Abrindo zoom da imagem:', productName);
                this.showSimpleImageModal(imageSrc, productName);
            };
            
            imageContainer.addEventListener('click', clickHandler);
            imageContainer.style.cursor = 'pointer';
        }
    }

    // Mostrar modal de imagem simples (sem controles complexos)
    showSimpleImageModal(imageSrc, productName = 'Produto') {
        // Remover modal de zoom existente se houver
        const existingZoomModal = document.getElementById('imageZoomModal');
        if (existingZoomModal) {
            existingZoomModal.remove();
        }

        // Criar modal de zoom simples
        const zoomModal = document.createElement('div');
        zoomModal.id = 'imageZoomModal';
        zoomModal.className = 'image-zoom-modal';
        zoomModal.innerHTML = `
            <div class="zoom-backdrop"></div>
            <div class="zoom-container-simple">
                <button class="zoom-close-btn">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${imageSrc}" alt="${productName}" class="zoomed-image-simple">
            </div>
        `;

        document.body.appendChild(zoomModal);

        // Mostrar modal com animação
        setTimeout(() => {
            zoomModal.classList.add('show');
        }, 10);

        // Event listeners para fechar
        const closeBtn = zoomModal.querySelector('.zoom-close-btn');
        const backdrop = zoomModal.querySelector('.zoom-backdrop');

        const closeZoomModal = () => {
            zoomModal.classList.remove('show');
            setTimeout(() => {
                if (zoomModal.parentNode) {
                    zoomModal.remove();
                }
            }, 300);
        };

        closeBtn.addEventListener('click', closeZoomModal);
        backdrop.addEventListener('click', closeZoomModal);

        // Fechar com ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeZoomModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // Mostrar modal de imagem ampliada com funcionalidade de zoom
    showImageModal(imageSrc, productName = 'Produto') {
        // Remover modal existente se houver
        const existingZoomModal = document.getElementById('imageZoomModal');
        if (existingZoomModal) {
            existingZoomModal.remove();
        }

        // Criar novo modal de zoom
        const zoomModal = document.createElement('div');
        zoomModal.id = 'imageZoomModal';
        zoomModal.className = 'image-zoom-modal';
        zoomModal.innerHTML = `
            <div class="zoom-backdrop"></div>
            <div class="zoom-container">
                <div class="zoom-header">
                    <h3>${productName}</h3>
                    <button class="zoom-close-btn" onclick="closeImageZoom()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="zoom-image-container">
                    <img id="zoomedImage" src="${imageSrc}" alt="${productName}" class="zoomed-image">
                    <div class="zoom-controls">
                        <button class="zoom-btn-control" id="zoomInBtn">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="zoom-btn-control" id="zoomOutBtn">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <button class="zoom-btn-control" id="zoomResetBtn">
                            <i class="fas fa-expand-arrows-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(zoomModal);

        // Configurar funcionalidade de zoom
        this.setupZoomControls(zoomModal);

        // Mostrar com animação
        setTimeout(() => {
            zoomModal.classList.add('show');
        }, 10);

        // Event listeners para fechar
        const backdrop = zoomModal.querySelector('.zoom-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.closeImageZoom();
            });
        }

        // Fechar com ESC
        const handleEscapeZoom = (e) => {
            if (e.key === 'Escape') {
                this.closeImageZoom();
                document.removeEventListener('keydown', handleEscapeZoom);
            }
        };
        document.addEventListener('keydown', handleEscapeZoom);
    }

    // Configurar controles de zoom
    setupZoomControls(zoomModal) {
        const zoomedImage = zoomModal.querySelector('#zoomedImage');
        const zoomInBtn = zoomModal.querySelector('#zoomInBtn');
        const zoomOutBtn = zoomModal.querySelector('#zoomOutBtn');
        const zoomResetBtn = zoomModal.querySelector('#zoomResetBtn');
        
        let currentZoom = 1;
        const minZoom = 0.5;
        const maxZoom = 3;
        const zoomStep = 0.25;
        
        const updateZoom = (newZoom) => {
            currentZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
            zoomedImage.style.transform = `scale(${currentZoom})`;
            
            // Atualizar estado dos botões
            zoomInBtn.disabled = currentZoom >= maxZoom;
            zoomOutBtn.disabled = currentZoom <= minZoom;
        };
        
        // Event listeners para os controles
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                updateZoom(currentZoom + zoomStep);
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                updateZoom(currentZoom - zoomStep);
            });
        }
        
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => {
                updateZoom(1);
            });
        }
        
        // Scroll wheel para zoom
        zoomedImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
            updateZoom(currentZoom + delta);
        });
        
        // Inicializar zoom
        updateZoom(1);
    }

    // Fechar modal de zoom
    closeImageZoom() {
        const zoomModal = document.getElementById('imageZoomModal');
        if (zoomModal) {
            zoomModal.classList.remove('show');
            setTimeout(() => {
                zoomModal.remove();
            }, 300);
        }
    }

    // Mostrar indicador de carregamento
    showLoading() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>A carregar produtos em destaque...</p>
            </div>
        `;
    }

    // Mostrar mensagem de erro
    showError(message) {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h3>Erro</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="homepageManager.loadFeaturedProducts()">
                    Tentar novamente
                </button>
            </div>
        `;
    }

    // HTML para quando não há produtos
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>Nenhum produto em destaque</h3>
                <p>Não há produtos em destaque disponíveis no momento.</p>
            </div>
        `;
    }

    // Refrescar produtos
    async refresh() {
        console.log('🔄 Atualizando produtos em destaque...');
        clearApiCache(); // Limpar cache para forçar nova requisição
        await this.loadFeaturedProducts();
    }
}

// Inicializar gestor da homepage globalmente
let homepageManager;

// Aguardar DOM estar pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomepage);
} else {
    initHomepage();
}

function initHomepage() {
    homepageManager = new HomepageManager();
    homepageManager.init();
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.HomepageManager = HomepageManager;
    window.homepageManager = homepageManager;
}

// Função global para fechar modal de zoom (chamada pelo botão HTML)
function closeImageZoom() {
    const zoomModal = document.getElementById('imageZoomModal');
    if (zoomModal) {
        zoomModal.classList.remove('show');
        setTimeout(() => {
            zoomModal.remove();
        }, 300);
    }
}

// Efeito Parallax sutil para elementos decorativos
function initializeParallaxEffect() {
    const decorations = document.querySelectorAll('.hero-decorations > div');
    
    if (decorations.length === 0) return;
    
    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        decorations.forEach((decoration, index) => {
            const speed = (index + 1) * 0.02;
            const moveX = (clientX - centerX) * speed;
            const moveY = (clientY - centerY) * speed;
            
            decoration.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });
}

// Animações de fade-in quando elementos entram na viewport
function initializeFadeInAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = '0s';
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.stat, .feature-item, .floating-card').forEach(el => {
        observer.observe(el);
    });
}

// Inicializar efeitos na homepage
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na homepage
    if (document.querySelector('.hero-section')) {
        // Inicializar efeito parallax
        initializeParallaxEffect();
        
        // Inicializar animações fade-in
        initializeFadeInAnimations();
    }
});
