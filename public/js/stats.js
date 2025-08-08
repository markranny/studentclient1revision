// stats.js

async function renderStats() {
  try {
      const workouts = await API.getAllWorkouts();

      if (!workouts || workouts.length === 0) {
          console.log("No workouts found.");
          return;
      }

      // Use last 7 workouts
      const last7 = workouts.slice(0, 7).reverse();

      // Prepare data for charts
      const labels = last7.map(w => new Date(w.day).toDateString());

      const durationData = last7.map(w =>
          w.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0)
      );

      const weightData = last7.map(w =>
          w.exercises
              .filter(ex => ex.type === "resistance")
              .reduce((sum, ex) => sum + ((ex.weight || 0) * (ex.reps || 0) * (ex.sets || 1)), 0)
      );

      // Clear previous canvases if needed
      const ctx1 = document.getElementById("canvas").getContext("2d");
      const ctx2 = document.getElementById("canvas2").getContext("2d");
      const ctx3 = document.getElementById("canvas3").getContext("2d");
      const ctx4 = document.getElementById("canvas4").getContext("2d");

      new Chart(ctx1, {
          type: "line",
          data: {
              labels: labels,
              datasets: [{
                  label: "Duration (min)",
                  data: durationData,
                  backgroundColor: "rgba(75, 192, 192, 0.2)",
                  borderColor: "rgba(75, 192, 192, 1)",
                  borderWidth: 2,
                  fill: true
              }]
          },
          options: { responsive: true }
      });

      new Chart(ctx2, {
          type: "pie",
          data: {
              labels: labels,
              datasets: [{
                  data: durationData,
                  backgroundColor: ["#4CAF50","#2196F3","#FF9800","#9C27B0","#F44336","#00BCD4","#FFEB3B"]
              }]
          },
          options: { responsive: true }
      });

      new Chart(ctx3, {
          type: "bar",
          data: {
              labels: labels,
              datasets: [{
                  label: "Weight Lifted (kg)",
                  data: weightData,
                  backgroundColor: "#4CAF50"
              }]
          },
          options: { responsive: true }
      });

      new Chart(ctx4, {
          type: "doughnut",
          data: {
              labels: labels,
              datasets: [{
                  data: weightData,
                  backgroundColor: ["#4CAF50","#2196F3","#FF9800","#9C27B0","#F44336","#00BCD4","#FFEB3B"]
              }]
          },
          options: { responsive: true }
      });

  } catch (err) {
      console.error("Error loading stats:", err);
  }
}

// Listen for updates from Home page
window.addEventListener("storage", (e) => {
  if (e.key === "workoutUpdated") {
      renderStats();
  }
});

// Initial render
document.addEventListener("DOMContentLoaded", renderStats);

// Expose globally for index.js to call
window.renderStats = renderStats;
