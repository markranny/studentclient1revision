const mongoose = require("mongoose");

async function testMongoDB() {
    const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/workout";
    
    console.log("🧪 Testing MongoDB Connection and Workout Creation...");
    console.log("📝 Using:", MONGO_URI.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas");
    
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log("✅ MongoDB connected successfully!");
        console.log("🌐 Database:", mongoose.connection.name);
        
        // Test creating a workout
        const Workout = require("./models/Workout");
        
        const testWorkout = await Workout.create({
            day: new Date(),
            exercises: []
        });
        
        console.log("✅ Workout created successfully!");
        console.log("🆔 Workout ID:", testWorkout._id);
        
        // Clean up - delete the test workout
        await Workout.findByIdAndDelete(testWorkout._id);
        console.log("🧹 Test workout deleted");
        
        await mongoose.disconnect();
        console.log("🔌 Disconnected successfully");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.log("\n🔧 Troubleshooting:");
        console.log("1. Check if MongoDB service is running");
        console.log("2. Verify connection string");
        console.log("3. Check network access (for Atlas)");
    }
}

testMongoDB(); 