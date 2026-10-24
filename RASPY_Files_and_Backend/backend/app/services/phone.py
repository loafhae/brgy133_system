import re


_PHILIPPINE_MOBILE_PATTERN = re.compile(r"^(?:09\d{9}|\+?639\d{9})$")


def normalize_philippine_mobile(value: str) -> str:
    compact = re.sub(r"[\s().-]", "", str(value or ""))
    if not _PHILIPPINE_MOBILE_PATTERN.fullmatch(compact):
        raise ValueError("Enter a valid Philippine mobile number, such as 09123456789 or +639123456789.")

    if compact.startswith("09"):
        return f"+63{compact[1:]}"
    if compact.startswith("639"):
        return f"+{compact}"
    return compact
