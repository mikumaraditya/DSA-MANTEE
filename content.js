console.log("DSA Mentor is Active 🚀");

// Track page change
let lastUrl = location.href;

// Hint tracking
let hintLevel = 0;
let hintHistory = [];

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
  let titleElement = document.querySelector(".text-title-large a");

  if (!titleElement) {
    setTimeout(waitForTitle, 500);
    return;
  }

  let rawTitle = titleElement.innerText;
  let cleanTitle = rawTitle.split(". ")[1] || rawTitle;

  let difficultyElement = document.querySelector('[class*="text-difficulty"]');
  let difficulty = difficultyElement ? difficultyElement.innerText : "Unknown";

  createMentorButton(cleanTitle, difficulty);
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
  button.style.padding = "12px 16px";
  button.style.borderRadius = "10px";
  button.style.background = "#4f46e5";
  button.style.color = "white";
  button.style.border = "none";
  button.style.fontWeight = "600";
  button.style.cursor = "pointer";
  button.style.zIndex = "999999";

  document.body.appendChild(button);

  button.addEventListener("click", () => {
    createHintBox(title, difficulty);
  });
}

// Extract problem description
function getProblemDescription() {
  const descElement = document.querySelector(".elfjS");
  return descElement ? descElement.innerText : "Description not found.";
}

// AI Hint Generator
async function getAIHint(problemTitle) {
  hintLevel++;
  if (hintLevel > 5) return "⚠️ Maximum hints reached. Try solving now!";

  const description = getProblemDescription();
  const previousHints = hintHistory.join("\n");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_API_KEY_HERE", // Ensure this is correct
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
            content: `
          Problem: ${problemTitle}
          Description: ${description}
          Hints already given: ${previousHints}

          Provide ONLY the text for Hint #${hintLevel} based on this 5-step progression:
          Hint 1: Explain the goal of the problem in simple terms using a real-world analogy (for example: searching in a list, matching pairs, organizing items).

          Hint 2: Ask a guiding question that helps the student understand what the input data looks like and what needs to be found.

          Hint 3: Suggest how someone might solve this manually with pen and paper step by step.

          Hint 4: Introduce a helpful idea or tool (for example: remembering previous values, comparing elements, using a counter, or scanning the list).

          Hint 5: Describe the key logical step needed to solve the problem (the main "if this happens, then do this" idea), without giving code.
          IMPORTANT: Return ONLY the hint text. Do not include "Hint ${hintLevel}:" prefix.`,
          },
        ],
      }),
    },
  );

  const data = await response.json();
  // Fixed: Ensure we return the content string directly
  return data?.choices?.[0]?.message?.content || "I'm stuck, try asking again!";
}
async function getPseudoCode(problemTitle) {
  const description = getProblemDescription();

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_API_KEY_HERE",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a DSA Mentor. Translate algorithms into 'Plain English Recipes'. Avoid all programming syntax like 'i++', 'arr[i]', or 'null'.",
          },
          {
            role: "user",
            content: `
          Provide a 5-step 'Action Plan' for: ${problemTitle}
          Description: ${description}

          Rules for beginners:
          1. Use words like 'Look at', 'Store', 'Check', and 'Repeat'.
          2. No semicolons or technical symbols.
          3. Format it as a numbered list.
          
          Start with the header Step-by-Step Logic.`,
          },
        ],
      }),
    },
  );

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "Could not generate logic.";
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
  box.style.maxHeight = "450px";
  box.style.background = "#111827";
  box.style.color = "white";
  box.style.padding = "16px";
  box.style.borderRadius = "12px";
  box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
  box.style.zIndex = "999999";
  box.style.overflowY = "auto";

  box.innerHTML = `
<div id="dsa-mentor-header">
<span>DSA Mentor</span>
<span id="mentor-close">✕</span>
</div>

<hr class="mentor-divider">

<div class="mentor-problem">
<b>Problem:</b> ${title}
</div>

<div class="mentor-difficulty">
<b>Difficulty:</b>
<span class="${difficulty.toLowerCase()}">${difficulty}</span>
</div>

<div id="hint-container"></div>

<button id="next-hint-btn">Get Next Hint</button>

<button id="pseudocode-btn">
Reveal Pseudocode
</button>
`;

  document.body.appendChild(box);

  const hintContainer = box.querySelector("#hint-container");
  const nextBtn = box.querySelector("#next-hint-btn");

  const pseudoBtn = box.querySelector("#pseudocode-btn");

  pseudoBtn.addEventListener("click", async () => {
    pseudoBtn.innerText = "Generating...";

    const pseudo = await getPseudoCode(title);

    hintContainer.innerHTML += `
<div class="hint">
<b>Pseudocode</b>
<pre class="pseudo-block">${pseudo}</pre>
</div>
`;

    pseudoBtn.disabled = true;
    pseudoBtn.innerText = "✓ Pseudocode Generated";
  });

  nextBtn.addEventListener("click", async () => {
    nextBtn.innerText = "Generating hint...";

    const hint = await getAIHint(title);

    hintHistory.push(hint);

    if (hintHistory.length === 5) {
      document.getElementById("pseudocode-btn").style.display = "block";
    }

    hintContainer.innerHTML = hintHistory
      .map((h, i) => `<div class="hint"><b>Hint ${i + 1}</b><br>${h}</div>`)
      .join("");

    nextBtn.innerText = "Get Next Hint";

    if (hintHistory.length >= 5) {
      nextBtn.disabled = true;
      nextBtn.innerText = "Hints Completed";
    }
  });

  box.querySelector("#mentor-close").onclick = () => box.remove();
}
