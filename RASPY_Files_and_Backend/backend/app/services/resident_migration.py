import logging

from sqlalchemy import String, inspect, text
from sqlalchemy.engine import Engine

from app.models.user import ResidentAddress


logger = logging.getLogger(__name__)


def migrate_resident_schema(engine: Engine) -> None:
    ResidentAddress.__table__.create(engine, checkfirst=True)

    inspector = inspect(engine)
    if "tbl_residents" not in inspector.get_table_names():
        return

    resident_columns = {column["name"] for column in inspector.get_columns("tbl_residents")}
    if "address_id" not in resident_columns:
        column_type = "INT" if engine.dialect.name == "mysql" else "INTEGER"
        with engine.begin() as connection:
            connection.execute(text(
                f"ALTER TABLE tbl_residents ADD COLUMN address_id {column_type} NULL"
            ))

    inspector = inspect(engine)
    resident_columns = {column["name"] for column in inspector.get_columns("tbl_residents")}
    if engine.dialect.name == "mysql" and "address_id" in resident_columns:
        address_foreign_keys = inspector.get_foreign_keys("tbl_residents")
        if not any("address_id" in key.get("constrained_columns", []) for key in address_foreign_keys):
            with engine.begin() as connection:
                connection.execute(text(
                    "ALTER TABLE tbl_residents "
                    "ADD CONSTRAINT fk_tbl_residents_address_id "
                    "FOREIGN KEY (address_id) REFERENCES tbl_resident_addresses(address_id) "
                    "ON DELETE SET NULL"
                ))

    if "address" in resident_columns:
        with engine.begin() as connection:
            residents = connection.execute(text(
                "SELECT resident_id, address FROM tbl_residents WHERE address IS NOT NULL"
            )).mappings()
            for resident in residents:
                address_line = resident["address"].strip()
                if not address_line:
                    continue

                address_id = connection.execute(
                    text(
                        "SELECT address_id FROM tbl_resident_addresses "
                        "WHERE lower(address_line) = lower(:address_line)"
                    ),
                    {"address_line": address_line},
                ).scalar_one_or_none()
                if address_id is None:
                    connection.execute(
                        text("INSERT INTO tbl_resident_addresses (address_line) VALUES (:address_line)"),
                        {"address_line": address_line},
                    )
                    address_id = connection.execute(
                        text(
                            "SELECT address_id FROM tbl_resident_addresses "
                            "WHERE lower(address_line) = lower(:address_line)"
                        ),
                        {"address_line": address_line},
                    ).scalar_one()

                connection.execute(
                    text(
                        "UPDATE tbl_residents SET address_id = :address_id "
                        "WHERE resident_id = :resident_id AND address_id IS NULL"
                    ),
                    {"address_id": address_id, "resident_id": resident["resident_id"]},
                )

        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE tbl_residents DROP COLUMN address"))

    if "email" not in resident_columns:
        return

    can_drop_legacy_email = True
    with engine.begin() as connection:
        resident_emails = connection.execute(text(
            "SELECT r.user_id, r.email, u.email AS user_email "
            "FROM tbl_residents r JOIN tbl_users u ON u.user_id = r.user_id "
            "WHERE r.email IS NOT NULL AND trim(r.email) != ''"
        )).mappings()
        for resident in resident_emails:
            email = resident["email"].strip()
            user_email = resident["user_email"]
            if user_email and user_email.casefold() != email.casefold():
                can_drop_legacy_email = False
                continue

            duplicate_owner = connection.execute(
                text(
                    "SELECT user_id FROM tbl_users "
                    "WHERE lower(email) = lower(:email) AND user_id != :user_id"
                ),
                {"email": email, "user_id": resident["user_id"]},
            ).scalar_one_or_none()
            if duplicate_owner is not None:
                can_drop_legacy_email = False
                continue

            if not user_email:
                connection.execute(
                    text("UPDATE tbl_users SET email = :email WHERE user_id = :user_id"),
                    {"email": email, "user_id": resident["user_id"]},
                )

    if can_drop_legacy_email:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE tbl_residents DROP COLUMN email"))
    else:
        logger.warning(
            "Kept the legacy resident email column because some values conflict with unique user emails."
        )


def migrate_gender_schema(engine: Engine) -> None:
    if engine.dialect.name != "mysql":
        return

    inspector = inspect(engine)
    gender_tables = ("tbl_admin", "tbl_official", "tbl_residents")
    with engine.begin() as connection:
        for table_name in gender_tables:
            if table_name not in inspector.get_table_names():
                continue
            columns = {
                column["name"]: column["type"]
                for column in inspector.get_columns(table_name)
            }
            gender_type = columns.get("gender")
            if gender_type is not None and (
                not isinstance(gender_type, String)
                or gender_type.length is None
                or gender_type.length < 100
            ):
                connection.execute(text(
                    f"ALTER TABLE `{table_name}` MODIFY COLUMN `gender` VARCHAR(100) NULL"
                ))
