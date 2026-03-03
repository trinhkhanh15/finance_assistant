from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from repo.repositories import UserRepository, SavingRepository, SubscriptionRepository, TransactionRepository

async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

async def get_user_repo(db: AsyncSession = Depends(get_db)):
    return UserRepository(db)

def get_saving_repo(db: AsyncSession = Depends(get_db)):
    return SavingRepository(db)

def get_transaction_repo(db: AsyncSession = Depends(get_db)):
    return TransactionRepository(db)

def get_subscription_repo(db: AsyncSession = Depends(get_db)):
    return SubscriptionRepository(db)