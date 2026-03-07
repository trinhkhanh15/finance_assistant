from pydantic import BaseModel
from schemas.saving import Target
from typing import List

class CreateUser(BaseModel):
    username: str
    password: str
    age: int 
    sex: str

class User(BaseModel):
    username: str
    password: str

class ShowUserTarget(BaseModel):
    id: int
    username: str
    goals: List[Target]

    class Config:
        from_attributes = True

class SetBudget(BaseModel):
    fad_budget: int
    shopping_budget: int
    investment_budget: int
    moving_budget: int
    entertainment_budget: int
    other_budget: int

    class Config:
        from_attributes = True