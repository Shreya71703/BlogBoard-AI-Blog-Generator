# BlogBoard - AI Blog Generator

BlogBoard is an end-to-end, fully automated technical blogging platform. It autonomously schedules, writes, formats, and publishes deep-dive technical articles on Machine Learning and Artificial Intelligence directly to a fast, static frontend website.

It is built with a sophisticated **Multi-Agent Editorial Graph** using **LangGraph** to automate high-quality content production, and **Groq** for blazing-fast LLM inference.

## 🌟 Key Features

* **Multi-Agent Editorial Loop**: Automates a professional editorial pipeline:
  1. **Outline Architect**: Creates a structured, modular outline.
  2. **Technical Writer**: Drafts the initial code snippets and content.
  3. **Senior Editor (Reviewer)**: Critiques the technical depth, flow, and formatting of the draft.
  4. **Refiner**: Rewrites and polishes the draft by resolving all editorial criticisms.
* **Auto-Updating Manifest Database**: Whenever a post is generated, the backend automatically calculates reading times, extracts relevance tags, and updates a central `manifest.json`.
* **Dynamic Frontend Dashboard**: The static frontend dynamically fetches `manifest.json` to load posts. It features search-as-you-type and tag filtering without requiring a databases/servers setup.
* **Modern Dark-Mode Aesthetic**: Premium UI styled with HSL colors, background glow effects, glassmorphic navigation, and responsiveness.

---

## 🛠️ Tech Stack
* **Workflow Engine**: LangGraph
* **Inference**: Groq (Llama 3.1 8B Instant)
* **Frontend**: HTML5, Vanilla CSS, Vanilla Javascript (Marked.js for Markdown parsing)
* **Dependency & Env Management**: Pip, Dotenv

---

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Shreya71703/BlogBoard-AI-Blog-Generator.git
   cd BlogBoard-AI-Blog-Generator
   ```

2. Initialize virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   * **Windows**: `.venv\Scripts\activate`
   * **Linux/Mac**: `source .venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

### Configuration
Create a `.env` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### Running the Platform
1. Run the backend Multi-Agent pipeline:
   ```bash
   python backend/run.py
   ```
2. Start the local server to view the frontend:
   ```bash
   python -m http.server 8000 --directory frontend
   ```
3. Open `http://localhost:8000` in your web browser.

---

## 📝 Folder Structure
```text
BlogBoard/
├── backend/
│   ├── run.py             # CLI Entry Point
│   ├── graph.py           # LangGraph Workflow Nodes & Edges
│   ├── llm.py             # Groq Client Setup
│   └── requirements.txt   # Python Dependencies
├── frontend/
│   ├── index.html         # Main Web Dashboard
│   ├── styles.css         # UI & Glassmorphism Styling
│   ├── app.js             # Manifest Parsing, Search, and Filtering
│   └── posts/
│       ├── manifest.json  # Auto-generated database of all posts
│       └── *.md           # Generated blog articles
└── .gitignore
```

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
