import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HCPInteraction, ChatMessage, Sentiment, ReduxState } from "../types";

const initialFormState: HCPInteraction = {
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

const initialState: ReduxState = {
  currentForm: { ...initialFormState },
  history: [],
  chatHistory: [
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your AI-First CRM Assistant. Tell me about your interaction with a Healthcare Professional (HCP) in natural language, and I will automatically extract and log the structured details for you on the left.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        "Met with Dr. Emily Watson today at her clinic. Discussed clinical trial results for Cardiox-9. Shared the new efficacy brochure. Sentiment was very positive; she agreed to lead a roundtable next month.",
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
    updateFormField: (
      state,
      action: PayloadAction<{ field: keyof HCPInteraction; value: any }>
    ) => {
      const { field, value } = action.payload;
      (state.currentForm as any)[field] = value;
    },
    updateFormEntire: (state, action: PayloadAction<Partial<HCPInteraction>>) => {
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
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatHistory.push(action.payload);
    },
    updateChatMessagePending: (state, action: PayloadAction<{ id: string; text: string; parsedFields?: Partial<HCPInteraction> }>) => {
      const msg = state.chatHistory.find(m => m.id === action.payload.id);
      if (msg) {
        msg.text = action.payload.text;
        msg.isPending = false;
        msg.parsedFields = action.payload.parsedFields;
      }
    },
    setHighlightedFields: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.highlightedFields = {
        ...state.highlightedFields,
        ...action.payload
      };
    },
    clearHighlightedField: (state, action: PayloadAction<string>) => {
      delete state.highlightedFields[action.payload];
    },
    clearAllHighlights: (state) => {
      state.highlightedFields = {};
    },
    setHistory: (state, action: PayloadAction<HCPInteraction[]>) => {
      state.history = action.payload;
    },
    addInteractionToHistory: (state, action: PayloadAction<HCPInteraction>) => {
      state.history.unshift(action.payload);
    },
    deleteInteractionFromHistory: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },
    updateInteractionInHistory: (state, action: PayloadAction<HCPInteraction>) => {
      const index = state.history.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.history[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
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
  clearAllHighlights,
  setHistory,
  addInteractionToHistory,
  deleteInteractionFromHistory,
  updateInteractionInHistory,
  setLoading,
  setError
} = interactionSlice.actions;

export default interactionSlice.reducer;
