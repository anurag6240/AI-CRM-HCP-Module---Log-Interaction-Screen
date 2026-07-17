import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
// We bypass the buggy @google/genai SDK for nested schemas and use standard fetch.
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "interactions-db.json");

app.use(express.json());

// Direct REST fetch is used instead of client initialization to avoid SDK bugs.

// Pre-seeded interactions list
const initialSeedData = [
  {
    id: "seed-1",
    hcpName: "Dr. Emily Watson",
    interactionType: "Meeting",
    date: "2026-07-15",
    time: "14:30",
    attendees: "Rep Sarah Miller",
    topicsDiscussed: "Discussed Cardiox-9 Phase III efficacy data and primary endpoints.",
    materialsShared: "Cardiox-9 Efficacy Brochure, Trial Summary PDF",
    samplesDistributed: "10x Cardiox-9 10mg starter packs",
    sentiment: "Positive",
    outcomes: "Dr. Watson showed high interest and asked about formulary status.",
    followUpActions: "Send formulary submission guidelines and schedule next visit in 2 weeks.",
    createdAt: "2026-07-15T14:30:00.000Z"
  },
  {
    id: "seed-2",
    hcpName: "Dr. Sarah Jenkins",
    interactionType: "Phone Call",
    date: "2026-07-16",
    time: "10:00",
    attendees: "None",
    topicsDiscussed: "Addressed safety profile inquiries regarding Cardiox-9 drug interactions.",
    materialsShared: "Safety Datasheet V2, PI Document",
    samplesDistributed: "None",
    sentiment: "Neutral",
    outcomes: "Resolved the question; Dr. Jenkins remains cautious but informed.",
    followUpActions: "Email medical information packet on safety profiles.",
    createdAt: "2026-07-16T10:00:00.000Z"
  },
  {
    id: "seed-3",
    hcpName: "Dr. Robert Chen",
    interactionType: "Seminar",
    date: "2026-07-14",
    time: "18:30",
    attendees: "Rep Sarah Miller, Medical Liaison David",
    topicsDiscussed: "Oncology advisory roundtable and patient compliance studies.",
    materialsShared: "Patient Compliance Slide Deck",
    samplesDistributed: "None",
    sentiment: "Positive",
    outcomes: "Dr. Chen agreed to speak at the regional seminar in August.",
    followUpActions: "Draft speaker agreement contract and coordinate logistics.",
    createdAt: "2026-07-14T18:30:00.000Z"
  }
];

// Read from JSON database
const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2));
      return initialSeedData;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
};

// Write to JSON database
const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing database:", err);
  }
};

// --- API Endpoints ---

// 1. Fetch all interactions
app.get("/api/interactions", (req, res) => {
  const db = readDB();
  res.json(db);
});

// 2. Log a new interaction
app.post("/api/interactions", (req, res) => {
  const db = readDB();
  const newLog = {
    ...req.body,
    id: `log-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  db.unshift(newLog);
  writeDB(db);
  res.status(201).json(newLog);
});

// 3. Delete an interaction
app.delete("/api/interactions/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const filtered = db.filter((item: any) => item.id !== id);
  if (db.length === filtered.length) {
    return res.status(404).json({ error: "Interaction not found" });
  }
  writeDB(filtered);
  res.status(204).end();
});

// 4. Update an existing interaction
app.put("/api/interactions/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.findIndex((item: any) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Interaction not found" });
  }
  db[index] = {
    ...req.body,
    id,
    updatedAt: new Date().toISOString()
  };
  writeDB(db);
  res.json(db[index]);
});

// 3. AI Agent chat endpoint
app.post("/api/agent/chat", async (req, res) => {
  const { message, currentForm, chatHistory } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured.",
      reply: "My apologies, but the Gemini API Key is not set in the workspace secrets. Please add GEMINI_API_KEY in Settings > Secrets to enable this AI feature."
    });
  }

  try {
    const formattedHistory = (chatHistory || [])
      .map((m: any) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    console.log("-> API: /api/agent/chat received message:", message);
    console.log("-> API: History length is", (chatHistory || []).length);

    const systemInstruction = `You are an Expert Life Sciences CRM AI Agent specialized in parsing field representative interactions with Healthcare Professionals (HCPs / Doctors).
You must analyze unstructured interaction text, extract CRM details, analyze sentiment (strictly "Positive", "Neutral", or "Negative"), identify shared materials or samples, and suggest clear follow-up actions.

You MUST merge new inputs with the current state of the form:
Current Form State: ${JSON.stringify(currentForm)}

If the user is correcting or updating previous fields (e.g., "Actually, it was Dr. Jenkins" or "No samples were shared"), perform the update on top of the Current Form State! Do not lose other fields from the Current Form State unless requested.
Use the Chat History only to understand conversational context. Do not copy old text, reasoning logs, or repetitive replies from the Chat History.

CRITICAL: Do not output any thinking process, reasoning steps, chain-of-thought, or execution logs inside the parsed JSON fields. Each field must contain ONLY the final clean, extracted, or updated value. Do not repeat text or enter infinite loops.

Ensure your parsedFields output fits the database schema:
- hcpName: string (Name of the HCP/Doctor)
- interactionType: Meeting, Phone Call, Email, Webinar, Seminar, Other
- date: YYYY-MM-DD
- time: HH:MM
- attendees: string
- topicsDiscussed: string (Clinical topics discussed, excluding sentiment or follow-up details)
- materialsShared: string (Brochures or efficacy documents shared)
- samplesDistributed: string (Starter samples distributed)
- sentiment: Positive, Neutral, Negative
- outcomes: string (Results or decisions of the meeting)
- followUpActions: string (Next actions to be taken)`;

    console.log("-> API: Requesting Gemini model via direct HTTP POST...");
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: `Chat History:\n${formattedHistory}\n\nUser Message: ${message}` }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemInstruction }
        ]
      },
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            reply: {
              type: "STRING",
              description: "A summary message of the extraction/edit outcome, including sentiment result, and friendly assistance."
            },
            parsedFields: {
              type: "OBJECT",
              description: "The extracted or corrected CRM fields. Only include keys that are successfully detected, inferred, or corrected. Maintain fields from Current Form State if they were not requested to change.",
              properties: {
                hcpName: { type: "STRING", description: "Full name of the Healthcare Professional (HCP) / Doctor." },
                interactionType: { type: "STRING", description: "Must be exactly one of: Meeting, Phone Call, Email, Webinar, Seminar, Other." },
                date: { type: "STRING", description: "Date in YYYY-MM-DD format." },
                time: { type: "STRING", description: "Time in HH:MM format (24-hour)." },
                attendees: { type: "STRING", description: "Names of other people present in the meeting (excluding the doctor and the agent)." },
                topicsDiscussed: { type: "STRING", description: "Clinical topics, products, trials, or drugs discussed. Do not include sentiment, status updates, or follow-up actions here." },
                materialsShared: { type: "STRING", description: "Brochures, efficacy documents, or study data shared." },
                samplesDistributed: { type: "STRING", description: "Drug starter samples or packs distributed." },
                sentiment: { type: "STRING", description: "Must be exactly one of: Positive, Neutral, Negative." },
                outcomes: { type: "STRING", description: "Decisions made, doctor's reaction, or outcomes of the meeting." },
                followUpActions: { type: "STRING", description: "Specific next steps or follow-up plans generated." }
              },
              required: ["hcpName", "interactionType", "date", "time", "attendees", "topicsDiscussed", "materialsShared", "samplesDistributed", "sentiment", "outcomes", "followUpActions"]
            }
          },
          required: ["reply", "parsedFields"]
        }
      }
    };

    const apiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "aistudio-build"
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Gemini HTTP Error (${apiRes.status}): ${errText}`);
    }

    const resJson: any = await apiRes.json();
    const outputText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("-> API: Gemini raw response text:", outputText);

    if (!outputText) {
      throw new Error("No response from AI Model.");
    }

    const data = JSON.parse(outputText.trim());
    res.json(data);

  } catch (err: any) {
    console.error("Gemini processing error:", err);
    res.status(500).json({
      error: err.message,
      reply: "I encountered an error parsing the interaction details. Please check the text format or fill the form fields manually.",
      parsedFields: {}
    });
  }
});

// --- Vite / Asset Serving Setup ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
