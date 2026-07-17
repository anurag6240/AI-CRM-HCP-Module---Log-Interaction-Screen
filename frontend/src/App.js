import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateFormField,
  updateFormEntire,
  clearForm,
  addChatMessage,
  setHighlightedFields,
  clearHighlightedField,
  setHistory,
  addInteractionToHistory,
  deleteInteractionFromHistory,
  updateInteractionInHistory,
  setLoading,
  setError
} from "./store/interactionSlice";
import {
  HeartPulse,
  User,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Gift,
  Smile,
  CheckSquare,
  Save,
  Trash2,
  Sparkles,
  Send,
  MessageSquare,
  ArrowRight,
  Brain,
  Search,
  FileText
} from "lucide-react";

// API Endpoint configuration (assumes running Python FastAPI on localhost:8000)
const API_BASE = "http://localhost:8000";

export default function App() {
  const dispatch = useDispatch();
  const currentForm = useSelector((state) => state.interaction.currentForm);
  const history = useSelector((state) => state.interaction.history);
  const chatHistory = useSelector((state) => state.interaction.chatHistory);
  const highlightedFields = useSelector((state) => state.interaction.highlightedFields);
  const loading = useSelector((state) => state.interaction.loading);

  const [chatInput, setChatInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const chatContainerRef = useRef(null);

  // Auto scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  // Load history from FastAPI DB on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/interactions`);
        if (res.ok) {
          const data = await res.json();
          dispatch(setHistory(data));
        }
      } catch (err) {
        console.error("Failed to connect to backend", err);
      }
    };
    fetchHistory();
  }, [dispatch]);

  const handleFieldChange = (field, value) => {
    dispatch(updateFormField({ field, value }));
    if (highlightedFields[field]) {
      dispatch(clearHighlightedField(field));
    }
  };

  const handleSaveForm = async () => {
    if (!currentForm.hcpName) return;

    const isEdit = !!currentForm.id;
    const url = isEdit ? `${API_BASE}/api/interactions/${currentForm.id}` : `${API_BASE}/api/interactions`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentForm)
      });

      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          dispatch(updateInteractionInHistory(saved));
        } else {
          dispatch(addInteractionToHistory(saved));
        }
        dispatch(clearForm());
        alert(isEdit 
          ? `Successfully updated interaction with ${saved.hcpName}!` 
          : `Successfully logged interaction with ${saved.hcpName}!`
        );
      } else {
        alert("Failed to save interaction. Check database connectivity.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Network Error: Make sure FastAPI backend is running.");
    }
  };

  const handleDeleteLog = async (id, hcpName) => {
    if (!window.confirm(`Are you sure you want to delete the interaction with ${hcpName}?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/interactions/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        dispatch(deleteInteractionFromHistory(id));
        if (selectedLog?.id === id) {
          setSelectedLog(null);
        }
      } else {
        alert("Failed to delete interaction.");
      }
    } catch (err) {
      console.error("Error deleting interaction:", err);
      alert("Network error: Could not delete interaction.");
    }
  };

  const handleSendChat = async (textToSend) => {
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `ai-${Date.now()}`;

    dispatch(
      addChatMessage({
        id: userMsgId,
        sender: "user",
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })
    );

    dispatch(
      addChatMessage({
        id: assistantMsgId,
        sender: "assistant",
        text: "Analyzing text via Groq...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isPending: true
      })
    );

    setChatInput("");
    dispatch(setLoading(true));

    try {
      const res = await fetch(`${API_BASE}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          currentForm: currentForm,
          chatHistory: chatHistory.slice(-10).map((m) => ({ sender: m.sender, text: m.text }))
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        // Not JSON
      }

      if (!res.ok) {
        throw new Error(data?.detail || data?.error || data?.reply || "FastAPI Agent error.");
      }

      dispatch(updateFormEntire(data.parsedFields));

      const highlights = {};
      Object.keys(data.parsedFields).forEach((k) => {
        if (data.parsedFields[k]) highlights[k] = true;
      });
      dispatch(setHighlightedFields(highlights));

      dispatch({
        type: "interaction/updateChatMessagePending",
        payload: {
          id: assistantMsgId,
          text: data.reply,
          parsedFields: data.parsedFields
        }
      });
    } catch (err) {
      dispatch({
        type: "interaction/updateChatMessagePending",
        payload: {
          id: assistantMsgId,
          text: `Error contacting backend: ${err.message || "Please check your server status and API token configuration."}`
        }
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Filter history list
  const filteredHistory = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.hcpName.toLowerCase().includes(term) ||
      item.topicsDiscussed?.toLowerCase().includes(term) ||
      item.interactionType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg tracking-tight">AI-First CRM HCP Module</h1>
              <p className="text-[11px] text-gray-500 font-medium">Life Sciences Field Intelligence Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full">
            <Brain className="w-4 h-4 text-indigo-500" />
            <span>Groq & LangGraph Connected</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Pane: Structured Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" /> Form Fields
              </span>
              <button onClick={() => dispatch(clearForm())} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                  <span>HCP Name *</span>
                  {highlightedFields.hcpName && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 rounded">AI Set</span>}
                </label>
                <input
                  type="text"
                  value={currentForm.hcpName}
                  onChange={(e) => handleFieldChange("hcpName", e.target.value)}
                  className={`w-full p-2 text-sm rounded-lg border ${highlightedFields.hcpName ? "border-emerald-500 bg-emerald-50/20" : "border-gray-200"}`}
                  placeholder="e.g. Dr. Emily Watson"
                />
              </div>

              {/* Type, Date, Time */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                  <select
                    value={currentForm.interactionType}
                    onChange={(e) => handleFieldChange("interactionType", e.target.value)}
                    className="w-full p-2 text-sm rounded-lg border border-gray-200 bg-white"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Email">Email</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={currentForm.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    className="w-full p-1.5 text-sm rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time</label>
                  <input
                    type="time"
                    value={currentForm.time}
                    onChange={(e) => handleFieldChange("time", e.target.value)}
                    className="w-full p-1.5 text-sm rounded-lg border border-gray-200"
                  />
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                  <span>Attendees</span>
                  {highlightedFields.attendees && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 rounded">AI Set</span>}
                </label>
                <input
                  type="text"
                  value={currentForm.attendees}
                  onChange={(e) => handleFieldChange("attendees", e.target.value)}
                  className={`w-full p-2 text-sm rounded-lg border ${highlightedFields.attendees ? "border-emerald-500 bg-emerald-50/20" : "border-gray-200"}`}
                  placeholder="e.g. Rep Sarah Miller"
                />
              </div>

              {/* Sentiment */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                  <span>Sentiment</span>
                  {highlightedFields.sentiment && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 rounded">AI Analyzed</span>}
                </label>
                <div className="flex gap-2">
                  {["Positive", "Neutral", "Negative"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleFieldChange("sentiment", s)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        currentForm.sentiment === s
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Topics Discussed</label>
                <textarea
                  value={currentForm.topicsDiscussed}
                  onChange={(e) => handleFieldChange("topicsDiscussed", e.target.value)}
                  rows={2}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 resize-none"
                  placeholder="Clinical endpoints, trial phases, safety data..."
                />
              </div>

              {/* Materials and Samples */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materials Shared</label>
                  <input
                    type="text"
                    value={currentForm.materialsShared}
                    onChange={(e) => handleFieldChange("materialsShared", e.target.value)}
                    className="w-full p-2 text-sm rounded-lg border border-gray-200"
                    placeholder="e.g. Trial brochures"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Samples Distributed</label>
                  <input
                    type="text"
                    value={currentForm.samplesDistributed}
                    onChange={(e) => handleFieldChange("samplesDistributed", e.target.value)}
                    className="w-full p-2 text-sm rounded-lg border border-gray-200"
                    placeholder="e.g. 5x drug starters"
                  />
                </div>
              </div>

              {/* Outcomes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Outcomes</label>
                <textarea
                  value={currentForm.outcomes}
                  onChange={(e) => handleFieldChange("outcomes", e.target.value)}
                  rows={2}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 resize-none"
                  placeholder="Feedback, responses, formulary status..."
                />
              </div>

              {/* Follow-up */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Follow-up Actions</label>
                <textarea
                  value={currentForm.followUpActions}
                  onChange={(e) => handleFieldChange("followUpActions", e.target.value)}
                  rows={2}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 resize-none"
                  placeholder="Schedule next follow-up, medical mailings..."
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSaveForm}
                disabled={!currentForm.hcpName}
                className="bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Log
              </button>
            </div>
          </div>

          {/* Right Pane: AI Assistant Chat */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-300" /> AI Assistant (Groq & LangGraph)
              </span>
              <span className="text-[10px] bg-indigo-800 px-2 py-1 rounded font-bold">Gemma-9B</span>
            </div>

            <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
              {chatHistory.map((m) => (
                <div key={m.id} className={`flex flex-col max-w-[85%] ${m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  <div className={`p-3 rounded-2xl text-sm ${m.sender === "user" ? "bg-indigo-600 text-white" : "bg-white border border-gray-100 shadow-sm"}`}>
                    {m.isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="text-xs text-gray-400">Processing CRM tools...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    )}
                  </div>
                  {m.suggestions && (
                    <div className="mt-2 w-full space-y-1">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendChat(s)}
                          className="w-full text-left p-2 bg-indigo-50 hover:bg-indigo-100 text-xs text-indigo-800 rounded-lg transition-colors border border-indigo-150"
                        >
                          → {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat(chatInput)}
                placeholder="Enter unstructured interaction note..."
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none"
              />
              <button
                onClick={() => handleSendChat(chatInput)}
                disabled={!chatInput.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl disabled:bg-gray-300 shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* List of Logs */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-150 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Interaction Log Database
              </h2>
              <p className="text-xs text-gray-400">SQL Database records via FastAPI</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search database logs..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-150 min-h-[250px]">
            <div className="md:col-span-2 max-h-[350px] overflow-y-auto divide-y divide-gray-100">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedLog(selectedLog?.id === item.id ? null : item)}
                  className={`p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center ${selectedLog?.id === item.id ? "bg-indigo-50/20" : ""}`}
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{item.hcpName}</p>
                    <div className="flex gap-2 text-[10px] text-gray-400 mt-1">
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">{item.interactionType}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(updateFormEntire(item));
                      }}
                      className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded"
                    >
                      Edit Form
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.id) handleDeleteLog(item.id, item.hcpName);
                      }}
                      className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded flex items-center gap-1 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50/50 max-h-[350px] overflow-y-auto text-xs">
              {selectedLog ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-200 pb-2">{selectedLog.hcpName}</h3>
                  <p><strong>Type:</strong> {selectedLog.interactionType}</p>
                  <p><strong>Date & Time:</strong> {selectedLog.date} @ {selectedLog.time}</p>
                  <p><strong>Attendees:</strong> {selectedLog.attendees || "None"}</p>
                  <p><strong>Topics Discussed:</strong> {selectedLog.topicsDiscussed}</p>
                  <p><strong>Materials:</strong> {selectedLog.materialsShared || "None"}</p>
                  <p><strong>Samples:</strong> {selectedLog.samplesDistributed || "None"}</p>
                  <p><strong>Sentiment:</strong> {selectedLog.sentiment || "Neutral"}</p>
                  <p><strong>Outcomes:</strong> {selectedLog.outcomes}</p>
                  <p><strong>Follow-ups:</strong> {selectedLog.followUpActions}</p>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-10">Select an interaction from the database list to inspect.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
