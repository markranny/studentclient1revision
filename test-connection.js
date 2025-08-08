const mongoose = require("mongoose");

// Test MongoDB connection
async function testConnection() {
    const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/workout";
    
    console.log("🧪 Testing MongoDB Connection...");
    console.log("📝 Using:", MONGO_URI.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas");
    
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log("✅ Connection successful!");
        console.log("🌐 Database:", mongoose.connection.name);
        console.log("🔗 Host:", mongoose.connection.host);
        console.log("🚪 Port:", mongoose.connection.port);
        
        // Test creating a collection
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log("📚 Collections:", collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log("🔌 Disconnected successfully");
        
    } catch (error) {
        console.error("❌ Connection failed:", error.message);
        console.log("\n🔧 Troubleshooting tips:");
        console.log("1. Check your MONGODB_URI environment variable");
        console.log("2. Verify username and password in connection string");
        console.log("3. Ensure network access is allowed in Atlas");
        console.log("4. Check if the connection string includes /workout");
    }
}

testConnection(); 