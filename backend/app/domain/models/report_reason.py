from enum import Enum


class ReportReason(str, Enum):
    CHEATING = "cheating"
    ABUSIVE_BEHAVIOR = "abusive_behavior"
    SPAMMING = "spamming"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    OTHER = "other"