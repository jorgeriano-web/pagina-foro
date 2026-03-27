import { HttpsError } from "firebase-functions/v2/https";
import { SALAS_EXPERIENCIA } from "../models/salaExperiencia";
import {
  agregarDatosClienteReservaSalaAlSheet,
  ClienteReservaSalaData,
  contarFilasReservasSala,
} from "./sheetService";

function salaPorIdSala(idSala: number) {
  return SALAS_EXPERIENCIA.find((s) => s.id === idSala);
}

/**
 * Si la sala no existe o no tiene capacidad (0), no reserva.
 * Cuando `cuposReservados` refleje datos reales, podés validar también
 * `sala.cuposReservados >= sala.capacidadTotal` antes de guardar.
 */
export async function reservaSalaCupo(clienteReservaSalaData: ClienteReservaSalaData): Promise<void> {
  const sala = salaPorIdSala(clienteReservaSalaData.idSala);

  if (!sala || sala.capacidadTotal === 0) {
    throw new HttpsError(
      "failed-precondition",
      "No se puede reservar en esta sala (sin cupos configurados o sala no válida)."
    );
  }

  await agregarDatosClienteReservaSalaAlSheet(clienteReservaSalaData);
}


/** Cantidad de filas de reserva en el Sheet para esa sala (desde A2). */
export async function contarReservasSala(idSala: number): Promise<number> {
  const sala = salaPorIdSala(idSala);

  if (!sala) {
    throw new HttpsError("not-found", "La sala no existe.");
  }

  return await contarFilasReservasSala(idSala);
}