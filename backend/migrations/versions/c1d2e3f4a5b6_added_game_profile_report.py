"""added_game_profile_report

Revision ID: c1d2e3f4a5b6
Revises: b9e1f4c2a8d0
Create Date: 2026-10-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'b9e1f4c2a8d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Fecha de creación de los perfiles de juego, necesaria para el filtrado por rango de fechas del reporte
    with op.batch_alter_table('game_profile', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
        )

    op.create_table(
        'game_profile_report',
        sa.Column('report_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('generated_by', sa.Integer(), nullable=False),
        sa.Column('previous_report_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('generated_at', sa.DateTime(), nullable=False),
        sa.Column('total_profiles', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['generated_by'], ['user.user_id'], name=op.f('fk__game_profile_report__generated_by__user')),
        sa.ForeignKeyConstraint(['previous_report_id'], ['game_profile_report.report_id'],
                                name=op.f('fk__game_profile_report__previous_report_id__game_profile_report')),
        sa.PrimaryKeyConstraint('report_id', name=op.f('pk__game_profile_report')),
    )

    op.create_table(
        'game_profile_report_item',
        sa.Column('item_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('videogame_id', sa.Integer(), nullable=False),
        sa.Column('videogame_name', sa.String(), nullable=False),
        sa.Column('icon_url', sa.String(), nullable=True),
        sa.Column('profile_count', sa.Integer(), nullable=False),
        sa.Column('percentage', sa.Float(), nullable=False),
        sa.Column('variation', sa.Integer(), nullable=True),
        sa.Column('variation_percentage', sa.Float(), nullable=True),
        sa.Column('trend', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['game_profile_report.report_id'],
                                name=op.f('fk__game_profile_report_item__report_id__game_profile_report')),
        sa.PrimaryKeyConstraint('item_id', name=op.f('pk__game_profile_report_item')),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('game_profile_report_item')
    op.drop_table('game_profile_report')

    with op.batch_alter_table('game_profile', schema=None) as batch_op:
        batch_op.drop_column('created_at')
