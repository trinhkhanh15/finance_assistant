import models
from database import engine
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import user as sche_user, saving as sche_saving, transaction as sche_transaction, subscription as sche_subscription
from core.security.encryption import verity_password
from datetime import date

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

class BaseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

class UserRepository(BaseRepository):
    async def get_by_id(self, user_id: int):
        user = await self.db.execute(select(models.User).filter(models.User.id == user_id))
        return user.scalars().first()

    async def get_by_name(self, username: str):
        user = await self.db.execute(select(models.User).filter(models.User.username == username))
        return user.scalars().first()

    async def validate_user(self, username: str, password: str):
        user_execute = await self.get_by_name(username)
        if not user_execute:
            return None
        if not verity_password(password, str(user_execute.password)):
            return None
        return True


    async def create(self, user: sche_user.CreateUser):
        new_user = models.User(
            username=user.username,
            password=user.password,
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user

    async def update_balance(self, user_id: int, amount: float):
        user = await self.get_by_id(user_id)
        if not user:
            return None
        user.balance += amount
        await self.db.commit()
        await self.db.refresh(user)
        return user

class SavingRepository(BaseRepository):
    async def create(self, user_id: int, target: sche_saving.CreateTarget):
        new_target = models.FinanceGoal(
            user_id=user_id,
            name=target.name,
            description=target.description,
            start_date=target.start_date,
            end_date=target.end_date,
            current_amount=target.current_amount,
            target_amount=target.target_amount,
        )
        self.db.add(new_target)
        await self.db.commit()
        await self.db.refresh(new_target)
        return new_target

    async def get_by_id(self, goal_id: int):
        target = await self.db.execute(select(models.FinanceGoal).filter(models.FinanceGoal.id == goal_id))
        return target.scalars().first()

    async def get_by_user_id_and_status(self, user_id: int, status: str):
        list_target = await self.db.execute(select(models.FinanceGoal).filter(
            models.FinanceGoal.user_id == user_id,
            models.FinanceGoal.status == status
        ))
        return list_target.scalars().all()

    async def get_all_by_user_id(self, user_id: int):
        list_target = await self.db.execute(select(models.FinanceGoal).filter(
            models.FinanceGoal.user_id == user_id
        ))
        return list_target.scalars().all()

    async def update_current_amount(self, goal_id: int, amount: float):
        goal = await self.get_by_id(goal_id)
        if not goal:
            return None
        goal.current_amount += amount
        if goal.current_amount >= goal.target_amount:
            goal.status = "Completed"
        await self.db.commit()
        await self.db.refresh(goal)
        return goal

    async def check_and_update_failed_status(self, goal_id: int):
        goal = await self.get_by_id(goal_id)
        if not goal:
            return None
        from datetime import date
        today = date.today()
        if goal.end_date and today > goal.end_date and goal.current_amount < goal.target_amount and goal.status != "Completed":
            goal.status = "Failed"
            await self.db.commit()
            await self.db.refresh(goal)
        return goal

    async def delete(self, goal_id: int):
        goal = await self.get_by_id(goal_id)
        if not goal:
            return False
        await self.db.delete(goal)
        await self.db.commit()
        return True

class TransactionRepository(BaseRepository):
    async def create(self, user_id: int, data: sche_transaction.CreateTransaction, insufficient_balance):
        if insufficient_balance:
            description = "INSUFFICIENT_BALANCE"
        else:
            description = data.description
        new_transaction = models.Transaction(
            user_id=user_id,
            date=data.date,
            amount=data.amount,
            category=data.category,
            subscription_id=data.subscription_id,
            goal_id=data.goal_id,
            description=description,
        )
        self.db.add(new_transaction)
        await self.db.commit()
        await self.db.refresh(new_transaction)
        return new_transaction

    async def categorize(self, transaction_id: int, data: str):
        transaction = await self.get_by_id(transaction_id)
        transaction.category = data
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def view_uncategorized_transaction(self, user_id: int):
        list_transaction = await self.db.execute(select(models.Transaction).filter(
            models.Transaction.user_id == user_id,
            models.Transaction.category == "uncategorized"
        ))
        return list_transaction.scalars().all()

    async def get_by_id(self, transaction_id: int):
        transaction = await self.db.execute(select(models.Transaction).filter(
            models.Transaction.id == transaction_id
        ))
        return transaction.scalars().first()

    # spending structure
    async def get_spending_structure(self, user_id: int, start_date: date, end_date: date):
        spending_query = select(
            models.Transaction.category,
            func.sum(models.Transaction.amount).label("total"),
        ).filter(
            models.Transaction.user_id == user_id,
            func.date(models.Transaction.date) >= start_date,
            func.date(models.Transaction.date) <= end_date
        ).group_by(models.Transaction.category)

        result = await self.db.execute(spending_query)
        spending_structure = {row.category: row.total for row in result.all()}
        return spending_structure

    async def get_all_spending(self, user_id: int, start_date: date, end_date: date):
        spending_obj = await self.db.execute(select(func.sum(models.Transaction.amount)).filter(
            models.Transaction.user_id == user_id,
            func.date(models.Transaction.date) >= start_date,
            func.date(models.Transaction.date) <= end_date,
            models.Transaction.category != "income"
        ))
        return spending_obj.scalar() or 0

    # spending behavior
    async def get_monthly_spending(self, user_id: int, start_date: date, end_date: date):
        spending_query = select(
            func.date(models.Transaction.date).label("day"),
            func.sum(models.Transaction.amount).label("total"),
        ).filter(
            models.Transaction.user_id == user_id,
            func.date(models.Transaction.date) >= start_date,
            func.date(models.Transaction.date) <= end_date,
            models.Transaction.category != "income"
        ).group_by(
            func.date(models.Transaction.date)
        )

        result = await self.db.execute(spending_query)
        spending_map = {row.day: row.total for  row in result.all()}
        return spending_map

    async def get_weekly_spending(self, user_id: int, start_date: date, end_date: date):
        week_label = func.date_trunc("week", models.Transaction.date).label("week_start")

        spending_query = (
            select(
                week_label,
                func.sum(models.Transaction.amount).label("total"),
            )
            .filter(
                models.Transaction.user_id == user_id,
                func.date(models.Transaction.date) >= start_date,
                func.date(models.Transaction.date) <= end_date,
                models.Transaction.category != "income"
            )
            .group_by(week_label)
            .order_by("week_start")
        )

        result = await self.db.execute(spending_query)
        spending_map = {row.week_start.date(): row.total for row in result.all()}
        return spending_map

class SubscriptionRepository(BaseRepository):
    async def create(self, user_id: int, data: sche_subscription.CreateSubscription):
        subscription_query = await self.get_subscription_by_user(user_id, data.service_name)
        if subscription_query:
            return None

        new_subscription = models.Subscription(
            user_id=user_id,
            service_name=data.service_name.lower(),
            amount=data.amount,
            billing_cycle=data.billing_cycle,
            next_billing_date=data.next_billing_date,
            is_active=data.is_active,
        )

        self.db.add(new_subscription)
        await self.db.commit()
        await self.db.refresh(new_subscription)
        return new_subscription

    async def update_next_billing_date(self, subscription_id: int, new_next_billing_date: date):
        current_subscription = await self.get_by_id(subscription_id)
        if current_subscription:
            current_subscription.next_billing_date = new_next_billing_date
            await self.db.commit()
            await self.db.refresh(current_subscription)
        return current_subscription

    async def my_subscription(self, user_id: int):
        list_subscription = await self.db.execute(select(models.Subscription).filter(
            models.Subscription.user_id == user_id,
        ))
        return list_subscription.scalars().all()

    async def get_by_id(self, subscription_id: int):
        subscription = await self.db.execute(select(models.Subscription).filter(
            models.Subscription.id == subscription_id
        ))
        return subscription.scalars().first()
 

    async def get_subscription_by_user(self, user_id: int, service_name: str):
        subscription = await self.db.execute(select(models.Subscription).filter(
            models.Subscription.user_id == user_id,
            models.Subscription.service_name == service_name.lower()
        ))
        return subscription.scalars().first()
    
    async def delete(self, subscription_id: int):
        subscription = await self.get_by_id(subscription_id)
        print(subscription_id)
        if not subscription:
            return False
        await self.db.delete(subscription)
        await self.db.commit()
        return True















