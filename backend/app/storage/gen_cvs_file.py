import csv
import random
from datetime import datetime

EXPENSES = {
    "food and drink": ["Lunch", "Dinner", "Starbucks", "GrabFood", "Groceries"],
    "subscription": ["Spotify", "YouTube Premium", "Netflix", "iCloud", "Adobe"],
    "investment": ["Stock purchase", "Crypto", "Gold savings", "Bond fund"],
    "uncategorized": ["ATM Withdrawal", "Transfer", "Misc"]
}

def generate_csv(filename="balanced_transactions.csv"):
    year, month = 2026, 2
    data = []
    current_wallet = 0.0

    # 1. Thu nhập đầu tháng
    salary = 3000.0
    current_wallet += salary
    data.append([f"{year}-{month:02d}-01 08:00:00", salary, "income", "Monthly Salary"])

    for day in range(1, 29):
        # Trung bình 4 giao dịch/ngày
        for _ in range(random.randint(2, 6)):
            cat = random.choice(list(EXPENSES.keys()))
            desc = random.choice(EXPENSES[cat])
            amt = round(random.uniform(10.0, 150.0), 2)

            # Nếu sắp hết tiền, bơm thêm thu nhập Freelance
            if current_wallet - amt < 100:
                bonus = 500.0
                current_wallet += bonus
                data.append([f"{year}-{month:02d}-{day:02d} 09:00:00", bonus, "income", "Freelance Project"])

            current_wallet -= amt
            hour = random.randint(10, 21)
            data.append([f"{year}-{month:02d}-{day:02d} {hour:02d}:00:00", amt, cat, desc])

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["date", "amount", "category", "description"])
        writer.writerows(data)

generate_csv()
print("Xong! File balanced_transactions.csv đã sẵn sàng.")