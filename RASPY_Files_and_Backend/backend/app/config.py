from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List
import json
import hashlib
from urllib.parse import urlsplit
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    APP_ENV: str = "production"
    DATABASE_HOST: str = "127.0.0.1"
    DATABASE_PORT: int = 3306
    DATABASE_USER: str = ""
    DATABASE_PASSWORD: str = ""
    DATABASE_NAME: str = "vision_trak"

    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    IDLE_TIMEOUT_MINUTES: int = Field(default=15, gt=0)
    SESSION_ABSOLUTE_TIMEOUT_MINUTES: int = Field(default=480, gt=0)
    SESSION_COOKIE_SECURE: bool = True
    REQUIRE_HTTPS: bool = True

    FCM_CREDENTIALS_PATH: str = ""

    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    CORS_ORIGINS: str = '["https://visiontrak.ragetech.dev","http://localhost:5173","http://127.0.0.1:5173"]'

    DETECTION_CONFIDENCE_THRESHOLD: float = 0.25
    NOTIFICATION_COOLDOWN_SECONDS: int = 300
    DETECTOR_API_KEY: str = ""

    SMTP_EMAIL: str = ""
    SMTP_APP_PASSWORD: str = ""

    @property
    def RESOLVED_PORT(self) -> int:
        return self.DATABASE_PORT

    @property
    def DATABASE_URL(self) -> str:
        return URL.create(
            "mysql+pymysql",
            username=self.DATABASE_USER,
            password=self.DATABASE_PASSWORD,
            host=self.DATABASE_HOST,
            port=self.RESOLVED_PORT,
            database=self.DATABASE_NAME,
        )

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        origins = json.loads(self.CORS_ORIGINS)
        if not isinstance(origins, list) or not all(isinstance(origin, str) for origin in origins):
            raise ValueError("CORS_ORIGINS must be a JSON array of origin strings.")
        if "*" in origins:
            raise ValueError("CORS_ORIGINS must list trusted origins explicitly; wildcard CORS is not allowed.")
        return origins

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()


def validate_deployment_settings() -> None:
    if settings.APP_ENV.lower() != "production":
        return

    errors = []
    if len(settings.SECRET_KEY) < 32 or settings.SECRET_KEY == "change-me":
        errors.append("SECRET_KEY must be a unique random value of at least 32 characters.")
    detector_key_fingerprint = hashlib.sha256(
        settings.DETECTOR_API_KEY.encode("utf-8")
    ).hexdigest()
    if (
        len(settings.DETECTOR_API_KEY) < 32
        or detector_key_fingerprint
        == "94f386a7f980beb8434f6d50159f957a1bf983282f785c745ba9837cb677f0f4"
    ):
        errors.append("DETECTOR_API_KEY must be a unique random value of at least 32 characters.")
    if not settings.DATABASE_USER or settings.DATABASE_USER.lower() == "root":
        errors.append("DATABASE_USER must be a dedicated non-root database account.")
    if len(settings.DATABASE_PASSWORD) < 16:
        errors.append("DATABASE_PASSWORD must contain at least 16 characters.")
    if settings.SECRET_KEY == settings.DETECTOR_API_KEY:
        errors.append("SECRET_KEY and DETECTOR_API_KEY must be different values.")
    if not settings.SESSION_COOKIE_SECURE or not settings.REQUIRE_HTTPS:
        errors.append("Public deployments require SESSION_COOKIE_SECURE=true and REQUIRE_HTTPS=true.")
    if not settings.SMTP_EMAIL or not settings.SMTP_APP_PASSWORD:
        errors.append("SMTP_EMAIL and SMTP_APP_PASSWORD are required for account verification.")

    try:
        origins = settings.CORS_ORIGINS_LIST
    except (ValueError, json.JSONDecodeError) as exc:
        errors.append(str(exc))
    else:
        if not origins:
            errors.append("Public deployments must use HTTPS-only CORS_ORIGINS.")
        for origin in origins:
            parsed_origin = urlsplit(origin)
            if (
                parsed_origin.scheme != "https"
                or not parsed_origin.hostname
                or parsed_origin.path not in ("", "/")
                or parsed_origin.query
                or parsed_origin.fragment
                or parsed_origin.username
                or parsed_origin.password
            ):
                errors.append("CORS_ORIGINS must contain only valid HTTPS origins.")
                break
        if any("localhost" in origin or "127.0.0.1" in origin for origin in origins):
            errors.append("Remove localhost origins from the public CORS_ORIGINS list.")

    if errors:
        raise ValueError("Deployment configuration is not secure:\n- " + "\n- ".join(errors))
