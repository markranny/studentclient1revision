const router = require("express").Router();
const Workout = require("../models/Workout");

// GET all workouts
router.get("/api/workouts", async (req, res) => {
    try {
        const workouts = await Workout.find({});
        res.json(workouts.reverse());
    } catch (err) {
        res.status(500).json(err);
    }
});

// POST new workout
router.post("/api/workouts", async (req, res) => {
    try {
        console.log("Creating new workout with data:", req.body);
        const workout = await Workout.create(req.body);
        console.log("Workout created successfully:", workout._id);
        res.json(workout);
    } catch (err) {
        console.error("Error creating workout:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET single workout by ID
router.get("/api/workouts/:id", async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);
        if (!workout) {
            return res.status(404).json({ error: "Workout not found" });
        }
        res.json(workout);
    } catch (err) {
        console.error("Error fetching workout:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// PUT add exercise to workout
router.put("/api/workouts/:id", async (req, res) => {
    try {
        const workout = await Workout.findByIdAndUpdate(
            req.params.id,
            { $push: { exercises: req.body } },
            { new: true, runValidators: true }
        );
        res.json(workout);
    } catch (err) {
        res.status(500).json(err);
    }
});

// DELETE workout
router.delete("/api/workouts/:id", async (req, res) => {
    try {
        const workout = await Workout.findByIdAndDelete(req.params.id);
        res.json(workout);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = (app) => app.use(router);
