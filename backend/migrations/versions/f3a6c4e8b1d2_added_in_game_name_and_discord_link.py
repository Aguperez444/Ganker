"""added_in_game_name_and_discord_link

Revision ID: f3a6c4e8b1d2
Revises: e1b5d8a7c290
Create Date: 2026-10-14 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a6c4e8b1d2'
down_revision: Union[str, Sequence[str], None] = 'e1b5d8a7c290'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('game_profile', schema=None) as batch_op:
        batch_op.add_column(sa.Column('in_game_name', sa.String(length=50), nullable=True))

    op.create_table(
        'discord_account_link',
        sa.Column('discord_account_link_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('discord_user_id', sa.String(length=30), nullable=False),
        sa.Column('username', sa.String(length=40), nullable=False),
        sa.Column('global_name', sa.String(length=40), nullable=True),
        sa.Column('avatar_url', sa.String(length=200), nullable=True),
        sa.Column('visibility', sa.String(length=20), nullable=False),
        sa.Column('linked_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('discord_account_link_id'),
        sa.UniqueConstraint('discord_user_id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('discord_account_link')

    with op.batch_alter_table('game_profile', schema=None) as batch_op:
        batch_op.drop_column('in_game_name')
