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

// Get current workout ID
function getWorkoutId() {
  let id = location.search.split("=")[1];
  if (id) {
    localStorage.setItem("currentWorkoutId", id);
    return id;
  }
  return localStorage.getItem("currentWorkoutId");
}

// Initialize workout - Create new workout in MongoDB
async function initExercise() {
  let id = getWorkoutId();
  if (!id) {
    try {
      console.log('Creating new workout in MongoDB...');
      const workout = await API.createWorkout();
      if (workout && workout._id) {
        localStorage.setItem("currentWorkoutId", workout._id);
        console.log('Workout created successfully:', workout._id);
        // Update URL to show workout ID
        const newUrl = `${window.location.pathname}?id=${workout._id}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        throw new Error("Failed to create workout");
      }
    } catch (error) {
      console.error("Error creating workout:", error);
      alert("Error creating workout. Please check your MongoDB connection and try again.");
    }
  } else {
    console.log('Using existing workout:', id);
  }
}

// Initialize on page load
initExercise();

// Handle workout type change
function handleWorkoutTypeChange(event) {
  workoutType = event.target.value;
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
  validateInputs();
}

// Validate inputs
function validateInputs() {
  let isValid = true;
  if (workoutType === "resistance") {
    if (!nameInput.value || !weightInput.value || !setsInput.value || !repsInput.value || !resistanceDurationInput.value) {
      isValid = false;
    }
  } else if (workoutType === "cardio") {
    if (!cardioNameInput.value || !durationInput.value || !distanceInput.value) {
      isValid = false;
    }
  }

  if (isValid) {
    completeButton.removeAttribute("disabled");
    addButton.removeAttribute("disabled");
  } else {
    completeButton.setAttribute("disabled", true);
    addButton.setAttribute("disabled", true);
  }
}

// Handle form submission - Add exercise to MongoDB
async function handleFormSubmit(event) {
  event.preventDefault();

  let workoutData = {};
  if (workoutType === "cardio") {
    workoutData = {
      type: "cardio",
      name: cardioNameInput.value.trim(),
      duration: Number(durationInput.value),
      distance: Number(distanceInput.value)
    };
  } else if (workoutType === "resistance") {
    workoutData = {
      type: "resistance",
      name: nameInput.value.trim(),
      weight: Number(weightInput.value),
      sets: Number(setsInput.value),
      reps: Number(repsInput.value),
      duration: Number(resistanceDurationInput.value)
    };
  }

  const id = getWorkoutId();
  if (!id) {
    alert("No workout in progress. Please start a new workout from the home page.");
    return;
  }

  try {
    console.log('Adding exercise to MongoDB:', workoutData);
    
    // Add exercise to MongoDB
    await API.addExercise(workoutData);
    console.log('Exercise added successfully to MongoDB');

    // Also update localStorage for real-time UI updates
    let exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
    exercises.push(workoutData);
    localStorage.setItem("newWorkoutExercises", JSON.stringify(exercises));

    // Update new workout container display
    updateNewWorkoutContainer(exercises);

    // Clear form inputs
    clearInputs();
    
    // Show success message
    toast.classList.add("success");
    
  } catch (error) {
    console.error("Error adding exercise:", error);
    alert("Error adding exercise. Please check your MongoDB connection and try again.");
  }
}

// Update the new workout container display
function updateNewWorkoutContainer(exercises) {
  const newContainerContent = document.querySelector(".new-workout-exercises");
  if (newContainerContent) {
    newContainerContent.innerHTML = "";
    exercises.forEach(ex => {
      const div = document.createElement("div");
      div.classList.add("exercise-detail");
      if (ex.type === "resistance") {
        div.textContent = `${ex.type} - ${ex.name} - Duration: ${ex.duration || 0} min, Weight: ${ex.weight || 0} kg, Sets: ${ex.sets || 0}, Reps: ${ex.reps || 0}`;
      } else {
        div.textContent = `${ex.type} - ${ex.name} - Duration: ${ex.duration || 0} min, Distance: ${ex.distance || 0} km`;
      }
      newContainerContent.appendChild(div);
    });
  }
}

// Handle toast animation
function handleToastAnimationEnd() {
  toast.removeAttribute("class");
  if (shouldNavigateAway) {
    location.href = "/";
  }
}

// Clear inputs
function clearInputs() {
  cardioNameInput.value = "";
  nameInput.value = "";
  setsInput.value = "";
  distanceInput.value = "";
  durationInput.value = "";
  repsInput.value = "";
  resistanceDurationInput.value = "";
  weightInput.value = "";
}

// Handle complete workout
async function handleCompleteWorkout(event) {
  event.preventDefault();
  
  const workoutId = getWorkoutId();
  if (!workoutId) {
    alert("No workout in progress.");
    return;
  }

  try {
    // Check if workout has exercises
    const exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
    if (exercises.length === 0) {
      alert("Please add at least one exercise before completing the workout.");
      return;
    }

    console.log('Completing workout:', workoutId);
    
    // The workout and exercises should already be saved to MongoDB
    // Just need to clean up localStorage and navigate
    shouldNavigateAway = true;
    
    // Clear localStorage
    localStorage.removeItem("currentWorkoutId");
    localStorage.removeItem("newWorkoutExercises");
    localStorage.removeItem("workoutStartTime");
    
    // Clear new workout container
    const newContainerContent = document.querySelector(".new-workout-exercises");
    if (newContainerContent) {
      newContainerContent.innerHTML = '<div class="exercise-detail">Workout completed! Redirecting...</div>';
    }
    
    // Notify other pages that workout data has been updated
    localStorage.setItem("workoutUpdated", Date.now());
    
    // Show success toast and navigate
    toast.classList.add("success");
    
  } catch (error) {
    console.error("Error completing workout:", error);
    alert("Error completing workout. Please try again.");
  }
}

// Event listeners
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
document.querySelectorAll("input").forEach(el => {
  el.addEventListener("input", validateInputs);
});

// Load existing exercises for current workout on page load
window.addEventListener('DOMContentLoaded', async () => {
  const workoutId = getWorkoutId();
  if (workoutId) {
    try {
      // Try to get current workout from MongoDB to show existing exercises
      const workout = await API.getWorkout(workoutId);
      if (workout && workout.exercises) {
        // Update localStorage to match MongoDB data
        localStorage.setItem("newWorkoutExercises", JSON.stringify(workout.exercises));
        updateNewWorkoutContainer(workout.exercises);
      }
    } catch (error) {
      console.log('Could not load existing workout data:', error.message);
      // This is okay - might be a new workout
    }
  }
  
  // Load any exercises from localStorage (for UI consistency)
  const exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
  if (exercises.length > 0) {
    updateNewWorkoutContainer(exercises);
  }
});

// Handle page visibility change to sync localStorage with MongoDB
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    const workoutId = getWorkoutId();
    if (workoutId) {
      try {
        const workout = await API.getWorkout(workoutId);
        if (workout && workout.exercises) {
          localStorage.setItem("newWorkoutExercises", JSON.stringify(workout.exercises));
          updateNewWorkoutContainer(workout.exercises);
        }
      } catch (error) {
        console.log('Could not sync workout data:', error.message);
      }
    }
  }
});