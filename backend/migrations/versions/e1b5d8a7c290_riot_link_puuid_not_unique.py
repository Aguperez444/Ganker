"""riot_link_puuid_not_unique

La misma cuenta de Riot puede vincularse al perfil de League of Legends y al de Valorant
del mismo jugador, así que el puuid deja de ser único (queda indexado para buscar por cuenta).

Revision ID: e1b5d8a7c290
Revises: c7e2a91f4b3d
Create Date: 2026-10-14 16:20:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e1b5d8a7c290'
down_revision: Union[str, Sequence[str], None] = 'c7e2a91f4b3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('riot_account_link', schema=None) as batch_op:
        batch_op.drop_constraint('uq__riot_account_link__puuid', type_='unique')
        batch_op.create_index('ix__riot_account_link__puuid', ['puuid'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('riot_account_link', schema=None) as batch_op:
        batch_op.drop_index('ix__riot_account_link__puuid')
        batch_op.create_unique_constraint('uq__riot_account_link__puuid', ['puuid'])
