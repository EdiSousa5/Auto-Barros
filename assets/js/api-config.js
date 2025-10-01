// Auto Barros API Configuration - Sistema Refatorado
// Configuração das APIs para integração com o sistema da Auto Barros

// URLs das APIs - Baseado nas especificações originais
if (!window.urlMarcas) window.urlMarcas = "http://autobarrossede.ddns.net/api/Portal/Marcas/";  // Na verdade são FAMÍLIAS
if (!window.urlArtigos) window.urlArtigos = "http://autobarrossede.ddns.net/api/Portal/ArtigosMarca/";
if (!window.urlArtigosDestaque) window.urlArtigosDestaque = "http://autobarrossede.ddns.net/api/Portal/ArtigosDestaque";
if (!window.urlArtigosPesquisa) window.urlArtigosPesquisa = "http://autobarrossede.ddns.net/api/Portal/ArtigosPesquisa/";  // Pesquisa por nome/descrição
if (!window.urlImage) window.urlImage = "http://autobarrossede.ddns.net/api/Image/Image/";

// Configurações do sistema
const CONFIG = {
    HOMEPAGE_ITEMS: 9,          // 9 produtos em destaque na página inicial
    CATALOG_ITEMS_PER_PAGE: 24, // 24 produtos por página no catálogo
    MIN_SEARCH_LENGTH: 3,       // Mínimo de 3 caracteres para pesquisa
    CACHE_DURATION: 5 * 60 * 1000  // Cache por 5 minutos
};

// Função para construir URL de imagem com tratamento robusto
// Função para construir URL de imagem com tratamento robusto
function buildImageUrl(image) {
    // Se vier um URL completo, retorna direto
    if (typeof image === 'string' && image.startsWith('http')) {
        return image;
    }
    // Se vier um nome de ficheiro (ex: CA1458IR.jpg), retorna endpoint da API
    if (typeof image === 'string' && image.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return urlImage + image;
    }
    // Se vier um código de artigo (ex: CA-1458), retorna endpoint da API
    if (typeof image === 'string' && image.length > 0) {
        return urlImage + image + '/';
    }
    // Se vier um número (ImagemId), retorna endpoint da API
    if (typeof image === 'number' && image > 0) {
        return urlImage + image;
    }
    // Fallback para imagem padrão da API
    return 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
}

// Função para fazer requisições com cache e tratamento de erros
async function apiRequest(url, cacheKey = null) {
    try {
        // Verificar cache se fornecida chave
        if (cacheKey) {
            const cached = localStorage.getItem(`autobarros_${cacheKey}`);
            if (cached) {
                const data = JSON.parse(cached);
                const now = Date.now();
                // Cache válido por tempo configurado
                if (now - data.timestamp < CONFIG.CACHE_DURATION) {
                    console.log(`✅ Dados carregados do cache: ${cacheKey}`);
                    return data.content;
                }
            }
        }

        console.log(`🔄 Fazendo requisição para: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Guardar no cache se fornecida chave
        if (cacheKey && data) {
            localStorage.setItem(`autobarros_${cacheKey}`, JSON.stringify({
                content: data,
                timestamp: Date.now()
            }));
            console.log(`💾 Dados salvos no cache: ${cacheKey}`);
        }
        
        return data || [];
    } catch (error) {
        console.error('❌ Erro na requisição API:', error);
        
        // Tentar carregar do cache em caso de erro
        if (cacheKey) {
            const cached = localStorage.getItem(`autobarros_${cacheKey}`);
            if (cached) {
                console.log('⚠️ A carregar dados expirados do cache devido a erro');
                return JSON.parse(cached).content;
            }
        }
        
        throw error;
    }
}

// Limpar cache quando necessário
function clearApiCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('autobarros_')) {
            localStorage.removeItem(key);
        }
    });
    console.log('🗑️ Cache da API limpo');
}

// Exportar para uso global (apenas se ainda não existir)
if (typeof window !== 'undefined') {
    if (!window.CONFIG) window.CONFIG = CONFIG;
    if (!window.buildImageUrl) window.buildImageUrl = buildImageUrl;
    if (!window.apiRequest) window.apiRequest = apiRequest;
    if (!window.clearApiCache) window.clearApiCache = clearApiCache;
}
