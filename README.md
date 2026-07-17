# 🤖 AI CRM HCP Module - Log Interaction Screen

This project is a high-performance, AI-first Customer Relationship Management (CRM) module specifically designed for medical representatives to log and manage structured interactions with Healthcare Professionals (HCPs / Doctors) using unstructured conversational input.

The project is styled using the **Google Inter** font and uses **Redux** for managing state on the frontend.

---

# ✨ Key Features

### 1. 🖥️ Dual-Pane Interactive Layout
- **📋 Left Pane (Structured CRM Form)**: Form fields for logging HCP Name, Date, Time, Topics Discussed, Attendees, Standardized Materials Shared, Samples Distributed, Outcomes, and Actions.
- **🤖 Right Pane (AI Assistant Chat)**: A conversational portal. Users describe field interactions in natural language, and the AI agent automatically parses details and populates form fields instantly with elegant green transition glows.

### 2. 🧠 Context-Aware Dynamic Corrections
- If the user corrects or updates fields via chat (e.g., *"Actually, it was Dr. Watson, and we shared oncology samples, not Cardiox"*), the AI agent intelligently updates and merges fields based on the active form state.

### 3. 🗂️ Database Records Panel
- A historical interactions ledger showing all recorded visits in the database with search capabilities, color-coded sentiments, and the ability to load records back into the editor (via the **Edit** button), **Delete** records, and **Toggle/Collapse** details.

---

# 🏗️ System Architecture

The application has two parallel, interchangeable full-stack configurations:

- 🟢 **Configuration A (Express Node.js Full-Stack)**: React frontend + Node.js Express server running on **Port 3000** (uses Gemini 1.5 Flash 8B / `gemini-flash-lite-latest`).
- 🐍 **Configuration B (FastAPI Python Full-Stack)**: React frontend running on **Port 5173** + FastAPI Python backend running on **Port 8000** (uses Groq `gemma2-9b-it` and LangGraph).

```text
 ┌──────────────────────────────────────────────┐
 │               Vite/React UI                  │
 └──────────────────────┬───────────────────────┘
                        │ HTTP POST /api/agent/chat
                        ▼
 ┌──────────────────────────────────────────────┐
 │    LangGraph Agent Orchestrator (Python)     │
 └───┬───────────┬──────────┬──────────┬────────┘
     │ Tool 1    │ Tool 2   │ Tool 3   │ Tool 4   │ Tool 5
     ▼           ▼          ▼          ▼          ▼
 ┌──────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐
 │Log       ││Edit     ││Sentiment││Material ││FollowUp │
 │Extract   ││Correct  ││Analyzer ││Sample   ││Generator│
 └──────────┘└─────────┘└─────────┘└─────────┘└─────────┘
```

---

# 🚀 How to Run Configuration A (Express Node.js Full-Stack)

This is the easiest way to run the entire app (frontend and backend combined) on **Port 3000** using a local JSON file as a database.

### 1️⃣ Install Node.js Dependencies
Open a terminal in the project's root folder (`ai-first-crm-hcp-module`) and run:
```bash
npm install
```

### 2️⃣ Configure Environment Variables
Create a file named `.env` in the root folder (`ai-first-crm-hcp-module`) and add your Gemini API Key:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3️⃣ Start the App
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to use the application!

---

# 🚀 How to Run Configuration B (FastAPI Python Backend & Vite Frontend)

This runs the LangGraph Python backend on **Port 8000** and a React Vite frontend on **Port 5173**.

## 🔹 Step 1: Start the Python Backend (Port 8000)

### 1️⃣ Open a Terminal and go to the `/backend` folder
```bash
cd backend
```

### 2️⃣ Create a Python Virtual Environment
Run the following command to create a virtual environment named `venv`:
```bash
python -m venv venv
```

### 3️⃣ Activate the Virtual Environment
- **On Windows (PowerShell)**:
  If PowerShell throws a permission error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` first, then run:
  ```powershell
  .\venv\Scripts\activate
  ```
- **On Windows (Command Prompt - CMD)**:
  ```cmd
  .\venv\Scripts\activate.bat
  ```
- **On macOS/Linux**:
  ```bash
  source venv/bin/activate
  ```

Once activated, your terminal prompt will show `(venv)` at the beginning.

### 4️⃣ Install Backend Packages
Run this command to install all requirements (FastAPI, LangGraph, Groq, etc.):
```bash
pip install -r requirements.txt
```

### 5️⃣ Configure Backend Environment Variables
Create a file named `.env` inside the `backend` folder and add your keys:
```env
DATABASE_URL="sqlite:///local_hcp.db"
GROQ_API_KEY="your_groq_api_token_here"
```
*(You can use the template in `backend/.env.example` as a reference)*.

### 6️⃣ Run the FastAPI Server
Start the backend using Uvicorn:
```bash
uvicorn main:app --port 8000 --reload
```
- The backend will run on **[http://localhost:8000](http://localhost:8000)**.
- Swagger API Docs will be available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 🔹 Step 2: Start the React Frontend (Port 5173)

### 1️⃣ Open a NEW Terminal Window and go to the `/frontend` folder
```bash
cd frontend
```

### 2️⃣ Install Frontend Dependencies
```bash
npm install
```

### 3️⃣ Run the Frontend Development Server
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to run the Python full-stack configuration!

---

# 🌐 REST API Routes

## 1️⃣ 📋 Interactions Endpoints
- `GET /api/interactions` : Fetch all logged interactions from the database.
- `POST /api/interactions` : Log a new interaction record.
- `PUT /api/interactions/:id` : Update an existing interaction record in-place by ID (saves edits).
- `DELETE /api/interactions/:id` : Remove an interaction record.

## 2️⃣ 🤖 AI Chat Endpoint
- `POST /api/agent/chat` : Processes conversational logs and active form states, returning structured JSON properties.

---

# 🧩 LangGraph Agent & The 5 Tools

The Python backend compiles a **LangGraph StateGraph** that coordinates user prompts through five specialized tools:
*   **🛠️ Tool 1: Log Interaction**: Parses unformatted text to extract HCP details (names, dates, topics, outcomes).
*   **✏️ Tool 2: Edit/Correction**: A context-aware tool that merges natural language corrections with active forms.
*   **😊 Tool 3: Sentiment Analyzer**: Classifies tone into Positive, Neutral, or Negative.
*   **📦 Tool 4: Material & Sample Locator**: Scans for shared brochures, trial materials, and drug starter samples.
*   **📅 Tool 5: Follow-Up Action Generator**: Evaluates outcomes to recommend specific next steps.
