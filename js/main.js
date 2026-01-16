/**
 * Universal Blog Theme - Main JavaScript
 * Handles dynamic content loading from JSON data
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // Dynamically adjust path based on current location (root vs /posts/)
    // Use lightweight index for homepage (no full content)
    indexPath: window.location.pathname.includes('/posts/')
        ? '../data/posts-index.json'
        : 'data/posts-index.json',
    // Keep full posts.json path for backward compatibility
    dataPath: window.location.pathname.includes('/posts/')
        ? '../data/posts.json'
        : 'data/posts.json',
    postsPerPage: 8, // Changed to 8 per page
    excerptLength: 150
};


// ============================================
// STATE MANAGEMENT
// ============================================
let postsData = [];
let currentPost = null;
let currentPage = 1; // Track current page


// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();

    // Determine which page we're on
    // Determine which page we're on based on elements present
    if (document.getElementById('postContent')) {
        loadSinglePost();
    } else if (document.getElementById('postsGrid')) {
        loadAllPosts();
    }

    // Set current year in footer
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Mobile menu toggle
    setupMobileMenu();
});

// ============================================
// THEME INITIALIZATION
// ============================================
function initializeTheme() {
    console.log('Universal Blog Theme initialized');
}

// ============================================
// MOBILE MENU
// ============================================
function setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
        });
    }
}

// ============================================
// DATA LOADING
// ============================================

// NEW: Load lightweight posts index for homepage (fast!)
async function loadPostsIndex() {
    try {
        console.log('📥 Loading lightweight index from:', CONFIG.indexPath);
        const response = await fetch(CONFIG.indexPath);

        if (!response.ok) {
            // Fallback to full posts.json if index doesn't exist
            console.log('⚠️ Index not found, falling back to posts.json');
            return await loadPostsData();
        }

        const data = await response.json();
        console.log(`✅ Loaded posts index: ${data.count || data.posts?.length || 0} posts`);
        postsData = data.posts || [];
        return postsData;
    } catch (error) {
        console.error('Error loading posts index:', error);
        // Fallback to full data
        return await loadPostsData();
    }
}

// LEGACY: Load full posts data (used for backward compatibility)
async function loadPostsData() {
    try {
        console.log('Loading posts from:', CONFIG.dataPath);
        const response = await fetch(CONFIG.dataPath);

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Loaded data:', data);
        postsData = data.posts || [];
        console.log('Posts count:', postsData.length);
        return postsData;
    } catch (error) {
        console.error('Error loading posts data:', error);
        console.error('Path attempted:', CONFIG.dataPath);

        // Show user-friendly error
        const grid = document.getElementById('postsGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <h3>Unable to load posts</h3>
                    <p>Error: ${error.message}</p>
                    <p>Path: ${CONFIG.dataPath}</p>
                    <p>Please check browser console for details.</p>
                </div>
            `;
        }
        return [];
    }
}

// ============================================
// HOMEPAGE - POSTS GRID
// ============================================
async function loadAllPosts() {
    // Use lightweight index for homepage (MUCH faster!)
    const posts = await loadPostsIndex();

    if (posts.length === 0) {
        // Show empty state
        const carousel = document.getElementById('heroCarousel');
        if (carousel) {
            carousel.innerHTML = '<div class="carousel-loading"><p style="color: white;">No posts yet. Create your first post!</p></div>';
        }
        return;
    }

    // Load hero carousel with random featured posts
    renderHeroCarousel(posts);

    // Initial render of paged posts
    renderPagedPosts(1);
}


// ============================================
// HERO CAROUSEL - AUTO-SLIDING
// ============================================
let currentSlide = 0;
let carouselInterval;
let carouselPosts = [];

function renderHeroCarousel(posts) {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel) return;

    // Get 3-5 random posts for carousel
    const featuredCount = Math.min(5, posts.length);
    const shuffled = [...posts].sort(() => 0.5 - Math.random());
    carouselPosts = shuffled.slice(0, featuredCount);

    // Render slides
    carousel.innerHTML = carouselPosts.map((post, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}" data-slug="${post.slug}">
            <div class="carousel-image-wrapper">
                <img src="${post.image || 'https://via.placeholder.com/1200x600?text=No+Image'}" 
                     alt="${escapeHtml(post.title)}" 
                     class="carousel-image"
                     onerror="this.src='https://via.placeholder.com/1200x600?text=No+Image'">
                <div class="carousel-overlay"></div>
            </div>
            <div class="carousel-content">
                <h2 class="carousel-title">${escapeHtml(post.title)}</h2>

                <p class="carousel-excerpt">${escapeHtml(post.excerpt || '').substring(0, 150)}...</p>
                <a href="posts/${post.slug}.html" class="carousel-btn-read" onclick="event.stopPropagation()">
                    Read Article
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
            </div>
        </div>
    `).join('');

    // Add click handlers to slides
    document.querySelectorAll('.carousel-slide').forEach(slide => {
        slide.addEventListener('click', (e) => {
            // Don't navigate if clicking the button or navigation arrows
            if (e.target.closest('.carousel-btn-read') ||
                e.target.closest('.carousel-nav') ||
                e.target.closest('.carousel-dot')) {
                return;
            }
            const slug = slide.dataset.slug;
            if (slug) {
                window.location.href = `posts/${slug}.html`;
            }
        });
    });

    // Render dots
    const dotsContainer = document.getElementById('carouselDots');
    if (dotsContainer) {
        dotsContainer.innerHTML = carouselPosts.map((_, index) =>
            `<button class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>`
        ).join('');

        // Add dot click handlers
        dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                goToSlide(index);
            });
        });
    }

    // Setup navigation
    setupCarouselNavigation();

    // Start auto-slide
    startAutoSlide();
}

function setupCarouselNavigation() {
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
        });
    }

    // Pause on hover
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);
    }
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    if (slides.length === 0) return;

    // Wrap around
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    // Remove active class from all
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Add active class to current
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');

    currentSlide = index;
}

function startAutoSlide() {
    stopAutoSlide(); // Clear any existing interval
    carouselInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000); // Change slide every 5 seconds
}

function stopAutoSlide() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function renderPostsGrid(posts) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    posts.forEach(post => {
        const card = createPostCard(post);
        grid.appendChild(card);
    });
}

function renderPagedPosts(page) {
    if (!postsData || postsData.length === 0) return;

    currentPage = page;
    const startIndex = (page - 1) * CONFIG.postsPerPage;
    const endIndex = startIndex + CONFIG.postsPerPage;
    const pagedPosts = postsData.slice(startIndex, endIndex);

    renderPostsGrid(pagedPosts);
    renderPaginationControls();

    // Also render sidebar if on first load/page 1 (or always, keeping it static is fine)
    if (page === 1) {
        renderSidebar(postsData);
    }

    // Scroll to top of grid
    const hero = document.querySelector('.hero-carousel');
    if (hero) {
        // Scroll just past hero
        // hero.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderPaginationControls() {
    const totalPages = Math.ceil(postsData.length / CONFIG.postsPerPage);
    let paginationContainer = document.getElementById('pagination');

    // Create if doesn't exist (it should be in HTML, but fallback here)
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.className = 'pagination';
        document.querySelector('.posts-section').appendChild(paginationContainer);
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';

    // Prev Button
    if (currentPage > 1) {
        html += `<button class="page-btn prev" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-num ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }

    // Next Button
    if (currentPage < totalPages) {
        html += `<button class="page-btn next" onclick="changePage(${currentPage + 1})">Next</button>`;
    }

    paginationContainer.innerHTML = html;
}

// Global function for onclick handlers
window.changePage = function (page) {
    renderPagedPosts(page);
};


function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const imageHtml = post.image
        ? `<div class="post-card-image">
               <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy">
           </div>`
        : '';

    const excerpt = truncateText(post.excerpt, CONFIG.excerptLength);
    const postUrl = getLinkPath('post', post.slug);

    card.innerHTML = `
        ${imageHtml}
        <div class="post-card-content">
            <div class="post-meta">
                <span class="post-category">${escapeHtml(post.category)}</span>
                <span class="post-date">${formatDate(post.date)}</span>
            </div>
            <h2 class="post-card-title">
                <a href="${postUrl}">${escapeHtml(post.title)}</a>
            </h2>
            <p class="post-card-excerpt">${escapeHtml(excerpt)}</p>
            <a href="${postUrl}" class="read-more">Read More</a>
        </div>
    `;

    return card;
}

// Helper for relative paths
function getLinkPath(type, slugOrCat) {
    const isPostPage = window.location.pathname.includes('/posts/');

    if (type === 'home') {
        return isPostPage ? '../index.html' : 'index.html';
    }
    if (type === 'post') {
        // If we are in /posts/, sibling is just slug.html
        // If we are in /, child is posts/slug.html
        return isPostPage ? `${slugOrCat}.html` : `posts/${slugOrCat}.html`;
    }
    if (type === 'category') {
        const base = isPostPage ? '../index.html' : 'index.html';
        return `${base}#${slugOrCat.toLowerCase()}`;
    }
    return '#';
}

// ============================================
// SINGLE POST PAGE
// ============================================
async function loadSinglePost() {
    // SSG CHECK: If the page already has content (static generation), don't fetch/render.
    // However, we still might want to load sidebar data.
    if (document.querySelector('.post-body') || window.preloadedPost) {
        console.log('SSG/Static content detected. Skipping dynamic render.');
        // Load lightweight index for sidebar and related posts (FAST!)
        const posts = await loadPostsIndex();
        renderSidebar(posts);

        // Render related posts if we have current post data
        if (window.preloadedPost) {
            renderRelatedPosts(window.preloadedPost, posts);
        }
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    console.log('Loading single post for slug:', slug);

    if (!slug) {
        showError('Post not found (No slug provided)');
        return;
    }

    const posts = await loadPostsData();
    console.log('Loaded posts:', posts.length);

    const post = posts.find(p => p.slug === slug);
    console.log('Found post:', post ? post.title : 'None');

    if (!post) {
        showError('Post not found (Slug mismatch)');
        return;
    }

    currentPost = post;
    try {
        renderSinglePost(post);
    } catch (e) {
        console.error('Render error:', e);
        showError('Error rendering post: ' + e.message);
    }
    renderSidebar(posts);
    updateMetaTags(post);
}

function renderSinglePost(post) {
    const container = document.getElementById('postContent');
    if (!container) return;

    const article = document.createElement('div');

    // Header - Title FIRST, then Meta
    const headerHtml = `
        <header class="post-header">
            <h1 class="post-title">${escapeHtml(post.title)}</h1>
            <div class="post-meta">
                <span class="post-category">${escapeHtml(post.category)}</span>
                <span class="post-date">${formatDate(post.date)}</span>
            </div>
        </header>
    `;

    // Featured Image
    const imageHtml = post.image
        ? `<div class="post-featured-image">
               <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}">
           </div>`
        : '';

    // Content
    let contentHtml = '<div class="post-body">';

    // Paragraphs
    if (post.content.paragraphs && post.content.paragraphs.length > 0) {
        post.content.paragraphs.forEach((para, index) => {
            contentHtml += `<p>${escapeHtml(para)}</p>`;

            // Insert mid-content ad after 3rd paragraph
            if (index === 2) {
                contentHtml += `
                    <div class="ad-mid-content">
                        <div class="ad-placeholder">
                            <p class="ad-label">Advertisement</p>
                        </div>
                    </div>
                `;
            }
        });
    }

    // Ingredients (for recipe posts)
    if (post.content.ingredients && post.content.ingredients.length > 0) {
        contentHtml += '<h2>Ingredients</h2>';
        contentHtml += '<ul class="ingredients-list">';
        post.content.ingredients.forEach(ingredient => {
            contentHtml += `<li>${escapeHtml(ingredient)}</li>`;
        });
        contentHtml += '</ul>';
    }

    // Steps (for recipe posts or how-to guides)
    if (post.content.steps && post.content.steps.length > 0) {
        contentHtml += '<h2>Instructions</h2>';
        contentHtml += '<ol class="steps-list">';
        post.content.steps.forEach(step => {
            contentHtml += `<li>${escapeHtml(step)}</li>`;
        });
        contentHtml += '</ol>';
    }

    // End-content ad
    contentHtml += `
        <div class="ad-end-content">
            <div class="ad-placeholder">
                <p class="ad-label">Advertisement</p>
            </div>
        </div>
    `;

    contentHtml += '</div>';

    // Combine all parts
    article.innerHTML = headerHtml + imageHtml + contentHtml;
    container.innerHTML = '';
    container.appendChild(article);
}

// ============================================
// RELATED POSTS
// ============================================
function renderRelatedPosts(currentPost, allPosts) {
    const relatedSection = document.getElementById('relatedPosts');
    const relatedGrid = document.getElementById('relatedPostsGrid');

    if (!relatedSection || !relatedGrid) return;

    // Filter posts by same category, exclude current post
    let related = allPosts.filter(p =>
        p.category === currentPost.category && p.slug !== currentPost.slug
    );

    // If not enough, add random posts
    if (related.length < 3) {
        const others = allPosts.filter(p => p.slug !== currentPost.slug);
        related = [...related, ...others].slice(0, 3);
    } else {
        related = related.slice(0, 3);
    }

    if (related.length === 0) return;

    // Show section
    relatedSection.style.display = 'block';

    // Render related posts
    relatedGrid.innerHTML = related.map(post => `
        <div class="related-post-card" onclick="window.location.href='${post.slug}.html'">
            <div class="related-post-image">
                <img src="${escapeHtml(post.image || 'https://via.placeholder.com/400x200')}" 
                     alt="${escapeHtml(post.title)}" 
                     loading="lazy">
            </div>
            <div class="related-post-content">
                <span class="related-post-category">${escapeHtml(post.category)}</span>
                <h4 class="related-post-title">${escapeHtml(post.title)}</h4>
                <span class="related-post-date">${formatDate(post.date)}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// SIDEBAR
// ============================================
function renderSidebar(posts) {
    renderCategories(posts);
    renderRecentPosts(posts);
}

function renderCategories(posts) {
    const container = document.getElementById('categoryList');
    if (!container) return;

    // Get unique categories
    const categories = [...new Set(posts.map(p => p.category))];

    container.innerHTML = '';
    categories.forEach(category => {
        const count = posts.filter(p => p.category === category).length;
        const li = document.createElement('li');
        const catUrl = getLinkPath('category', category);
        li.innerHTML = `<a href="${catUrl}">${escapeHtml(category)} (${count})</a>`;
        container.appendChild(li);
    });
}

function renderRecentPosts(posts) {
    const container = document.getElementById('recentPosts');
    if (!container) return;

    // Sort by date (newest first) and take top 5
    const recentPosts = [...posts]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    container.innerHTML = '';
    recentPosts.forEach(post => {
        const li = document.createElement('li');
        const postUrl = getLinkPath('post', post.slug);
        li.innerHTML = `<a href="${postUrl}">${escapeHtml(post.title)}</a>`;
        container.appendChild(li);
    });
}

// ============================================
// SEO & META TAGS
// ============================================
function updateMetaTags(post) {
    // Update title
    document.title = `${post.title} - Universal Blog Theme`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', post.excerpt);
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.setAttribute('content', post.title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
        ogDescription.setAttribute('content', post.excerpt);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && post.image) {
        ogImage.setAttribute('content', post.image);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Format: "13-Jan" (Day-Month)
    // Using en-GB to get day first, but standardizing with short month
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day}-${month}`;
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const grids = [
        document.getElementById('postsGrid'),
        document.getElementById('postContent')
    ];

    grids.forEach(grid => {
        if (grid) {
            grid.innerHTML = `
                <div class="loading" style="color: #ef4444;">
                    ${escapeHtml(message)}
                </div>
            `;
        }
    });
}

// ============================================
// EXPORT FOR TESTING
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPostsData,
        formatDate,
        truncateText,
        escapeHtml
    };
}
