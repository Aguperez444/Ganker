"""added_created_at_to_team

Revision ID: d2f4a6b8c0e1
Revises: c1d2e3f4a5b6
Create Date: 2026-10-16 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2f4a6b8c0e1'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Fecha de creación de los equipos, necesaria para el filtrado por rango de fechas del reporte de uso
    with op.batch_alter_table('team', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('team', schema=None) as batch_op:
        batch_op.drop_column('created_at')
