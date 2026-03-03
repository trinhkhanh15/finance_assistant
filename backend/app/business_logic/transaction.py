from schemas.transaction import CreateTransaction
from repo.repositories import TransactionRepository, SubscriptionRepository, UserRepository
from business_logic.subscription import trigger_subscription
from business_logic.user import update_balance
from core.log.logging_activity import log_activity
from datetime import datetime, timedelta, date
import pandas as pd
import io

async def process_transaction(
        user_id: int,
        data: CreateTransaction,
        user_repo: UserRepository,
        transaction_repo: TransactionRepository,
        subscription_repo: SubscriptionRepository):
    data = await trigger_subscription(user_id, data, subscription_repo)
    amount = data.amount
    if data.category.lower() != "income":
        is_valid = await validate_insufficient_transaction(user_id, amount, user_repo)
        if not is_valid:
            new_transaction = await create(user_id, data, transaction_repo, insufficient_balance=True)
        else:
            await update_balance(user_id, -amount, user_repo)
            new_transaction = await create(user_id, data, transaction_repo, insufficient_balance=False)
    else:
        await update_balance(user_id, amount, user_repo)
        new_transaction = await create(user_id, data, transaction_repo, insufficient_balance=False)
    return new_transaction


async def create(user_id: int, data: CreateTransaction, transaction_repo: TransactionRepository, insufficient_balance: bool):
    new_transaction = await transaction_repo.create(user_id, data, insufficient_balance)
    if insufficient_balance:
        msg = f"Transaction ID={new_transaction.id} for user ID={user_id} failed: insufficient balance"
        log_activity(msg, "error")
    else:
        msg = f"Created transaction ID={new_transaction.id} for user ID={user_id} successfully"
        log_activity(msg, "info")
    return new_transaction


async def validate_insufficient_transaction(user_id: int, amount: float, user_repo: UserRepository):
    current_user = await user_repo.get_by_id(user_id)
    current_balance = current_user.balance
    if amount > current_balance:
        return False
    return True


async def view_uncategorized_transaction(user_id: int,
                                         transaction_repo: TransactionRepository):
    return await transaction_repo.view_uncategorized_transaction(user_id)


async def validate_transaction(user_id: int,
                               transaction_id: int,
                               transaction_repo: TransactionRepository):
    transaction = await transaction_repo.get_by_id(transaction_id)
    if not transaction:
        msg = f"Transaction ID={transaction_id} does not exist."
        log_activity(msg, "error")
        raise Exception(msg)
    if transaction.user_id != user_id:
        msg = f"Transaction ID={transaction_id} does not belong to user ID={user_id}."
        log_activity(msg, "error")
        raise Exception(msg)
    return transaction


async def categorize_transaction(user_id: int,
                                 transaction_id: int,
                                 data: str,
                                 transaction_repo: TransactionRepository):
    transaction = await validate_transaction(user_id, transaction_id, transaction_repo)
    if transaction.category.lower() != "uncategorized":
        msg = f"Transaction ID={transaction_id} has been already categorized."
        log_activity(msg, "error")
        raise Exception(msg)
    transaction = await transaction_repo.categorize(transaction_id, data)
    return transaction


def get_period(cycle: str):
    end_date = datetime.now().date()
    if cycle == "monthly":
        start_date = datetime(end_date.year, end_date.month, 1).date()
    elif cycle == "weekly":
        start_date = end_date - timedelta(days=end_date.weekday())
    return start_date, end_date


async def get_transaction_structure(user_id: int,
                                    cycle: str,
                                    transaction_repo: TransactionRepository):
    start_date, end_date = get_period(cycle)

    category_map = await transaction_repo.get_spending_structure(user_id, start_date, end_date)
    all_spending = await transaction_repo.get_all_spending(user_id, start_date, end_date)
    category_map["all_spending"] = all_spending
    category_map["start_date"] = start_date
    category_map["end_date"] = end_date

    return category_map

async def get_transaction_behavior(user_id: int,
                                   cycle: str,
                                   transaction_repo: TransactionRepository):
    start_date, end_date = get_period("monthly")

    if cycle == "monthly":
        return await transaction_repo.get_monthly_spending(user_id, start_date, end_date)
    elif cycle == "weekly":
        return await transaction_repo.get_weekly_spending(user_id, start_date, end_date)
    return None

async def import_csv_transactions(
        user_id: int,
        csv_data: io.BytesIO,
        user_repo: UserRepository,
        transaction_repo: TransactionRepository,
        subscription_repo: SubscriptionRepository):

    result = {"success": 0, "failed": 0}
    
    try:
        df = pd.read_csv(csv_data)
    except Exception as e:
        msg = f"Failed to read CSV file for user ID={user_id}: {str(e)}"
        log_activity(msg, "error")
        raise ValueError(f"Invalid CSV file: {str(e)}")
    
    if df.empty:
        msg = f"CSV file is empty for user ID={user_id}"
        log_activity(msg, "error")
        raise ValueError("CSV file is empty")
    
    required_fields = ["date", "amount", "category", "description"]
    missing_fields = [field for field in required_fields if field not in df.columns]
    
    if missing_fields:
        msg = f"CSV file missing required columns for user ID={user_id}: {missing_fields}"
        log_activity(msg, "error")
        raise ValueError(f"Missing required columns: {missing_fields}")
    
    for idx, row in df.iterrows():
        try:
            try:
                transaction_date = pd.to_datetime(row["date"]).to_pydatetime()
            except Exception as e:
                raise ValueError(f"Invalid date format: {row['date']}. Use YYYY-MM-DD format")
            
            try:
                amount = float(row["amount"])
                if amount <= 0:
                    raise ValueError("Amount must be greater than 0")
            except (ValueError, TypeError) as e:
                raise ValueError(f"Invalid amount: {row['amount']}. {str(e)}")
            
            category = str(row["category"]).strip() if pd.notna(row["category"]) else "UNCATEGORIZED"
            
            description = str(row["description"]).strip() if pd.notna(row["description"]) else ""
            
            subscription_id = None
            if "subscription_id" in df.columns and pd.notna(row["subscription_id"]):
                try:
                    subscription_id = int(row["subscription_id"])
                except (ValueError, TypeError):
                    raise ValueError(f"Invalid subscription_id: {row['subscription_id']}")
            
            goal_id = None
            if "goal_id" in df.columns and pd.notna(row["goal_id"]):
                try:
                    goal_id = int(row["goal_id"])
                except (ValueError, TypeError):
                    raise ValueError(f"Invalid goal_id: {row['goal_id']}")
            
            transaction_data = CreateTransaction(
                date=transaction_date,
                amount=amount,
                category=category,
                subscription_id=subscription_id,
                goal_id=goal_id,
                description=description
            )
            
            new_transaction = await process_transaction(user_id, transaction_data, user_repo, transaction_repo, subscription_repo)
            result["success"] += 1
            
        except Exception as e:
            result["failed"] += 1
            msg = f"Failed to import transaction at row {idx + 2} for user ID={user_id}: {str(e)}"
            log_activity(msg, "error")
    
    msg = f"CSV import completed for user ID={user_id}: {result['success']} success, {result['failed']} failed"
    log_activity(msg, "info")
    
    return result








