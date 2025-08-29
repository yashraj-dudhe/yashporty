// Supabase client-side configuration
// This file loads environment variables and initializes Supabase for the browser

// Configuration object that will be populated with environment variables
window.SUPABASE_CONFIG = {
    url: null,
    key: null
};

// Function to load environment configuration
async function loadSupabaseConfig() {
    try {
        // For production deployment, load from server endpoint (SECURE)
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                window.SUPABASE_CONFIG.url = config.supabaseUrl;
                window.SUPABASE_CONFIG.key = config.supabaseKey; // Service role key from server
                console.log('✅ Supabase configuration loaded from server (service role)');
            } else {
                throw new Error('Config endpoint not available');
            }
        } catch (fetchError) {
            console.warn('Server config endpoint not available, using fallback...');
            
            // Fallback for static hosting (use service role key since RLS doesn't work with anon)
            window.SUPABASE_CONFIG.url = 'https://iormtqbhllolkkcqjpcm.supabase.co';
            window.SUPABASE_CONFIG.key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvcm10cWJobGxvbGtrY3FqcGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3MTQ5NSwiZXhwIjoyMDcyMDQ3NDk1fQ.Wg7mv-3s_H0pGcf_9vY4NYyRQ0aQJj6FdqyrbhbGe7w';
            console.log('✅ Using fallback Supabase configuration (service role)');
        }
        
        // Validate configuration
        if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.key) {
            console.warn('Supabase configuration not found. Contact form will not work.');
            return false;
        }
        
        console.log('Supabase URL:', window.SUPABASE_CONFIG.url);
        return true;
    } catch (error) {
        console.error('Error loading Supabase configuration:', error);
        return false;
    }
}

// Initialize Supabase when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadSupabaseConfig();
});

// Export for use in other scripts
window.loadSupabaseConfig = loadSupabaseConfig;
