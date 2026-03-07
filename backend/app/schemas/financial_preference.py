from pydantic import BaseModel
from typing import Dict, List
from datetime import date

class MonthlyExpenseDetail(BaseModel):
    month: str
    total_expense: float
    category_amounts: Dict[str, float]
    category_frequencies: Dict[str, int]

class TransactionStats(BaseModel):
    average_order_value: float
    median_order_value: float

class FinancialPreferenceData(BaseModel):
    # Demographic
    age: int
    sex: str
    
    # Financial State
    income: float
    total_current_save: float
    total_target_save: float
    total_expense_this_month: float
    days_remaining: int
    
    # Historical Expense (4 months)
    historical_expenses: List[MonthlyExpenseDetail]
    
    # Transaction Level Stats
    transaction_stats: TransactionStats
