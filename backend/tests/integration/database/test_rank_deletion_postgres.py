from unittest.mock import Mock

import pytest

from app.application.use_cases.delete_rank import DeleteRank
from app.domain.exceptions.rank.cannot_delete_rank_exception import CannotDeleteRankException
from app.infrastructure.database.models import (
    ConversationORM, GameProfileORM, RankORM, RoleORM, RoleProfileORM,
    TeamORM, UserORM, VideogameORM,
)
from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork


@pytest.fixture
def postgres_catalog(postgres_sessions):
    with postgres_sessions.begin() as session:
        game = VideogameORM(name="Game", icon_url="/game.png", rank_per_role=True)
        session.add(game)
        session.flush()
        ranks = [RankORM(
            name=f"Rank {value}", value=value, videogame_id=game.videogame_id,
            icon_url=f"/rank{value}.png",
        ) for value in [1, 2, 3]]
        session.add_all(ranks)
        session.flush()
        return game.videogame_id, [rank.rank_id for rank in ranks]


def _team(session, game_id, min_rank_id, max_rank_id, is_active):
    conversation = ConversationORM(name="Chat", type=2)
    session.add(conversation)
    session.flush()
    team = TeamORM(
        name="Team", allow_other_regions=True, videogame_id=game_id,
        min_rank_id=min_rank_id, max_rank_id=max_rank_id,
        conversation_id=conversation.conversation_id, is_active=is_active,
    )
    session.add(team)
    session.flush()
    return team


@pytest.mark.parametrize("is_active", [True, False])
@pytest.mark.parametrize("reference, rank_index, target_index", [
    ("min", 1, 0), ("max", 1, 0), ("both", 1, 0), ("both", 0, 1),
])
def test_delete_rank_reassigns_all_foreign_keys_in_postgres(
    postgres_sessions, postgres_catalog, reference, rank_index, target_index, is_active,
):
    game_id, rank_ids = postgres_catalog
    rank_id, target_rank_id = rank_ids[rank_index], rank_ids[target_index]
    min_rank_id = rank_id if reference in ("min", "both") else rank_ids[0]
    max_rank_id = rank_id if reference in ("max", "both") else rank_ids[2]
    with postgres_sessions.begin() as session:
        team = _team(session, game_id, min_rank_id, max_rank_id, is_active)
        team_id = team.team_id
        user = UserORM(name="Player", username="player", role="player")
        roles = [RoleORM(name=f"Role {i}", videogame_id=game_id, icon_url="/role.png") for i in [1, 2]]
        session.add_all([user, *roles])
        session.flush()
        game_profile = GameProfileORM(player_id=user.user_id, videogame_id=game_id)
        session.add(game_profile)
        session.flush()
        for role, deleted in zip(roles, [False, True]):
            session.add(RoleProfileORM(
                game_profile_id=game_profile.game_profile_id, role_id=role.role_id,
                rank_id=rank_id, deleted=deleted,
            ))

    DeleteRank(Mock(), SqlAlchemyUnitOfWork(postgres_sessions)).execute(rank_id)

    with postgres_sessions() as session:
        assert session.get(RankORM, rank_id) is None
        team = session.get(TeamORM, team_id)
        assert team.min_rank_id == (target_rank_id if min_rank_id == rank_id else min_rank_id)
        assert team.max_rank_id == (target_rank_id if max_rank_id == rank_id else max_rank_id)
        assert team.min_rank.value <= team.max_rank.value
        assert team.is_active is is_active
        profiles = session.query(RoleProfileORM).order_by(RoleProfileORM.role_profile_id).all()
        assert [(p.rank_id, p.deleted) for p in profiles] == [(target_rank_id, False), (target_rank_id, True)]


@pytest.mark.parametrize("is_active", [True, False])
def test_delete_last_rank_with_team_in_postgres_is_rejected(
    postgres_sessions, postgres_catalog, is_active,
):
    game_id, rank_ids = postgres_catalog
    rank_id = rank_ids[0]
    with postgres_sessions.begin() as session:
        session.query(RankORM).filter(RankORM.rank_id != rank_id).delete(synchronize_session="fetch")
        team_id = _team(session, game_id, rank_id, rank_id, is_active).team_id
    storage = Mock()

    with pytest.raises(CannotDeleteRankException):
        DeleteRank(storage, SqlAlchemyUnitOfWork(postgres_sessions)).execute(rank_id)

    storage.delete_file.assert_not_called()
    with postgres_sessions() as session:
        assert session.get(RankORM, rank_id) is not None
        team = session.get(TeamORM, team_id)
        assert (team.min_rank_id, team.max_rank_id) == (rank_id, rank_id)
        assert team.is_active is is_active
