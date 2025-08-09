// models/Workout.js
const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, "Exercise type is required"],
        enum: ["cardio", "resistance"],
        trim: true
    },
    name: {
        type: String,
        required: [true, "Exercise name is required"],
        trim: true
    },
    duration: {
        type: Number,
        min: [0, "Duration cannot be negative"],
        default: 0
    },
    // Cardio-specific fields
    distance: {
        type: Number,
        min: [0, "Distance cannot be negative"],
        default: 0
    },
    // Resistance-specific fields
    weight: {
        type: Number,
        min: [0, "Weight cannot be negative"],
        default: 0
    },
    reps: {
        type: Number,
        min: [0, "Reps cannot be negative"],
        default: 0
    },
    sets: {
        type: Number,
        min: [0, "Sets cannot be negative"],
        default: 0
    }
}, {
    _id: true, // Each exercise gets its own ID
    timestamps: false
});

const workoutSchema = new mongoose.Schema({
    day: {
        type: Date,
        required: [true, "Workout date is required"],
        default: Date.now
    },
    exercises: {
        type: [exerciseSchema],
        default: []
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total workout duration
workoutSchema.virtual('totalDuration').get(function() {
    return this.exercises.reduce((total, exercise) => total + (exercise.duration || 0), 0);
});

// Virtual for exercise count
workoutSchema.virtual('exerciseCount').get(function() {
    return this.exercises.length;
});

// Index for faster queries
workoutSchema.index({ day: -1 });

// Pre-save middleware to validate exercises
workoutSchema.pre('save', function(next) {
    // Validate each exercise based on its type
    for (let exercise of this.exercises) {
        if (exercise.type === 'cardio') {
            if (!exercise.duration || exercise.duration <= 0) {
                return next(new Error('Cardio exercises must have a positive duration'));
            }
        } else if (exercise.type === 'resistance') {
            if (!exercise.duration || exercise.duration <= 0) {
                return next(new Error('Resistance exercises must have a positive duration'));
            }
            if (!exercise.reps || exercise.reps <= 0) {
                return next(new Error('Resistance exercises must have positive reps'));
            }
            if (!exercise.sets || exercise.sets <= 0) {
                return next(new Error('Resistance exercises must have positive sets'));
            }
        }
    }
    next();
});

// Instance method to add an exercise
workoutSchema.methods.addExercise = function(exerciseData) {
    this.exercises.push(exerciseData);
    return this.save();
};

// Static method to find workouts by date range
workoutSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        day: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ day: -1 });
};

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;