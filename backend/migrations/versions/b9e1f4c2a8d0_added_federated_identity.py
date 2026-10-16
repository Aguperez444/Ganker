"""added_federated_identity

Revision ID: b9e1f4c2a8d0
Revises: a7db127318e5
Create Date: 2026-10-15 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9e1f4c2a8d0'
down_revision: Union[str, Sequence[str], None] = 'a7db127318e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'federated_identity',
        sa.Column('federated_identity_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=20), nullable=False),
        sa.Column('provider_user_id', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('linked_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('federated_identity_id'),
        sa.UniqueConstraint('provider', 'provider_user_id', name='uq_federated_provider_account'),
        sa.UniqueConstraint('user_id', 'provider', name='uq_federated_user_provider'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('federated_identity')
