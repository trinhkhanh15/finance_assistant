from datetime import date, datetime, timedelta
from repo.repositories import UserRepository, SavingRepository, TransactionRepository
from schemas.financial_preference import FinancialPreferenceData, MonthlyExpenseDetail, TransactionStats
from core.log.logging_activity import log_activity
from sqlalchemy import select, func
import models


async def get_financial_preference_data(user_id: int, 
                                       user_repo: UserRepository,
                                       saving_repo: SavingRepository,
                                       transaction_repo: TransactionRepository):
    """Get comprehensive financial preference data for ML model"""
    
    try:
        # Get user data
        user = await user_repo.get_by_id(user_id)
        if not user:
            msg = f"User with id {user_id} doesn't exist"
            log_activity(msg, "error")
            raise ValueError(msg)
        
        # Demographic features
        age = user.age
        sex = user.sex
        
        # Financial State Features
        income = user.balance  # Current balance as income proxy
        total_current_save = await saving_repo.get_add_saving_amount(user_id) or 0
        total_target_save = await saving_repo.get_total_target_save(user_id) or 0
        days_remaining = await saving_repo.get_nearest_end_date(user_id)
        
        # Current month expense
        today = date.today()
        month_start = date(today.year, today.month, 1)
        total_expense_this_month = await transaction_repo.get_all_spending(user_id, month_start, today)
        
        # Historical Expense Features (last 4 months including current)
        historical_expenses = []
        current_year = today.year
        current_month = today.month
        
        for i in range(4):
            # Calculate the month to retrieve
            target_month = current_month - i
            target_year = current_year
            
            # Adjust year if month goes to previous year
            if target_month <= 0:
                target_month += 12
                target_year -= 1
            
            # Calculate month start and end dates
            month_start = date(target_year, target_month, 1)
            
            # Calculate month end
            if target_month == 12:
                month_end = date(target_year, 12, 31)
            else:
                month_end = date(target_year, target_month + 1, 1) - timedelta(days=1)
            
            # For current month, use today as end date instead
            if i == 0:
                month_end = today
            
            total = await transaction_repo.get_all_spending(user_id, month_start, month_end)
            structure = await transaction_repo.get_spending_structure(user_id, month_start, month_end)
            
            # Calculate frequencies (count of transactions per category)
            frequencies = {}
            for category in structure.keys():
                # Count transactions for this category
                query = select(func.count(models.Transaction.id)).filter(
                    models.Transaction.user_id == user_id,
                    models.Transaction.category == category,
                    models.Transaction.description != "INSUFFICIENT_BALANCE",
                    func.date(models.Transaction.date) >= month_start,
                    func.date(models.Transaction.date) <= month_end
                )
                result = await transaction_repo.db.execute(query)
                frequencies[category] = result.scalar() or 0
            
            monthly_detail = MonthlyExpenseDetail(
                month=month_start.strftime("%Y-%m"),
                total_expense=total,
                category_amounts=structure,
                category_frequencies=frequencies
            )
            historical_expenses.append(monthly_detail)
        
        # Transaction Level Stats
        stats = await transaction_repo.get_transaction_stats(user_id)
        transaction_stats = TransactionStats(
            average_order_value=stats["average"],
            median_order_value=stats["median"]
        )
        
        # Assemble response
        preference_data = FinancialPreferenceData(
            age=age,
            sex=sex,
            income=income,
            total_current_save=total_current_save,
            total_target_save=total_target_save,
            total_expense_this_month=total_expense_this_month,
            days_remaining=days_remaining,
            historical_expenses=historical_expenses,
            transaction_stats=transaction_stats
        )
        
        msg = f"Retrieved financial preference data for user {user_id}"
        log_activity(msg, "info")
        
        return preference_data
        
    except Exception as e:
        msg = f"Error getting financial preference data for user {user_id}: {str(e)}"
        log_activity(msg, "error")
        raise
