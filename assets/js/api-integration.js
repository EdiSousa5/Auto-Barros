// Auto Barros API Integration
// Integração com as APIs do sistema interno da Auto Barros

// URLs das APIs
const API_CONFIG = {
    baseURL: "http://autobarrossede.ddns.net/api/Portal/",
    imageURL: "http://autobarrossede.ddns.net/api/Image/Image/",
    endpoints: {
        marcas: "Marcas/",
        artigos: "ArtigosMarca/",
        artigosDestaque: "ArtigosDestaque",
        artigosPesquisa: "ArtigosPesquisa/"
    }
};

// URLs completas
// As URLs são globais, não declarar novamente se já existem
const urlMarcas = window.urlMarcas;
const urlArtigos = window.urlArtigos;
const urlArtigosDestaque = window.urlArtigosDestaque;
const urlArtigosPesquisa = window.urlArtigosPesquisa;
const urlImage = window.urlImage;

class AutoBarrosAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // Método para fazer requisições com cache
    async fetchWithCache(url, cacheKey) {
        // Verificar se existe em cache e não expirou
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Armazenar em cache
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error(`Erro ao buscar dados de ${url}:`, error);
            // Retornar dados em cache se disponível, mesmo expirado
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey).data;
            }
            throw error;
        }
    }

    // Buscar todas as marcas
    async getMarcas() {
        return await this.fetchWithCache(urlMarcas, 'marcas');
    }

    // Alias para compatibilidade
    async loadMarcas() {
        return await this.getMarcas();
    }

    // Buscar artigos por marca
    async getArtigosPorMarca(marcaId) {
        return await this.fetchWithCache(
            urlArtigos + marcaId, 
            `artigos_marca_${marcaId}`
        );
    }

    // Buscar artigos em destaque
    async getArtigosDestaque() {
        return await this.fetchWithCache(urlArtigosDestaque, 'artigos_destaque');
    }

    // Alias para compatibilidade
    async loadArtigosDestaque() {
        return await this.getArtigosDestaque();
    }

    // Buscar artigos por pesquisa
    async getArtigosPorPesquisa(termo) {
        if (!termo || termo.length < 3) {
            throw new Error('Termo de pesquisa deve ter pelo menos 3 caracteres');
        }
        return await this.fetchWithCache(
            urlArtigosPesquisa + encodeURIComponent(termo) + '/', 
            `pesquisa_${termo}`
        );
    }

    // Alias para compatibilidade
    async searchArtigos(termo) {
        return await this.getArtigosPorPesquisa(termo);
    }

    // Gerar URL da imagem (aceita número, string nome ficheiro, código artigo ou URL completo)
    getImageURL(imagem) {
        console.log('Gerando URL para imagem:', imagem);
        if (!imagem || imagem === null || imagem === undefined || imagem === '' || imagem === 'undefined') {
            console.log('ID de imagem inválido, usando placeholder');
            return 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
        }
        // Se for URL completo
        if (typeof imagem === 'string' && imagem.startsWith('http')) {
            return imagem;
        }
        // Se for nome de ficheiro de imagem
        if (typeof imagem === 'string' && imagem.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return urlImage + imagem;
        }
        // Se for código de artigo (ex: CA-1458)
        if (typeof imagem === 'string' && imagem.length > 0) {
            return urlImage + imagem + '/';
        }
        // Se for número
        if (typeof imagem === 'number' && imagem > 0) {
            return urlImage + imagem;
        }
        // Fallback
        return 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
    }

    // Método para limpar cache
    clearCache() {
        this.cache.clear();
    }
}

// Instância global da API
const autoBarrosAPI = new AutoBarrosAPI();

// Classe para gerenciar o catálogo
class CatalogManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 24;
        this.currentMarca = null;
        this.currentSearchTerm = null;
        this.artigos = [];
        this.marcas = [];
        this.loading = false;
    }

    // Inicializar o catálogo
    async init() {
        try {
            await this.loadMarcas();
            await this.loadArtigosDestaque();
            this.setupEventListeners();
        } catch (error) {
            console.error('Erro ao inicializar catálogo:', error);
            this.showError('Erro ao carregar dados. Tente novamente mais tarde.');
        }
    }

    // Carregar marcas
    async loadMarcas() {
        try {
            this.marcas = await autoBarrosAPI.getMarcas();
            this.renderMarcas();
        } catch (error) {
            console.error('Erro ao carregar marcas:', error);
        }
    }

    // Carregar artigos em destaque
    async loadArtigosDestaque() {
        try {
            this.setLoading(true);
            this.artigos = await autoBarrosAPI.getArtigosDestaque();
            this.currentMarca = null;
            this.currentSearchTerm = null;
            this.currentPage = 1;
            this.renderArtigos();
            this.updateTitle('Artigos em Destaque');
        } catch (error) {
            console.error('Erro ao carregar artigos em destaque:', error);
            this.showError('Erro ao carregar artigos em destaque.');
        } finally {
            this.setLoading(false);
        }
    }

    // Carregar artigos por marca
    async loadArtigosPorMarca(marcaId, marcaNome) {
        try {
            this.setLoading(true);
            this.artigos = await autoBarrosAPI.getArtigosPorMarca(marcaId);
            this.currentMarca = { ID: marcaId, Descricao: marcaNome };
            this.currentSearchTerm = null;
            this.currentPage = 1;
            this.renderArtigos();
            this.updateTitle(`Artigos do Catálogo [${marcaNome}]`);
        } catch (error) {
            console.error('Erro ao carregar artigos por marca:', error);
            this.showError('Erro ao carregar artigos da marca.');
        } finally {
            this.setLoading(false);
        }
    }

    // Pesquisar artigos
    async searchArtigos(termo) {
        if (!termo || termo.length < 3) {
            alert('Digite pelo menos 3 caracteres para pesquisar');
            return;
        }

        try {
            this.setLoading(true);
            this.artigos = await autoBarrosAPI.getArtigosPorPesquisa(termo);
            this.currentMarca = null;
            this.currentSearchTerm = termo;
            this.currentPage = 1;
            this.renderArtigos();
            this.updateTitle(`Artigos da Pesquisa: [${termo}]`);
        } catch (error) {
            console.error('Erro ao pesquisar artigos:', error);
            this.showError('Erro ao pesquisar artigos.');
        } finally {
            this.setLoading(false);
        }
    }

    // Renderizar marcas (para futuro menu de marcas)
    renderMarcas() {
        // Implementar quando necessário
        console.log('Marcas carregadas:', this.marcas.length);
    }

    // Renderizar artigos
    renderArtigos() {
        const catalogGrid = document.querySelector('.catalog-grid');
        if (!catalogGrid) return;

        // Limpar grid atual
        catalogGrid.innerHTML = '';

        if (!this.artigos || this.artigos.length === 0) {
            catalogGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>Nenhum artigo encontrado</h3>
                    <p>Tente ajustar os filtros ou termo de pesquisa.</p>
                </div>
            `;
            return;
        }

        // Calcular paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const artigosPage = this.artigos.slice(startIndex, endIndex);

        // Criar HTML dos artigos
        artigosPage.forEach(artigo => {
            const artigoElement = this.createArtigoElement(artigo);
            catalogGrid.appendChild(artigoElement);
        });

        // Atualizar paginação
        this.updatePagination();
    }

    // Criar elemento de artigo
    createArtigoElement(artigo) {
        const div = document.createElement('div');
        div.className = 'catalog-category';
        
        const imageUrl = autoBarrosAPI.getImageURL(artigo.Imagem);
        
        div.innerHTML = `
            <div class="product-item" data-artigo='${JSON.stringify(artigo)}'>
                <div class="product-image">
                    <img src="${imageUrl}" alt="${artigo.Descricao}" loading="lazy" 
                         onerror="this.src='http://autobarrossede.ddns.net/api/Image/Image/132924/'; this.onerror=null;">
                    <div class="product-badge">${artigo.NomeMarca || 'Produto'}</div>
                </div>
                <div class="product-details">
                    <h4>${artigo.Descricao}</h4>
                    <p><strong>Marca:</strong> ${artigo.NomeMarca || 'N/A'}</p>
                    <p><strong>Artigo:</strong> ${artigo.Artigo || 'N/A'}</p>
                    ${artigo.NomeModelo ? `<p><strong>Modelo:</strong> ${artigo.NomeModelo}</p>` : ''}
                    <div class="product-actions">
                        <button class="btn btn-primary btn-small" onclick="catalogManager.showArtigoDetails(this)">
                            Ver Detalhes
                        </button>
                        <button class="btn btn-outline btn-small" onclick="catalogManager.requestQuote('${artigo.Artigo}')">
                            Solicitar Orçamento
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    }

    // Mostrar detalhes do artigo
    showArtigoDetails(button) {
        const productItem = button.closest('.product-item');
        const artigo = JSON.parse(productItem.dataset.artigo);
        
        // Criar modal ou expandir detalhes
        this.createArtigoModal(artigo);
    }

    // Criar modal de detalhes do artigo
    createArtigoModal(artigo) {
        // Remover modal existente se houver
        const existingModal = document.querySelector('.product-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;background:#fff;border-radius:18px;box-shadow:0 8px 40px rgba(26,54,93,0.18);margin:60px auto;padding:0;animation:fadeIn 0.3s;">
                <div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:28px 32px 0 32px;">
                    <h2 style="font-size:2rem;color:#1a365d;font-weight:700;display:flex;align-items:center;gap:12px;margin:0;">
                        <i class="fas fa-box-open" style="color:#1a365d;font-size:1.5rem;"></i> ${artigo.Descricao}
                    </h2>
                    <button class="modal-close" style="background:none;border:none;font-size:1.5rem;color:#1a365d;cursor:pointer;" onclick="this.closest('.product-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding:32px;">
                    <div class="product-detail-grid" style="display:grid;grid-template-columns:180px 1fr;gap:32px;align-items:center;">
                        <div class="product-detail-image" style="background:#f8fafc;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:16px;box-shadow:0 4px 18px rgba(26,54,93,0.08);">
                            <img src="${autoBarrosAPI.getImageURL(artigo.Imagem)}" alt="${artigo.Descricao}" style="max-width:140px;max-height:140px;border-radius:8px;box-shadow:0 2px 8px rgba(26,54,93,0.10);background:#fff;" onerror="this.src='http://autobarrossede.ddns.net/api/Image/Image/132924/'; this.onerror=null;">
                        </div>
                        <div class="product-detail-info" style="display:flex;flex-direction:column;gap:10px;">
                            <p style="margin:0;font-size:1.1rem;color:#1a365d;"><strong><i class='fas fa-barcode'></i> Referência:</strong> ${artigo.Artigo || 'N/A'}</p>
                            <p style="margin:0;font-size:1.1rem;color:#1a365d;"><strong><i class='fas fa-industry'></i> Marca:</strong> ${artigo.NomeMarca || 'N/A'}</p>
                            ${artigo.NomeModelo ? `<p style='margin:0;font-size:1.1rem;color:#1a365d;'><strong><i class='fas fa-car'></i> Modelo:</strong> ${artigo.NomeModelo}</p>` : ''}
                            <p style="margin:0;font-size:1.1rem;color:#1a365d;"><strong><i class='fas fa-layer-group'></i> Grupo:</strong> ${artigo.Artigo_Grupo || 'N/A'}</p>
                            ${artigo.DescricaoExtra ? `<p style='color:#555;font-size:1rem;margin-top:8px;'>${artigo.DescricaoExtra}</p>` : ''}
                            <div class="product-actions" style="margin-top:18px;display:flex;gap:12px;">
                                <a href="mailto:geral@autobarros-acessorios.pt?subject=Orçamento para artigo: ${encodeURIComponent(artigo.Artigo)}&body=Gostaria de solicitar um orçamento para o artigo: ${encodeURIComponent(artigo.Artigo)}" class="btn btn-primary btn-small" style="font-size:1rem;padding:10px 18px;">
                                    <i class="fas fa-envelope"></i> Solicitar Orçamento
                                </a>
                                <button class="btn btn-outline btn-small" style="font-size:1rem;padding:10px 18px;" onclick="document.querySelector('.product-modal').remove()">
                                    <i class="fas fa-times"></i> Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(26,54,93,0.18);z-index:999;pointer-events:none;"></div>
        `;
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = 'rgba(26,54,93,0.18)';
        document.body.appendChild(modal);
    }

    // Solicitar orçamento
    requestQuote(artigo) {
        const subject = `Orçamento para artigo: ${artigo}`;
        const body = `Gostaria de solicitar um orçamento para o artigo: ${artigo}`;
        const email = 'geral@autobarros-acessorios.pt';
        
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    // Atualizar título
    updateTitle(title) {
        const titleElement = document.querySelector('.section-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // Mostrar/ocultar loading
    setLoading(isLoading) {
        this.loading = isLoading;
        const loadingElement = document.querySelector('.loading-indicator');
        
        if (isLoading) {
            if (!loadingElement) {
                const loading = document.createElement('div');
                loading.className = 'loading-indicator';
                loading.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>A carregar...</p>
                    </div>
                `;
                document.querySelector('.catalog-grid').appendChild(loading);
            }
        } else {
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }

    // Mostrar erro
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorElement);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    // Atualizar paginação
    updatePagination() {
        const totalPages = Math.ceil(this.artigos.length / this.itemsPerPage);
        
        // Atualizar informações de paginação (implementar se necessário)
        console.log(`Página ${this.currentPage} de ${totalPages} - Total: ${this.artigos.length} artigos`);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Pesquisa
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
                const searchTerm = searchInput ? searchInput.value : '';
                this.searchArtigos(searchTerm);
            });
        }

        // Filtros (manter compatibilidade com sistema atual)
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                
                // Remover active de todos
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (filter === 'all') {
                    this.loadArtigosDestaque();
                } else {
                    // Mapear filtros para marcas (implementar se necessário)
                    this.filterByCategory(filter);
                }
            });
        });
    }

    // Filtrar por categoria (compatibilidade)
    filterByCategory(category) {
        // Mapear categorias para marcas específicas se necessário
        const categoryMarcaMap = {
            'alternadores': '1000', // ID da marca de alternadores
            'motores': '2000',      // ID da marca de motores
            // Adicionar outros mapeamentos conforme necessário
        };

        const marcaId = categoryMarcaMap[category];
        if (marcaId) {
            this.loadArtigosPorMarca(marcaId, category.toUpperCase());
        }
    }
}

// Instância global do gerenciador de catálogo
const catalogManager = new CatalogManager();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('API Integration carregado');
    
    // Verificar se estamos na página do catálogo
    if (document.querySelector('.catalog-grid')) {
        console.log('Página do catálogo detectada - inicializando CatalogManager');
        catalogManager.init();
    } else {
        console.log('Não é página do catálogo - CatalogManager não inicializado');
    }
});

// Exportar para uso global
window.autoBarrosAPI = autoBarrosAPI;
window.catalogManager = catalogManager;
