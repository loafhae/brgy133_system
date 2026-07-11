from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_HOST: str = "0.0.0.0"
    DATABASE_PORT: int = 3306
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str = ""
    DATABASE_NAME: str = "vision_trak"

    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    FCM_CREDENTIALS_PATH: str = ""

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    DETECTION_CONFIDENCE_THRESHOLD: float = 0.25
    NOTIFICATION_COOLDOWN_SECONDS: int = 300

    @property
    def RESOLVED_PORT(self) -> int:
        if self.DATABASE_HOST in ("127.0.0.1", "localhost", "0.0.0.0"):
            import socket
            for p in (3306, 3307, 3308):
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(0.2)
                    s.connect(("127.0.0.1", p))
                    s.close()
                    return p
                except Exception:
                    pass
        return self.DATABASE_PORT

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_HOST}:{self.RESOLVED_PORT}/{self.DATABASE_NAME}"
        )

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
