/**
 * Utilidades de validación de negocio para Equipos (US 01, US 02, US 03).
 */

export function buscarPerfilDeJuegoDeUsuario(user, videogameId, videogameName) {
  if (!user?.profiles || !Array.isArray(user.profiles)) return null;

  return (
    user.profiles.find((p) => {
      if (videogameId && p.videogame?.id) {
        return Number(p.videogame.id) === Number(videogameId);
      }
      if (videogameName && p.videogame?.name) {
        return (
          p.videogame.name.trim().toLowerCase() ===
          videogameName.trim().toLowerCase()
        );
      }
      return false;
    }) ?? null
  );
}

export function validarFormularioCrearEquipo({
  name,
  videogame_id,
  region_id,
  allow_other_regions,
  min_rank_id,
  max_rank_id,
  creator_game_role_id,
  vacant_game_role_ids = [],
  ranks = [],
  user = null,
  estaEnEquipoActivo = false,
}) {
  const errores = {};

  // 1. Campos obligatorios no vacíos
  if (!name || !name.trim()) {
    errores.name = "El nombre del equipo es obligatorio.";
  }

  if (!videogame_id) {
    errores.videogame_id = "Debes seleccionar un videojuego.";
  }

  if (!allow_other_regions && !region_id) {
    errores.region_id =
      "Debes seleccionar una región o habilitar jugadores de otras regiones.";
  }

  if (!min_rank_id) {
    errores.min_rank_id = "Debes seleccionar el rango mínimo.";
  }

  if (!max_rank_id) {
    errores.max_rank_id = "Debes seleccionar el rango máximo.";
  }

  if (!creator_game_role_id) {
    errores.creator_game_role_id = "Debes seleccionar tu rol como creador.";
  }

  if (!vacant_game_role_ids || vacant_game_role_ids.length === 0) {
    errores.vacant_slots = "El equipo debe tener al menos un cupo vacante.";
  } else if (vacant_game_role_ids.some((id) => !id)) {
    errores.vacant_roles =
      "Debes seleccionar un rol para cada cupo vacante disponible.";
  }

  // 2. No se permite crear si ya está en otro equipo activo
  if (estaEnEquipoActivo) {
    errores.general =
      "No se permite crear un equipo si ya eres miembro o líder de otro equipo activo.";
  }

  // 3. Validar rango mínimo no superior al máximo
  const minRank = ranks.find((r) => Number(r.rank_id) === Number(min_rank_id));
  const maxRank = ranks.find((r) => Number(r.rank_id) === Number(max_rank_id));

  if (minRank && maxRank) {
    if (Number(minRank.value) > Number(maxRank.value)) {
      errores.min_rank_id =
        "El rango mínimo no puede ser superior al rango máximo.";
    }
  }

  // 4. Validar perfil de juego del jugador creador y su rango dentro de los límites
  if (videogame_id && user) {
    const userGameProfile = buscarPerfilDeJuegoDeUsuario(user, videogame_id);

    if (!userGameProfile) {
      errores.general =
        "Debes tener un perfil de juego para este videojuego antes de crear un equipo.";
    } else {
      // Validar región si el equipo no admite otras
      if (
        !allow_other_regions &&
        region_id &&
        userGameProfile.region?.region_id &&
        Number(userGameProfile.region.region_id) !== Number(region_id)
      ) {
        errores.region_id =
          "Tu región de juego no coincide con la región seleccionada para el equipo.";
      }

      // Validar rol y rango del creador
      if (creator_game_role_id) {
        const creatorRoleProfile = userGameProfile.role_profiles?.find(
          (rp) => Number(rp.role?.role_id) === Number(creator_game_role_id)
        );

        if (!creatorRoleProfile) {
          errores.creator_game_role_id =
            "Tu perfil de juego no tiene configurado el rol seleccionado.";
        } else if (minRank && maxRank) {
          const userRankVal = Number(creatorRoleProfile.rank?.value);
          const minVal = Number(minRank.value);
          const maxVal = Number(maxRank.value);

          if (userRankVal < minVal || userRankVal > maxVal) {
            errores.creator_game_role_id = `Tu propio rango (${
              creatorRoleProfile.rank?.name || ""
            }) queda excluido de los requisitos configurados (${minRank.name} - ${
              maxRank.name
            }).`;
          }
        }
      }
    }
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
}

export function validarUnirseEquipo({
  team,
  user,
  targetRoleId,
  ranks = [],
  estaEnEquipoActivo = false,
}) {
  // 1. Validar que el equipo cuente con al menos una vacante
  const hayVacantes =
    team.player_count < team.max_players ||
    team.members?.some((m) => m.user_id === null);

  if (!hayVacantes) {
    return {
      esValido: false,
      error:
        "El equipo ya alcanzó el límite máximo de jugadores y no posee vacantes.",
    };
  }

  // 2. Validar que el jugador no forme parte activa de otro equipo
  if (estaEnEquipoActivo) {
    return {
      esValido: false,
      error:
        "No se permite unirse a un equipo estando ya integrado en otro equipo activo.",
    };
  }

  // 3. Validar perfil de juego del usuario
  if (!user) {
    return {
      esValido: false,
      error: "Debes iniciar sesión para unirte a un equipo.",
    };
  }

  const userGameProfile = buscarPerfilDeJuegoDeUsuario(
    user,
    team.videogame_id,
    team.videogame_name
  );

  if (!userGameProfile) {
    return {
      esValido: false,
      error: "No posees un perfil de juego para el videojuego de este equipo.",
    };
  }

  // 4. Validar rol para la vacante deseada
  if (!targetRoleId) {
    return {
      esValido: false,
      error: "Debes seleccionar la vacante o rol al que deseas postularte.",
    };
  }

  const userRoleProfile = userGameProfile.role_profiles?.find(
    (rp) => Number(rp.role?.role_id) === Number(targetRoleId)
  );

  if (!userRoleProfile) {
    return {
      esValido: false,
      error:
        "No tienes configurado en tu perfil el rol correspondiente a esta vacante.",
    };
  }

  // 5. Validar rango
  const userRankVal = Number(userRoleProfile.rank?.value);

  // Obtener min_val y max_val
  let minVal =
    team.min_rank_value !== undefined && team.min_rank_value !== null
      ? Number(team.min_rank_value)
      : null;
  let maxVal =
    team.max_rank_value !== undefined && team.max_rank_value !== null
      ? Number(team.max_rank_value)
      : null;

  if (minVal === null && team.min_rank_id && ranks.length > 0) {
    const r = ranks.find((x) => Number(x.rank_id) === Number(team.min_rank_id));
    if (r) minVal = Number(r.value);
  }
  if (maxVal === null && team.max_rank_id && ranks.length > 0) {
    const r = ranks.find((x) => Number(x.rank_id) === Number(team.max_rank_id));
    if (r) maxVal = Number(r.value);
  }

  if (minVal !== null && userRankVal < minVal) {
    return {
      esValido: false,
      error: `Tu rango (${
        userRoleProfile.rank?.name || ""
      }) es inferior al rango mínimo requerido (${team.min_rank_name || "mínimo"}).`,
    };
  }

  if (maxVal !== null && userRankVal > maxVal) {
    return {
      esValido: false,
      error: `Tu rango (${
        userRoleProfile.rank?.name || ""
      }) es superior al rango máximo permitido (${team.max_rank_name || "máximo"}).`,
    };
  }

  // 6. Validar región
  const allowOthers = Boolean(team.allow_other_regions);
  if (!allowOthers) {
    const teamRegionId = team.region_id;
    const teamRegionName = team.region_name;
    const userRegionId = userGameProfile.region?.region_id;
    const userRegionName = userGameProfile.region?.name;

    const noCoincideId =
      teamRegionId &&
      userRegionId &&
      Number(teamRegionId) !== Number(userRegionId);
    const noCoincideName =
      teamRegionName &&
      userRegionName &&
      teamRegionName.trim().toLowerCase() !==
        userRegionName.trim().toLowerCase();

    if (noCoincideId || (!teamRegionId && noCoincideName)) {
      return {
        esValido: false,
        error:
          "El equipo tiene restricción de región y perteneces a una región distinta.",
      };
    }
  }

  return {
    esValido: true,
    error: null,
  };
}
