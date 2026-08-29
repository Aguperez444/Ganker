import pytest
from app.domain.models.player import Player
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile

from app.infrastructure.database.models.player_orm import PlayerORM
from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
from app.infrastructure.database.models.game_profile_orm import GameProfileORM

from app.infrastructure.database.mappers.player_mapper import PlayerMapper
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.mappers.character_mapper import CharacterMapper
from app.infrastructure.database.mappers.role_mapper import RoleMapper
from app.infrastructure.database.mappers.rank_mapper import RankMapper
from app.infrastructure.database.mappers.role_profile_mapper import RoleProfileMapper
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper


class TestDatabaseMappers:

    def test_player_mapper(self):
        # Domain to ORM
        player_domain = Player(
            player_id=1,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="hash",
            profiles=[]
        )
        player_orm = PlayerMapper.domain_to_orm(player_domain)
        assert player_orm.player_id == 1
        assert player_orm.username == "johndoe"
        assert player_orm.name == "John Doe"
        assert player_orm.mail == "john@example.com"
        assert player_orm.password_hash == "hash"

        # ORM to Domain
        player_orm.game_profiles = []
        domain_converted = PlayerMapper.orm_to_domain(player_orm)
        assert domain_converted.player_id == 1
        assert domain_converted.username == "johndoe"
        assert domain_converted.name == "John Doe"
        assert domain_converted.mail == "john@example.com"
        assert domain_converted.profiles == []

    def test_videogame_mapper(self):
        vg_domain = Videogame(videogame_id=5, name="Valorant")
        vg_orm = VideogameMapper.domain_to_orm(vg_domain)
        assert vg_orm.videogame_id == 5
        assert vg_orm.name == "Valorant"

        domain_converted = VideogameMapper.orm_to_domain(vg_orm)
        assert domain_converted.videogame_id == 5
        assert domain_converted.name == "Valorant"

    def test_character_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL")
        char_orm = CharacterORM(character_id=10, name="Ahri", videogame_id=1, videogame=vg_orm)

        char_domain = CharacterMapper.orm_to_domain(char_orm)
        assert char_domain.character_id == 10
        assert char_domain.name == "Ahri"
        assert char_domain.videogame.name == "LoL"

        converted_orm = CharacterMapper.domain_to_orm(char_domain)
        assert converted_orm.character_id == 10
        assert converted_orm.name == "Ahri"
        assert converted_orm.videogame_id == 1

    def test_role_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL")
        role_orm = RoleORM(role_id=2, name="Support", videogame_id=1, videogame=vg_orm)

        role_domain = RoleMapper.orm_to_domain(role_orm)
        assert role_domain.role_id == 2
        assert role_domain.name == "Support"
        assert role_domain.videogame.name == "LoL"

        converted_orm = RoleMapper.domain_to_orm(role_domain)
        assert converted_orm.role_id == 2
        assert converted_orm.name == "Support"
        assert converted_orm.videogame_id == 1

    def test_rank_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL")
        rank_orm = RankORM(rank_id=3, name="Diamond", value=3000, videogame_id=1, videogame=vg_orm)

        rank_domain = RankMapper.orm_to_domain(rank_orm)
        assert rank_domain.rank_id == 3
        assert rank_domain.name == "Diamond"
        assert rank_domain.value == 3000
        assert rank_domain.videogame.name == "LoL"

        converted_orm = RankMapper.domain_to_orm(rank_domain)
        assert converted_orm.rank_id == 3
        assert converted_orm.name == "Diamond"
        assert converted_orm.value == 3000
        assert converted_orm.videogame_id == 1

    def test_role_profile_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL")
        role_orm = RoleORM(role_id=1, name="Mid", videogame_id=1, videogame=vg_orm)
        rank_orm = RankORM(rank_id=1, name="Challenger", value=5000, videogame_id=1, videogame=vg_orm)
        rp_orm = RoleProfileORM(role_profile_id=10, game_profile_id=100, role_id=1, rank_id=1, role=role_orm, rank=rank_orm)

        rp_domain = RoleProfileMapper.orm_to_domain(rp_orm)
        assert rp_domain.role_profile_id == 10
        assert rp_domain.role.name == "Mid"
        assert rp_domain.rank.name == "Challenger"

        converted_orm = RoleProfileMapper.domain_to_orm(rp_domain, game_profile_id=100)
        assert converted_orm.role_profile_id == 10
        assert converted_orm.game_profile_id == 100
        assert converted_orm.role_id == 1
        assert converted_orm.rank_id == 1

    def test_game_profile_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL")
        char_orm = CharacterORM(character_id=10, name="Ahri", videogame_id=1, videogame=vg_orm)
        role_orm = RoleORM(role_id=1, name="Mid", videogame_id=1, videogame=vg_orm)
        rank_orm = RankORM(rank_id=1, name="Gold", value=1000, videogame_id=1, videogame=vg_orm)
        rp_orm = RoleProfileORM(role_profile_id=10, game_profile_id=50, role_id=1, rank_id=1, role=role_orm, rank=rank_orm)

        gp_orm = GameProfileORM(
            game_profile_id=50,
            player_id=2,
            videogame_id=1,
            videogame=vg_orm,
            characters=[char_orm],
            role_profiles=[rp_orm]
        )

        gp_domain = GameProfileMapper.orm_to_domain(gp_orm)
        assert gp_domain.game_profile_id == 50
        assert gp_domain.player_id == 2
        assert gp_domain.videogame.name == "LoL"
        assert len(gp_domain.characters) == 1
        assert len(gp_domain.role_profiles) == 1

        converted_orm = GameProfileMapper.domain_to_orm(gp_domain)
        assert converted_orm.game_profile_id == 50
        assert converted_orm.player_id == 2
        assert converted_orm.videogame_id == 1
        assert len(converted_orm.characters) == 1
        assert len(converted_orm.role_profiles) == 1
