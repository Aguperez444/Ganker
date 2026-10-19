import csv
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import (
    CharacterORM,
    ConversationMemberORM,
    ConversationORM,
    GameProfileORM,
    RankORM,
    RoleORM,
    RoleProfileORM,
    TeamMemberRoleORM,
    TeamORM,
    UserORM,
    VideogameORM,
    UsersBanned,
    PlayerReportORM
)

SEEDS_DIR = Path(__file__).resolve().parent / "seeds"

# Mapeos de los roles dentro de un equipo a los valores que persisten las tablas.
# TeamRoleEnum: OWNER=1, ADMIN=2, MEMBER=3
_TEAM_ROLE_IDS = {"owner": 1, "admin": 2, "member": 3}
# ConversationMemberRoleEnum: ADMIN=1, MEMBER=2 (el dueño del equipo es ADMIN del chat)
_CONVERSATION_ROLE_IDS = {"owner": 1, "admin": 1, "member": 2}


def _read_csv(filename: str) -> list[dict]:
    filepath = SEEDS_DIR / filename
    if not filepath.exists():
        return []
    with open(filepath, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader)


def _parse_str(val: str | None) -> str | None:
    if not val or val.strip().upper() in ("", "NULL", "NONE"):
        return None
    return val.strip()


def _parse_datetime(val: str | None) -> datetime | None:
    parsed = _parse_str(val)
    if not parsed:
        return None
    try:
        # Ajusta el formato ISO si tus CSV guardan timestamps reales (ej: 2026-10-04 12:00:00)
        return datetime.fromisoformat(parsed)
    except ValueError:
        return None


def _parse_bool(val: str | None, default: bool = True) -> bool:
    parsed = _parse_str(val)
    if parsed is None:
        return default
    return parsed.lower() in ("1", "true", "yes", "si", "sí")


def _update_if_changed(orm_object, values: dict) -> None:
    """Asigna cada campo sólo si cambió, para no marcar filas innecesariamente."""
    for field, value in values.items():
        if getattr(orm_object, field) != value:
            setattr(orm_object, field, value)


# ---------------------------------------------------------------------------
# Catálogos: juegos, roles, rangos y personajes.
# Se sincronizan por clave natural, así el seed es idempotente y agrega lo que
# falte sin duplicar lo que ya está en la base.
# ---------------------------------------------------------------------------
def _seed_videogames(session: Session) -> None:
    print("[*] Seed: Sincronizando Videogames...")
    for row in _read_csv("games.csv"):
        name = row["name"].strip()
        game = session.scalar(select(VideogameORM).where(VideogameORM.name == name))
        values = {
            "icon_url": row["icon_url"].strip(),
            "rank_per_role": _parse_bool(row.get("rank_per_role"), default=False),
            "has_characters": _parse_bool(row.get("has_characters"), default=True),
        }
        if game is None:
            session.add(VideogameORM(name=name, **values))
        else:
            _update_if_changed(game, values)
    session.flush()


def _seed_roles(session: Session) -> None:
    print("[*] Seed: Sincronizando Roles...")
    for row in _read_csv("roles.csv"):
        videogame_id = int(row["videogame_id"])
        name = row["name"].strip()
        icon_url = row["icon_url"].strip()
        role = session.scalar(
            select(RoleORM).where(RoleORM.videogame_id == videogame_id, RoleORM.name == name)
        )
        if role is None:
            session.add(RoleORM(videogame_id=videogame_id, name=name, icon_url=icon_url))
        elif role.icon_url != icon_url:
            role.icon_url = icon_url
    session.flush()


def _seed_ranks(session: Session) -> None:
    print("[*] Seed: Sincronizando Ranks...")
    desired_by_game: dict[int, list[tuple[str, int, str]]] = {}
    for row in _read_csv("ranks.csv"):
        desired_by_game.setdefault(int(row["videogame_id"]), []).append(
            (row["name"].strip(), int(row["value"]), row["icon_url"].strip())
        )

    for videogame_id, desired in desired_by_game.items():
        existing = {
            rank.name: rank
            for rank in session.scalars(
                select(RankORM).where(RankORM.videogame_id == videogame_id)
            ).all()
        }
        desired_names = {name for name, _, _ in desired}

        if set(existing) == desired_names and all(
            existing[name].value == value and existing[name].icon_url == icon
            for name, value, icon in desired
        ):
            continue

        # 1) Llevamos los valores actuales a un rango temporal negativo para no
        #    chocar con la restricción única (videogame_id, value) al reasignar.
        for rank in existing.values():
            rank.value = -rank.rank_id
        session.flush()

        # 2) Aplicamos los valores definitivos e insertamos los rangos faltantes.
        for name, value, icon in desired:
            rank = existing.get(name)
            if rank is None:
                session.add(
                    RankORM(videogame_id=videogame_id, name=name, value=value, icon_url=icon)
                )
            else:
                rank.value = value
                rank.icon_url = icon

        # 3) Eliminamos los rangos que ya no forman parte del catálogo del juego.
        for name, rank in existing.items():
            if name not in desired_names:
                session.delete(rank)

        session.flush()


def _seed_characters(session: Session) -> None:
    print("[*] Seed: Sincronizando Characters...")
    for row in _read_csv("characters.csv"):
        videogame_id = int(row["videogame_id"])
        name = row["name"].strip()
        icon_url = row["icon_url"].strip()
        character = session.scalar(
            select(CharacterORM).where(
                CharacterORM.videogame_id == videogame_id, CharacterORM.name == name
            )
        )
        if character is None:
            session.add(CharacterORM(videogame_id=videogame_id, name=name, icon_url=icon_url))
        elif character.icon_url != icon_url:
            character.icon_url = icon_url
    session.flush()


def _seed_users(session: Session) -> None:
    print("[*] Seed: Sincronizando Users...")
    for row in _read_csv("USERS.csv"):
        username = row["username"].strip()
        user = session.scalar(select(UserORM).where(UserORM.username == username))
        values = {
            "name": row["name"].strip(),
            "mail": _parse_str(row.get("mail")),
            "password_hash": _parse_str(row.get("password_hash")),
            "role": _parse_str(row.get("role")) or "player",
            "icon_url": _parse_str(row.get("icon_url")),
            "last_connection": _parse_datetime(row.get("last_connection")),
        }
        if user is None:
            session.add(UserORM(username=username, **values))
        else:
            _update_if_changed(user, values)
    session.flush()


# ---------------------------------------------------------------------------
# Datos de ejemplo: perfiles de juego (con role profiles) y equipos.
# Se referencian por claves naturales (username, nombre de juego/rol/rango) para
# no depender de los IDs autogenerados.
# ---------------------------------------------------------------------------
def _catalog_indexes(session: Session) -> tuple[dict, dict, dict, dict]:
    games = {game.name: game for game in session.scalars(select(VideogameORM)).all()}
    users = {user.username: user for user in session.scalars(select(UserORM)).all()}
    roles = {
        (role.videogame_id, role.name): role for role in session.scalars(select(RoleORM)).all()
    }
    ranks = {
        (rank.videogame_id, rank.name): rank for rank in session.scalars(select(RankORM)).all()
    }
    return games, users, roles, ranks


def _seed_game_profiles(session: Session) -> None:
    rows = _read_csv("game_profiles.csv")
    if not rows:
        return
    print("[*] Seed: Insertando GameProfiles y RoleProfiles de prueba...")
    games, users, roles, ranks = _catalog_indexes(session)

    profiles: dict[tuple[int, int], GameProfileORM] = {}
    for row in rows:
        username = row["username"].strip()
        game_name = row["videogame"].strip()
        user = users.get(username)
        game = games.get(game_name)
        if user is None or game is None:
            print(f"[!] Seed: se omite perfil {username}/{game_name} (usuario o juego inexistente).")
            continue

        key = (user.user_id, game.videogame_id)
        profile = profiles.get(key) or session.scalar(
            select(GameProfileORM).where(
                GameProfileORM.player_id == user.user_id,
                GameProfileORM.videogame_id == game.videogame_id,
            )
        )
        in_game_name = _parse_str(row.get("in_game_name"))
        if profile is None:
            profile = GameProfileORM(
                player_id=user.user_id,
                videogame_id=game.videogame_id,
                in_game_name=in_game_name,
            )
            session.add(profile)
            session.flush()
        elif profile.in_game_name != in_game_name:
            profile.in_game_name = in_game_name
        profiles[key] = profile

        role = roles.get((game.videogame_id, row["role"].strip()))
        rank = ranks.get((game.videogame_id, row["rank"].strip()))
        if role is None or rank is None:
            print(f"[!] Seed: rol/rango inexistente para {username}/{game_name}: {row.get('role')}/{row.get('rank')}")
            continue

        role_profile = session.scalar(
            select(RoleProfileORM).where(
                RoleProfileORM.game_profile_id == profile.game_profile_id,
                RoleProfileORM.role_id == role.role_id,
            )
        )
        if role_profile is None:
            session.add(
                RoleProfileORM(
                    game_profile_id=profile.game_profile_id,
                    role_id=role.role_id,
                    rank_id=rank.rank_id,
                )
            )
        elif role_profile.rank_id != rank.rank_id:
            role_profile.rank_id = rank.rank_id
    session.flush()


def _seed_teams(session: Session) -> None:
    team_rows = _read_csv("teams.csv")
    if not team_rows:
        return
    print("[*] Seed: Insertando Equipos de prueba...")
    games, users, roles, ranks = _catalog_indexes(session)

    members_by_team: dict[str, list[dict]] = {}
    for row in _read_csv("team_members.csv"):
        members_by_team.setdefault(row["team_name"].strip(), []).append(row)

    for row in team_rows:
        name = row["name"].strip()
        game = games.get(row["videogame"].strip())
        if game is None:
            print(f"[!] Seed: se omite equipo {name} (juego inexistente).")
            continue

        min_rank = ranks.get((game.videogame_id, row["min_rank"].strip()))
        max_rank = ranks.get((game.videogame_id, row["max_rank"].strip()))
        if min_rank is None or max_rank is None:
            print(f"[!] Seed: se omite equipo {name} (rangos inexistentes).")
            continue

        team = session.scalar(
            select(TeamORM).where(
                TeamORM.name == name, TeamORM.videogame_id == game.videogame_id
            )
        )
        if team is None:
            conversation = ConversationORM(type=2, name=f"Chat del equipo {name}")
            session.add(conversation)
            session.flush()
            team = TeamORM(
                name=name,
                description=_parse_str(row.get("description")),
                allow_other_regions=_parse_bool(row.get("allow_other_regions"), default=True),
                icon_url=_parse_str(row.get("icon_url")),
                is_active=True,
                videogame_id=game.videogame_id,
                region_id=None,
                min_rank_id=min_rank.rank_id,
                max_rank_id=max_rank.rank_id,
                conversation_id=conversation.conversation_id,
            )
            session.add(team)
            session.flush()

        # Se reconcilian los cupos por rol de juego: se actualizan los existentes
        # (incluido liberar cupos vacantes) y se crean los que falten.
        conversation_id = team.conversation_id
        existing_slots = {slot.game_role_id: slot for slot in team.members_roles}
        joined_user_ids: set[int] = set()

        for member in members_by_team.get(name, []):
            game_role = roles.get((game.videogame_id, member["game_role"].strip()))
            if game_role is None:
                print(f"[!] Seed: rol de juego inexistente en {name}: {member.get('game_role')}")
                continue
            team_role = (member.get("team_role") or "member").strip().lower()
            team_role_id = _TEAM_ROLE_IDS.get(team_role, 3)
            username = (member.get("username") or "").strip()
            user = users.get(username) if username else None
            user_id = user.user_id if user else None

            slot = existing_slots.get(game_role.role_id)
            if slot is None:
                session.add(
                    TeamMemberRoleORM(
                        team_role_id=team_role_id,
                        game_role_id=game_role.role_id,
                        team_id=team.team_id,
                        user_id=user_id,
                    )
                )
            else:
                slot.team_role_id = team_role_id
                slot.user_id = user_id

            if user_id is None:
                continue

            joined_user_ids.add(user_id)
            conversation_member = session.scalar(
                select(ConversationMemberORM).where(
                    ConversationMemberORM.conversation_id == conversation_id,
                    ConversationMemberORM.user_id == user_id,
                )
            )
            conversation_role_id = _CONVERSATION_ROLE_IDS.get(team_role, 2)
            if conversation_member is None:
                session.add(
                    ConversationMemberORM(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        role=conversation_role_id,
                    )
                )
            else:
                conversation_member.role = conversation_role_id

        session.flush()

        # Quienes ya no ocupan ningún cupo dejan de tener acceso al chat del equipo.
        if joined_user_ids:
            for conversation_member in session.scalars(
                select(ConversationMemberORM).where(
                    ConversationMemberORM.conversation_id == conversation_id
                )
            ).all():
                if conversation_member.user_id not in joined_user_ids:
                    session.delete(conversation_member)
            session.flush()


def seed_database(session: Session) -> None:
    # El orden importa: los perfiles y equipos referencian a los catálogos y usuarios.
    _seed_videogames(session)
    _seed_roles(session)
    _seed_ranks(session)
    _seed_characters(session)
    _seed_users(session)
    _seed_game_profiles(session)
    _seed_teams(session)
    session.commit()
    print("[*] Seed: datos sincronizados.")
