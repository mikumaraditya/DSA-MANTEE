# 🧠 DSA Mentor

AI-powered progressive hints and pseudocode generator for LeetCode problems. **DSA Mentor** is a Chrome Extension designed to help you *think* like a problem solver rather than just copy-pasting solutions. It leverages the high-speed **Groq API** (running `openai/gpt-oss-120b`) to provide structured guidance directly on the LeetCode interface.

---

## 🚀 Key Features

* **Context-Aware Extraction**: Automatically detects the problem title, description, and difficulty level on LeetCode's active tab.
* **Upfront Popular Solution**: Displays the most optimal and widely-used approach (with Time/Space complexity badges and a summary) right away. Features a collapsible panel to toggle visibility.
* **Math Typesetting (KaTeX)**: Renders all mathematical notations (like complexity metrics \(O(N)\), input sizes \(N \le 10^5\), and formulas) beautifully using a locally packaged KaTeX renderer (MV3 compliant).
* **Themed Step-by-Step Hinting**: Delivers exactly 3 incremental steps, color-coded for readability:
  * 🔵 **Step 1: Understand the Operation** (Indigo theme): Clarifies the core strategy, initial state setups, and key observation constraints.
  * 🟣 **Step 2: Determine the Maximum Gap** (Purple theme): Explains the mechanism, traversal/iteration details, and state transitions.
  * 🟢 **Step 3: Calculate the Formula** (Emerald theme): Explains the termination checks, final result construction, and edge cases.
* **Polished Pseudocode styling**: Generates clean, language-agnostic logic blocks:
  * Starts with `Algorithm FunctionName(params):` (PascalCase function names, snake_case parameters).
  * Uses `//` inline comments styled with a custom green color contrast for readability.
  * No markdown headers or uppercase keywords inside code blocks.
  * Put complexity information as comments directly inside the function body.
* **Copy & Reset Utilities**: Features a one-click clipboard copy button (with active success state feedback) and a session reset button to start fresh.
* **Secure API Key Management**: Saves your Groq API key locally using `chrome.storage.sync` so that your credentials remain secure.
* **Premium Glassmorphic UI**: A floating dark overlay designed with transparent blur backdrops, pulse-loading skeletons, entry animations, and matching difficulty styling.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (glassmorphic backdrops, pulse animation keyframes), JavaScript (ES6+)
* **Libraries**: KaTeX 0.16.9 (Math rendering engine + auto-render extension packaged locally)
* **Extension APIs**: Chrome Extension Manifest V3 (Content Scripts, Storage, Scripting, Background Worker Messaging to bypass LeetCode CSP)
* **LLM Core**: Groq Cloud API (`openai/gpt-oss-120b`)

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mikumaraditya/DSA-MANTEE.git
cd DSA-MANTEE
```

### 2. Load the Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click on the **Load unpacked** button in the top-left.
4. Select the directory containing the cloned repository (the folder containing `manifest.json`).

### 3. Configure your API Key
1. Click the **Extensions puzzle piece icon** in Chrome's top-right toolbar.
2. Select **DSA Mentor ⚙️**.
3. Paste your Groq API Key (get one for free from the [Groq Console](https://console.groq.com/keys)).
4. Click **Save API Key**.

---

## 💡 How to Use

1. Navigate to any problem on [LeetCode](https://leetcode.com/problems/).
2. You will see a floating **🧠 Ask DSA Mentor** button at the bottom-right of the screen.
3. Click the button to open the DSA Mentor interface.
4. Click **Get Next Hint** to receive progressive step-by-step conceptual hints.
5. Click **Reveal Pseudocode** to see a clean, color-contrasted logic implementation of the optimal solution.

---

## 📁 Repository Structure

```
├── Screenshots/          # Extension screenshots and UI demonstrations
├── katex/                # Locally packaged KaTeX CSS, JS, and auto-render files
├── content.js            # Main content script that interacts with LeetCode pages and Groq API
├── manifest.json         # Extension configuration (Manifest V3)
├── popup.html            # Settings popup HTML
├── popup.js              # Settings popup logic to save API Key
├── style.css             # Floating UI styles and transition animations
├── LICENSE               # MIT License
└── README.md             # Project documentation (this file)
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
