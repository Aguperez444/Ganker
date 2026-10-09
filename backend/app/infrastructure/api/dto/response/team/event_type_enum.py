from enum import Enum

class TeamEventTypeEnum(str, Enum):
    TEAM_MEMBER_JOINED = "TEAM_MEMBER_JOINED"
    TEAM_CREATED = "TEAM_CREATED"
    TEAM_UPDATED = "TEAM_UPDATED"