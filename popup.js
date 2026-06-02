const taskBtn = document.getElementById("taskBtn");
const eventBtn = document.getElementById("eventBtn");
const eventFields = document.getElementById("eventFields");
const createBtn = document.getElementById("createBtn");
const entryForm = document.getElementById("entryForm");
const statusMessage = document.getElementById("statusMessage");

const signInBtn = document.getElementById("signInBtn");
const authStatus = document.getElementById("authStatus");

// Autofill today's date
const today = new Date().toISOString().split("T")[0];
document.getElementById("dateInput").value = today

// Autofill time
const now = new Date();
now.setMinutes(now.getMinutes());
const defaultTime = now.toTimeString().slice(0, 5);
document.getElementById("timeInput").value = defaultTime;

let currentMode = "task";

function switchToTask() {
    currentMode = "task";
    taskBtn.classList.add("active");
    eventBtn.classList.remove("active");
    eventFields.classList.add("hidden");
    createBtn.textContent = "Create Task";
    statusMessage.textContent = "";

    chrome.local.storage.set({mode: "task"});
}

function switchToEvent() {
    currentMode = "event";
    eventBtn.classList.add("active");
    taskBtn.classList.remove("active");
    eventFields.classList.remove("hidden")
    createBtn.textContent = "Create Event";
    statusMessage.textContent = "";

    chrome.local.storage.set({mode: "event"});
}

signInBtn.addEventListener("click", () => {
    authStatus.textContent = "Sign in coming soon...";
})

// When Task Button toggle clicked
taskBtn.addEventListener("click", switchToTask);

// When Event Button toggle clicked
eventBtn.addEventListener("click", switchToEvent);

// Handle toggle mode
chrome.storage.local.get(["mode"], (result) => {
    if (result.mode === "event") {
        switchToEvent();
    } else {
        switchToTask();
    }
});

// When either Task or Event is SUBMITTED
entryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.getElementById("titleInput").value.trim();
    if (!title) {
        statusMessage.textContent = "Please enter a valid title.";
        return;
    }

    // Create Task/Event object
    const data = {
        type: currentMode,
        title: title,
        date: document.getElementById("dateInput").value,
        time: document.getElementById("timeInput").value,
        notes: document.getElementById("notesInput").value,
    };
    if (currentMode === "event") {
        data.duration = document.getElementById("durationInput").value;
        data.location = document.getElementById("locationInput").value;
    }

    console.log(data);
    statusMessage.textContent = `${currentMode === "task" ? "Task" : "Event"} data logged.`;

    document.getElementById("titleInput").value = "";
    document.getElementById("notesInput").value = "";

    if (currentMode === "event") {
        document.getElementById("locationInput").value = "";
    }
});