export enum Sentiment {
  Positive = "Positive",
  Neutral = "Neutral",
  Negative = "Negative"
}

export interface HCPInteraction {
  id?: string;
  hcpName: string;
  interactionType: string; // e.g. "Meeting", "Phone Call", "Webinar"
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  attendees: string;
  topicsDiscussed: string;
  materialsShared: string;
  samplesDistributed: string;
  sentiment: Sentiment | "";
  outcomes: string;
  followUpActions: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  parsedFields?: Partial<HCPInteraction>;
  suggestions?: string[];
  isPending?: boolean;
}

export interface ReduxState {
  currentForm: HCPInteraction;
  history: HCPInteraction[];
  chatHistory: ChatMessage[];
  highlightedFields: Record<string, boolean>; // tracks which fields to glow
  loading: boolean;
  error: string | null;
}
