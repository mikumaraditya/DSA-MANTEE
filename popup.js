document.getElementById("saveBtn").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  if (!apiKey) {
    document.getElementById("status").innerText = "❌ Please enter API key";
    return;
  }
  chrome.storage.sync.set({ groqApiKey: apiKey }, () => {
    document.getElementById("status").innerText = "✅ API Key Saved!";
  });
});

// Load saved API key
chrome.storage.sync.get("groqApiKey", (data) => {
  if (data.groqApiKey) {
    document.getElementById("apiKey").value = data.groqApiKey;
  }
});
