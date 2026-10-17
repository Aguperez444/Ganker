"""merge reportes y soft_delete

Revision ID: 9da21cfea000
Revises: e5f6a7b8c9d0, fd832c93eef9
Create Date: 2026-10-17 00:32:55.976154

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9da21cfea000'
down_revision: Union[str, Sequence[str], None] = ('e5f6a7b8c9d0', 'fd832c93eef9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
