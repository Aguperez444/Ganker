"""added_riot_account_link

Revision ID: c7e2a91f4b3d
Revises: 3d348459108b
Create Date: 2026-10-14 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7e2a91f4b3d'
down_revision: Union[str, Sequence[str], None] = '3d348459108b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'riot_account_link',
        sa.Column('riot_account_link_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('game_profile_id', sa.Integer(), nullable=False),
        sa.Column('puuid', sa.String(length=100), nullable=False),
        sa.Column('game_name', sa.String(length=16), nullable=False),
        sa.Column('tag_line', sa.String(length=5), nullable=False),
        sa.Column('server', sa.String(length=10), nullable=False),
        sa.Column('stats', sa.JSON(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['game_profile_id'], ['game_profile.game_profile_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('riot_account_link_id'),
        sa.UniqueConstraint('game_profile_id'),
        sa.UniqueConstraint('puuid')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('riot_account_link')
