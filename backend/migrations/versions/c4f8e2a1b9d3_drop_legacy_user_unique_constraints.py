"""drop_legacy_user_unique_constraints_and_clean_soft_deleted_links

Revision ID: c4f8e2a1b9d3
Revises: 7b2e6a91d304
Create Date: 2026-10-21 20:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4f8e2a1b9d3"
down_revision: Union[str, Sequence[str], None] = "7b2e6a91d304"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop legacy table-level unique constraints on user/videogame and clean federated links of soft-deleted users."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "user" in tables:
        user_uqs = {uq["name"] for uq in inspector.get_unique_constraints("user") if uq.get("name")}
        if "uq__user__mail" in user_uqs or "uq__user__username" in user_uqs:
            with op.batch_alter_table("user", schema=None) as batch_op:
                if "uq__user__mail" in user_uqs:
                    batch_op.drop_constraint("uq__user__mail", type_="unique")
                if "uq__user__username" in user_uqs:
                    batch_op.drop_constraint("uq__user__username", type_="unique")

        user_table = sa.table(
            "user",
            sa.column("user_id", sa.Integer),
            sa.column("deleted", sa.Boolean),
        )
        deleted_user_ids = sa.select(user_table.c.user_id).where(user_table.c.deleted == sa.true())

        if "federated_identity" in tables:
            federated_table = sa.table("federated_identity", sa.column("user_id", sa.Integer))
            op.execute(federated_table.delete().where(federated_table.c.user_id.in_(deleted_user_ids)))

        if "discord_account_link" in tables:
            discord_table = sa.table("discord_account_link", sa.column("user_id", sa.Integer))
            op.execute(discord_table.delete().where(discord_table.c.user_id.in_(deleted_user_ids)))

    if "videogame" in tables:
        vg_uqs = {uq["name"] for uq in inspector.get_unique_constraints("videogame") if uq.get("name")}
        if "uq__videogame__name" in vg_uqs:
            with op.batch_alter_table("videogame", schema=None) as batch_op:
                batch_op.drop_constraint("uq__videogame__name", type_="unique")


def downgrade() -> None:
    """No-op downgrade: partial unique indexes uq_user_username_active and uq_user_mail_active remain in effect."""
    pass
