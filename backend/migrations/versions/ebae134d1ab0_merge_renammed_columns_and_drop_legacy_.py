"""merge_renammed_columns_and_drop_legacy_constraints

Revision ID: ebae134d1ab0
Revises: 1297a75ee8ce, c4f8e2a1b9d3
Create Date: 2026-10-22 17:04:37.233163

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ebae134d1ab0'
down_revision: Union[str, Sequence[str], None] = ('1297a75ee8ce', 'c4f8e2a1b9d3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
