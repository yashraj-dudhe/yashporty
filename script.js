// Minimal AI Portfolio JavaScript
// Fast, efficient, and focused on performance

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileNav();
    initScrollAnimations();
    initContactForm();
    initTypingAnimation();
    initThemeToggle();
    
    console.log('AI Portfolio initialized successfully');
});

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    let isManualNavigation = false;
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            // Set manual navigation flag
            isManualNavigation = true;
            
            // Update active link IMMEDIATELY on click
            updateActiveNav(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Reset manual navigation flag after scroll completes
                setTimeout(() => {
                    isManualNavigation = false;
                }, 1000);
            }
        });
    });
    
    // Update active nav link on scroll (only if not manually navigating) - optimized throttling
    window.addEventListener('scroll', throttle(() => {
        if (!isManualNavigation) {
            updateNavOnScroll();
        }
    }, 200), { passive: true });
    
}

function updateActiveNav(targetId) {
    const navLinks = document.querySelectorAll('.nav-link');
    // Remove all active and switching classes immediately
    navLinks.forEach(link => {
        link.classList.remove('active', 'switching');
    });
    
    // Add active class to the target link only
    const targetLink = document.querySelector(`.nav-link[href="${targetId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
        targetLink.classList.add('switching');
        
        // Remove switching class after animation completes
        setTimeout(() => {
            targetLink.classList.remove('switching');
        }, 200);
    }
}

function updateNavOnScroll() {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.pageYOffset + 150;
    let activeSection = null;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = '#' + section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            activeSection = sectionId;
        }
    });
    
    if (activeSection) {
        const currentActive = document.querySelector('.nav-link.active');
        const targetLink = document.querySelector(`[href="${activeSection}"]`);
        
        // Only update if it's different from current active
        if (currentActive !== targetLink) {
            updateActiveNav(activeSection);
        }
    }
}

// Mobile navigation functionality
function initMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (navToggle && navMenu) {
        // Toggle mobile menu
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Update icon
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
        
        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navMenu.classList.remove('active');
                    navToggle.querySelector('i').className = 'fas fa-bars';
                }
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.querySelector('i').className = 'fas fa-bars';
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navMenu.classList.remove('active');
                navToggle.querySelector('i').className = 'fas fa-bars';
            }
        });
    }
}


// Optimized scroll animations using Intersection Observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target); // Stop observing after animation
            }
        });
    }, observerOptions);
    
    // Observe only key elements that need animation
    const animateElements = document.querySelectorAll(
        '.project-card, .pillar, .skills-container'
    );
    
    animateElements.forEach(el => {
        el.classList.add('animate-ready');
        observer.observe(el);
    });
}

// Animate numbers in stats
function animateNumber(element) {
    const numberElement = element.querySelector('h3');
    if (!numberElement) return;
    
    const text = numberElement.textContent;
    const number = parseInt(text);
    if (isNaN(number)) return;
    
    let currentNumber = 0;
    const increment = number / 30;
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= number) {
            numberElement.textContent = number + '+';
            clearInterval(timer);
        } else {
            numberElement.textContent = Math.floor(currentNumber) + '+';
        }
    }, 50);
}

// Contact form functionality
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Validate form
            const formData = new FormData(this);
            const name = formData.get('name')?.trim();
            const email = formData.get('email')?.trim();
            const subject = formData.get('subject')?.trim();
            const message = formData.get('message')?.trim();
            
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            // Submit to Supabase
            submitToSupabase({
                name: name,
                email: email,
                subject: subject,
                message: message
            }).then(result => {
                if (result.success) {
                    showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                    // Reset form
                    this.reset();
                } else {
                    showNotification('Failed to send message. Please try again or contact me directly.', 'error');
                }
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }).catch(error => {
                console.error('Form submission error:', error);
                showNotification('Failed to send message. Please try again or contact me directly.', 'error');
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Set styles based on type
    const styles = {
        position: 'fixed',
        top: '100px',
        right: '20px',
        maxWidth: '400px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: '500',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(178, 150, 125, 0.2)'
    };
    
    const colors = {
        success: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
        error: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
        info: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' }
    };
    
    const typeColors = colors[type] || colors.info;
    
    Object.assign(notification.style, {
        ...styles,
        background: typeColors.bg,
        color: typeColors.color,
        border: `1px solid ${typeColors.border}`
    });
    
    document.body.appendChild(notification);
    
    // Show notification
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });
    
    // Hide notification after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility function for throttling
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add smooth hover effects to cards
function initCardEffects() {
    const cards = document.querySelectorAll('.project-card, .skill-category, .pillar, .stat');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Performance monitoring
window.addEventListener('load', function() {
    const loadTime = performance.now();
    console.log(`🚀 AI Portfolio loaded in ${Math.round(loadTime)}ms`);
    
    // Initialize additional effects after load
    setTimeout(() => {
        initCardEffects();
    }, 100);
});

// Typing animation for hero title
function initTypingAnimation() {
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;
    
    const text = 'Yashraj Dudhe';
    const speed = 150; // Typing speed in milliseconds
    const pauseBeforeRestart = 2000; // Pause before restarting animation
    
    function typeText() {
        typingElement.textContent = '';
        typingElement.classList.add('typing');
        
        let i = 0;
        function typeChar() {
            if (i < text.length) {
                typingElement.textContent += text.charAt(i);
                i++;
                setTimeout(typeChar, speed);
            } else {
                typingElement.classList.remove('typing');
                // Optional: restart animation after pause
                // setTimeout(typeText, pauseBeforeRestart);
            }
        }
        
        typeChar();
    }
    
    // Start typing animation after a brief delay
    setTimeout(typeText, 500);
}

// Supabase integration for contact form
async function submitToSupabase(formData) {
    try {
        console.log('Starting form submission...');
        console.log('Form data:', formData);
        
        // Check if Supabase is available
        if (!window.supabase) {
            console.error('Supabase library not loaded');
            return { success: false, error: 'Supabase library not available' };
        }
        
        if (!window.SUPABASE_CONFIG) {
            console.error('Supabase config not loaded');
            return { success: false, error: 'Supabase configuration not available' };
        }
        
        if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.key) {
            console.error('Supabase config incomplete:', window.SUPABASE_CONFIG);
            return { success: false, error: 'Supabase configuration incomplete' };
        }

        console.log('Initializing Supabase client with:', {
            url: window.SUPABASE_CONFIG.url,
            keyLength: window.SUPABASE_CONFIG.key.length
        });

        // Initialize Supabase client
        const supabase = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key
        );

        const submissionData = {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            submitted_at: new Date().toISOString()
        };
        
        console.log('Submitting data to Supabase:', submissionData);

        // Insert contact form data
        const { data, error } = await supabase
            .from('contact_submissions')
            .insert([submissionData])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error: error.message };
        }

        console.log('Form submitted successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error submitting to Supabase:', error);
        return { success: false, error: error.message };
    }
}

// Theme Toggle functionality
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleBtn.querySelector('i');
    
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
    if (theme === 'dark') {
        iconElement.className = 'fas fa-sun';
    } else {
        iconElement.className = 'fas fa-moon';
    }
}

// Console message for developers
console.log(`
    ╭─────────────────────────────────────╮
    │                                     │
    │   🤖 AI Portfolio - Yashraj Dudhe   │
    │                                     │
    │   Built with modern web standards   │
    │   → Minimal & Fast                  │
    │   → AI-Centric Design               │
    │   → Accessible & Responsive         │
    │                                     │
    │   Interested in AI projects?        │
    │   Let's collaborate!                │
    │                                     │
    ╰─────────────────────────────────────╯
`);