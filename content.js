console.log("DSA Mentor is Active 🚀");

// Track page change
let lastUrl = location.href;

// Hint tracking
let hintLevel = 0;
let hintHistory = [];
let currentPopularSolution = null;

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
    currentPopularSolution = null;

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

  // Format popular solution info if available
  let approachContext = "";
  if (currentPopularSolution && !currentPopularSolution.error) {
    approachContext = `The student is implementing this specific popular approach:
Approach: ${currentPopularSolution.approach}
Time Complexity: ${currentPopularSolution.timeComplexity}
Space Complexity: ${currentPopularSolution.spaceComplexity}
Overview: ${currentPopularSolution.summary}`;
  }

  try {
    const requestBody = {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert Data Structures and Algorithms (DSA) mentor.
${approachContext}

Your job is to guide the student to discover and implement this specific approach step-by-step. Never provide code, syntax, or the final direct solution.

Hint Quality Guidelines:
1. Be specific to the problem's inputs and constraints. Do not give generic theoretical advice.
2. Analyze the input constraints (e.g., N <= 10^5) to show why this approach's time complexity is required.
3. Explain the "WHY": Explain why this specific pattern fits.
4. Walk through a small, concrete input example if helpful.

Progression Structure for this specific approach:
- Hint 1: Help the student understand the core idea of this approach, how to set up the initial state/variables/pointers, and constraints.
- Hint 2: Guide them towards the traversal/iteration logic (e.g. how the loop runs, how pointers move, or how the map is updated in each step).
- Hint 3: Reveal the final transition logic, state updates, edge cases to watch out for, or how the final result is determined.

Response Rules:
- Never write code blocks, code syntax, or code comments.
- End each hint with a Socratic question that prompts the student's next step of reasoning.
- Keep hints practical, concise (max 3-4 sentences), and focused on problem-solving intuition.`,
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

  // Format popular solution info if available
  let approachContext = "";
  if (currentPopularSolution && !currentPopularSolution.error) {
    approachContext = `Approach: ${currentPopularSolution.approach}
Overview: ${currentPopularSolution.summary}`;
  }

  const requestBody = {
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are an expert DSA mentor. Your task is to output highly structured, language-agnostic, and extremely easy-to-understand pseudocode.
${approachContext}

Formatting & Naming Rules:
1. At the very beginning of the pseudocode, write a short, 1-2 sentence high-level logic flow summary prefixed with '#'.
2. Write structured, indented pseudocode (using spaces for indentation).
3. Use uppercase keywords for control flow: FUNCTION, INITIALIZE, LOOP, IF, ELSE, WHILE, RETURN.
4. Do NOT use programming language syntax (like semicolons, curly braces, or specific language libraries).
5. Write steps in clear, plain English.
6. Add brief inline comments (prefixed with '#') to explain the purpose of variables, complex loop conditions, and key calculations.
7. Use highly descriptive, clean, and self-documenting naming conventions representing this specific algorithm. Do not use generic single-letter names (e.g., write 'leftPointer', 'rightPointer', 'currentSum', 'hasSeenValue', 'charLastSeenMap' instead of single letters like 'l', 'r', 's', 'val', 'm' except for simple loop indexes if required).
8. Bold variable names and key terms using markdown asterisks (**variable**).`,
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

  try {
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

// Fetch popular solution metadata
async function getPopularSolution(problemTitle) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return {
      error: "API key not configured. Click the extension icon to add your Groq API key."
    };
  }

  const description = getProblemDescription();

  const requestBody = {
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are an expert DSA mentor. Identify the single most popular, optimal, and widely accepted approach to solve this LeetCode problem.
You must respond strictly in JSON format. Do not write any explanations before or after the JSON. Do not wrap the JSON in markdown code blocks like \`\`\`json.
Response format must be exactly:
{
  "approach": "Approach Name (e.g. 'Two Pointers', 'HashMap Single-Pass')",
  "timeComplexity": "e.g. 'O(N)'",
  "spaceComplexity": "e.g. 'O(1)'",
  "summary": "1-2 sentence concise explanation of why this approach works and is optimal."
}`
      },
      {
        role: "user",
        content: `Problem Title: ${problemTitle}
Problem Description:
${description}`
      }
    ],
    temperature: 0.1
  };

  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "groqFetch", apiKey, body: requestBody },
        (response) => {
          if (!response || !response.success) {
            console.error("API Error:", response?.error);
            resolve({ error: `API Error: ${response?.error || "Unknown error"}` });
          } else {
            const rawContent = response.data?.choices?.[0]?.message?.content?.trim() || "{}";
            
            // Clean up if the model wrapped it in markdown code blocks
            let cleanJson = rawContent;
            if (cleanJson.startsWith("```")) {
              cleanJson = cleanJson.replace(/^```(?:json)?\n|```$/g, "").trim();
            }
            try {
              resolve(JSON.parse(cleanJson));
            } catch (jsonErr) {
              console.error("Failed to parse JSON:", cleanJson);
              resolve({ error: "Failed to parse popular solution response." });
            }
          }
        }
      );
    });
  } catch (error) {
    console.error("API Error:", error);
    return { error: "Error fetching popular solution approach." };
  }
}

async function loadPopularSolution(title, box) {
  const popularBody = box.querySelector("#popular-card-body");
  if (!popularBody) return;

  // If we already have it in state, render it immediately
  if (currentPopularSolution) {
    renderPopularSolution(currentPopularSolution, popularBody);
    return;
  }

  // Fetch from API
  const solution = await getPopularSolution(title);
  currentPopularSolution = solution;

  renderPopularSolution(solution, popularBody);
}

function renderPopularSolution(solution, popularBody) {
  if (!solution || solution.error) {
    popularBody.innerHTML = `<div style="color: #ef4444; font-size: 12px; font-weight: 500;">${solution?.error || "Failed to load approach details."}</div>`;
    return;
  }

  popularBody.innerHTML = `
    <div class="approach-name">${solution.approach}</div>
    <div class="complexity-container">
      <span class="badge badge-time">Time: ${solution.timeComplexity}</span>
      <span class="badge badge-space">Space: ${solution.spaceComplexity}</span>
    </div>
    <div class="approach-summary">${solution.summary}</div>
  `;
}

// Create popup
function createHintBox(title, difficulty) {
  if (document.getElementById("dsa-mentor-box")) return;

  const box = document.createElement("div");
  box.id = "dsa-mentor-box";

  const difficultyClass = difficulty.toLowerCase();

  box.innerHTML = `
    <div id="dsa-mentor-header">
      <span>🧠 DSA Mentor 2.0</span>
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

    <!-- Popular Approach Card -->
    <div id="mentor-popular-card" class="mentor-card">
      <div class="card-header">
        <span class="card-title">💡 Popular Approach</span>
        <span id="card-toggle-btn" class="card-toggle-btn">[Hide]</span>
      </div>
      <div id="popular-card-body" class="popular-card-body">
        <div class="skeleton skeleton-text" style="width: 90%;"></div>
        <div class="skeleton skeleton-text" style="width: 75%;"></div>
        <div class="skeleton skeleton-text" style="width: 55%;"></div>
      </div>
    </div>

    <div id="hint-container"></div>

    <div class="mentor-actions">
      <button id="next-hint-btn">Get Next Hint</button>
      <button id="reset-mentor-btn" title="Reset progress and start over">🔄 Reset</button>
    </div>
    
    <button id="pseudocode-btn">Reveal Pseudocode</button>
  `;

  document.body.appendChild(box);

  // Trigger popular solution fetch
  loadPopularSolution(title, box);

  const toggleBtn = box.querySelector("#card-toggle-btn");
  const popularBody = box.querySelector("#popular-card-body");
  toggleBtn.addEventListener("click", () => {
    if (popularBody.style.display === "none") {
      popularBody.style.display = "block";
      toggleBtn.innerText = "[Hide]";
    } else {
      popularBody.style.display = "none";
      toggleBtn.innerText = "[Show]";
    }
  });

  const hintContainer = box.querySelector("#hint-container");
  const nextBtn = box.querySelector("#next-hint-btn");
  const pseudoBtn = box.querySelector("#pseudocode-btn");
  const resetBtn = box.querySelector("#reset-mentor-btn");

  resetBtn.addEventListener("click", () => {
    hintLevel = 0;
    hintHistory = [];
    hintContainer.innerHTML = "";
    nextBtn.disabled = false;
    nextBtn.innerText = "Get Next Hint";
    pseudoBtn.style.display = "none";
    pseudoBtn.innerText = "Reveal Pseudocode";
    pseudoBtn.disabled = false;
  });

  pseudoBtn.addEventListener("click", async () => {
    pseudoBtn.innerText = "Generating...";
    pseudoBtn.disabled = true;

    const pseudo = await getPseudoCode(title);
    
    if (pseudo.startsWith("❌")) {
      hintContainer.innerHTML += `
        <div class="hint" style="border-color: rgba(239, 68, 68, 0.2);">
          <b style="color: #ef4444;">Error</b>
          <div>${pseudo}</div>
        </div>
      `;
      pseudoBtn.innerText = "Error Generating";
      pseudoBtn.disabled = false;
      return;
    }

    const cleanPseudo = pseudo.replace(/^```[a-zA-Z]*\n|```$/g, "").trim();
    const formattedPseudo = cleanPseudo.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    // Remove any existing pseudocode container first
    const existingPseudo = hintContainer.querySelector(".pseudo-container");
    if (existingPseudo) existingPseudo.remove();

    const pseudoContainer = document.createElement("div");
    pseudoContainer.className = "pseudo-container";
    pseudoContainer.innerHTML = `
      <div class="hint">
        <b>Pseudocode</b>
        <button class="copy-pseudo-btn">Copy</button>
        <pre class="pseudo-block">${formattedPseudo}</pre>
      </div>
    `;

    hintContainer.appendChild(pseudoContainer);
    box.scrollTop = box.scrollHeight;

    const copyBtn = pseudoContainer.querySelector(".copy-pseudo-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(cleanPseudo).then(() => {
        copyBtn.innerText = "✓ Copied";
        copyBtn.style.background = "#059669";
        copyBtn.style.borderColor = "#10b981";
        setTimeout(() => {
          copyBtn.innerText = "Copy";
          copyBtn.style.background = "rgba(30, 41, 59, 0.85)";
          copyBtn.style.borderColor = "rgba(255, 255, 255, 0.1)";
        }, 2000);
      }).catch(err => {
        console.error("Could not copy pseudocode: ", err);
        copyBtn.innerText = "Failed";
      });
    });

    pseudoBtn.innerText = "✓ Pseudocode Generated";
  });

  nextBtn.addEventListener("click", async () => {
    nextBtn.innerText = "Generating hint...";
    nextBtn.disabled = true;

    // Show loading skeleton inside hintContainer while fetching hint
    const skeletonDiv = document.createElement("div");
    skeletonDiv.className = "hint";
    skeletonDiv.innerHTML = `
      <b>Hint ${hintLevel + 1}</b>
      <div class="skeleton skeleton-text" style="width: 90%; margin-top: 6px;"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
    `;
    hintContainer.appendChild(skeletonDiv);
    box.scrollTop = box.scrollHeight;

    const hint = await getAIHint(title);
    
    // Remove the skeleton loader
    skeletonDiv.remove();

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
    box.scrollTop = box.scrollHeight;

    if (hintHistory.length >= 3) {
      nextBtn.disabled = true;
      nextBtn.innerText = "Hints Completed";
      pseudoBtn.style.display = "block";
      box.scrollTop = box.scrollHeight;
    }
  });

  box.querySelector("#mentor-close").onclick = () => box.remove();
}
