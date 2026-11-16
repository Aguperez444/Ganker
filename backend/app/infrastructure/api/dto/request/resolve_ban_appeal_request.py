from typing import Literal

from pydantic import BaseModel


class ResolveBanAppealRequest(BaseModel):
    decision: Literal["accepted", "rejected"]
