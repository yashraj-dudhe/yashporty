// Public Blog JavaScript
// Clean, fast blog reading experience for public users

document.addEventListener('DOMContentLoaded', function() {
    initPublicBlog();
    initThemeToggle();
    console.log('Public blog initialized');
});

let blogs = [];
let filteredBlogs = [];
let currentBlog = null;
let supabase = null;

async function initPublicBlog() {
    try {
        // Initialize Supabase
        await initSupabase();
        
        // Load and display blogs
        await loadPublicBlogs();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update stats
        updateStats();
        
        console.log('✅ Public blog ready');
    } catch (error) {
        console.error('❌ Failed to initialize blog:', error);
        showErrorState();
    }
}

async function initSupabase() {
    try {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key) {
            const { createClient } = supabase;
            supabase = createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
            console.log('✅ Supabase initialized for public blog');
        }
    } catch (error) {
        console.warn('⚠️ Supabase not available, using localStorage');
    }
}

async function loadPublicBlogs() {
    const loadingState = document.getElementById('loading-state');
    const blogsGrid = document.getElementById('blogs-grid');
    
    try {
        if (supabase) {
            // Load from Supabase (published only)
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('status', 'published')
                .order('published_at', { ascending: false });
            
            if (error) throw error;
            blogs = data || [];
        } else {
            // Fallback to localStorage
            const savedBlogs = localStorage.getItem('yashraj_blogs');
            if (savedBlogs) {
                const allBlogs = JSON.parse(savedBlogs);
                blogs = allBlogs.filter(blog => blog.status === 'published');
            } else {
                blogs = [];
            }
        }
        
        filteredBlogs = [...blogs];
        
        // Hide loading, show content
        loadingState.style.display = 'none';
        blogsGrid.style.display = 'grid';
        
        // Render blogs
        renderBlogs();
        
    } catch (error) {
        console.error('Error loading blogs:', error);
        showErrorState();
    }
}

function renderBlogs() {
    const blogsGrid = document.getElementById('blogs-grid');
    const noResults = document.getElementById('no-results');
    
    if (filteredBlogs.length === 0) {
        blogsGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    blogsGrid.style.display = 'grid';
    noResults.style.display = 'none';
    
    blogsGrid.innerHTML = filteredBlogs.map(blog => createBlogCard(blog)).join('');
    
    // Add click listeners to blog cards
    document.querySelectorAll('.blog-post-card').forEach((card, index) => {
        card.addEventListener('click', () => openBlogModal(filteredBlogs[index]));
    });
}

function createBlogCard(blog) {
    const date = new Date(blog.created_at || blog.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const tags = (blog.tags || []).map(tag => `<span class="blog-tag">${tag}</span>`).join('');
    
    // Calculate reading time
    const wordCount = blog.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    return `
        <article class="blog-post-card" data-blog-id="${blog.id}">
            <div class="blog-card-content">
                <div class="blog-card-meta">
                    <div class="blog-card-date">
                        <i class="fas fa-calendar"></i>
                        ${date}
                    </div>
                    <div class="blog-card-stats">
                        <span>
                            <i class="fas fa-eye"></i>
                            ${blog.view_count || 0}
                        </span>
                        <span>
                            <i class="fas fa-heart"></i>
                            ${blog.like_count || 0}
                        </span>
                    </div>
                </div>
                
                <h2 class="blog-card-title">${blog.title}</h2>
                <p class="blog-card-excerpt">${blog.excerpt}</p>
                
                <div class="blog-card-tags">${tags}</div>
                
                <div class="blog-card-footer">
                    <a href="#" class="read-more">
                        Read More
                        <i class="fas fa-arrow-right"></i>
                    </a>
                    <span class="blog-card-reading-time">
                        <i class="fas fa-clock"></i>
                        ${readingTime} min read
                    </span>
                </div>
            </div>
        </article>
    `;
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Modal close
    const closeModal = document.getElementById('close-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (closeModal) {
        closeModal.addEventListener('click', closeBlogModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeBlogModal);
    }
    
    // Modal actions
    const likeBtn = document.getElementById('like-btn');
    const shareBtn = document.getElementById('share-btn');
    
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSignup);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentBlog) {
            closeBlogModal();
        }
    });
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
        filteredBlogs = [...blogs];
        renderBlogs();
        return;
    }
    
    filteredBlogs = blogs.filter(blog => 
        blog.title.toLowerCase().includes(query) ||
        blog.excerpt.toLowerCase().includes(query) ||
        blog.content.toLowerCase().includes(query) ||
        (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(query)))
    );
    
    renderBlogs();
}

async function openBlogModal(blog) {
    currentBlog = blog;
    
    // Track view
    await trackBlogView(blog.id);
    
    // Update modal content
    updateModalContent(blog);
    
    // Show modal
    const modal = document.getElementById('blog-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Update URL (optional)
    if (history.pushState) {
        history.pushState(null, null, `#blog-${blog.id}`);
    }
}

function updateModalContent(blog) {
    document.getElementById('modal-title').textContent = blog.title;
    
    const date = new Date(blog.created_at || blog.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('modal-date').textContent = date;
    
    // Calculate reading time
    const wordCount = blog.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    document.getElementById('modal-reading-time').textContent = `${readingTime} min read`;
    
    document.getElementById('modal-views').textContent = `${blog.view_count || 0} views`;
    
    // Tags
    const tagsHTML = (blog.tags || []).map(tag => `<span class="blog-tag">${tag}</span>`).join('');
    document.getElementById('modal-tags').innerHTML = tagsHTML;
    
    // Content (convert markdown to HTML)
    const htmlContent = marked.parse(blog.content);
    document.getElementById('modal-content').innerHTML = htmlContent;
    
    // Update like button
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    likeCount.textContent = blog.like_count || 0;
    
    // Highlight code blocks
    if (window.Prism) {
        Prism.highlightAll();
    }
}

function closeBlogModal() {
    const modal = document.getElementById('blog-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentBlog = null;
    
    // Update URL
    if (history.pushState) {
        history.pushState(null, null, window.location.pathname);
    }
}

async function handleLike() {
    if (!currentBlog) return;
    
    try {
        const likeBtn = document.getElementById('like-btn');
        const likeCount = document.getElementById('like-count');
        const heartIcon = likeBtn.querySelector('i');
        
        // Optimistic update
        const isLiked = likeBtn.classList.contains('liked');
        const newCount = isLiked ? 
            (currentBlog.like_count || 0) - 1 : 
            (currentBlog.like_count || 0) + 1;
        
        likeBtn.classList.toggle('liked');
        heartIcon.className = isLiked ? 'far fa-heart' : 'fas fa-heart';
        likeCount.textContent = newCount;
        currentBlog.like_count = newCount;
        
        // Update in database
        if (supabase) {
            await trackBlogLike(currentBlog.id, !isLiked);
        }
        
        // Update local storage
        const blogIndex = blogs.findIndex(b => b.id === currentBlog.id);
        if (blogIndex >= 0) {
            blogs[blogIndex].like_count = newCount;
            localStorage.setItem('yashraj_blogs', JSON.stringify(blogs));
        }
        
    } catch (error) {
        console.error('Error handling like:', error);
    }
}

function handleShare() {
    if (!currentBlog) return;
    
    const shareData = {
        title: currentBlog.title,
        text: currentBlog.excerpt,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        const shareText = `${currentBlog.title}\n\n${currentBlog.excerpt}\n\nRead more: ${window.location.href}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showToast('Link copied to clipboard!');
            }).catch(() => {
                showToast('Failed to copy link');
            });
        } else {
            // Further fallback
            showToast('Share: ' + shareText);
        }
    }
}

async function handleNewsletterSignup(e) {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    
    try {
        // Here you would integrate with your email service
        // For now, just show a success message
        showToast('Thanks for subscribing! (Coming soon)');
        e.target.reset();
    } catch (error) {
        console.error('Newsletter signup error:', error);
        showToast('Failed to subscribe. Please try again.');
    }
}

async function trackBlogView(blogId) {
    try {
        if (supabase) {
            // Call the increment function
            await supabase.rpc('increment_blog_views', {
                blog_id_param: blogId,
                ip_addr: null, // You could get IP if needed
                user_agent_param: navigator.userAgent
            });
        }
        
        // Update local copy
        const blogIndex = blogs.findIndex(b => b.id === blogId);
        if (blogIndex >= 0) {
            blogs[blogIndex].view_count = (blogs[blogIndex].view_count || 0) + 1;
        }
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

async function trackBlogLike(blogId, isLiking) {
    try {
        if (supabase) {
            // This would need the user's IP or some identifier
            // For now, we'll just update the count directly
            const currentCount = currentBlog.like_count || 0;
            const newCount = isLiking ? currentCount + 1 : currentCount - 1;
            
            await supabase
                .from('blogs')
                .update({ like_count: Math.max(0, newCount) })
                .eq('id', blogId);
        }
    } catch (error) {
        console.error('Error tracking like:', error);
    }
}

function updateStats() {
    const totalPosts = blogs.length;
    const totalViews = blogs.reduce((sum, blog) => sum + (blog.view_count || 0), 0);
    const totalLikes = blogs.reduce((sum, blog) => sum + (blog.like_count || 0), 0);
    
    document.getElementById('total-posts').textContent = totalPosts;
    document.getElementById('total-views').textContent = totalViews;
    document.getElementById('total-likes').textContent = totalLikes;
    
    // Update footer content
    updateFooterContent();
}

function updateFooterContent() {
    // Update recent posts
    const recentPostsContainer = document.getElementById('footer-recent-posts');
    if (recentPostsContainer && blogs.length > 0) {
        const recentPosts = blogs.slice(0, 3);
        recentPostsContainer.innerHTML = recentPosts.map(blog => 
            `<li><a href="#" onclick="openBlogFromFooter('${blog.id}')">${blog.title}</a></li>`
        ).join('');
    }
}

function openBlogFromFooter(blogId) {
    const blog = blogs.find(b => b.id === blogId);
    if (blog) {
        openBlogModal(blog);
    }
}

function showErrorState() {
    const loadingState = document.getElementById('loading-state');
    loadingState.innerHTML = `
        <div style="text-align: center; padding: 4rem 0; color: var(--text-light);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h3>Unable to load blog posts</h3>
            <p>Please check your connection and try again.</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                Retry
            </button>
        </div>
    `;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Theme toggle (reuse from main site)
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleBtn?.querySelector('i');
    
    if (!themeToggleBtn) return;
    
    // Check for saved theme preference
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update icon
    updateThemeIcon(currentTheme, themeIcon);
    
    themeToggleBtn.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme, themeIcon);
    });
}

function updateThemeIcon(theme, iconElement) {
    if (!iconElement) return;
    iconElement.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Handle URL hash for direct blog links
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('load', handleHashChange);

function handleHashChange() {
    const hash = window.location.hash;
    if (hash.startsWith('#blog-')) {
        const blogId = hash.substring(6);
        const blog = blogs.find(b => b.id === blogId);
        if (blog) {
            setTimeout(() => openBlogModal(blog), 500); // Wait for blogs to load
        }
    }
}

// Export for global access
window.PublicBlog = {
    openBlogModal,
    openBlog: openBlogFromFooter
};
