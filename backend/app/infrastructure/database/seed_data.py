import csv
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.rank_orm import RankORM

SEEDS_DIR = Path(__file__).resolve().parent / "seeds"


def _read_csv(filename: str) -> list[dict]:
    filepath = SEEDS_DIR / filename
    if not filepath.exists():
        return []
    with open(filepath, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader)


def seed_database(session: Session) -> None:
    # 1. Videogames
    if not session.execute(select(VideogameORM).limit(1)).scalar_one_or_none():
        print("[*] Seed: Insertando Videogames...")
        games_data = _read_csv("games.csv")
        for row in games_data:
            session.add(
                VideogameORM(
                    name=row["name"],
                    icon_url=row["icon_url"],
                    rank_per_role=row["rank_per_role"] in ("1", "True", "true"),
                )
            )
        session.commit()
        print("[*] Seed: Videogames insertados.")

    # 2. Users
    if not session.execute(select(UserORM).limit(1)).scalar_one_or_none():
        print("[*] Seed: Insertando Users...")
        users_data = _read_csv("USERS.csv")
        for row in users_data:
            session.add(
                UserORM(
                    name=row["name"],
                    username=row["username"],
                    mail=row["mail"] if row["mail"] else None,
                    password_hash=row["password_hash"] if row["password_hash"] else None,
                    role=row["role"],
                    icon_url=row["icon_url"] if row["icon_url"] else None,
                )
            )
        session.commit()
        print("[*] Seed: Users insertados.")

    # 3. Roles
    if not session.execute(select(RoleORM).limit(1)).scalar_one_or_none():
        print("[*] Seed: Insertando Roles...")
        roles_data = _read_csv("roles.csv")
        for row in roles_data:
            session.add(
                RoleORM(
                    videogame_id=int(row["videogame_id"]),
                    name=row["name"],
                    icon_url=row["icon_url"],
                )
            )
        session.commit()
        print("[*] Seed: Roles insertados.")

    # 4. Ranks
    if not session.execute(select(RankORM).limit(1)).scalar_one_or_none():
        print("[*] Seed: Insertando Ranks...")
        ranks_data = _read_csv("ranks.csv")
        for row in ranks_data:
            session.add(
                RankORM(
                    videogame_id=int(row["videogame_id"]),
                    name=row["name"],
                    value=int(row["value"]),
                    icon_url=row["icon_url"],
                )
            )
        session.commit()
        print("[*] Seed: Ranks insertados.")

    # 5. Characters
    if not session.execute(select(CharacterORM).limit(1)).scalar_one_or_none():
        print("[*] Seed: Insertando Characters...")
        characters_data = _read_csv("characters.csv")
        for row in characters_data:
            session.add(
                CharacterORM(
                    videogame_id=int(row["videogame_id"]),
                    name=row["name"],
                    icon_url=row["icon_url"],
                )
            )
        session.commit()
        print("[*] Seed: Characters insertados.")