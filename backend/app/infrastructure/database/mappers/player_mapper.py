from app.domain.models.player import Player
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.models.player_orm import PlayerORM


class PlayerMapper:
    @staticmethod
    def orm_to_domain(player_orm: PlayerORM) -> Player:
        return Player(
            player_id=player_orm.player_id,
            username=player_orm.username,
            name=player_orm.name,
            mail=player_orm.mail,
            password_hash=player_orm.password_hash,
            profiles = [GameProfileMapper.orm_to_domain(game_profile) for game_profile in player_orm.game_profiles]
        )

    @staticmethod
    def domain_to_orm(player: Player) -> PlayerORM:
        return PlayerORM(
            player_id=player.player_id,
            username=player.username,
            name=player.name,
            mail=player.mail,
            password_hash=player.password_hash
        )