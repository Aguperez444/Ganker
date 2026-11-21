"""Conserva el vencimiento y registra la finalización de cada baneo.

Revision ID: c3e6a9b2d705
Revises: b2d5f8a1c604
"""
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

revision = "c3e6a9b2d705"
down_revision = "b2d5f8a1c604"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user_ban_record") as batch:
        batch.add_column(sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("ended_by_user_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("end_reason", sa.String(20), nullable=True))
        batch.create_foreign_key("fk__user_ban_record__ended_by_user_id__user", "user", ["ended_by_user_id"], ["user_id"], ondelete="SET NULL")
        batch.create_check_constraint("valid_ban_end_reason", "end_reason IS NULL OR end_reason IN ('expired', 'manual', 'appeal', 'superseded', 'unknown')")
        batch.create_index("ix_user_ban_record_player_history", ["banned_user_id", "id"])

    connection = op.get_bind()
    metadata = sa.MetaData()
    bans = sa.Table("user_ban_record", metadata, autoload_with=connection)
    users = sa.Table("user", metadata, autoload_with=connection)
    appeals = sa.Table("ban_appeal", metadata, autoload_with=connection)
    latest = dict(connection.execute(sa.select(bans.c.banned_user_id, sa.func.max(bans.c.id)).group_by(bans.c.banned_user_id)).all())
    flags = dict(connection.execute(sa.select(users.c.user_id, users.c.banned)).all())
    accepted = {row.ban_record_id: row for row in connection.execute(sa.select(appeals).where(appeals.c.status == "accepted")).mappings()}
    now = datetime.now(timezone.utc)
    for row in connection.execute(sa.select(bans)).mappings().all():
        expires = row.expires_at
        if expires is not None and expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if row.id in accepted:
            appeal = accepted[row.id]
            values = {"ended_at": appeal.resolved_at, "ended_by_user_id": appeal.resolver_user_id, "end_reason": "appeal"}
        elif latest[row.banned_user_id] == row.id and flags.get(row.banned_user_id) and (expires is None or expires > now):
            continue
        else:
            # El código anterior sobrescribía expires_at al desbanear: no se
            # puede atribuir retrospectivamente un cierre a vencimiento o admin.
            values = {"end_reason": "unknown"}
        connection.execute(bans.update().where(bans.c.id == row.id).values(**values))


def downgrade():
    # Mantiene el contrato del código anterior al volver a esa versión.
    connection = op.get_bind()
    connection.execute(sa.text("UPDATE user_ban_record SET expires_at = ended_at WHERE ended_at IS NOT NULL"))
    with op.batch_alter_table("user_ban_record") as batch:
        batch.drop_index("ix_user_ban_record_player_history")
        batch.drop_constraint("valid_ban_end_reason", type_="check")
        batch.drop_constraint("fk__user_ban_record__ended_by_user_id__user", type_="foreignkey")
        batch.drop_column("end_reason")
        batch.drop_column("ended_by_user_id")
        batch.drop_column("ended_at")
