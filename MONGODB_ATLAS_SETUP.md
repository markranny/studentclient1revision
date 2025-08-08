# MongoDB Atlas Setup Guide for FitTrack

## ✅ Dependencies Status
All dependencies are properly installed:
- ✅ express@4.21.2
- ✅ mongoose@7.8.7  
- ✅ morgan@1.10.1
- ✅ nodemon@3.1.10

## 🎯 MongoDB Atlas Setup for Your cluster0

### Step 1: Get Your Connection String

1. **Log into [MongoDB Atlas](https://cloud.mongodb.com)**
2. **Select your cluster0**
3. **Click "Connect" button**
4. **Choose "Connect your application"**
5. **Select "Node.js" as driver**
6. **Copy the connection string**

### Step 2: Configure Your Connection String

Your connection string will look like this:
```
mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
$env:MONGODB_URI="mongodb+srv://abuyolancebenedict:benedict21@cluster0.dfveofc.mongodb.net/workout?retryWrites=true&w=majority&appName=Cluster0"

**Important:** You need to:
1. Replace `<password>` with your actual password
2. Add `/workout` at the end (before the `?`)

**Final format:**
```
mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/workout?retryWrites=true&w=majority
```

### Step 3: Set Environment Variable

**For Windows PowerShell:**
```powershell
$env:MONGODB_URI="mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/workout?retryWrites=true&w=majority"
```

**For Windows Command Prompt:**
```cmd
set MONGODB_URI=mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/workout?retryWrites=true&w=majority


set MONGODB_URI=mongodb+srv:mongodb+srv://abuyolancebenedict:benedict21@cluster0.dfveofc.mongodb.net/workout?retryWrites=true&w=majority&appName=Cluster0
```

### Step 4: Database & Collection Setup

Your app will automatically:
- ✅ Create the `workout` database
- ✅ Create the `workouts` collection (Mongoose pluralizes "Workout" model)
- ✅ Set up the proper schema structure

### Step 5: Test Your Connection

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Look for success message:**
   ```
   🔗 Attempting to connect to MongoDB...
   📝 Connection string: Using MongoDB Atlas
   ✅ MongoDB connected successfully!
   🌐 Database: workout
   ```

### Step 6: Seed Your Database (Optional)

If you want sample data:
```bash
npm run seed
```

This will create sample workouts in your `workouts` collection.

## 🔧 Troubleshooting

### Common Issues:

1. **Authentication Error**
   - Check username and password
   - Ensure database user has read/write permissions

2. **Network Access Error**
   - Go to Atlas → Network Access
   - Add your IP address or `0.0.0.0/0` for all IPs

3. **Connection String Format**
   - Must include `/workout` before the `?`
   - No spaces in the connection string

### Verify Your Setup:

1. **Check Atlas Dashboard:**
   - Go to your cluster0
   - Click "Browse Collections"
   - You should see a `workout` database with `workouts` collection

2. **Test API Endpoints:**
   - Visit `http://localhost:3000`
   - Try creating a workout
   - Check if data appears in Atlas

## 🚀 Your App Structure

- **Database:** `workout`
- **Collection:** `workouts` (auto-created from Workout model)
- **Schema:** Matches your Workout.js model
- **API:** All CRUD operations ready

## 📱 Next Steps

1. Set your environment variable
2. Start the app: `npm start`
3. Visit `http://localhost:3000`
4. Create your first workout!

---

**Need help?** The app console will show detailed connection status and error messages. 