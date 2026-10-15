from enum import Enum


class LolServer(str, Enum):
    """Servidores de League of Legends. El valor es el código de plataforma que usa Riot."""
    LAS = "la2"
    LAN = "la1"
    BR = "br1"
    NA = "na1"
    EUW = "euw1"
    EUNE = "eun1"
    TR = "tr1"
    RU = "ru"
    ME = "me1"
    KR = "kr"
    JP = "jp1"
    OCE = "oc1"
    SEA = "sg2"
    TW = "tw2"
    VN = "vn2"
