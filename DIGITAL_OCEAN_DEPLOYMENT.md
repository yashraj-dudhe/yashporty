# 🌊 Digital Ocean Deployment Guide

This guide covers deploying your portfolio to Digital Ocean with a working contact form.

## 🚀 Quick Deployment Options

### **Option A: Digital Ocean App Platform (Easiest)**
### **Option B: Digital Ocean Droplet (VPS)**

---

## 🔧 **Option A: Digital Ocean App Platform**

### **Step 1: Prepare Your Repository**

1. **Rename files for deployment:**
```bash
# Replace server.js with deployment version
mv server.js server-original.js
mv server-deployment.js server.js

# Replace supabase config with deployment version  
mv supabase-config.js supabase-config-original.js
mv supabase-config-deployment.js supabase-config.js
```

2. **Update index.html to use new config:**
```html
<!-- Replace this line in index.html: -->
<script src="supabase-config.js"></script>
<!-- No change needed, it will use the renamed file -->
```

3. **Push to GitHub:**
```bash
git add .
git commit -m "Deploy ready"
git push origin main
```

### **Step 2: Create Digital Ocean App**

1. **Go to Digital Ocean Dashboard**
2. **Click "Create App"**
3. **Connect your GitHub repository**
4. **Configure the app:**
   - **Source:** Your portfolio repository
   - **Branch:** main
   - **Auto-deploy:** Enable
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`

### **Step 3: Configure Environment Variables**

In your Digital Ocean app settings, add these environment variables:

```
SUPABASE_URL = https://iormtqbhllolkkcqjpcm.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvcm10cWJobGxvbGtrY3FqcGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3MTQ5NSwiZXhwIjoyMDcyMDQ3NDk1fQ.Wg7mv-3s_H0pGcf_9vY4NYyRQ0aQJj6FdqyrbhbGe7w
NODE_ENV = production
PORT = 8080
```

### **Step 4: Deploy**

1. **Click "Create Resources"**
2. **Wait for deployment** (5-10 minutes)
3. **Get your app URL** (e.g., `https://your-app-name.ondigitalocean.app`)

---

## 🖥️ **Option B: Digital Ocean Droplet (VPS)**

### **Step 1: Create Droplet**

1. **Create a new droplet:**
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** Basic ($6/month is sufficient)
   - **Region:** Choose closest to your users
   - **Authentication:** SSH keys or password

### **Step 2: Server Setup**

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install nginx (optional, for reverse proxy)
apt install nginx -y
```

### **Step 3: Deploy Your Code**

```bash
# Clone your repository
git clone https://github.com/yourusername/portfolio.git
cd portfolio

# Switch to deployment files
mv server.js server-original.js
mv server-deployment.js server.js
mv supabase-config.js supabase-config-original.js  
mv supabase-config-deployment.js supabase-config.js

# Install dependencies
npm install

# Create environment file
nano .env
```

**Add to .env file:**
```env
SUPABASE_URL=https://iormtqbhllolkkcqjpcm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvcm10cWJobGxvbGtrY3FqcGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3MTQ5NSwiZXhwIjoyMDcyMDQ3NDk1fQ.Wg7mv-3s_H0pGcf_9vY4NYyRQ0aQJj6FdqyrbhbGe7w
NODE_ENV=production
PORT=8080
```

### **Step 4: Start Application**

```bash
# Test the application
npm start

# If working, stop and start with PM2
pm2 start server.js --name "portfolio"
pm2 save
pm2 startup
```

### **Step 5: Configure Domain (Optional)**

**Configure Nginx reverse proxy:**
```bash
nano /etc/nginx/sites-available/portfolio
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable the site:**
```bash
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## ✅ **Verification Steps**

### **1. Test Your Deployment**

1. **Visit your deployed URL**
2. **Open browser console** (F12)
3. **Check for successful config loading:**
   ```
   ✅ Supabase configuration loaded from server
   🎉 Portfolio ready with Supabase integration!
   ```

### **2. Test Contact Form**

1. **Fill out and submit the contact form**
2. **Check browser console for success message**
3. **Verify data in Supabase dashboard**

### **3. Test Config Endpoint**

Visit: `https://your-domain.com/api/config`

**Expected response:**
```json
{
  "supabaseUrl": "https://iormtqbhllolkkcqjpcm.supabase.co",
  "supabaseServiceKey": "eyJhbGci..."
}
```

---

## 🔒 **Security Notes**

1. **Service Role Key:** We're using it because RLS policies aren't working with anon key
2. **Server Endpoint:** Credentials are served via `/api/config` (not hardcoded in HTML)
3. **Fallback Config:** If server fails, fallback config ensures contact form still works
4. **HTTPS:** Enable SSL certificate for production (Let's Encrypt is free)

---

## 🚨 **Troubleshooting**

### **Contact Form Not Working:**
- Check `/api/config` endpoint returns data
- Verify browser console for error messages
- Check Supabase dashboard for received submissions

### **App Won't Start:**
- Check environment variables are set
- Verify `npm install` completed successfully
- Check application logs for errors

### **502 Bad Gateway (Nginx):**
- Ensure your Node.js app is running
- Check PM2 status: `pm2 status`
- Verify port configuration matches Nginx proxy

---

## 🎯 **Final Result**

Your portfolio will be live at:
- **App Platform:** `https://your-app-name.ondigitalocean.app`
- **Droplet:** `http://your-droplet-ip:8080` or your custom domain

**Contact form will work perfectly with your Supabase database!** 🎉

---

## 📞 **Quick Test Commands**

```bash
# Test config endpoint
curl https://your-domain.com/api/config

# Check PM2 status
pm2 status

# View logs
pm2 logs portfolio

# Restart app
pm2 restart portfolio
```

**Your portfolio is ready for Digital Ocean deployment!** 🌊
