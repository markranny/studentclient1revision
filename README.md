# FitTrack - Workout Tracker Application

A full-stack web application for tracking workouts and fitness activities. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- 📊 **Workout Dashboard** - View workout statistics and charts
- 🏃‍♂️ **Exercise Tracking** - Add cardio and resistance exercises
- 📈 **Progress Monitoring** - Track duration, weight, and performance
- 📝 **Workout History** - View and manage past workouts
- 🎨 **Modern UI** - Clean, responsive design with Semantic UI

## Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas account)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fittrack-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   
   **Option A: Local MongoDB**
   - Install MongoDB locally
   - Start MongoDB service
   - The app will connect to `mongodb://localhost:27017/workout`

   **Option B: MongoDB Atlas (Cloud)**
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get your connection string
   - Set environment variable:
     ```bash
     # Windows
     set MONGODB_URI=your_atlas_connection_string
     
     # Mac/Linux
     export MONGODB_URI=your_atlas_connection_string
     ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## Running the Application

1. **Start the server**
   ```bash
   npm start
   ```

2. **For development (with auto-restart)**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

## API Endpoints

- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create a new workout
- `PUT /api/workouts/:id` - Add exercise to workout
- `DELETE /api/workouts/:id` - Delete a workout

## Project Structure

```
fittrack-main/
├── models/          # MongoDB schemas
├── public/          # Static files (HTML, CSS, JS)
├── routes/          # API and HTML routes
├── seeders/         # Database seeding script
├── server.js        # Main server file
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Semantic UI
- **Charts**: Chart.js
- **Date Handling**: Moment.js

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check your connection string
   - Verify network connectivity (for Atlas)

2. **Port Already in Use**
   - Change the PORT environment variable
   - Kill processes using port 3000

3. **Module Not Found Errors**
   - Run `npm install` to install dependencies
   - Check if `node_modules` folder exists

## License

MIT License - feel free to use this project for learning and development.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Happy Tracking! 💪** 