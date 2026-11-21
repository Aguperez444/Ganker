import { expect, it } from "vitest";
import {
  parametrosReporteDenuncias,
  periodoReciente,
} from "./reporteDenuncias";

it("incluye todos los días elegidos y convierte sus límites locales a UTC", () => {
  const params = parametrosReporteDenuncias({
    desde: "2026-10-31",
    hasta: "2026-10-31",
    limite: "25",
  });
  expect(new Date(params.start_date).getTime()).toBe(
    new Date(2026, 9, 31).getTime()
  );
  expect(new Date(params.end_date).getTime()).toBe(
    new Date(2026, 10, 1).getTime()
  );
  expect(params.ranking_limit).toBe(25);
});

it("genera treinta días de calendario y permite todo el historial", () => {
  expect(periodoReciente(30, new Date(2026, 10, 16, 15))).toEqual({
    desde: "2026-10-18",
    hasta: "2026-11-16",
    limite: "10",
  });
  expect(parametrosReporteDenuncias(periodoReciente(null))).toEqual({
    ranking_limit: 10,
  });
});
