from fastapi import APIRouter, Depends, status, HTTPException
from dependancies import get_subscription_repo
from repo.repositories import SubscriptionRepository
from schemas import subscription as sche_subscription, user as sche_user
from business_logic.subscription import create_manually, show_my_subscriptions, delete_subscription
from typing import List, Annotated
from core.security.token import get_current_user

router = APIRouter()

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_subscription(request: sche_subscription.CreateSubscription,
                        subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
                        current_user: sche_user.User = Depends(get_current_user)):
    try:
        new_subscription = await create_manually(current_user.id, request, subscription_repo)
        return new_subscription
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", status_code=status.HTTP_200_OK, response_model=List[sche_subscription.ShowSubscription])
async def show(current_user: Annotated[sche_user.User, Depends(get_current_user)] = None,
         subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)):
    list_of_subscriptions = await show_my_subscriptions(current_user.id, subscription_repo)
    return list_of_subscriptions

@router.delete("/delete/{subscription_id}", status_code=status.HTTP_200_OK)
async def destroy(subscription_id: int, 
                  current_user: Annotated[sche_user.User, Depends(get_current_user)] = None,
                  subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)):
    try: 
        user_id = current_user.id
        subscription = await delete_subscription(user_id, subscription_id, subscription_repo)
        return subscription
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
 
    