"""Agrega apelaciones de baneo e imágenes de evidencia.

Revision ID: b2d5f8a1c604
Revises: a1c4e7f9b205
"""
from alembic import op
import sqlalchemy as sa

revision = "b2d5f8a1c604"
down_revision = "a1c4e7f9b205"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "ban_appeal",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ban_record_id", sa.Integer(), sa.ForeignKey("user_ban_record.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolver_user_id", sa.Integer(), sa.ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True),
        sa.UniqueConstraint("ban_record_id", name="uq_ban_appeal_ban_record_id"),
        sa.CheckConstraint("status IN ('pending', 'accepted', 'rejected')", name="valid_ban_appeal_status"),
    )
    op.create_index("ix__ban_appeal__status", "ban_appeal", ["status"])
    op.create_table(
        "ban_appeal_image",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("appeal_id", sa.Integer(), sa.ForeignKey("ban_appeal.id", ondelete="CASCADE"), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.UniqueConstraint("appeal_id", "position", name="uq_ban_appeal_image_position"),
    )
    op.create_index("ix__ban_appeal_image__appeal_id", "ban_appeal_image", ["appeal_id"])


def downgrade():
    op.drop_table("ban_appeal_image")
    op.drop_table("ban_appeal")
