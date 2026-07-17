from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import List, Optional, Dict, Any
import uuid

from database import init_db, get_db, HCPInteractionModel, SentimentEnum
from agent import run_agent

app = FastAPI(
    title="AI-First CRM HCP Module API",
    description="FastAPI Backend with SQLAlchemy and LangGraph Agent",
    version="1.0.0"
)

# Enable CORS for the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to initialize tables and seed data
@app.on_event("startup")
def startup_event():
    init_db()
    
    # Seed initial data if DB is empty
    db = next(get_db())
    if db.query(HCPInteractionModel).count() == 0:
        seed_logs = [
            HCPInteractionModel(
                id="seed-1",
                hcp_name="Dr. Emily Watson",
                interaction_type="Meeting",
                date=date(2026, 7, 15),
                time=time(14, 30),
                attendees="Rep Sarah Miller",
                topics_discussed="Discussed Cardiox-9 Phase III efficacy data and primary endpoints.",
                materials_shared="Cardiox-9 Efficacy Brochure, Trial Summary PDF",
                samples_distributed="10x Cardiox-9 10mg starter packs",
                sentiment="Positive",
                outcomes="Dr. Watson showed high interest and asked about formulary status.",
                follow_up_actions="Send formulary submission guidelines and schedule next visit in 2 weeks."
            ),
            HCPInteractionModel(
                id="seed-2",
                hcp_name="Dr. Sarah Jenkins",
                interaction_type="Phone Call",
                date=date(2026, 7, 16),
                time=time(10, 0),
                attendees="None",
                topics_discussed="Addressed safety profile inquiries regarding Cardiox-9 drug interactions.",
                materials_shared="Safety Datasheet V2, PI Document",
                samples_distributed="None",
                sentiment="Neutral",
                outcomes="Resolved the question; Dr. Jenkins remains cautious but informed.",
                follow_up_actions="Email medical information packet on safety profiles."
            )
        ]
        db.add_all(seed_logs)
        db.commit()
    db.close()


# --- PYDANTIC SCHEMAS ---

class HCPInteractionBase(BaseModel):
    hcpName: str = Field(..., alias="hcpName")
    interactionType: str = Field("Meeting", alias="interactionType")
    date: str # YYYY-MM-DD
    time: Optional[str] = None # HH:MM
    attendees: Optional[str] = None
    topicsDiscussed: Optional[str] = None, Field(None, alias="topicsDiscussed")
    materialsShared: Optional[str] = None, Field(None, alias="materialsShared")
    samplesDistributed: Optional[str] = None, Field(None, alias="samplesDistributed")
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    followUpActions: Optional[str] = None, Field(None, alias="followUpActions")

    class Config:
        populate_by_name = True
        from_attributes = True

class HCPInteractionCreate(HCPInteractionBase):
    pass

class HCPInteractionResponse(BaseModel):
    id: str
    hcpName: str
    interactionType: str
    date: str
    time: Optional[str] = None
    attendees: Optional[str] = None
    topicsDiscussed: Optional[str] = None
    materialsShared: Optional[str] = None
    samplesDistributed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    followUpActions: Optional[str] = None
    createdAt: datetime

    class Config:
        populate_by_name = True

class ChatRequest(BaseModel):
    message: str
    currentForm: Dict[str, Any] = Field(..., alias="currentForm")
    chatHistory: Optional[List[Dict[str, str]]] = Field(default=[], alias="chatHistory")


# --- ENDPOINTS ---

@app.get("/api/interactions", response_model=List[HCPInteractionResponse])
def get_interactions(db: Session = Depends(get_db)):
    logs = db.query(HCPInteractionModel).order_by(HCPInteractionModel.created_at.desc()).all()
    
    # Format database models to camelCase response matching frontend expectations
    response = []
    for log in logs:
        response.append(HCPInteractionResponse(
            id=log.id,
            hcpName=log.hcp_name,
            interactionType=log.interaction_type,
            date=log.date.strftime("%Y-%m-%d"),
            time=log.time.strftime("%H:%M") if log.time else None,
            attendees=log.attendees,
            topicsDiscussed=log.topics_discussed,
            materialsShared=log.materials_shared,
            samplesDistributed=log.samples_distributed,
            sentiment=log.sentiment,
            outcomes=log.outcomes,
            followUpActions=log.follow_up_actions,
            createdAt=log.created_at
        ))
    return response

@app.post("/api/interactions", response_model=HCPInteractionResponse, status_code=status.HTTP_201_CREATED)
def create_interaction(log_in: HCPInteractionCreate, db: Session = Depends(get_db)):
    try:
        # Parse Date and Time
        parsed_date = datetime.strptime(log_in.date, "%Y-%m-%d").date()
        parsed_time = None
        if log_in.time:
            parsed_time = datetime.strptime(log_in.time, "%H:%M").time()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date or time format. Error: {str(e)}")

    db_model = HCPInteractionModel(
        id=f"log-{uuid.uuid4().hex[:12]}",
        hcp_name=log_in.hcpName,
        interaction_type=log_in.interactionType,
        date=parsed_date,
        time=parsed_time,
        attendees=log_in.attendees,
        topics_discussed=log_in.topicsDiscussed,
        materials_shared=log_in.materialsShared,
        samples_distributed=log_in.samplesDistributed,
        sentiment=log_in.sentiment,
        outcomes=log_in.outcomes,
        follow_up_actions=log_in.followUpActions
    )
    
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    
    return HCPInteractionResponse(
        id=db_model.id,
        hcpName=db_model.hcp_name,
        interactionType=db_model.interaction_type,
        date=db_model.date.strftime("%Y-%m-%d"),
        time=db_model.time.strftime("%H:%M") if db_model.time else None,
        attendees=db_model.attendees,
        topicsDiscussed=db_model.topics_discussed,
        materialsShared=db_model.materials_shared,
        samplesDistributed=db_model.samples_distributed,
        sentiment=db_model.sentiment,
        outcomes=db_model.outcomes,
        followUpActions=db_model.follow_up_actions,
        createdAt=db_model.created_at
    )

@app.delete("/api/interactions/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interaction(log_id: str, db: Session = Depends(get_db)):
    db_model = db.query(HCPInteractionModel).filter(HCPInteractionModel.id == log_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(db_model)
    db.commit()
    return None

@app.put("/api/interactions/{log_id}", response_model=HCPInteractionResponse)
def update_interaction(log_id: str, log_in: HCPInteractionCreate, db: Session = Depends(get_db)):
    db_model = db.query(HCPInteractionModel).filter(HCPInteractionModel.id == log_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    try:
        parsed_date = datetime.strptime(log_in.date, "%Y-%m-%d").date()
        parsed_time = None
        if log_in.time:
            parsed_time = datetime.strptime(log_in.time, "%H:%M").time()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date or time format. Error: {str(e)}")

    db_model.hcp_name = log_in.hcpName
    db_model.interaction_type = log_in.interactionType
    db_model.date = parsed_date
    db_model.time = parsed_time
    db_model.attendees = log_in.attendees
    db_model.topics_discussed = log_in.topicsDiscussed
    db_model.materials_shared = log_in.materialsShared
    db_model.samples_distributed = log_in.samplesDistributed
    db_model.sentiment = log_in.sentiment
    db_model.outcomes = log_in.outcomes
    db_model.follow_up_actions = log_in.followUpActions

    db.commit()
    db.refresh(db_model)

    return HCPInteractionResponse(
        id=db_model.id,
        hcpName=db_model.hcp_name,
        interactionType=db_model.interaction_type,
        date=db_model.date.strftime("%Y-%m-%d"),
        time=db_model.time.strftime("%H:%M") if db_model.time else None,
        attendees=db_model.attendees,
        topicsDiscussed=db_model.topics_discussed,
        materialsShared=db_model.materials_shared,
        samplesDistributed=db_model.samples_distributed,
        sentiment=db_model.sentiment,
        outcomes=db_model.outcomes,
        followUpActions=db_model.follow_up_actions,
        createdAt=db_model.created_at
    )

@app.post("/api/agent/chat")
def agent_chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
    
    try:
        response = run_agent(
            message=payload.message,
            current_form=payload.currentForm,
            chat_history=payload.chatHistory
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Agent failed to execute: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
