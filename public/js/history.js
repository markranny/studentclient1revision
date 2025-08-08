// history.js

document.addEventListener("DOMContentLoaded", async () => {
    const historyContent = document.querySelector(".history-content");
    const searchSelect = document.getElementById("history-search-select");
    const searchBtn = document.getElementById("history-search-btn");

    let workouts = [];

    // Fetch all workouts
    async function fetchWorkouts() {
        try {
            workouts = await API.getAllWorkouts();
            populateDropdown();
        } catch (err) {
            console.error("Error fetching workouts:", err);
        }
    }

    // Populate dropdown with workout dates
    function populateDropdown() {
        searchSelect.innerHTML = '<option disabled selected>Select a workout</option>';
        workouts.forEach(workout => {
            const option = document.createElement("option");
            option.value = workout._id;
            option.textContent = new Date(workout.day).toDateString();
            searchSelect.appendChild(option);
        });
    }

    // Display workouts in container
    function displayWorkouts(workoutsToDisplay) {
        historyContent.innerHTML = "";

        if (!workoutsToDisplay.length) {
            historyContent.innerHTML = `<div id="no-workout-history">
                You have no workouts <i class="far fa-frown-open"></i>
                <form action="/exercise">
                    <button id="add-workout-btn">Add a new workout</button>
                </form>
            </div>`;
            return;
        }

        workoutsToDisplay.forEach(workout => {
            const workoutDiv = document.createElement("div");
            workoutDiv.classList.add("workout-entry");

            const dateHeading = document.createElement("div");
            dateHeading.classList.add("workout-date");
            dateHeading.textContent = new Date(workout.day).toDateString();
            workoutDiv.appendChild(dateHeading);

            workout.exercises.forEach(ex => {
                const exDiv = document.createElement("div");
                exDiv.classList.add("exercise-detail");

                if (ex.type === "resistance") {
                    exDiv.textContent = `resistance - ${ex.name} - Duration: ${ex.duration || 0} min, Weight: ${ex.weight || 0} kg, Sets: ${ex.sets || 0}, Reps: ${ex.reps || 0}`;
                } else if (ex.type === "cardio") {
                    exDiv.textContent = `cardio - ${ex.name} - Duration: ${ex.duration || 0} min, Distance: ${ex.distance || 0} km`;
                }

                workoutDiv.appendChild(exDiv);
            });

            historyContent.appendChild(workoutDiv);
        });
    }

    // Handle dropdown change
    searchSelect.addEventListener("change", async (e) => {
        const selectedId = e.target.value;
        const selectedWorkout = workouts.find(w => w._id === selectedId);
        displayWorkouts(selectedWorkout ? [selectedWorkout] : []);
    });

    // Handle "View All" button
    searchBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        displayWorkouts(workouts);
    });

    // Listen for updates from Home page
    window.addEventListener("storage", (e) => {
        if (e.key === "workoutUpdated") {
            fetchWorkouts().then(() => displayWorkouts(workouts));
        }
    });

    // Initial fetch
    await fetchWorkouts();
});
