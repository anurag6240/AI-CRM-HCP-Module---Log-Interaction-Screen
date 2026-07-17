import React, { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState } from "./store";
import { LeftPaneForm } from "./components/LeftPaneForm";
import { RightPaneChat } from "./components/RightPaneChat";
import { InteractionsList } from "./components/InteractionsList";
import { addInteractionToHistory, updateInteractionInHistory, setHistory, clearForm, setHighlightedFields } from "./store/interactionSlice";
import { Sentiment, HCPInteraction } from "./types";
import { HeartPulse, LayoutGrid, Users, Award, ShieldAlert, CheckCircle2, Sparkles } from "lucide-react";

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const currentForm = useSelector((state: RootState) => state.interaction.currentForm);
  const history = useSelector((state: RootState) => state.interaction.history);

  // Load initial logs on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/interactions");
        if (res.ok) {
          const data = await res.json();
          dispatch(setHistory(data));
        }
      } catch (err) {
        console.error("Failed to load interaction logs", err);
      }
    };
    fetchHistory();
  }, [dispatch]);

  const handleSaveInteraction = async () => {
    if (!currentForm.hcpName) return;

    const isEdit = !!currentForm.id;
    const url = isEdit ? `/api/interactions/${currentForm.id}` : "/api/interactions";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentForm)
      });

      if (res.ok) {
        const saved: HCPInteraction = await res.json();
        if (isEdit) {
          dispatch(updateInteractionInHistory(saved));
        } else {
          dispatch(addInteractionToHistory(saved));
        }
        dispatch(clearForm());

        // Show a brief saved animation or success alert
        alert(isEdit 
          ? `Successfully updated interaction with ${saved.hcpName}!` 
          : `Successfully logged interaction with ${saved.hcpName}!`
        );
      } else {
        alert("Failed to save interaction. Please check input fields.");
      }
    } catch (err) {
      console.error("Error saving interaction:", err);
      alert("Network error: Could not save interaction.");
    }
  };

  // Compute dynamic stats from history
  const totalHCPs = new Set(history.map(h => h.hcpName)).size;
  const materialsSharedCount = history.filter(h => h.materialsShared && h.materialsShared.trim() !== "").length;
  const positiveSentimentCount = history.filter(h => h.sentiment === Sentiment.Positive).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner/Navbar */}
      <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">
            AI-First CRM HCP Module <span className="text-slate-400 font-normal">| Log Interaction Screen</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            AI Agent Active
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-300">
            AI
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 lg:p-6 space-y-6">
        {/* Dynamic CRM Stats Banner in High Density Styling */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3 shadow-xs">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unique HCPs Tracked</p>
              <h3 className="text-base font-bold text-slate-800 mt-0.5">{totalHCPs}</h3>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3 shadow-xs">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Materials Delivered</p>
              <h3 className="text-base font-bold text-slate-800 mt-0.5">{materialsSharedCount}</h3>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3 shadow-xs">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Positive Sentiment Ratio</p>
              <h3 className="text-base font-bold text-slate-800 mt-0.5">
                {history.length > 0
                  ? `${Math.round((positiveSentimentCount / history.length) * 100)}%`
                  : "0%"}
              </h3>
            </div>
          </div>
        </section>

        {/* Dual Pane Layout: 7/12 (Form) and 5/12 (Chat) to match High Density spec */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Pane: Structured Form (lg:col-span-7) */}
          <div className="lg:col-span-7 h-[680px]">
            <LeftPaneForm onSave={handleSaveInteraction} />
          </div>

          {/* Right Pane: AI Chat Assistant (lg:col-span-5) */}
          <div className="lg:col-span-5 h-[680px]">
            <RightPaneChat />
          </div>
        </section>

        {/* Historic Log Listing Section */}
        <section>
          <InteractionsList />
        </section>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
