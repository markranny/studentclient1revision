# Quick Setup Guide - Fix MongoDB Connection

## 🚨 Current Issue
Your app is trying to connect to local MongoDB but it's not running.

## 🔧 Quick Fix Options

### Option 1: Use MongoDB Atlas (Recommended - No local installation needed)

1. **Go to [MongoDB Atlas](https://www.mongodb.com/atlas)**
2. **Create free account**
3. **Create a new cluster (free tier)**
4. **Click "Connect" → "Connect your application"**
5. **Copy the connection string**
6. **Set environment variable:**

```powershell
# In PowerShell, run this command:
$env:MONGODB_URI="mongodb+srv://username:yourpassword@cluster.mongodb.net/workout?retryWrites=true&w=majority"
```

### Option 2: Install Local MongoDB

1. **Download MongoDB Community Server**
2. **Install and start MongoDB service**
3. **The app will automatically connect**

## 🚀 Test Your Setup

1. **Restart your app:**
   ```bash
   npm start
   ```

2. **Look for this message:**
   ```
   ✅ MongoDB connected successfully!
   ```

3. **If you see errors, check:**
   - Connection string is correct
   - Password is correct
   - Network access is allowed (for Atlas)

## 📱 Your App Should Now Work!

- ✅ JavaScript files will load properly
- ✅ Database operations will work
- ✅ All features will be functional

## 🆘 Still Having Issues?

1. **Check the console output** - it now shows helpful error messages
2. **Verify your connection string** - make sure it includes `/workout` at the end
3. **Test with MongoDB Compass** - to verify your connection string works

---

**Need help?** The app will show specific error messages and solutions in the console! 