from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from business_logic.user import encode_account, get_balance
from core.security.token import get_access_token
from schemas import user as sche_user
from typing import Annotated
from repo.repositories import UserRepository
from dependancies import get_user_repo
from core.security.token import get_current_user

router = APIRouter()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: sche_user.CreateUser, user_repo: UserRepository = Depends(get_user_repo)):
    new_user = encode_account(request)
    return await user_repo.create(new_user)

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(request: Annotated[OAuth2PasswordRequestForm, Depends()], user_repo: UserRepository = Depends(get_user_repo)):
    if await user_repo.validate_user(request.username, request.password):
        access_token = get_access_token({"sub": request.username})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

@router.get("/balance")
async def get_user_balance(current_user: Annotated[sche_user.User, Depends(get_current_user)] = None,
                           user_repo: UserRepository = Depends(get_user_repo)):
    return {"balance": await get_balance(current_user.id, user_repo)}





