from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class GenerateGameProfileReportRequest(BaseModel):
    start_date: Optional[date] = Field(None, description="Fecha inicial del período a reportar (inclusive). Si se omite, se considera el histórico total.")
    end_date: Optional[date] = Field(None,description="Fecha final del período a reportar (inclusive). Si se omite, se considera el histórico total.")
