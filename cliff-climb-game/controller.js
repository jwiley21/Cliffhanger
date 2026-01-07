const stepsInput = document.getElementById("stepsInput");
const playBtn = document.getElementById("playBtn");
const resetBtn = document.getElementById("resetBtn");
const openBtn = document.getElementById("openBtn");
const statusText = document.getElementById("statusText");
const errorText = document.getElementById("errorText");

let presentationWindow = null;
const targetOrigin =
  window.location.origin === "null" ? "*" : window.location.origin;

function setControlsEnabled(enabled) {
  playBtn.disabled = !enabled;
  stepsInput.disabled = !enabled;
}

function setStatus(text) {
  statusText.textContent = text;
}

function showError(message) {
  if (!message) {
    errorText.textContent = "";
    errorText.hidden = true;
    return;
  }

  errorText.textContent = message;
  errorText.hidden = false;
}

function getPresentationWindow() {
  if (presentationWindow && !presentationWindow.closed) {
    return presentationWindow;
  }

  showError("Open the presentation window first.");
  return null;
}

function openPresentation() {
  if (!presentationWindow || presentationWindow.closed) {
    presentationWindow = window.open(
      "presentation.html",
      "cliffhanger-presentation",
      "width=1280,height=720"
    );
  } else {
    presentationWindow.focus();
  }

  if (!presentationWindow) {
    showError("Popup blocked. Allow popups and try again.");
    return;
  }

  showError("");
  setStatus("Opened");
}

function parseSteps() {
  const rawValue = stepsInput.value.trim();
  if (!rawValue) {
    showError("Enter a non-negative integer.");
    return null;
  }

  const steps = Number(rawValue);
  if (!Number.isInteger(steps) || steps < 0) {
    showError("Enter a non-negative integer.");
    return null;
  }

  return steps;
}

function sendStart() {
  const steps = parseSteps();
  if (steps === null) {
    return;
  }

  const target = getPresentationWindow();
  if (!target) {
    return;
  }

  showError("");
  target.postMessage({ type: "START", steps }, targetOrigin);
  console.log("[Controller] START", steps);
  setStatus("Sent");
  setControlsEnabled(false);
  stepsInput.value = "";
}

function sendReset() {
  const target = getPresentationWindow();
  if (target) {
    target.postMessage({ type: "RESET" }, targetOrigin);
    console.log("[Controller] RESET");
    showError("");
  }

  setStatus("Reset");
  setControlsEnabled(true);
  stepsInput.value = "";
}

function handleMessage(event) {
  const data = event.data;
  if (!data || typeof data !== "object") {
    return;
  }

  if (presentationWindow && event.source !== presentationWindow) {
    return;
  }

  if (
    window.location.origin !== "null" &&
    event.origin !== window.location.origin
  ) {
    return;
  }

  if (data.type === "STATE") {
    if (data.state === "RUNNING") {
      setStatus("Running");
      setControlsEnabled(false);
    } else if (data.state === "READY") {
      setStatus("Ready");
      setControlsEnabled(true);
    } else if (data.state === "DONE") {
      setStatus("Done");
      setControlsEnabled(true);
    } else if (data.state === "BUSY") {
      setStatus("Busy");
    }
  }
}

openBtn.addEventListener("click", openPresentation);
playBtn.addEventListener("click", sendStart);
resetBtn.addEventListener("click", sendReset);
stepsInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendStart();
  }
});

window.addEventListener("message", handleMessage);

setStatus("Ready");
setControlsEnabled(true);
