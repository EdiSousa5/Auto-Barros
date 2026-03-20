
if (!window.urlMarcas) window.urlMarcas = "http://autobarrossede.ddns.net/api/Portal/Marcas/";  // Na verdade são FAMÍLIAS
if (!window.urlArtigos) window.urlArtigos = "http://autobarrossede.ddns.net/api/Portal/ArtigosMarca/";
if (!window.urlArtigosDestaque) window.urlArtigosDestaque = "http://autobarrossede.ddns.net/api/Portal/ArtigosDestaque";
if (!window.urlArtigosPesquisa) window.urlArtigosPesquisa = "http://autobarrossede.ddns.net/api/Portal/ArtigosPesquisa/";  // Pesquisa por nome/descrição
if (!window.urlImage) window.urlImage = "http://autobarrossede.ddns.net/api/Image/Image/";

const CONFIG = {
    HOMEPAGE_ITEMS: 9,          // 9 produtos em destaque na página inicial
    CATALOG_ITEMS_PER_PAGE: 24, // 24 produtos por página no catálogo
    MIN_SEARCH_LENGTH: 3,       // Mínimo de 3 caracteres para pesquisa
    CACHE_DURATION: 5 * 60 * 1000  // Cache por 5 minutos
};

function buildImageUrl(image) {
    if (typeof image === 'string' && image.startsWith('http')) {
        return image;
    }
    if (typeof image === 'string' && image.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return urlImage + image;
    }
    if (typeof image === 'string' && image.length > 0) {
        return urlImage + image + '/';
    }
    if (typeof image === 'number' && image > 0) {
        return urlImage + image;
    }
    return 'http://autobarrossede.ddns.net/api/Image/Image/132924/';
}

async function apiRequest(url, cacheKey = null) {
    try {
        if (cacheKey) {
            const cached = localStorage.getItem(`autobarros_${cacheKey}`);
            if (cached) {
                const data = JSON.parse(cached);
                const now = Date.now();
                if (now - data.timestamp < CONFIG.CACHE_DURATION) {
                    return data.content;
                }
            }
        }


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
        
        if (cacheKey && data) {
            localStorage.setItem(`autobarros_${cacheKey}`, JSON.stringify({
                content: data,
                timestamp: Date.now()
            }));
        }
        
        return data || [];
    } catch (error) {
        console.error('❌ Erro na requisição API:', error);
        
        if (cacheKey) {
            const cached = localStorage.getItem(`autobarros_${cacheKey}`);
            if (cached) {
                return JSON.parse(cached).content;
            }
        }
        
        throw error;
    }
}

function clearApiCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('autobarros_')) {
            localStorage.removeItem(key);
        }
    });
}

if (typeof window !== 'undefined') {
    if (!window.CONFIG) window.CONFIG = CONFIG;
    if (!window.buildImageUrl) window.buildImageUrl = buildImageUrl;
    if (!window.apiRequest) window.apiRequest = apiRequest;
    if (!window.clearApiCache) window.clearApiCache = clearApiCache;
}
