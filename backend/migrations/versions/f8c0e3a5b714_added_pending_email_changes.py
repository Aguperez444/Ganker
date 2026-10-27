"""Agrega solicitudes pendientes de cambio de email.

Revision ID: f8c0e3a5b714
Revises: e7b9d2f4a603
"""
from alembic import op
import sqlalchemy as sa


revision = "f8c0e3a5b714"
down_revision = "e7b9d2f4a603"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pending_email_changes",
        sa.Column("pending_email_change_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("mail", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_pending_email_changes_token_hash", "pending_email_changes", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_pending_email_changes_token_hash", table_name="pending_email_changes")
    op.drop_table("pending_email_changes")
