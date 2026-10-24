import time
import logging
import os
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from app.database import SessionLocal, get_db
from app.models.audit import AuditLog
from app.dependencies import is_valid_detector_authorization

logger = logging.getLogger(__name__)

# Route-specific rate limits: (max_requests, window_in_seconds)
RATE_LIMIT_RULES = [
    ("/api/auth/forgot-password", 1, 20),   # 1 OTP verification email per 20 seconds
    ("/api/auth/register", 10, 600),          # Max 10 account creations per 10 mins (prevents bot registration)
    ("/api/auth/login", 20, 60),             # Max 20 login attempts per min (prevents brute-force)
    ("/api/feedback", 15, 300),              # Max 15 feedback submissions per 5 mins
    ("/api/", 180, 60),                      # Max 180 requests per min for general API (prevents infinite loops)
]

# Track requests: { ip_key + path_rule: [timestamps] }
_request_records = defaultdict(list)
_last_alert_time = defaultdict(float)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Exclude static assets, docs, websockets, and tests
        path = request.url.path
        if not path.startswith("/api/") or path.startswith("/api/ws"):
            return await call_next(request)

        # Allow tests in pytest to execute without rate throttling
        client_host = request.client.host if request.client else "unknown"
        if client_host == "testclient" or os.environ.get("PYTEST_CURRENT_TEST"):
            return await call_next(request)

        # Allow authenticated detector events without rate throttling
        if is_valid_detector_authorization(request.headers.get("authorization")):
            return await call_next(request)

        # Resolve real client IP behind Cloudflare or reverse proxy
        cf_ip = request.headers.get("cf-connecting-ip")
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = cf_ip.strip() if cf_ip else (forwarded.split(",")[0].strip() if forwarded else client_host)

        now = time.time()
        for prefix, max_reqs, window_sec in RATE_LIMIT_RULES:
            if path.startswith(prefix):
                key = f"{client_ip}:{prefix}"
                timestamps = _request_records[key]

                # Prune timestamps outside window
                cutoff = now - window_sec
                _request_records[key] = [t for t in timestamps if t > cutoff]

                if len(_request_records[key]) >= max_reqs:
                    retry_after = int(window_sec - (now - _request_records[key][0]))
                    retry_after = max(1, retry_after)

                    # Trigger Security Alert in Audit Logs (throttled once every 60s per IP)
                    if now - _last_alert_time[key] > 60:
                        _last_alert_time[key] = now
                        self._log_rate_limit_alert(client_ip, path, len(_request_records[key]), max_reqs)

                    logger.warning(
                        "Rate limit exceeded: IP=%s Path=%s Limit=%d/%ds",
                        client_ip, path, max_reqs, window_sec
                    )

                    return JSONResponse(
                        status_code=429,
                        headers={"Retry-After": str(retry_after)},
                        content={
                            "detail": f"Rate limit exceeded. Too many requests to {prefix}. Please retry after {retry_after} seconds."
                        }
                    )

                _request_records[key].append(now)
                break  # Apply the most specific rule matched first

        return await call_next(request)

    def _log_rate_limit_alert(self, client_ip: str, path: str, count: int, limit: int):
        """Record abnormal API spike in tbl_AuditLogs for administrative monitoring"""
        db = SessionLocal()
        try:
            alert = AuditLog(
                user_id=None,
                action_type="rate_limit_exceeded",
                target_table="tbl_security",
                target_id=None,
                description="High rate of automated requests was detected.",
                ip_address=client_ip
            )
            db.add(alert)
            db.commit()
        except Exception as e:
            logger.error("Failed to log rate limit alert: %s", e)
        finally:
            db.close()
