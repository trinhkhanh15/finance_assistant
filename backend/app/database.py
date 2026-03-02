from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# 1. Đổi sang driver asyncpg (postgresql+asyncpg)
# Cấu trúc: postgresql+asyncpg://user:password@host:port/dbname
import os
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://admin:123@db:5432/finance_assistant")
# nếu muốn chạy localhost thì đổi URL thành "postgresql+asyncpg://admin:123@localhost:5432/finance_assistant"
# 2. Khởi tạo engine
# Lưu ý: Bỏ connect_args={"check_same_thread": False} vì nó chỉ dùng cho SQLite
engine = create_async_engine(
    DATABASE_URL,
    echo=False, # Set True nếu muốn xem log SQL chạy dưới console
    future=True
)

Base = declarative_base()

# 3. Cấu hình Session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    class_=AsyncSession,
    expire_on_commit=False, # Khuyên dùng False trong môi trường async để tránh lỗi session đã đóng
)