from pydantic import BaseModel
from schemas.saving import Target
from typing import List

class CreateUser(BaseModel):
    username: str
    password: str

class User(BaseModel):
    username: str
    password: str

class ShowUserTarget(BaseModel):
    id: int
    username: str
    goals: List[Target]

    class Config:
        from_attributes = True