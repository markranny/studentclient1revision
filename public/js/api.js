const API = {
    // Get all workouts
    async getAllWorkouts() {
        const res = await fetch("/api/workouts");
        return await res.json();
    },

    // Get the last workout
    async getLastWorkout() {
        const res = await fetch("/api/workouts");
        const json = await res.json();
        return json[0];
    },

    // Create a new workout
    async createWorkout(data = {}) {
        try {
            const res = await fetch("/api/workouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error("Error creating workout:", error);
            throw error;
        }
    },

    // Add exercise to a workout
    async addExercise(data) {
        let id = localStorage.getItem("currentWorkoutId");
        if (!id) {
            id = location.search.split("=")[1];
        }

        if (!id) {
            alert("No workout in progress. Please start a new workout from the home page.");
            return;
        }

        const res = await fetch(`/api/workouts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    // Delete a workout
    async deleteWorkout(id) {
        const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
        return await res.json();
    },

    // --- New functions for history.js and stats.js ---
    async getWorkouts() {
        // Simply call getAllWorkouts
        return this.getAllWorkouts();
    },

    async getWorkout(id) {
        const res = await fetch(`/api/workouts/${id}`);
        if (!res.ok) {
            throw new Error(`Workout with ID ${id} not found`);
        }
        return await res.json();
    }
};
