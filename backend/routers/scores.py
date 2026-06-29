from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/scores", tags=["scores"])

@router.post("", response_model=schemas.ScoreResponse, status_code=201)
def save_score(
    body: schemas.ScoreCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = models.Score(user_id=current_user.id, score=body.score)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/me", response_model=list[schemas.ScoreResponse])
def my_scores(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Score)
        .filter(models.Score.user_id == current_user.id)
        .order_by(models.Score.score.desc())
        .limit(10)
        .all()
    )

@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db)):
    # 사용자별 최고 점수 집계 후 내림차순 정렬
    subq = (
        db.query(
            models.Score.user_id,
            func.max(models.Score.score).label("best_score"),
        )
        .group_by(models.Score.user_id)
        .subquery()
    )
    rows = (
        db.query(models.User.email, subq.c.best_score)
        .join(subq, models.User.id == subq.c.user_id)
        .order_by(subq.c.best_score.desc())
        .limit(10)
        .all()
    )
    return [
        schemas.LeaderboardEntry(rank=i + 1, email=email, best_score=best_score)
        for i, (email, best_score) in enumerate(rows)
    ]
