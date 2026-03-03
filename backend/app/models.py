from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, date, timezone


class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    balance = Column(Float, default=0.0)

    # Relationships
    transactions = relationship("Transaction", back_populates="owner")
    subscriptions = relationship("Subscription", back_populates="owner")
    goals = relationship("FinanceGoal", back_populates="owner")


class Transaction(Base):
    __tablename__ = "transaction"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    amount = Column(Float)
    category = Column(String)
    subscription_id = Column(Integer, ForeignKey("subscription.id"), nullable=True)
    goal_id = Column(Integer, ForeignKey("finance_goal.id"), nullable=True)
    description = Column(String)

    # Relationships
    owner = relationship("User", back_populates="transactions")
    subscription = relationship("Subscription", back_populates="transactions")
    goal = relationship("FinanceGoal", back_populates="transactions")


class Subscription(Base):
    __tablename__ = "subscription"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    service_name = Column(String)
    amount = Column(Float)
    billing_cycle = Column(String)
    next_billing_date = Column(Date)
    is_active = Column(Boolean, default=True)

    # Relationships
    owner = relationship("User", back_populates="subscriptions")
    transactions = relationship("Transaction", back_populates="subscription")

class FinanceGoal(Base):
    __tablename__ = "finance_goal"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    name = Column(String)
    description = Column(String)
    start_date = Column(Date, default=date.today)
    end_date = Column(Date)
    current_amount = Column(Float, default=0.0)
    target_amount = Column(Float)
    status = Column(String, default="Processing")

    # Relationships
    owner = relationship("User", back_populates="goals")
    transactions = relationship("Transaction", back_populates="goal")