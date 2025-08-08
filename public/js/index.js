document.addEventListener("DOMContentLoaded", async () => {
  const newContainer = document.querySelector(".new-workout-container");
  const newContainerContent = document.querySelector(".new-workout-exercises");

  async function fetchLastWorkout() {
      try {
          const lastWorkout = await API.getLastWorkout();
          if (!lastWorkout || !lastWorkout.exercises) return;
          renderWorkoutInContainer(lastWorkout);
      } catch (err) {
          console.error("Error fetching last workout:", err);
      }
  }

  function renderWorkoutInContainer(workout) {
      newContainerContent.innerHTML = ""; // clear old
      if (!workout.exercises.length) {
          newContainerContent.textContent = "No exercise added yet.";
          return;
      }

      workout.exercises.forEach(ex => {
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

  const completeBtn = document.querySelector("#complete-new-workout");
  if (completeBtn) {
      completeBtn.addEventListener("click", async () => {
          const workoutId = localStorage.getItem("currentWorkoutId");
          if (!workoutId) return alert("No workout to complete.");

          try {
              // Notify stats and history pages to refresh
              localStorage.setItem("workoutUpdated", Date.now());
              localStorage.removeItem("currentWorkoutId");

              // Clear new container
              newContainerContent.textContent = "No exercise added yet.";
              alert("Workout completed! Stats and history updated.");
          } catch (err) {
              console.error("Error completing workout:", err);
          }
      });
  }

  fetchLastWorkout();

  // Listen for updates
  window.addEventListener("storage", (e) => {
      if (e.key === "workoutUpdated") fetchLastWorkout();
  });
});
