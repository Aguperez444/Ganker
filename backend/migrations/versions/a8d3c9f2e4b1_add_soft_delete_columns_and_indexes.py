"""add_soft_delete_columns_and_indexes

Revision ID: a8d3c9f2e4b1
Revises: a7db127318e5
Create Date: 2026-10-16 10:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8d3c9f2e4b1'
down_revision: Union[str, Sequence[str], None] = 'a7db127318e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema with soft delete columns and partial unique indexes."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    user_uqs = {uq["name"] for uq in inspector.get_unique_constraints("user") if uq.get("name")}
    vg_uqs = {uq["name"] for uq in inspector.get_unique_constraints("videogame") if uq.get("name")}

    # 1. user
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_user_deleted'), ['deleted'], unique=False)
        if 'uq__user__mail' in user_uqs:
            batch_op.drop_constraint('uq__user__mail', type_='unique')
        if 'uq__user__username' in user_uqs:
            batch_op.drop_constraint('uq__user__username', type_='unique')
        batch_op.create_index(
            'uq_user_username_active',
            ['username'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )
        batch_op.create_index(
            'uq_user_mail_active',
            ['mail'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )

    # 2. videogame
    with op.batch_alter_table('videogame', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_videogame_deleted'), ['deleted'], unique=False)
        if 'uq__videogame__name' in vg_uqs:
            batch_op.drop_constraint('uq__videogame__name', type_='unique')
        batch_op.create_index(
            'uq_videogame_name_active',
            ['name'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )

    # 3. game_profile
    with op.batch_alter_table('game_profile', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_game_profile_deleted'), ['deleted'], unique=False)
        batch_op.drop_constraint('uq_profile_x_videogame', type_='unique')
        batch_op.create_index(
            'uq_profile_x_videogame',
            ['player_id', 'videogame_id'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )

    # 4. role
    with op.batch_alter_table('role', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_role_deleted'), ['deleted'], unique=False)
        batch_op.drop_constraint('uq_videogame_role_name', type_='unique')
        batch_op.create_index(
            'uq_videogame_role_name',
            ['videogame_id', 'name'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )

    # 5. rank
    with op.batch_alter_table('rank', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_rank_deleted'), ['deleted'], unique=False)
        batch_op.drop_constraint('uq_videogame_rank_name', type_='unique')
        batch_op.drop_constraint('uq_videogame_rank_value', type_='unique')
        batch_op.create_index(
            'uq_videogame_rank_name',
            ['videogame_id', 'name'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )
        batch_op.create_index(
            'uq_videogame_rank_value',
            ['videogame_id', 'value'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )

    # 6. character
    with op.batch_alter_table('character', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_character_deleted'), ['deleted'], unique=False)
        batch_op.drop_constraint('uq_videogame_character_name', type_='unique')
        batch_op.create_index(
            'uq_videogame_character_name',
            ['videogame_id', 'name'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )

    # 7. role_profile
    with op.batch_alter_table('role_profile', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_role_profile_deleted'), ['deleted'], unique=False)
        batch_op.drop_constraint('uq_profile_role', type_='unique')
        batch_op.create_index(
            'uq_profile_role',
            ['game_profile_id', 'role_id'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )

    # 8. region
    with op.batch_alter_table('region', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_region_deleted'), ['deleted'], unique=False)

    # 9. game_profile_character_priority
    with op.batch_alter_table('game_profile_character_priority', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index(batch_op.f('ix_game_profile_character_priority_deleted'), ['deleted'], unique=False)
        batch_op.drop_constraint('uq_game_profile_preference', type_='unique')
        batch_op.drop_constraint('uq_game_profile_character', type_='unique')
        batch_op.create_index(
            'uq_game_profile_preference',
            ['game_profile_id', 'priority'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )
        batch_op.create_index(
            'uq_game_profile_character',
            ['game_profile_id', 'character_id'],
            unique=True,
            sqlite_where=sa.text('deleted = 0'),
            postgresql_where=sa.text('deleted = false'),
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('game_profile_character_priority', schema=None) as batch_op:
        batch_op.drop_index('uq_game_profile_character')
        batch_op.drop_index('uq_game_profile_preference')
        batch_op.create_unique_constraint('uq_game_profile_character', ['game_profile_id', 'character_id'])
        batch_op.create_unique_constraint('uq_game_profile_preference', ['game_profile_id', 'priority'])
        batch_op.drop_index(batch_op.f('ix_game_profile_character_priority_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('region', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_region_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('role_profile', schema=None) as batch_op:
        batch_op.drop_index('uq_profile_role')
        batch_op.create_unique_constraint('uq_profile_role', ['game_profile_id', 'role_id'])
        batch_op.drop_index(batch_op.f('ix_role_profile_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('character', schema=None) as batch_op:
        batch_op.drop_index('uq_videogame_character_name')
        batch_op.create_unique_constraint('uq_videogame_character_name', ['videogame_id', 'name'])
        batch_op.drop_index(batch_op.f('ix_character_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('rank', schema=None) as batch_op:
        batch_op.drop_index('uq_videogame_rank_value')
        batch_op.drop_index('uq_videogame_rank_name')
        batch_op.create_unique_constraint('uq_videogame_rank_value', ['videogame_id', 'value'])
        batch_op.create_unique_constraint('uq_videogame_rank_name', ['videogame_id', 'name'])
        batch_op.drop_index(batch_op.f('ix_rank_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('role', schema=None) as batch_op:
        batch_op.drop_index('uq_videogame_role_name')
        batch_op.create_unique_constraint('uq_videogame_role_name', ['videogame_id', 'name'])
        batch_op.drop_index(batch_op.f('ix_role_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('game_profile', schema=None) as batch_op:
        batch_op.drop_index('uq_profile_x_videogame')
        batch_op.create_unique_constraint('uq_profile_x_videogame', ['player_id', 'videogame_id'])
        batch_op.drop_index(batch_op.f('ix_game_profile_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('videogame', schema=None) as batch_op:
        batch_op.drop_index('uq_videogame_name_active')
        batch_op.create_unique_constraint('uq__videogame__name', ['name'])
        batch_op.drop_index(batch_op.f('ix_videogame_deleted'))
        batch_op.drop_column('deleted')

    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_index('uq_user_mail_active')
        batch_op.drop_index('uq_user_username_active')
        batch_op.create_unique_constraint('uq__user__username', ['username'])
        batch_op.create_unique_constraint('uq__user__mail', ['mail'])
        batch_op.drop_index(batch_op.f('ix_user_deleted'))
        batch_op.drop_column('deleted')
