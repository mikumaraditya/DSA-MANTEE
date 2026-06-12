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
  let titleElement =
    document.querySelector('[data-cy="question-title"]') ||
    document.querySelector('[data-testid="question-title"]') ||
    document.querySelector("h1") ||
    document.querySelector("[class*='title']");

  if (!titleElement) {
    setTimeout(waitForTitle, 800);
    return;
  }

  let rawTitle = titleElement.innerText || titleElement.textContent;
  let cleanTitle = rawTitle.split(". ")[1] || rawTitle;

  let difficultyElement = document.querySelector('[class*="difficulty"]');

  let difficulty = difficultyElement ? difficultyElement.innerText : "Unknown";

  if (!document.getElementById("dsa-mentor-btn")) {
    createMentorButton(cleanTitle, difficulty);
  }
}

waitForTitle();

// Create floating button
function createMentorButton(title, difficulty) {
  if (document.getElementById("dsa-mentor-btn")) return;

  const button = document.createElement("button");

  button.id = "dsa-mentor-btn";
  button.innerText = "🧠 Ask DSA Mentor";

  button.style.position = "fixed";
  button.style.bottom = "40px";
  button.style.right = "40px";
  button.style.background = "#4f46e5";
  button.style.color = "white";
  button.style.border = "none";
  button.style.padding = "12px 16px";
  button.style.borderRadius = "10px";
  button.style.fontWeight = "600";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 10px 25px rgba(0,0,0,0.35)";
  button.style.zIndex = "999999";
  button.style.fontSize = "14px";

  document.body.appendChild(button);

  button.addEventListener("click", () => {
    createHintBox(title, difficulty);
  });

  button.addEventListener("mouseenter", () => {
    button.style.background = "#4338ca";
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = "#4f46e5";
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

  return descElement
    ? descElement.innerText || descElement.textContent
    : "Description not found.";
}

// AI Hint Generator
async function getAIHint(problemTitle) {
  hintLevel++;
  if (hintLevel > 3) return "⚠️ Maximum hints reached. Try solving now!";

  const apiKey = await getApiKey();

  if (!apiKey) {
    return "❌ API key not configured. Click the extension icon to add your Groq API key.";
  }

  const description = getProblemDescription();
  const previousHints = hintHistory.join("\n");

  try {
    const requestBody = {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert Data Structures and Algorithms (DSA) mentor.
Your job is to guide the student to discover the solution on their own. Never provide code, syntax, or the final direct solution.

Core Rules:
1. Do not provide code blocks or snippets in any language.
2. Structure the progressive hints to build upon each other:
   - Hint 1: Help the student understand the core problem, highlight brute-force limits, and analyze constraints (e.g., how the size of the input limits the allowed time complexity).
   - Hint 2: Direct them toward the appropriate pattern (e.g., Two Pointers, HashMap, Stack, Sliding Window, DP) and explain WHY it fits.
   - Hint 3: Reveal the core logic transition, state update logic, or critical edge cases to watch out for.
3. End every hint with a Socratic question that prompts the student's next step.
4. Keep the response concise (2-4 sentences max).`,
        },
        {
          role: "user",
          content: `Problem Title: ${problemTitle}
Problem Description:
${description}

Previous Hints Shared:
${previousHints}

Generate Hint #${hintLevel} based on the rules. Ensure it directly targets the goal of Hint #${hintLevel} and ends with a guiding question.`,
        },
      ],
    };

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "groqFetch", apiKey, body: requestBody },
        (response) => {
          if (!response || !response.success) {
            console.error("API Error:", response?.error);
            resolve(`❌ API Error: ${response?.error || "Unknown error"}`);
          } else {
            resolve(
              response.data?.choices?.[0]?.message?.content || "I'm stuck, try asking again!"
            );
          }
        }
      );
    });
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
    const requestBody = {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert DSA mentor. Your task is to output highly structured, language-agnostic pseudocode.

Formatting Rules:
1. Write structured, indented pseudocode (using spaces for indentation).
2. Use uppercase keywords for control flow: FUNCTION, INITIALIZE, LOOP, IF, ELSE, WHILE, RETURN.
3. Do NOT use programming language syntax (like semicolons, curly braces, or specific language libraries).
4. Write steps in clear, plain English.
5. Bold variable names and key terms using markdown asterisks (**variable**).`,
        },
        {
          role: "user",
          content: `Problem Title: ${problemTitle}
Problem Description:
${description}

Provide a clean, step-by-step pseudocode structure for the optimal solution.
Start directly with the code block format. Do not add introductory or concluding conversational text.`,
        },
      ],
    };

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "groqFetch", apiKey, body: requestBody },
        (response) => {
          if (!response || !response.success) {
            console.error("API Error:", response?.error);
            resolve(`❌ API Error: ${response?.error || "Unknown error"}`);
          } else {
            resolve(
              response.data?.choices?.[0]?.message?.content || "Could not generate logic."
            );
          }
        }
      );
    });
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
    const cleanPseudo = pseudo.replace(/^```[a-zA-Z]*\n|```$/g, "").trim();
    const formattedPseudo = cleanPseudo.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    hintContainer.innerHTML += `
      <div class="hint">
        <b>Pseudocode</b>
        <div class="pseudo-block">${formattedPseudo}</div>
      </div>
    `;

    pseudoBtn.innerText = "✓ Pseudocode Generated";
  });

  nextBtn.addEventListener("click", async () => {
    nextBtn.innerText = "Generating hint...";
    nextBtn.disabled = true;

    const hint = await getAIHint(title);

    if (!hintHistory.includes(hint)) {
      hintHistory.push(hint);
    }

    hintContainer.innerHTML = hintHistory
      .map(
        (hint, index) =>
          `<div class="hint"><b>Hint ${index + 1}</b><br>${hint}</div>`,
      )
      .join("");

    nextBtn.disabled = false;
    nextBtn.innerText = "Get Next Hint";

    if (hintHistory.length >= 3) {
      nextBtn.disabled = true;
      nextBtn.innerText = "Hints Completed";
      pseudoBtn.style.display = "block";
    }
  });

  box.querySelector("#mentor-close").onclick = () => box.remove();
}
