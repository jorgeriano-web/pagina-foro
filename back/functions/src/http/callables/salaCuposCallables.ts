/**
 * Callables HTTP del dominio “cupos por sala / experiencias alternas”.
 * Mantiene la capa de transporte (validación de payload, onCall) separada del negocio en services.
 */
import { randomUUID } from "crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { buscarReservaSalaPorUuid } from "../../service/sheetService";
import { contarReservasSala, reservaSalaCupo } from "../../service/salaCuposService";
import { SALAS_EXPERIENCIA, salasExperienciaParaCliente } from "../../models/salaExperiencia";
import { EMAIL_CREDENTIALS } from "../../configSecrets/emailConfig";
import { FIREBASE_CONFIG_ACCOUNT } from "../../configSecrets/firebaseConfigAccount";

export const reservarCupoSalaProd = onCall(
  { cors: true, secrets: [FIREBASE_CONFIG_ACCOUNT, EMAIL_CREDENTIALS] },
  async (request) => {
    const data = request.data as {
      idSala?: number;
      fecha?: string;
      horaCharla?: string;
      nombre?: string;
      numDoc?: string;
      correo?: string;
    };

    if (!data || typeof data !== "object") {
      throw new HttpsError("invalid-argument", "Faltan datos de reserva.");
    }

    const { idSala, fecha, horaCharla, nombre, numDoc, correo } = data;

    if (idSala !== 1 && idSala !== 2 && idSala !== 4) {
      throw new HttpsError("invalid-argument", "idSala debe ser 1, 2 o 4.");
    }

    if (!fecha || !horaCharla || !nombre || !numDoc || !correo) {
      throw new HttpsError(
        "invalid-argument",
        "Completá fecha, hora, nombre, número de documento y correo."
      );
    }

    const horaOk = /^\d{1,2}:\d{2}$/.test(horaCharla.trim());
    if (!horaOk) {
      throw new HttpsError(
        "invalid-argument",
        "La hora debe tener formato HH:mm (ej. 14:30)."
      );
    }

    try {
      await reservaSalaCupo({
        idSala,
        id: randomUUID(),
        fecha,
        horaCharla: horaCharla.trim(),
        nombre,
        numDoc,
        correo,
      });
      return { ok: true };
    } catch (e: unknown) {
      if (e instanceof HttpsError) {
        throw e;
      }
      console.error("reservarCupoSalaProd:", e);
      throw new HttpsError("internal", "Error al reservar cupo.");
    }
  }
);

export const contarReservasSalaProd = onCall(
  { cors: true, secrets: [FIREBASE_CONFIG_ACCOUNT] },
  async (request) => {
    const data = request.data as {
      idSala?: number;
      fecha?: string;
      horaCharla?: string;
    };

    const idSala = data?.idSala;
    const fecha = data?.fecha;
    const horaCharla = data?.horaCharla;

    if (idSala !== 1 && idSala !== 2 && idSala !== 4) {
      throw new HttpsError(
        "invalid-argument",
        "Enviá idSala: 1, 2 o 4."
      );
    }

    if (!fecha || !horaCharla) {
      throw new HttpsError(
        "invalid-argument",
        "Enviá fecha (YYYY-MM-DD) y horaCharla (HH:mm) del turno."
      );
    }

    const horaOk = /^\d{1,2}:\d{2}$/.test(horaCharla.trim());
    if (!horaOk) {
      throw new HttpsError(
        "invalid-argument",
        "horaCharla debe tener formato HH:mm (ej. 14:30)."
      );
    }

    try {
      return await contarReservasSala(idSala, fecha, horaCharla.trim());
    } catch (e: unknown) {
      if (e instanceof HttpsError) {
        throw e;
      }
      console.error("contarReservasSalaProd:", e);
      throw new HttpsError("internal", "Error al consultar reservas de la sala.");
    }
  }
);

export const listarSalasExperienciaProd = onCall({ cors: true }, async () => {
  return salasExperienciaParaCliente();
});

const RX_UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const obtenerCupoPorUuidProd = onCall(
  { cors: true, secrets: [FIREBASE_CONFIG_ACCOUNT] },
  async (request) => {
    const uuid = String((request.data as { uuid?: string })?.uuid ?? "").trim();
    if (!RX_UUID_V4.test(uuid)) {
      throw new HttpsError("invalid-argument", "Identificador de cupo inválido.");
    }

    try {
      const row = await buscarReservaSalaPorUuid(uuid);
      if (!row) {
        return { encontrada: false as const };
      }
      const sala = SALAS_EXPERIENCIA.find((s) => s.id === row.idSala);
      return {
        encontrada: true as const,
        idSala: row.idSala,
        nombreSala: sala?.nombre ?? `Sala ${row.idSala}`,
        fecha: row.fecha,
        horaCharla: row.horaCharla,
        nombre: row.nombre,
        numDoc: row.numDoc,
        correo: row.correo,
      };
    } catch (e: unknown) {
      console.error("obtenerCupoPorUuidProd:", e);
      throw new HttpsError("internal", "No se pudo consultar el cupo.");
    }
  }
);
