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

        ordered_characters = [char_priority.character for char_priority in sorted(domain_game_profile.characters_priority, key=lambda cp: cp.priority)]

        return UpdateGameProfileResponse(
            game_profile_id=cast(int, domain_game_profile.game_profile_id),
            player_id=domain_game_profile.player_id,
            videogame=VideogameObjectResponse(id=cast(int, domain_game_profile.videogame.videogame_id), name=domain_game_profile.videogame.name, icon_url=domain_game_profile.videogame.icon_url),
            characters=[CharacterObjectResponse(character_id=cast(int, character.character_id), name=character.name, icon_url=character.icon_url) for character in ordered_characters],
            role_profiles=[RoleProfileObjectResponse(
                role_profile_id=cast(int,role_profile.role_profile_id),
                role=RoleObjectResponse(role_id=cast(int, role_profile.role.role_id), name=role_profile.role.name, icon_url=role_profile.role.icon_url),
                rank=RankObjectResponse(
                    rank_id=cast(int, role_profile.rank.rank_id), name=role_profile.rank.name,
                    icon_url= role_profile.rank.icon_url, value=role_profile.rank.value)
            ) for role_profile in domain_game_profile.role_profiles]
        )