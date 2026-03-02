from datetime import date, datetime
from repo.repositories import SavingRepository, UserRepository, TransactionRepository
from schemas import saving as sche_saving, transaction as sche_transaction
from core.log.logging_activity import log_activity

async def validate_target(goal_id: int, user_id: int, saving_repo: SavingRepository):
    goal = await saving_repo.get_by_id(goal_id)
    if not goal:
        msg = f"Target ID={goal_id} not found."
        log_activity(msg, "error")
        raise Exception("Target not found")
    if goal.user_id != user_id:
        msg = f"Target ID={goal_id} does not belong to the user ID={user_id}."
        log_activity(msg, "error")
        raise Exception("Target does not belong to the user")

    return goal

async def create_target(goal_id: int, data: sche_saving.CreateTarget, saving_repo: SavingRepository):
    new_target = await saving_repo.create(goal_id, data)
    msg = f"Created saving target ID={new_target.id} for user ID={new_target.user_id} successfully"
    log_activity(msg, "info")
    return new_target

async def check_target_failed(goal_id: int, saving_repo: SavingRepository):
    goal = await saving_repo.get_by_id(goal_id)
    if not goal:
        raise ValueError("Target not found")
    
    today = date.today()
    if goal.end_date and today > goal.end_date:
        if goal.current_amount < goal.target_amount and goal.status != "Completed":
            return True
    return False


async def deposit_to_target(goal_id: int, amount: float, user_id: int, saving_repo: SavingRepository, user_repo: UserRepository, transaction_repo: TransactionRepository):
    await validate_target(goal_id, user_id, saving_repo)

    await saving_repo.check_and_update_failed_status(goal_id)
    goal = await saving_repo.get_by_id(goal_id)
    
    if goal.status == "Completed":
        msg = f"Target ID={goal_id} for user ID={user_id} is already completed."
        log_activity(msg, "error")
        raise ValueError("Target is already completed")
    if goal.status == "Failed":
        msg = f"Target ID={goal_id} for user ID={user_id} is already failed."
        log_activity(msg, "error")
        raise ValueError("Target has failed and cannot accept deposits")
    
    previous_status = goal.status
    
    remaining_amount_needed = goal.target_amount - goal.current_amount
    
    if remaining_amount_needed < amount:
        msg = f"The deposit amount must less than remaining amount needed for target ID={goal_id}."
        log_activity(msg, "error")
        raise Exception(msg)
    else:
        msg = f"Deposit to target ID={goal_id} for user ID={user_id} successfully."
        log_activity(msg, "info")
        updated_goal = await saving_repo.update_current_amount(goal_id, amount)
        await create_transaction(goal_id, user_id, amount, transaction_repo, False)
    
    if updated_goal.status == "Completed" and previous_status != "Completed":
        msg = f"Target ID={goal_id} is completed."
        log_activity(msg, "info")
        await withdraw_target(goal_id, updated_goal.current_amount, user_id, saving_repo, user_repo, transaction_repo)

    return updated_goal


async def delete_target(goal_id: int, user_id: int, saving_repo: SavingRepository):
    await validate_target(goal_id, user_id, saving_repo)
    result = await saving_repo.delete(goal_id)
    if result:
        msg = f"Deleted saving target ID={goal_id} for user ID={user_id} successfully"
        log_activity(msg, "info")
    return result


async def withdraw_target(goal_id: int,
                    amount: float,
                    user_id: int,
                    saving_repo: SavingRepository,
                    user_repo: UserRepository,
                    transaction_repo: TransactionRepository):
    goal = await validate_target(goal_id, user_id, saving_repo)
    if goal.current_amount < amount:
        msg = f"Saving target ID={goal_id} does not have enough amount to withdraw."
        log_activity(msg, "error")
        raise Exception(msg)
    await user_repo.update_balance(user_id, amount)
    new_transaction = await create_transaction(goal_id, user_id, amount, transaction_repo, True)
    await saving_repo.update_current_amount(goal_id, -amount)
    msg = f"Withdraw from target ID={goal_id} for user ID={user_id} successfully."
    log_activity(msg, "info")
    return new_transaction

async def create_transaction(goal_id: int,
                       user_id: int,
                       amount: float,
                       transaction_repo: TransactionRepository,
                       is_withdraw: bool):
    new_transaction = sche_transaction.CreateTransaction(
        amount=amount,
        date=datetime.now(),
        category="income" if is_withdraw else "investment",
        goal_id=goal_id,
        description="Withdraw" if is_withdraw else "Deposit"
    )
    await transaction_repo.create(user_id, new_transaction, False)
    return new_transaction


async def get_current_targets(user_id: int, saving_repo: SavingRepository):
    return await saving_repo.get_by_user_id_and_status(user_id, "Processing")

async def get_all_targets(user_id: int, saving_repo: SavingRepository):
    return await saving_repo.get_all_by_user_id(user_id)

