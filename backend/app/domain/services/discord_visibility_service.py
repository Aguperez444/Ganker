from typing import TYPE_CHECKING, Optional

from app.domain.models.discord_account_link import DiscordVisibility

if TYPE_CHECKING:
    from app.domain.models.discord_account_link import DiscordAccountLink
    from app.domain.models.team import Team


class DiscordVisibilityService:

    @staticmethod
    def can_view(link: 'DiscordAccountLink', viewer_id: int, owner_active_team: Optional['Team']) -> bool:
        """El dueño siempre la ve; los demás, según la visibilidad que eligió (todos o su equipo activo)."""
        if viewer_id == link.user_id:
            return True
        if link.visibility == DiscordVisibility.EVERYONE:
            return True
        return owner_active_team is not None and owner_active_team.has_member(viewer_id)
