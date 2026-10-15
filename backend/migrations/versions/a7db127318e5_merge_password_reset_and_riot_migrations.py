"""merge password reset and riot migrations

Revision ID: a7db127318e5
Revises: 735a04e65330, a4c9e2f7d615
Create Date: 2026-10-15 18:22:54.059014

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7db127318e5'
down_revision: Union[str, Sequence[str], None] = ('735a04e65330', 'a4c9e2f7d615')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
