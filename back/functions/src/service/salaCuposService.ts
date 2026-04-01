import { HttpsError } from "firebase-functions/v2/https";
import { SALAS_EXPERIENCIA } from "../models/salaExperiencia";
import {
  agregarDatosClienteReservaSalaAlSheet,
  ClienteReservaSalaData,
  contarFilasReservasSala,
} from "./sheetService";
import { enviarEmail } from "./emailService";

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

  const fechaCharla = clienteReservaSalaData.fecha.trim();
  const horaCharla = clienteReservaSalaData.horaCharla.trim();
  const mensaje = [
    `Hola ${clienteReservaSalaData.nombre.trim()},`,
    "",
    "Te confirmamos tu reserva de cupo para la experiencia alterna:",
    "",
    `• Sala: ${sala.id} — ${sala.nombre}`,
    `• Fecha: ${fechaCharla}`,
    `• Hora: ${horaCharla}`,
    "",
    "Te esperamos en el XVI Foro Experiencia Inmobiliaria (Cartagena, 21 y 22 de mayo de 2026).",
  ].join("\n");

  try {
    await enviarEmail({
      correo: clienteReservaSalaData.correo.trim(),
      asunto: `Confirmación de cupo — ${sala.nombre}`,
      mensaje,
    });
  } catch (e) {
    console.error("reservaSalaCupo: correo de confirmación no enviado:", e);
  }
}


/** Cantidad de filas de reserva en el Sheet para esa sala (desde A2). */
export async function contarReservasSala(idSala: number): Promise<number> {
  const sala = salaPorIdSala(idSala);

  if (!sala) {
    throw new HttpsError("not-found", "La sala no existe.");
  }

  return await contarFilasReservasSala(idSala);
}