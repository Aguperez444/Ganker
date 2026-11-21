"""Clasifica los cierres históricos sin auditoría como vencimiento por tiempo.

Revision ID: d4f7a0c3e816
Revises: c3e6a9b2d705
"""
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

revision = "d4f7a0c3e816"
down_revision = "c3e6a9b2d705"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    bans = sa.Table("user_ban_record", sa.MetaData(), autoload_with=connection)
    now = datetime.now(timezone.utc)
    for row in connection.execute(sa.select(bans).where(bans.c.end_reason == "unknown")).mappings().all():
        deadline = row.ended_at or row.expires_at
        if deadline is not None and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        connection.execute(bans.update().where(bans.c.id == row.id).values(
            end_reason="expired", ended_at=min(deadline, now) if deadline else now,
            ended_by_user_id=None,
        ))


def downgrade():
    # No se puede distinguir esta normalización de los vencimientos originales.
    # Retroceder no elimina ni reinterpreta el historial de sanciones.
    pass
