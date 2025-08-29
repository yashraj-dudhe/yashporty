# 🚀 Production Deployment Guide

This guide will help you deploy your portfolio with a working contact form to your domain and server.

## 📋 Pre-Deployment Checklist

### 1. **Setup Supabase Database**
Run the SQL script in your Supabase dashboard:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Database** > **SQL Editor**
3. Copy and paste `PRODUCTION_RLS_SETUP.sql`
4. Click **Run**

### 2. **Verify Your .env File**
Your `.env` file should contain:
```env
SUPABASE_URL=https://iormtqbhllolkkcqjpcm.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=production
PORT=5000
```

### 3. **Test Locally First**
```bash
# Install dependencies
npm install

# Start the server
npm start
# OR
node server.js

# Test at: http://localhost:5000
```

## 🌐 Deployment Options

### **Option A: Deploy with Node.js Server (Recommended)**

**Files to upload to your server:**
```
portfolio/
├── index.html
├── style.css
├── script.js
├── supabase-config.js
├── server.js
├── package.json
├── .env                 # Upload but keep secure
├── yashraj.jpg
└── .gitignore
```

**Server Setup:**
1. Upload all files to your server
2. Install Node.js on your server
3. Run: `npm install`
4. Start: `node server.js` or use PM2: `pm2 start server.js`
5. Configure your domain to point to the server

**Benefits:**
- ✅ Secure credential handling via `/api/config` endpoint
- ✅ Uses only anon key client-side (secure)
- ✅ Full server control

### **Option B: Static Hosting (Simpler but Less Secure)**

**Files to upload:**
```
portfolio/
├── index.html
├── style.css
├── script.js
├── supabase-config.js
├── yashraj.jpg
└── .gitignore
```

**Setup:**
1. Upload files to your static hosting
2. The fallback configuration in `supabase-config.js` will be used
3. Make sure you've run the RLS setup SQL

**Note:** Uses anon key directly in JavaScript (still secure if RLS is properly configured)

## 🔧 Server Configuration

### **For VPS/Dedicated Server:**

1. **Install Node.js:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

2. **Upload Files:**
```bash
# Using SCP
scp -r portfolio/ user@your-server.com:/var/www/

# Using SFTP/FTP with FileZilla or similar
```

3. **Install Dependencies:**
```bash
cd /var/www/portfolio
npm install
```

4. **Start with PM2 (recommended):**
```bash
# Install PM2
npm install -g pm2

# Start your app
pm2 start server.js --name "portfolio"

# Save PM2 configuration
pm2 save
pm2 startup
```

5. **Configure Nginx (if using):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **For Shared Hosting:**

If your shared hosting supports Node.js:
1. Upload all files
2. Install dependencies via hosting control panel or SSH
3. Start the application according to your host's instructions

If static files only:
1. Upload only the static files (Option B above)
2. Ensure the RLS policies are set up correctly

## 🔒 Security Checklist

- ✅ Never expose service role key in client-side code
- ✅ Use HTTPS in production
- ✅ Keep `.env` file secure (not publicly accessible)
- ✅ Verify RLS policies are working
- ✅ Test contact form submission

## 🧪 Testing After Deployment

1. **Visit your domain**
2. **Open browser console** (F12)
3. **Submit a contact form**
4. **Check for errors** in console
5. **Verify data** appears in Supabase dashboard

## 🚨 Troubleshooting

### **Form not working:**
- Check browser console for errors
- Verify `/api/config` endpoint returns data
- Confirm RLS policies in Supabase

### **CORS errors:**
- Add your domain to Supabase CORS origins
- Check server CORS headers

### **Environment variables not loaded:**
- Verify `.env` file is in the correct location
- Check file permissions
- Ensure `dotenv` package is installed

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Supabase dashboard for submission data
3. Test the `/api/config` endpoint directly: `https://yourdomain.com/api/config`

## 🎉 You're Ready!

Your portfolio is now production-ready with:
- ✅ Secure Supabase integration
- ✅ Working contact form
- ✅ Professional deployment setup
- ✅ Proper credential management
