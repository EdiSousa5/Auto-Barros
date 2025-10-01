// Auto Barros API Service
// Serviço para gerenciar dados da API da Auto Barros

class AutoBarrosAPIService {
    constructor() {
        this.marcas = [];
        this.artigos = [];
        this.artigosDestaque = [];
        this.currentPage = 0;
        this.pageSize = PAGINATION_CONFIG.PAGE_SIZE;
        this.currentMarca = null;
        this.isLoading = false;
    }

    // Carregar marcas da API
    async loadMarcas() {
        try {
            this.isLoading = true;
            const marcas = await apiRequest(API_URLS.marcas);
            this.marcas = marcas || [];
            this.renderMarcas();
            return this.marcas;
        } catch (error) {
            console.error('Erro ao carregar marcas:', error);
            this.handleError('Erro ao carregar marcas');
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    // Carregar artigos em destaque
    async loadArtigosDestaque() {
        try {
            this.isLoading = true;
            const artigos = await apiRequest(API_URLS.artigosDestaque);
            this.artigosDestaque = artigos || [];
            this.artigos = this.artigosDestaque;
            this.renderArtigos('Artigos em Destaque');
            return this.artigosDestaque;
        } catch (error) {
            console.error('Erro ao carregar artigos em destaque:', error);
            this.handleError('Erro ao carregar artigos em destaque');
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    // Carregar artigos por marca
    async loadArtigosPorMarca(marcaId, marcaDescricao) {
        try {
            this.isLoading = true;
            this.currentMarca = { ID: marcaId, Descricao: marcaDescricao };
            this.currentPage = 0;
            
            const artigos = await apiRequest(API_URLS.artigos + marcaId);
            this.artigos = artigos || [];
            this.renderArtigos(`Artigos - ${marcaDescricao}`);
            return this.artigos;
        } catch (error) {
            console.error('Erro ao carregar artigos por marca:', error);
            this.handleError('Erro ao carregar artigos da marca');
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    // Pesquisar artigos
    async searchArtigos(searchTerm) {
        if (!searchTerm || searchTerm.length < 3) {
            return [];
        }

        try {
            this.isLoading = true;
            this.currentPage = 0;
            this.currentMarca = null;
            
            const artigos = await apiRequest(API_URLS.artigosPesquisa + encodeURIComponent(searchTerm) + '/');
            this.artigos = artigos || [];
            this.renderArtigos(`Pesquisa: "${searchTerm}"`);
            return this.artigos;
        } catch (error) {
            console.error('Erro ao pesquisar artigos:', error);
            this.handleError('Erro na pesquisa');
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    // Renderizar marcas na interface
    renderMarcas() {
        const marcasContainer = document.querySelector('.brands-section .brands-grid');
        if (!marcasContainer) return;

        marcasContainer.innerHTML = '';

        this.marcas.forEach(marca => {
            const marcaElement = document.createElement('div');
            marcaElement.className = 'brand-item';
            marcaElement.innerHTML = `
                <div class="brand-info">
                    <h4>${marca.Descricao}</h4>
                    <p>Ver produtos desta marca</p>
                </div>
            `;
            
            marcaElement.addEventListener('click', () => {
                this.loadArtigosPorMarca(marca.ID, marca.Descricao);
            });
            
            marcasContainer.appendChild(marcaElement);
        });
    }

    // Renderizar artigos na interface
    renderArtigos(titulo = 'Artigos') {
        // Atualizar título
        const titleElement = document.querySelector('.catalog-title');
        if (titleElement) {
            titleElement.textContent = titulo;
        }

        // Renderizar produtos na página principal
        this.renderProductsGrid();
        
        // Renderizar no catálogo se estivermos na página do catálogo
        this.renderCatalogProducts();
        
        // Renderizar paginação
        this.renderPagination();
    }

    // Renderizar produtos na grid principal
    renderProductsGrid() {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;

        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentProducts = this.artigos.slice(startIndex, endIndex);

        productsGrid.innerHTML = '';

        currentProducts.forEach(produto => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${buildImageUrl(produto.Imagem)}" alt="${produto.Descricao}" loading="lazy">
                    <div class="product-overlay">
                        <button class="btn btn-small btn-primary" onclick="autoBarrosAPI.showProductDetail('${produto.Artigo}')">
                            Ver Detalhes
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${produto.Descricao}</h3>
                    <p><strong>Artigo:</strong> ${produto.Artigo}</p>
                    <div class="product-brands">
                        <span>${produto.NomeMarca}</span>
                        ${produto.NomeModelo ? `<span>${produto.NomeModelo}</span>` : ''}
                    </div>
                </div>
            `;
            
            productsGrid.appendChild(productCard);
        });
    }

    // Renderizar produtos no catálogo
    renderCatalogProducts() {
        const catalogGrid = document.querySelector('.catalog-grid');
        if (!catalogGrid) return;

        catalogGrid.innerHTML = '';

        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentProducts = this.artigos.slice(startIndex, endIndex);

        if (currentProducts.length === 0) {
            catalogGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente ajustar os filtros ou pesquisar por outros termos.</p>
                </div>
            `;
            return;
        }

        // Agrupar produtos por categoria se necessário
        const groupedProducts = this.groupProductsByCategory(currentProducts);
        
        Object.keys(groupedProducts).forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'catalog-category';
            categoryDiv.innerHTML = `
                <div class="category-header">
                    <h3><i class="fas fa-cogs"></i> ${category}</h3>
                    <p>${groupedProducts[category].length} produtos encontrados</p>
                </div>
                <div class="products-list">
                    ${groupedProducts[category].map(produto => `
                        <div class="product-item">
                            <div class="product-image">
                                <img src="${buildImageUrl(produto.Imagem)}" alt="${produto.Descricao}" loading="lazy">
                            </div>
                            <div class="product-details">
                                <h4>${produto.Descricao}</h4>
                                <p><strong>Artigo:</strong> ${produto.Artigo}</p>
                                <div class="product-specs">
                                    <span>${produto.NomeMarca}</span>
                                    ${produto.NomeModelo ? `<span>${produto.NomeModelo}</span>` : ''}
                                </div>
                                <div class="product-actions">
                                    <button class="btn btn-outline btn-small" onclick="autoBarrosAPI.showProductDetail('${produto.Artigo}')">
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            catalogGrid.appendChild(categoryDiv);
        });
    }

    // Agrupar produtos por categoria
    groupProductsByCategory(products) {
        const grouped = {};
        
        products.forEach(produto => {
            const category = produto.NomeMarca || 'Outros';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(produto);
        });
        
        return grouped;
    }

    // Renderizar paginação
    renderPagination() {
        const totalPages = Math.ceil(this.artigos.length / this.pageSize);
        const paginationContainer = document.querySelector('.pagination-container');
        
        if (!paginationContainer || totalPages <= 1) return;

        let paginationHTML = `
            <div class="pagination">
                <button class="btn btn-outline btn-small" onclick="autoBarrosAPI.previousPage()" ${this.currentPage === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
                <span class="pagination-info">
                    Página ${this.currentPage + 1} de ${totalPages} | ${this.artigos.length} produtos
                </span>
                <button class="btn btn-outline btn-small" onclick="autoBarrosAPI.nextPage()" ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}>
                    Próxima <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    // Navegação de páginas
    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderArtigos();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.artigos.length / this.pageSize);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.renderArtigos();
        }
    }

    // Mostrar detalhes do produto
    showProductDetail(artigoId) {
        const produto = this.artigos.find(p => p.Artigo === artigoId);
        if (!produto) return;

        // Criar modal ou redirecionar para página de detalhes
        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${produto.Descricao}</h2>
                    <button class="modal-close" onclick="this.closest('.product-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="product-detail-grid">
                        <div class="product-detail-image">
                            <img src="${buildImageUrl(produto.Imagem)}" alt="${produto.Descricao}">
                        </div>
                        <div class="product-detail-info">
                            <p><strong>Código do Artigo:</strong> ${produto.Artigo}</p>
                            <p><strong>Marca:</strong> ${produto.NomeMarca}</p>
                            ${produto.NomeModelo ? `<p><strong>Modelo:</strong> ${produto.NomeModelo}</p>` : ''}
                            <div class="product-actions">
                                <a href="tel:+351227419201" class="btn btn-primary">
                                    <i class="fas fa-phone"></i> Contactar
                                </a>
                                <a href="mailto:geral@autobarros-acessorios.pt?subject=Informações sobre ${produto.Artigo}" class="btn btn-outline">
                                    <i class="fas fa-envelope"></i> Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Tratar erros
    handleError(message) {
        console.error(message);
        
        // Mostrar mensagem de erro na interface
        const errorContainer = document.querySelector('.error-container') || document.body;
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
                <button onclick="this.parentElement.remove()">×</button>
            </div>
        `;
        
        errorContainer.appendChild(errorMessage);
        
        // Remover após 5 segundos
        setTimeout(() => {
            errorMessage.remove();
        }, 5000);
    }
}

// Instância global do serviço
const autoBarrosAPI = new AutoBarrosAPIService();
