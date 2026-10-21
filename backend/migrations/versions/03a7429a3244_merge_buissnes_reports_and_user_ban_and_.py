"""merge_buissnes_reports_and_user_ban_and_user_report

Revision ID: 03a7429a3244
Revises: 7b2e6a91d304, 82e54241b72f
Create Date: 2026-10-20 22:15:51.749385

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '03a7429a3244'
down_revision: Union[str, Sequence[str], None] = ('7b2e6a91d304', '82e54241b72f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
