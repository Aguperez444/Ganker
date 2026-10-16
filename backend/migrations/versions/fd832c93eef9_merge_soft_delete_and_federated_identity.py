"""merge_soft_delete_and_federated_identity

Revision ID: fd832c93eef9
Revises: a8d3c9f2e4b1, b9e1f4c2a8d0
Create Date: 2026-10-16 12:58:29.125956

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd832c93eef9'
down_revision: Union[str, Sequence[str], None] = ('a8d3c9f2e4b1', 'b9e1f4c2a8d0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
