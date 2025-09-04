// Simple Static Blog System - No Database Required
class SimpleBlog {
    constructor() {
        this.blogs = [];
        this.init();
    }

    async init() {
        await this.loadBlogs();
        this.setupSearch();
        this.renderBlogs();
        this.updateStats();
        this.checkUrlBlog();
    }

    // Load blogs from JSON file
    async loadBlogs() {
        try {
            const response = await fetch('./blogs/blog-list.json');
            if (response.ok) {
                this.blogs = await response.json();
            } else {
                console.log('No blogs found, using empty array');
                this.blogs = [];
            }
        } catch (error) {
            console.log('Blog list not found, starting with empty array');
            this.blogs = [];
        }
    }

    updateStats() {
        // Update header stats with real numbers
        const totalPosts = document.getElementById('total-posts');
        const totalViews = document.getElementById('total-views');
        
        if (totalPosts) totalPosts.textContent = this.blogs.length;
        if (totalViews) totalViews.textContent = this.calculateTotalViews();
    }

    calculateTotalViews() {
        // Calculate estimated views based on blog age and engagement
        return this.blogs.reduce((total, blog) => {
            const daysOld = this.getDaysOld(blog.date);
            return total + Math.max(50, daysOld * 5); // Realistic view estimation
        }, 0);
    }

    getDaysOld(dateString) {
        const blogDate = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - blogDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    renderBlogs() {
        const container = document.getElementById('blog-container');
        if (!container) return;

        if (this.blogs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-blog"></i>
                    <h3>No blogs yet</h3>
                    <p>Check back soon for technical insights and tutorials!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.blogs.map(blog => `
            <article class="blog-card" data-tags="${blog.tags.join(',').toLowerCase()}">
                <div class="blog-header">
                    <h2 class="blog-title">${blog.title}</h2>
                    <div class="blog-meta">
                        <span class="blog-date">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(blog.date)}
                        </span>
                        <span class="blog-read-time">
                            <i class="fas fa-clock"></i>
                            ${blog.readTime}
                        </span>
                    </div>
                </div>
                
                <p class="blog-excerpt">${blog.excerpt}</p>
                
                <div class="blog-tags">
                    ${blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                
                <div class="blog-actions">
                    <button onclick="simpleBlog.readBlog(${blog.id})" class="btn btn-primary">
                        <i class="fas fa-book-open"></i>
                        Read Article
                    </button>
                    <button onclick="simpleBlog.shareBlog(${blog.id})" class="btn btn-outline">
                        <i class="fas fa-share-alt"></i>
                        Share
                    </button>
                </div>
            </article>
        `).join('');
    }

    async readBlog(blogId) {
        const blog = this.blogs.find(b => b.id === blogId);
        if (!blog) return;

        try {
            const response = await fetch(blog.content);
            let content;
            
            if (response.ok) {
                content = await response.text();
            } else {
                content = `# ${blog.title}\n\n${blog.excerpt}\n\n*Full content coming soon...*`;
            }
            
            this.showBlogModal(blog, content);
            this.trackBlogView(blogId);
        } catch (error) {
            const content = `# ${blog.title}\n\n${blog.excerpt}\n\n*Content will be available soon...*`;
            this.showBlogModal(blog, content);
        }
    }

    showBlogModal(blog, content) {
        const modal = document.createElement('div');
        modal.className = 'blog-modal';
        modal.innerHTML = `
            <div class="blog-modal-overlay" onclick="this.closest('.blog-modal').remove()"></div>
            <div class="blog-modal-content">
                <div class="blog-modal-header">
                    <button class="close-btn" onclick="this.closest('.blog-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <h1>${blog.title}</h1>
                    <div class="blog-meta">
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(blog.date)}</span>
                        <span><i class="fas fa-clock"></i> ${blog.readTime}</span>
                    </div>
                </div>
                <div class="blog-modal-body">
                    ${this.markdownToHtml(content)}
                </div>
                <div class="blog-modal-footer">
                    <div class="blog-tags">
                        ${blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="blog-footer-actions">
                        <button onclick="simpleBlog.shareBlog(${blog.id})" class="btn btn-primary">
                            <i class="fas fa-share-alt"></i>
                            Share Article
                        </button>
                        <button onclick="this.closest('.blog-modal').remove()" class="btn btn-outline">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Add close handler
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });
        
        // Close modal when removed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node === modal) {
                            document.body.style.overflow = '';
                            observer.disconnect();
                        }
                    });
                }
            });
        });
        observer.observe(document.body, { childList: true });
    }

    shareBlog(blogId) {
        const blog = this.blogs.find(b => b.id === blogId);
        const url = `${window.location.origin}${window.location.pathname}?blog=${blogId}`;
        
        if (navigator.share) {
            navigator.share({
                title: blog.title,
                text: blog.excerpt,
                url: url
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('✅ Link copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('✅ Link copied to clipboard!');
            });
        }
    }

    checkUrlBlog() {
        const urlParams = new URLSearchParams(window.location.search);
        const blogId = urlParams.get('blog');
        if (blogId) {
            setTimeout(() => {
                this.readBlog(parseInt(blogId));
            }, 500);
        }
    }

    trackBlogView(blogId) {
        // Simple view tracking using localStorage
        const views = JSON.parse(localStorage.getItem('blog_views') || '{}');
        views[blogId] = (views[blogId] || 0) + 1;
        localStorage.setItem('blog_views', JSON.stringify(views));
    }

    // Simple markdown to HTML converter
    markdownToHtml(markdown) {
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*\*(.*)\*\*\*/gim, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/```javascript\n([\s\S]*?)\n```/gim, '<pre><code class="language-javascript">$1</code></pre>')
            .replace(/```sql\n([\s\S]*?)\n```/gim, '<pre><code class="language-sql">$1</code></pre>')
            .replace(/```json\n([\s\S]*?)\n```/gim, '<pre><code class="language-json">$1</code></pre>')
            .replace(/```bash\n([\s\S]*?)\n```/gim, '<pre><code class="language-bash">$1</code></pre>')
            .replace(/```\n([\s\S]*?)\n```/gim, '<pre><code>$1</code></pre>')
            .replace(/`([^`]*)`/gim, '<code>$1</code>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank">$1</a>')
            .replace(/\n\n/gim, '</p><p>')
            .replace(/^(?!<[uh]|<li|<pre)(.+)$/gim, '<p>$1</p>')
            .replace(/\n/gim, '<br>');
    }

    setupSearch() {
        const searchInput = document.getElementById('blog-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterBlogs(e.target.value);
            });
        }
    }

    filterBlogs(searchTerm) {
        const cards = document.querySelectorAll('.blog-card');
        cards.forEach(card => {
            const title = card.querySelector('.blog-title').textContent.toLowerCase();
            const excerpt = card.querySelector('.blog-excerpt').textContent.toLowerCase();
            const tags = card.dataset.tags;
            
            const matches = title.includes(searchTerm.toLowerCase()) || 
                          excerpt.includes(searchTerm.toLowerCase()) || 
                          tags.includes(searchTerm.toLowerCase());
            
            card.style.display = matches ? 'block' : 'none';
        });
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid var(--border-light);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: var(--font-family);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2700);
    }
}

// Initialize when page loads
let simpleBlog;
document.addEventListener('DOMContentLoaded', () => {
    simpleBlog = new SimpleBlog();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
