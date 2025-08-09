const router = require("express").Router();
const Workout = require("../models/Workout");

// Middleware for logging API requests
router.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// GET all workouts (sorted by newest first)
router.get("/api/workouts", async (req, res) => {
    try {
        console.log("📋 Fetching all workouts from MongoDB...");
        const workouts = await Workout.find({}).sort({ day: -1 });
        console.log(`✅ Found ${workouts.length} workouts`);
        
        // Add some basic validation
        const validWorkouts = workouts.map(workout => ({
            _id: workout._id,
            day: workout.day,
            exercises: workout.exercises || [],
            totalDuration: workout.totalDuration || 0
        }));
        
        res.json(validWorkouts);
    } catch (err) {
        console.error("❌ Error fetching workouts:", err);
        res.status(500).json({ 
            error: "Failed to fetch workouts", 
            details: err.message 
        });
    }
});

// POST new workout
router.post("/api/workouts", async (req, res) => {
    try {
        console.log("📝 Creating new workout with data:", req.body);
        
        // Validate and prepare workout data
        const workoutData = {
            day: req.body.day || new Date().toISOString(),
            exercises: Array.isArray(req.body.exercises) ? req.body.exercises : [],
            totalDuration: req.body.totalDuration || 0,
            ...req.body
        };
        
        // Validate exercises if provided
        if (workoutData.exercises.length > 0) {
            const validExercises = workoutData.exercises.filter(ex => 
                ex.name && ex.type && (ex.type === 'cardio' || ex.type === 'resistance')
            );
            workoutData.exercises = validExercises;
        }
        
        const workout = await Workout.create(workoutData);
        console.log("✅ Workout created successfully:", workout._id);
        
        res.status(201).json({
            _id: workout._id,
            day: workout.day,
            exercises: workout.exercises,
            totalDuration: workout.totalDuration || 0
        });
    } catch (err) {
        console.error("❌ Error creating workout:", err);
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: Object.values(err.errors).map(e => e.message).join(', ')
            });
        }
        
        res.status(500).json({ 
            error: "Failed to create workout", 
            details: err.message 
        });
    }
});

// GET single workout by ID
router.get("/api/workouts/:id", async (req, res) => {
    try {
        console.log("📋 Fetching workout with ID:", req.params.id);
        
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                error: "Invalid workout ID format",
                details: "Workout ID must be a valid MongoDB ObjectId"
            });
        }
        
        const workout = await Workout.findById(req.params.id);
        if (!workout) {
            console.log("❌ Workout not found:", req.params.id);
            return res.status(404).json({ 
                error: "Workout not found",
                details: `No workout found with ID: ${req.params.id}`
            });
        }
        
        console.log("✅ Workout found:", workout._id);
        res.json({
            _id: workout._id,
            day: workout.day,
            exercises: workout.exercises || [],
            totalDuration: workout.totalDuration || 0
        });
    } catch (err) {
        console.error("❌ Error fetching workout:", err);
        res.status(500).json({ 
            error: "Server error while fetching workout", 
            details: err.message 
        });
    }
});

// POST add exercise to workout
router.post("/api/workouts/:id/exercises", async (req, res) => {
    try {
        console.log("🏋️ Adding exercise to workout:", req.params.id);
        console.log("Exercise data:", req.body);
        
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                error: "Invalid workout ID format",
                details: "Workout ID must be a valid MongoDB ObjectId"
            });
        }
        
        // Validate exercise data
        const exerciseData = req.body;
        
        // Required fields validation
        if (!exerciseData.name || !exerciseData.type) {
            return res.status(400).json({ 
                error: "Missing required fields",
                details: "Exercise name and type are required"
            });
        }
        
        // Type validation
        if (!['cardio', 'resistance'].includes(exerciseData.type)) {
            return res.status(400).json({ 
                error: "Invalid exercise type",
                details: "Exercise type must be 'cardio' or 'resistance'"
            });
        }
        
        // Type-specific validation
        if (exerciseData.type === 'resistance') {
            const requiredFields = ['weight', 'sets', 'reps', 'duration'];
            const missingFields = requiredFields.filter(field => 
                exerciseData[field] === undefined || exerciseData[field] === null
            );
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: "Missing required resistance exercise fields",
                    details: `Missing: ${missingFields.join(', ')}`
                });
            }
            
            // Validate numeric values
            if (exerciseData.weight < 0 || exerciseData.sets <= 0 || 
                exerciseData.reps <= 0 || exerciseData.duration <= 0) {
                return res.status(400).json({
                    error: "Invalid numeric values",
                    details: "Weight must be >= 0, sets/reps/duration must be > 0"
                });
            }
        }
        
        if (exerciseData.type === 'cardio') {
            const requiredFields = ['distance', 'duration'];
            const missingFields = requiredFields.filter(field => 
                exerciseData[field] === undefined || exerciseData[field] === null
            );
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: "Missing required cardio exercise fields",
                    details: `Missing: ${missingFields.join(', ')}`
                });
            }
            
            // Validate numeric values
            if (exerciseData.distance < 0 || exerciseData.duration <= 0) {
                return res.status(400).json({
                    error: "Invalid numeric values",
                    details: "Distance must be >= 0, duration must be > 0"
                });
            }
        }
        
        // Sanitize exercise data
        const cleanExercise = {
            name: exerciseData.name.trim(),
            type: exerciseData.type,
            duration: parseInt(exerciseData.duration)
        };
        
        if (exerciseData.type === 'resistance') {
            cleanExercise.weight = parseFloat(exerciseData.weight);
            cleanExercise.sets = parseInt(exerciseData.sets);
            cleanExercise.reps = parseInt(exerciseData.reps);
        } else if (exerciseData.type === 'cardio') {
            cleanExercise.distance = parseFloat(exerciseData.distance);
        }
        
        // Add exercise to workout
        const workout = await Workout.findByIdAndUpdate(
            req.params.id,
            { 
                $push: { exercises: cleanExercise },
                $inc: { totalDuration: cleanExercise.duration }
            },
            { new: true, runValidators: true }
        );
        
        if (!workout) {
            return res.status(404).json({ 
                error: "Workout not found",
                details: `No workout found with ID: ${req.params.id}`
            });
        }
        
        console.log("✅ Exercise added successfully to workout:", workout._id);
        console.log(`Total exercises: ${workout.exercises.length}, Total duration: ${workout.totalDuration || 0}`);
        
        res.json({
            _id: workout._id,
            day: workout.day,
            exercises: workout.exercises,
            totalDuration: workout.totalDuration || 0
        });
    } catch (err) {
        console.error("❌ Error adding exercise:", err);
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                error: "Exercise validation failed", 
                details: Object.values(err.errors).map(e => e.message).join(', ')
            });
        }
        
        res.status(500).json({ 
            error: "Failed to add exercise", 
            details: err.message 
        });
    }
});

// PUT update entire workout
router.put("/api/workouts/:id", async (req, res) => {
    try {
        console.log("📝 Updating workout:", req.params.id);
        console.log("Update data:", req.body);
        
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                error: "Invalid workout ID format",
                details: "Workout ID must be a valid MongoDB ObjectId"
            });
        }
        
        // Handle legacy single exercise addition (backward compatibility)
        if (req.body.name && req.body.type && !req.body.exercises) {
            console.log("Legacy exercise addition detected, redirecting to POST /exercises");
            
            // Validate exercise data
            if (!['cardio', 'resistance'].includes(req.body.type)) {
                return res.status(400).json({
                    error: "Invalid exercise type",
                    details: "Exercise type must be 'cardio' or 'resistance'"
                });
            }
            
            const workout = await Workout.findByIdAndUpdate(
                req.params.id,
                { 
                    $push: { exercises: req.body },
                    $inc: { totalDuration: parseInt(req.body.duration) || 0 }
                },
                { new: true, runValidators: true }
            );
            
            if (!workout) {
                return res.status(404).json({ 
                    error: "Workout not found",
                    details: `No workout found with ID: ${req.params.id}`
                });
            }
            
            console.log("✅ Exercise added via PUT (legacy):", workout._id);
            return res.json({
                _id: workout._id,
                day: workout.day,
                exercises: workout.exercises,
                totalDuration: workout.totalDuration || 0
            });
        }
        
        // Regular workout update
        const updateData = { ...req.body };
        
        // Validate exercises if provided
        if (updateData.exercises) {
            if (!Array.isArray(updateData.exercises)) {
                return res.status(400).json({
                    error: "Invalid exercises format",
                    details: "Exercises must be an array"
                });
            }
            
            // Calculate total duration from exercises
            updateData.totalDuration = updateData.exercises.reduce((sum, ex) => 
                sum + (parseInt(ex.duration) || 0), 0
            );
        }
        
        const workout = await Workout.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!workout) {
            return res.status(404).json({ 
                error: "Workout not found",
                details: `No workout found with ID: ${req.params.id}`
            });
        }
        
        console.log("✅ Workout updated successfully:", workout._id);
        res.json({
            _id: workout._id,
            day: workout.day,
            exercises: workout.exercises,
            totalDuration: workout.totalDuration || 0
        });
    } catch (err) {
        console.error("❌ Error updating workout:", err);
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                error: "Workout validation failed", 
                details: Object.values(err.errors).map(e => e.message).join(', ')
            });
        }
        
        res.status(500).json({ 
            error: "Failed to update workout", 
            details: err.message 
        });
    }
});

// DELETE workout
router.delete("/api/workouts/:id", async (req, res) => {
    try {
        console.log("🗑️ Deleting workout:", req.params.id);
        
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                error: "Invalid workout ID format",
                details: "Workout ID must be a valid MongoDB ObjectId"
            });
        }
        
        const workout = await Workout.findByIdAndDelete(req.params.id);
        
        if (!workout) {
            return res.status(404).json({ 
                error: "Workout not found",
                details: `No workout found with ID: ${req.params.id}`
            });
        }
        
        console.log("✅ Workout deleted successfully:", req.params.id);
        res.json({ 
            message: "Workout deleted successfully", 
            deletedWorkout: {
                _id: workout._id,
                day: workout.day,
                exerciseCount: workout.exercises?.length || 0
            }
        });
    } catch (err) {
        console.error("❌ Error deleting workout:", err);
        res.status(500).json({ 
            error: "Failed to delete workout", 
            details: err.message 
        });
    }
});

// DELETE single exercise from workout
router.delete("/api/workouts/:id/exercises/:exerciseIndex", async (req, res) => {
    try {
        const { id, exerciseIndex } = req.params;
        console.log(`🗑️ Deleting exercise ${exerciseIndex} from workout ${id}`);
        
        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                error: "Invalid workout ID format",
                details: "Workout ID must be a valid MongoDB ObjectId"
            });
        }
        
        // Validate exercise index
        const index = parseInt(exerciseIndex);
        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                error: "Invalid exercise index",
                details: "Exercise index must be a non-negative number"
            });
        }
        
        // Get workout first to validate exercise exists
        const workout = await Workout.findById(id);
        if (!workout) {
            return res.status(404).json({ 
                error: "Workout not found",
                details: `No workout found with ID: ${id}`
            });
        }
        
        if (!workout.exercises || index >= workout.exercises.length) {
            return res.status(404).json({
                error: "Exercise not found",
                details: `No exercise found at index ${index}`
            });
        }
        
        // Get the exercise duration before deletion for totalDuration update
        const exerciseDuration = workout.exercises[index].duration || 0;
        
        // Remove exercise using MongoDB array operations
        const updatedWorkout = await Workout.findByIdAndUpdate(
            id,
            { 
                $unset: { [`exercises.${index}`]: 1 },
                $inc: { totalDuration: -exerciseDuration }
            },
            { new: true }
        );
        
        // Remove null elements left by $unset
        await Workout.findByIdAndUpdate(
            id,
            { $pull: { exercises: null } },
            { new: true }
        );
        
        // Get final updated workout
        const finalWorkout = await Workout.findById(id);
        
        console.log(`✅ Exercise deleted successfully from workout ${id}`);
        res.json({
            _id: finalWorkout._id,
            day: finalWorkout.day,
            exercises: finalWorkout.exercises,
            totalDuration: finalWorkout.totalDuration || 0
        });
        
    } catch (err) {
        console.error("❌ Error deleting exercise:", err);
        res.status(500).json({ 
            error: "Failed to delete exercise", 
            details: err.message 
        });
    }
});

// GET workout statistics
router.get("/api/workouts/stats/summary", async (req, res) => {
    try {
        console.log("📊 Calculating workout statistics...");
        
        const workouts = await Workout.find({}).sort({ day: -1 });
        
        if (!workouts || workouts.length === 0) {
            return res.json({
                totalWorkouts: 0,
                totalExercises: 0,
                totalDuration: 0,
                averageDuration: 0,
                totalWeight: 0,
                averageExercisesPerWorkout: 0,
                lastWorkoutDate: null
            });
        }

        const stats = {
            totalWorkouts: workouts.length,
            totalExercises: 0,
            totalDuration: 0,
            totalWeight: 0,
            cardioDistance: 0,
            resistanceExercises: 0,
            cardioExercises: 0
        };

        workouts.forEach(workout => {
            if (workout.exercises && workout.exercises.length > 0) {
                stats.totalExercises += workout.exercises.length;
                
                workout.exercises.forEach(exercise => {
                    stats.totalDuration += exercise.duration || 0;
                    
                    if (exercise.type === 'resistance') {
                        stats.resistanceExercises++;
                        const weight = exercise.weight || 0;
                        const reps = exercise.reps || 0;
                        const sets = exercise.sets || 1;
                        stats.totalWeight += weight * reps * sets;
                    } else if (exercise.type === 'cardio') {
                        stats.cardioExercises++;
                        stats.cardioDistance += exercise.distance || 0;
                    }
                });
            }
        });

        // Calculate averages
        stats.averageDuration = stats.totalWorkouts > 0 ? 
            Math.round(stats.totalDuration / stats.totalWorkouts) : 0;
        stats.averageExercisesPerWorkout = stats.totalWorkouts > 0 ?
            Math.round((stats.totalExercises / stats.totalWorkouts) * 10) / 10 : 0;
        stats.lastWorkoutDate = workouts[0]?.day || null;

        console.log("✅ Workout statistics calculated:", stats);
        res.json(stats);
    } catch (err) {
        console.error("❌ Error calculating workout stats:", err);
        res.status(500).json({ 
            error: "Failed to calculate statistics", 
            details: err.message 
        });
    }
});

// Health check endpoint
router.get("/api/health", async (req, res) => {
    try {
        console.log("🏥 Performing health check...");
        
        // Test MongoDB connection by counting documents
        const workoutCount = await Workout.countDocuments();
        const lastWorkout = await Workout.findOne().sort({ day: -1 });
        
        const healthData = {
            status: "healthy",
            mongodb: "connected",
            timestamp: new Date().toISOString(),
            workoutCount: workoutCount,
            lastWorkout: lastWorkout ? {
                id: lastWorkout._id,
                date: lastWorkout.day,
                exerciseCount: lastWorkout.exercises?.length || 0
            } : null,
            api: {
                version: "1.0.0",
                endpoints: [
                    "GET /api/workouts",
                    "POST /api/workouts", 
                    "GET /api/workouts/:id",
                    "PUT /api/workouts/:id",
                    "DELETE /api/workouts/:id",
                    "POST /api/workouts/:id/exercises",
                    "GET /api/workouts/stats/summary",
                    "GET /api/health"
                ]
            }
        };
        
        console.log("✅ Health check completed successfully");
        res.json(healthData);
    } catch (err) {
        console.error("❌ Health check failed:", err);
        res.status(500).json({
            status: "unhealthy",
            mongodb: "disconnected",
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Catch-all for undefined API routes
router.all("/api/*", (req, res) => {
    console.log(`❌ Unknown API endpoint: ${req.method} ${req.path}`);
    res.status(404).json({
        error: "API endpoint not found",
        details: `${req.method} ${req.path} is not a valid API endpoint`,
        availableEndpoints: [
            "GET /api/workouts - Get all workouts",
            "POST /api/workouts - Create new workout",
            "GET /api/workouts/:id - Get specific workout",
            "PUT /api/workouts/:id - Update workout",
            "DELETE /api/workouts/:id - Delete workout",
            "POST /api/workouts/:id/exercises - Add exercise to workout",
            "GET /api/workouts/stats/summary - Get workout statistics",
            "GET /api/health - API health check"
        ]
    });
});

module.exports = (app) => {
    app.use(router);
    console.log("🔌 API routes initialized successfully");
};