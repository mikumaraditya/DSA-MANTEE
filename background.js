// background.js - Generic proxy for Groq API calls to bypass CORS

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "groqFetch") {
    const { apiKey, body } = request;

    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify(body)
    })
    .then(async (response) => {
      if (!response.ok) {
        try {
          const errData = await response.json();
          throw new Error(errData?.error?.message || response.statusText);
        } catch (e) {
          throw new Error(e.message || response.statusText);
        }
      }
      return response.json();
    })
    .then((data) => {
      sendResponse({ success: true, data });
    })
    .catch((error) => {
      sendResponse({ success: false, error: error.message });
    });

    return true; // Keeps the message-passing channel open for async response
  }
});
