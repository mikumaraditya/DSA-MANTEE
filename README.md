# 🧠 DSA Mentor

AI-powered progressive hints and pseudocode generator for LeetCode problems. **DSA Mentor** is a Chrome Extension designed to help you *think* like a problem solver rather than just copy-pasting solutions. It leverages the high-speed **Groq API** (running `openai/gpt-oss-120b`) to provide structured guidance directly on the LeetCode interface.

---

## 🚀 Key Features

* **Context-Aware Extraction**: Automatically detects the problem title, description, and difficulty level on LeetCode's active tab.
* **Upfront Popular Solution**: Displays the most optimal and widely-used approach (with Time/Space complexity badges and a summary) right away. Features a collapsible panel to toggle visibility.
* **Progressive Hinting System**:
  * **Hint 1**: Clarifies the core idea of the popular approach, initial state setups, and constraint limits.
  * **Hint 2**: Guides you towards the traversal/iteration logic and state transitions.
  * **Hint 3**: Details critical edge cases, termination checks, and final calculations.
* **Explainable Pseudocode**: Generates highly readable, structured, and language-agnostic logic blocks that:
  * Provide a high-level summary at the top.
  * Include detailed inline comments (`#`) explaining key steps.
  * Use descriptive, self-documenting naming conventions (no cryptic single-letter variables).
* **JetBrains Mono Typography**: Renders the pseudocode in a beautiful monospace code font with polished spacing and line heights.
* **Reset & Copy Utilities**: Features a one-click clipboard copy button (with active success state feedback) and a session reset button to start fresh.
* **Secure API Key Management**: Saves your Groq API key locally using `chrome.storage.sync` so that your credentials remain secure.
* **Premium Glassmorphic UI**: A floating dark overlay designed with transparent blur backdrops, pulse-loading skeletons, entry animations, and matching difficulty styling.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (glassmorphic backdrops, pulse animation keyframes), JavaScript (ES6+)
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
4. Click **Get Next Hint** to receive progressive hints step-by-step.
5. Once you've viewed the hints, click **Reveal Pseudocode** to see a clean, step-by-step logic block to guide your coding.

---

## 📁 Repository Structure

```
├── Screenshots/          # Extension screenshots and UI demonstrations
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

This project is licensed under the MIT License - see the [LICENSE](file:///C:/Users/91993/Documents/antigravity/fearless-hertz/LICENSE) file for details.
