require("dotenv").config(); // Load .env file
const mongoose = require("mongoose");

// Test MongoDB connection
async function testConnection() {
    // Use the same connection string as your main app
    const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/workout";
    
    console.log("🧪 Testing MongoDB Connection...");
    console.log("📝 Using:", MONGO_URI.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas");
    console.log("🔗 Connection string preview:", MONGO_URI.substring(0, 50) + "...");
    
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
        console.log("📚 Existing collections:", collections.map(c => c.name));
        
        // Test creating a simple document
        const testCollection = db.collection('test');
        const testDoc = await testCollection.insertOne({ 
            test: true, 
            timestamp: new Date(),
            message: "FitTrack connection test successful!"
        });
        console.log("✅ Test document created:", testDoc.insertedId);
        
        // Clean up test document
        await testCollection.deleteOne({ _id: testDoc.insertedId });
        console.log("🧹 Test document cleaned up");
        
        await mongoose.disconnect();
        console.log("🔌 Disconnected successfully");
        console.log("\n🎉 MongoDB Atlas is ready for FitTrack!");
        
    } catch (error) {
        console.error("❌ Connection failed:", error.message);
        console.log("\n🔧 Troubleshooting tips:");
        console.log("1. Check your MONGODB_URI environment variable");
        console.log("2. Verify username and password in connection string");
        console.log("3. Ensure network access is allowed in Atlas");
        console.log("4. Check if the connection string includes /workout");
        console.log("\n📝 Current MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
    }
}

testConnection();