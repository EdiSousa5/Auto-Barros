// Auto Barros - Modern Website JavaScript

// Auto Barros - Modern Website JavaScript

document.addEventListener("DOMContentLoaded", function () {
  console.log("=== AUTO BARROS - INICIALIZAÇÃO ===");

  // Initialize core functionality
  console.log("Chamando initNavigation...");
  initNavigation();

  console.log("Chamando initScrollEffects...");
  initScrollEffects();

  // Initialize mobile menu
  initMobileMenu();

  if (typeof initFormHandling === "function") {
    initFormHandling();
  }
  if (typeof initAnimations === "function") {
    initAnimations();
  }

  // Initialize Brands Carousel
  if (document.getElementById("brandsTrack")) {
    window.brandsCarousel = new BrandsCarousel();
  }

  // Função para buscar e mostrar o JSON da API /api/Portal/Marcas/ na caixa de texto
  const textarea = document.getElementById("familias-json");
  if (textarea) {
    fetch("http://autobarrossede.ddns.net/api/Portal/Marcas/")
      .then((resp) => resp.json())
      .then((data) => {
        textarea.value = JSON.stringify(data, null, 2);
      })
      .catch((err) => {
        textarea.value = "Erro ao carregar dados da API.";
      });
  }

  // --- NOVA LÓGICA UNIFICADA PARA O CATÁLOGO DE ARTIGOS ---
  const catalogGrid = document.getElementById("catalog-marca-1000");
  const PAGINATION_SIZE = 12;
  let artigosCatalogo = [];
  let currentPage = 1;
  let totalPages = 1;
  let isLoading = false;

  function getImageUrlFromArtigo(artigo) {
    if (
      artigo.ImageUrl &&
      artigo.ImageUrl !== "undefined" &&
      artigo.ImageUrl !== ""
    ) {
      return artigo.ImageUrl;
    } else if (
      window.autoBarrosAPI &&
      typeof autoBarrosAPI.getImageURL === "function"
    ) {
      if (artigo.ImagemId) return autoBarrosAPI.getImageURL(artigo.ImagemId);
      if (artigo.Imagem) return autoBarrosAPI.getImageURL(artigo.Imagem);
    } else if (window.buildImageUrl && (artigo.ImagemId || artigo.Imagem)) {
      return buildImageUrl(artigo.ImagemId || artigo.Imagem);
    }
    return "http://autobarrossede.ddns.net/api/Image/Image/132924/";
  }

  function showCatalogLoadingSpinner(percent = 0) {
    if (!catalogGrid) return;
    let spinner = catalogGrid.querySelector(".catalog-loading-spinner");
    if (!spinner) {
      catalogGrid.innerHTML = "";
      spinner = document.createElement("div");
      spinner.className = "catalog-loading-spinner";
      spinner.innerHTML = `
                <div class="loading-visual">
                    <div class="spinner"></div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${percent}%"></div></div>
                    <div class="progress-label">${percent}%</div>
                </div>
            `;
      spinner.style.position = "absolute";
      spinner.style.top = "0";
      spinner.style.left = "0";
      spinner.style.width = "100%";
      spinner.style.height = "100%";
      spinner.style.background = "rgba(255,255,255,0.7)";
      spinner.style.display = "flex";
      spinner.style.alignItems = "center";
      spinner.style.justifyContent = "center";
      spinner.style.zIndex = "10";
      catalogGrid.style.position = "relative";
      catalogGrid.appendChild(spinner);
    } else {
      spinner.style.display = "flex";
      let fill = spinner.querySelector(".progress-bar-fill");
      let label = spinner.querySelector(".progress-label");
      if (fill) fill.style.width = percent + "%";
      if (label) label.textContent = percent + "%";
    }
    // Esconde paginação enquanto carrega
    let pagination = document.getElementById("catalog-pagination");
    if (pagination) {
      pagination.style.pointerEvents = "none";
      pagination.style.opacity = "0.5";
    }
    isLoading = true;
  }

  function hideCatalogLoadingSpinner() {
    if (!catalogGrid) return;
    let spinner = catalogGrid.querySelector(".catalog-loading-spinner");
    if (spinner) spinner.style.display = "none";
    let pagination = document.getElementById("catalog-pagination");
    if (pagination) {
      pagination.style.pointerEvents = "";
      pagination.style.opacity = "";
    }
    isLoading = false;
  }

  function renderPagination() {
    const paginationContainerId = "catalog-pagination";
    let paginationContainer = document.getElementById(paginationContainerId);
    if (!paginationContainer) {
      paginationContainer = document.createElement("div");
      paginationContainer.id = paginationContainerId;
      paginationContainer.className = "catalog-pagination";
      catalogGrid.parentNode.appendChild(paginationContainer);
    }
    paginationContainer.innerHTML = "";
    if (totalPages <= 1) {
      paginationContainer.style.display = "none";
      return;
    }
    paginationContainer.style.display = isLoading ? "none" : "";

    // Botão Anterior (apenas uma seta)
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.innerHTML = "‹";
    prevBtn.title = "Página anterior";
    prevBtn.disabled = currentPage === 1 || isLoading;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        scrollToCatalogTop();
        renderCatalogPage();
      }
    };
    paginationContainer.appendChild(prevBtn);

    // Números de página (sempre 5 páginas visíveis)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Ajustar startPage se não temos páginas suficientes no final
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement("button");
      btn.className = "pagination-btn" + (i === currentPage ? " active" : "");
      btn.textContent = i;
      btn.disabled = isLoading;
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
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.className = "pagination-ellipsis";
      paginationContainer.appendChild(ellipsis);
    }

    // Botão da última página
    if (totalPages > endPage) {
      const lastPageBtn = document.createElement("button");
      lastPageBtn.className =
        "pagination-btn pagination-last-number" +
        (currentPage === totalPages ? " active" : "");
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
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.innerHTML = "›";
    nextBtn.title = "Próxima página";
    nextBtn.disabled = currentPage === totalPages || isLoading;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        scrollToCatalogTop();
        renderCatalogPage();
      }
    };
    paginationContainer.appendChild(nextBtn);
  }

  // Função para fazer scroll suave para o topo do catálogo
  function scrollToCatalogTop() {
    const catalogSection =
      document.querySelector(".catalog-section") ||
      document.querySelector(".simple-catalog-header");
    if (catalogSection) {
      const offsetTop = catalogSection.offsetTop - 80; // 80px de margem para o header
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  }

  function renderCatalogPage() {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = "";
    if (!Array.isArray(artigosCatalogo) || artigosCatalogo.length === 0) {
      catalogGrid.innerHTML = `
                <div class="no-results" style="
                    text-align: center; 
                    padding: 4rem 2rem; 
                    color: #64748b;
                    background: #f8fafc;
                    border-radius: 12px;
                    margin: 2rem 0;
                ">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem; display: block;"></i>
                    <h3>Nenhum artigo encontrado</h3>
                    <p>Esta família não tem produtos disponíveis no momento.</p>
                </div>
            `;
      renderPagination();
      return;
    }
    const start = (currentPage - 1) * PAGINATION_SIZE;
    const end = start + PAGINATION_SIZE;
    const artigosPage = artigosCatalogo.slice(start, end);
    artigosPage.forEach((artigo) => {
      const imageUrl = getImageUrlFromArtigo(artigo);
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
                <div class="product-image">
                    <img src="${imageUrl}" alt="${
        artigo.Descricao || ""
      }" loading="lazy" onerror="this.src='http://autobarrossede.ddns.net/api/Image/Image/132924/';this.onerror=null;">
                    <div class="product-badge">${
                      artigo.NomeMarca || "Produto"
                    }</div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${
                      artigo.Descricao || "Sem descrição"
                    }</h3>
                    <p class="product-reference"><strong>Artigo:</strong> ${
                      artigo.Artigo || "N/A"
                    }</p>
                </div>
            `;
      catalogGrid.appendChild(card);
    });
    renderPagination();
  }

  // Carregar artigos iniciais (família 1000)
  function loadInitialCatalog() {
    showCatalogLoadingSpinner(0);
    fetch("http://autobarrossede.ddns.net/api/Portal/ArtigosMarca/1000")
      .then((resp) => {
        // Simular progresso
        let percent = 0;
        const interval = setInterval(() => {
          percent += 10;
          if (percent > 90) percent = 90;
          showCatalogLoadingSpinner(percent);
        }, 80);
        return resp.json().then((data) => {
          clearInterval(interval);
          showCatalogLoadingSpinner(100);
          setTimeout(() => {
            hideCatalogLoadingSpinner();
            artigosCatalogo = Array.isArray(data) ? data : [];
            currentPage = 1;
            totalPages = Math.ceil(artigosCatalogo.length / PAGINATION_SIZE);
            renderCatalogPage();
          }, 250);
        });
      })
      .catch((err) => {
        hideCatalogLoadingSpinner();
        catalogGrid.innerHTML = `<div class='error-container'><i class='fas fa-exclamation-triangle'></i> Erro ao carregar artigos.</div>`;
        let paginationContainer = document.getElementById("catalog-pagination");
        if (paginationContainer) paginationContainer.style.display = "none";
      });
  }

  if (catalogGrid) {
    loadInitialCatalog();
  }
});

// ===== BRANDS CAROUSEL FUNCTIONALITY =====
class BrandsCarousel {
  constructor() {
    this.track = document.getElementById("brandsTrack");
    this.currentIndex = 0;
    this.animationSpeed = 0.5; // pixels por frame
    this.isPaused = false;
    this.animationId = null;
    this.brands = [
      {
        id: "001",
        name: "Bosch",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/001.jpg",
      },
      {
        id: "004",
        name: "Valeo",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/004.jpg",
      },
      {
        id: "005",
        name: "Magneti Marelli",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/005.jpg",
      },
      {
        id: "008",
        name: "Lucas",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/008.jpg",
      },
      {
        id: "020",
        name: "Hella",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/020.jpg",
      },
      {
        id: "022",
        name: "Mahle",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/022.jpg",
      },
      {
        id: "024",
        name: "Febi",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/024.jpg",
      },
      {
        id: "035",
        name: "Gates",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/035.jpg",
      },
      {
        id: "041",
        name: "Continental",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/041.jpg",
      },
      {
        id: "042",
        name: "Schaeffler",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/042.jpg",
      },
      {
        id: "045",
        name: "Dayco",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/045.jpg",
      },
      {
        id: "048",
        name: "Mann Filter",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/048.jpg",
      },
      {
        id: "053",
        name: "SKF",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/053.jpg",
      },
      {
        id: "055",
        name: "Lemförder",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/055.jpg",
      },
      {
        id: "056",
        name: "Sachs",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/056.jpg",
      },
      {
        id: "061",
        name: "Brembo",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/061.jpg",
      },
      {
        id: "080",
        name: "NGK",
        url: "http://www.autobarros-acessorios.pt/images/aba/familias/080.jpg",
      },
    ];

    this.init();
  }

  init() {
    if (!this.track) {
      console.error("❌ Elemento brandsTrack não encontrado");
      return;
    }
    console.log("🎠 Inicializando brands carousel...");
    this.renderBrands();
    this.setupEventListeners();
    this.startAnimation();
  }

  renderBrands() {
    // Criar três conjuntos de marcas para loop infinito perfeito
    const allBrands = [...this.brands, ...this.brands, ...this.brands];

    this.track.innerHTML = allBrands
      .map(
        (brand) => `
            <div class="brand-item">
                <img src="${brand.url}" 
                     alt="${brand.name}" 
                     title="${brand.name}"
                     loading="lazy"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display:none; align-items:center; justify-content:center; width:100%; height:100%; background:#f8fafc; color:#64748b; font-weight:600; font-size:0.9rem;">
                    ${brand.name}
                </div>
            </div>
        `
      )
      .join("");

    // Remover a animação CSS e usar JavaScript
    this.track.style.animation = "none";
    this.track.style.transform = "translateX(0px)";

    // Calcular largura de um conjunto de marcas
    setTimeout(() => {
      const firstBrandItem = this.track.querySelector(".brand-item");
      if (firstBrandItem) {
        const itemWidth = firstBrandItem.offsetWidth;
        const gap = parseFloat(getComputedStyle(this.track).gap) || 48; // 3rem = 48px
        this.oneSetWidth = (itemWidth + gap) * this.brands.length;
        console.log(
          "✅ Brands carousel renderizado. Largura de um conjunto:",
          this.oneSetWidth
        );
      }
    }, 100);
  }

  startAnimation() {
    let translateX = 0;

    const animate = () => {
      if (!this.isPaused && this.oneSetWidth) {
        translateX -= this.animationSpeed;

        // Quando completamos um conjunto, resetamos para o início sem ser visível
        if (Math.abs(translateX) >= this.oneSetWidth) {
          translateX = 0;
        }

        this.track.style.transform = `translateX(${translateX}px)`;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  setupEventListeners() {
    if (this.track) {
      this.track.addEventListener("mouseenter", () => {
        this.isPaused = true;
      });
      this.track.addEventListener("mouseleave", () => {
        this.isPaused = false;
      });
    }

    // Parar animação quando a página não está visível
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.isPaused = true;
      } else {
        this.isPaused = false;
      }
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Navigation functionality
function initNavigation() {
  console.log("=== INICIANDO NAVEGAÇÃO ===");

  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  console.log("Elementos encontrados:", {
    navLinks: navLinks.length,
    sections: sections.length,
  });

  // Active link highlighting ao fazer scroll
  function highlightActiveLink() {
    const scrollPosition = window.scrollY + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (
            link.getAttribute("href") === `#${sectionId}` ||
            link.getAttribute("href") === `index.html#${sectionId}`
          ) {
            link.classList.add("active");
          }
        });
      }
    });
  }

  // Smooth scroll para links internos
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Verificar se é um link interno (âncora)
      if (href.startsWith("#")) {
        e.preventDefault();
        const targetSection = document.querySelector(href);
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });

  // Event listener para scroll
  window.addEventListener("scroll", highlightActiveLink);

  console.log("Navegação inicializada com sucesso");
}

// Smooth scrolling para links internos
navLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href && href.includes("#")) {
      const targetId = href.split("#")[1];
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  });
});

// Active link highlighting
function updateActiveLink() {
  const scrollPosition = window.scrollY + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href").includes(sectionId)) {
          link.classList.add("active");
        }
      });
    }
  });
}

// Atualizar link ativo no scroll
window.addEventListener("scroll", updateActiveLink);
updateActiveLink(); // Executar uma vez no início

function clearFieldError(input) {
  input.style.borderColor = "#e2e8f0";
  const existingError = input.parentNode.querySelector(".field-error");
  if (existingError) {
    existingError.remove();
  }
}

function showFormLoading(isLoading) {
  const submitButton = document.querySelector(
    '.contact .form button[type="submit"]'
  );

  if (isLoading) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading"></span> Enviando...';
  } else {
    submitButton.disabled = false;
    submitButton.innerHTML = "Enviar Mensagem";
  }
}

function showFormSuccess() {
  // Create success message
  const successMessage = document.createElement("div");
  successMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #48bb78;
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        text-align: center;
        font-weight: 500;
    `;
  successMessage.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        Mensagem enviada com sucesso!<br>
        <small>Entraremos em contacto consigo brevemente.</small>
    `;

  document.body.appendChild(successMessage);

  // Remove message after 3 seconds
  setTimeout(() => {
    successMessage.remove();
  }, 3000);
}

// Animations and intersection observer
function initAnimations() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in-up");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animateElements = document.querySelectorAll(`
        .feature-card,
        .product-card,
        .service-card,
        .about-text,
        .about-image,
        .contact-item,
        .section-title,
        .section-subtitle
    `);

  animateElements.forEach((element) => {
    observer.observe(element);
  });

  // Counter animation for statistics
  animateCounters();
}

function animateCounters() {
  const counters = document.querySelectorAll(".stat-number");

  const observerOptions = {
    threshold: 0.5,
  };

  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counters.forEach((counter) => {
    counterObserver.observe(counter);
  });
}

function animateCounter(element) {
  const target = parseInt(element.textContent.replace(/\D/g, ""));
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    // Format number based on original text
    const originalText = element.textContent;
    if (originalText.includes("+")) {
      element.textContent = "+" + Math.floor(current);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Product catalog functionality removed - using async version below

// Product catalog functionality
async function initProductCatalog() {
  const searchInput = document.getElementById("search-products");
  const searchBtn = document.querySelector(".search-btn");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const productsGrid = document.querySelector(".products-grid");

  // Initialize API service if on main page
  if (productsGrid) {
    // Verificar se é a página inicial (com produtos em destaque)
    const featuredContainer = document.getElementById("featured-products");
    if (featuredContainer) {
      // É a página inicial, o HomepageManager já trata dos produtos em destaque
      console.log(
        "ℹ️ Página inicial detectada - HomepageManager irá carregar produtos em destaque"
      );
      return;
    }

    try {
      // Show loading para outras páginas
      productsGrid.innerHTML = `
                <div class="loading-container">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>A carregar produtos...</p>
                </div>
            `;

      // Para outras páginas (não inicial), tentar carregar marcas se a API existir
      if (
        window.autoBarrosAPI &&
        typeof autoBarrosAPI.loadMarcas === "function"
      ) {
        await autoBarrosAPI.loadMarcas();
      }
    } catch (error) {
      console.error("Erro ao inicializar catálogo:", error);
      productsGrid.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar produtos</h3>
                    <p>Tente novamente mais tarde.</p>
                    <button class="btn btn-primary" onclick="initProductCatalog()">Tentar Novamente</button>
                </div>
            `;
    }
  }

  // Search function with API integration
  const searchProducts = () => {
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();

    if (searchTerm.length >= 3) {
      // Use API search if available
      if (
        window.autoBarrosAPI &&
        typeof autoBarrosAPI.searchArtigos === "function"
      ) {
        autoBarrosAPI.searchArtigos(searchTerm);
      }
    } else if (searchTerm.length === 0) {
      // Return to default state - let homepage manager handle this for home page
      const featuredContainer = document.getElementById("featured-products");
      if (featuredContainer && window.homepageManager) {
        // É página inicial, deixar o HomepageManager tratar
        homepageManager.refresh();
      } else if (
        window.autoBarrosAPI &&
        typeof autoBarrosAPI.loadMarcas === "function"
      ) {
        // Outras páginas, carregar marcas se disponível
        autoBarrosAPI.loadMarcas();
      }
    } else {
      // Fallback to original catalog search for pages without API
      const catalogCategories = document.querySelectorAll(".catalog-category");

      catalogCategories.forEach((category) => {
        const categoryName = category
          .querySelector("h3")
          .textContent.toLowerCase();
        const products = category.querySelectorAll(".product-item");
        let hasVisibleProducts = false;

        products.forEach((product) => {
          const productName = product
            .querySelector("h4")
            .textContent.toLowerCase();
          const productDesc = product
            .querySelector("p")
            .textContent.toLowerCase();

          if (
            productName.includes(searchTerm.toLowerCase()) ||
            productDesc.includes(searchTerm.toLowerCase()) ||
            categoryName.includes(searchTerm.toLowerCase())
          ) {
            product.style.display = "block";
            hasVisibleProducts = true;
          } else {
            product.style.display = "none";
          }
        });

        // Show/hide category based on visible products
        if (hasVisibleProducts && searchTerm) {
          category.classList.remove("hidden");
        } else if (searchTerm) {
          category.classList.add("hidden");
        } else {
          category.classList.remove("hidden");
          products.forEach((product) => {
            product.style.display = "block";
          });
        }
      });
    }
  };

  // Filter by category or brand (API integrated)
  const filterByCategory = (categoryFilter) => {
    if (categoryFilter === "all") {
      // Load featured products on home page, or default view on other pages
      const featuredContainer = document.getElementById("featured-products");
      if (featuredContainer && window.homepageManager) {
        homepageManager.refresh();
      } else if (
        window.autoBarrosAPI &&
        typeof autoBarrosAPI.loadMarcas === "function"
      ) {
        autoBarrosAPI.loadMarcas();
      }
    } else if (categoryFilter === "marcas") {
      // Load brands if API available
      if (
        window.autoBarrosAPI &&
        typeof autoBarrosAPI.loadMarcas === "function"
      ) {
        autoBarrosAPI.loadMarcas();
      }
    } else {
      // Try to find a brand with this filter
      if (window.autoBarrosAPI && autoBarrosAPI.marcas) {
        const marca = autoBarrosAPI.marcas.find((m) =>
          m.Descricao.toLowerCase().includes(categoryFilter.toLowerCase())
        );

        if (marca) {
          autoBarrosAPI.loadArtigosPorMarca(marca.ID, marca.Descricao);
        } else {
          // Fallback to static category filtering
          const catalogCategories =
            document.querySelectorAll(".catalog-category");
          catalogCategories.forEach((category) => {
            const categoryData = category.getAttribute("data-category");

            if (categoryFilter === "all" || categoryData === categoryFilter) {
              category.classList.remove("hidden");
              category.style.display = "block";
            } else {
              category.classList.add("hidden");
              category.style.display = "none";
            }
          });
        }
      }
    }
  };

  // Search event listeners
  if (searchInput) {
    searchInput.addEventListener("input", searchProducts);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchProducts();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      searchProducts();
    });
  }

  // Filter tabs event listeners
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      filterTabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");

      // Get filter value
      const filter = tab.dataset.filter;

      // Clear search when filtering
      if (searchInput) {
        searchInput.value = "";
      }

      // Apply filter
      filterByCategory(filter);
    });
  });

  // Product animations on scroll
  const animateProducts = () => {
    const products = document.querySelectorAll(".product-item");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    products.forEach((product) => {
      product.style.opacity = "0";
      product.style.transform = "translateY(30px)";
      product.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(product);
    });
  };

  // Initialize product animations if on catalog page
  if (document.querySelector(".catalog-category")) {
    animateProducts();
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Performance optimization
window.addEventListener(
  "scroll",
  debounce(function () {
    // Optimized scroll handling
  }, 10)
);

// Error handling
window.addEventListener("error", function (e) {
  console.error("JavaScript error:", e.error);
  // You could send error reports to a logging service here
});

// Browser compatibility checks
function checkBrowserSupport() {
  // Check for required features
  if (!window.IntersectionObserver) {
    console.warn("IntersectionObserver not supported. Loading polyfill...");
    // Load polyfill if needed
  }

  if (!window.fetch) {
    console.warn("Fetch API not supported. Loading polyfill...");
    // Load polyfill if needed
  }
}

checkBrowserSupport();

// Cleanup quando a página é descarregada
window.addEventListener("beforeunload", function () {
  if (
    window.brandsCarousel &&
    typeof window.brandsCarousel.destroy === "function"
  ) {
    window.brandsCarousel.destroy();
  }
});

// Enhanced search functionality for API integration
function enhancedSearch() {
  const searchInput = document.getElementById("search-products");
  const searchBtn = document.querySelector(".search-btn");

  if (searchInput && searchBtn) {
    // Handle search button click
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      performAPISearch();
    });

    // Handle enter key in search input
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performAPISearch();
      }
    });
  }
}

function performAPISearch() {
  const searchInput = document.getElementById("search-products");
  const searchTerm = searchInput ? searchInput.value.trim() : "";

  if (searchTerm.length < 3) {
    showNotification(
      "Digite pelo menos 3 caracteres para pesquisar",
      "warning"
    );
    return;
  }

  // Use API search if available
  if (window.catalogManager) {
    catalogManager.searchArtigos(searchTerm);
  }
}

// Enhanced filter functionality for API integration
function enhancedFilterByCategory(category) {
  const filterTabs = document.querySelectorAll(".filter-tab");

  // Update active tab
  filterTabs.forEach((tab) => {
    if (tab.dataset.filter === category) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Use API filter if available
  if (window.catalogManager) {
    if (category === "all") {
      // Para página inicial, usar HomepageManager; para catálogo, usar CatalogManager
      const featuredContainer = document.getElementById("featured-products");
      if (featuredContainer && window.homepageManager) {
        homepageManager.refresh();
      } else {
        catalogManager.filterByCategory(category);
      }
    } else {
      catalogManager.filterByCategory(category);
    }
  } else {
    // Fallback to original functionality
    const categories = document.querySelectorAll(".catalog-category");
    categories.forEach((cat) => {
      if (category === "all" || cat.id === category) {
        cat.classList.remove("hidden");
        cat.style.display = "block";
      } else {
        cat.classList.add("hidden");
        setTimeout(() => {
          cat.style.display = "none";
        }, 300);
      }
    });
  }
}

// Notification system
function showNotification(message, type = "info") {
  // Remove existing notification
  const existing = document.querySelector(".notification-message");
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification-message notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        background: ${getNotificationBg(type)};
        color: ${getNotificationColor(type)};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid ${getNotificationBorder(type)};
        animation: slideInRight 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "check-circle";
    case "warning":
      return "exclamation-triangle";
    case "error":
      return "times-circle";
    default:
      return "info-circle";
  }
}

function getNotificationBg(type) {
  switch (type) {
    case "success":
      return "#f0f9ff";
    case "warning":
      return "#fffbeb";
    case "error":
      return "#fef2f2";
    default:
      return "#f8fafc";
  }
}

function getNotificationColor(type) {
  switch (type) {
    case "success":
      return "#059669";
    case "warning":
      return "#d97706";
    case "error":
      return "#dc2626";
    default:
      return "#1e293b";
  }
}

function getNotificationBorder(type) {
  switch (type) {
    case "success":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "error":
      return "#ef4444";
    default:
      return "#cbd5e1";
  }
}

// Quote request functionality
function requestQuote(productName = "") {
  const subject = productName
    ? `Orçamento para: ${productName}`
    : "Solicitação de Orçamento";
  const body = productName
    ? `Gostaria de solicitar um orçamento para o produto: ${productName}\n\nDetalhes adicionais:\n`
    : "Gostaria de solicitar um orçamento.\n\nDetalhes do produto/serviço:\n";

  const email = "geral@autobarros-acessorios.pt";
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

// Initialize enhanced functionality when APIs are available
if (typeof window !== "undefined") {
  // Make functions globally available
  window.enhancedFilterByCategory = enhancedFilterByCategory;
  window.requestQuote = requestQuote;
  window.showNotification = showNotification;

  // Override original filterByCategory if API is available
  window.filterByCategory = enhancedFilterByCategory;

  // Initialize enhanced search
  document.addEventListener("DOMContentLoaded", enhancedSearch);
}

// Service worker registration (for future PWA implementation)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    // navigator.serviceWorker.register('/sw.js')
    //     .then(function(registration) {
    //         console.log('SW registered: ', registration);
    //     })
    //     .catch(function(registrationError) {
    //         console.log('SW registration failed: ', registrationError);
    //     });
  });
}

// ===== FUNCIONALIDADES MODERNAS E RESPONSIVAS =====

// Responsive Handler
function initResponsiveHandler() {
  // FUNÇÃO COMPLETAMENTE DESATIVADA PARA EVITAR CONFLITOS
  // CSS responsivo controla todos os layouts
  console.log("ResponsiveHandler desativado - CSS controla layouts");
  
  // FORÇA BRUTA: Aplicar CSS via JavaScript para garantir funcionalidade
  function forceResponsiveLayouts() {
    if (window.innerWidth <= 768) {
      // ========== CORREÇÃO DEFINITIVA: PRODUTOS EM DESTAQUE ==========
      // HomepageManager cria: <div id="featured-products"><div class="products-grid featured-grid">CARDS</div></div>
      
      // 1. Container pai = BLOCK (não dividir)
      const featuredContainer = document.querySelector('#featured-products');
      if (featuredContainer) {
        featuredContainer.style.cssText = `
          display: block !important;
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        `;
      }
      
      // 2. Grid interna .products-grid.featured-grid = 2 COLUNAS
      const innerGrid = document.querySelector('div.products-grid.featured-grid');
      
      if (innerGrid) {
        console.log('🎯 APLICANDO 2 COLUNAS em: div.products-grid.featured-grid');
        console.log('📏 Largura da janela:', window.innerWidth);
        console.log('📦 Grid encontrada:', innerGrid);
        
        // MÉTODO 1: Style inline
        innerGrid.style.cssText = `
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 15px !important;
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 10px !important;
          box-sizing: border-box !important;
          margin: 0 auto !important;
        `;
        
        // MÉTODO 2: Atributo style direto (máxima prioridade) - COLUNAS IGUAIS
        innerGrid.setAttribute('style', 
          'display: grid !important; ' +
          'grid-template-columns: repeat(2, minmax(0, 1fr)) !important; ' +
          'grid-auto-columns: 1fr !important; ' +
          'gap: 15px !important; ' +
          'width: 100% !important; ' +
          'padding: 0 10px !important; ' +
          'box-sizing: border-box !important; ' +
          'justify-items: stretch !important;'
        );
        
        // Debug: verificar quantos cards há
        const cards = innerGrid.querySelectorAll('.product-card');
        console.log(`📦 ${cards.length} cards encontrados na grid`);
        
        // Debug: verificar computed style
        const computedStyle = window.getComputedStyle(innerGrid);
        console.log('🎨 Grid template columns atual:', computedStyle.gridTemplateColumns);
        console.log('🎨 Display atual:', computedStyle.display);
      } else {
        console.log('⚠️ div.products-grid.featured-grid NÃO encontrada - aguardando carregamento...');
      }
      
      // Features
      const featuresGrid = document.querySelector('.features .features-grid');
      if (featuresGrid) {
        featuresGrid.style.cssText = `
          grid-template-columns: 1fr 1fr !important;
          gap: 15px !important;
          width: 100% !important;
          padding: 0 10px !important;
          box-sizing: border-box !important;
          display: grid !important;
        `;
      }
      
      // Contactos
      const contactInfo = document.querySelector('.contact-info');
      if (contactInfo) {
        contactInfo.style.cssText = `
          grid-template-columns: 1fr 1fr !important;
          gap: 15px !important;
          width: 100% !important;
          padding: 0 10px !important;
          box-sizing: border-box !important;
          display: grid !important;
        `;
      }
    }
  }
  
  // Executar imediatamente e em resize
  forceResponsiveLayouts();
  window.addEventListener('resize', forceResponsiveLayouts);
  window.addEventListener('orientationchange', () => {
    setTimeout(forceResponsiveLayouts, 100);
  });
  
  // Observador para quando o HomepageManager adicionar a grid
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          // Se adicionou a grid .products-grid.featured-grid
          if (node.classList && node.classList.contains('products-grid') && node.classList.contains('featured-grid')) {
            console.log('🔄 Grid featured-grid detectada! Aplicando 2 colunas...');
            setTimeout(forceResponsiveLayouts, 50);
          }
          // Ou se adicionou dentro de #featured-products
          if (node.querySelector && node.querySelector('.products-grid.featured-grid')) {
            console.log('🔄 Grid featured-grid detectada via querySelector! Aplicando 2 colunas...');
            setTimeout(forceResponsiveLayouts, 50);
          }
        });
      }
    });
  });
  
  // Observar mudanças no #featured-products
  const featuredContainer = document.querySelector('#featured-products');
  if (featuredContainer) {
    observer.observe(featuredContainer, { childList: true, subtree: true });
    console.log('👁️ Observador ativado em #featured-products');
  }
  
  return;
}

// Touch Optimizations
function initTouchOptimizations() {
  // Add touch classes
  if ("ontouchstart" in window) {
    document.body.classList.add("touch-device");

    // Improve touch feedback
    const touchElements = document.querySelectorAll(
      ".btn, .nav-link, .product-card, .family-item"
    );

    touchElements.forEach((element) => {
      element.addEventListener("touchstart", function () {
        this.classList.add("touching");
      });

      element.addEventListener("touchend", function () {
        setTimeout(() => {
          this.classList.remove("touching");
        }, 150);
      });
    });
  }

  // Prevent double-tap zoom on buttons
  const buttons = document.querySelectorAll(".btn, .nav-toggle");
  buttons.forEach((button) => {
    button.addEventListener("touchend", function (e) {
      e.preventDefault();
      e.target.click();
    });
  });
}

// Mobile Menu Hambúrguer - Específico para Index
function initMobileMenu() {
  console.log("=== INICIANDO MENU HAMBÚRGUER MOBILE ===");

  // Verificar se estamos na página index
  if (!document.body.classList.contains('homepage')) {
    console.log("Não é página index - menu hambúrguer não aplicado");
    return;
  }

  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
  const mobileMenuClose = document.querySelector(".mobile-menu-close");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");

  if (!mobileMenuBtn || !mobileMenuOverlay) {
    console.log("Elementos do menu hambúrguer não encontrados");
    return;
  }

  console.log("Menu hambúrguer elementos encontrados:", {
    mobileMenuBtn: !!mobileMenuBtn,
    mobileMenuOverlay: !!mobileMenuOverlay,
    mobileMenuClose: !!mobileMenuClose,
    mobileNavLinks: mobileNavLinks.length,
  });

  // Função para abrir menu
  function openMobileMenu() {
    // Salvar posição atual do scroll
    const scrollY = window.scrollY;
    document.body.dataset.scrollY = scrollY;
    
    mobileMenuBtn.classList.add("active");
    mobileMenuOverlay.classList.add("active");
    document.body.classList.add("mobile-menu-open");
    
    // Manter posição de scroll
    document.body.style.top = `-${scrollY}px`;
    
    console.log("Menu hambúrguer aberto");
  }

  // Função para fechar menu
  function closeMobileMenu() {
    mobileMenuBtn.classList.remove("active");
    mobileMenuOverlay.classList.remove("active");
    document.body.classList.remove("mobile-menu-open");
    
    // Restaurar posição de scroll
    const scrollY = document.body.dataset.scrollY;
    document.body.style.top = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY));
    }
    
    console.log("Menu hambúrguer fechado");
  }

  // Event listener do botão hambúrguer
  mobileMenuBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isActive = mobileMenuOverlay.classList.contains("active");
    console.log("Botão hambúrguer clicado, estado atual:", { isActive });
    
    if (isActive) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  // Event listener do botão fechar
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeMobileMenu();
    });
  }

  // Fechar menu ao clicar nos links
  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      console.log("Link móvel clicado:", link.textContent);
      
      const href = link.getAttribute('href');
      
      // Se for um link interno (âncora), fazer smooth scroll
      if (href.includes('#')) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetId = href.split('#')[1];
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          // Fechar menu primeiro
          closeMobileMenu();
          
          // Fazer smooth scroll após pequeno delay
          setTimeout(() => {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 300);
        }
      } else {
        // Para outros links, adicionar classe ativa e fechar menu
        if (href === 'index.html' || href === '#') {
          mobileNavLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
        
        // Fechar menu com pequeno delay para melhor UX
        setTimeout(() => {
          closeMobileMenu();
        }, 150);
      }
    });
  });

  // Fechar menu ao clicar no overlay (fora do menu)
  mobileMenuOverlay.addEventListener("click", function (e) {
    // Só fecha se clicou no overlay, não no menu em si
    if (e.target === mobileMenuOverlay) {
      console.log("Clique no overlay - fechando menu");
      closeMobileMenu();
    }
  });

  // Fechar menu ao redimensionar para desktop
  let resizeTimeout;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.innerWidth > 768) {
        console.log("Resize para desktop - fechando menu hambúrguer");
        closeMobileMenu();
      }
    }, 100);
  });

  // Fechar menu com tecla ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenuOverlay.classList.contains("active")) {
      console.log("ESC pressionado - fechando menu hambúrguer");
      closeMobileMenu();
    }
  });

  // Prevenir propagação de cliques dentro do menu
  const mobileMenu = document.querySelector(".mobile-menu");
  if (mobileMenu) {
    mobileMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Highlight do link ativo na página atual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  mobileNavLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
      link.classList.add('active');
    }
  });

  console.log("Menu hambúrguer inicializado com sucesso");
}

// Scroll Effects Enhanced
function initScrollEffects() {
  const backToTop = document.getElementById("backToTop");

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Back to top button
    if (backToTop) {
      if (scrollTop > 300) {
        backToTop.classList.add("visible");
      } else {
        backToTop.classList.remove("visible");
      }
    }
  }

  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // Back to top functionality
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Throttled scroll listener
  let scrollTimer;
  window.addEventListener("scroll", () => {
    if (scrollTimer) {
      cancelAnimationFrame(scrollTimer);
    }
    scrollTimer = requestAnimationFrame(handleScroll);
  });
}

// Intersection Observer for animations
function initAnimations() {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe elements
    const animateElements = document.querySelectorAll(
      ".feature-card, .product-card, .contact-item, .stat"
    );
    animateElements.forEach((el) => {
      observer.observe(el);
    });
  }
}

// Lazy loading for images
function initLazyLoading() {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

// Form validation and handling
function initFormHandling() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Basic validation
      const inputs = form.querySelectorAll(
        "input[required], textarea[required]"
      );
      let isValid = true;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          input.classList.add("error");
          isValid = false;
        } else {
          input.classList.remove("error");
        }
      });

      if (isValid) {
        showNotification("Mensagem enviada com sucesso!", "success");
        form.reset();
      } else {
        showNotification(
          "Por favor, preencha todos os campos obrigatórios.",
          "error"
        );
      }
    });
  });
}

// Enhanced search functionality
function enhancedSearch() {
  const searchInputs = document.querySelectorAll(
    'input[type="search"], .search-input'
  );

  searchInputs.forEach((input) => {
    let searchTimer;

    input.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        performSearch(this.value);
      }, 300);
    });
  });
}

function performSearch(query) {
  if (query.length < 2) return;

  // Add search logic here
  console.log("Searching for:", query);
}

// Safety cleanup: remove any leftover link to index-responsive.css and
// clear inline styles that may cause product cards to collapse.
document.addEventListener("DOMContentLoaded", function () {
  try {
    // Remove <link> elements pointing to index-responsive.css (leftover from edits)
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((l) => {
      if (l.href && l.href.includes("index-responsive.css")) {
        l.parentNode.removeChild(l);
        console.log("Removed leftover index-responsive.css link");
      }
    });

    // Normalize inline styles inside products grid (if any JS added them)
    const productGrid = document.querySelector(".products-grid");
    if (productGrid) {
      const items = productGrid.querySelectorAll("*");
      items.forEach((el) => {
        // remove problematic inline width/height/transform styles
        if (el.style) {
          [
            "width",
            "minWidth",
            "maxWidth",
            "height",
            "transform",
            "flex",
            "flexBasis",
          ].forEach((prop) => {
            if (el.style[prop]) {
              el.style[prop] = "";
            }
          });
        }
      });

      // Force a small CSS class to the grid to ensure expected behaviour
      productGrid.classList.add("products-grid-normalized");
      console.log("Normalized product grid inline styles");
    }
  } catch (e) {
    console.error("Cleanup script failed:", e);
  }
});

// ===== INICIALIZAÇÃO GLOBAL =====

console.log("AutoBarros - Website loaded successfully!");
