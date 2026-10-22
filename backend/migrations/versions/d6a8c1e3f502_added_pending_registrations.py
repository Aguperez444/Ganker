"""Solicitudes de registro local pendientes de confirmar el correo.

Revision ID: d6a8c1e3f502
Revises: ebae134d1ab0
"""
from alembic import op
import sqlalchemy as sa


revision = "d6a8c1e3f502"
down_revision = "ebae134d1ab0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pending_registrations",
        sa.Column("mail", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("mail"),
    )
    op.create_index("ix_pending_registrations_token_hash", "pending_registrations", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_pending_registrations_token_hash", table_name="pending_registrations")
    op.drop_table("pending_registrations")
