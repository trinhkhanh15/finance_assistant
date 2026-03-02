from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Body
from dependancies import get_user_repo, get_transaction_repo, get_subscription_repo
from business_logic.transaction import process_transaction, view_uncategorized_transaction, categorize_transaction, \
    import_csv_transactions, get_transaction_behavior, get_transaction_structure
from repo.repositories import TransactionRepository, UserRepository, SubscriptionRepository
from typing import Annotated, List
from core.security.token import get_current_user
from schemas import user as sche_user, transaction as sche_transaction
import io

router = APIRouter()

@router.post("/manual", status_code=status.HTTP_201_CREATED)
async def create_manual(request: sche_transaction.CreateTransaction,
                  current_user: Annotated[sche_user.User, Depends(get_current_user)] = None,
                  user_repo: UserRepository = Depends(get_user_repo),
                  transaction_repo: TransactionRepository = Depends(get_transaction_repo),
                  subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)):
    user_id = current_user.id
    try:
        new_transaction = await process_transaction(user_id, request, user_repo, transaction_repo, subscription_repo)
        return new_transaction
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/import_csv", status_code=status.HTTP_201_CREATED)
async def upload_csv(file: UploadFile = File(...),
                     current_user: Annotated[sche_user.User, Depends(get_current_user)] = None,
                     user_repo: UserRepository = Depends(get_user_repo),
                     transaction_repo: TransactionRepository = Depends(get_transaction_repo),
                     subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)):
    user_id = current_user.id
    try:
        contents = await file.read()
        csv_data = io.BytesIO(contents)
        result = await import_csv_transactions(user_id, csv_data, user_repo, transaction_repo, subscription_repo)
        return {"message": f"Successfully imported {result['success']} transactions", "failed": result['failed']}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/view_uncategorized_transactions", status_code=status.HTTP_200_OK, response_model=List[sche_transaction.ViewTransaction])
async def view(current_user: Annotated[sche_user.User, Depends(get_current_user)],
               transaction_repo: TransactionRepository = Depends(get_transaction_repo),):
    user_id = current_user.id
    return await view_uncategorized_transaction(user_id, transaction_repo)

@router.put("/categorize/{transaction_id}", status_code=status.HTTP_200_OK)
async def categorize(transaction_id: int,
                     current_user: Annotated[sche_user.User, Depends(get_current_user)],
                     data: str = Body(..., embed=True), # Dùng embed=True để nhận dạng JSON { "data": "value" }
                     transaction_repo: TransactionRepository = Depends(get_transaction_repo)):
    user_id = current_user.id
    try:
        transaction = await categorize_transaction(user_id, transaction_id, data, transaction_repo)
        return transaction
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/view_pie_chart/{cycle}", status_code=status.HTTP_200_OK)
async def get_pie_chart_data(cycle: str,
                                current_user: Annotated[sche_user.User, Depends(get_current_user)],
                                transaction_repo: TransactionRepository = Depends(get_transaction_repo)):
    user_id = current_user.id
    return await get_transaction_structure(user_id, cycle, transaction_repo,)

@router.get("/view_behavior/{cycle}", status_code=status.HTTP_200_OK)
async def get_behavior_data(cycle: str,
                            current_user: Annotated[sche_user.User, Depends(get_current_user)],
                            transaction_repo: TransactionRepository = Depends(get_transaction_repo)):
    user_id = current_user.id
    return await get_transaction_behavior(user_id, cycle, transaction_repo,)


