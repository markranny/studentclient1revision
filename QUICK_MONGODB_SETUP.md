# Quick MongoDB Setup - Choose Your Option

## 🚀 Option 1: MongoDB Community Server (Recommended)

### Download & Install:
1. **Go to:** https://www.mongodb.com/try/download/community
2. **Download:** Windows MSI installer
3. **Install:** Run as administrator, choose "Complete" installation
4. **MongoDB will start automatically as a Windows service**

### Test Installation:
```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB

# Start MongoDB if needed
Start-Service MongoDB
```

## 🚀 Option 2: MongoDB via Chocolatey (Fastest)

If you have Chocolatey installed:
```powershell
# Install MongoDB
choco install mongodb

# Start MongoDB service
Start-Service MongoDB
```

## 🚀 Option 3: Docker (If you have Docker)

```powershell
# Pull and run MongoDB container
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Check if container is running
docker ps
```

## 🚀 Option 4: Manual MongoDB Start

If you have MongoDB installed but service isn't running:

```powershell
# Create data directory
mkdir C:\data\db

# Start MongoDB manually (adjust path to your installation)
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

## ✅ Test Your Setup

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Look for:**
   ```
   ✅ MongoDB connected successfully!
   ```

3. **Visit:** `http://localhost:3000`

## 🔧 Quick Troubleshooting

### If MongoDB won't start:
```powershell
# Check what's using port 27017
netstat -ano | findstr 27017

# Kill process if needed (replace PID)
taskkill /PID <PID> /F
```

### If service doesn't exist:
- Reinstall MongoDB
- Make sure to run installer as administrator

### If data directory missing:
```powershell
mkdir C:\data\db
```

## 🎯 Recommended: Option 1

**Download MongoDB Community Server** - it's the most reliable and includes:
- ✅ Automatic Windows service
- ✅ MongoDB Compass (GUI)
- ✅ Proper installation
- ✅ Easy updates

---

**After installation, just run:**
```bash
npm start
```

Your app will automatically connect to local MongoDB! 🎉 