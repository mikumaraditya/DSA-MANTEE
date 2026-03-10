console.log("DSA Mentor is Active 🚀");

// Track page change
let lastUrl = location.href;

// Hint tracking
let hintLevel = 0;
let hintHistory = [];

// Helper function to get API key from Chrome storage
async function getApiKey() {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get("groqApiKey", (data) => {
        resolve(data?.groqApiKey || "");
      });
    } else {
      console.error("❌ Chrome storage API not available");
      resolve("");
    }
  });
}

// Detect page change (LeetCode SPA)
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;

    console.log("Problem changed");

    document.getElementById("dsa-mentor-btn")?.remove();
    document.getElementById("dsa-mentor-box")?.remove();

    hintLevel = 0;
    hintHistory = [];

    waitForTitle();
  }
}, 1000);

// Wait until title loads
function waitForTitle() {
  // Try multiple selectors for LeetCode title
  let titleElement = 
    document.querySelector(".text-title-large a") ||
    document.querySelector("h1") ||
    document.querySelector("[data-testid='question-title']");

  if (!titleElement) {
    setTimeout(waitForTitle, 500);
    return;
  }

  let rawTitle = titleElement.innerText || titleElement.textContent;
  let cleanTitle = rawTitle.split(". ")[1] || rawTitle;

  // Try multiple selectors for difficulty
  let difficultyElement = 
    document.querySelector('[class*="text-difficulty"]') ||
    document.querySelector('[class*="difficulty"]') ||
    document.querySelector("span[class*='Easy']") ||
    document.querySelector("span[class*='Medium']") ||
    document.querySelector("span[class*='Hard']");
    
  let difficulty = difficultyElement ? difficultyElement.innerText : "Unknown";

  createMentorButton(cleanTitle, difficulty);
}

waitForTitle();

// Inject styles
function injectStyles() {
  if (document.getElementById("dsa-mentor-styles")) return;

  const style = document.createElement("style");
  style.id = "dsa-mentor-styles";
  style.textContent = `
    #dsa-mentor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
    }

    #mentor-close {
      cursor: pointer;
      font-size: 18px;
      color: #9ca3af;
      transition: color 0.2s;
    }

    #mentor-close:hover {
      color: #fff;
    }

    .mentor-divider {
      border: none;
      border-top: 1px solid #374151;
      margin: 8px 0;
    }

    .mentor-problem {
      margin: 10px 0;
      font-size: 13px;
      word-wrap: break-word;
    }

    .mentor-difficulty {
      margin: 10px 0;
      font-size: 13px;
    }

    .mentor-difficulty span {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
    }

    .mentor-difficulty .easy {
      background: #10b981;
      color: white;
    }

    .mentor-difficulty .medium {
      background: #f59e0b;
      color: white;
    }

    .mentor-difficulty .hard {
      background: #ef4444;
      color: white;
    }

    #hint-container {
      margin: 12px 0;
      max-height: 250px;
      overflow-y: auto;
    }

    .hint {
      background: #1f2937;
      padding: 10px;
      border-left: 3px solid #4f46e5;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 13px;
      line-height: 1.5;
    }

    .hint b {
      color: #4f46e5;
    }

    .pseudo-block {
      background: #0f172a;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
      color: #d1d5db;
      margin: 6px 0;
    }

    #next-hint-btn, #pseudocode-btn {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: background 0.3s;
    }

    #next-hint-btn:hover, #pseudocode-btn:hover {
      background: #4338ca;
    }

    #next-hint-btn:disabled, #pseudocode-btn:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }

    #dsa-mentor-btn {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

// Create floating button
function createMentorButton(title, difficulty) {
  if (document.getElementById("dsa-mentor-btn")) return;

  injectStyles();

  const button = document.createElement("button");

  button.id = "dsa-mentor-btn";
  button.innerText = "🧠 Ask DSA Mentor";

  button.style.position = "fixed";
  button.style.bottom = "40px";
  button.style.right = "40px";
  button.style.padding = "12px 16px";
  button.style.borderRadius = "10px";
  button.style.background = "#4f46e5";
  button.style.color = "white";
  button.style.border = "none";
  button.style.fontWeight = "600";
  button.style.cursor = "pointer";
  button.style.zIndex = "999999";
  button.style.transition = "background 0.3s";

  button.addEventListener("mouseenter", () => {
    button.style.background = "#4338ca";
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = "#4f46e5";
  });

  document.body.appendChild(button);

  button.addEventListener("click", () => {
    createHintBox(title, difficulty);
  });
}

// Extract problem description
function getProblemDescription() {
  // Try multiple selectors for problem description
  const descElement = 
    document.querySelector(".elfjS") ||
    document.querySelector("[data-testid='description']") ||
    document.querySelector(".content__u3I0") ||
    document.querySelector("div[class*='description']");
    
  return descElement ? (descElement.innerText || descElement.textContent) : "Description not found.";
}

// AI Hint Generator
async function getAIHint(problemTitle) {
  hintLevel++;
  if (hintLevel > 5) return "⚠️ Maximum hints reached. Try solving now!";

  const apiKey = await getApiKey();
  
  if (!apiKey) {
    return "❌ API key not configured. Click the extension icon to add your Groq API key.";
  }

  const description = getProblemDescription();
  const previousHints = hintHistory.join("\n");

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a Socratic DSA Mentor for absolute beginners. 
          Your goal: Guide the student via questions and analogies. 
          Constraint: NEVER provide code. Use simple language (no jargon like 'O(n)' or 'hashmap' without explaining it as a 'memory list').`,
            },
            {
              role: "user",
              content: `Problem: ${problemTitle}
          Description: ${description}
          Hints already given: ${previousHints}

          Provide ONLY the text for Hint #${hintLevel} based on this 5-step progression:
          Hint 1: Explain the goal using a real-world analogy.
          Hint 2: Ask a guiding question about input data.
          Hint 3: Suggest manual pen and paper steps.
          Hint 4: Introduce a helpful idea or tool.
          Hint 5: Describe the key logical step needed.
          IMPORTANT: Return ONLY the hint text. No prefix.`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "I'm stuck, try asking again!";
  } catch (error) {
    console.error("API Error:", error);
    return "❌ Error fetching hint. Check your API key.";
  }
}

async function getPseudoCode(problemTitle) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    return "❌ API key not configured. Click the extension icon to add your Groq API key.";
  }

  const description = getProblemDescription();

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a DSA Mentor. Translate algorithms into 'Plain English Recipes'. Avoid all programming syntax.",
            },
            {
              role: "user",
              content: `Provide a 5-step 'Action Plan' for: ${problemTitle}
          Description: ${description}

          Rules:
          1. Use words like 'Look at', 'Store', 'Check', 'Repeat'.
          2. No semicolons or technical symbols.
          3. Format as numbered list.
          Start with: Step-by-Step Logic`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "Could not generate logic.";
  } catch (error) {
    console.error("API Error:", error);
    return "❌ Error generating pseudocode.";
  }
}

// Create popup
function createHintBox(title, difficulty) {
  if (document.getElementById("dsa-mentor-box")) return;

  const box = document.createElement("div");

  box.id = "dsa-mentor-box";

  box.style.position = "fixed";
  box.style.bottom = "100px";
  box.style.right = "40px";
  box.style.width = "360px";
  box.style.maxHeight = "500px";
  box.style.background = "#111827";
  box.style.color = "white";
  box.style.padding = "16px";
  box.style.borderRadius = "12px";
  box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
  box.style.zIndex = "999999";
  box.style.overflowY = "auto";
  box.style.fontFamily = "Arial, sans-serif";

  const difficultyClass = difficulty.toLowerCase();

  box.innerHTML = `
    <div id="dsa-mentor-header">
      <span>🧠 DSA Mentor</span>
      <span id="mentor-close">✕</span>
    </div>

    <hr class="mentor-divider">

    <div class="mentor-problem">
      <b>Problem:</b> ${title}
    </div>

    <div class="mentor-difficulty">
      <b>Difficulty:</b>
      <span class="${difficultyClass}">${difficulty}</span>
    </div>

    <div id="hint-container"></div>

    <button id="next-hint-btn">Get Next Hint</button>
    <button id="pseudocode-btn">Reveal Pseudocode</button>
  `;

  document.body.appendChild(box);

  const hintContainer = box.querySelector("#hint-container");
  const nextBtn = box.querySelector("#next-hint-btn");
  const pseudoBtn = box.querySelector("#pseudocode-btn");

  pseudoBtn.addEventListener("click", async () => {
    pseudoBtn.innerText = "Generating...";
    pseudoBtn.disabled = true;

    const pseudo = await getPseudoCode(title);

    hintContainer.innerHTML += `
      <div class="hint">
        <b>Pseudocode</b>
        <pre class="pseudo-block">${pseudo}</pre>
      </div>
    `;

    pseudoBtn.innerText = "✓ Pseudocode Generated";
  });

  nextBtn.addEventListener("click", async () => {
    nextBtn.innerText = "Generating hint...";
    nextBtn.disabled = true;

    const hint = await getAIHint(title);

    hintHistory.push(hint);

    hintContainer.innerHTML = hintHistory
      .map((h, i) => `<div class="hint"><b>Hint ${i + 1}</b><br>${h}</div>`)
      .join("");

    nextBtn.disabled = false;
    nextBtn.innerText = "Get Next Hint";

    if (hintHistory.length >= 5) {
      nextBtn.disabled = true;
      nextBtn.innerText = "Hints Completed";
      pseudoBtn.style.display = "block";
    }
  });

  box.querySelector("#mentor-close").onclick = () => box.remove();
}