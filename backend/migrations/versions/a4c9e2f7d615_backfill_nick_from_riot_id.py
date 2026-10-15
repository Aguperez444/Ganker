"""backfill_nick_from_riot_id

Los perfiles que vincularon su cuenta de Riot antes de que existiera el nick (in_game_name)
lo tienen vacío: se completa con su Riot ID (Nombre#TAG), que es el nick de esos perfiles.

Revision ID: a4c9e2f7d615
Revises: f3a6c4e8b1d2
Create Date: 2026-10-14 18:40:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a4c9e2f7d615'
down_revision: Union[str, Sequence[str], None] = 'f3a6c4e8b1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        UPDATE game_profile
        SET in_game_name = (
            SELECT riot_account_link.game_name || '#' || riot_account_link.tag_line
            FROM riot_account_link
            WHERE riot_account_link.game_profile_id = game_profile.game_profile_id
        )
        WHERE EXISTS (
            SELECT 1 FROM riot_account_link
            WHERE riot_account_link.game_profile_id = game_profile.game_profile_id
        )
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Solo completa datos: no hay nada que deshacer en el esquema
    pass
