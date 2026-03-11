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
              content: `You are an expert Data Structures and Algorithms mentor.

Your job is to help the student THINK like a problem solver.

Rules:
• Never give the full solution.
• Never provide code.
• Each hint should unlock the next thinking step.
• Keep hints short, practical and insightful.
• Focus on patterns used in coding interviews.

Hint structure:
Hint 1 → Help the student understand what the problem is asking.
Hint 2 → Guide them toward the correct algorithmic pattern (two pointers, hashmap, stack, sliding window, etc).
Hint 3 → Reveal the core trick or observation required to solve the problem.

Hints should trigger an "Aha!" moment.

Avoid generic hints like "try using a data structure".
Explain WHY that structure helps.`,
            },
            {
              role: "user",
              content: `Problem Title: ${problemTitle}

Problem Description:
${description}

Hints already given:
${previousHints}

Generate Hint #${hintLevel}.

Requirements:
• Maximum 2-3 sentences
• Clear and specific
• Focus on reasoning, not theory
• Do not reveal full solution
• Do not provide code

Goal:
Help the student move one step closer to discovering the algorithm themselves.`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      return `❌ API Error: ${errorData?.error?.message || response.statusText}`;
    }

    const data = await response.json();
    return (
      data?.choices?.[0]?.message?.content || "I'm stuck, try asking again!"
    );
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
              content: `
You are an expert Data Structures and Algorithms mentor.

Your task is to convert the problem solution into CLEAR algorithmic pseudocode.

Rules:
• Do NOT provide programming language code.
• Use plain English steps.
• Each step must represent an actual logical operation.
• The student should be able to convert this directly into code.
• Avoid vague instructions like "process the array".
• Be specific about what needs to be checked or stored.

Structure:
1. Understand the input
2. Initialize required variables or data structures
3. Describe the main algorithm loop or logic
4. Explain how results are updated
5. Return the final result

Keep the pseudocode concise but logically complete.
`,
            },
            {
              role: "user",
              content: `
Problem Title: ${problemTitle}

Problem Description:
${description}

Generate a step-by-step pseudocode plan to solve this problem.

Requirements:
• Maximum 6–8 steps
• Each step on a new line
• Each step must describe a logical action
• Do NOT use programming syntax
• Do NOT use semicolons or brackets

Format example:

Step 1: Read the input array
Step 2: Create a variable to store the result
Step 3: Loop through each element
Step 4: Check the required condition
Step 5: Update the result if condition matches
Step 6: Return the final result

The output must start with:

Step-by-Step Logic
`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      return `❌ API Error: ${errorData?.error?.message || response.statusText}`;
    }

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

    const formattedPseudo = pseudo.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

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
