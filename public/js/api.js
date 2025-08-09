const API = {
    // Get all workouts from MongoDB
    async getAllWorkouts() {
        try {
            const res = await fetch("/api/workouts");
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return await res.json();
        } catch (error) {
            console.error("Error fetching workouts:", error);
            throw error;
        }
    },

    // Get the last workout from MongoDB
    async getLastWorkout() {
        try {
            const workouts = await this.getAllWorkouts();
            return workouts.length > 0 ? workouts[0] : null;
        } catch (error) {
            console.error("Error fetching last workout:", error);
            throw error;
        }
    },

    // Create a new workout in MongoDB
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

    // Add exercise to a workout in MongoDB
    async addExercise(data) {
        let id = localStorage.getItem("currentWorkoutId");
        if (!id) {
            id = location.search.split("=")[1];
        }

        if (!id) {
            throw new Error("No workout in progress. Please start a new workout from the home page.");
        }

        try {
            const res = await fetch(`/api/workouts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error("Error adding exercise:", error);
            throw error;
        }
    },

    // Delete a workout from MongoDB
    async deleteWorkout(id) {
        try {
            const res = await fetch(`/api/workouts/${id}`, { 
                method: "DELETE" 
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }
            
            return await res.json();
        } catch (error) {
            console.error("Error deleting workout:", error);
            throw error;
        }
    },

    // Get single workout by ID from MongoDB
    async getWorkout(id) {
        try {
            const res = await fetch(`/api/workouts/${id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error(`Workout with ID ${id} not found`);
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return await res.json();
        } catch (error) {
            console.error("Error fetching workout:", error);
            throw error;
        }
    },

    // Alias for compatibility
    async getWorkouts() {
        return this.getAllWorkouts();
    }
};