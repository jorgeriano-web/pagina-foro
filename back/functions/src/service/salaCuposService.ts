/**
 * Caso de uso “reservar cupo”: valida cupos, escribe fila en Sheet y envía correo con QR.
 */
import { HttpsError } from "firebase-functions/v2/https";
import QRCode from "qrcode";
import { SALAS_EXPERIENCIA } from "../models/salaExperiencia";
import { PUBLIC_APP_ORIGIN } from "../config/publicAppUrl";
import {
  agregarDatosClienteReservaSalaAlSheet,
  ClienteReservaSalaData,
  contarReservasPorSlot,
} from "./sheetService";
import { enviarEmail } from "./emailService";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

  const ocupados = await contarReservasPorSlot(
    clienteReservaSalaData.idSala,
    clienteReservaSalaData.fecha,
    clienteReservaSalaData.horaCharla
  );
  if (ocupados >= sala.capacidadTotal) {
    throw new HttpsError(
      "resource-exhausted",
      "No hay cupos disponibles para ese día y hora. Elegí otro turno."
    );
  }

  await agregarDatosClienteReservaSalaAlSheet(clienteReservaSalaData);

  const fechaCharla = clienteReservaSalaData.fecha.trim();
  const horaCharla = clienteReservaSalaData.horaCharla.trim();
  const nombreLimpio = clienteReservaSalaData.nombre.trim();
  const baseUrl = PUBLIC_APP_ORIGIN.replace(/\/$/, "");
  const cupoUrl = `${baseUrl}/cupo/${encodeURIComponent(clienteReservaSalaData.id)}`;

  let qrAdjunto: { filename: string; content: Buffer; cid: string }[] = [];
  try {
    const qrPng = await QRCode.toBuffer(cupoUrl, { type: "png", margin: 1, width: 220 });
    qrAdjunto = [{ filename: "cupo-qr.png", content: qrPng, cid: "qrcupo" }];
  } catch (e) {
    console.error("reservaSalaCupo: no se generó el QR:", e);
  }

  const mensaje = [
    `Hola ${nombreLimpio},`,
    "",
    "Te confirmamos tu reserva de cupo para la experiencia alterna:",
    "",
    `• Sala: ${sala.id} — ${sala.nombre}`,
    `• Fecha: ${fechaCharla}`,
    `• Hora: ${horaCharla}`,
    "",
    "Presentá el código QR del correo (o este enlace) en el ingreso:",
    cupoUrl,
    "",
    "Te esperamos en el XVI Foro Experiencia Inmobiliaria (Cartagena, 21 y 22 de mayo de 2026).",
  ].join("\n");

  const bloqueQr =
    qrAdjunto.length > 0
      ? `<p><img src="cid:qrcupo" width="220" height="220" alt="Código QR del cupo" style="display:block;border:0;" /></p>`
      : `<p><em>No se pudo generar la imagen del QR; usá el enlace de abajo.</em></p>`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
<p>Hola ${escapeHtml(nombreLimpio)},</p>
<p>Te confirmamos tu reserva de cupo para la experiencia alterna:</p>
<ul>
<li><strong>Sala:</strong> ${escapeHtml(String(sala.id))} — ${escapeHtml(sala.nombre)}</li>
<li><strong>Fecha:</strong> ${escapeHtml(fechaCharla)}</li>
<li><strong>Hora:</strong> ${escapeHtml(horaCharla)}</li>
</ul>
<p>Presentá este código QR en el ingreso (o abrí el enlace en el celular):</p>
${bloqueQr}
<p><a href="${cupoUrl}">Abrir mi cupo en el navegador</a></p>
<p style="font-size:0.9em;color:#555;">Te esperamos en el XVI Foro Experiencia Inmobiliaria (Cartagena, 21 y 22 de mayo de 2026).</p>
</body></html>`;

  try {
    await enviarEmail({
      correo: clienteReservaSalaData.correo.trim(),
      asunto: `Confirmación de cupo — ${sala.nombre}`,
      mensaje,
      html,
      adjuntosExtra: qrAdjunto,
    });
  } catch (e) {
    console.error("reservaSalaCupo: correo de confirmación no enviado:", e);
  }
}


/** Cupos ya tomados para ese turno (sala + fecha + hora). */
export async function contarReservasSala(
  idSala: number,
  fecha: string,
  horaCharla: string
): Promise<number> {
  const sala = salaPorIdSala(idSala);

  if (!sala) {
    throw new HttpsError("not-found", "La sala no existe.");
  }

  return await contarReservasPorSlot(idSala, fecha, horaCharla);
}