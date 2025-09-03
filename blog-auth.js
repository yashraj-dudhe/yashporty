// Blog Admin Authentication System
// Simple, secure authentication for blog management

class BlogAuth {
    constructor() {
        this.isAuthenticated = localStorage.getItem('blog_admin_auth') === 'true';
        this.adminPassword = 'YashBlog2025!'; // TODO: Change this to your secure password
        this.init();
    }

    init() {
        // Check if we're on the admin page
        if (window.location.pathname.includes('blogs.html')) {
            if (!this.isAuthenticated) {
                this.showLoginModal();
            } else {
                this.showAdminToolbar();
            }
        }
    }

    showLoginModal() {
        // Hide the main content until authenticated
        const mainContent = document.querySelector('.blog-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }

        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-overlay"></div>
            <div class="auth-content">
                <div class="auth-header">
                    <i class="fas fa-shield-alt"></i>
                    <h2>Admin Login Required</h2>
                    <p>Enter your password to access the blog management system</p>
                </div>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="adminPassword">Admin Password</label>
                        <input type="password" id="adminPassword" placeholder="Enter admin password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i>
                        Login
                    </button>
                    <div class="auth-footer">
                        <a href="index.html" class="back-link">
                            <i class="fas fa-arrow-left"></i>
                            Back to Portfolio
                        </a>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles
        this.addAuthStyles();

        // Focus on password input
        setTimeout(() => {
            document.getElementById('adminPassword').focus();
        }, 100);

        // Handle form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            const passwordInput = document.getElementById('adminPassword');
            
            if (this.validatePassword(password)) {
                this.login();
                modal.remove();
                // Show main content
                if (mainContent) {
                    mainContent.style.display = 'block';
                }
                this.showAdminToolbar();
                this.showSuccessMessage('Welcome back, Yashraj! 👋');
            } else {
                // Show error
                passwordInput.classList.add('error');
                passwordInput.value = '';
                passwordInput.placeholder = 'Invalid password - try again';
                
                setTimeout(() => {
                    passwordInput.classList.remove('error');
                    passwordInput.placeholder = 'Enter admin password';
                }, 2000);
            }
        });
    }

    showAdminToolbar() {
        // Check if toolbar already exists
        if (document.querySelector('.admin-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'admin-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="admin-welcome">
                    <div class="admin-avatar">
                        <i class="fas fa-user-crown"></i>
                    </div>
                    <div class="admin-info">
                        <span class="admin-greeting">👋 Welcome back, Yashraj!</span>
                        <span class="admin-role">Blog Administrator</span>
                    </div>
                </div>
                <div class="admin-actions">
                    <button onclick="window.open('blog-public.html', '_blank')" class="btn btn-outline">
                        <i class="fas fa-external-link-alt"></i>
                        View Public Blog
                    </button>
                    <button onclick="window.location.href='index.html'" class="btn btn-outline">
                        <i class="fas fa-home"></i>
                        Portfolio
                    </button>
                    <button onclick="blogAuth.logout()" class="btn btn-secondary">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </div>
        `;

        // Insert after navigation
        const nav = document.querySelector('.navbar');
        if (nav) {
            nav.insertAdjacentElement('afterend', toolbar);
        }

        this.addToolbarStyles();
    }

    validatePassword(password) {
        return password === this.adminPassword;
    }

    login() {
        localStorage.setItem('blog_admin_auth', 'true');
        localStorage.setItem('blog_admin_login_time', Date.now().toString());
        this.isAuthenticated = true;
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('blog_admin_auth');
            localStorage.removeItem('blog_admin_login_time');
            this.isAuthenticated = false;
            this.showSuccessMessage('Logged out successfully! 👋');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    addAuthStyles() {
        if (document.getElementById('auth-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'auth-styles';
        styles.textContent = `
            .auth-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }

            .auth-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
            }

            .auth-content {
                position: relative;
                background: var(--bg-primary);
                border-radius: 16px;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                border: 1px solid var(--border-light);
                animation: slideUp 0.3s ease;
            }

            .auth-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .auth-header i {
                font-size: 3rem;
                color: var(--accent-color);
                margin-bottom: 1rem;
            }

            .auth-header h2 {
                color: var(--text-primary);
                margin-bottom: 0.5rem;
                font-size: 1.5rem;
            }

            .auth-header p {
                color: var(--text-secondary);
                font-size: 0.9rem;
            }

            .auth-form .form-group {
                margin-bottom: 1.5rem;
            }

            .auth-form label {
                display: block;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
                font-weight: 500;
            }

            .auth-form input {
                width: 100%;
                padding: 1rem;
                border: 2px solid var(--border-light);
                border-radius: 8px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 1rem;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .auth-form input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.1);
            }

            .auth-form input.error {
                border-color: #dc2626;
                background: rgba(220, 38, 38, 0.1);
                animation: shake 0.5s ease;
            }

            .auth-form .btn {
                width: 100%;
                padding: 1rem;
                font-size: 1rem;
                margin-bottom: 1rem;
            }

            .auth-footer {
                text-align: center;
                padding-top: 1rem;
                border-top: 1px solid var(--border-light);
            }

            .back-link {
                color: var(--text-secondary);
                text-decoration: none;
                font-size: 0.9rem;
                transition: color 0.3s ease;
            }

            .back-link:hover {
                color: var(--accent-color);
            }

            .success-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #22c55e;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }

            .success-toast.show {
                opacity: 1;
                transform: translateX(0);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(30px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        
        document.head.appendChild(styles);
    }

    addToolbarStyles() {
        if (document.getElementById('toolbar-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'toolbar-styles';
        styles.textContent = `
            .admin-toolbar {
                background: linear-gradient(135deg, var(--accent-color), #8b5cf6);
                color: white;
                padding: 1rem 0;
                margin-bottom: 2rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .toolbar-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }

            .admin-welcome {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .admin-avatar {
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
            }

            .admin-info {
                display: flex;
                flex-direction: column;
            }

            .admin-greeting {
                font-size: 1.1rem;
                font-weight: 600;
            }

            .admin-role {
                font-size: 0.85rem;
                opacity: 0.9;
            }

            .admin-actions {
                display: flex;
                gap: 0.75rem;
                align-items: center;
            }

            .admin-actions .btn {
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                border: 1px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
                color: white;
                transition: all 0.3s ease;
            }

            .admin-actions .btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }

            .admin-actions .btn-secondary {
                background: rgba(220, 38, 38, 0.8);
                border-color: rgba(220, 38, 38, 0.8);
            }

            .admin-actions .btn-secondary:hover {
                background: rgba(220, 38, 38, 1);
            }

            @media (max-width: 768px) {
                .toolbar-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 1rem;
                }

                .admin-actions {
                    justify-content: center;
                    flex-wrap: wrap;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Check session validity (optional: auto-logout after inactivity)
    checkSession() {
        const loginTime = localStorage.getItem('blog_admin_login_time');
        if (loginTime) {
            const now = Date.now();
            const sessionDuration = now - parseInt(loginTime);
            const maxSession = 24 * 60 * 60 * 1000; // 24 hours
            
            if (sessionDuration > maxSession) {
                this.logout();
                return false;
            }
        }
        return true;
    }
}

// Initialize auth when page loads
let blogAuth;
document.addEventListener('DOMContentLoaded', () => {
    blogAuth = new BlogAuth();
});

// Export for global access
window.BlogAuth = BlogAuth;
