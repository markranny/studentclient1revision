// Fixed exercise.js with proper MongoDB integration and better error handling
const workoutTypeSelect = document.querySelector("#type");
const cardioForm = document.querySelector(".cardio-form");
const resistanceForm = document.querySelector(".resistance-form");
const cardioNameInput = document.querySelector("#cardio-name");
const nameInput = document.querySelector("#name");
const weightInput = document.querySelector("#weight");
const setsInput = document.querySelector("#sets");
const repsInput = document.querySelector("#reps");
const durationInput = document.querySelector("#duration");
const resistanceDurationInput = document.querySelector("#resistance-duration");
const distanceInput = document.querySelector("#distance");
const completeButton = document.querySelector("button.complete");
const addButton = document.querySelector("button.add-another");
const toast = document.querySelector("#toast");

let workoutType = null;
let shouldNavigateAway = false;
let currentWorkoutId = null;

// API helper functions with better error handling
const API = {
    baseUrl: '/api', // Adjust if your API has a different base URL
    
    async request(url, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API request failed for ${url}:`, error);
            throw error;
        }
    },
    
    async createWorkout(workoutData) {
        return this.request('/workouts', {
            method: 'POST',
            body: JSON.stringify(workoutData)
        });
    },
    
    async getWorkout(id) {
        return this.request(`/workouts/${id}`);
    },
    
    async addExercise(exerciseData) {
        if (!currentWorkoutId) {
            throw new Error('No active workout session');
        }
        return this.request(`/workouts/${currentWorkoutId}/exercises`, {
            method: 'POST',
            body: JSON.stringify(exerciseData)
        });
    },
    
    async updateWorkout(id, workoutData) {
        return this.request(`/workouts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(workoutData)
        });
    },
    
    async deleteWorkout(id) {
        return this.request(`/workouts/${id}`, {
            method: 'DELETE'
        });
    },
    
    async completeCurrentWorkout() {
        if (currentWorkoutId) {
            // Clean up localStorage
            localStorage.removeItem("currentWorkoutId");
            localStorage.removeItem("newWorkoutExercises");
            
            // Trigger storage event for other tabs
            localStorage.setItem('workoutCompleted', Date.now().toString());
            setTimeout(() => localStorage.removeItem('workoutCompleted'), 100);
            
            console.log('Current workout session completed and cleaned up');
        }
    }
};

// Get current workout ID with proper fallback and validation
function getWorkoutId() {
    // First check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    
    if (id && isValidMongoId(id)) {
        localStorage.setItem("currentWorkoutId", id);
        return id;
    }
    
    // Then check localStorage
    id = localStorage.getItem("currentWorkoutId");
    if (id && isValidMongoId(id)) {
        // Update URL to reflect current workout
        const newUrl = `${window.location.pathname}?id=${id}`;
        window.history.replaceState({}, '', newUrl);
        return id;
    }
    
    return null;
}

// Validate MongoDB ObjectId format
function isValidMongoId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

// Initialize workout - Create new workout in MongoDB if needed
async function initExercise() {
    try {
        currentWorkoutId = getWorkoutId();
        
        if (!currentWorkoutId) {
            console.log('No existing workout found, creating new workout in MongoDB...');
            
            showToast("Creating new workout session...", "info");
            
            const workout = await API.createWorkout({
                day: new Date().toISOString(),
                exercises: [],
                location: "gym",
                workoutType: "mixed",
                difficulty: "intermediate"
            });
            
            if (workout && workout._id) {
                currentWorkoutId = workout._id;
                localStorage.setItem("currentWorkoutId", currentWorkoutId);
                console.log('New workout created successfully:', currentWorkoutId);
                
                // Update URL to show workout ID
                const newUrl = `${window.location.pathname}?id=${currentWorkoutId}`;
                window.history.replaceState({}, '', newUrl);
                
                // Initialize empty exercises array
                localStorage.setItem("newWorkoutExercises", JSON.stringify([]));
                
                showToast("New workout session created!", "success");
            } else {
                throw new Error("Failed to create workout - no ID returned");
            }
        } else {
            console.log('Using existing workout:', currentWorkoutId);
            
            try {
                // Verify workout exists and load exercises
                const workout = await API.getWorkout(currentWorkoutId);
                if (workout && workout.exercises) {
                    localStorage.setItem("newWorkoutExercises", JSON.stringify(workout.exercises));
                    updateNewWorkoutContainer(workout.exercises);
                    console.log(`Loaded ${workout.exercises.length} existing exercises`);
                    
                    if (workout.exercises.length > 0) {
                        showToast(`Resuming workout with ${workout.exercises.length} exercises`, "info");
                    }
                }
            } catch (error) {
                console.warn('Could not load existing workout, may have been deleted:', error.message);
                // Clear invalid workout ID and create new one
                localStorage.removeItem("currentWorkoutId");
                localStorage.removeItem("newWorkoutExercises");
                currentWorkoutId = null;
                
                // Update URL to remove invalid ID
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
                
                showToast("Previous workout not found, creating new one...", "warning");
                return initExercise(); // Recursively call to create new workout
            }
        }
        
        // Update workout stats display
        updateWorkoutStatsDisplay();
        
    } catch (error) {
        console.error("Error initializing workout:", error);
        showToast(`Error creating workout: ${error.message}`, "error");
        
        // Reset state on error
        currentWorkoutId = null;
        localStorage.removeItem("currentWorkoutId");
        localStorage.removeItem("newWorkoutExercises");
    }
}

// Update workout statistics display
function updateWorkoutStatsDisplay() {
    try {
        const exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
        const exerciseCount = exercises.length;
        const totalDuration = exercises.reduce((sum, ex) => sum + (parseInt(ex.duration) || 0), 0);
        
        // Update counter displays if they exist
        const countElement = document.getElementById('exerciseCount');
        const durationElement = document.getElementById('totalDuration');
        const workoutIdElement = document.getElementById('workoutId');
        
        if (countElement) countElement.textContent = exerciseCount;
        if (durationElement) durationElement.textContent = `${totalDuration} min`;
        if (workoutIdElement && currentWorkoutId) {
            workoutIdElement.textContent = currentWorkoutId.slice(-6); // Show last 6 chars
        }
        
        // Enable/disable complete button based on exercise count
        if (completeButton) {
            completeButton.disabled = exerciseCount === 0;
            completeButton.textContent = exerciseCount === 0 ? "Add exercises first" : "Complete Workout";
        }
        
        console.log(`Workout stats updated: ${exerciseCount} exercises, ${totalDuration} min total`);
        
    } catch (error) {
        console.error("Error updating workout stats:", error);
    }
}

// Handle workout type change
function handleWorkoutTypeChange(event) {
    workoutType = event.target.value;
    console.log('Workout type changed to:', workoutType);
    
    if (cardioForm && resistanceForm) {
        if (workoutType === "cardio") {
            cardioForm.classList.remove("d-none");
            resistanceForm.classList.add("d-none");
            // Focus on first cardio input
            if (cardioNameInput) cardioNameInput.focus();
        } else if (workoutType === "resistance") {
            resistanceForm.classList.remove("d-none");
            cardioForm.classList.add("d-none");
            // Focus on first resistance input
            if (nameInput) nameInput.focus();
        } else {
            cardioForm.classList.add("d-none");
            resistanceForm.classList.add("d-none");
        }
    }
    
    validateInputs();
}

// Validate inputs with detailed feedback
function validateInputs() {
    let isValid = false;
    let validationMessage = "";
    
    if (workoutType === "resistance") {
        if (nameInput && weightInput && setsInput && repsInput && resistanceDurationInput) {
            const name = nameInput.value.trim();
            const weight = parseFloat(weightInput.value);
            const sets = parseInt(setsInput.value);
            const reps = parseInt(repsInput.value);
            const duration = parseInt(resistanceDurationInput.value);
            
            if (!name) validationMessage = "Exercise name is required";
            else if (isNaN(weight) || weight < 0) validationMessage = "Valid weight is required";
            else if (isNaN(sets) || sets <= 0) validationMessage = "Sets must be greater than 0";
            else if (isNaN(reps) || reps <= 0) validationMessage = "Reps must be greater than 0";
            else if (isNaN(duration) || duration <= 0) validationMessage = "Duration must be greater than 0";
            else {
                isValid = true;
                validationMessage = "Ready to add resistance exercise";
            }
        }
    } else if (workoutType === "cardio") {
        if (cardioNameInput && durationInput && distanceInput) {
            const name = cardioNameInput.value.trim();
            const duration = parseInt(durationInput.value);
            const distance = parseFloat(distanceInput.value);
            
            if (!name) validationMessage = "Exercise name is required";
            else if (isNaN(duration) || duration <= 0) validationMessage = "Duration must be greater than 0";
            else if (isNaN(distance) || distance < 0) validationMessage = "Valid distance is required";
            else {
                isValid = true;
                validationMessage = "Ready to add cardio exercise";
            }
        }
    } else {
        validationMessage = "Please select an exercise type";
    }

    // Enable/disable add button based on validation
    if (addButton) {
        addButton.disabled = !isValid;
        if (isValid) {
            addButton.removeAttribute("disabled");
            addButton.title = validationMessage;
        } else {
            addButton.setAttribute("disabled", true);
            addButton.title = validationMessage;
        }
    }
    
    // Complete button depends on having exercises
    const exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
    if (completeButton) {
        completeButton.disabled = exercises.length === 0;
    }
    
    // Update validation display if element exists
    const validationDisplay = document.getElementById('validationMessage');
    if (validationDisplay) {
        validationDisplay.textContent = validationMessage;
        validationDisplay.className = isValid ? 'text-success' : 'text-warning';
    }
}

// Handle form submission - Add exercise to MongoDB
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!currentWorkoutId) {
        showToast("No workout session active. Please refresh the page.", "error");
        return;
    }

    // Prepare exercise data with proper validation
    let workoutData = {};
    
    if (workoutType === "cardio") {
        if (!cardioNameInput || !durationInput || !distanceInput) {
            showToast("Cardio form elements not found", "error");
            return;
        }
        
        const name = cardioNameInput.value.trim();
        const duration = parseInt(durationInput.value);
        const distance = parseFloat(distanceInput.value);
        
        if (!name || isNaN(duration) || duration <= 0 || isNaN(distance) || distance < 0) {
            showToast("Please fill in all cardio fields correctly", "error");
            return;
        }
        
        workoutData = {
            type: "cardio",
            category: "cardio", // Ensure category is set
            name: name,
            duration: duration,
            distance: distance,
            intensity: "moderate", // Default intensity
            equipment: "cardio_equipment" // Default equipment
        };
        
    } else if (workoutType === "resistance") {
        if (!nameInput || !weightInput || !setsInput || !repsInput || !resistanceDurationInput) {
            showToast("Resistance form elements not found", "error");
            return;
        }
        
        const name = nameInput.value.trim();
        const weight = parseFloat(weightInput.value);
        const sets = parseInt(setsInput.value);
        const reps = parseInt(repsInput.value);
        const duration = parseInt(resistanceDurationInput.value);
        
        if (!name || isNaN(weight) || weight < 0 || isNaN(sets) || sets <= 0 || 
            isNaN(reps) || reps <= 0 || isNaN(duration) || duration <= 0) {
            showToast("Please fill in all resistance fields correctly", "error");
            return;
        }
        
        workoutData = {
            type: "resistance",
            category: "resistance", // Ensure category is set
            name: name,
            weight: weight,
            sets: sets,
            reps: reps,
            duration: duration,
            intensity: "moderate", // Default intensity
            equipment: "free_weights" // Default equipment
        };
        
    } else {
        showToast("Please select an exercise type", "error");
        return;
    }

    // Show loading state
    if (addButton) {
        addButton.disabled = true;
        addButton.textContent = "Adding...";
    }

    try {
        console.log('Adding exercise to MongoDB:', workoutData);
        
        // Add exercise to MongoDB via API
        const updatedWorkout = await API.addExercise(workoutData);
        console.log('Exercise added successfully to MongoDB');

        // Update localStorage with latest data from MongoDB
        if (updatedWorkout && updatedWorkout.exercises) {
            localStorage.setItem("newWorkoutExercises", JSON.stringify(updatedWorkout.exercises));
            updateNewWorkoutContainer(updatedWorkout.exercises);
            console.log(`Updated with ${updatedWorkout.exercises.length} exercises from server`);
        } else {
            console.warn('API did not return full workout data, updating manually');
            // Fallback: add to localStorage manually if API doesn't return full workout
            const exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
            exercises.push(workoutData);
            localStorage.setItem("newWorkoutExercises", JSON.stringify(exercises));
            updateNewWorkoutContainer(exercises);
        }

        // Update stats and clear form
        updateWorkoutStatsDisplay();
        clearInputs();
        
        // Show success message
        const exerciseType = workoutType === 'cardio' ? 'cardio' : 'resistance';
        showToast(`${workoutData.name} (${exerciseType}) added successfully!`, "success");
        
    } catch (error) {
        console.error("Error adding exercise:", error);
        showToast(`Error adding exercise: ${error.message}`, "error");
    } finally {
        // Reset button state
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = "Add Another";
        }
        
        // Re-validate form
        setTimeout(() => validateInputs(), 100);
    }
}

// Update the new workout container display with better formatting
function updateNewWorkoutContainer(exercises) {
    const newContainerContent = document.querySelector(".new-workout-exercises");
    
    if (!newContainerContent) {
        console.log("New workout exercises container not found");
        return;
    }

    // Clear existing content
    newContainerContent.innerHTML = "";
    
    if (!exercises || exercises.length === 0) {
        newContainerContent.innerHTML = `
            <div class="exercise-detail text-center text-muted">
                <i>No exercises added yet.</i><br>
                <small>Select an exercise type above to get started!</small>
            </div>
        `;
        return;
    }

    // Add header with count
    const headerDiv = document.createElement("div");
    headerDiv.className = "exercise-header mb-3";
    headerDiv.innerHTML = `
        <h6 class="text-primary mb-2">Current Workout (${exercises.length} exercises)</h6>
        <hr class="my-2">
    `;
    newContainerContent.appendChild(headerDiv);

    // Add each exercise to display
    exercises.forEach((ex, index) => {
        const div = document.createElement("div");
        div.classList.add("exercise-detail", "mb-2");
        div.style.cssText = `
            padding: 12px; 
            background: #f8f9fa; 
            border-radius: 8px; 
            border-left: 4px solid ${ex.type === 'cardio' ? '#28a745' : '#007bff'};
            position: relative;
        `;
        
        let exerciseHtml = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${ex.name}</strong> 
                    <span class="badge badge-${ex.type === 'cardio' ? 'success' : 'primary'} ml-1">
                        ${ex.type.charAt(0).toUpperCase() + ex.type.slice(1)}
                    </span>
                    <br>
        `;
        
        if (ex.type === "resistance") {
            exerciseHtml += `
                    <small class="text-muted">
                        ${ex.weight || 0}kg × ${ex.sets || 0} sets × ${ex.reps || 0} reps | ${ex.duration || 0} min
                    </small>
            `;
        } else if (ex.type === "cardio") {
            exerciseHtml += `
                    <small class="text-muted">
                        ${ex.distance || 0}km | ${ex.duration || 0} min
                    </small>
            `;
        }
        
        exerciseHtml += `
                </div>
                <small class="text-muted">#${index + 1}</small>
            </div>
        `;
        
        div.innerHTML = exerciseHtml;
        newContainerContent.appendChild(div);
    });
    
    // Add summary footer
    const totalDuration = exercises.reduce((sum, ex) => sum + (parseInt(ex.duration) || 0), 0);
    const footerDiv = document.createElement("div");
    footerDiv.className = "exercise-footer mt-3 pt-2 border-top";
    footerDiv.innerHTML = `
        <div class="row text-center">
            <div class="col-6">
                <strong class="text-primary">${exercises.length}</strong><br>
                <small class="text-muted">Exercises</small>
            </div>
            <div class="col-6">
                <strong class="text-success">${totalDuration}</strong><br>
                <small class="text-muted">Total Minutes</small>
            </div>
        </div>
    `;
    newContainerContent.appendChild(footerDiv);
    
    console.log(`Updated exercise display with ${exercises.length} exercises`);
}

// Handle toast animation end
function handleToastAnimationEnd() {
    if (toast) {
        toast.removeAttribute("class");
    }
    
    if (shouldNavigateAway) {
        window.location.href = "/index.html";
    }
}

// Show toast notification with different types
function showToast(message, type = "success") {
    if (!toast) {
        console.log(`Toast message (${type}): ${message}`);
        return;
    }
    
    const text = toast.querySelector("span") || toast;
    text.textContent = message;
    
    // Remove existing classes and set appropriate styling based on type
    toast.className = "toast";
    
    switch (type) {
        case "error":
            toast.classList.add("error", "bg-danger", "text-white");
            break;
        case "warning":
            toast.classList.add("warning", "bg-warning", "text-dark");
            break;
        case "info":
            toast.classList.add("info", "bg-info", "text-white");
            break;
        case "success":
        default:
            toast.classList.add("success", "bg-success", "text-white");
            break;
    }
    
    // Show toast
    toast.style.display = "block";
    
    // Auto-hide after appropriate duration
    const duration = type === "error" ? 5000 : type === "warning" ? 4000 : 3000;
    setTimeout(() => {
        toast.style.display = "none";
        toast.className = "toast";
    }, duration);
    
    console.log(`Toast shown (${type}): ${message}`);
}

// Clear all form inputs and reset state
function clearInputs() {
    const inputs = [
        cardioNameInput, nameInput, setsInput, distanceInput, 
        durationInput, repsInput, resistanceDurationInput, weightInput
    ];
    
    inputs.forEach(input => {
        if (input) {
            input.value = "";
            // Remove any error states
            input.classList.remove('is-invalid', 'is-valid');
        }
    });
    
    // Reset workout type
    if (workoutTypeSelect) {
        workoutTypeSelect.value = "";
    }
    
    workoutType = null;
    
    // Hide forms
    if (cardioForm) cardioForm.classList.add("d-none");
    if (resistanceForm) resistanceForm.classList.add("d-none");
    
    // Clear validation message
    const validationDisplay = document.getElementById('validationMessage');
    if (validationDisplay) {
        validationDisplay.textContent = "Select an exercise type to begin";
        validationDisplay.className = 'text-muted';
    }
    
    console.log("Form inputs cleared and reset");
}

// Handle complete workout with comprehensive validation
async function handleCompleteWorkout(event) {
    event.preventDefault();
    
    if (!currentWorkoutId) {
        showToast("No workout session active.", "error");
        return;
    }

    // Show loading state
    if (completeButton) {
        completeButton.disabled = true;
        completeButton.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span>Completing...';
    }

    try {
        // Verify workout has exercises
        const workout = await API.getWorkout(currentWorkoutId);
        if (!workout || !workout.exercises || workout.exercises.length === 0) {
            showToast("Please add at least one exercise before completing the workout.", "warning");
            return;
        }

        console.log('Completing workout:', currentWorkoutId, 'with', workout.exercises.length, 'exercises');
        
        // Update workout status and clean up
        await API.completeCurrentWorkout();
        
        // Mark for navigation
        shouldNavigateAway = true;
        
        // Update display with completion message
        const newContainerContent = document.querySelector(".new-workout-exercises");
        if (newContainerContent) {
            newContainerContent.innerHTML = `
                <div class="text-center p-4">
                    <div class="mb-3">
                        <i class="fas fa-check-circle text-success" style="font-size: 3rem;"></i>
                    </div>
                    <h5 class="text-success">Workout Completed!</h5>
                    <p class="text-muted mb-3">
                        Great job! You completed ${workout.exercises.length} exercises 
                        in ${workout.totalDuration || 0} minutes.
                    </p>
                    <div class="spinner-border spinner-border-sm text-primary mr-2"></div>
                    <span class="text-muted">Redirecting to dashboard...</span>
                </div>
            `;
        }
        
        // Show success and navigate
        showToast(`Workout completed! ${workout.exercises.length} exercises, ${workout.totalDuration || 0} minutes total.`, "success");
        
        // Navigate after short delay to show completion message
        setTimeout(() => {
            window.location.href = "/index.html";
        }, 2500);
        
        console.log('Workout completed successfully, navigating in 2.5 seconds');
        
    } catch (error) {
        console.error("Error completing workout:", error);
        showToast(`Error completing workout: ${error.message}`, "error");
        shouldNavigateAway = false;
    } finally {
        // Reset button if navigation didn't happen
        setTimeout(() => {
            if (completeButton && !shouldNavigateAway) {
                completeButton.disabled = false;
                completeButton.innerHTML = "Complete Workout";
            }
        }, 1000);
    }
}

// Event listeners setup with error handling
function setupEventListeners() {
    try {
        if (workoutTypeSelect) {
            workoutTypeSelect.addEventListener("change", handleWorkoutTypeChange);
            console.log("Workout type selector event listener added");
        }

        if (completeButton) {
            completeButton.addEventListener("click", handleCompleteWorkout);
            console.log("Complete button event listener added");
        }

        if (addButton) {
            addButton.addEventListener("click", handleFormSubmit);
            console.log("Add button event listener added");
        }

        if (toast) {
            toast.addEventListener("animationend", handleToastAnimationEnd);
            console.log("Toast animation event listener added");
        }

        // Add input validation listeners with debouncing
        const allInputs = document.querySelectorAll("input, select");
        allInputs.forEach(input => {
            let timeout;
            
            const debouncedValidation = () => {
                clearTimeout(timeout);
                timeout = setTimeout(validateInputs, 300);
            };
            
            input.addEventListener("input", debouncedValidation);
            input.addEventListener("change", validateInputs);
            
            // Add visual feedback for individual inputs
            input.addEventListener("blur", function() {
                if (this.value.trim()) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                }
            });
        });
        
        // Add keyboard shortcuts
        document.addEventListener("keydown", function(event) {
            // Ctrl/Cmd + Enter to add exercise (if form is valid)
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                if (addButton && !addButton.disabled) {
                    handleFormSubmit(event);
                }
            }
            
            // Escape to clear form
            if (event.key === "Escape") {
                clearInputs();
                if (workoutTypeSelect) workoutTypeSelect.focus();
            }
        });
        
        console.log("All event listeners set up successfully");
        
    } catch (error) {
        console.error("Error setting up event listeners:", error);
        showToast("Error setting up page interactions. Please refresh.", "error");
    }
}

// Handle connectivity issues
function handleConnectionError() {
    showToast("Connection issue detected. Please check your internet connection.", "warning");
    
    // Retry connection after delay
    setTimeout(async () => {
        try {
            if (currentWorkoutId) {
                await API.getWorkout(currentWorkoutId);
                showToast("Connection restored!", "success");
            }
        } catch (error) {
            console.log("Still having connection issues:", error.message);
        }
    }, 5000);
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Exercise page loading...");
    
    try {
        // Check authentication
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) {
            console.log("User not authenticated, redirecting to login");
            showToast("Please log in to continue", "warning");
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }
        
        console.log("User authenticated:", user.email || user.username || "Unknown");
        
        // Check if API is available (assuming it's loaded via script tag)
        if (typeof API === 'undefined') {
            // API is defined in this file, so this shouldn't happen
            console.log("Using internal API implementation");
        }
        
        // Set up event listeners first
        setupEventListeners();
        
        // Initialize workout with loading indicator
        const initPromise = initExercise();
        
        // Show initial validation message
        const validationDisplay = document.getElementById('validationMessage');
        if (validationDisplay) {
            validationDisplay.textContent = "Select an exercise type to begin";
            validationDisplay.className = 'text-muted';
        }
        
        await initPromise;
        
        console.log("Exercise page initialized successfully");
        
    } catch (error) {
        console.error("Error during page initialization:", error);
        showToast(`Initialization error: ${error.message}`, "error");
    }
});

// Handle page visibility changes to sync data
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && currentWorkoutId) {
        try {
            console.log("Page became visible, syncing workout data...");
            // Refresh workout data when page becomes visible
            const workout = await API.getWorkout(currentWorkoutId);
            if (workout && workout.exercises) {
                const currentExercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
                
                // Only update if there are changes
                if (workout.exercises.length !== currentExercises.length) {
                    localStorage.setItem("newWorkoutExercises", JSON.stringify(workout.exercises));
                    updateNewWorkoutContainer(workout.exercises);
                    updateWorkoutStatsDisplay();
                    
                    const diff = workout.exercises.length - currentExercises.length;
                    if (diff > 0) {
                        showToast(`${diff} new exercise${diff > 1 ? 's' : ''} synced from another session`, "info");
                    }
                    
                    console.log("Workout data synced on page focus");
                }
            }
        } catch (error) {
            console.warn('Could not sync workout data on page focus:', error.message);
            if (error.message.includes('not found')) {
                // Workout was deleted in another session
                showToast("Workout was deleted in another session. Creating new workout...", "warning");
                currentWorkoutId = null;
                localStorage.removeItem("currentWorkoutId");
                localStorage.removeItem("newWorkoutExercises");
                initExercise();
            }
        }
    }
});

// Handle page unload - save any pending data
window.addEventListener('beforeunload', (event) => {
    if (currentWorkoutId) {
        console.log('Page unloading with active workout:', currentWorkoutId);
        
        // For development/testing, you might want to warn users
        if (process?.env?.NODE_ENV === 'development') {
            event.preventDefault();
            event.returnValue = 'You have an active workout. Are you sure you want to leave?';
        }
    }
});

// Listen for storage changes from other tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'workoutCompleted') {
        console.log('Workout completed in another tab');
        showToast('Workout was completed in another tab', 'info');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
    } else if (e.key === 'workoutUpdated') {
        console.log('Workout updated in another tab');
        if (currentWorkoutId) {
            setTimeout(() => updateWorkoutStatsDisplay(), 100);
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
    showToast('Connection restored!', 'success');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    showToast('Connection lost. Changes will be saved when connection is restored.', 'warning');
});

// Export functions for testing/debugging (only in development)
if (typeof window !== 'undefined') {
    window.ExercisePageDebug = {
        currentWorkoutId: () => currentWorkoutId,
        getWorkoutData: () => JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]"),
        validateForm: validateInputs,
        clearForm: clearInputs,
        refreshStats: updateWorkoutStatsDisplay,
        showToast: showToast,
        API: API
    };
}