"""Allow usage reports spanning all videogames.

Revision ID: 7b2e6a91d304
Revises: 9da21cfea000
"""
from alembic import op
import sqlalchemy as sa

revision = "7b2e6a91d304"
down_revision = "9da21cfea000"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("game_usage_report") as batch:
        batch.alter_column("videogame_id", existing_type=sa.Integer(), nullable=True)


def downgrade():
    # Prevent silently discarding persisted general reports on downgrade.
    connection = op.get_bind()
    if connection.scalar(sa.text("SELECT COUNT(*) FROM game_usage_report WHERE videogame_id IS NULL")):
        raise RuntimeError("Existen reportes generales; archivarlos antes de revertir esta migración.")
    with op.batch_alter_table("game_usage_report") as batch:
        batch.alter_column("videogame_id", existing_type=sa.Integer(), nullable=False)
