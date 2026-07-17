import { createSlice } from "@reduxjs/toolkit";

const initialFormState = {
  hcpName: "",
  interactionType: "Meeting",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toTimeString().slice(0, 5),
  attendees: "",
  topicsDiscussed: "",
  materialsShared: "",
  samplesDistributed: "",
  sentiment: "",
  outcomes: "",
  followUpActions: ""
};

const initialState = {
  currentForm: { ...initialFormState },
  history: [],
  chatHistory: [
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your CRM AI Assistant. Describe your interaction with a Healthcare Professional (HCP) in natural language, and I will parse and populate the CRM form fields for you.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        "Met with Dr. Emily Watson today at her clinic. Discussed clinical trial results for Cardiox-9. Shared the new efficacy brochure. Sentiment was very positive.",
        "Phone call with Dr. Sarah Jenkins. Discussed oncology safety profile. No samples shared, she requested a follow-up medical inquiry.",
        "Discussed oncology product with Dr. Robert Chen. Follow-up: Schedule a lunch-and-learn seminar next Thursday."
      ]
    }
  ],
  highlightedFields: {},
  loading: false,
  error: null
};

export const interactionSlice = createSlice({
  name: "interaction",
  initialState,
  reducers: {
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.currentForm[field] = value;
    },
    updateFormEntire: (state, action) => {
      state.currentForm = {
        ...state.currentForm,
        ...action.payload
      };
    },
    clearForm: (state) => {
      state.currentForm = {
        ...initialFormState,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5)
      };
      state.highlightedFields = {};
    },
    addChatMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    updateChatMessagePending: (state, action) => {
      const msg = state.chatHistory.find(m => m.id === action.payload.id);
      if (msg) {
        msg.text = action.payload.text;
        msg.isPending = false;
        msg.parsedFields = action.payload.parsedFields;
      }
    },
    setHighlightedFields: (state, action) => {
      state.highlightedFields = {
        ...state.highlightedFields,
        ...action.payload
      };
    },
    clearHighlightedField: (state, action) => {
      delete state.highlightedFields[action.payload];
    },
    setHistory: (state, action) => {
      state.history = action.payload;
    },
    addInteractionToHistory: (state, action) => {
      state.history.unshift(action.payload);
    },
    deleteInteractionFromHistory: (state, action) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },
    updateInteractionInHistory: (state, action) => {
      const index = state.history.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.history[index] = action.payload;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  updateFormField,
  updateFormEntire,
  clearForm,
  addChatMessage,
  updateChatMessagePending,
  setHighlightedFields,
  clearHighlightedField,
  setHistory,
  addInteractionToHistory,
  deleteInteractionFromHistory,
  updateInteractionInHistory,
  setLoading,
  setError
} = interactionSlice.actions;

export default interactionSlice.reducer;
