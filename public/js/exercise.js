// Updated exercise.js with proper MongoDB integration
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

// Get current workout ID with proper fallback
function getWorkoutId() {
    // First check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    
    if (id) {
        localStorage.setItem("currentWorkoutId", id);
        return id;
    }
    
    // Then check localStorage
    id = localStorage.getItem("currentWorkoutId");
    if (id) {
        // Update URL to reflect current workout
        const newUrl = `${window.location.pathname}?id=${id}`;
        window.history.replaceState({}, '', newUrl);
        return id;
    }
    
    return null;
}

// Initialize workout - Create new workout in MongoDB if needed
async function initExercise() {
    try {
        currentWorkoutId = getWorkoutId();
        
        if (!currentWorkoutId) {
            console.log('No existing workout found, creating new workout in MongoDB...');
            const workout = await API.createWorkout({
                day: new Date().toISOString(),
                exercises: []
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
                }
            } catch (error) {
                console.warn('Could not load existing workout, may have been deleted:', error.message);
                // Clear invalid workout ID and create new one
                localStorage.removeItem("currentWorkoutId");
                currentWorkoutId = null;
                return initExercise(); // Recursively call to create new workout
            }
        }
        
        // Update workout stats display
        updateWorkoutStatsDisplay();
        
    } catch (error) {
        console.error("Error initializing workout:", error);
        showToast("Error creating workout. Please check your connection and try again.", "error");
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
        
        if (countElement) countElement.textContent = exerciseCount;
        if (durationElement) durationElement.textContent = `${totalDuration} min`;
        
        // Enable/disable complete button based on exercise count
        if (completeButton) {
            completeButton.disabled = exerciseCount === 0;
        }
        
        console.log(`Workout stats updated: ${exerciseCount} exercises, ${totalDuration} min total`);
        
    } catch (error) {
        console.error("Error updating workout stats:", error);
    }
}

// Handle workout type change
function handleWorkoutTypeChange(event) {
    workoutType = event.target.value;
    
    if (cardioForm && resistanceForm) {
        if (workoutType === "cardio") {
            cardioForm.classList.remove("d-none");
            resistanceForm.classList.add("d-none");
        } else if (workoutType === "resistance") {
            resistanceForm.classList.remove("d-none");
            cardioForm.classList.add("d-none");
        } else {
            cardioForm.classList.add("d-none");
            resistanceForm.classList.add("d-none");
        }
    }
    
    validateInputs();
}

// Validate inputs
function validateInputs() {
    let isValid = false;
    
    if (workoutType === "resistance") {
        if (nameInput && weightInput && setsInput && repsInput && resistanceDurationInput) {
            const name = nameInput.value.trim();
            const weight = weightInput.value;
            const sets = setsInput.value;
            const reps = repsInput.value;
            const duration = resistanceDurationInput.value;
            
            isValid = name && weight && sets && reps && duration && 
                     parseFloat(weight) >= 0 && parseInt(sets) > 0 && 
                     parseInt(reps) > 0 && parseInt(duration) > 0;
        }
    } else if (workoutType === "cardio") {
        if (cardioNameInput && durationInput && distanceInput) {
            const name = cardioNameInput.value.trim();
            const duration = durationInput.value;
            const distance = distanceInput.value;
            
            isValid = name && duration && distance && 
                     parseInt(duration) > 0 && parseFloat(distance) >= 0;
        }
    }

    // Enable/disable buttons based on validation
    if (completeButton && addButton) {
        if (isValid) {
            addButton.removeAttribute("disabled");
        } else {
            addButton.setAttribute("disabled", true);
        }
        
        // Complete button depends on having exercises
        const exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
        completeButton.disabled = exercises.length === 0;
    }
}

// Handle form submission - Add exercise to MongoDB
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!currentWorkoutId) {
        showToast("No workout session active. Please refresh the page.", "error");
        return;
    }

    // Prepare exercise data
    let workoutData = {};
    
    if (workoutType === "cardio") {
        if (!cardioNameInput || !durationInput || !distanceInput) {
            showToast("Cardio form elements not found", "error");
            return;
        }
        
        workoutData = {
            type: "cardio",
            name: cardioNameInput.value.trim(),
            duration: parseInt(durationInput.value),
            distance: parseFloat(distanceInput.value)
        };
    } else if (workoutType === "resistance") {
        if (!nameInput || !weightInput || !setsInput || !repsInput || !resistanceDurationInput) {
            showToast("Resistance form elements not found", "error");
            return;
        }
        
        workoutData = {
            type: "resistance",
            name: nameInput.value.trim(),
            weight: parseFloat(weightInput.value),
            sets: parseInt(setsInput.value),
            reps: parseInt(repsInput.value),
            duration: parseInt(resistanceDurationInput.value)
        };
    } else {
        showToast("Please select an exercise type", "error");
        return;
    }

    // Validate required fields
    if (!workoutData.name || !workoutData.duration) {
        showToast("Please fill in all required fields", "error");
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
        } else {
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
        showToast("Exercise added successfully!", "success");
        
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
        validateInputs();
    }
}

// Update the new workout container display
function updateNewWorkoutContainer(exercises) {
    const newContainerContent = document.querySelector(".new-workout-exercises");
    
    if (!newContainerContent) {
        console.log("New workout exercises container not found");
        return;
    }

    // Clear existing content
    newContainerContent.innerHTML = "";
    
    if (!exercises || exercises.length === 0) {
        newContainerContent.innerHTML = '<div class="exercise-detail">No exercises added yet.</div>';
        return;
    }

    // Add each exercise to display
    exercises.forEach((ex, index) => {
        const div = document.createElement("div");
        div.classList.add("exercise-detail");
        div.style.cssText = "margin: 8px 0; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;";
        
        if (ex.type === "resistance") {
            div.innerHTML = `
                <strong>${ex.name}</strong> (Resistance)<br>
                Weight: ${ex.weight || 0}kg | Sets: ${ex.sets || 0} | Reps: ${ex.reps || 0} | Duration: ${ex.duration || 0} min
            `;
        } else if (ex.type === "cardio") {
            div.innerHTML = `
                <strong>${ex.name}</strong> (Cardio)<br>
                Distance: ${ex.distance || 0}km | Duration: ${ex.duration || 0} min
            `;
        }
        
        newContainerContent.appendChild(div);
    });
    
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

// Show toast notification
function showToast(message, type = "success") {
    if (!toast) return;
    
    const text = toast.querySelector("span") || toast;
    text.textContent = message;
    
    // Set appropriate styling based on type
    toast.className = type === "error" ? "toast error" : "toast success";
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

// Clear all form inputs
function clearInputs() {
    const inputs = [
        cardioNameInput, nameInput, setsInput, distanceInput, 
        durationInput, repsInput, resistanceDurationInput, weightInput
    ];
    
    inputs.forEach(input => {
        if (input) input.value = "";
    });
    
    // Reset workout type
    if (workoutTypeSelect) {
        workoutTypeSelect.value = "";
    }
    
    workoutType = null;
    
    // Hide forms
    if (cardioForm) cardioForm.classList.add("d-none");
    if (resistanceForm) resistanceForm.classList.add("d-none");
    
    console.log("Form inputs cleared");
}

// Handle complete workout
async function handleCompleteWorkout(event) {
    event.preventDefault();
    
    if (!currentWorkoutId) {
        showToast("No workout session active.", "error");
        return;
    }

    // Show loading state
    if (completeButton) {
        completeButton.disabled = true;
        completeButton.textContent = "Completing...";
    }

    try {
        // Verify workout has exercises
        const workout = await API.getWorkout(currentWorkoutId);
        if (!workout || !workout.exercises || workout.exercises.length === 0) {
            showToast("Please add at least one exercise before completing the workout.", "error");
            return;
        }

        console.log('Completing workout:', currentWorkoutId);
        
        // Complete the workout (this cleans up localStorage)
        await API.completeCurrentWorkout();
        
        // Mark for navigation
        shouldNavigateAway = true;
        
        // Update display
        const newContainerContent = document.querySelector(".new-workout-exercises");
        if (newContainerContent) {
            newContainerContent.innerHTML = '<div class="exercise-detail">✅ Workout completed! Redirecting...</div>';
        }
        
        // Show success and navigate
        showToast("Workout completed successfully!", "success");
        
        // Navigate after short delay
        setTimeout(() => {
            window.location.href = "/index.html";
        }, 2000);
        
        console.log('Workout completed successfully');
        
    } catch (error) {
        console.error("Error completing workout:", error);
        showToast(`Error completing workout: ${error.message}`, "error");
    } finally {
        // Reset button if navigation didn't happen
        if (completeButton && !shouldNavigateAway) {
            completeButton.disabled = false;
            completeButton.textContent = "Complete";
        }
    }
}

// Event listeners setup
function setupEventListeners() {
    if (workoutTypeSelect) {
        workoutTypeSelect.addEventListener("change", handleWorkoutTypeChange);
    }

    if (completeButton) {
        completeButton.addEventListener("click", handleCompleteWorkout);
    }

    if (addButton) {
        addButton.addEventListener("click", handleFormSubmit);
    }

    if (toast) {
        toast.addEventListener("animationend", handleToastAnimationEnd);
    }

    // Add input validation listeners
    const allInputs = document.querySelectorAll("input, select");
    allInputs.forEach(input => {
        input.addEventListener("input", validateInputs);
        input.addEventListener("change", validateInputs);
    });
    
    console.log("Event listeners set up successfully");
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Exercise page loading...");
    
    // Check authentication
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
        console.log("User not authenticated, redirecting to login");
        window.location.href = '/login.html';
        return;
    }
    
    // Wait for API to be available
    if (typeof API === 'undefined') {
        console.error("API not loaded! Make sure api.js is included before this script.");
        showToast("Error: API not available. Please refresh the page.", "error");
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize workout
    await initExercise();
    
    console.log("Exercise page initialized successfully");
});

// Handle page visibility changes to sync data
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && currentWorkoutId) {
        try {
            // Refresh workout data when page becomes visible
            const workout = await API.getWorkout(currentWorkoutId);
            if (workout && workout.exercises) {
                localStorage.setItem("newWorkoutExercises", JSON.stringify(workout.exercises));
                updateNewWorkoutContainer(workout.exercises);
                updateWorkoutStatsDisplay();
                console.log("Workout data synced on page focus");
            }
        } catch (error) {
            console.warn('Could not sync workout data on page focus:', error.message);
        }
    }
});

// Handle page unload - save any pending data
window.addEventListener('beforeunload', () => {
    if (currentWorkoutId) {
        console.log('Page unloading with active workout:', currentWorkoutId);
        // Any cleanup can be done here if needed
    }
});

// Listen for storage changes from other tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'workoutUpdated') {
        console.log('Workout updated in another tab');
        // Refresh data if needed
        if (currentWorkoutId) {
            setTimeout(() => updateWorkoutStatsDisplay(), 100);
        }
    }
});

// Export functions for testing/debugging
window.ExercisePageDebug = {
    currentWorkoutId: () => currentWorkoutId,
    getWorkoutData: () => JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]"),
    validateForm: validateInputs,
    clearForm: clearInputs,
    refreshStats: updateWorkoutStatsDisplay
};