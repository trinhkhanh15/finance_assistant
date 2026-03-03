from pydantic import BaseModel
from datetime import date
from typing import Optional

class CreateSubscription(BaseModel):
    service_name: str
    amount: float
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[date] = None
    is_active: Optional[bool] = True

class ShowSubscription(BaseModel):
    id: int
    service_name: str
    amount: float
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[date] = None
    is_active: bool

    class config:
        from_attributes = True