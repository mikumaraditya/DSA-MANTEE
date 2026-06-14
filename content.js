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

// Check if the current page is a single problem page
function isProblemPage() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  return pathParts.length >= 2 && pathParts[0] === 'problems';
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
  if (!isProblemPage()) {
    console.log("Not on a LeetCode problem page, skipping Mentor button creation.");
    return;
  }

  let titleElement =
    document.querySelector('.text-title-large') ||
    document.querySelector('[data-cy="question-title"]') ||
    document.querySelector('[data-testid="question-title"]') ||
    document.querySelector("h1") ||
    document.querySelector("[class*='title']");

  if (!titleElement) {
    console.log("Waiting for title element...");
    setTimeout(waitForTitle, 800);
    return;
  }

  let rawTitle = (titleElement.innerText || titleElement.textContent || "").trim();
  if (!rawTitle) {
    console.log("Title element found but text is empty, waiting...");
    setTimeout(waitForTitle, 800);
    return;
  }

  // Clean title: "1. Two Sum" -> "Two Sum"
  let cleanTitle = rawTitle.replace(/^\d+\.\s*/, "").trim();

  let difficultyElement =
    document.querySelector('.text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard') ||
    document.querySelector('[class*="difficulty"]');

  let difficulty = difficultyElement ? difficultyElement.innerText.trim() : "Unknown";

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
    document.querySelector('[data-track-load="description_content"]') ||
    document.querySelector(".elfjS") ||
    document.querySelector("[data-testid='description']") ||
    document.querySelector(".content__u3I0") ||
    document.querySelector("div[class*='description']");

  return descElement
    ? descElement.innerText || descElement.textContent
    : "Description not found.";
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are an expert DSA mentor. You will deliver exactly 3 hints one at a time across 3 separate requests.

${approachContext}

FORMAT — match this structure exactly for every hint:

**Step [N]: [Step Title]**
[2-3 sentences explaining this step's concept. Be specific to this problem's variables, constraints, and examples. Explain the WHY, not just the WHAT. End by naturally leading into what the next step will cover — but do not reveal it.]

STEP RESPONSIBILITIES:
- Hint 1 / Step 1 → "Understand the Operation": What does a single operation actually do? How does it affect x and num simultaneously? What is the student's first key observation?
- Hint 2 / Step 2 → "Determine the Maximum Gap": How does repeating the operation t times affect the gap between x and num? What is the maximum possible difference after all operations?
- Hint 3 / Step 3 → "Calculate the Formula": How do you combine num and the maximum gap into a final answer? What does the formula look like and why does it work?

RULES:
- Output only the single step for the current hint number — never reveal future steps.
- Bold the step title: **Step N: Title**.
- Use plain English — no code, no pseudocode, no programming syntax.
- Reference specific variables, constraint values, or example inputs from THIS problem (e.g. "each operation", "t steps", "the gap closes by 2 per operation").
- No Socratic questions. No "→" lines. No filler phrases like "think about" or "consider using".
- No introductory or closing text — output only the step block, nothing else.

CORRECTNESS RULE (mandatory before writing):
Trace Example 1 from the problem. Confirm your explanation leads to the correct answer.
If it does not — fix your reasoning first. Never output an explanation that produces the wrong answer.`,
        },
        {
          role: "user",
          content: `Problem Title: ${problemTitle}

Problem Description:
${description}

Deliver Step ${hintLevel} only. Do not reveal Step ${hintLevel + 1} or beyond.`,
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
            let content = response.data?.choices?.[0]?.message?.content || "";
            content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            resolve(content || "I'm stuck, try asking again!");
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
  console.log("=== SCRAPED DESCRIPTION ===");
  console.log(description.slice(0, 300)); // First 300 chars

  // Format popular solution info if available
  let approachContext = "";
  if (currentPopularSolution && !currentPopularSolution.error) {
    approachContext = `Approach: ${currentPopularSolution.approach}
Overview: ${currentPopularSolution.summary}`;
  }

  const requestBody = {
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: `You are an expert DSA mentor. Generate pseudocode for the optimal solution to the given problem:
Title: ${problemTitle}
Description:
${description}

${approachContext}

STYLE — match this format exactly:

Algorithm FunctionName(param1, param2):
  // explain what the algorithm does and why this approach is optimal
  // mention time and space complexity here
  variable_name = ...    // explain why this variable exists
  for currentItem in collection:
    // explain what this loop is doing and why
    if condition:
      // explain the reasoning behind this check
      variable_name = updated_value    // explain the update
  return result

RULES:
- Start with "Algorithm FunctionName(params):" — PascalCase for function name, snake_case for all variables and params.
- Use // for all comments — inline after code or on their own line above a block.
- No # comments. No markdown headers. No "# Overview" section. No complexity badges.
- Put the overview and complexity as // comments at the top of the function body, not outside it.
- Use plain English for library calls: append(list, value), get(map, key), contains(set, val), length(list).
- Use = for assignment, == for comparison, != for not equal.
- Indent with 2 spaces per nesting level.
- No single-letter variable names. Use snake_case: left_pointer, current_sum, max_length.
- No language-specific syntax: no {}, no ;, no type declarations, no .method() calls.
- No introductory or closing text — output only the pseudocode block, nothing else.

CORRECTNESS RULE (mandatory before writing):
Trace Example 1 from the problem step by step. Confirm your output matches expected.
If it does not — fix your approach first. Never output logic that fails Example 1.`,
      },
      {
        role: "user",
        content: `Provide a clean, step-by-step pseudocode structure for the complete optimal solution.
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
            let content = response.data?.choices?.[0]?.message?.content || "";
            content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            resolve(content || "Could not generate logic.");
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
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: `You are an expert DSA mentor.
Identify the single most popular, optimal, and widely accepted approach to solve the following LeetCode problem:
Title: ${problemTitle}
Description:
${description}

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
        content: `Identify the popular approach for this problem and return it in the specified JSON format.`
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
            let rawContent = response.data?.choices?.[0]?.message?.content || "";
            rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            
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

    const cleanPseudo = pseudo
      .replace(/^\s*```[a-zA-Z]*\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const lines = cleanPseudo.split("\n");
    const highlightedLines = lines.map((line) => {
      const commentIndex = line.indexOf("//");
      if (commentIndex !== -1) {
        const codePart = line.substring(0, commentIndex);
        const commentPart = line.substring(commentIndex);
        const safeCode = escapeHtml(codePart).replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        const safeComment = escapeHtml(commentPart);
        return `${safeCode}<span class="pseudo-comment">${safeComment}</span>`;
      }
      return escapeHtml(line).replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    });
    const formattedPseudo = highlightedLines.join("\n");

    // Remove any existing pseudocode container first
    const existingPseudo = hintContainer.querySelector(".pseudo-container");
    if (existingPseudo) existingPseudo.remove();

    const pseudoContainer = document.createElement("div");
    pseudoContainer.className = "pseudo-container";
    pseudoContainer.innerHTML = `
      <div class="hint">
        <b>Step-by-Step Pseudocode</b>
        <button class="copy-pseudo-btn">Copy</button>
        <div style="font-size: 12px; color: #cbd5e1; margin: 6px 0 8px;">Clear, language-agnostic logic for studying and implementation.</div>
        <pre class="pseudo-block">${formattedPseudo}</pre>
      </div>
    `;

    hintContainer.appendChild(pseudoContainer);

    if (typeof renderMathInElement !== "undefined") {
      try {
        renderMathInElement(pseudoContainer, {
          delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ]
        });
      } catch (err) {
        console.error("KaTeX rendering failed:", err);
      }
    }

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
      .map((hintText, index) => {
        const hintNum = index + 1;
        let cleanHint = hintText.trim();
        
        let titleText = `Hint ${hintNum}`;
        let bodyText = cleanHint;
        
        // Match step pattern: e.g., "**Step 1: Understand the Operation**" or "Step 1: Understand the Operation"
        const stepMatch = cleanHint.match(/^(?:\*\*)?Step\s*\d+\s*:\s*([^\n\r*]+)(?:\*\*)?/i);
        if (stepMatch) {
          titleText = `Step ${hintNum}: ${stepMatch[1].trim()}`;
          bodyText = cleanHint.substring(stepMatch[0].length).trim();
        }
        
        const safeBody = escapeHtml(bodyText).replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        
        return `
          <div class="hint hint-${hintNum}">
            <b class="hint-title">${escapeHtml(titleText)}</b>
            <div class="hint-body">${safeBody}</div>
          </div>
        `;
      })
      .join("");

    if (typeof renderMathInElement !== "undefined") {
      try {
        renderMathInElement(hintContainer, {
          delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ]
        });
      } catch (err) {
        console.error("KaTeX rendering failed:", err);
      }
    }

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
