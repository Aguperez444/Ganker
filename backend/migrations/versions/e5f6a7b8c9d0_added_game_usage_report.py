"""added_game_usage_report

Revision ID: e5f6a7b8c9d0
Revises: d2f4a6b8c0e1
Create Date: 2026-10-16 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd2f4a6b8c0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'game_usage_report',
        sa.Column('report_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('generated_by', sa.Integer(), nullable=False),
        sa.Column('analysis_type', sa.String(length=20), nullable=False),
        sa.Column('videogame_id', sa.Integer(), nullable=False),
        sa.Column('videogame_name', sa.String(), nullable=False),
        sa.Column('icon_url', sa.String(), nullable=True),
        sa.Column('previous_report_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('generated_at', sa.DateTime(), nullable=False),
        sa.Column('total', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['generated_by'], ['user.user_id'],
                                name=op.f('fk__game_usage_report__generated_by__user')),
        sa.ForeignKeyConstraint(['previous_report_id'], ['game_usage_report.report_id'],
                                name=op.f('fk__game_usage_report__previous_report_id__game_usage_report')),
        sa.PrimaryKeyConstraint('report_id', name=op.f('pk__game_usage_report')),
    )

    op.create_table(
        'game_usage_report_item',
        sa.Column('item_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('icon_url', sa.String(), nullable=True),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('percentage', sa.Float(), nullable=False),
        sa.Column('rank_range', sa.String(), nullable=True),
        sa.Column('variation', sa.Integer(), nullable=True),
        sa.Column('variation_percentage', sa.Float(), nullable=True),
        sa.Column('trend', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['game_usage_report.report_id'],
                                name=op.f('fk__game_usage_report_item__report_id__game_usage_report')),
        sa.PrimaryKeyConstraint('item_id', name=op.f('pk__game_usage_report_item')),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('game_usage_report_item')
    op.drop_table('game_usage_report')
