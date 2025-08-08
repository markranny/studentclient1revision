# Local MongoDB Setup Guide for FitTrack

## 🎯 Quick Setup - Local MongoDB

### Step 1: Download MongoDB Community Server

1. **Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)**
2. **Select:**
   - Version: Latest (7.0.x)
   - Platform: Windows
   - Package: MSI
3. **Click "Download"**

### Step 2: Install MongoDB

1. **Run the downloaded .msi file**
2. **Choose "Complete" installation**
3. **Install MongoDB Compass (optional but recommended)**
4. **Complete the installation**

### Step 3: Start MongoDB Service

**Option A: Automatic (Recommended)**
- MongoDB should start automatically as a Windows service
- Check if it's running:
  ```powershell
  Get-Service -Name MongoDB
  ```

**Option B: Manual Start**
```powershell
# Start MongoDB service
Start-Service MongoDB

# Or if service name is different:
Start-Service "MongoDB Server"
```

### Step 4: Test Your App

1. **Start your FitTrack app:**
   ```bash
   npm start
   ```

2. **Look for success message:**
   ```
   🔗 Attempting to connect to MongoDB...
   📝 Connection string: Using local MongoDB
   ✅ MongoDB connected successfully!
   🌐 Database: workout
   ```

### Step 5: Verify Installation

**Check if MongoDB is running:**
```powershell
# Check service status
Get-Service -Name MongoDB

# Check if port 27017 is listening
netstat -an | findstr 27017
```

## 🔧 Troubleshooting

### MongoDB Service Not Starting

1. **Check Windows Services:**
   - Press `Win + R`
   - Type `services.msc`
   - Find "MongoDB" service
   - Right-click → Start

2. **Manual MongoDB Start:**
   ```powershell
   # Navigate to MongoDB bin directory (adjust path as needed)
   cd "C:\Program Files\MongoDB\Server\7.0\bin"
   
   # Start MongoDB daemon
   .\mongod.exe --dbpath="C:\data\db"
   ```

### Create Data Directory

If MongoDB can't find the data directory:
```powershell
# Create data directory
mkdir C:\data\db
```

### Port Already in Use

If port 27017 is already in use:
```powershell
# Find what's using the port
netstat -ano | findstr 27017

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## 🚀 Your App Configuration

Your app is already configured for local MongoDB:
- **Connection:** `mongodb://localhost:27017/workout`
- **Database:** `workout` (auto-created)
- **Collection:** `workouts` (auto-created)

## 📱 Test Your Setup

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Visit:** `http://localhost:3000`

3. **Create a workout** - data will be saved to local MongoDB

4. **Optional: Seed with sample data:**
   ```bash
   npm run seed
   ```

## 🎉 Success Indicators

- ✅ MongoDB service is running
- ✅ App shows "✅ MongoDB connected successfully!"
- ✅ You can create and view workouts
- ✅ Data persists between app restarts

---

**Need help?** Check the console output for specific error messages! 