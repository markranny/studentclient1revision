// public/js/api.js - Complete MongoDB API Integration
const API = {
    // Base URL for API calls (adjust if needed)
    baseURL: '/api',

    // Get all workouts from MongoDB (sorted by newest first)
    async getAllWorkouts() {
        try {
            const res = await fetch(`${this.baseURL}/workouts`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const workouts = await res.json();
            console.log(`Fetched ${workouts.length} workouts from MongoDB`);
            return workouts;
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
            // Ensure workout has required structure
            const workoutData = {
                day: data.day || new Date().toISOString(),
                exercises: data.exercises || [],
                ...data
            };

            console.log('Creating new workout:', workoutData);

            const res = await fetch(`${this.baseURL}/workouts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(workoutData)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const newWorkout = await res.json();
            console.log('Workout created successfully:', newWorkout._id);
            return newWorkout;
        } catch (error) {
            console.error("Error creating workout:", error);
            throw error;
        }
    },

    // Add exercise to a workout in MongoDB
    async addExercise(exerciseData) {
        let workoutId = localStorage.getItem("currentWorkoutId");
        
        // Fallback: try to get from URL parameters
        if (!workoutId) {
            const urlParams = new URLSearchParams(window.location.search);
            workoutId = urlParams.get('id');
        }

        if (!workoutId) {
            throw new Error("No workout in progress. Please start a new workout first.");
        }

        try {
            console.log('Adding exercise to workout:', workoutId, exerciseData);

            const res = await fetch(`${this.baseURL}/workouts/${workoutId}/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exerciseData)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const updatedWorkout = await res.json();
            console.log('Exercise added successfully to workout:', updatedWorkout._id);
            return updatedWorkout;
        } catch (error) {
            console.error("Error adding exercise:", error);
            throw error;
        }
    },

    // Update entire workout in MongoDB (alternative to addExercise)
    async updateWorkout(workoutId, data) {
        try {
            console.log('Updating workout:', workoutId, data);

            const res = await fetch(`${this.baseURL}/workouts/${workoutId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const updatedWorkout = await res.json();
            console.log('Workout updated successfully:', updatedWorkout._id);
            return updatedWorkout;
        } catch (error) {
            console.error("Error updating workout:", error);
            throw error;
        }
    },

    // Delete a workout from MongoDB
    async deleteWorkout(id) {
        try {
            console.log('Deleting workout:', id);

            const res = await fetch(`${this.baseURL}/workouts/${id}`, { 
                method: "DELETE" 
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }
            
            const result = await res.json();
            console.log('Workout deleted successfully:', id);
            return result;
        } catch (error) {
            console.error("Error deleting workout:", error);
            throw error;
        }
    },

    // Get single workout by ID from MongoDB
    async getWorkout(id) {
        try {
            console.log('Fetching workout:', id);

            const res = await fetch(`${this.baseURL}/workouts/${id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error(`Workout with ID ${id} not found`);
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const workout = await res.json();
            console.log('Workout fetched successfully:', workout._id);
            return workout;
        } catch (error) {
            console.error("Error fetching workout:", error);
            throw error;
        }
    },

    // Start a new workout session
    async startNewWorkout() {
        try {
            console.log('Starting new workout session...');

            // Create new workout in MongoDB
            const workoutData = {
                day: new Date().toISOString(),
                exercises: []
            };
            
            const newWorkout = await this.createWorkout(workoutData);
            
            // Save to localStorage for session management
            localStorage.setItem("currentWorkoutId", newWorkout._id);
            localStorage.setItem("workoutStartTime", Date.now().toString());
            localStorage.setItem("newWorkoutExercises", JSON.stringify([]));
            
            console.log('New workout session started:', newWorkout._id);
            return newWorkout;
            
        } catch (error) {
            console.error('Failed to start new workout:', error);
            throw error;
        }
    },

    // Complete current workout session
    async completeCurrentWorkout() {
        const workoutId = localStorage.getItem("currentWorkoutId");
        
        if (!workoutId) {
            console.log("No current workout to complete");
            return null;
        }

        try {
            console.log('Completing current workout:', workoutId);
            
            // Get the workout to verify it exists
            const workout = await this.getWorkout(workoutId);
            
            // Clear localStorage
            localStorage.removeItem("currentWorkoutId");
            localStorage.removeItem("newWorkoutExercises");
            localStorage.removeItem("workoutStartTime");

            // Notify other pages about the update
            localStorage.setItem("workoutUpdated", Date.now().toString());
            
            console.log('Workout completed successfully:', workoutId);
            return workout;
            
        } catch (error) {
            console.error("Error completing workout:", error);
            throw error;
        }
    },

    // Check API health/connection
    async checkHealth() {
        try {
            const res = await fetch(`${this.baseURL}/health`);
            const data = await res.json();
            console.log('API Health Check:', data);
            return data;
        } catch (error) {
            console.error('API Health Check failed:', error);
            return { status: 'error', message: error.message };
        }
    },

    // Get workout statistics
    async getWorkoutStats() {
        try {
            const workouts = await this.getAllWorkouts();
            
            if (!workouts || workouts.length === 0) {
                return {
                    totalWorkouts: 0,
                    totalExercises: 0,
                    totalDuration: 0,
                    averageDuration: 0,
                    totalWeight: 0
                };
            }

            const stats = {
                totalWorkouts: workouts.length,
                totalExercises: 0,
                totalDuration: 0,
                totalWeight: 0
            };

            workouts.forEach(workout => {
                if (workout.exercises && workout.exercises.length > 0) {
                    stats.totalExercises += workout.exercises.length;
                    
                    workout.exercises.forEach(exercise => {
                        stats.totalDuration += exercise.duration || 0;
                        if (exercise.type === 'resistance') {
                            const weight = exercise.weight || 0;
                            const reps = exercise.reps || 0;
                            const sets = exercise.sets || 1;
                            stats.totalWeight += weight * reps * sets;
                        }
                    });
                }
            });

            stats.averageDuration = stats.totalWorkouts > 0 ? 
                Math.round(stats.totalDuration / stats.totalWorkouts) : 0;

            console.log('Workout statistics calculated:', stats);
            return stats;
        } catch (error) {
            console.error('Error calculating workout stats:', error);
            throw error;
        }
    },

    // Alias for compatibility with existing code
    async getWorkouts() {
        return this.getAllWorkouts();
    },

    // Legacy method for backward compatibility
    async saveWorkout(workoutData) {
        return this.createWorkout(workoutData);
    }
};

// Initialize API when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('API initialized');
    
    // Optional: Check API health on page load
    try {
        await API.checkHealth();
    } catch (error) {
        console.warn('API health check failed - this is normal if /api/health endpoint does not exist');
    }
});

// Auto-save current workout exercises to localStorage for sync
window.addEventListener('beforeunload', () => {
    const workoutId = localStorage.getItem("currentWorkoutId");
    if (workoutId) {
        console.log('Page unloading with active workout:', workoutId);
        // Could implement auto-save logic here if needed
    }
});

// Listen for storage changes from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'workoutUpdated') {
        console.log('Workout updated in another tab, data may need refreshing');
        // Trigger refresh events if needed
        window.dispatchEvent(new CustomEvent('workoutDataUpdated'));
    }
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}

// Global debug object for testing in console
window.API_DEBUG = {
    async testConnection() {
        try {
            const health = await API.checkHealth();
            console.log('✅ API Connection Test:', health);
            return health;
        } catch (error) {
            console.error('❌ API Connection Test Failed:', error);
            return { error: error.message };
        }
    },

    async testCreateWorkout() {
        try {
            const workout = await API.startNewWorkout();
            console.log('✅ Test Workout Created:', workout);
            return workout;
        } catch (error) {
            console.error('❌ Test Workout Creation Failed:', error);
            return { error: error.message };
        }
    },

    async testAddExercise() {
        try {
            const workoutId = localStorage.getItem("currentWorkoutId");
            if (!workoutId) {
                throw new Error('No active workout. Run testCreateWorkout() first.');
            }

            const testExercise = {
                name: 'Test Push-ups',
                type: 'resistance',
                duration: 5,
                reps: 10,
                sets: 2,
                weight: 0
            };

            const result = await API.addExercise(testExercise);
            console.log('✅ Test Exercise Added:', result);
            return result;
        } catch (error) {
            console.error('❌ Test Exercise Addition Failed:', error);
            return { error: error.message };
        }
    },

    async testGetWorkouts() {
        try {
            const workouts = await API.getAllWorkouts();
            console.log('✅ Workouts Retrieved:', workouts.length, 'found');
            return workouts;
        } catch (error) {
            console.error('❌ Get Workouts Failed:', error);
            return { error: error.message };
        }
    },

    async runAllTests() {
        console.log('🧪 Running all API tests...');
        
        const results = {
            connection: await this.testConnection(),
            getWorkouts: await this.testGetWorkouts(),
            createWorkout: await this.testCreateWorkout(),
            addExercise: await this.testAddExercise()
        };

        console.log('🧪 All test results:', results);
        return results;
    }
};

console.log('✅ Enhanced API.js loaded. Use API_DEBUG.runAllTests() to test all functionality.');