// Alternative server.js for deployment without .env file
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables (try .env file first, fallback to environment)
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv not available, using environment variables');
}

// Configuration - fallback to hardcoded values if env vars not available
const CONFIG = {
    port: process.env.PORT || 8080,
    supabaseUrl: process.env.SUPABASE_URL || 'https://iormtqbhllolkkcqjpcm.supabase.co',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvcm10cWJobGxvbGtrY3FqcGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3MTQ5NSwiZXhwIjoyMDcyMDQ3NDk1fQ.Wg7mv-3s_H0pGcf_9vY4NYyRQ0aQJj6FdqyrbhbGe7w',
    nodeEnv: process.env.NODE_ENV || 'production'
};

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    // Handle API endpoint for Supabase config
    if (req.url === '/api/config') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        // Return the service role key for contact form (since RLS doesn't work with anon key)
        const config = {
            supabaseUrl: CONFIG.supabaseUrl,
            supabaseServiceKey: CONFIG.supabaseServiceKey
        };
        
        res.end(JSON.stringify(config));
        return;
    }
    
    let filePath = '.' + req.url;
    
    // Default to index.html
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content);
        }
    });
});

server.listen(CONFIG.port, () => {
    console.log(`🚀 Portfolio server running on port ${CONFIG.port}`);
    console.log(`📡 Config endpoint: /api/config`);
    console.log(`🌍 Environment: ${CONFIG.nodeEnv}`);
    
    // Validate configuration
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
        console.warn('⚠️  WARNING: Supabase configuration missing!');
    } else {
        console.log('✅ Supabase configuration loaded');
        console.log(`📊 Supabase URL: ${CONFIG.supabaseUrl}`);
    }
});
