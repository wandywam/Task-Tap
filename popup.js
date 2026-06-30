const taskBtn = document.getElementById("taskBtn");
const eventBtn = document.getElementById("eventBtn");
const eventFields = document.getElementById("eventFields");
const createBtn = document.getElementById("createBtn");
const entryForm = document.getElementById("entryForm");
const statusMessage = document.getElementById("statusMessage");

const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const authStatus = document.getElementById("authStatus");
const taskListStatus = document.getElementById("taskListStatus");

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
let defaultTaskListId = null;

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

function getTaskLists(token) {
    // api endpoint
    fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const defaultTaskList = data.items[0]; //storing object containing id and title
        defaultTaskListId = defaultTaskList.id;
        taskListStatus.textContent = `Task List: ${defaultTaskList.title}`;
        console.log("Task List ID:", defaultTaskListId);
    })
    .catch(error => {
        console.log("Error getting task lists:", error);
    })
}

function createTask(token, taskListId, taskData) {
    fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ // convert js to json
                title: taskData.title,
                notes: taskData.time ? `${taskData.notes}\nDue time: ${taskData.time}` : taskData.notes,
                due: `${taskData.date}T${taskData.time || "00:00"}:00.000Z`
                
            })
        }
    )
    .then(response => response.json())
    .then(data => {
        console.log("Created task:", data);
        statusMessage.textContent = "Task created!"

        document.getElementById("titleInput").value = "";
        document.getElementById("notesInput").value = "";

        createBtn.disabled = false;
        createBtn.textContent = "Create Task";
    })
    .catch(error => {
        console.log("Error creating task:", error);
        statusMessage.textContent = "Failed to create task."

        createBtn.disabled = false;
        createBtn.textContent = "Create Task";
    });
}

function createEvent(token, eventData) {
    fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ //json to string form
            summary: eventData.title,
            location: eventData.location,
            description: eventData.notes,
        start: {
            dateTime: `${eventData.date}T${eventData.time}:00`,
            timeZone: "America/Los_Angeles"
        },
        end: {
            dateTime: getEndDateTime(eventData.date, eventData.time, eventData.duration),
            timeZone: "America/Los_Angeles"
        }
})
    })
    .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }
        
        return data;
    })
    .then(data => {
        console.log("Created event:", data);
        statusMessage.innerHTML = `Event created! <a href="${data.htmlLink}" target="_blank">See Event</a>`;

        document.getElementById("titleInput").value = "";
        document.getElementById("notesInput").value = "";
        document.getElementById("locationInput").value = "";

        createBtn.disabled = false;
        createBtn.textContent = "Create Event";
    })
    .catch(error => {
        console.log("Error creating event:", error);
        statusMessage.textContent = "Failed to create event."

        createBtn.disabled = false;
        createBtn.textContent = "Create Event";
    });
}

// helper func
function getEndDateTime(date, time, duration) {
    const start = new Date(`${date}T${time}:00`);
    start.setMinutes(start.getMinutes() + Number(duration));

    return start.toISOString();
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

            getTaskLists(result.accessToken);
        }
    }
);

// Sign in/out buttons
signInBtn.addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: true}, (token) => {
        if (chrome.runtime.lastError || !token) {
            authStatus.textContent = "Sign in failed. Please try again.";
            console.log("Auth error:", chrome.runtime.lastError);
            return;
        }
    
    isSignedIn = true;
    authStatus.textContent = "Signed in";
    signInBtn.classList.add("hidden");
    signOutBtn.classList.remove("hidden");

    getTaskLists(token);

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

    //cleanup
    authStatus.textContent = "Not signed in";
    signInBtn.classList.remove("hidden");
    signOutBtn.classList.add("hidden");
    taskListStatus.textContent = "";
    defaultTaskListId = null;
});

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

    if (currentMode === "event") {
        if (!data.date) {
            statusMessage.textContent = "Please choose a date";
            return;
        }

        if (!data.time) {
            statusMessage.textContent = "Please choose a time";
            return;
        }
    }

    createBtn.disabled = true;
    createBtn.textContent = "Creating...";
    statusMessage.textContent = "Creating...";

    if (currentMode === "task") {
        chrome.storage.local.get(["accessToken"], (result) => {
            createTask(result.accessToken, defaultTaskListId, data);
        });
    }
    else if (currentMode === "event") {
        if (!data.duration || Number(data.duration) <= 0) {
            statusMessage.textContent = "Please enter a valid duration.";
            createBtn.disabled = false;
            createBtn.textContent = "Create Event";
            return;
        }

        chrome.storage.local.get(["accessToken"], (result) => {
            createEvent(result.accessToken, data);
        });
    }

    console.log(data);

    // clear input boxes
    // document.getElementById("titleInput").value = "";
    // document.getElementById("notesInput").value = "";

});