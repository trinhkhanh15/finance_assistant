from repo.repositories import SubscriptionRepository, UserRepository, TransactionRepository
from schemas import transaction as sche_transaction, subscription as sche_subscription
from core.log.logging_activity import log_activity
from datetime import timedelta, date, datetime

async def validate_subscription(user_id,
                          subscription_id: int,
                          subscription_repo: SubscriptionRepository):
    subscription = await subscription_repo.get_by_id(subscription_id)
    if not subscription:
        msg = f"Subscription ID={subscription_id} not found."
        log_activity(msg, "error")
        raise Exception(msg)
    elif subscription.user_id != user_id:
        msg = f"Subscription ID={subscription_id} does not belong to user ID={user_id}."
        log_activity(msg, "error")
        raise Exception(msg)
    return subscription

async def trigger_subscription(user_id: int,
                         data: sche_transaction.CreateTransaction,
                         subscription_repo: SubscriptionRepository):
    if data.category.lower() == "subscription":
        service_name = data.description
        subscription_query = await subscription_repo.get_subscription_by_user(user_id, service_name)
        if not subscription_query:
            msg = f"The subscription of user ID={user_id} - service '{service_name}' has not been declared."
            log_activity(msg, "warning")
        else:
            subscription_id = subscription_query.id
            data.subscription_id = subscription_id
            await update_next_billing_date(user_id, subscription_id, subscription_repo)
            msg = f"Paid for subscription ID={subscription_id} - service '{service_name}' successfully."
            log_activity(msg, "info")

    return data

async def check_billing_date(user_id: int,
                       subscription_id: int,
                       user_repo: UserRepository,
                       transaction_repo: TransactionRepository,
                       subscription_repo: SubscriptionRepository,):
    current_subscription = await validate_subscription(user_id, subscription_id, subscription_repo)
    now = date.today()
    next_billing_date = current_subscription.next_billing_date
    if next_billing_date == now:
        new_transaction = sche_transaction.CreateTransaction(
            amount=current_subscription.amount,
            description=current_subscription.service_name,
            date=datetime.now(),
            category="subscription",
        )
        from business_logic.transaction import process_transaction
        await process_transaction(user_id, new_transaction, user_repo, transaction_repo, subscription_repo)

async def update_next_billing_date(user_id: int,
                             subscription_id: int,
                             subscription_repo: SubscriptionRepository):
    current_subscription = await validate_subscription(user_id, subscription_id, subscription_repo)

    cycle_dict = {"monthly": 30, "weekly": 7, "quarterly": 90, "yearly": 365}
    cycle = cycle_dict.get(current_subscription.billing_cycle)
    next_billing_date = current_subscription.next_billing_date + timedelta(days=cycle)

    await subscription_repo.update_next_billing_date(subscription_id, next_billing_date)

async def create_manually(user_id: int, data: sche_subscription.CreateSubscription, subscription_repo: SubscriptionRepository):
    new_subscription = await subscription_repo.create(user_id, data)
    if not new_subscription:
        msg = f"Subscription '{data.service_name}' for user ID={user_id} has already been declared"
        log_activity(msg, "error")
        raise Exception(msg)
    msg = f"Created subscription ID={new_subscription.id} for user ID={user_id} - service '{data.service_name}' successfully"
    log_activity(msg, "info")
    return new_subscription

async def show_my_subscriptions(user_id: int, subscription_repo: SubscriptionRepository):
    return await subscription_repo.my_subscription(user_id)

async def delete_subscription(user_id: int, subscription_id: int, subscription_repo: SubscriptionRepository):
    await validate_subscription(user_id, subscription_id, subscription_repo)
    result = await subscription_repo.delete(subscription_id)
    if result:
        msg = f"Deleted subscription ID={subscription_id} for user ID={user_id} successfully"
        log_activity(msg, "info")
        return result
    return result






