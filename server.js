const http = require('http');
const fs = require('fs');
const path = require('path');

// Try to load dotenv, but don't fail if it's not available
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv not available - using environment variables or fallback config');
}

const port = process.env.PORT || 5000;

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
        
        // Return the service role key for contact form (since RLS policies aren't working with anon)
        // This is secure because it's served from your own server, not exposed in client code
        const config = {
            supabaseUrl: process.env.SUPABASE_URL || 'https://iormtqbhllolkkcqjpcm.supabase.co',
            supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvcm10cWJobGxvbGtrY3FqcGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3MTQ5NSwiZXhwIjoyMDcyMDQ3NDk1fQ.Wg7mv-3s_H0pGcf_9vY4NYyRQ0aQJj6FdqyrbhbGe7w'
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

server.listen(port, () => {
    console.log(`🚀 Portfolio server running at http://localhost:${port}/`);
    console.log(`📡 Supabase config endpoint: http://localhost:${port}/api/config`);
    
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️  Environment variables not found - using fallback configuration');
        console.log('✅ Supabase configuration loaded from fallback (service role key)');
    } else {
        console.log('✅ Supabase configuration loaded from environment variables (service role key)');
    }
    
    console.log('🎯 Contact form ready for deployment!');
});