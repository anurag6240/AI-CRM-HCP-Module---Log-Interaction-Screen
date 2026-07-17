import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { updateFormEntire, deleteInteractionFromHistory } from "../store/interactionSlice";
import { HCPInteraction, Sentiment } from "../types";
import { Search, Calendar, User, Clock, CheckCircle, Tag, ArrowRight, UserPlus, FileText, Trash2 } from "lucide-react";

export const InteractionsList: React.FC = () => {
  const dispatch = useDispatch();
  const history = useSelector((state: RootState) => state.interaction.history);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<HCPInteraction | null>(null);

  const filteredHistory = history.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.hcpName.toLowerCase().includes(searchLower) ||
      item.topicsDiscussed.toLowerCase().includes(searchLower) ||
      item.interactionType.toLowerCase().includes(searchLower)
    );
  });

  const handleLoadToForm = (item: HCPInteraction) => {
    dispatch(updateFormEntire(item));
  };

  const handleDeleteLog = async (id: string, hcpName: string) => {
    if (!window.confirm(`Are you sure you want to delete the interaction with ${hcpName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/interactions/${id}`, {
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

  const getSentimentPill = (sentiment: Sentiment | "") => {
    if (!sentiment) return <span className="text-slate-400 font-mono text-[9px]">None</span>;
    const colors = {
      [Sentiment.Positive]: "bg-green-100 text-green-700 border-green-200",
      [Sentiment.Neutral]: "bg-amber-100 text-amber-700 border-amber-200",
      [Sentiment.Negative]: "bg-rose-100 text-rose-700 border-rose-200"
    }[sentiment];

    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${colors}`}>
        {sentiment.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Header & Filter/Search */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Logged HCP Interactions ({history.length})
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter logs by HCP name, topics, or type..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* Main Grid: List & Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[300px]">
        {/* List Column */}
        <div className="lg:col-span-3 max-h-[450px] overflow-y-auto divide-y divide-slate-100">
          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <div className="w-10 h-10 bg-slate-50 rounded flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <Calendar className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No interactions found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Log a new interaction above or try a different search.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedLog(selectedLog?.id === item.id ? null : item)}
                className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-start gap-4 border-l-2 ${
                  selectedLog?.id === item.id ? "bg-indigo-50/30 border-indigo-500" : "border-transparent"
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800 truncate block">
                      {item.hcpName}
                    </span>
                    {getSentimentPill(item.sentiment)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 font-mono">
                    <span className="font-bold uppercase bg-slate-100 text-slate-700 px-1 rounded text-[9px] border border-slate-200">
                      {item.interactionType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.time}
                    </span>
                  </div>
                  {item.topicsDiscussed && (
                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      "{item.topicsDiscussed}"
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadToForm(item);
                    }}
                    className="px-2 py-1 text-[10px] uppercase tracking-wider text-indigo-600 border border-indigo-200 rounded bg-indigo-50 hover:bg-indigo-100 font-bold flex items-center gap-1 transition-colors"
                    title="Load into Editor"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.id) handleDeleteLog(item.id, item.hcpName);
                    }}
                    className="px-2 py-1 text-[10px] uppercase tracking-wider text-rose-600 border border-rose-200 rounded bg-rose-50 hover:bg-rose-100 font-bold flex items-center gap-1 transition-colors"
                    title="Delete Interaction"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Column */}
        <div className="lg:col-span-2 p-5 bg-slate-50/50 max-h-[450px] overflow-y-auto">
          {selectedLog ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2.5 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{selectedLog.hcpName}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Interaction details</p>
                </div>
                {getSentimentPill(selectedLog.sentiment)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Type</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedLog.interactionType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</p>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {selectedLog.date} @ {selectedLog.time}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Attendees</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedLog.attendees || "None specified"}</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase border-l border-indigo-500 pl-1.5 mb-1">
                    Topics Discussed
                  </p>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-white p-2 border border-slate-200 rounded text-xs">
                    {selectedLog.topicsDiscussed || "No topic details recorded."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded border border-slate-200 shadow-2xs">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Materials Shared</p>
                    <p className="font-semibold text-slate-700 mt-0.5 text-xs truncate" title={selectedLog.materialsShared}>
                      {selectedLog.materialsShared || "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Samples Distributed</p>
                    <p className="font-semibold text-slate-700 mt-0.5 text-xs truncate" title={selectedLog.samplesDistributed}>
                      {selectedLog.samplesDistributed || "None"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase border-l border-indigo-500 pl-1.5 mb-1">
                    Outcomes
                  </p>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-white p-2 border border-slate-200 rounded text-xs">
                    {selectedLog.outcomes || "No outcomes logged."}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase border-l border-indigo-500 pl-1.5 mb-1">
                    Follow-ups
                  </p>
                  <p className="text-indigo-950 leading-relaxed bg-indigo-50/50 p-2.5 rounded text-xs border border-indigo-100">
                    {selectedLog.followUpActions || "No follow-up actions logged."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
              <FileText className="w-6 h-6 text-slate-300 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Select a log to view details</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click any log from the left list to expand</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
