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
app.use(express.json({ limit: '10mb' }));
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

// ===== SERVERLESS-OPTIMIZED MONGODB CONNECTION =====

// Global connection cache for serverless environments
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with serverless-optimized settings
 * This function reuses connections in serverless environments like Vercel
 */
async function connectMongoDB() {
    // Return cached connection if available
    if (cached.conn) {
        console.log('🔄 Using cached MongoDB connection');
        return cached.conn;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error(
            'Please define the MONGODB_URI environment variable inside .env or Vercel dashboard'
        );
    }

    // Serverless-optimized MongoDB connection options
    const mongooseOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // CRITICAL: Serverless-specific optimizations
        maxPoolSize: 1, // Keep very small for Vercel serverless functions
        minPoolSize: 0,
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 10000, // Fail fast in serverless environment
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        
        // Performance optimizations for serverless
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering
        
        // Reliability settings
        retryWrites: true,
        w: 'majority',
        
        // Network optimization
        family: 4 // Use IPv4, skip IPv6 for faster connection in Vercel
    };

    if (!cached.promise) {
        console.log('🔗 Creating new MongoDB connection for serverless environment...');
        console.log('📝 Connection URI (masked):', process.env.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"));
        
        cached.promise = mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    }

    try {
        cached.conn = await cached.promise;
        
        // Set up connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully (serverless mode)');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            // Reset cache on error to allow retry
            cached.conn = null;
            cached.promise = null;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 MongoDB disconnected');
            // Reset cache on disconnect
            cached.conn = null;
            cached.promise = null;
        });

        console.log('✅ MongoDB connection established successfully');
        console.log('🗄️ Database:', mongoose.connection.name);
        console.log('🔌 Connection state:', mongoose.connection.readyState === 1 ? "Connected" : "Connecting");
        
        return cached.conn;

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        
        // Enhanced error reporting
        if (error.message.includes('ENOTFOUND')) {
            console.error('🔧 DNS Resolution failed - check your MongoDB URI hostname');
        } else if (error.message.includes('authentication failed')) {
            console.error('🔧 Authentication failed - check username/password in MongoDB URI');
        } else if (error.message.includes('connection attempt failed')) {
            console.error('🔧 Connection failed - check MongoDB Atlas IP whitelist (add 0.0.0.0/0)');
        }
        
        // Reset cache on error to allow retry
        cached.conn = null;
        cached.promise = null;
        throw error;
    }
}

// Initialize MongoDB connection
connectMongoDB()
    .then(() => {
        console.log("✅ Initial MongoDB connection successful!");
    })
    .catch(err => {
        console.error("❌ Initial MongoDB connection failed:", err.message);
        console.log("\n🔧 Troubleshooting checklist:");
        console.log("1. Verify MONGODB_URI environment variable is set correctly");
        console.log("2. Check MongoDB Atlas IP whitelist includes 0.0.0.0/0 for Vercel");
        console.log("3. Confirm database user has proper read/write permissions");
        console.log("4. Ensure MongoDB Atlas cluster is running");
        console.log("📱 Server will continue running but database features won't work until MongoDB is connected.");
    });

// ===== MIDDLEWARE TO ENSURE DB CONNECTION FOR API ROUTES =====
app.use('/api', async (req, res, next) => {
    try {
        await connectMongoDB();
        next();
    } catch (error) {
        console.error('❌ Database connection failed for API request:', error);
        res.status(503).json({
            error: 'Database connection failed',
            details: 'Unable to connect to MongoDB. Please try again later.',
            timestamp: new Date().toISOString(),
            suggestion: 'Check MongoDB Atlas connection and IP whitelist settings'
        });
    }
});

// Environment variable validation for OAuth
const validateOAuthConfig = () => {
    const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required OAuth environment variables:', missing);
        console.log('\n🔧 Please set the following environment variables in Vercel:');
        missing.forEach(varName => {
            console.log(`   ${varName}=your_${varName.toLowerCase()}_here`);
        });
        return false;
    }
    return true;
};

// ===== ENHANCED GOOGLE OAUTH ROUTES FOR VERCEL DEPLOYMENT =====
app.get('/auth/google', (req, res) => {
    console.log('🔐 Google OAuth login request received');
    
    if (!validateOAuthConfig()) {
        console.error('❌ OAuth configuration incomplete');
        return res.redirect('/login.html?error=oauth_config_missing');
    }
    
    // Determine the correct redirect URI based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const vercelUrl = process.env.VERCEL_URL; // Automatically provided by Vercel
    
    let redirectUri;
    if (isProduction && vercelUrl) {
        // Use Vercel's provided URL for production
        redirectUri = `https://${vercelUrl}/auth/callback`;
    } else if (process.env.GOOGLE_OAUTH_REDIRECT_URI) {
        // Use manually configured redirect URI
        redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
    } else {
        // Fallback to localhost for development
        redirectUri = `http://localhost:${PORT}/auth/callback`;
    }
    
    console.log('🔄 Using redirect URI:', redirectUri);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=fittrack_login_${Date.now()}`; // Add timestamp for extra security
    
    console.log('🔄 Redirecting to Google OAuth...');
    res.redirect(googleAuthUrl);
});

app.get('/auth/callback', async (req, res) => {
    const { code, error, state } = req.query;
    
    console.log('🔐 OAuth callback received');
    console.log('📝 Callback details:', { 
        hasCode: !!code, 
        error: error || 'none', 
        state: state || 'none' 
    });
    
    if (error) {
        console.error('❌ OAuth error from Google:', error);
        let errorMessage = 'oauth_failed';
        
        if (error === 'access_denied') {
            errorMessage = 'oauth_denied';
        } else if (error === 'invalid_request') {
            errorMessage = 'oauth_invalid';
        }
        
        return res.redirect(`/login.html?error=${errorMessage}`);
    }
    
    if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect('/login.html?error=oauth_no_code');
    }
    
    // Verify state parameter (basic CSRF protection)
    if (!state || !state.startsWith('fittrack_login_')) {
        console.error('❌ Invalid state parameter');
        return res.redirect('/login.html?error=oauth_invalid_state');
    }
    
    try {
        console.log('🔄 Exchanging authorization code for access token...');
        
        // Determine redirect URI (same logic as the initial request)
        const isProduction = process.env.NODE_ENV === 'production';
        const vercelUrl = process.env.VERCEL_URL;
        
        let redirectUri;
        if (isProduction && vercelUrl) {
            redirectUri = `https://${vercelUrl}/auth/callback`;
        } else if (process.env.GOOGLE_OAUTH_REDIRECT_URI) {
            redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
        } else {
            redirectUri = `http://localhost:${PORT}/auth/callback`;
        }
        
        console.log('🔄 Using redirect URI for token exchange:', redirectUri);
        
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
            const errorData = await tokenResponse.json().catch(() => null);
            console.error('❌ Token exchange failed:', tokenResponse.status, errorData);
            
            if (tokenResponse.status === 400 && errorData?.error === 'invalid_grant') {
                console.error('❌ Authorization code expired or invalid');
                return res.redirect('/login.html?error=oauth_expired');
            }
            
            throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }
        
        const tokens = await tokenResponse.json();
        console.log('✅ Token exchange successful');
        
        if (!tokens.access_token) {
            console.error('❌ No access token in response');
            throw new Error('No access token received');
        }
        
        // Get user information from Google
        console.log('🔄 Fetching user information from Google...');
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
        
        // Validate user info
        if (!userInfo.email || !userInfo.id) {
            console.error('❌ Incomplete user info from Google');
            throw new Error('Incomplete user information received');
        }
        
        // Create user data object
        const userData = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            picture: userInfo.picture || null,
            loginMethod: 'google',
            loginTime: new Date().toISOString(),
            verified: userInfo.verified_email || false
        };
        
        // Encode user data for URL transmission
        const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');
        console.log('✅ OAuth authentication successful for:', userData.email);
        
        // Redirect to login page with success data
        res.redirect(`/login.html?success=oauth_complete&user=${userDataEncoded}`);
        
    } catch (error) {
        console.error('❌ OAuth callback error:', error.message);
        console.error('❌ Full error:', error);
        
        // Provide more specific error messages
        let errorCode = 'oauth_failed';
        if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
            errorCode = 'network_error';
        } else if (error.message.includes('timeout')) {
            errorCode = 'oauth_timeout';
        } else if (error.message.includes('invalid_grant')) {
            errorCode = 'oauth_expired';
        }
        
        res.redirect(`/login.html?error=${errorCode}`);
    }
});

// Handle unmatched auth routes
app.use('/auth/*', (req, res, next) => {
    console.log(`❌ Unhandled auth route: ${req.method} ${req.url}`);
    res.redirect('/login.html?error=auth_route_not_found');
});

// ===== API ROUTES =====
console.log("🔌 Loading API routes...");
require("./routes/api-routes")(app);

// ===== HTML ROUTES =====
console.log("🔌 Loading HTML routes...");
require("./routes/html-routes")(app);

// ===== HEALTH CHECK ENDPOINT =====
app.get('/health', async (req, res) => {
    try {
        await connectMongoDB();
        
        // Test MongoDB with a simple query
        const workoutCount = await mongoose.connection.db.collection('workouts').countDocuments();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            server: 'FitTrack API Server',
            mongodb: 'connected',
            environment: process.env.NODE_ENV || 'development',
            database: mongoose.connection.name,
            workoutCount: workoutCount,
            connectionState: mongoose.connection.readyState,
            version: '2.1.2-vercel'
        });
    } catch (error) {
        console.error('❌ Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            mongodb: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    }
});

// ===== ERROR HANDLING MIDDLEWARE =====
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    
    // Don't expose internal error details in production
    const errorResponse = {
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
        errorResponse.details = err.message;
        errorResponse.stack = err.stack;
    }
    
    res.status(500).json(errorResponse);
});

// ===== 404 HANDLER FOR UNMATCHED ROUTES =====
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
    
    if (req.url.startsWith('/api/')) {
        res.status(404).json({
            error: 'API endpoint not found',
            message: `${req.method} ${req.url} is not a valid API endpoint`,
            timestamp: new Date().toISOString(),
            availableEndpoints: [
                'GET /api/workouts',
                'POST /api/workouts',
                'GET /api/workouts/:id',
                'POST /api/workouts/:id/exercises',
                'DELETE /api/workouts/:id',
                'GET /api/health'
            ]
        });
    } else {
        // Serve index.html for SPA routing
        res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
            if (err) {
                res.status(404).send('Page not found');
            }
        });
    }
});

// ===== SERVER STARTUP (LOCAL DEVELOPMENT ONLY) =====
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log("\n🎉 FitTrack Server is running!");
        console.log(`🚀 Server URL: http://localhost:${PORT}`);
        console.log(`🔐 Login page: http://localhost:${PORT}/login.html`);
        console.log(`🏋️  Exercise page: http://localhost:${PORT}/excercise.html`);
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
        console.log("   GET  /excercise.html      - Add exercise page");
        console.log("   GET  /api/workouts        - Get all workouts");
        console.log("   POST /api/workouts        - Create new workout");
        console.log("   GET  /api/workouts/:id    - Get specific workout");
        console.log("   POST /api/workouts/:id/exercises - Add exercise");
        console.log("   GET  /api/health          - API health check");
        console.log("   GET  /auth/google         - Google OAuth login");
        console.log("\n🔧 To stop server: Ctrl+C");
    });
}

// ===== GRACEFUL SHUTDOWN HANDLING =====
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// ===== EXPORT FOR VERCEL SERVERLESS =====
module.exports = app;