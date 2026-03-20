/**
 * Auto Barros API Client
 * Gestão centralizada de comunicação com a API
 */

const API_BASE_URL = 'http://autobarrossede.ddns.net/api/Portal/';
const API_IMAGE_URL = 'http://autobarrossede.ddns.net/api/Image/Image/';
const DEFAULT_IMAGE = 'http://autobarrossede.ddns.net/api/Image/Image/132924/';

class AutoBarrosAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    async fetchWithCache(url, cacheKey) {
        // Verificar cache
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
            // Retornar cache antigo se disponível
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey).data;
            }
            throw error;
        }
    }

    normalizeMarca(marca) {
        if (!marca || typeof marca !== 'object') {
            return marca;
        }

        return {
            ...marca,
            ID: marca.ID || marca.Id || marca.id || '',
            Id: marca.Id || marca.ID || marca.id || '',
            Descricao: marca.Descricao || marca.descricao || marca.Nome || marca.nome || '',
            Nome: marca.Nome || marca.nome || marca.Descricao || marca.descricao || ''
        };
    }

    normalizeArtigo(artigo) {
        if (!artigo || typeof artigo !== 'object') {
            return artigo;
        }

        return {
            ...artigo,
            Artigo: artigo.Artigo || artigo.artigo || '',
            Imagem: artigo.Imagem || artigo.imagem || '',
            Descricao: artigo.Descricao || artigo.descricao || '',
            Marca: artigo.Marca || artigo.marca || '',
            NomeMarca: artigo.NomeMarca || artigo.nomeMarca || '',
            Modelo: artigo.Modelo || artigo.modelo || '',
            NomeModelo: artigo.NomeModelo || artigo.nomeModelo || '',
            Artigo_Grupo: artigo.Artigo_Grupo || artigo.artigo_Grupo || '',
            ImageUrl: artigo.ImageUrl || artigo.imageUrl || '',
            ArtigoPesquisa: artigo.ArtigoPesquisa || artigo.artigoPesquisa || ''
        };
    }

    async getMarcas() {
        const data = await this.fetchWithCache(API_BASE_URL + 'Marcas/', 'marcas');
        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(marca => this.normalizeMarca(marca));
    }

    async getArtigosPorMarca(marcaId) {
        const data = await this.fetchWithCache(
            `${API_BASE_URL}ArtigosMarca/${marcaId}`, 
            `artigos_marca_${marcaId}`
        );

        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(artigo => this.normalizeArtigo(artigo));
    }

    async getArtigosDestaque() {
        const data = await this.fetchWithCache(
            API_BASE_URL + 'ArtigosDestaque', 
            'artigos_destaque'
        );

        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(artigo => this.normalizeArtigo(artigo));
    }

    async searchArtigos(termo) {
        if (!termo || termo.length < 3) {
            throw new Error('Termo de pesquisa deve ter pelo menos 3 caracteres');
        }
        const data = await this.fetchWithCache(
            `${API_BASE_URL}ArtigosPesquisa/${encodeURIComponent(termo)}/`, 
            `pesquisa_${termo}`
        );

        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(artigo => this.normalizeArtigo(artigo));
    }

    getImageURL(imagem) {
        // Se não tem imagem, usar default
        if (!imagem || imagem === null || imagem === undefined || imagem === '' || imagem === 'undefined') {
            return DEFAULT_IMAGE;
        }
        
        // Se já é URL completa
        if (typeof imagem === 'string' && imagem.startsWith('http')) {
            return imagem;
        }
        
        // Se tem extensão de arquivo
        if (typeof imagem === 'string' && imagem.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return API_IMAGE_URL + imagem;
        }
        
        // Para números
        if (typeof imagem === 'number') {
            return `${API_IMAGE_URL}${imagem}/`;
        }
        
        // Para strings (IDs) - garantir que termina com /
        if (typeof imagem === 'string' && imagem.length > 0) {
            const cleanId = imagem.replace(/\/$/, '');
            return `${API_IMAGE_URL}${cleanId}/`;
        }
        
        return DEFAULT_IMAGE;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Instância global
const api = new AutoBarrosAPI();
