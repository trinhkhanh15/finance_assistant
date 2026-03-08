from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Thêm dòng này
from routers import user, saving, transaction, subscription, financial_preference
from contextlib import asynccontextmanager
from repo.repositories import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

# --- THÊM ĐOẠN NÀY VÀO ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả các nguồn (đúng chất vibe code)
    allow_credentials=True,
    allow_methods=["*"], # Cho phép tất cả các method (GET, POST, OPTIONS...)
    allow_headers=["*"], # Cho phép tất cả các headers
)
# -------------------------

# Lưu ý: Các dòng include_router phải nằm DƯỚI đoạn add_middleware
app.include_router(user.router, tags=["user"], prefix="/user")
app.include_router(saving.router, tags=["saving"], prefix="/saving")
app.include_router(transaction.router, tags=["transaction"], prefix="/transaction")
app.include_router(subscription.router, tags=["subscription"], prefix="/subscription")
app.include_router(financial_preference.router, tags=["financial_preference"], prefix="/financial_preference")

@app.get("/")
async def root():
    return {"detail": "Personal Finance Assistant"}