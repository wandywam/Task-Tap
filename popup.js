const taskBtn = document.getElementById("taskBtn");
const eventBtn = document.getElementById("eventBtn");
const eventFields = document.getElementById("eventFields");
const createBtn = document.getElementById("createBtn");
const entryForm = document.getElementById("entryForm");
const statusMessage = document.getElementById("statusMessage");

const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const authStatus = document.getElementById("authStatus");

// Autofill today's date
const today = new Date().toISOString().split("T")[0];
document.getElementById("dateInput").value = today

// Autofill time
const now = new Date();
now.setMinutes(now.getMinutes());
const defaultTime = now.toTimeString().slice(0, 5);
document.getElementById("timeInput").value = defaultTime;

// Config vars
let currentMode = "task";
let isSignedIn = false;

function switchToTask() {
    currentMode = "task";
    taskBtn.classList.add("active");
    eventBtn.classList.remove("active");
    eventFields.classList.add("hidden");
    createBtn.textContent = "Create Task";
    statusMessage.textContent = "";

    chrome.storage.local.set({mode: "task"});
}

function switchToEvent() {
    currentMode = "event";
    eventBtn.classList.add("active");
    taskBtn.classList.remove("active");
    eventFields.classList.remove("hidden")
    createBtn.textContent = "Create Event";
    statusMessage.textContent = "";

    chrome.storage.local.set({mode: "event"});
}

// Check if token stored and user signed in --> keep user signed in
chrome.storage.local.get(
    ["accessToken", "signedIn"],
    (result) => {
        if (result.signedIn && result.accessToken) {
            isSignedIn = true;

            authStatus.textContent = "Signed in";
            signInBtn.classList.add("hidden");
            signOutBtn.classList.remove("hidden");
        }
    }
);

// Sign in/out buttons
signInBtn.addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: true}, (token) => {
        if (chrome.runtime.lastError || !token) {
            authStatus.textContent = "Sign in failed";
            console.log(chrome.runtime.lastError);
            return;
        }
    
    isSignedIn = true;
    authStatus.textContent = "Signed in";
    signInBtn.classList.add("hidden");
    signOutBtn.classList.remove("hidden");

    console.log("Access token: ", token);

    // store token = user signed in
    chrome.storage.local.set({
        accessToken: token,
        signedIn: true
        });
    });
});
signOutBtn.addEventListener("click", () => {
    isSignedIn = false;

    // remove stored sign in token
    chrome.storage.local.remove([
        "accessToken",
        "signedIn"
    ]);

    authStatus.textContent = "Not signed in";
    signInBtn.classList.remove("hidden");
    signOutBtn.classList.add("hidden");
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

    if (!isSignedIn) {
        statusMessage.textContent = "Please sign in first.";
        return;
    }

    const title = document.getElementById("titleInput").value.trim();
    if (!title) {
        statusMessage.textContent = "Please enter a valid title.";
        return;
    }

    // create Task/Event object
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

    // clear input boxes
    document.getElementById("titleInput").value = "";
    document.getElementById("notesInput").value = "";

    if (currentMode === "event") {
        document.getElementById("locationInput").value = "";
    }
});