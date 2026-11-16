"""Asocia opcionalmente la denuncia al videojuego del incidente.

Revision ID: e5a8b1d4f927
Revises: d4f7a0c3e816
"""
from alembic import op
import sqlalchemy as sa

revision = "e5a8b1d4f927"
down_revision = "d4f7a0c3e816"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("player_report") as batch:
        batch.add_column(sa.Column("videogame_id", sa.Integer(), nullable=True))
        batch.create_foreign_key("fk__player_report__videogame_id__videogame", "videogame", ["videogame_id"], ["videogame_id"], ondelete="SET NULL")
        batch.create_index("ix__player_report__videogame_id", ["videogame_id"])


def downgrade():
    with op.batch_alter_table("player_report") as batch:
        batch.drop_index("ix__player_report__videogame_id")
        batch.drop_constraint("fk__player_report__videogame_id__videogame", type_="foreignkey")
        batch.drop_column("videogame_id")
