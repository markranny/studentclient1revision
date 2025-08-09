const API = {
    // FIXED: Use relative URLs for Vercel deployment
    baseURL: '',  // Empty string means use current domain

    async getAllWorkouts() {
        try {
            console.log('🔄 Fetching all workouts...');
            const res = await fetch(`${this.baseURL}/api/workouts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // FIXED: Add timeout for serverless functions
                signal: AbortSignal.timeout(25000) // 25 second timeout
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error('❌ API Error:', res.status, errorText);
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const workouts = await res.json();
            console.log(`✅ Loaded ${workouts.length} workouts`);
            return workouts;
        } catch (error) {
            console.error("❌ Error fetching workouts:", error);
            
            // FIXED: Better error handling for different scenarios
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - Server may be slow to respond');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error - Check your internet connection');
            }
            
            throw error;
        }
    },

    async getLastWorkout() {
        try {
            const workouts = await this.getAllWorkouts();
            return workouts.length > 0 ? workouts[0] : null;
        } catch (error) {
            console.error("❌ Error fetching last workout:", error);
            throw error;
        }
    },

    async createWorkout(data = {}) {
        try {
            console.log('🔄 Creating new workout...');
            const workoutData = {
                day: data.day || new Date().toISOString(),
                exercises: data.exercises || [],
                ...data
            };

            const res = await fetch(`${this.baseURL}/api/workouts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(workoutData),
                signal: AbortSignal.timeout(25000)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Create workout error:', res.status, errorData);
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const newWorkout = await res.json();
            console.log('✅ Workout created:', newWorkout._id);
            return newWorkout;
        } catch (error) {
            console.error("❌ Error creating workout:", error);
            
            if (error.name === 'AbortError') {
                throw new Error('Workout creation timeout - Please try again');
            }
            
            throw error;
        }
    },

    async addExercise(exerciseData) {
        let workoutId = localStorage.getItem("currentWorkoutId");
        
        if (!workoutId) {
            const urlParams = new URLSearchParams(window.location.search);
            workoutId = urlParams.get('id');
        }

        if (!workoutId) {
            throw new Error("No workout in progress. Please start a new workout first.");
        }

        try {
            console.log('🔄 Adding exercise to workout:', workoutId);

            const res = await fetch(`${this.baseURL}/api/workouts/${workoutId}/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exerciseData),
                signal: AbortSignal.timeout(25000)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Add exercise error:', res.status, errorData);
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const updatedWorkout = await res.json();
            console.log('✅ Exercise added successfully');
            return updatedWorkout;
        } catch (error) {
            console.error("❌ Error adding exercise:", error);
            
            if (error.name === 'AbortError') {
                throw new Error('Exercise addition timeout - Please try again');
            }
            
            throw error;
        }
    },

    async updateWorkout(workoutId, data) {
        try {
            console.log('🔄 Updating workout:', workoutId);

            const res = await fetch(`${this.baseURL}/api/workouts/${workoutId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(25000)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Update workout error:', res.status, errorData);
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const updatedWorkout = await res.json();
            console.log('✅ Workout updated successfully');
            return updatedWorkout;
        } catch (error) {
            console.error("❌ Error updating workout:", error);
            
            if (error.name === 'AbortError') {
                throw new Error('Workout update timeout - Please try again');
            }
            
            throw error;
        }
    },

    async deleteWorkout(id) {
        try {
            console.log('🔄 Deleting workout:', id);

            const res = await fetch(`${this.baseURL}/api/workouts/${id}`, { 
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(25000)
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Delete workout error:', res.status, errorData);
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }
            
            const result = await res.json();
            console.log('✅ Workout deleted successfully');
            return result;
        } catch (error) {
            console.error("❌ Error deleting workout:", error);
            
            if (error.name === 'AbortError') {
                throw new Error('Workout deletion timeout - Please try again');
            }
            
            throw error;
        }
    },

    async getWorkout(id) {
        try {
            console.log('🔄 Fetching workout:', id);

            const res = await fetch(`${this.baseURL}/api/workouts/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(25000)
            });
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error(`Workout with ID ${id} not found`);
                }
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Get workout error:', res.status, errorData);
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }
            
            const workout = await res.json();
            console.log('✅ Workout fetched successfully');
            return workout;
        } catch (error) {
            console.error("❌ Error fetching workout:", error);
            
            if (error.name === 'AbortError') {
                throw new Error('Workout fetch timeout - Please try again');
            }
            
            throw error;
        }
    },

    async startNewWorkout() {
        try {
            console.log('🔄 Starting new workout...');

            const workoutData = {
                day: new Date().toISOString(),
                exercises: []
            };
            
            const newWorkout = await this.createWorkout(workoutData);
            
            localStorage.setItem("currentWorkoutId", newWorkout._id);
            localStorage.setItem("workoutStartTime", Date.now().toString());
            localStorage.setItem("newWorkoutExercises", JSON.stringify([]));
            
            console.log('✅ New workout started:', newWorkout._id);
            return newWorkout;
            
        } catch (error) {
            console.error('❌ Failed to start new workout:', error);
            throw error;
        }
    },

    async completeCurrentWorkout() {
        const workoutId = localStorage.getItem("currentWorkoutId");
        
        if (!workoutId) {
            console.log('⚠️ No workout to complete');
            return null;
        }

        try {
            console.log('🔄 Completing workout:', workoutId);
            
            const workout = await this.getWorkout(workoutId);
            
            localStorage.removeItem("currentWorkoutId");
            localStorage.removeItem("newWorkoutExercises");
            localStorage.removeItem("workoutStartTime");

            localStorage.setItem("workoutUpdated", Date.now().toString());
            
            console.log('✅ Workout completed successfully');
            return workout;
            
        } catch (error) {
            console.error("❌ Error completing workout:", error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            console.log('🔄 Checking API health...');
            const res = await fetch(`${this.baseURL}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000) // Shorter timeout for health check
            });
            
            if (!res.ok) {
                throw new Error(`Health check failed: ${res.status} ${res.statusText}`);
            }
            
            const data = await res.json();
            console.log('✅ API health check passed');
            return data;
        } catch (error) {
            console.error('❌ API Health Check failed:', error);
            
            if (error.name === 'AbortError') {
                return { status: 'timeout', message: 'Health check timeout' };
            }
            
            return { status: 'error', message: error.message };
        }
    },

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

            return stats;
        } catch (error) {
            console.error('❌ Error calculating workout stats:', error);
            throw error;
        }
    },

    // Aliases for compatibility
    async getWorkouts() {
        return this.getAllWorkouts();
    },

    async saveWorkout(workoutData) {
        return this.createWorkout(workoutData);
    }
};

// FIXED: Initialize API when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 API initialized for domain:', window.location.origin);
    
    // Test API connection on page load
    try {
        const health = await API.checkHealth();
        if (health.status === 'healthy') {
            console.log('✅ API connection verified');
        } else {
            console.warn('⚠️ API health check returned:', health.status);
        }
    } catch (error) {
        console.warn('⚠️ Initial API health check failed:', error.message);
    }
});

// Handle page visibility changes to reconnect if needed
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        console.log('🔄 Page visible, checking API connection...');
        try {
            await API.checkHealth();
        } catch (error) {
            console.warn('⚠️ API reconnection check failed:', error.message);
        }
    }
});

// Global error handler for fetch failures
window.addEventListener('error', (event) => {
    if (event.error && event.error.message.includes('fetch')) {
        console.error('🌐 Network error detected:', event.error.message);
    }
});

// Expose API for debugging in console
if (typeof window !== 'undefined') {
    window.API_DEBUG = {
        async testConnection() {
            try {
                const health = await API.checkHealth();
                console.log('🔍 API Connection Test:', health);
                return health;
            } catch (error) {
                console.error('🔍 API Connection Test Failed:', error);
                return { error: error.message };
            }
        },

        async testCreateWorkout() {
            try {
                const workout = await API.startNewWorkout();
                console.log('🔍 Test Workout Created:', workout);
                return workout;
            } catch (error) {
                console.error('🔍 Test Workout Creation Failed:', error);
                return { error: error.message };
            }
        },

        async testGetWorkouts() {
            try {
                const workouts = await API.getAllWorkouts();
                console.log('🔍 Test Get Workouts:', workouts.length, 'workouts found');
                return workouts;
            } catch (error) {
                console.error('🔍 Test Get Workouts Failed:', error);
                return { error: error.message };
            }
        },

        async runAllTests() {
            console.log('🔍 Running all API tests...');
            
            const results = {
                health: await this.testConnection(),
                getWorkouts: await this.testGetWorkouts(),
                createWorkout: await this.testCreateWorkout()
            };

            console.log('🔍 All API Test Results:', results);
            return results;
        }
    };
    
    console.log('🔧 API Debug tools available: window.API_DEBUG.runAllTests()');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}

// Auto-retry mechanism for failed requests
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
    const maxRetries = 2;
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await originalFetch(url, options);
            
            // If it's a 503 or 500 error and we have retries left, wait and retry
            if ((response.status === 503 || response.status === 500) && i < maxRetries) {
                console.log(`🔄 Retrying request to ${url} (attempt ${i + 2})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Progressive delay
                continue;
            }
            
            return response;
        } catch (error) {
            lastError = error;
            
            if (i < maxRetries && (error.name === 'AbortError' || error.message.includes('fetch'))) {
                console.log(`🔄 Retrying failed request to ${url} (attempt ${i + 2})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            
            throw error;
        }
    }
    
    throw lastError;
};