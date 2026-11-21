from datetime import datetime

from pydantic import BaseModel


class ModerationCountResponse(BaseModel):
    key: str
    count: int


class ReportGameCountResponse(BaseModel):
    videogame_id: int | None
    name: str
    count: int


class ReportedPlayerRankingResponse(BaseModel):
    user_id: int
    username: str
    deleted: bool
    count: int
    reporters: int


class BannedPlayerRankingResponse(BaseModel):
    user_id: int
    username: str
    deleted: bool
    count: int
    repeat_offender: bool


class PlayerReportStatisticsResponse(BaseModel):
    total: int
    pending: int
    resolved: int
    dismissed: int
    reported_players: int
    reporters: int
    with_evidence: int
    without_game: int
    reasons: list[ModerationCountResponse]
    games: list[ReportGameCountResponse]
    top_players: list[ReportedPlayerRankingResponse]


class BanStatisticsResponse(BaseModel):
    total: int
    active: int
    finalized: int
    banned_players: int
    repeat_offenders: int
    outcomes: list[ModerationCountResponse]
    top_players: list[BannedPlayerRankingResponse]


class AppealStatisticsResponse(BaseModel):
    total: int
    pending: int
    accepted: int
    rejected: int


class ModerationActivityResponse(BaseModel):
    month: str
    reports: int
    bans: int


class ModerationStatisticsResponse(BaseModel):
    generated_at: datetime
    start_date: datetime | None
    end_date: datetime
    ranking_limit: int
    reports: PlayerReportStatisticsResponse
    bans: BanStatisticsResponse
    appeals: AppealStatisticsResponse
    activity: list[ModerationActivityResponse]
