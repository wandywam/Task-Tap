const taskBtn = document.getElementById("taskBtn");
const eventBtn = document.getElementById("eventBtn");
const eventFields = document.getElementById("eventFields");
const createBtn = document.getElementById("createBtn");
const entryForm = document.getElementById("entryForm");
const statusMessage = document.getElementById("statusMessage");

let currentMode = "task";

// When Task Button toggle clicked
taskBtn.addEventListener("click", () => {
    currentMode = "task";
    taskBtn.classList.add("active");
    eventBtn.classList.remove("active");
    eventFields.classList.add("hidden");
    createBtn.textContent = "Create Task";
    statusMessage.textContent = "";
});

// When Event Button toggle clicked
eventBtn.addEventListener("click", () => {
    currentMode = "event";
    eventBtn.classList.add("active");
    taskBtn.classList.remove("active");
    eventFields.classList.remove("hidden")
    createBtn.textContent = "Create Event";
    statusMessage.textContent = "";
});

// When either Task or Event is SUBMITTED
entryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = {
        type: currentMode,
        title: document.getElementById("titleInput").value,
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
});