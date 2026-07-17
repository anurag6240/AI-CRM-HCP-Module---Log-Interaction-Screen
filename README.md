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

- 🟢 **Configuration A (Express Node.js Full-Stack)**: React frontend + Node.js Express server running on **Port 3000** (uses Gemini 2.5 Flash).
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

# 🚀 How to Run Everything

## 🟢 Configuration A: Express Node.js Server (Port 3000)

This is the easiest way to run the entire app (frontend and backend combined) on **Port 3000**.

### 1️⃣ Install dependencies in the root directory

```bash
npm install
```

### 2️⃣ Set up your environment variables

Create a `.env` file in the root directory and add your Gemini API Key:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3️⃣ Run the development server

```bash
npm run dev
```

Open your browser and navigate to **http://localhost:3000**

---

## 🐍 Configuration B: Python FastAPI & React Frontend

This runs the Python backend with the LangGraph agent and connects a separate React app to it.

### 🔹 1. Setup the Python Backend (Port 8000)

#### 1️⃣ Navigate to the `/backend` directory

```bash
cd backend
```

#### 2️⃣ Create and activate a Python virtual environment

```bash
python -m venv venv

# On Windows:
.\venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

#### 3️⃣ Install the dependencies

```bash
pip install -r requirements.txt
```

#### 4️⃣ Create a `.env` file in the `/backend` directory

```env
GROQ_API_KEY="your_groq_api_token_here"
DATABASE_URL="sqlite:///local_hcp.db" # Default SQLite DB file
```

#### 5️⃣ Start the FastAPI server

```bash
uvicorn main:app --port 8000 --reload
```

The backend API will run at **http://localhost:8000** and Swagger API docs at **http://localhost:8000/docs**

---

### 🔹 2. Setup the React Frontend (Port 5173)

#### 1️⃣ Navigate to the `/frontend` directory

```bash
cd frontend
```

#### 2️⃣ Install dependencies

```bash
npm install
```

#### 3️⃣ Run the Vite frontend

```bash
npm run dev
```

Open your browser and navigate to **http://localhost:5173**. It will communicate with the FastAPI server on port **8000**.

---

# 🌐 REST API Routes

## 1️⃣ 📋 Interactions Endpoints

- `GET /api/interactions` : Fetch all logged interactions from the database.
- `POST /api/interactions` : Log a new interaction record.
- `PUT /api/interactions/:id` (or `/api/interactions/{log_id}`) : Update an existing interaction record in-place (used when saving edits).
- `DELETE /api/interactions/:id` (or `/api/interactions/{log_id}`) : Remove an interaction record.

---

## 2️⃣ 🤖 AI Chat Endpoint

- `POST /api/agent/chat` : Sends the active conversation history, current form fields, and user prompt to parse details and return a structured JSON response.

---

# 🧩 LangGraph Agent & The 5 Tools

The FastAPI backend runs a **LangGraph StateGraph** that coordinates user prompts through five specialized tools:

## 🛠️ Tool 1: Log Interaction Tool
Parses raw unstructured text to identify entities (doctor name, attendees, clinical topics, outcomes) and compiles them into a structured JSON payload conforming to the database schema.

---

## ✏️ Tool 2: Edit Interaction Tool
Context-aware editor that compares raw chat inputs alongside existing form states to perform surgical overrides and field updates.

---

## 😊 Tool 3: Sentiment Analyzer Tool
Evaluates the tone and notes, classifying the doctor's sentiment as **Positive**, **Neutral**, or **Negative**.

---

## 📦 Tool 4: Material & Sample Locator Tool
Scans text to identify physical materials distributed (brochures, trial data) and starter drug samples.

---

## 📅 Tool 5: Follow-Up Action Generator Tool
Reviews the meeting outcomes to generate targeted next steps (e.g. scheduling roundtable leaders, coordinating medical inquiries).
