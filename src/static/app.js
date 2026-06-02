const HIDE_MESSAGE_DELAY = 5000;

function getElements() {
  return {
    activitiesList: document.getElementById("activities-list"),
    activitySelect: document.getElementById("activity"),
    signupForm: document.getElementById("signup-form"),
    messageDiv: document.getElementById("message"),
  };
}

function showMessage(text, isSuccess) {
  const messageDiv = document.getElementById("message");

  if (!messageDiv) {
    return;
  }

  messageDiv.textContent = text;
  messageDiv.className = isSuccess ? "success" : "error";
  messageDiv.classList.remove("hidden");

  setTimeout(() => {
    messageDiv.classList.add("hidden");
  }, HIDE_MESSAGE_DELAY);
}

export async function fetchActivities() {
  const { activitiesList, activitySelect } = getElements();

  if (!activitiesList || !activitySelect) {
    return;
  }

  try {
    const response = await fetch("/activities");
    const activities = await response.json();

    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participantsList = details.participants
        .map(
          (participant) => `
            <li class="participant-item">
              <span>${participant}</span>
              <button class="delete-btn" data-activity="${name}" data-email="${participant}" title="Unregister">
                ✕
              </button>
            </li>
          `
        )
        .join("");

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <strong>Participants (${details.participants.length}):</strong>
          <ul class="participants-list">
            ${participantsList}
          </ul>
        </div>
      `;

      activityCard.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", handleDeleteParticipant);
      });

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  } catch (error) {
    activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
    console.error("Error fetching activities:", error);
  }
}

export async function handleDeleteParticipant(event) {
  event.preventDefault();
  const btn = event.target;
  const activity = btn.dataset.activity;
  const email = btn.dataset.email;

  try {
    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (response.ok) {
      showMessage(result.message, true);
      await fetchActivities();
    } else {
      showMessage(result.detail || "An error occurred", false);
    }
  } catch (error) {
    showMessage("Failed to unregister. Please try again.", false);
    console.error("Error unregistering:", error);
  }
}

export async function handleSignup(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const activity = document.getElementById("activity").value;

  try {
    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    if (response.ok) {
      showMessage(result.message, true);
      const { signupForm } = getElements();
      signupForm?.reset();
      await fetchActivities();
    } else {
      showMessage(result.detail || "An error occurred", false);
    }
  } catch (error) {
    showMessage("Failed to sign up. Please try again.", false);
    console.error("Error signing up:", error);
  }
}

export function initializeApp() {
  const { signupForm } = getElements();
  signupForm?.addEventListener("submit", handleSignup);
  fetchActivities();
}

if (typeof window !== "undefined" && typeof process === "undefined") {
  initializeApp();
}
