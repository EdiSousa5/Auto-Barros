/**
 * Gestão da Homepage
 * Produtos em destaque e funcionalidades específicas da página inicial
 */

class HomepageManager {
    constructor() {
        this.products = [];
        this.maxProducts = 9;
    }

    async init() {
        try {
            const container = document.getElementById('featured-products');
            if (!container) return;

            await this.loadFeaturedProducts();
            await this.initBrandsCarousel();
        } catch (error) {
            console.error('Erro ao inicializar homepage:', error);
            this.showError('Erro ao carregar produtos');
        }
    }

    async loadFeaturedProducts() {
        try {
            this.showLoading();
            const featuredProducts = await api.getArtigosDestaque();
            this.products = featuredProducts.slice(0, this.maxProducts);
            this.renderProducts();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showError('Erro ao carregar produtos em destaque');
        }
    }

    renderProducts() {
        const container = document.getElementById('featured-products');
        if (!container) return;

        if (!this.products || this.products.length === 0) {
            container.innerHTML = '<div class="col-12"><div class="alert alert-info">Nenhum produto em destaque</div></div>';
            return;
        }

        container.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const imageUrl = this.getProductImageUrl(product);
        const productData = JSON.stringify(product).replace(/"/g, '&quot;');
        const defaultImg = 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
        
        return `
            <div class="col">
                <div class="card product-card h-100" onclick='homepageManager.showProductModal(${productData})'>
                    <div class="product-image">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             alt="${product.Descricao || 'Produto'}" 
                             loading="lazy"
                             onerror="if (!this.classList.contains('img-error')) { this.classList.add('img-error'); this.src='${defaultImg}'; }">
                        <div class="product-overlay">
                            <button class="btn btn-view-product" onclick='event.stopPropagation(); homepageManager.showProductModal(${productData})'>
                                <i class="fas fa-eye"></i>
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        ${product.NomeMarca ? `<div class="mb-2"><span class="badge bg-primary">${product.NomeMarca}</span></div>` : ''}
                        <h5 class="card-title">${product.Descricao || 'Produto sem descrição'}</h5>
                        <p class="card-text small text-muted">
                            ${product.Artigo ? `<strong>Ref:</strong> ${product.Artigo}` : ''}
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
        // Google Analytics - Rastrear visualização de produto
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_item', {
                'event_category': 'Produtos',
                'event_label': product.Descricao || 'Sem descrição',
                'product_id': product.Artigo || 'N/A',
                'product_brand': product.NomeMarca || 'N/A'
            });
        }
        
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        
        // Preencher dados no modal
        document.getElementById('modalProductTitle').textContent = product.Descricao || 'Produto';
        document.getElementById('modalProductImage').src = this.getProductImageUrl(product);
        document.getElementById('modalProductImage').alt = product.Descricao;
        
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
                window.location.href = '#contactos';
            }, 300);
        };
        
        modal.show();
    }

    async initBrandsCarousel() {
        const brandsTrack = document.getElementById('brandsTrack');
        if (!brandsTrack) return;

        try {
            // Buscar marcas/famílias da API para ter os nomes
            const marcas = await api.getMarcas();
            
            // Criar mapa de IDs de marcas para nomes
            const marcasMap = new Map();
            if (marcas && marcas.length > 0) {
                marcas.forEach(marca => {
                    const id = marca.Id || marca.ID;
                    const nome = marca.Nome || marca.Descricao;
                    if (id && nome) {
                        const idFormatted = String(id).padStart(3, '0');
                        marcasMap.set(idFormatted, nome);
                    }
                });
            }

            // IDs das imagens que existem na pasta (lista fixa para evitar 404s)
            const knownImageIds = [
                '001', '004', '005', '008', '020', '022', '024', '035',
                '036', '041', '042', '045', '048', '053', '055', '056', '098'
            ];

            // Criar array de marcas com as imagens disponíveis
            const brands = knownImageIds.map(id => ({
                name: marcasMap.get(id) || `Marca ${id}`,
                url: `assets/images/familias/${id}.jpg`,
                id: id
            }));

            if (brands.length === 0) {
                console.warn('Nenhuma imagem de marca encontrada');
                return;
            }

            console.log(`Carregadas ${brands.length} marcas`);

            // Duplicar marcas para criar efeito de loop infinito
            const allBrands = [...brands, ...brands, ...brands];
            
            brandsTrack.innerHTML = allBrands.map(brand => `
                <div class="brand-item">
                    <img src="${brand.url}" 
                         alt="${brand.name}" 
                         title="${brand.name}" 
                         width="280" 
                         height="180"
                         loading="lazy">
                </div>
            `).join('');
        } catch (error) {
            console.error('Erro ao inicializar carrossel de marcas:', error);
        }
    }

    showLoading() {
        const container = document.getElementById('featured-products');
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">A carregar...</span>
                    </div>
                    <p class="mt-3">A carregar produtos...</p>
                </div>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('featured-products');
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>${message}
                </div>
            </div>
        `;
    }
}

// Inicialização
let homepageManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('featured-products')) {
        homepageManager = new HomepageManager();
        homepageManager.init();
    }
});
