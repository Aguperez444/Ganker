import pytest
from app.domain.services.create_game_profile_dto_service import CreateGameProfileDTOService
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.character_priority import CharacterPriority
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile


class TestCreateGameProfileDTOService:

    def test_create_game_profile_dto_orders_characters_by_priority(self):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        char1 = Character(character_id=10, name="Ahri", videogame=vg, icon_url="/ahri.png")
        char2 = Character(character_id=20, name="Yasuo", videogame=vg, icon_url="/yasuo.png")
        char3 = Character(character_id=30, name="Jinx", videogame=vg, icon_url="/jinx.png")

        # Unordered list of character priorities: priority 3, then 1, then 2
        cp1 = CharacterPriority(priority_id=1, character=char3, priority=3)
        cp2 = CharacterPriority(priority_id=2, character=char1, priority=1)
        cp3 = CharacterPriority(priority_id=3, character=char2, priority=2)

        role = Role(role_id=1, name="Mid", videogame=vg, icon_url="/mid.png")
        rank = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/gold.png")
        rp = RoleProfile(role_profile_id=100, role=role, rank=rank)

        gp = GameProfile(
            game_profile_id=5,
            player_id=42,
            videogame=vg,
            characters_priority=[cp1, cp2, cp3],
            role_profiles=[rp]
        )

        dto = CreateGameProfileDTOService.create_update_game_profile(gp)

        assert dto.game_profile_id == 5
        assert dto.player_id == 42
        assert dto.videogame.id == 1
        assert dto.videogame.name == "LoL"

        # Verify characters are ordered by priority 1 (Ahri), 2 (Yasuo), 3 (Jinx)
        assert len(dto.characters) == 3
        assert dto.characters[0].character_id == 10
        assert dto.characters[0].name == "Ahri"
        assert dto.characters[1].character_id == 20
        assert dto.characters[1].name == "Yasuo"
        assert dto.characters[2].character_id == 30
        assert dto.characters[2].name == "Jinx"

        # Verify role profiles
        assert len(dto.role_profiles) == 1
        assert dto.role_profiles[0].role_profile_id == 100
        assert dto.role_profiles[0].role.role_id == 1
        assert dto.role_profiles[0].rank.rank_id == 1
