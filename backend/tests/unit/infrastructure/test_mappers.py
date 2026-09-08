import pytest
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.character_priority import CharacterPriority
from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile

from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
from app.infrastructure.database.models.game_profile_orm import GameProfileORM

from app.infrastructure.database.mappers.user_mapper import UserMapper
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.mappers.character_mapper import CharacterMapper
from app.infrastructure.database.mappers.character_priority_mapper import CharacterPriorityMapper
from app.infrastructure.database.mappers.role_mapper import RoleMapper
from app.infrastructure.database.mappers.rank_mapper import RankMapper
from app.infrastructure.database.mappers.role_profile_mapper import RoleProfileMapper
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper


class TestDatabaseMappers:

    def test_user_mapper(self):
        # Domain to ORM
        user_domain = User(
            user_id=1,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="hash",
            role=UserRole.PLAYER,
            profiles=[],
            icon_url="/media/users/icons/icon1.png"
        )
        user_orm = UserMapper.domain_to_orm(user_domain)
        assert user_orm.user_id == 1
        assert user_orm.username == "johndoe"
        assert user_orm.name == "John Doe"
        assert user_orm.mail == "john@example.com"
        assert user_orm.password_hash == "hash"
        assert user_orm.role == "player"
        assert user_orm.icon_url == "/media/users/icons/icon1.png"

        # ORM to Domain
        user_orm.game_profiles = []
        domain_converted = UserMapper.orm_to_domain(user_orm)
        assert domain_converted.user_id == 1
        assert domain_converted.username == "johndoe"
        assert domain_converted.name == "John Doe"
        assert domain_converted.mail == "john@example.com"
        assert domain_converted.role == UserRole.PLAYER
        assert domain_converted.icon_url == "/media/users/icons/icon1.png"
        assert domain_converted.profiles == []

    def test_videogame_mapper(self):
        vg_domain = Videogame(videogame_id=5, name="Valorant", icon_url="/media/games/val.png", rank_per_role=False)
        vg_orm = VideogameMapper.domain_to_orm(vg_domain)
        assert vg_orm.videogame_id == 5
        assert vg_orm.name == "Valorant"
        assert vg_orm.icon_url == "/media/games/val.png"
        assert vg_orm.rank_per_role is False

        domain_converted = VideogameMapper.orm_to_domain(vg_orm)
        assert domain_converted.videogame_id == 5
        assert domain_converted.name == "Valorant"
        assert domain_converted.icon_url == "/media/games/val.png"
        assert domain_converted.rank_per_role is False

    def test_character_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        char_orm = CharacterORM(character_id=10, name="Ahri", videogame_id=1, videogame=vg_orm, icon_url="/ahri.png")

        char_domain = CharacterMapper.orm_to_domain(char_orm)
        assert char_domain.character_id == 10
        assert char_domain.name == "Ahri"
        assert char_domain.icon_url == "/ahri.png"
        assert char_domain.videogame.name == "LoL"

        converted_orm = CharacterMapper.domain_to_orm(char_domain)
        assert converted_orm.character_id == 10
        assert converted_orm.name == "Ahri"
        assert converted_orm.icon_url == "/ahri.png"
        assert converted_orm.videogame_id == 1

    def test_character_priority_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        char_orm = CharacterORM(character_id=10, name="Ahri", videogame_id=1, videogame=vg_orm, icon_url="/ahri.png")
        cp_orm = CharacterPriorityORM(character_priority_id=1, game_profile_id=50, character_id=10, character=char_orm, priority=1)

        cp_domain = CharacterPriorityMapper.orm_to_domain(cp_orm)
        assert cp_domain.priority_id == 1
        assert cp_domain.priority == 1
        assert cp_domain.character.character_id == 10

        converted_orm = CharacterPriorityMapper.domain_to_orm(cp_domain, game_profile_id=50)
        assert converted_orm.character_priority_id == 1
        assert converted_orm.character_id == 10
        assert converted_orm.priority == 1
        assert converted_orm.game_profile_id == 50

    def test_role_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role_orm = RoleORM(role_id=2, name="Support", videogame_id=1, videogame=vg_orm, icon_url="/support.png")

        role_domain = RoleMapper.orm_to_domain(role_orm)
        assert role_domain.role_id == 2
        assert role_domain.name == "Support"
        assert role_domain.icon_url == "/support.png"
        assert role_domain.videogame.name == "LoL"

        converted_orm = RoleMapper.domain_to_orm(role_domain)
        assert converted_orm.role_id == 2
        assert converted_orm.name == "Support"
        assert converted_orm.icon_url == "/support.png"
        assert converted_orm.videogame_id == 1

    def test_rank_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        rank_orm = RankORM(rank_id=3, name="Diamond", value=3000, videogame_id=1, videogame=vg_orm, icon_url="/diamond.png")

        rank_domain = RankMapper.orm_to_domain(rank_orm)
        assert rank_domain.rank_id == 3
        assert rank_domain.name == "Diamond"
        assert rank_domain.value == 3000
        assert rank_domain.icon_url == "/diamond.png"
        assert rank_domain.videogame.name == "LoL"

        converted_orm = RankMapper.domain_to_orm(rank_domain)
        assert converted_orm.rank_id == 3
        assert converted_orm.name == "Diamond"
        assert converted_orm.value == 3000
        assert converted_orm.icon_url == "/diamond.png"
        assert converted_orm.videogame_id == 1

    def test_role_profile_mapper(self):
        vg_orm = VideogameORM(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role_orm = RoleORM(role_id=1, name="Mid", videogame_id=1, videogame=vg_orm, icon_url="/mid.png")
        rank_orm = RankORM(rank_id=1, name="Challenger", value=5000, videogame_id=1, videogame=vg_orm, icon_url="/chal.png")
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
        vg_orm = VideogameORM(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        char_orm = CharacterORM(character_id=10, name="Ahri", videogame_id=1, videogame=vg_orm, icon_url="/ahri.png")
        role_orm = RoleORM(role_id=1, name="Mid", videogame_id=1, videogame=vg_orm, icon_url="/mid.png")
        rank_orm = RankORM(rank_id=1, name="Gold", value=1000, videogame_id=1, videogame=vg_orm, icon_url="/gold.png")
        rp_orm = RoleProfileORM(role_profile_id=10, game_profile_id=50, role_id=1, rank_id=1, role=role_orm, rank=rank_orm)
        cp_orm = CharacterPriorityORM(character_priority_id=1, game_profile_id=50, character_id=10, character=char_orm, priority=1)

        gp_orm = GameProfileORM(
            game_profile_id=50,
            player_id=2,
            videogame_id=1,
            videogame=vg_orm,
            character_associations=[cp_orm],
            role_profiles=[rp_orm]
        )

        gp_domain = GameProfileMapper.orm_to_domain(gp_orm)
        assert gp_domain.game_profile_id == 50
        assert gp_domain.player_id == 2
        assert gp_domain.videogame.name == "LoL"
        assert len(gp_domain.characters_priority) == 1
        assert gp_domain.characters_priority[0].character.name == "Ahri"
        assert len(gp_domain.role_profiles) == 1

        converted_orm = GameProfileMapper.domain_to_orm(gp_domain)
        assert converted_orm.game_profile_id == 50
        assert converted_orm.player_id == 2
        assert converted_orm.videogame_id == 1
        assert len(converted_orm.character_associations) == 1
        assert len(converted_orm.role_profiles) == 1
