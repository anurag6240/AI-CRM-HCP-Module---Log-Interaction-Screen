import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { updateFormField, clearForm, clearHighlightedField } from "../store/interactionSlice";
import { Sentiment, HCPInteraction } from "../types";
import { Calendar, Clock, User, Users, BookOpen, Gift, Smile, CheckSquare, Save, Trash2, Sparkles } from "lucide-react";

interface LeftPaneFormProps {
  onSave: () => void;
}

export const LeftPaneForm: React.FC<LeftPaneFormProps> = ({ onSave }) => {
  const dispatch = useDispatch();
  const currentForm = useSelector((state: RootState) => state.interaction.currentForm);
  const highlightedFields = useSelector((state: RootState) => state.interaction.highlightedFields);

  const handleFieldChange = (field: keyof HCPInteraction, value: any) => {
    dispatch(updateFormField({ field, value }));
    if (highlightedFields[field]) {
      dispatch(clearHighlightedField(field));
    }
  };

  const getHighlightClass = (field: string) => {
    return highlightedFields[field]
      ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/30 transition-all duration-1000"
      : "border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  };

  const clearFieldHighlight = (field: string) => {
    if (highlightedFields[field]) {
      dispatch(clearHighlightedField(field));
    }
  };

  return (
    <div className="bg-white rounded border border-slate-200 flex flex-col h-full shadow-xs">
      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          Structured Interaction Data
        </h2>
        <button
          onClick={() => dispatch(clearForm())}
          className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded font-bold bg-slate-50 hover:bg-red-50 flex items-center gap-1 transition-colors"
          title="Reset Form"
        >
          <Trash2 className="w-3 h-3" />
          Clear Fields
        </button>
      </div>

      {/* Form Content */}
      <div className="p-5 overflow-y-auto flex-1 space-y-3">
        {/* HCP Name & Interaction Type (Grid structure like mockup) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
              <span>HCP Name <span className="text-red-500">*</span></span>
              {highlightedFields.hcpName && (
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">
                  AI Set
                </span>
              )}
            </label>
            <input
              type="text"
              value={currentForm.hcpName}
              onChange={(e) => handleFieldChange("hcpName", e.target.value)}
              onFocus={() => clearFieldHighlight("hcpName")}
              placeholder="e.g. Dr. Emily Watson"
              className={`px-2 py-1.5 border rounded text-sm bg-slate-50 ${getHighlightClass("hcpName")}`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Interaction Type</label>
            <select
              value={currentForm.interactionType}
              onChange={(e) => handleFieldChange("interactionType", e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            >
              <option value="Meeting">Meeting</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Email">Email</option>
              <option value="Webinar">Webinar</option>
              <option value="Seminar">Seminar</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
              <span>Date</span>
              {highlightedFields.date && (
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
              )}
            </label>
            <input
              type="date"
              value={currentForm.date}
              onChange={(e) => handleFieldChange("date", e.target.value)}
              onFocus={() => clearFieldHighlight("date")}
              className={`px-2 py-1.5 border rounded text-sm bg-slate-50 ${getHighlightClass("date")}`}
            />
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
              <span>Time</span>
              {highlightedFields.time && (
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
              )}
            </label>
            <input
              type="time"
              value={currentForm.time}
              onChange={(e) => handleFieldChange("time", e.target.value)}
              onFocus={() => clearFieldHighlight("time")}
              className={`px-2 py-1.5 border rounded text-sm bg-slate-50 ${getHighlightClass("time")}`}
            />
          </div>
        </div>

        {/* Attendees */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
            <span>Attendees</span>
            {highlightedFields.attendees && (
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
            )}
          </label>
          <input
            type="text"
            value={currentForm.attendees}
            onChange={(e) => handleFieldChange("attendees", e.target.value)}
            onFocus={() => clearFieldHighlight("attendees")}
            placeholder="e.g. Dr. Emily Watson, Rep Sarah Miller"
            className={`px-2 py-1.5 border rounded text-sm bg-slate-50 ${getHighlightClass("attendees")}`}
          />
        </div>

        {/* Sentiment Analysis Field */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
            <span>Observed Sentiment</span>
            {highlightedFields.sentiment && (
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
            )}
          </label>
          <div className="flex gap-2">
            {[Sentiment.Positive, Sentiment.Neutral, Sentiment.Negative].map((item) => {
              const isActive = currentForm.sentiment === item;
              
              if (item === Sentiment.Positive) {
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleFieldChange("sentiment", item)}
                    className={`px-2 py-1 text-[10px] font-bold rounded border flex-1 text-center transition-all ${
                      isActive
                        ? "bg-green-100 text-green-700 border-green-300 ring-1 ring-green-400"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    }`}
                  >
                    POSITIVE
                  </button>
                );
              } else if (item === Sentiment.Neutral) {
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleFieldChange("sentiment", item)}
                    className={`px-2 py-1 text-[10px] font-bold rounded border flex-1 text-center transition-all ${
                      isActive
                        ? "bg-amber-100 text-amber-700 border-amber-300 ring-1 ring-amber-400"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                    }`}
                  >
                    NEUTRAL
                  </button>
                );
              } else {
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleFieldChange("sentiment", item)}
                    className={`px-2 py-1 text-[10px] font-bold rounded border flex-1 text-center transition-all ${
                      isActive
                        ? "bg-rose-100 text-rose-700 border-rose-300 ring-1 ring-rose-400"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                    }`}
                  >
                    NEGATIVE
                  </button>
                );
              }
            })}
          </div>
        </div>

        {/* Topics Discussed */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
            <span>Topics Discussed</span>
            {highlightedFields.topicsDiscussed && (
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
            )}
          </label>
          <textarea
            value={currentForm.topicsDiscussed}
            onChange={(e) => handleFieldChange("topicsDiscussed", e.target.value)}
            onFocus={() => clearFieldHighlight("topicsDiscussed")}
            placeholder="Discussed CardiaBlock-X safety profiles..."
            rows={2}
            className={`px-2 py-1.5 border rounded text-sm bg-slate-50 h-14 resize-none ${getHighlightClass("topicsDiscussed")}`}
          />
        </div>

        {/* Materials Shared & Samples Distributed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
              <span>Materials Shared</span>
              {highlightedFields.materialsShared && (
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
              )}
            </label>
            <input
              type="text"
              value={currentForm.materialsShared}
              onChange={(e) => handleFieldChange("materialsShared", e.target.value)}
              onFocus={() => clearFieldHighlight("materialsShared")}
              placeholder="e.g. CardiaBlock Booklet v4.2"
              className={`px-2 py-1.5 border rounded text-sm bg-slate-50 ${getHighlightClass("materialsShared")}`}
            />
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
              <span>Samples Distributed</span>
              {highlightedFields.samplesDistributed && (
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
              )}
            </label>
            <input
              type="text"
              value={currentForm.samplesDistributed}
              onChange={(e) => handleFieldChange("samplesDistributed", e.target.value)}
              onFocus={() => clearFieldHighlight("samplesDistributed")}
              placeholder="e.g. 5mg Starter Packs"
              className={`px-2 py-1.5 border rounded text-sm bg-slate-50 ${getHighlightClass("samplesDistributed")}`}
            />
          </div>
        </div>

        {/* Outcomes */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
            <span>Outcomes & notes</span>
            {highlightedFields.outcomes && (
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
            )}
          </label>
          <textarea
            value={currentForm.outcomes}
            onChange={(e) => handleFieldChange("outcomes", e.target.value)}
            onFocus={() => clearFieldHighlight("outcomes")}
            placeholder="Dr. Rodriguez remains cautious but informed..."
            rows={2}
            className={`px-2 py-1.5 border rounded text-sm bg-slate-50 h-14 resize-none ${getHighlightClass("outcomes")}`}
          />
        </div>

        {/* Follow-up Actions in nice styled box matching design specs */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
            <span>Follow-up Actions</span>
            {highlightedFields.followUpActions && (
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">AI Set</span>
            )}
          </label>
          <textarea
            value={currentForm.followUpActions}
            onChange={(e) => handleFieldChange("followUpActions", e.target.value)}
            onFocus={() => clearFieldHighlight("followUpActions")}
            placeholder="• Send digital copy of safety profile to Dr. Rodriguez by Friday."
            rows={2}
            className={`px-2 py-1.5 border rounded text-xs bg-indigo-50/50 text-indigo-900 border-indigo-100 h-16 resize-none focus:outline-none focus:border-indigo-400 ${
              highlightedFields.followUpActions ? "ring-1 ring-emerald-400 border-emerald-400 bg-emerald-50/20" : ""
            }`}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
        <button
          onClick={onSave}
          disabled={!currentForm.hcpName}
          className={`px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition-all ${
            currentForm.hcpName
              ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer active:scale-98"
              : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
          }`}
        >
          Save Record
        </button>
      </div>
    </div>
  );
};
