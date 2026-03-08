from core.security.encryption import hash_password
from schemas.user import CreateUser
from repo.repositories import UserRepository
from core.log.logging_activity import log_activity


def encode_account(data: CreateUser):
    data.password = hash_password(data.password)
    return data

async def update_balance(user_id: int,
                   amount: float,
                   user_repo: UserRepository):
    new_update = await user_repo.update_balance(user_id, amount)
    return new_update

async def get_balance(user_id: int, user_repo: UserRepository):
    user = await user_repo.get_by_id(user_id)
    if not user:
        msg = f"User with id {user_id} doesn't exist"
        log_activity(msg, "error")
        raise ValueError(msg)
    return user.balance

async def set_budget(user_id: int, budget_data: dict, user_repo: UserRepository):
    updated_user = await user_repo.update_budget(user_id, budget_data)
    if not updated_user:
        msg = f"User with id {user_id} doesn't exist"
        log_activity(msg, "error")
        raise ValueError(msg)
    return updated_user

async def show_budget(user_id: int, user_repo: UserRepository):
    user = await user_repo.get_by_id(user_id)
    if not user:
        msg = f"User with id {user_id} doesn't exist"
        log_activity(msg, "error")
        raise ValueError(msg)
    return {
        "fad_budget": user.fad_budget or 0,
        "shopping_budget": user.shopping_budget or 0,
        "investment_budget": user.investment_budget or 0,
        "moving_budget": user.moving_budget or 0,
        "entertainment_budget": user.entertainment_budget or 0,
        "other_budget": user.other_budget or 0,
    }