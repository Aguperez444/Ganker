import pytest
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.role_profile import RoleProfile
from app.domain.models.character_priority import CharacterPriority
from app.domain.models.game_profile import GameProfile


class TestDomainModels:

    def test_user_instantiation_and_properties(self):
        user = User(
            user_id=1,
            username="player1",
            name="Player One",
            mail="player1@example.com",
            password_hash="hashed_pw",
            role=UserRole.PLAYER,
            profiles=[],
            icon_url="/media/users/icons/icon1.png"
        )

        assert user.user_id == 1
        assert user.username == "player1"
        assert user.name == "Player One"
        assert user.mail == "player1@example.com"
        assert user.password_hash == "hashed_pw"
        assert user.role == UserRole.PLAYER
        assert user.profiles == []
        assert user.icon_url == "/media/users/icons/icon1.png"

        # Test setters
        user.user_id = 2
        user.username = "player2"
        user.name = "Player Two"
        user.mail = "player2@example.com"
        user.password_hash = "new_hash"
        user.role = UserRole.ADMIN
        user.profiles = []
        user.icon_url = "/media/users/icons/icon2.png"

        assert user.user_id == 2
        assert user.username == "player2"
        assert user.name == "Player Two"
        assert user.mail == "player2@example.com"
        assert user.password_hash == "new_hash"
        assert user.role == UserRole.ADMIN
        assert user.icon_url == "/media/users/icons/icon2.png"

    def test_user_role_enum_methods(self):
        player_role = UserRole.PLAYER
        admin_role = UserRole.ADMIN
        owner_role = UserRole.OWNER

        assert player_role.is_player() is True
        assert player_role.is_admin() is False
        assert player_role.is_owner() is False

        assert admin_role.is_player() is False
        assert admin_role.is_admin() is True
        assert admin_role.is_owner() is False

        assert owner_role.is_player() is False
        assert owner_role.is_admin() is True
        assert owner_role.is_owner() is True

    def test_videogame_instantiation_and_properties(self):
        vg = Videogame(videogame_id=10, name="Dota 2", icon_url="/media/games/dota2/icon.png", rank_per_role=False)
        assert vg.videogame_id == 10
        assert vg.name == "Dota 2"
        assert vg.icon_url == "/media/games/dota2/icon.png"
        assert vg.rank_per_role is False
        assert "rank_per_role=False" in repr(vg)

        vg.videogame_id = 20
        vg.name = "Counter Strike"
        vg.icon_url = "/media/games/cs/icon.png"
        vg.rank_per_role = True
        assert vg.videogame_id == 20
        assert vg.name == "Counter Strike"
        assert vg.icon_url == "/media/games/cs/icon.png"
        assert vg.rank_per_role is True
        assert "rank_per_role=True" in repr(vg)

    def test_character_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        char = Character(character_id=5, name="Ahri", videogame=vg, icon_url="/ahri.png")

        assert char.character_id == 5
        assert char.name == "Ahri"
        assert char.videogame.name == "LoL"
        assert char.icon_url == "/ahri.png"

        vg2 = Videogame(videogame_id=2, name="Valorant", icon_url="/val.png", rank_per_role=False)
        char.character_id = 6
        char.name = "Jett"
        char.videogame = vg2
        char.icon_url = "/jett.png"

        assert char.character_id == 6
        assert char.name == "Jett"
        assert char.videogame.name == "Valorant"
        assert char.icon_url == "/jett.png"

    def test_role_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        role = Role(role_id=3, name="Support", videogame=vg, icon_url="/support.png")

        assert role.role_id == 3
        assert role.name == "Support"
        assert role.videogame == vg
        assert role.icon_url == "/support.png"

        role.role_id = 4
        role.name = "Jungler"
        role.videogame = vg
        role.icon_url = "/jungler.png"
        assert role.role_id == 4
        assert role.name == "Jungler"
        assert role.icon_url == "/jungler.png"

    def test_rank_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        rank = Rank(rank_id=1, name="Silver", value=500, videogame=vg, icon_url="/silver.png")

        assert rank.rank_id == 1
        assert rank.name == "Silver"
        assert rank.value == 500
        assert rank.videogame == vg
        assert rank.icon_url == "/silver.png"

        rank.rank_id = 2
        rank.name = "Gold"
        rank.value = 1000
        rank.icon_url = "/gold.png"
        vg2 = Videogame(videogame_id=2, name="Valorant", icon_url="/val.png", rank_per_role=False)
        rank.videogame = vg2
        assert rank.rank_id == 2
        assert rank.name == "Gold"
        assert rank.value == 1000
        assert rank.videogame == vg2
        assert rank.icon_url == "/gold.png"

    def test_character_priority_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        char1 = Character(character_id=1, name="Ahri", videogame=vg, icon_url="/ahri.png")
        char_priority = CharacterPriority(priority_id=10, character=char1, priority=1)

        assert char_priority.priority_id == 10
        assert char_priority.character == char1
        assert char_priority.priority == 1

        char2 = Character(character_id=2, name="Yasuo", videogame=vg, icon_url="/yasuo.png")
        char_priority.priority_id = 20
        char_priority.character = char2
        char_priority.priority = 2

        assert char_priority.priority_id == 20
        assert char_priority.character == char2
        assert char_priority.priority == 2

    def test_role_profile_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        role = Role(role_id=1, name="Mid", videogame=vg, icon_url="/mid.png")
        rank = Rank(rank_id=1, name="Diamond", value=3000, videogame=vg, icon_url="/diamond.png")

        rp = RoleProfile(role_profile_id=100, role=role, rank=rank)
        assert rp.role_profile_id == 100
        assert rp.role.name == "Mid"
        assert rp.rank.name == "Diamond"

        rp.role_profile_id = 101
        role2 = Role(role_id=2, name="ADC", videogame=vg, icon_url="/adc.png")
        rank2 = Rank(rank_id=2, name="Master", value=4000, videogame=vg, icon_url="/master.png")
        rp.role = role2
        rp.rank = rank2

        assert rp.role_profile_id == 101
        assert rp.role.name == "ADC"
        assert rp.rank.name == "Master"

    def test_game_profile_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        char = Character(character_id=1, name="Ahri", videogame=vg, icon_url="/ahri.png")
        cp = CharacterPriority(priority_id=1, character=char, priority=1)
        role = Role(role_id=1, name="Mid", videogame=vg, icon_url="/mid.png")
        rank = Rank(rank_id=1, name="Challenger", value=5000, videogame=vg, icon_url="/chal.png")
        rp = RoleProfile(role_profile_id=1, role=role, rank=rank)

        gp = GameProfile(
            game_profile_id=50,
            player_id=1,
            videogame=vg,
            characters_priority=[cp],
            role_profiles=[rp]
        )

        assert gp.game_profile_id == 50
        assert gp.player_id == 1
        assert gp.videogame.name == "LoL"
        assert len(gp.characters_priority) == 1
        assert len(gp.role_profiles) == 1

        # Setters
        gp.game_profile_id = 51
        gp.player_id = 2
        vg2 = Videogame(videogame_id=2, name="Valorant", icon_url="/val.png", rank_per_role=False)
        gp.videogame = vg2
        gp.characters_priority = []
        gp.role_profiles = []

        assert gp.game_profile_id == 51
        assert gp.player_id == 2
        assert gp.videogame == vg2
        assert gp.characters_priority == []
        assert gp.role_profiles == []
