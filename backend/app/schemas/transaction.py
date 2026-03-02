from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

class CreateTransaction(BaseModel):
    date: datetime = Optional[datetime.now]
    amount: float
    category: Optional[str] = "UNCATEGORIZED"
    subscription_id: Optional[int] = None
    goal_id: Optional[int] = None
    description: str

    @field_validator("amount")
    @classmethod
    def amount_validator(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v

class CategorizeRequest(BaseModel):
    category: str

class ViewTransaction(BaseModel):
    id: int
    date: datetime
    amount: float
    category: str
    subscription_id: int | None = None
    goal_id: int | None = None
    description: str

    class config:
        from_attribute = False


