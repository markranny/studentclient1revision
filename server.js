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

const db = require("./models");

require("./routes/api-routes")(app);
require("./routes/html-routes")(app);

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
