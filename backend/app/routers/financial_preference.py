from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from schemas import user as sche_user
from schemas.financial_preference import FinancialPreferenceData
from dependancies import get_user_repo, get_saving_repo, get_transaction_repo
from repo.repositories import UserRepository, SavingRepository, TransactionRepository
from business_logic.financial_preference import get_financial_preference_data
from core.security.token import get_current_user

router = APIRouter()

@router.get("/financial_preference", status_code=status.HTTP_200_OK, response_model=FinancialPreferenceData)
async def get_preference(
    current_user: Annotated[sche_user.User, Depends(get_current_user)] = None,
    user_repo: UserRepository = Depends(get_user_repo),
    saving_repo: SavingRepository = Depends(get_saving_repo),
    transaction_repo: TransactionRepository = Depends(get_transaction_repo)
):
    user_id = current_user.id
    try:
        preference_data = await get_financial_preference_data(user_id, user_repo, saving_repo, transaction_repo)
        return preference_data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
