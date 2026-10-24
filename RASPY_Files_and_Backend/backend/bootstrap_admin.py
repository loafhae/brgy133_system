from getpass import getpass

from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import Admin, User
from app.services.auth_service import hash_password


def main() -> None:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.roles.like("%super_admin%")).first():
            raise SystemExit("A super administrator already exists; no account was created.")

        username = input("Administrator username: ").strip()
        email = input("Administrator email (required for verification): ").strip()
        first_name = input("First name: ").strip()
        last_name = input("Last name: ").strip()
        password = getpass("New password (at least 14 characters): ")
        confirmation = getpass("Confirm password: ")

        if not username or len(username) > 50:
            raise SystemExit("Username must contain 1 to 50 characters.")
        if not email or len(email) > 255 or "@" not in email:
            raise SystemExit("Enter a valid email address for account verification.")
        if not first_name or not last_name:
            raise SystemExit("First name and last name are required.")
        if len(password) < 14:
            raise SystemExit("The administrator password must be at least 14 characters.")
        if password != confirmation:
            raise SystemExit("Passwords do not match.")

        user = User(
            username=username,
            email=email,
            password=hash_password(password),
            roles="super_admin",
            is_approved=1,
        )
        user.admin_profile = Admin(first_name=first_name, last_name=last_name)
        db.add(user)
        db.commit()
        print(f"Super administrator '{username}' created. Keep the password private.")
    except IntegrityError as exc:
        db.rollback()
        raise SystemExit("That username or email is already in use; no account was created.") from exc
    finally:
        db.close()


if __name__ == "__main__":
    main()
