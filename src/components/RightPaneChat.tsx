import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { addChatMessage, updateFormEntire, setHighlightedFields, clearAllHighlights, setLoading, setError } from "../store/interactionSlice";
import { ChatMessage, HCPInteraction } from "../types";
import { Send, Sparkles, MessageSquare, ArrowRight, CornerDownLeft, Brain } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const RightPaneChat: React.FC = () => {
  const dispatch = useDispatch();
  const chatHistory = useSelector((state: RootState) => state.interaction.chatHistory);
  const currentForm = useSelector((state: RootState) => state.interaction.currentForm);
  const loading = useSelector((state: RootState) => state.interaction.loading);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of the chat container ONLY (avoids scrolling the entire browser window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Create unique IDs
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `ai-${Date.now()}`;

    // Add user message to state
    dispatch(
      addChatMessage({
        id: userMsgId,
        sender: "user",
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })
    );

    // Add pending assistant message
    dispatch(
      addChatMessage({
        id: assistantMsgId,
        sender: "assistant",
        text: "Analyzing interaction text...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isPending: true
      })
    );

    setInput("");
    dispatch(setLoading(true));

    try {
      // Clear old highlights first
      dispatch(clearAllHighlights());

      // Send to the Express backend
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          currentForm: currentForm, // Context-aware: allows the agent to build on top or correct existing state!
          chatHistory: chatHistory.slice(-10).map((m) => ({ sender: m.sender, text: m.text }))
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Response is not JSON
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.reply || "Failed to communicate with AI Assistant.");
      }

      // Dispatch assistant update
      dispatch(
        updateFormEntire(data.parsedFields)
      );

      // Trigger temporary highlights for the fields that changed
      const highlights: Record<string, boolean> = {};
      Object.keys(data.parsedFields).forEach((key) => {
        if (data.parsedFields[key] !== undefined && data.parsedFields[key] !== "") {
          highlights[key] = true;
        }
      });
      dispatch(setHighlightedFields(highlights));

      // Remove loading indicator of this chat bubble
      // Wait, we need to update the chatHistory item
      dispatch({
        type: "interaction/updateChatMessagePending",
        payload: {
          id: assistantMsgId,
          text: data.reply,
          parsedFields: data.parsedFields
        }
      });

    } catch (err: any) {
      dispatch({
        type: "interaction/updateChatMessagePending",
        payload: {
          id: assistantMsgId,
          text: `Error: ${err.message || "Something went wrong while processing your request. Please try again."}`
        }
      });
      dispatch(setError(err.message || "AI Error"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return (
    <div className="bg-slate-100 rounded border border-slate-200 flex flex-col h-full shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          AI Assistant Chat
        </h2>
        <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded text-[9px] font-bold text-indigo-700 uppercase tracking-wider border border-indigo-100 animate-pulse">
          Live Parsing
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/55 flex flex-col">
        <AnimatePresence initial={false}>
          {chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === "user" ? "self-end items-end" : "self-start items-start"
              }`}
            >
              {/* Message Bubble */}
              <div
                className={
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm"
                    : "bg-white text-slate-700 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 flex flex-col gap-2"
                }
              >
                {msg.sender === "assistant" && !msg.isPending && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] text-indigo-600 font-bold">G</div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">LangGraph Agent</span>
                  </div>
                )}

                {msg.isPending ? (
                  <div className="flex items-center gap-2 py-0.5">
                    <div className="flex gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                    <span className="text-xs text-slate-400 italic">Processing clinical data...</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Show what parsed if it auto-populated - Matching Design spec's checklist */}
                    {msg.sender === "assistant" && msg.parsedFields && Object.keys(msg.parsedFields).length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-150 text-[11px] space-y-1">
                        <p className="font-semibold text-indigo-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-yellow-500" /> Extracted Details:
                        </p>
                        <ul className="text-xs space-y-1 text-slate-500 italic">
                          {Object.entries(msg.parsedFields).map(([key, val]) => {
                            if (!val) return null;
                            const formattedKey = key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase());
                            return (
                              <li key={key} className="flex items-center gap-1.5">
                                <span className="text-green-500 font-bold">✓</span>
                                <span className="font-semibold text-slate-600">{formattedKey}:</span>{" "}
                                <span className="text-slate-500">{String(val)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Suggestions inside bubble stream */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 w-full flex flex-col gap-1.5 items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Try field interaction notes:
                  </span>
                  {msg.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-left w-full p-2 text-xs text-indigo-800 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 rounded transition-all flex items-start gap-1.5 group cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3 text-indigo-500 mt-0.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>


      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
            placeholder="Talk to the AI assistant or describe the meeting..."
            className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-white"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1.5 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          System using Gemini & Gemma LLM Architectures
        </p>
      </div>
    </div>
  );
};
