# BlogBoard - AI Blog Generator

BlogBoard is an end-to-end, fully automated blogging platform. It autonomously schedules, writes, formats, and publishes deep-dive technical articles on Machine Learning and Artificial Intelligence directly to a fast, static frontend website.

Powered by **LangGraph** for stateful workflow execution and **Groq** for blazing-fast LLM inference, it ensures that high-quality, zero-fluff, production-grade articles are generated and deployed automatically.

## Tech Stack
* **Workflow Engine**: LangGraph
* **Inference**: Groq (Llama 3.1 8B)
* **Frontend**: HTML5, Vanilla CSS, JS (Marked.js)
* **Package Management**: Pip

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/BlogBoard.git
   cd BlogBoard
   ```

2. Initialize virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate virtual environment:
   * **Windows**: `.venv\Scripts\activate`
   * **Linux/Mac**: `source .venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

### API Key Setup
Create a `.env` file in the root folder and add your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### Running the Project
1. Run the backend pipeline to generate a post:
   ```bash
   python backend/run.py
   ```
2. Serve the frontend locally:
   ```bash
   python -m http.server 8000 --directory frontend
   ```
3. Open `http://localhost:8000` in your web browser.

## License
Distributed under the MIT License. See `LICENSE` for more information.
