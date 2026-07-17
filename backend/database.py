import os
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Text, Date, Time, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import enum
from dotenv import load_dotenv

load_dotenv()

# Use PostgreSQL by default, fallback to SQLite for local ease of use
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hcp_crm")

# For SQLite compatibility during local testing
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SentimentEnum(str, enum.Enum):
    Positive = "Positive"
    Neutral = "Neutral"
    Negative = "Negative"

class HCPInteractionModel(Base):
    __tablename__ = "hcp_interactions"

    id = Column(String(50), primary_key=True, index=True)
    hcp_name = Column(String(100), nullable=False, index=True)
    interaction_type = Column(String(50), default="Meeting")
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=True)
    attendees = Column(String(255), nullable=True)
    topics_discussed = Column(Text, nullable=True)
    materials_shared = Column(String(255), nullable=True)
    samples_distributed = Column(String(255), nullable=True)
    sentiment = Column(String(20), nullable=True) # "Positive", "Neutral", "Negative"
    outcomes = Column(Text, nullable=True)
    follow_up_actions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
