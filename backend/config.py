import os

class Settings:
    PROJECT_NAME: str = "MediVault AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # DB URL - defaults to local SQLite file for seamless out-of-the-box execution or PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medivault.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medivault_secret_key_super_secure_2026_x99")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # AI & OCR
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
