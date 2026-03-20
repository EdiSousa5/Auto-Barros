/**
 * Gestão do Catálogo de Produtos
 */

class CatalogManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 8; // 2 linhas x 4 colunas
        this.currentMarca = null;
        this.artigos = [];
        this.marcas = [];
        this.isLoading = false;
        this.loadingProgress = 0;
    }

    async init() {
        try {
            // Start loading screen
            this.updateLoadingProgress(10, 'A carregar marcas...');
            
            await this.loadMarcas();
            this.updateLoadingProgress(40, 'Marcas carregadas...');
            
            await this.loadArtigosDestaque();
            this.updateLoadingProgress(80, 'Artigos carregados...');
            
            this.setupEventListeners();
            this.updateLoadingProgress(100, 'Concluído!');
            
            // Hide loading screen
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 300);
        } catch (error) {
            console.error('Erro ao inicializar catálogo:', error);
            this.showError('Erro ao carregar catálogo');
            this.hideLoadingScreen();
        }
    }

    updateLoadingProgress(percent, message) {
        const progressBar = document.getElementById('loading-progress-bar');
        const statusText = document.getElementById('loading-status');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        if (statusText) {
            statusText.textContent = message || `${percent}%`;
        }
        this.loadingProgress = percent;
    }

    hideLoadingScreen() {
        const overlay = document.getElementById('catalog-fullpage-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }
    }

    async loadMarcas() {
        try {
            this.marcas = await api.getMarcas();
            this.renderMarcas();
        } catch (error) {
            console.error('Erro ao carregar marcas:', error);
        }
    }

    async loadArtigosDestaque() {
        try {
            // Remover active de todos os botões (desktop e mobile)
            document.querySelectorAll('#families-list .list-group-item, #families-list-mobile .list-group-item').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Adicionar active ao botão de destaque (desktop e mobile)
            document.querySelectorAll('[data-marca-id="destaque"]').forEach(btn => {
                btn.classList.add('active');
            });
            
            // Fechar collapse mobile após selecionar
            const mobileCollapse = document.getElementById('mobileFiltersCollapse');
            if (mobileCollapse && mobileCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(mobileCollapse, { toggle: true });
            }
            
            this.setLoading(true);
            this.artigos = await api.getArtigosDestaque();
            this.currentMarca = null;
            this.currentPage = 1;
            this.renderArtigos();
            this.updateTitle('Artigos em Destaque');
        } catch (error) {
            console.error('Erro ao carregar artigos:', error);
            this.showError('Erro ao carregar artigos');
        } finally {
            this.setLoading(false);
        }
    }

    async loadArtigosPorMarca(marcaId, marcaNome) {
        try {
            // Google Analytics - Rastrear filtro por família/marca
            if (typeof gtag !== 'undefined') {
                gtag('event', 'filter_catalog', {
                    'event_category': 'Catálogo',
                    'event_label': marcaNome,
                    'brand_id': marcaId
                });
            }
            
            // Remover active de todos os botões (desktop e mobile)
            document.querySelectorAll('#families-list .list-group-item, #families-list-mobile .list-group-item').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Adicionar active ao botão clicado (desktop e mobile)
            document.querySelectorAll(`[data-marca-id="${marcaId}"]`).forEach(btn => {
                btn.classList.add('active');
            });
            
            // Fechar collapse mobile após selecionar
            const mobileCollapse = document.getElementById('mobileFiltersCollapse');
            if (mobileCollapse && mobileCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(mobileCollapse, { toggle: true });
            }
            
            this.setLoading(true);
            this.artigos = await api.getArtigosPorMarca(marcaId);
            this.currentMarca = { ID: marcaId, Descricao: marcaNome };
            this.currentPage = 1;
            this.renderArtigos();
            this.updateTitle(`Catálogo - ${marcaNome}`);
        } catch (error) {
            console.error('Erro ao carregar artigos:', error);
            this.showError('Erro ao carregar artigos');
        } finally {
            this.setLoading(false);
        }
    }

    async searchArtigos(termo) {
        if (!termo || termo.length < 3) {
            this.showNotification('Digite pelo menos 3 caracteres para pesquisar', 'warning');
            return;
        }

        try {
            // Google Analytics - Rastrear pesquisa
            if (typeof gtag !== 'undefined') {
                gtag('event', 'search', {
                    'search_term': termo
                });
            }
            
            // Limpar seleção de família em ambas as listas
            document.querySelectorAll('#families-list .list-group-item, #families-list-mobile .list-group-item').forEach(btn => {
                btn.classList.remove('active');
            });
            
            this.setLoading(true);
            this.artigos = await api.searchArtigos(termo);
            this.currentMarca = null;
            this.currentPage = 1;
            this.renderArtigos();
            this.updateTitle(`Pesquisa: ${termo}`);
        } catch (error) {
            console.error('Erro ao pesquisar:', error);
            this.showError('Erro ao pesquisar artigos');
        } finally {
            this.setLoading(false);
        }
    }

    renderMarcas() {
        const familiesList = document.getElementById('families-list');
        const familiesListMobile = document.getElementById('families-list-mobile');

        // Adicionar opção "Artigos em Destaque" no início
        let html = `
            <button class="list-group-item list-group-item-action active" 
                    data-marca-id="destaque"
                    onclick="catalogManager.loadArtigosDestaque(); return false;">
                <i class="fas fa-star me-2 text-warning"></i>
                Artigos em Destaque
                <i class="fas fa-chevron-right float-end"></i>
            </button>
        `;

        html += this.marcas.map(marca => {
            const marcaId = marca.Id || marca.ID;
            const marcaNome = marca.Nome || marca.Descricao;
            return `
                <button class="list-group-item list-group-item-action" 
                        data-marca-id="${marcaId}"
                        onclick="catalogManager.loadArtigosPorMarca('${marcaId}', '${marcaNome}'); return false;">
                    ${marcaNome}
                    <i class="fas fa-chevron-right float-end"></i>
                </button>
            `;
        }).join('');
        
        // Renderizar em ambas as listas (desktop e mobile)
        if (familiesList) familiesList.innerHTML = html;
        if (familiesListMobile) familiesListMobile.innerHTML = html;
    }

    renderArtigos() {
        const catalogGrid = document.querySelector('.catalog-grid');
        if (!catalogGrid) return;

        if (!this.artigos || this.artigos.length === 0) {
            catalogGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <i class="fas fa-search fa-3x mb-3 d-block"></i>
                        <h5>Nenhum artigo encontrado</h5>
                        <p>Tente ajustar os filtros ou termo de pesquisa.</p>
                    </div>
                </div>
            `;
            this.updatePagination();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const artigosPage = this.artigos.slice(startIndex, endIndex);

        catalogGrid.innerHTML = artigosPage.map(artigo => this.createArtigoCard(artigo)).join('');
        this.updatePagination();
    }

    createArtigoCard(artigo) {
        const imageUrl = this.getProductImageUrl(artigo);
        const defaultImg = 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
        const artigoData = JSON.stringify(artigo).replace(/"/g, '&quot;');
        
        return `
            <div class="col">
                <div class="card product-card h-100" onclick='catalogManager.showProductModal(${artigoData})'>
                    <div class="product-image">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             alt="${artigo.Descricao || 'Produto'}" 
                             loading="lazy" 
                             onerror="if (!this.classList.contains('img-error')) { this.classList.add('img-error'); this.src='${defaultImg}'; }">
                        <div class="product-overlay">
                            <button class="btn btn-view-product" onclick='event.stopPropagation(); catalogManager.showProductModal(${artigoData})'>
                                <i class="fas fa-eye"></i>
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        ${artigo.NomeMarca ? `<div class="mb-2"><span class="badge bg-primary">${artigo.NomeMarca}</span></div>` : ''}
                        <h6 class="card-title">${artigo.Descricao || 'Sem descrição'}</h6>
                        <p class="card-text small text-muted">
                            ${artigo.Artigo ? `<strong>Ref:</strong> ${artigo.Artigo}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    getProductImageUrl(product) {
        if (product.ImageUrl && product.ImageUrl !== 'undefined' && product.ImageUrl !== '') {
            return product.ImageUrl;
        }
        
        if (product.Imagem && product.Imagem !== 'undefined' && product.Imagem !== '') {
            return `http://autobarrossede.ddns.net/api/Image/Image/${product.Imagem}/`;
        }
        
        if (product.Artigo_Grupo && product.Artigo_Grupo !== 'undefined' && product.Artigo_Grupo !== '') {
            return `http://autobarrossede.ddns.net/api/Image/Image/${product.Artigo_Grupo}/`;
        }
        
        if (product.Artigo && product.Artigo !== 'undefined' && product.Artigo !== '') {
            return `http://autobarrossede.ddns.net/api/Image/Image/${product.Artigo}/`;
        }
        
        return 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
    }

    showProductModal(product) {
        // Google Analytics - Rastrear visualização de produto no catálogo
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_item', {
                'event_category': 'Catálogo',
                'event_label': product.Descricao || 'Sem descrição',
                'product_id': product.Artigo || 'N/A',
                'product_brand': product.NomeMarca || 'N/A'
            });
        }
        
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        const defaultImg = 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
        
        // Preencher dados no modal
        document.getElementById('modalProductTitle').textContent = product.Descricao || 'Produto';
        const imgElement = document.getElementById('modalProductImage');
        imgElement.src = this.getProductImageUrl(product);
        imgElement.alt = product.Descricao || 'Produto';
        imgElement.onerror = function() { this.onerror=null; this.src=defaultImg; };
        
        // Referência
        const refElement = document.getElementById('modalProductReference');
        if (product.Artigo) {
            refElement.style.display = 'block';
            refElement.querySelector('.ref-code').textContent = product.Artigo;
        } else {
            refElement.style.display = 'none';
        }
        
        // Marca
        const brandElement = document.getElementById('modalProductBrand');
        if (product.NomeMarca) {
            brandElement.style.display = 'block';
            brandElement.querySelector('.detail-value').textContent = product.NomeMarca;
        } else {
            brandElement.style.display = 'none';
        }
        
        // Modelo
        const modelElement = document.getElementById('modalProductModel');
        if (product.NomeModelo) {
            modelElement.style.display = 'block';
            modelElement.querySelector('.detail-value').textContent = product.NomeModelo;
        } else {
            modelElement.style.display = 'none';
        }
        
        // Botão de contacto
        const contactBtn = document.getElementById('modalContactEmail');
        contactBtn.onclick = () => {
            modal.hide();
            setTimeout(() => {
                window.location.href = 'index.html#contactos';
            }, 300);
        };
        
        modal.show();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.artigos.length / this.itemsPerPage);
        const pagination = document.querySelector('.catalog-pagination');
        
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = '';

        const createPageButton = (pageNumber, extraClass = '') => {
            const classNames = ['pagination-btn'];
            if (extraClass) classNames.push(extraClass);
            if (pageNumber === this.currentPage) classNames.push('active');

            return `
                <button class="${classNames.join(' ')}" 
                        onclick="catalogManager.goToPage(${pageNumber}); return false;"
                        title="Ir para página ${pageNumber}">
                    ${pageNumber}
                </button>
            `;
        };

        const addEllipsis = () => {
            return '<span class="pagination-ellipsis">...</span>';
        };

        let html = `
            <button class="pagination-btn" 
                    onclick="catalogManager.goToPage(${this.currentPage - 1}); return false;"
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    title="Página anterior">
                ‹
            </button>
        `;

        if (totalPages <= 6) {
            for (let i = 1; i <= totalPages; i++) {
                const extraClass = i === 1
                    ? 'pagination-first-number'
                    : i === totalPages
                        ? 'pagination-last-number'
                        : '';
                html += createPageButton(i, extraClass);
            }
        } else {
            html += createPageButton(1, 'pagination-first-number');

            const showLeftEllipsis = this.currentPage > 3;
            const showRightEllipsis = this.currentPage < totalPages - 2;

            if (showLeftEllipsis) {
                html += addEllipsis();
            }

            let start = Math.max(2, this.currentPage - 1);
            let end = Math.min(totalPages - 1, this.currentPage + 1);

            if (!showLeftEllipsis) {
                start = 2;
                end = 4;
            }

            if (!showRightEllipsis) {
                start = Math.max(2, totalPages - 3);
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) {
                html += createPageButton(i, '');
            }

            if (showRightEllipsis) {
                html += addEllipsis();
            }

            html += createPageButton(totalPages, 'pagination-last-number');
        }

        html += `
            <button class="pagination-btn" 
                    onclick="catalogManager.goToPage(${this.currentPage + 1}); return false;"
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    title="Próxima página">
                ›
            </button>
        `;

        pagination.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.artigos.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderArtigos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateTitle(title) {
        // Atualizar título da seção de produtos (todos os elementos com classe catalog-title)
        const titleElements = document.querySelectorAll('.catalog-title');
        titleElements.forEach(el => {
            if (el) el.textContent = title;
        });
        
        // Atualizar badges (mobile e desktop)
        const badgeMobile = document.querySelector('.catalog-badge-mobile');
        const badgeDesktop = document.querySelector('.catalog-badge-desktop');
        const badgeText = `${this.artigos.length} produto${this.artigos.length !== 1 ? 's' : ''}`;
        
        if (badgeMobile) {
            badgeMobile.textContent = badgeText;
            badgeMobile.classList.remove('bg-secondary');
            badgeMobile.classList.add('bg-primary');
        }
        
        if (badgeDesktop) {
            badgeDesktop.textContent = badgeText;
            badgeDesktop.classList.remove('bg-secondary');
            badgeDesktop.classList.add('bg-primary');
        }
        
        // Atualizar page-header dinâmico
        const mainTitle = document.getElementById('catalog-main-title');
        const subtitle = document.getElementById('catalog-subtitle');
        const headerBadge = document.getElementById('catalog-badge');
        
        if (this.currentMarca) {
            // Mostrando família específica
            if (mainTitle) mainTitle.textContent = this.currentMarca.Descricao || this.currentMarca.Nome;
            if (subtitle) subtitle.textContent = `Navegando por ${this.artigos.length} produto${this.artigos.length !== 1 ? 's' : ''} desta família`;
            if (headerBadge) headerBadge.textContent = 'Família';
        } else if (title.includes('Pesquisa:')) {
            // Mostrando resultados de pesquisa
            const termo = title.replace('Pesquisa: ', '');
            if (mainTitle) mainTitle.textContent = `Resultados para "${termo}"`;
            if (subtitle) subtitle.textContent = `Encontrámos ${this.artigos.length} produto${this.artigos.length !== 1 ? 's' : ''} relacionado${this.artigos.length !== 1 ? 's' : ''}`;
            if (headerBadge) headerBadge.textContent = 'Pesquisa';
        } else {
            // Mostrando artigos em destaque
            if (mainTitle) mainTitle.textContent = 'Artigos em Destaque';
            if (subtitle) subtitle.textContent = `Confira ${this.artigos.length} dos nossos melhores produtos`;
            if (headerBadge) headerBadge.textContent = 'Destaques';
        }
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        const catalogGrid = document.querySelector('.catalog-grid');
        const pagination = document.querySelector('.catalog-pagination');
        
        // Esconder/mostrar paginação durante carregamento
        if (pagination) {
            if (isLoading) {
                pagination.style.display = 'none';
            } else {
                pagination.style.display = '';
            }
        }
        
        if (catalogGrid) {
            if (isLoading) {
                catalogGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; min-height: 400px;">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                                <span class="visually-hidden">A carregar...</span>
                            </div>
                            <p class="mt-3 fw-bold">A carregar produtos...</p>
                        </div>
                    </div>
                `;
            } else {
                // Loading terminado - será populado por renderProducts
            }
        }
    }

    showError(message) {
        const catalogGrid = document.querySelector('.catalog-grid');
        if (catalogGrid) {
            catalogGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>${message}
                    </div>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.innerHTML = `${message} <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    setupEventListeners() {
        // Desktop search
        const searchInput = document.getElementById('search-products');
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchArtigos(searchInput.value);
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchArtigos(searchInput?.value || '');
            });
        }
        
        // Mobile search
        const searchInputMobile = document.getElementById('search-products-mobile');
        const searchBtnMobile = document.querySelector('.search-btn-mobile');
        
        if (searchInputMobile) {
            searchInputMobile.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchArtigos(searchInputMobile.value);
                    // Fechar collapse após pesquisar
                    const mobileCollapse = document.getElementById('mobileSearchCollapse');
                    if (mobileCollapse && mobileCollapse.classList.contains('show')) {
                        const bsCollapse = new bootstrap.Collapse(mobileCollapse, { toggle: true });
                    }
                }
            });
        }
        
        if (searchBtnMobile) {
            searchBtnMobile.addEventListener('click', () => {
                this.searchArtigos(searchInputMobile?.value || '');
                // Fechar collapse após pesquisar
                const mobileCollapse = document.getElementById('mobileSearchCollapse');
                if (mobileCollapse && mobileCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(mobileCollapse, { toggle: true });
                }
            });
        }
    }
}

// Inicialização
let catalogManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.catalog-grid')) {
        catalogManager = new CatalogManager();
        catalogManager.init();
        
        // Fechar um collapse quando o outro abre (mobile UX)
        const searchCollapse = document.getElementById('mobileSearchCollapse');
        const filtersCollapse = document.getElementById('mobileFiltersCollapse');
        
        if (searchCollapse && filtersCollapse) {
            searchCollapse.addEventListener('show.bs.collapse', () => {
                const bsCollapse = bootstrap.Collapse.getInstance(filtersCollapse);
                if (bsCollapse) bsCollapse.hide();
            });
            
            filtersCollapse.addEventListener('show.bs.collapse', () => {
                const bsCollapse = bootstrap.Collapse.getInstance(searchCollapse);
                if (bsCollapse) bsCollapse.hide();
            });
        }
    }
});
