from enum import Enum


class ReportStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    REJECTED = "rejected"
