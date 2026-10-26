"""Agrega registration_id conservando las solicitudes pendientes existentes.

Revision ID: e7b9d2f4a603
Revises: d6a8c1e3f502
"""
from alembic import op
import sqlalchemy as sa


revision = "e7b9d2f4a603"
down_revision = "d6a8c1e3f502"
branch_labels = None
depends_on = None


def _replace_table(with_registration_id: bool) -> None:
    columns = [
        sa.Column("mail", sa.String(), nullable=False, primary_key=not with_registration_id),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    ]
    if with_registration_id:
        columns.insert(0, sa.Column("registration_id", sa.Integer(), primary_key=True, autoincrement=True))
    primary_key = "registration_id" if with_registration_id else "mail"
    # PostgreSQL conserva el nombre de la constraint al renombrar la tabla.
    # Cada versión usa un nombre distinto para permitir también el downgrade.
    columns.append(sa.PrimaryKeyConstraint(primary_key, name=f"pk_pending_registrations_{primary_key}"))

    # Al copiar sin el ID, SQLite y PostgreSQL generan sus valores y mantienen
    # preparado el autoincremento para las próximas solicitudes.
    replacement = op.create_table("pending_registrations_replacement", *columns)
    field_names = ["mail", "username", "name", "password_hash", "token_hash", "expires_at"]
    previous = sa.table("pending_registrations", *(sa.column(name) for name in field_names))
    op.execute(replacement.insert().from_select(field_names, sa.select(*previous.c)))
    op.drop_table("pending_registrations")
    op.rename_table("pending_registrations_replacement", "pending_registrations")
    op.create_index("ix_pending_registrations_token_hash", "pending_registrations", ["token_hash"], unique=True)
    if with_registration_id:
        op.create_index("ix_pending_registrations_mail", "pending_registrations", ["mail"], unique=True)


def upgrade() -> None:
    _replace_table(with_registration_id=True)


def downgrade() -> None:
    _replace_table(with_registration_id=False)
