import pytest
from app.domain.models.player import Player
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile


class TestDomainModels:

    def test_player_instantiation_and_properties(self):
        player = Player(
            player_id=1,
            username="player1",
            name="Player One",
            mail="player1@example.com",
            password_hash="hashed_pw",
            profiles=[]
        )

        assert player.player_id == 1
        assert player.username == "player1"
        assert player.name == "Player One"
        assert player.mail == "player1@example.com"
        assert player.password_hash == "hashed_pw"
        assert player.profiles == []

        # Test setters
        player.player_id = 2
        player.username = "player2"
        player.name = "Player Two"
        player.mail = "player2@example.com"
        player.password_hash = "new_hash"
        player.profiles = ["profile1"]

        assert player.player_id == 2
        assert player.username == "player2"
        assert player.name == "Player Two"
        assert player.mail == "player2@example.com"
        assert player.password_hash == "new_hash"
        assert player.profiles == ["profile1"]

    def test_videogame_instantiation_and_properties(self):
        vg = Videogame(videogame_id=10, name="Dota 2")
        assert vg.videogame_id == 10
        assert vg.name == "Dota 2"

        vg.videogame_id = 20
        vg.name = "Counter Strike"
        assert vg.videogame_id == 20
        assert vg.name == "Counter Strike"

    def test_character_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL")
        char = Character(character_id=5, name="Ahri", videogame=vg)

        assert char.character_id == 5
        assert char.name == "Ahri"
        assert char.videogame.name == "LoL"

        vg2 = Videogame(videogame_id=2, name="Valorant")
        char.character_id = 6
        char.name = "Jett"
        char.videogame = vg2

        assert char.character_id == 6
        assert char.name == "Jett"
        assert char.videogame.name == "Valorant"

    def test_role_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL")
        role = Role(role_id=3, name="Support", videogame=vg)

        assert role.role_id == 3
        assert role.name == "Support"
        assert role.videogame == vg

        role.role_id = 4
        role.name = "Jungler"
        role.videogame = vg
        assert role.role_id == 4
        assert role.name == "Jungler"

    def test_rank_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL")
        rank = Rank(rank_id=1, name="Silver", value=500, videogame=vg)

        assert rank.rank_id == 1
        assert rank.name == "Silver"
        assert rank.value == 500
        assert rank.videogame == vg

        rank.rank_id = 2
        rank.name = "Gold"
        rank.value = 1000
        vg2 = Videogame(videogame_id=2, name="Valorant")
        rank.videogame = vg2
        assert rank.rank_id == 2
        assert rank.name == "Gold"
        assert rank.value == 1000
        assert rank.videogame == vg2

    def test_role_profile_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL")
        role = Role(role_id=1, name="Mid", videogame=vg)
        rank = Rank(rank_id=1, name="Diamond", value=3000, videogame=vg)

        rp = RoleProfile(role_profile_id=100, role=role, rank=rank)
        assert rp.role_profile_id == 100
        assert rp.role.name == "Mid"
        assert rp.rank.name == "Diamond"

        rp.role_profile_id = 101
        role2 = Role(role_id=2, name="ADC", videogame=vg)
        rank2 = Rank(rank_id=2, name="Master", value=4000, videogame=vg)
        rp.role = role2
        rp.rank = rank2

        assert rp.role_profile_id == 101
        assert rp.role.name == "ADC"
        assert rp.rank.name == "Master"

    def test_game_profile_instantiation_and_properties(self):
        vg = Videogame(videogame_id=1, name="LoL")
        char = Character(character_id=1, name="Ahri", videogame=vg)
        role = Role(role_id=1, name="Mid", videogame=vg)
        rank = Rank(rank_id=1, name="Challenger", value=5000, videogame=vg)
        rp = RoleProfile(role_profile_id=1, role=role, rank=rank)

        gp = GameProfile(
            game_profile_id=50,
            player_id=1,
            videogame=vg,
            characters=[char],
            role_profiles=[rp]
        )

        assert gp.game_profile_id == 50
        assert gp.player_id == 1
        assert gp.videogame.name == "LoL"
        assert len(gp.characters) == 1
        assert len(gp.role_profiles) == 1

        # Setters
        gp.game_profile_id = 51
        gp.player_id = 2
        vg2 = Videogame(videogame_id=2, name="Valorant")
        gp.videogame = vg2
        gp.characters = []
        gp.role_profiles = []

        assert gp.game_profile_id == 51
        assert gp.player_id == 2
        assert gp.videogame == vg2
        assert gp.characters == []
        assert gp.role_profiles == []
