# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. Setup Supabase Database
- [ ] Run `PRODUCTION_RLS_SETUP.sql` in Supabase SQL Editor
- [ ] Verify the `contact_submissions` table exists
- [ ] Test that anonymous inserts work

### 2. Prepare Files
- [ ] Verify `.env` file has correct credentials
- [ ] Run `npm install` to install dependencies
- [ ] Test locally with `npm start`
- [ ] Visit `http://localhost:5000` and test contact form

### 3. Upload to Server
- [ ] Upload all files to your server
- [ ] Install Node.js and npm on server
- [ ] Run `npm install` on server
- [ ] Configure environment variables

### 4. Start Server
- [ ] Test: `node server.js`
- [ ] Production: `pm2 start server.js` (recommended)
- [ ] Configure domain/DNS to point to your server

### 5. Final Verification
- [ ] Visit your live domain
- [ ] Test contact form submission
- [ ] Check Supabase dashboard for received data
- [ ] Verify no console errors

## 🔧 Essential Files for Deployment

**Core Files (Required):**
- `index.html` - Main portfolio page
- `style.css` - Styling
- `script.js` - JavaScript functionality
- `supabase-config.js` - Supabase configuration
- `server.js` - Node.js server
- `package.json` - Dependencies
- `.env` - Environment variables (keep secure!)
- `yashraj.jpg` - Profile image

**Optional Files:**
- `.gitignore` - Git ignore rules
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `PRODUCTION_RLS_SETUP.sql` - Database setup script

## 🌐 Server Requirements

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Port 5000** (or configure PORT in .env)
- **HTTPS recommended** (use Let's Encrypt for free SSL)

## 🔗 Key Endpoints

- `https://yourdomain.com/` - Main portfolio
- `https://yourdomain.com/api/config` - Supabase config (should return JSON)

## 📞 Test Command

```bash
# Test config endpoint
curl https://yourdomain.com/api/config

# Expected response:
# {"supabaseUrl":"https://...","supabaseAnonKey":"eyJ..."}
```

## 🎯 Success Criteria

- ✅ Portfolio loads without errors
- ✅ Contact form submits successfully
- ✅ Data appears in Supabase dashboard
- ✅ No console errors in browser
- ✅ Config endpoint returns credentials

---

**Your portfolio is ready for production! 🎉**
