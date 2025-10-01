// --- Sidebar de famílias (marcas) e filtragem dinâmica ---
    document.addEventListener('DOMContentLoaded', function() {
        const familiesList = document.getElementById('families-list');
        const catalogGrid = document.getElementById('catalog-marca-1000');
        const catalogTitle = document.getElementById('catalog-title');
        const catalogInfo = document.getElementById('catalog-info');
        let familias = [];
        let artigos = [];
        let artigosFiltrados = [];
        let currentFamiliaId = '1000';
        let currentFamiliaName = 'Alternadores';
        let currentPage = 1;
        const PAGINATION_SIZE = 12;
        let totalPages = 1;
        let lastSelectedFamilia = { id: '1000', name: 'Alternadores' }; // Para lembrar da família antes da pesquisa
        let isSearching = false; // Flag para controlar se estamos em modo de pesquisa

        // Sistema de controle de carregamento global
        let isInitializing = true;
        let isLoadingData = false;
        let loadingProgress = 0;
        let loadingInterval = null;
        let expectedDataCount = 0;
        let receivedDataCount = 0;

        // Função para mostrar carregamento inicial discreto
        function showInitialLoading() {
            if (!catalogGrid) return;
            
            isInitializing = true;
            
            // Mostrar loading simples no grid
            catalogGrid.innerHTML = `
                <div class="initial-loading-container">
                    <div class="loading-content-simple">
                        <div class="spinner-simple"></div>
                        <p>A carregar catálogo...</p>
                    </div>
                </div>
            `;
            
            // Ocultar paginação durante carregamento inicial
            const pagination = document.getElementById('catalog-pagination');
            if (pagination) pagination.style.display = 'none';
        }

        function updateInitialLoadingStep(stepId, completed = false) {
            // Simplified - no complex steps needed
        }

        function hideInitialLoading() {
            isInitializing = false;
            
            // Remove loading container
            const loadingContainer = catalogGrid.querySelector('.initial-loading-container');
            if (loadingContainer) {
                loadingContainer.remove();
            }
        }

        function showLoadingSpinner(expectedCount = 100) {
            if (isInitializing) return; // Não mostrar spinner durante carregamento inicial
            
            if (!catalogGrid) return;
            isLoadingData = true;
            
            let spinner = catalogGrid.querySelector('#catalog-loading-spinner');
            let pagination = document.getElementById('catalog-pagination');
            if (pagination) pagination.style.pointerEvents = 'none';
            if (pagination) pagination.style.opacity = '0.5';
            
            // Reset progress tracking
            expectedDataCount = expectedCount;
            receivedDataCount = 0;
            loadingProgress = 0;
            
            if (!spinner) {
                spinner = document.createElement('div');
                spinner.id = 'catalog-loading-spinner';
                spinner.innerHTML = `
                  <div class="loading-visual">
                    <div class="spinner"></div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:0%"></div></div>
                    <div class="progress-label">A carregar...</div>
                  </div>
                `;
                spinner.style.position = 'absolute';
                spinner.style.top = '0';
                spinner.style.left = '0';
                spinner.style.width = '100%';
                spinner.style.height = '100%';
                spinner.style.background = 'rgba(255,255,255,0.7)';
                spinner.style.display = 'flex';
                spinner.style.alignItems = 'center';
                spinner.style.justifyContent = 'center';
                spinner.style.zIndex = '10';
                catalogGrid.style.position = 'relative';
                catalogGrid.appendChild(spinner);
            } else {
                spinner.style.display = 'flex';
            }
            
            // Inicia animação de progresso inicial
            updateLoadingProgress(0);
            if (loadingInterval) clearInterval(loadingInterval);
            
            // Progresso simulado inicial mais conservador
            loadingInterval = setInterval(() => {
                if (loadingProgress < 30) {
                    loadingProgress += Math.random() * 3 + 1;
                    if (loadingProgress > 30) loadingProgress = 30;
                    updateLoadingProgress(loadingProgress);
                }
            }, 100);
        }

        function updateLoadingProgress(percent, message = null) {
            let spinner = catalogGrid.querySelector('#catalog-loading-spinner');
            if (!spinner) return;
            let fill = spinner.querySelector('.progress-bar-fill');
            let label = spinner.querySelector('.progress-label');
            if (fill) fill.style.width = Math.round(percent) + '%';
            if (label) {
                if (message) {
                    label.textContent = message;
                } else if (percent < 100) {
                    label.textContent = `${Math.round(percent)}% - A carregar...`;
                } else {
                    label.textContent = 'Concluído!';
                }
            }
        }

        function hideLoadingSpinner() {
            if (!catalogGrid) return;
            isLoadingData = false;
            
            const spinner = catalogGrid.querySelector('#catalog-loading-spinner');
            let pagination = document.getElementById('catalog-pagination');
            if (pagination) pagination.style.pointerEvents = '';
            if (pagination) pagination.style.opacity = '';
            if (spinner) {
                // Finaliza barra de progresso
                if (loadingInterval) clearInterval(loadingInterval);
                updateLoadingProgress(100);
                setTimeout(() => {
                    spinner.style.display = 'none';
                }, 350);
            }
        }

        // Utiliza API global se disponível
        function getImageUrlFromArtigo(artigo) {
            if (artigo.ImageUrl && artigo.ImageUrl !== 'undefined' && artigo.ImageUrl !== '') {
                return artigo.ImageUrl;
            } else if (window.autoBarrosAPI && typeof autoBarrosAPI.getImageURL === 'function') {
                if (artigo.ImagemId) return autoBarrosAPI.getImageURL(artigo.ImagemId);
                if (artigo.Imagem) return autoBarrosAPI.getImageURL(artigo.Imagem);
            } else if (window.buildImageUrl && (artigo.ImagemId || artigo.Imagem)) {
                return buildImageUrl(artigo.ImagemId || artigo.Imagem);
            }
            return 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
        }

        function renderFamiliasSidebar() {
            if (!familiesList) return;
            familiesList.innerHTML = '';
            
            familias.forEach(fam => {
                const familiaId = fam.Id || fam.ID || fam.id || fam.FamiliaId || fam.MarcaId || fam.ID_Marca;
                const familiaName = fam.Nome || fam.Descricao || fam.nome || fam.descricao || `Família ${familiaId}`;
                
                const familiaItem = document.createElement('div');
                familiaItem.className = 'family-item';
                familiaItem.setAttribute('data-familia-id', familiaId);
                if (String(familiaId) === String(currentFamiliaId)) {
                    familiaItem.classList.add('active');
                }
                
                familiaItem.innerHTML = `
                    <span class="family-name">${familiaName}</span>
                    <i class="fas fa-chevron-right family-arrow"></i>
                `;
                
                familiaItem.addEventListener('click', function() {
                    if (String(familiaId) !== String(currentFamiliaId)) {
                        // Remove active de todos os itens
                        familiesList.querySelectorAll('.family-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        
                        // Adiciona active ao item clicado
                        familiaItem.classList.add('active');
                        
                        // Atualiza família atual
                        currentFamiliaId = familiaId;
                        currentFamiliaName = familiaName;
                        
                        // Mostrar loading durante mudança de família
                        showLoadingSpinner();
                        
                        // Carrega produtos da família
                        fetchArtigosPorFamilia(familiaId).then(data => {
                            artigos = Array.isArray(data) ? data : [];
                            artigosFiltrados = artigos;
                            
                            totalPages = Math.ceil(artigosFiltrados.length / PAGINATION_SIZE) || 1;
                            currentPage = 1;
                            updateCatalogHeader();
                            renderCatalogPage();
                        }).finally(() => {
                            // Finaliza progresso com animação suave
                            setTimeout(() => {
                                updateLoadingProgress(100, 'Concluído!');
                                setTimeout(() => {
                                    hideLoadingSpinner();
                                }, 200);
                            }, 300);
                        });
                    }
                });
                
                familiesList.appendChild(familiaItem);
            });
        }

        function updateCatalogHeader(customTitle = null) {
            if (catalogTitle) {
                catalogTitle.textContent = customTitle || currentFamiliaName;
            }
            if (catalogInfo) {
                const productCount = artigosFiltrados.length;
                const countText = productCount === 1 ? '1 produto' : `${productCount} produtos`;
                catalogInfo.innerHTML = `<span class="product-count">${countText} encontrados</span>`;
            }
        }

        // Função para fazer scroll suave para o topo do catálogo
        function scrollToCatalogTop() {
            const catalogSection = document.querySelector('.catalog-section') || document.querySelector('.simple-catalog-header');
            if (catalogSection) {
                const offsetTop = catalogSection.offsetTop - 80; // 80px de margem para o header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }

        function renderCatalogPage() {
            if (!catalogGrid) return;
            catalogGrid.innerHTML = '';
            if (!Array.isArray(artigosFiltrados) || artigosFiltrados.length === 0) {
                // Diferentes mensagens para pesquisa vs navegação normal
                if (isSearching && currentSearchTerm) {
                    // Mensagem simples em vez de card para pesquisa vazia
                    catalogGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #6b7280;">
                            <i class="fas fa-search" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem; display: block;"></i>
                            <h3 style="color: #374151; margin-bottom: 0.5rem; font-weight: 600;">Nenhum resultado encontrado</h3>
                            <p style="margin-bottom: 0; color: #9ca3af;">Não foram encontrados artigos para "${currentSearchTerm}". Tente pesquisar com termos diferentes.</p>
                        </div>
                    `;
                } else {
                    catalogGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #6b7280;">
                            <i class="fas fa-box-open" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem; display: block;"></i>
                            <h3 style="color: #374151; margin-bottom: 0.5rem; font-weight: 600;">Nenhum artigo disponível</h3>
                            <p style="margin-bottom: 0; color: #9ca3af;">Esta família não tem produtos disponíveis no momento.</p>
                        </div>
                    `;
                }
                renderPagination();
                return;
            }
            const start = (currentPage - 1) * PAGINATION_SIZE;
            const end = start + PAGINATION_SIZE;
            const artigosPage = artigosFiltrados.slice(start, end);
            
            artigosPage.forEach((artigo, index) => {
                const imageUrl = getImageUrlFromArtigo(artigo);
                const productName = artigo.Descricao && artigo.Descricao.trim() ? artigo.Descricao : 'Produto sem nome';
                const productReference = artigo.Artigo && artigo.Artigo.trim() ? artigo.Artigo : '';
                const productBrand = artigo.NomeMarca && artigo.NomeMarca.trim() ? artigo.NomeMarca : '';
                const productModel = artigo.NomeModelo && artigo.NomeModelo.trim() ? artigo.NomeModelo : '';

                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.productId = artigo.Artigo;
                card.style.cursor = 'pointer';
                
                // Animação sequencial para os cards
                card.style.opacity = '0';
                card.style.transform = 'translateY(40px)';
                
                card.innerHTML = `
                    <div class="product-image">
                        <img src="${imageUrl}" 
                             alt="${productName}" 
                             loading="lazy"
                             onerror="if (!this.classList.contains('img-error')) { this.classList.add('img-error'); this.src='http://autobarrossede.ddns.net/api/Image/Image/132924/'; }">
                        <div class="product-overlay">
                            <button class="btn-view-product" data-product-id="${artigo.Artigo}">
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
                    </div>
                `;
                
                // Event listener para clicar em qualquer parte do card
                card.addEventListener('click', (e) => {
                    // Prevenir propagação se o clique for no botão
                    if (e.target.closest('.btn-view-product')) {
                        e.stopPropagation();
                        return;
                    }
                    showCatalogProductModal(artigo.Artigo);
                });
                
                catalogGrid.appendChild(card);
                
                // Animação de entrada sequencial
                setTimeout(() => {
                    card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            // Event listeners para os botões
            document.querySelectorAll('.btn-view-product').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    showCatalogProductModal(productId);
                });
            });
            
            renderPagination();
        }

        function renderPagination() {
            const paginationContainerId = 'catalog-pagination';
            let paginationContainer = document.getElementById(paginationContainerId);
            if (!paginationContainer) {
                paginationContainer = document.createElement('div');
                paginationContainer.id = paginationContainerId;
                paginationContainer.className = 'catalog-pagination';
                catalogGrid.parentNode.appendChild(paginationContainer);
            }
            paginationContainer.innerHTML = '';
            if (totalPages <= 1) {
                paginationContainer.style.display = 'none';
                return;
            }
            // Esconde paginação se spinner visível
            let spinner = catalogGrid.querySelector('#catalog-loading-spinner');
            if (spinner && spinner.style.display !== 'none') {
                paginationContainer.style.display = 'none';
                return;
            } else {
                paginationContainer.style.display = '';
            }

            // Botão Anterior (apenas uma seta)
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.innerHTML = '‹';
            prevBtn.title = 'Página anterior';
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    scrollToCatalogTop();
                    renderCatalogPage();
                }
            };
            paginationContainer.appendChild(prevBtn);

            // Calcular páginas visíveis
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            
            // Ajustar startPage se não temos páginas suficientes no final
            if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
            }

            // Botão da página 1 (se ultrapassou das 5 páginas e não está visível)
            if (startPage > 1) {
                const firstPageBtn = document.createElement('button');
                firstPageBtn.className = 'pagination-btn pagination-first-number' + (currentPage === 1 ? ' active' : '');
                firstPageBtn.textContent = '1';
                firstPageBtn.title = 'Ir para primeira página';
                firstPageBtn.onclick = () => {
                    if (currentPage !== 1) {
                        currentPage = 1;
                        scrollToCatalogTop();
                        renderCatalogPage();
                    }
                };
                paginationContainer.appendChild(firstPageBtn);

                // Reticências após a página 1 se necessário
                if (startPage > 2) {
                    const ellipsis = document.createElement('span');
                    ellipsis.textContent = '...';
                    ellipsis.className = 'pagination-ellipsis';
                    paginationContainer.appendChild(ellipsis);
                }
            }

            // Números de página visíveis
            for (let i = startPage; i <= endPage; i++) {
                const btn = document.createElement('button');
                btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
                btn.textContent = i;
                btn.onclick = () => {
                    if (currentPage !== i) {
                        currentPage = i;
                        scrollToCatalogTop();
                        renderCatalogPage();
                    }
                };
                paginationContainer.appendChild(btn);
            }

            // Reticências (...) sempre presentes se há mais páginas
            if (endPage < totalPages) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                paginationContainer.appendChild(ellipsis);
            }

            // Botão da última página
            if (totalPages > endPage) {
                const lastPageBtn = document.createElement('button');
                lastPageBtn.className = 'pagination-btn pagination-last-number' + (currentPage === totalPages ? ' active' : '');
                lastPageBtn.textContent = totalPages;
                lastPageBtn.title = `Ir para página ${totalPages}`;
                lastPageBtn.onclick = () => {
                    if (currentPage !== totalPages) {
                        currentPage = totalPages;
                        scrollToCatalogTop();
                        renderCatalogPage();
                    }
                };
                paginationContainer.appendChild(lastPageBtn);
            }

            // Botão Próxima (apenas uma seta)
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.innerHTML = '›';
            nextBtn.title = 'Próxima página';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderCatalogPage();
                }
            };
            paginationContainer.appendChild(nextBtn);
        }

        // Função para mostrar modal de produto (versão catálogo sem badge de destaque)
        function showProductModal(artigo) {
            if (!artigo) return;
            
            const imageUrl = getImageUrlFromArtigo(artigo);
            const productName = artigo.Descricao && artigo.Descricao.trim() ? artigo.Descricao : 'Produto sem nome';
            const productReference = artigo.Artigo && artigo.Artigo.trim() ? artigo.Artigo : 'N/A';
            const productBrand = artigo.NomeMarca && artigo.NomeMarca.trim() ? artigo.NomeMarca : 'N/A';
            const productModel = artigo.NomeModelo && artigo.NomeModelo.trim() ? artigo.NomeModelo : 'N/A';

            // Criar modal
            const modal = document.createElement('div');
            modal.className = 'product-modal-premium';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-container">
                    <div class="modal-card">
                        <!-- Header sem badge de destaque -->
                        <div class="modal-header-premium">
                            <div class="modal-header-content">
                                <!-- Removido: badge de produto em destaque -->
                            </div>
                            <button class="modal-close-premium" aria-label="Fechar">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- Body Premium -->
                        <div class="modal-body-premium">
                            <!-- Imagem Premium -->
                            <div class="modal-image-section-premium">
                                <div class="image-container-premium">
                                    <img src="${imageUrl}" 
                                         alt="${productName}" 
                                         class="product-image-premium"
                                         onerror="this.src='http://autobarrossede.ddns.net/api/Image/Image/132924/';">
                                    <div class="image-overlay-premium">
                                        <div class="zoom-icon">
                                            <i class="fas fa-search-plus"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Informações Premium -->
                            <div class="modal-info-section-premium">
                                <div class="product-header-premium">
                                    <h2 class="product-title-premium">${productName}</h2>
                                    <div class="product-reference-premium">
                                        <span class="ref-label">REFERÊNCIA</span>
                                        <span class="ref-code">${productReference}</span>
                                    </div>
                                </div>

                                ${productBrand !== 'N/A' ? `
                                <div class="product-brand-premium">
                                    <i class="fas fa-industry"></i>
                                    <span><strong>Marca:</strong> ${productBrand}</span>
                                </div>
                                ` : ''}

                                ${productModel !== 'N/A' ? `
                                <div class="product-model-premium">
                                    <i class="fas fa-cog"></i>
                                    <span><strong>Modelo:</strong> ${productModel}</span>
                                </div>
                                ` : ''}

                                <div class="product-description-premium">
                                    <h3><i class="fas fa-info-circle"></i> Informações do Produto</h3>
                                    <p>Produto de alta qualidade da Auto Barros Acessórios, especialistas em componentes automotivos desde 1985.</p>
                                </div>

                                <div class="product-features-premium">
                                    <h3><i class="fas fa-star"></i> Características</h3>
                                    <div class="features-grid-premium">
                                        <div class="feature-item-premium">
                                            <i class="fas fa-shield-alt"></i>
                                            <span>Garantia de Qualidade</span>
                                        </div>
                                        <div class="feature-item-premium">
                                            <i class="fas fa-warehouse"></i>
                                            <span>Stock Disponível</span>
                                        </div>
                                        <div class="feature-item-premium">
                                            <i class="fas fa-search"></i>
                                            <span>Consultoria Técnica</span>
                                        </div>
                                        <div class="feature-item-premium">
                                            <i class="fas fa-headset"></i>
                                            <span>Suporte Técnico</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="modal-actions-premium">
                                    <a href="tel:+351227419201" class="btn-contact-premium primary">
                                        <i class="fas fa-phone"></i>
                                        Contactar Agora
                                    </a>
                                    <a href="mailto:geral@autobarros-acessorios.pt" class="btn-contact-premium secondary">
                                        <i class="fas fa-envelope"></i>
                                        Enviar Email
                                    </a>
                                </div>

                                <div class="contact-info-premium">
                                    <div class="contact-item-premium">
                                        <i class="fas fa-phone"></i>
                                        +351 227 419 201
                                    </div>
                                    <div class="contact-item-premium">
                                        <i class="fas fa-envelope"></i>
                                        geral@autobarros-acessorios.pt
                                    </div>
                                    <div class="contact-item-premium">
                                        <i class="fas fa-clock"></i>
                                        Seg-Sex: 9:00-12:30 | 14:30-19:00
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Adicionar ao DOM
            document.body.appendChild(modal);
            document.body.classList.add('modal-open');

            // Mostrar modal
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });

            // Event listeners
            const closeBtn = modal.querySelector('.modal-close-premium');
            const backdrop = modal.querySelector('.modal-backdrop');
            const imageContainer = modal.querySelector('.image-container-premium');

            function closeModal() {
                modal.classList.remove('show');
                modal.classList.add('closing');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    document.body.classList.remove('modal-open');
                }, 300);
            }

            closeBtn.addEventListener('click', closeModal);
            backdrop.addEventListener('click', closeModal);

            // Zoom da imagem
            imageContainer.addEventListener('click', () => {
                const zoomModal = document.createElement('div');
                zoomModal.className = 'image-zoom-modal';
                zoomModal.innerHTML = `
                    <img src="${imageUrl}" alt="${productName}">
                    <button class="zoom-close-btn"><i class="fas fa-times"></i></button>
                `;
                document.body.appendChild(zoomModal);
                
                requestAnimationFrame(() => {
                    zoomModal.classList.add('show');
                });

                const zoomCloseBtn = zoomModal.querySelector('.zoom-close-btn');
                function closeZoom() {
                    zoomModal.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(zoomModal);
                    }, 300);
                }

                zoomCloseBtn.addEventListener('click', closeZoom);
                zoomModal.addEventListener('click', (e) => {
                    if (e.target === zoomModal) closeZoom();
                });
            });

            // Fechar com ESC
            function handleEsc(e) {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEsc);
                }
            }
            document.addEventListener('keydown', handleEsc);
        }

        // Função para mostrar modal dos produtos do catálogo (igual aos produtos em destaque)
        function showCatalogProductModal(productId) {
            const product = artigosFiltrados.find(p => p.Artigo == productId);
            if (!product) {
                console.error('Produto não encontrado:', productId);
                return;
            }

            // Obter o modal HTML estático
            const modal = document.getElementById('productModal');
            if (!modal) {
                console.error('Modal não encontrado no DOM');
                return;
            }

            // Atualizar conteúdo do modal com dados do produto
            updateCatalogModalContent(product);

            // Mostrar modal sem interferir no scroll da página
            document.body.classList.add('modal-open');
            modal.classList.add('show');

            // Configurar event listeners
            setupCatalogModalEvents(modal, product);
        }

        // Atualizar conteúdo do modal do catálogo (EXATAMENTE igual aos produtos em destaque)
        function updateCatalogModalContent(product) {
            console.log('📝 Atualizando modal com produto:', product);

            // Usar os dados corretos da API
            const productTitle = product.Descricao || 'Produto sem nome';
            const productReference = product.Artigo || '';
            const productDescription = product.Descricao || '';
            const productBrand = product.NomeMarca || '';
            const productModel = product.NomeModelo || '';
            const imageUrl = getImageUrlFromArtigo(product);

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
                referenceElement.style.display = 'flex';
                const refCodeElement = referenceElement.querySelector('.ref-code');
                if (refCodeElement) refCodeElement.textContent = productReference;
            } else if (referenceElement) {
                referenceElement.style.display = 'none';
            }

            // Atualizar marca
            const brandElement = document.getElementById('modalProductBrand');
            if (productBrand && brandElement) {
                brandElement.style.display = 'flex';
                const brandValueElement = brandElement.querySelector('.detail-value');
                if (brandValueElement) brandValueElement.textContent = productBrand;
            } else if (brandElement) {
                brandElement.style.display = 'none';
            }

            // Atualizar modelo
            const modelElement = document.getElementById('modalProductModel');
            if (productModel && modelElement) {
                modelElement.style.display = 'flex';
                const modelValueElement = modelElement.querySelector('.detail-value');
                if (modelValueElement) modelValueElement.textContent = productModel;
            } else if (modelElement) {
                modelElement.style.display = 'none';
            }

            // Atualizar descrição
            const descriptionElement = document.getElementById('modalProductDescription');
            if (productDescription && descriptionElement) {
                descriptionElement.style.display = 'block';
                const descPElement = descriptionElement.querySelector('p');
                if (descPElement) descPElement.textContent = productDescription;
            } else if (descriptionElement) {
                descriptionElement.style.display = 'none';
            }

            console.log('✅ Modal atualizado com sucesso');
        }

        // Configurar event listeners do modal do catálogo
        function setupCatalogModalEvents(modal, product) {
            // Resetar scroll do modal para o topo
            const modalBody = modal.querySelector('.modal-info-section-bottom');
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
                
                document.removeEventListener('keydown', handleEscape);
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
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Configurar botão de contacto único
            const contactBtn = document.getElementById('modalContactEmail');
            
            if (contactBtn) {
                contactBtn.onclick = () => {
                    // Fechar o modal primeiro
                    closeModal();
                    
                    // Redirecionar para a página inicial com âncora para contactos
                    redirectToContactsPage();
                };
            }
            
            // Configurar funcionalidade de zoom na imagem
            setupCatalogImageZoom(modal, product);
        }

        // Configurar funcionalidade de zoom na imagem do catálogo
        function setupCatalogImageZoom(modal, product) {
            const imageContainer = modal.querySelector('.image-container-large');
            
            if (imageContainer) {
                imageContainer.addEventListener('click', () => {
                    const imageSrc = getImageUrlFromArtigo(product);
                    const productName = product.Descricao || 'Produto';
                    showSimpleCatalogImageModal(imageSrc, productName);
                });
            }
        }

        // Mostrar modal de imagem simples do catálogo
        function showSimpleCatalogImageModal(imageSrc, productName = 'Produto') {
            // Remover modal de zoom existente se houver
            const existingZoomModal = document.getElementById('catalogImageZoomModal');
            if (existingZoomModal) {
                existingZoomModal.remove();
            }

            // Criar modal de zoom simples
            const zoomModal = document.createElement('div');
            zoomModal.id = 'catalogImageZoomModal';
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
                document.removeEventListener('keydown', handleEscape);
            };

            closeBtn.addEventListener('click', closeZoomModal);
            backdrop.addEventListener('click', closeZoomModal);

            // Fechar com ESC
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeZoomModal();
                }
            };
            document.addEventListener('keydown', handleEscape);
        }

        // Nova função: buscar artigos da família e renderizar
        function buscarArtigosPorFamilia(familiaId) {
            if (!familiaId) return;
            
            // Mostrar loading durante mudança de família
            showLoadingSpinner(50);
            
            if (window.autoBarrosAPI && typeof autoBarrosAPI.getArtigosPorMarca === 'function') {
                window.autoBarrosAPI.getArtigosPorMarca(familiaId).then(arts => {
                    artigos = Array.isArray(arts) ? arts : [];
                    artigosFiltrados = artigos;
                    totalPages = Math.ceil(artigosFiltrados.length / PAGINATION_SIZE) || 1;
                    currentPage = 1;
                    hideLoadingSpinner();
                    renderCatalogPage();
                }).catch(error => {
                    console.error('Erro ao carregar artigos:', error);
                    hideLoadingSpinner();
                });
            } else {
                fetch(`http://autobarrossede.ddns.net/api/Portal/ArtigosMarca/${familiaId}`)
                    .then(resp => resp.json())
                    .then(arts => {
                        artigos = Array.isArray(arts) ? arts : [];
                        artigosFiltrados = artigos;
                        totalPages = Math.ceil(artigosFiltrados.length / PAGINATION_SIZE) || 1;
                        currentPage = 1;
                        hideLoadingSpinner();
                        renderCatalogPage();
                    })
                    .catch(error => {
                        console.error('Erro ao carregar artigos:', error);
                        hideLoadingSpinner();
                    });
            }
        }

        // Buscar famílias (marcas)
        function fetchFamilias() {
            // Usa API global se disponível
            if (window.autoBarrosAPI && typeof autoBarrosAPI.getMarcas === 'function') {
                return window.autoBarrosAPI.getMarcas();
            }
            return fetch('http://autobarrossede.ddns.net/api/Portal/Marcas/')
                .then(resp => resp.json());
        }

        // Buscar artigos de todas as famílias (para filtrar no frontend)
        function fetchTodosArtigos() {
            // Não existe endpoint para todos, então busca só da família padrão (1000) e filtra depois
            // Alternativamente, pode-se buscar por família ao selecionar
            return fetch(`http://autobarrossede.ddns.net/api/Portal/ArtigosMarca/1000`)
                .then(resp => resp.json());
        }

        // Buscar artigos de uma família específica
        function fetchArtigosPorFamilia(familiaId) {
            if (window.autoBarrosAPI && typeof autoBarrosAPI.getArtigosPorMarca === 'function') {
                return window.autoBarrosAPI.getArtigosPorMarca(familiaId);
            }
            return fetch(`http://autobarrossede.ddns.net/api/Portal/ArtigosMarca/${familiaId}`)
                .then(resp => resp.json());
        }

        // Sistema de carregamento inicial - página inteira
        function showInitialLoading() {
            if (!catalogGrid) return;
            
            isInitializing = true;
            
            // Criar overlay simples
            const fullPageOverlay = document.createElement('div');
            fullPageOverlay.id = 'catalog-fullpage-overlay';
            fullPageOverlay.innerHTML = `
                <div class="simple-loading-container">
                    <div class="simple-loading-content">
                        <div class="simple-spinner"></div>
                        <h3>A carregar Catálogo</h3>
                        <p>A carregar produtos...</p>
                        <div class="simple-progress">
                            <div class="simple-progress-bar" id="simple-progress"></div>
                        </div>
                        <div class="loading-status" id="loading-status">Inicializando...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(fullPageOverlay);
            
            // Limpar grid durante carregamento
            catalogGrid.innerHTML = '';
            
            // Ocultar paginação durante carregamento inicial
            const pagination = document.getElementById('catalog-pagination');
            if (pagination) pagination.style.display = 'none';
        }

        function updateInitialLoadingStep(stepId, completed = false) {
            // Atualizar progresso e status
            const progressBar = document.getElementById('simple-progress');
            const statusElement = document.getElementById('loading-status');
            if (!progressBar || !statusElement) return;
            
            if (stepId === 'step-families') {
                if (!completed) {
                    progressBar.style.width = '25%';
                    statusElement.textContent = 'A carregar famílias de produtos...';
                } else {
                    progressBar.style.width = '50%';
                    statusElement.textContent = 'Famílias carregadas com sucesso!';
                }
            } else if (stepId === 'step-products') {
                if (!completed) {
                    progressBar.style.width = '75%';
                    statusElement.textContent = 'A carregar produtos...';
                } else {
                    progressBar.style.width = '100%';
                    statusElement.textContent = 'Catálogo pronto!';
                }
            }
        }

        function hideInitialLoading() {
            isInitializing = false;
            
            // Remove overlay de página inteira com animação suave
            const fullPageOverlay = document.getElementById('catalog-fullpage-overlay');
            if (fullPageOverlay) {
                fullPageOverlay.style.opacity = '0';
                fullPageOverlay.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    if (fullPageOverlay.parentNode) {
                        fullPageOverlay.remove();
                    }
                }, 500);
            }
        }

        // === FUNCIONALIDADE DE PESQUISA ===
        let searchTimeout = null;
        let currentSearchTerm = '';

        // Inicializar event listeners da pesquisa
        function initializeSearchListeners() {
            const searchInput = document.getElementById('catalog-search-input');
            const clearSearchBtn = document.getElementById('catalog-clear-search');
            const searchBtn = document.getElementById('catalog-search-btn'); // Novo botão de pesquisa

            if (!searchInput || !clearSearchBtn || !searchBtn) return;

            // Event listener para input (apenas mostrar/esconder botão de limpar)
            searchInput.addEventListener('input', function(e) {
                const term = e.target.value.trim();
                
                // Limpar timeout anterior se existir
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }

                // Se termo está vazio, voltar à família selecionada
                if (term.length === 0) {
                    clearSearchBtn.style.display = 'none';
                    if (isSearching) {
                        resetToFamiliaView();
                    }
                    return;
                }

                // Mostrar botão de limpar se há texto
                if (term.length > 0) {
                    clearSearchBtn.style.display = 'flex';
                }
            });

            // Event listener para botão de pesquisa (NOVO)
            searchBtn.addEventListener('click', function() {
                const term = searchInput.value.trim();
                if (term.length >= 3) {
                    performSearch(term);
                } else if (term.length > 0) {
                    alert('Digite pelo menos 3 caracteres para pesquisar');
                }
            });

            // Event listener para botão de limpar (X)
            clearSearchBtn.addEventListener('click', function() {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                resetToFamiliaView();
                searchInput.focus();
            });

            // Event listener para Enter
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const term = searchInput.value.trim();
                    if (term.length >= 3) {
                        performSearch(term);
                    } else if (term.length > 0) {
                        alert('Digite pelo menos 3 caracteres para pesquisar');
                    }
                }
            });
        }

        // Realizar pesquisa na API
        async function performSearch(searchTerm) {
            // Permitir pesquisas repetidas - apenas evitar se já está carregando
            if (isLoadingData) {
                console.log('Pesquisa já em andamento - aguarde');
                return;
            }
            
            // Verificar se a URL da API está disponível
            if (!window.urlArtigosPesquisa) {
                console.error('URL da API de pesquisa não está definida');
                showSearchError();
                return;
            }
            
            // Salvar família atual antes de pesquisar (se não estivermos já pesquisando)
            if (!isSearching && currentFamiliaId) {
                lastSelectedFamilia = { 
                    id: currentFamiliaId, 
                    name: currentFamiliaName 
                };
            }
            
            currentSearchTerm = searchTerm;
            isSearching = true;

            try {
                // Mostrar loading durante pesquisa
                showLoadingSpinner();
                
                // Construir URL da pesquisa corretamente
                const searchUrl = window.urlArtigosPesquisa + encodeURIComponent(searchTerm) + '/';
                console.log('Pesquisando em:', searchUrl);
                
                // Fazer requisição para API de pesquisa
                const response = await fetch(searchUrl);
                
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
                }

                const searchResults = await response.json();
                console.log('Resultados da pesquisa:', searchResults);
                
                // Filtrar resultados inválidos (quando API retorna erro de "não encontrado")
                let validResults = [];
                if (Array.isArray(searchResults)) {
                    validResults = searchResults.filter(artigo => {
                        // Verificar se é um resultado válido ou mensagem de erro da API
                        if (!artigo || typeof artigo !== 'object') return false;
                        
                        // Se o artigo tem "Pesquisa" como código e descrição contém "Não foi encontrado"
                        if (artigo.Artigo === 'Pesquisa' && 
                            artigo.Descricao && 
                            artigo.Descricao.includes('Não foi encontrado')) {
                            return false; // Não é um resultado válido, é uma mensagem de erro
                        }
                        
                        // Se todos os campos importantes são nulos/vazios, também não é válido
                        if (!artigo.Descricao || 
                            artigo.Descricao.trim() === '' ||
                            (artigo.NomeMarca === null && artigo.NomeModelo === null && !artigo.Artigo)) {
                            return false;
                        }
                        
                        return true; // É um resultado válido
                    });
                }
                
                // Atualizar dados com resultados válidos da pesquisa
                artigos = validResults;
                artigosFiltrados = artigos;
                currentFamiliaId = null; // Limpar família atual (estamos pesquisando)
                currentPage = 1;
                totalPages = Math.ceil(artigosFiltrados.length / PAGINATION_SIZE) || 1;

                console.log(`Pesquisa por "${searchTerm}" retornou ${artigosFiltrados.length} resultados`);

                // Atualizar interface
                updateCatalogHeader(`Pesquisa: "${searchTerm}"`);
                renderCatalogPage();
                updateSidebarForSearch();

                // Fazer scroll para o catálogo
                scrollToCatalogTop();

            } catch (error) {
                console.error('Erro na pesquisa:', error);
                showSearchError();
            } finally {
                hideLoadingSpinner();
                // Não resetar isSearching aqui - mantemos até limpar a pesquisa
            }
        }

        // Resetar para visualização por família
        function resetToFamiliaView() {
            currentSearchTerm = '';
            isSearching = false;
            
            // Voltar para a última família selecionada
            const familiaToRestore = lastSelectedFamilia;
            
            if (familiaToRestore && familiaToRestore.id) {
                currentFamiliaId = familiaToRestore.id;
                currentFamiliaName = familiaToRestore.name;
                
                // Recarregar produtos da família
                fetchArtigosPorFamilia(currentFamiliaId).then(artigosData => {
                    if (Array.isArray(artigosData)) {
                        artigos = artigosData;
                        artigosFiltrados = artigos;
                        currentPage = 1;
                        totalPages = Math.ceil(artigosFiltrados.length / PAGINATION_SIZE) || 1;
                        
                        // Atualizar interface
                        updateCatalogHeader();
                        renderCatalogPage();
                        // Garantir que a seleção visual seja atualizada
                        setTimeout(() => {
                            updateSidebarSelection();
                        }, 100);
                        
                        console.log(`✅ Voltou para família: ${currentFamiliaName}`);
                    }
                }).catch(error => {
                    console.error('Erro ao voltar para família:', error);
                    // Se falhar, voltar para família padrão
                    loadDefaultFamily();
                });
            } else {
                // Se não temos família salva, voltar para família padrão
                loadDefaultFamily();
            }
        }
        
        // Carregar família padrão (fallback)
        function loadDefaultFamily() {
            const defaultFamiliaId = '1000';
            const defaultFamilia = familias.find(f => 
                String(f.Id || f.ID || f.id || f.FamiliaId || f.MarcaId || f.ID_Marca) === defaultFamiliaId
            );

            if (defaultFamilia) {
                currentFamiliaId = defaultFamiliaId;
                currentFamiliaName = defaultFamilia.Nome || defaultFamilia.Descricao || defaultFamilia.nome || defaultFamilia.descricao || 'Alternadores';
                
                // Recarregar produtos da família
                fetchArtigosPorFamilia(currentFamiliaId).then(artigosData => {
                    artigos = Array.isArray(artigosData) ? artigosData : [];
                    artigosFiltrados = artigos;
                    currentPage = 1;
                    totalPages = Math.ceil(artigosFiltrados.length / PAGINATION_SIZE) || 1;
                    
                    updateCatalogHeader();
                    renderCatalogPage();
                    updateSidebarSelection();
                }).catch(error => {
                    console.error('Erro ao resetar para família:', error);
                });
            }
        }

        // Atualizar sidebar para modo de pesquisa
        function updateSidebarForSearch() {
            // Remover seleção ativa de todas as famílias
            const familyItems = familiesList.querySelectorAll('.family-item');
            familyItems.forEach(item => {
                item.classList.remove('active');
            });

            // Adicionar indicador de pesquisa ativa (opcional)
            // Você pode adicionar uma mensagem na sidebar indicando que está em modo de pesquisa
        }

        // Atualizar seleção da sidebar
        function updateSidebarSelection() {
            if (!familiesList) return;
            const familyItems = familiesList.querySelectorAll('.family-item');
            familyItems.forEach(item => {
                const itemId = item.getAttribute('data-familia-id');
                if (String(itemId) === String(currentFamiliaId)) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // Mostrar erro de pesquisa
        function showSearchError() {
            if (!catalogGrid) return;
            
            catalogGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #6b7280;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem; display: block;"></i>
                    <h3 style="color: #374151; margin-bottom: 0.5rem; font-weight: 600;">Erro na pesquisa</h3>
                    <p style="margin-bottom: 1rem; color: #9ca3af;">Não foi possível realizar a pesquisa. Verifique sua conexão e tente novamente.</p>
                    <button class="btn btn-primary" onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: #1a365d; color: white; border: none; border-radius: 8px; cursor: pointer;">Recarregar página</button>
                </div>
            `;
        }

        // Inicialização
        function inicializarCatalogo() {
            showInitialLoading();
            
            // Verificar se as URLs da API estão disponíveis
            if (!window.urlArtigosPesquisa) {
                console.warn('URL da API de pesquisa não está definida. Funcionalidade de pesquisa pode não funcionar.');
            } else {
                console.log('API de pesquisa configurada:', window.urlArtigosPesquisa);
            }
            
            // Carregar famílias primeiro
            updateInitialLoadingStep('step-families');
            fetchFamilias().then(familiasData => {
                familias = Array.isArray(familiasData) ? familiasData : [];
                updateInitialLoadingStep('step-families', true);
                
                // Renderizar famílias assim que carregarem
                renderFamiliasSidebar();
                
                // Depois carregar produtos
                updateInitialLoadingStep('step-products');
                return fetchArtigosPorFamilia(currentFamiliaId);
            }).then(artigosData => {
                artigos = Array.isArray(artigosData) ? artigosData : [];
                artigosFiltrados = artigos;
                updateInitialLoadingStep('step-products', true);
                
                // Encontra o nome da família padrão
                const familiaAtual = familias.find(f => 
                    String(f.Id || f.ID || f.id || f.FamiliaId || f.MarcaId || f.ID_Marca) === String(currentFamiliaId)
                );
                if (familiaAtual) {
                    currentFamiliaName = familiaAtual.Nome || familiaAtual.Descricao || familiaAtual.nome || familiaAtual.descricao || 'Alternadores';
                }
                
                totalPages = Math.ceil(artigosFiltrados.length / PAGINATION_SIZE) || 1;
                currentPage = 1;
                
                // Pequena pausa para mostrar as etapas concluídas e transição suave
                setTimeout(() => {
                    hideInitialLoading();
                    updateCatalogHeader();
                    renderCatalogPage();
                    
                    // Inicializar funcionalidade de pesquisa
                    initializeSearchListeners();
                }, 800);
                
            }).catch(error => {
                console.error('Erro ao carregar catálogo:', error);
                hideInitialLoading();
                catalogGrid.innerHTML = `
                    <div class="error-container">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao carregar catálogo</h3>
                        <p>Tente recarregar a página</p>
                    </div>
                `;
            });
        }
        inicializarCatalogo();

    });

    // Função para redirecionar corretamente para a seção de contactos
    function redirectToContactsPage() {
        window.location.href = 'index.html#contactos';
        // Aguardar um pouco e fazer scroll para garantir que a âncora funciona
        setTimeout(() => {
            if (window.location.pathname.includes('index.html') && window.location.hash === '#contactos') {
                const contactSection = document.getElementById('contactos');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 100);
    }