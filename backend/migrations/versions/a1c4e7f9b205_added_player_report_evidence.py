"""Agrega evidencia (imagen o video de YouTube) a los reportes de jugadores.

Revision ID: a1c4e7f9b205
Revises: f8c0e3a5b714
"""
from alembic import op
import sqlalchemy as sa


revision = "a1c4e7f9b205"
down_revision = "f8c0e3a5b714"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("player_report", sa.Column("evidence_image_url", sa.String(500), nullable=True))
    op.add_column("player_report", sa.Column("evidence_video_url", sa.String(500), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("player_report") as batch_op:
        batch_op.drop_column("evidence_video_url")
        batch_op.drop_column("evidence_image_url")
