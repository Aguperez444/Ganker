import axiosClient from "./axiosClient";

// US 35 - Reportar a otro jugador.
//   POST /api/v1/moderation/ -> { reported_id, reason, description }
//
// `reason` es uno de los valores de ReportReason en el backend:
// cheating | abusive_behavior | spamming | inappropriate_content | other.
// La descripcion es opcional para el jugador, pero el backend la declara
// obligatoria en el request: se manda siempre, vacia si no escribio nada.
export function reportarJugador({ reportedId, motivo, descripcion }) {
  return axiosClient
    .post("/api/v1/moderation/", {
      reported_id: Number(reportedId),
      reason: motivo,
      description: (descripcion ?? "").trim(),
    })
    .then((res) => res.data);
}
