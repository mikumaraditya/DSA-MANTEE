const apiKeyInput = document.getElementById("apiKey");
const saveBtn = document.getElementById("saveBtn");
const statusDiv = document.getElementById("status");
const toggleBtn = document.getElementById("toggleVisible");
const eyeOpenIcon = document.getElementById("eyeOpenIcon");
const eyeClosedIcon = document.getElementById("eyeClosedIcon");

// Toggle password visibility via SVG swap
toggleBtn.addEventListener("click", () => {
  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    eyeOpenIcon.style.display = "none";
    eyeClosedIcon.style.display = "block";
  } else {
    apiKeyInput.type = "password";
    eyeOpenIcon.style.display = "block";
    eyeClosedIcon.style.display = "none";
  }
});

// Save API Key to chrome storage
saveBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showStatus("Please enter API key", "error");
    return;
  }
  chrome.storage.sync.set({ groqApiKey: apiKey }, () => {
    showStatus("API Key Saved!", "success");
  });
});

// Load saved API key on startup
chrome.storage.sync.get("groqApiKey", (data) => {
  if (data.groqApiKey) {
    apiKeyInput.value = data.groqApiKey;
  }
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = type === "success" ? "status-success" : "status-error";
  
  // Clear status after 2.5 seconds
  setTimeout(() => {
    statusDiv.textContent = "";
    statusDiv.className = "";
  }, 2500);
}
