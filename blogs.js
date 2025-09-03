// Blog Management JavaScript
// Production-ready blog management system with Supabase integration

document.addEventListener('DOMContentLoaded', function() {
    initBlogManagement();
    initThemeToggle();
    console.log('Blog management system initialized');
});

let blogs = [];
let currentEditingId = null;
let supabase = null;
let isOnline = navigator.onLine;

function initBlogManagement() {
    // Initialize Supabase
    initSupabase();
    
    // Load existing blogs
    loadBlogs();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize filters
    initFilters();
    
    // Setup offline detection
    setupOfflineHandling();
}

async function initSupabase() {
    try {
        // Wait for Supabase config to load
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key) {
            const { createClient } = supabase;
            supabase = createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
            console.log('✅ Supabase initialized for blogs');
        } else {
            console.warn('⚠️ Supabase config not found, using localStorage fallback');
        }
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
    }
}

function setupOfflineHandling() {
    window.addEventListener('online', () => {
        isOnline = true;
        showMessage('🌐 Back online! Syncing data...', 'success');
        syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        showMessage('📱 Working offline. Changes will sync when reconnected.', 'warning');
    });
}

function initEventListeners() {
    // New blog button
    const newBlogBtn = document.getElementById('new-blog-btn');
    if (newBlogBtn) {
        newBlogBtn.addEventListener('click', showBlogEditor);
    }
    
    // Close editor button
    const closeEditorBtn = document.getElementById('close-editor');
    if (closeEditorBtn) {
        closeEditorBtn.addEventListener('click', hideBlogEditor);
    }
    
    // Blog form submission
    const blogForm = document.getElementById('blog-form');
    if (blogForm) {
        blogForm.addEventListener('submit', handleBlogSubmission);
    }
    
    // Save draft button
    const saveDraftBtn = document.getElementById('save-draft');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveBlogDraft);
    }
    
    // Search functionality
    const searchInput = document.getElementById('blog-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Manage blogs button
    const manageBlogsBtn = document.getElementById('manage-blogs-btn');
    if (manageBlogsBtn) {
        manageBlogsBtn.addEventListener('click', toggleManageMode);
    }
}

function initFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            // Filter blogs
            filterBlogs(this.dataset.filter);
        });
    });
}

function showBlogEditor(blog = null) {
    const editor = document.getElementById('blog-editor');
    const form = document.getElementById('blog-form');
    
    if (blog) {
        // Editing existing blog
        currentEditingId = blog.id;
        document.getElementById('blog-title').value = blog.title;
        document.getElementById('blog-excerpt').value = blog.excerpt;
        document.getElementById('blog-tags').value = blog.tags.join(', ');
        document.getElementById('blog-content').value = blog.content;
        document.querySelector('.editor-header h2').textContent = 'Edit Blog Post';
    } else {
        // Creating new blog
        currentEditingId = null;
        form.reset();
        document.querySelector('.editor-header h2').textContent = 'Create New Blog Post';
    }
    
    editor.style.display = 'block';
    editor.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('blog-title').focus();
}

function hideBlogEditor() {
    const editor = document.getElementById('blog-editor');
    const form = document.getElementById('blog-form');
    
    editor.style.display = 'none';
    form.reset();
    currentEditingId = null;
}

async function handleBlogSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const blogData = {
        id: currentEditingId || generateId(),
        title: formData.get('title'),
        excerpt: formData.get('excerpt'),
        content: formData.get('content'),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        status: 'published',
        date: new Date().toISOString(),
        createdAt: currentEditingId ? blogs.find(b => b.id === currentEditingId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await saveBlog(blogData);
        showMessage('Blog published successfully!', 'success');
        hideBlogEditor();
        renderBlogs();
    } catch (error) {
        console.error('Error saving blog:', error);
        showMessage('Failed to publish blog. Please try again.', 'error');
    }
}

async function saveBlogDraft(e) {
    e.preventDefault();
    
    const form = document.getElementById('blog-form');
    const formData = new FormData(form);
    
    const blogData = {
        id: currentEditingId || generateId(),
        title: formData.get('title'),
        excerpt: formData.get('excerpt'),
        content: formData.get('content'),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        status: 'draft',
        date: new Date().toISOString(),
        createdAt: currentEditingId ? blogs.find(b => b.id === currentEditingId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await saveBlog(blogData);
        showMessage('Draft saved successfully!', 'success');
        renderBlogs();
    } catch (error) {
        console.error('Error saving draft:', error);
        showMessage('Failed to save draft. Please try again.', 'error');
    }
}

async function saveBlog(blogData) {
    try {
        if (supabase && isOnline) {
            // Save to Supabase
            const { data, error } = await supabase
                .from('blogs')
                .upsert([{
                    id: blogData.id,
                    title: blogData.title,
                    excerpt: blogData.excerpt,
                    content: blogData.content,
                    tags: blogData.tags,
                    status: blogData.status,
                    seo_title: blogData.title,
                    seo_description: blogData.excerpt
                }], {
                    onConflict: 'id'
                })
                .select();
            
            if (error) throw error;
            
            // Update local copy
            const existingIndex = blogs.findIndex(b => b.id === blogData.id);
            const savedBlog = data[0];
            
            if (existingIndex >= 0) {
                blogs[existingIndex] = savedBlog;
            } else {
                blogs.unshift(savedBlog);
            }
            
            // Also save to localStorage as backup
            localStorage.setItem('yashraj_blogs', JSON.stringify(blogs));
            
            console.log('✅ Blog saved to Supabase');
            return savedBlog;
        } else {
            // Fallback to localStorage
            return await saveToLocalStorage(blogData);
        }
    } catch (error) {
        console.error('❌ Error saving blog:', error);
        // Fallback to localStorage on error
        return await saveToLocalStorage(blogData);
    }
}

async function saveToLocalStorage(blogData) {
    const existingIndex = blogs.findIndex(b => b.id === blogData.id);
    
    // Add metadata
    blogData.created_at = blogData.created_at || new Date().toISOString();
    blogData.updated_at = new Date().toISOString();
    blogData.view_count = blogData.view_count || 0;
    blogData.like_count = blogData.like_count || 0;
    
    if (existingIndex >= 0) {
        blogs[existingIndex] = blogData;
    } else {
        blogs.unshift(blogData);
    }
    
    localStorage.setItem('yashraj_blogs', JSON.stringify(blogs));
    
    // Mark for sync if offline
    if (!isOnline) {
        markForSync(blogData.id);
    }
    
    console.log('💾 Blog saved to localStorage');
    return blogData;
}

function markForSync(blogId) {
    const pendingSync = JSON.parse(localStorage.getItem('pending_blog_sync') || '[]');
    if (!pendingSync.includes(blogId)) {
        pendingSync.push(blogId);
        localStorage.setItem('pending_blog_sync', JSON.stringify(pendingSync));
    }
}

async function syncOfflineData() {
    if (!supabase || !isOnline) return;
    
    try {
        const pendingSync = JSON.parse(localStorage.getItem('pending_blog_sync') || '[]');
        
        for (const blogId of pendingSync) {
            const blog = blogs.find(b => b.id === blogId);
            if (blog) {
                await saveBlog(blog);
            }
        }
        
        // Clear pending sync
        localStorage.removeItem('pending_blog_sync');
        showMessage('✅ Offline changes synced successfully!', 'success');
    } catch (error) {
        console.error('❌ Sync failed:', error);
        showMessage('❌ Failed to sync some changes. Will retry later.', 'error');
    }
}

async function loadBlogs() {
    try {
        if (supabase && isOnline) {
            // Load from Supabase
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            blogs = data || [];
            
            // Also save to localStorage as backup
            localStorage.setItem('yashraj_blogs', JSON.stringify(blogs));
            
            console.log('✅ Blogs loaded from Supabase:', blogs.length);
        } else {
            // Load from localStorage
            await loadFromLocalStorage();
        }
    } catch (error) {
        console.error('❌ Error loading from Supabase:', error);
        // Fallback to localStorage
        await loadFromLocalStorage();
    }
    
    renderBlogs();
}

async function loadFromLocalStorage() {
    const savedBlogs = localStorage.getItem('yashraj_blogs');
    if (savedBlogs) {
        blogs = JSON.parse(savedBlogs);
    } else {
        // Initialize with sample blogs if nothing exists
        blogs = await createSampleBlogs();
        localStorage.setItem('yashraj_blogs', JSON.stringify(blogs));
    }
    console.log('💾 Blogs loaded from localStorage:', blogs.length);
}

async function createSampleBlogs() {
    return [
        {
            id: 'sample-json-optimization',
            title: 'Optimizing JSON Query Performance in Large Datasets',
            excerpt: 'Deep dive into advanced JSON query optimization techniques for handling massive datasets efficiently.',
            content: `# Optimizing JSON Query Performance in Large Datasets

When working with large JSON datasets, query performance can become a significant bottleneck. In this comprehensive guide, I'll share proven techniques for optimizing JSON queries.

## 1. Index Strategy for JSON Fields

The first step in optimization is creating proper indexes:

\`\`\`sql
-- Create GIN index for JSONB columns
CREATE INDEX idx_data_gin ON table_name USING GIN (json_column);

-- Create specific path indexes
CREATE INDEX idx_data_path ON table_name USING GIN ((json_column -> 'specific_path'));
\`\`\`

## 2. Query Optimization Techniques

### Use JSONB over JSON
Always prefer JSONB over JSON for better performance:
- JSONB supports indexing
- Faster processing due to binary format
- Supports containment operators

### Avoid Complex Nested Queries
Instead of deep nesting, flatten your data structure when possible.

## 3. Real-world Example

Here's an optimization I implemented that reduced query time from 15s to 200ms:

\`\`\`javascript
// Before: Slow nested query
const slowQuery = \`
  SELECT * FROM products 
  WHERE json_extract(metadata, '$.category.subcategory.name') = ?
\`;

// After: Optimized with proper indexing
const fastQuery = \`
  SELECT * FROM products 
  WHERE metadata->>'category_name' = ?
\`;
\`\`\`

## 4. Performance Monitoring

Use these tools to monitor your JSON query performance:
- EXPLAIN ANALYZE for query plans
- pg_stat_statements for PostgreSQL
- Query performance insights

## Conclusion

JSON query optimization is crucial for modern applications. By following these techniques, you can achieve significant performance improvements.`,
            tags: ['JSON', 'Database', 'Performance', 'Optimization', 'PostgreSQL'],
            status: 'published',
            created_at: '2025-08-15T10:00:00.000Z',
            updated_at: '2025-08-15T10:00:00.000Z',
            view_count: 245,
            like_count: 18
        },
        {
            id: 'sample-mcp-agents',
            title: 'Building Intelligent Agents with MCP: A Complete Guide',
            excerpt: 'Learn how to build powerful AI agents using the Model Context Protocol (MCP) for seamless system integration.',
            content: `# Building Intelligent Agents with MCP: A Complete Guide

The Model Context Protocol (MCP) is revolutionizing how we build AI agents that can understand and interact with complex systems. In this guide, I'll walk you through creating your first MCP-powered agent.

## What is MCP?

MCP (Model Context Protocol) is a standardized way for AI models to interact with external tools and data sources. It provides:

- Standardized tool calling interface
- Context management
- Secure execution environment
- Extensible architecture

## Setting Up Your First MCP Agent

### 1. Installation

\`\`\`bash
npm install @modelcontextprotocol/sdk
\`\`\`

### 2. Basic Agent Structure

\`\`\`javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "my-agent",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    prompts: {},
    resources: {}
  }
});
\`\`\`

## Advanced Features

### Tool Integration
MCP agents can integrate with various tools:
- File systems
- Databases
- APIs
- Custom services

### Context Management
Proper context management ensures your agent maintains state across interactions.

## Best Practices

1. **Security First**: Always validate inputs
2. **Error Handling**: Implement robust error handling
3. **Performance**: Optimize for speed and efficiency
4. **Documentation**: Document your tools and capabilities

## Real-world Applications

I've successfully implemented MCP agents for:
- Code analysis and refactoring
- Database management
- API integration testing
- Content generation workflows

## Conclusion

MCP provides a powerful foundation for building intelligent agents. Start with simple tools and gradually add complexity as you learn the patterns.`,
            tags: ['MCP', 'AI Agents', 'Automation', 'JavaScript', 'Tools'],
            status: 'published',
            created_at: '2025-08-10T14:30:00.000Z',
            updated_at: '2025-08-10T14:30:00.000Z',
            view_count: 189,
            like_count: 24
        },
        {
            id: 'sample-langchain-patterns',
            title: 'Advanced LangChain Patterns for Enterprise Applications',
            excerpt: 'Explore enterprise-grade LangChain patterns and architectures for building production-ready AI applications.',
            content: `# Advanced LangChain Patterns for Enterprise Applications

As LangChain adoption grows in enterprise environments, it's crucial to understand advanced patterns that ensure scalability, reliability, and maintainability.

## Enterprise Architecture Patterns

### 1. Chain Composition Pattern

\`\`\`python
from langchain.chains import LLMChain, SequentialChain
from langchain.prompts import PromptTemplate

# Modular chain design
analysis_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("Analyze: {input}")
)

summary_chain = LLMChain(
    llm=llm, 
    prompt=PromptTemplate.from_template("Summarize: {analysis}")
)

# Compose chains
overall_chain = SequentialChain(
    chains=[analysis_chain, summary_chain],
    input_variables=["input"],
    output_variables=["summary"]
)
\`\`\`

### 2. Error Handling and Retry Logic

\`\`\`python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def robust_chain_call(chain, input_data):
    try:
        return chain.run(input_data)
    except Exception as e:
        logger.error(f"Chain execution failed: {e}")
        raise
\`\`\`

## Performance Optimization

### Caching Strategies
Implement intelligent caching for expensive operations:
- LLM response caching
- Embedding caching
- Vector store optimization

### Batch Processing
Handle multiple requests efficiently

## Security Considerations

1. **Input Sanitization**: Always validate and sanitize inputs
2. **Rate Limiting**: Implement proper rate limiting
3. **API Key Management**: Secure API key handling
4. **Output Filtering**: Filter sensitive information from outputs

## Conclusion

Enterprise LangChain applications require careful consideration of architecture, performance, security, and monitoring.`,
            tags: ['LangChain', 'Enterprise', 'AI', 'Python', 'Architecture'],
            status: 'draft',
            created_at: '2025-08-05T16:20:00.000Z',
            updated_at: '2025-08-25T09:15:00.000Z',
            view_count: 67,
            like_count: 8
        }
    ];
}

function renderBlogs(blogsToRender = blogs) {
    const container = document.getElementById('blogs-container');
    const emptyState = document.getElementById('empty-state');
    
    if (blogsToRender.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = blogsToRender.map(blog => createBlogCard(blog)).join('');
    
    // Add event listeners to blog action buttons
    container.querySelectorAll('.edit-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => editBlog(blogsToRender[index]));
    });
    
    container.querySelectorAll('.view-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => viewBlog(blogsToRender[index]));
    });
    
    container.querySelectorAll('.share-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => shareBlog(blogsToRender[index]));
    });
    
    container.querySelectorAll('.delete-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => deleteBlog(blogsToRender[index]));
    });
}

function createBlogCard(blog) {
    const date = new Date(blog.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const tags = blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    // Calculate reading time (average 200 words per minute)
    const wordCount = blog.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    const actions = blog.status === 'draft' 
        ? `
            <button class="blog-action-btn edit-btn">
                <i class="fas fa-edit"></i>
                Edit
            </button>
            <button class="blog-action-btn view-btn">
                <i class="fas fa-eye"></i>
                Preview
            </button>
            <button class="blog-action-btn delete-btn">
                <i class="fas fa-trash"></i>
                Delete
            </button>
        `
        : `
            <button class="blog-action-btn edit-btn">
                <i class="fas fa-edit"></i>
                Edit
            </button>
            <button class="blog-action-btn view-btn">
                <i class="fas fa-eye"></i>
                View
            </button>
            <button class="blog-action-btn share-btn">
                <i class="fas fa-share"></i>
                Share
            </button>
        `;
    
    return `
        <article class="blog-card">
            <div class="blog-meta">
                <span class="blog-date">
                    <i class="fas fa-calendar"></i>
                    ${date}
                </span>
                <span class="blog-status ${blog.status}">${blog.status}</span>
            </div>
            <h3 class="blog-title">${blog.title}</h3>
            <p class="blog-excerpt">${blog.excerpt}</p>
            <div class="blog-stats">
                <span class="reading-time">
                    <i class="fas fa-clock"></i>
                    ${readingTime} min read
                </span>
                <span class="view-count">
                    <i class="fas fa-eye"></i>
                    ${blog.view_count || 0} views
                </span>
                <span class="like-count">
                    <i class="fas fa-heart"></i>
                    ${blog.like_count || 0} likes
                </span>
            </div>
            <div class="blog-tags">${tags}</div>
            <div class="blog-actions">${actions}</div>
        </article>
    `;
}

function editBlog(blog) {
    showBlogEditor(blog);
}

function viewBlog(blog) {
    // For now, show a simple preview
    // TODO: Create a proper blog view page
    const content = blog.content.substring(0, 500) + (blog.content.length > 500 ? '...' : '');
    alert(`Title: ${blog.title}\n\nContent:\n${content}`);
}

function shareBlog(blog) {
    // Simple share functionality
    if (navigator.share) {
        navigator.share({
            title: blog.title,
            text: blog.excerpt,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        const shareText = `${blog.title}\n\n${blog.excerpt}\n\nRead more at: ${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showMessage('Blog link copied to clipboard!', 'success');
        }).catch(() => {
            showMessage('Failed to copy link. Please try again.', 'error');
        });
    }
}

function deleteBlog(blog) {
    if (confirm(`Are you sure you want to delete "${blog.title}"?`)) {
        blogs = blogs.filter(b => b.id !== blog.id);
        localStorage.setItem('yashraj_blogs', JSON.stringify(blogs));
        renderBlogs();
        showMessage('Blog deleted successfully!', 'success');
    }
}

function filterBlogs(filter) {
    let filteredBlogs = blogs;
    
    switch (filter) {
        case 'published':
            filteredBlogs = blogs.filter(blog => blog.status === 'published');
            break;
        case 'draft':
            filteredBlogs = blogs.filter(blog => blog.status === 'draft');
            break;
        case 'all':
        default:
            filteredBlogs = blogs;
            break;
    }
    
    renderBlogs(filteredBlogs);
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        renderBlogs();
        return;
    }
    
    const filteredBlogs = blogs.filter(blog => 
        blog.title.toLowerCase().includes(query) ||
        blog.excerpt.toLowerCase().includes(query) ||
        blog.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    renderBlogs(filteredBlogs);
}

function toggleManageMode() {
    // Simple toggle for manage mode
    // TODO: Implement advanced management features
    showMessage('Advanced management features coming soon!', 'success');
}

function generateId() {
    return 'blog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showMessage(text, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const container = document.querySelector('.blog-content .container');
    container.insertBefore(message, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Theme toggle functionality (reuse from main site)
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleBtn?.querySelector('i');
    
    if (!themeToggleBtn) return;
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update icon based on current theme
    updateThemeIcon(currentTheme, themeIcon);
    
    // Add click event listener
    themeToggleBtn.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Update theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        updateThemeIcon(newTheme, themeIcon);
    });
}

function updateThemeIcon(theme, iconElement) {
    if (!iconElement) return;
    
    if (theme === 'dark') {
        iconElement.className = 'fas fa-sun';
    } else {
        iconElement.className = 'fas fa-moon';
    }
}

// Export functions for potential external use
window.BlogManager = {
    showBlogEditor,
    hideBlogEditor,
    loadBlogs,
    saveBlog,
    renderBlogs
};
