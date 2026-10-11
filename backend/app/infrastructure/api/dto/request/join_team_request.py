from pydantic import BaseModel, Field


class JoinTeamRequest(BaseModel):
    target_team_member_role_id: int = Field(..., description="ID del slot de miembro del equipo al que el usuario desea unirse")