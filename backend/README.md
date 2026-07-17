# 🐍 Python FastAPI Backend & LangGraph Agent

This folder contains the Python FastAPI backend server which hosts the SQLite database and runs the orchestrator LangGraph AI Agent to parse medical representative interactions.

---

# 🚀 Setup and Run the Python Backend (Port 8000)

Follow these step-by-step instructions to set up the environment and run the server:

### 1️⃣ Create a Python Virtual Environment
Open a terminal in this `backend` directory and create a virtual environment named `venv`:
```bash
python -m venv venv
```

### 2️⃣ Activate the Virtual Environment
Select the correct command depending on your operating system and terminal:

*   **On Windows (PowerShell)**:
    If PowerShell displays an execution policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` first, then run:
    ```powershell
    .\venv\Scripts\activate
    ```
*   **On Windows (Command Prompt - CMD)**:
    ```cmd
    .\venv\Scripts\activate.bat
    ```
*   **On macOS / Linux**:
    ```bash
    source venv/bin/activate
    ```

When activated successfully, you will see `(venv)` prefixed at the start of your terminal command line.

### 3️⃣ Install Package Dependencies
Install all required Python packages (FastAPI, SQLite tools, Groq SDK, LangGraph, etc.):
```bash
pip install -r requirements.txt
```

### 4️⃣ Configure Environment Variables
Create a file named `.env` in this `/backend` directory and add your settings:
```env
DATABASE_URL="sqlite:///local_hcp.db" # Default SQLite DB connection string
GROQ_API_KEY="your_groq_api_token_here" # Required for Groq API calls (Gemma-2 model)
```
*(A template reference is provided in `backend/.env.example`)*.

### 5️⃣ Run the FastAPI Server
Start the development server using Uvicorn:
```bash
uvicorn main:app --port 8000 --reload
```

*   The backend will run on **[http://localhost:8000](http://localhost:8000)**.
*   Interactive Swagger API docs will be available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

# 🌐 API Routes

- `GET /api/interactions` : Retrieve all logged interaction records from the SQLite database.
- `POST /api/interactions` : Log a new interaction record in the database.
- `PUT /api/interactions/{log_id}` : Update an existing record in-place by its database ID (used when saving edits).
- `DELETE /api/interactions/{log_id}` : Remove a record by ID from the database.
- `POST /api/agent/chat` : Send current form data and message history to the LangGraph AI agent to parse and return structured JSON.

---

# 🧩 LangGraph Agent & The 5 Tools

The backend compiles a **LangGraph StateGraph** that maps user prompts through five modular helper tools:

*   **🛠️ Tool 1: Log Interaction Tool**: Parses raw unstructured text to identify entities (doctor name, attendees, clinical topics, outcomes) and compiles them into a structured JSON payload conforming to the database schema.
*   **✏️ Tool 2: Edit Interaction Tool**: Context-aware editor that compares raw chat inputs alongside existing form states to perform surgical overrides and field updates.
*   **😊 Tool 3: Sentiment Analyzer Tool**: Evaluates the tone and notes, classifying the doctor's sentiment as **Positive**, **Neutral**, or **Negative**.
*   **📦 Tool 4: Material & Sample Locator Tool**: Scans text to identify physical materials distributed (brochures, trial data) and starter drug samples.
*   **📅 Tool 5: Follow-Up Action Generator Tool**: Reviews the meeting outcomes to generate targeted next steps (e.g. scheduling roundtable leaders, coordinating medical inquiries).
