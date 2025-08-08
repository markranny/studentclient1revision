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

// Initialize workout
async function initExercise() {
  let id = getWorkoutId();
  if (!id) {
    try {
      const workout = await API.createWorkout();
      if (workout && workout._id) {
        localStorage.setItem("currentWorkoutId", workout._id);
        location.search = "?id=" + workout._id;
      } else {
        console.error("Failed to create workout:", workout);
        alert("Failed to create workout. Please try again.");
      }
    } catch (error) {
      console.error("Error creating workout:", error);
      alert("Error creating workout. Please check your MongoDB connection.");
    }
  }
}
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

// Handle form submission
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

  await API.addExercise(workoutData);

  // --- Render in new container ---
  const newContainerContent = document.querySelector(".new-workout-exercises");
  if (newContainerContent) {
    let exercises = JSON.parse(localStorage.getItem("newWorkoutExercises") || "[]");
    exercises.push(workoutData);
    localStorage.setItem("newWorkoutExercises", JSON.stringify(exercises));

    newContainerContent.innerHTML = "";
    exercises.forEach(ex => {
      const div = document.createElement("div");
      div.classList.add("exercise-detail");
      if (ex.type === "resistance") {
        div.textContent = `resistance - ${ex.name} - Duration: ${ex.duration || 0} min, Weight: ${ex.weight || 0} kg, Sets: ${ex.sets || 0}, Reps: ${ex.reps || 0}`;
      } else {
        div.textContent = `cardio - ${ex.name} - Duration: ${ex.duration || 0} min, Distance: ${ex.distance || 0} km`;
      }
      newContainerContent.appendChild(div);
    });
  }

  clearInputs();
  toast.classList.add("success");
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

// Event listeners
if (workoutTypeSelect) workoutTypeSelect.addEventListener("change", handleWorkoutTypeChange);
if (completeButton) completeButton.addEventListener("click", function(event) {
  shouldNavigateAway = true;
  handleFormSubmit(event);

  // --- Clear new workout container and notify stats/history ---
  const newContainerContent = document.querySelector(".new-workout-exercises");
  if (newContainerContent) newContainerContent.textContent = "No exercise added yet.";

  localStorage.setItem("workoutUpdated", Date.now());
  localStorage.removeItem("currentWorkoutId");
});
if (addButton) addButton.addEventListener("click", handleFormSubmit);
toast.addEventListener("animationend", handleToastAnimationEnd);
document.querySelectorAll("input").forEach(el => el.addEventListener("input", validateInputs));
