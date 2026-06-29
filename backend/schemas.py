from datetime import datetime
from pydantic import BaseModel, EmailStr

# Auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}

# Scores
class ScoreCreate(BaseModel):
    score: int

class ScoreResponse(BaseModel):
    id: int
    score: int
    created_at: datetime

    model_config = {"from_attributes": True}

class LeaderboardEntry(BaseModel):
    rank: int
    email: str
    best_score: int
