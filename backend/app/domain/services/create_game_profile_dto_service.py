from typing import cast

from app.domain.models.game_profile import GameProfile


from app.infrastructure.api.dto.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.rank_object_response import RankObjectResponse
from app.infrastructure.api.dto.role_object_response import RoleObjectResponse
from app.infrastructure.api.dto.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.update_videogame_profile_response import UpdateGameProfileResponse
from app.infrastructure.api.dto.videogame_object_response import VideogameObjectResponse


class CreateGameProfileDTOService:
    @staticmethod
    def create_game_profile(domain_game_profile: 'GameProfile'):
        return UpdateGameProfileResponse(
            game_profile_id=cast(int, domain_game_profile.game_profile_id),
            player_id=domain_game_profile.player_id,
            videogame=VideogameObjectResponse(id=domain_game_profile.videogame.videogame_id, name=domain_game_profile.videogame.name),
            characters=[CharacterObjectResponse(character_id=character.character_id, name=character.name) for character in domain_game_profile.characters],
            role_profiles=[RoleProfileObjectResponse(
                role_profile_id=cast(int,role_profile.role_profile_id),
                role=RoleObjectResponse(role_id=role_profile.role.role_id, name=role_profile.role.name),
                rank=RankObjectResponse(
                    rank_id=cast(int, role_profile.rank.rank_id), name=role_profile.rank.name,
                    icon_url= role_profile.rank.icon_url, value=role_profile.rank.value)
            ) for role_profile in domain_game_profile.role_profiles]
        )