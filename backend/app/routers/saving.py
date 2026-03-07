from fastapi import APIRouter, Depends, HTTPException, status, Body

from schemas import saving as sche_saving, user as sche_user
from dependancies import get_saving_repo, get_user_repo, get_transaction_repo, get_subscription_repo
from repo.repositories import SavingRepository, UserRepository, TransactionRepository, SubscriptionRepository
from typing import Annotated, List
from core.security.token import get_current_user
from business_logic.saving import deposit_to_target, delete_target, get_current_targets, get_all_targets, create_target, \
    withdraw_target, get_add_saving_amount

router = APIRouter()

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def  create(request: sche_saving.CreateTarget,
           saving_repo: SavingRepository = Depends(get_saving_repo),
           current_user: Annotated[sche_user.User, Depends(get_current_user)] = None):
    user_id = current_user.id
    return await create_target(user_id, request, saving_repo)

@router.get("/show_current", status_code=status.HTTP_200_OK, response_model=List[sche_saving.Target])
async def  show_current(saving_repo: SavingRepository = Depends(get_saving_repo),
                 current_user: Annotated[sche_user.User, Depends(get_current_user)] = None):
    user_id = current_user.id
    return await get_current_targets(user_id, saving_repo)

@router.get("/show_all", status_code=status.HTTP_200_OK, response_model=List[sche_saving.Target])
async def  show_all(saving_repo: SavingRepository = Depends(get_saving_repo),
             current_user: Annotated[sche_user.User, Depends(get_current_user)] = None):
    user_id = current_user.id
    return await get_all_targets(user_id, saving_repo)

@router.post("/deposit/{goal_id}", status_code=status.HTTP_200_OK)
async def deposit(goal_id: int,
            request: sche_saving.DepositTarget,
            saving_repo: SavingRepository = Depends(get_saving_repo),
            user_repo: UserRepository = Depends(get_user_repo),
            transaction_repo: TransactionRepository = Depends(get_transaction_repo),
            subscription_repo: SavingRepository = Depends(get_subscription_repo),
            current_user: Annotated[sche_user.User, Depends(get_current_user)] = None):
    user_id = current_user.id
    try:
        updated_goal = await deposit_to_target(goal_id, request.amount, user_id, saving_repo, user_repo, transaction_repo, subscription_repo)
        return updated_goal
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/withdraw/{goal_id}", status_code=status.HTTP_200_OK)
async def withdraw(goal_id: int,
             amount: float,
             saving_repo: SavingRepository = Depends(get_saving_repo),
             user_repo: UserRepository = Depends(get_user_repo),
             transaction_repo: TransactionRepository = Depends(get_transaction_repo),
             subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
             current_user: Annotated[sche_user.User, Depends(get_current_user)] = None):
    user_id = current_user.id
    try:
        withdraw_request = await withdraw_target(goal_id, amount, user_id, saving_repo, user_repo, transaction_repo, subscription_repo)
        return withdraw_request
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/delete/{goal_id}", status_code=status.HTTP_200_OK)
async def delete(goal_id: int,
           saving_repo: SavingRepository = Depends(get_saving_repo),
           current_user: Annotated[sche_user.User, Depends(get_current_user)] = None):
    user_id = current_user.id
    try:
        result = await delete_target(goal_id, user_id, saving_repo)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get("/all_amount", status_code=status.HTTP_200_OK)
async def show(saving_repo: SavingRepository = Depends(get_saving_repo),
               current_user: Annotated[sche_user.User, Depends(get_current_user)] = None):
    user_id = current_user.id
    try: 
        result = await get_add_saving_amount(user_id, saving_repo)
        return {"amount": result}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))