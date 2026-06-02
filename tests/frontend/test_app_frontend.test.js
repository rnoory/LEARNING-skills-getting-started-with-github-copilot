import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchActivities, handleDeleteParticipant, initializeApp } from "../../src/static/app.js";

const mockActivities = {
  "Chess Club": {
    description: "Learn strategies and compete in chess tournaments",
    schedule: "Fridays, 3:30 PM - 5:00 PM",
    max_participants: 12,
    participants: ["michael@mergington.edu", "daniel@mergington.edu"],
  },
};

function setupDocument() {
  document.body.innerHTML = `
    <div id="activities-list"></div>
    <select id="activity">
      <option value="">-- Select an activity --</option>
    </select>
    <form id="signup-form">
      <input id="email" value="newstudent@mergington.edu" />
    </form>
    <div id="message" class="hidden"></div>
  `;
}

describe("frontend app.js", () => {
  beforeEach(() => {
    setupDocument();
    vi.restoreAllMocks();
  });

  it("fetchActivities populates the activity list and dropdown", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockActivities,
    });

    await fetchActivities();

    expect(fetch).toHaveBeenCalledWith("/activities");
    expect(document.querySelectorAll(".activity-card")).toHaveLength(1);
    expect(document.querySelector("option[value=\"Chess Club\"]")).toBeTruthy();
    expect(document.querySelector(".participants-list").textContent).toContain("michael@mergington.edu");
  });

  it("handleDeleteParticipant sends a DELETE request and shows a success message", async () => {
    const button = document.createElement("button");
    button.dataset.activity = "Chess Club";
    button.dataset.email = "michael@mergington.edu";

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Unregistered michael@mergington.edu from Chess Club" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivities,
      });

    vi.useFakeTimers();

    await handleDeleteParticipant({ preventDefault: () => {}, target: button });

    expect(fetch).toHaveBeenCalledWith(
      "/activities/Chess%20Club/signup?email=michael%40mergington.edu",
      {
        method: "DELETE",
      }
    );
    expect(document.getElementById("message").textContent).toBe("Unregistered michael@mergington.edu from Chess Club");

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it("initializeApp attaches the signup handler and fetches activities", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivities,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivities,
      });

    initializeApp();

    expect(fetch).toHaveBeenCalledWith("/activities");

    const activitySelect = document.getElementById("activity");
    activitySelect.value = "Chess Club";

    const form = document.getElementById("signup-form");
    const submitEvent = new Event("submit");
    form.dispatchEvent(submitEvent);

    expect(fetch).toHaveBeenCalledWith(
      "/activities/Chess%20Club/signup?email=newstudent%40mergington.edu",
      {
        method: "POST",
      }
    );
  });
});
