from pydantic import BaseModel, field_validator, model_validator
from datetime import date

class CreateTarget(BaseModel):
    name: str
    description: str
    start_date: date
    end_date: date
    current_amount: float
    target_amount: float

    @model_validator(mode="after")
    def validate_amount(self):
        if self.current_amount >= self.target_amount:
            raise ValueError("Target amount cannot be greater than current amount")
        return self

    @model_validator(mode="after")
    def validate_date(self):
        if self.start_date >= self.end_date:
            raise ValueError("Start date cannot be before end date")
        return self

class DepositTarget(BaseModel):
    amount: float
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Deposit amount must be greater than 0")
        return v

class Target(BaseModel):
    id: int
    name: str
    description: str
    start_date: date
    end_date: date
    current_amount: float
    target_amount: float
    status: str

    class Config:
        from_attributes = True




