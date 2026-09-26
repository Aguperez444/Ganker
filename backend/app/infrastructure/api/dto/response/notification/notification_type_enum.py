from enum import Enum

class NotificationType(str, Enum):
    MESSAGES_READ = "MESSAGES_READ_NOTIFICATION"
    NEW_MESSAGE = "NEW_MESSAGE_NOTIFICATION"