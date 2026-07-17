import os
import json
from typing import TypedDict, List, Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()

# Setup Groq LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
llm = ChatGroq(
    temperature=0.1,
    model_name="gemma2-9b-it",
    groq_api_key=GROQ_API_KEY
)

# 1. State Definition
class AgentState(TypedDict):
    message: str
    current_form: Dict[str, Any]
    parsed_fields: Dict[str, Any]
    reply: str
    chat_history: List[Dict[str, str]]

# --- THE 5 MANDATORY TOOLS (Implemented as helper tools/functions) ---

def log_interaction_tool(text_input: str) -> Dict[str, Any]:
    """
    Tool 1: Captures unstructured chat input, extracts entities (HCP name, topics, etc.)
    using the LLM, and formats it into structured JSON matching the database schema.
    """
    prompt = f"""
    You are an expert medical CRM extractor. Extract details from this unstructured text:
    "{text_input}"

    Output a valid JSON object with the following fields (ONLY if mentioned or clearly inferred, otherwise use null):
    - hcpName: Name of the HCP (e.g. Dr. John Doe)
    - interactionType: "Meeting", "Phone Call", "Email", "Webinar", "Seminar", or "Other"
    - date: Date in YYYY-MM-DD format (use 2026-07-17 if today is mentioned)
    - time: Time in HH:MM format
    - attendees: Names of other participants
    - topicsDiscussed: Medical or clinical topics, trials, or products discussed
    - outcomes: Decisions, responses, or outcomes of the discussion
    """
    response = llm.invoke([SystemMessage(content=prompt), HumanMessage(content="Extract the JSON:")])
    try:
        # Clean markdown wrappers if present
        text = response.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        return {}

def edit_interaction_tool(text_input: str, current_fields: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool 2: Allows modification of previously logged data if the user submits a correction via chat.
    """
    prompt = f"""
    The user wants to edit or correct the current CRM fields based on this input: "{text_input}"
    Here are the current fields:
    {json.dumps(current_fields, indent=2)}

    Apply the edits/corrections mentioned in the input and return the updated state as a single JSON object.
    Do not alter fields that were not requested to change.
    """
    response = llm.invoke([SystemMessage(content=prompt), HumanMessage(content="Return the updated JSON:")])
    try:
        text = response.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        return current_fields

def sentiment_analyzer_tool(interaction_summary: str) -> str:
    """
    Tool 3: Evaluates the interaction summary to classify the sentiment as strictly Positive, Neutral, or Negative.
    """
    prompt = f"""
    Analyze the sentiment of the following interaction details and classify it strictly as one of:
    - Positive
    - Neutral
    - Negative

    Interaction summary: "{interaction_summary}"
    Return ONLY the single word classification (Positive, Neutral, or Negative).
    """
    response = llm.invoke([SystemMessage(content=prompt)])
    sentiment = response.content.strip()
    for choice in ["Positive", "Neutral", "Negative"]:
        if choice.lower() in sentiment.lower():
            return choice
    return "Neutral"

def material_sample_locator_tool(text_input: str) -> Dict[str, str]:
    """
    Tool 4: Scans text for mentions of distributed items (e.g., brochures, samples) and standardizes them.
    """
    prompt = f"""
    Scan this text for mentions of distributed items, specifically marketing materials shared (brochures, leaflets, clinical papers)
    or drug starter samples given to the HCP:
    "{text_input}"

    Output a JSON object with:
    - materialsShared: Standardized description of materials shared (or null)
    - samplesDistributed: Standardized description of drug starter samples (or null)
    """
    response = llm.invoke([SystemMessage(content=prompt), HumanMessage(content="Extract materials and samples JSON:")])
    try:
        text = response.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        return {"materialsShared": None, "samplesDistributed": None}

def followup_action_generator_tool(context_summary: str) -> str:
    """
    Tool 5: Evaluates the context to suggest specific next steps (e.g., scheduling a meeting, sending papers).
    """
    prompt = f"""
    Based on the following interaction context, generate 1 to 2 clear, concise action items / follow-ups
    for the medical representative (e.g. 'Schedule follow-up meeting in 2 weeks', 'Email the trial data sheet'):
    "{context_summary}"

    Return the follow-ups as a single clear sentence.
    """
    response = llm.invoke([SystemMessage(content=prompt)])
    return response.content.strip()


# --- LANGGRAPH NODE WORKFLOWS ---

def orchestrator_node(state: AgentState) -> Dict[str, Any]:
    """
    Main LangGraph Node: Decides whether this is a new log or an edit/correction,
    and runs the 5 tools accordingly to build the complete updated state.
    """
    user_msg = state["message"]
    curr_form = state["current_form"] or {}

    # Check if the message is an edit/correction of the current form
    is_correction_prompt = f"""
    Determine if this message is a correction, adjustment, or edit of an existing interaction form:
    "{user_msg}"
    Return strictly 'yes' or 'no'.
    """
    is_correction_res = llm.invoke([SystemMessage(content=is_correction_prompt)])
    is_correction = "yes" in is_correction_res.content.lower()

    # Step 1 & 2: Entity Extraction or Correction
    if is_correction and curr_form.get("hcpName"):
        parsed = edit_interaction_tool(user_msg, curr_form)
    else:
        parsed = log_interaction_tool(user_msg)
        # Merge keys with empty form
        temp = {
            "hcpName": "", "interactionType": "Meeting", "date": "2026-07-17", "time": "12:00",
            "attendees": "", "topicsDiscussed": "", "materialsShared": "", "samplesDistributed": "",
            "sentiment": "", "outcomes": "", "followUpActions": ""
        }
        temp.update(parsed)
        parsed = temp

    # Step 3: Sentiment Analyzer
    text_for_sentiment = f"{parsed.get('topicsDiscussed', '')} {parsed.get('outcomes', '')} {user_msg}"
    if text_for_sentiment.strip():
        parsed["sentiment"] = sentiment_analyzer_tool(text_for_sentiment)

    # Step 4: Material & Sample locator
    items = material_sample_locator_tool(user_msg)
    if items.get("materialsShared"):
        parsed["materialsShared"] = items["materialsShared"]
    if items.get("samplesDistributed"):
        parsed["samplesDistributed"] = items["samplesDistributed"]

    # Step 5: Follow-Up Action Generator
    context_for_followup = f"Topics: {parsed.get('topicsDiscussed', '')}. Outcomes: {parsed.get('outcomes', '')}. Input: {user_msg}"
    if context_for_followup.strip() and not parsed.get("followUpActions"):
        parsed["followUpActions"] = followup_action_generator_tool(context_for_followup)

    # Build reply
    hcp = parsed.get("hcpName", "the HCP")
    reply = f"I've analyzed the interaction for {hcp}. I classified the sentiment as {parsed.get('sentiment', 'Neutral')}, extracted topics, identified shared items, and generated recommended follow-ups. Let me know if you need any adjustments!"

    return {
        "parsed_fields": parsed,
        "reply": reply
    }


# --- LANGGRAPH GRAPH CONSTRUCT ---

def create_langgraph_agent():
    # Define state graph
    workflow = StateGraph(AgentState)

    # Add primary orchestrator node
    workflow.add_node("orchestrator", orchestrator_node)

    # Set entry point
    workflow.set_entry_point("orchestrator")

    # The orchestrator finishes the work
    workflow.add_edge("orchestrator", END)

    return workflow.compile()

# Instantiate the working LangGraph Agent
agent_app = create_langgraph_agent()

def run_agent(message: str, current_form: Dict[str, Any], chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Main execution wrapper for FastAPI endpoint
    """
    initial_state = {
        "message": message,
        "current_form": current_form,
        "parsed_fields": {},
        "reply": "",
        "chat_history": chat_history or []
    }
    
    result = agent_app.invoke(initial_state)
    return {
        "parsedFields": result["parsed_fields"],
        "reply": result["reply"]
    }
