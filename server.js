require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const path = require("path");

const PORT = process.env.PORT || 3000;
const app = express();

// Enhanced logging
console.log("🚀 Starting FitTrack Server...");
console.log("📅", new Date().toISOString());
console.log("🔧 Node.js version:", process.version);
console.log("🌐 Environment:", process.env.NODE_ENV || "development");

// Middleware setup
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' })); // Increased limit for larger payloads
app.use(express.static("public"));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);
    next();
});

// MongoDB connection with enhanced error handling
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/workout";

console.log("🔗 Attempting to connect to MongoDB...");
console.log("📝 Connection type:", MONGO_URI.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas");

// Enhanced MongoDB connection options
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
};

mongoose.connect(MONGO_URI, mongooseOptions)
    .then(() => {
        console.log("✅ MongoDB connected successfully!");
        console.log("🗄️  Database:", mongoose.connection.name);
        console.log("🔌 Connection state:", mongoose.connection.readyState === 1 ? "Connected" : "Connecting");
        
        // Test the connection with a simple query
        return mongoose.connection.db.admin().ping();
    })
    .then(() => {
        console.log("🏓 MongoDB ping successful - database is responsive");
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err.message);
        console.log("\n🔧 Troubleshooting steps:");
        console.log("1. For local MongoDB:");
        console.log("   - Install MongoDB: https://docs.mongodb.com/manual/installation/");
        console.log("   - Start MongoDB service: mongod or brew services start mongodb/brew/mongodb-community");
        console.log("   - Verify connection: mongo or mongosh");
        console.log("\n2. For MongoDB Atlas:");
        console.log("   - Set MONGODB_URI environment variable");
        console.log("   - Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workout");
        console.log("   - Verify network access and database user permissions");
        console.log("\n📱 Server will continue running but database features won't work until MongoDB is connected.");
    });

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
    console.log('🔌 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

// Handle app termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
});

// Enhanced Google OAuth Routes
app.get('/auth/google', (req, res) => {
    console.log('🔐 Google OAuth login request received');
    
    if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('❌ GOOGLE_CLIENT_ID environment variable not set');
        return res.redirect('/login.html?error=oauth_config_missing');
    }
    
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline&` +
        `prompt=consent`;
    
    console.log('🔄 Redirecting to Google OAuth...');
    res.redirect(googleAuthUrl);
});

app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;
    
    console.log('🔐 OAuth callback received');
    
    if (error) {
        console.error('❌ OAuth error:', error);
        return res.redirect('/login.html?error=oauth_failed');
    }
    
    if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect('/login.html?error=oauth_failed');
    }
    
    try {
        console.log('🔄 Exchanging authorization code for access token...');
        
        const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
            throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }
        
        const tokens = await tokenResponse.json();
        console.log('✅ Token exchange successful');
        
        // Get user information from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });
        
        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('❌ User info fetch failed:', userResponse.status, errorText);
            throw new Error(`User info fetch failed: ${userResponse.status} ${userResponse.statusText}`);
        }
        
        const userInfo = await userResponse.json();
        console.log('✅ User info retrieved for:', userInfo.email);
        
        // Create user data object
        const userData = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            loginMethod: 'google',
            loginTime: new Date().toISOString()
        };
        
        // Encode user data for URL transmission
        const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');
        console.log('✅ OAuth authentication successful, redirecting to login page');
        res.redirect(`/login.html?user=${userDataEncoded}`);
        
    } catch (error) {
        console.error('❌ OAuth callback error:', error.message);
        res.redirect('/login.html?error=oauth_failed');
    }
});

// API Routes - Load before HTML routes
console.log("🔌 Loading API routes...");
require("./routes/api-routes")(app);

// HTML Routes
console.log("🔌 Loading HTML routes...");
require("./routes/html-routes")(app);

// Health check endpoint (redundant with API health check, but useful)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'FitTrack API Server',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler for unmatched routes
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
    
    if (req.url.startsWith('/api/')) {
        res.status(404).json({
            error: 'API endpoint not found',
            message: `${req.method} ${req.url} is not a valid API endpoint`
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
            if (err) {
                res.status(404).send('Page not found');
            }
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log("\n🎉 FitTrack Server is running!");
    console.log(`🚀 Server URL: http://localhost:${PORT}`);
    console.log(`🔐 Login page: http://localhost:${PORT}/login.html`);
    console.log(`🏋️  Exercise page: http://localhost:${PORT}/exercise.html`);
    console.log(`📊 API health: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    
    if (mongoose.connection.readyState === 1) {
        console.log("✅ MongoDB is connected and ready");
    } else {
        console.log("⚠️  MongoDB connection pending - check logs above");
    }
    
    console.log("\n📝 Available endpoints:");
    console.log("   GET  /                    - Home page");
    console.log("   GET  /login.html          - Login page");
    console.log("   GET  /exercise.html       - Add exercise page");
    console.log("   GET  /api/workouts        - Get all workouts");
    console.log("   POST /api/workouts        - Create new workout");
    console.log("   GET  /api/workouts/:id    - Get specific workout");
    console.log("   POST /api/workouts/:id/exercises - Add exercise");
    console.log("   GET  /api/health          - API health check");
    console.log("   GET  /auth/google         - Google OAuth login");
    console.log("\n🔧 To stop server: Ctrl+C");
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
});

module.exports = app;