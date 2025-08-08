require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// MongoDB Atlas connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/workout";

console.log("🔗 Attempting to connect to MongoDB...");
console.log("📝 Connection string:", MONGO_URI.includes("localhost") ? "Using local MongoDB" : "Using MongoDB Atlas");

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB connected successfully!");
    console.log("🌐 Database:", mongoose.connection.name);
}).catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("\n🔧 To fix this:");
    console.log("1. For local MongoDB: Install and start MongoDB service");
    console.log("2. For MongoDB Atlas: Set MONGODB_URI environment variable");
    console.log("   Example: set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workout");
    console.log("\n📱 App will continue running but database features won't work until MongoDB is connected.");
});

// OAuth Routes for Google Authentication
app.get('/auth/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback'}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `access_type=offline`;
    
    console.log('🔄 Redirecting to Google OAuth...');
    res.redirect(googleAuthUrl);
});

app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
        console.error('❌ OAuth error:', error);
        return res.redirect('/login.html?error=oauth_failed');
    }
    
    if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect('/login.html?error=oauth_failed');
    }
    
    try {
        console.log('🔄 Exchanging code for access token...');
        
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
                redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
            }),
        });
        
        if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
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
            throw new Error(`User info fetch failed: ${userResponse.statusText}`);
        }
        
        const userInfo = await userResponse.json();
        console.log('✅ User info retrieved:', userInfo.email);
        
        // Create user data object
        const userData = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            loginMethod: 'google'
        };
        
        // Encode user data for URL transmission
        const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');
        res.redirect(`/login.html?user=${userDataEncoded}`);
        
    } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.redirect('/login.html?error=oauth_failed');
    }
});

// Import models and routes
const db = require("./models");
require("./routes/api-routes")(app);
require("./routes/html-routes")(app);

app.listen(PORT, () => {
    console.log(`🚀 App running on port ${PORT}`);
    console.log(`🔗 Access your app at: http://localhost:${PORT}`);
    console.log(`🔐 Login page: http://localhost:${PORT}/login.html`);
});