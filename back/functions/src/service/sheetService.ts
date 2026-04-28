/**
 * Lectura/escritura en Google Sheets (transacciones del foro y reservas por sala).
 */
import {google} from 'googleapis';
import { accFireBaseConfig } from '../configSecrets/firebaseConfigAccount';

const SHEET_ID = '1uon5WZ7e6Nr2Gg2sWLKUS9gExPbVhBwdpIIK1iV_HvE';

/** Salas con reservas activas (pestañas Sala{n}Reservas). La 3 puede existir en el Sheet solo por histórico. */
const IDS_SALA_RESERVA_ACTIVA = new Set<number>([1, 2, 4]);

interface TransaccionData{
  fecha: string;
  referencia: string;
  esCliente: boolean;
  inmobiliaria: string | null;
  ciudad: string | null;
  poliza: string | null;
  cantidadBoletas: number;
  precioTotal: number;
  asistentes: {
    nombre: string;
    telefono: string;
    correo: string;
    numDoc: string
  }[];
  estado: string;
  ejecutivo: string;
  segmento: string;
  contratos: string;
  primas: string
}


export interface ClienteReservaSalaData {
  idSala: number;
  id: string;
  /** Día de la charla (YYYY-MM-DD). */
  fecha: string;
  /** Hora de inicio del bloque (HH:mm, ej. 14:30). */
  horaCharla: string;
  nombre: string;
  numDoc: string;
  correo: string;
}

/** Deja solo año-mes-día (YYYY-MM-DD) para la celda del Sheet, sin hora ni zona. */
export function fechaSoloDiaParaSheet(fecha: string): string {
  const s = fecha.trim();
  const head = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) {
    return head;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return head || s;
}

/** Normaliza hora a HH:mm para comparar con la columna B del Sheet. */
export function normalizarHoraSheet(hora: string): string {
  const t = hora.trim();
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    return t;
  }
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export async function agregarFilaAsheet(transaccionData: TransaccionData) {

    const serviceAccount = await accFireBaseConfig();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({version: 'v4', auth});

    const values = transaccionData.asistentes.map((asistente, index) => [
    transaccionData.fecha,
    transaccionData.referencia,
    transaccionData.esCliente ? 'SI' : 'NO',
    transaccionData.inmobiliaria || 'N/A',
    transaccionData.ciudad || 'N/A',
    transaccionData.poliza || 'N/A',
    index === 0 ? transaccionData.cantidadBoletas : 0,
    index === 0 ? transaccionData.precioTotal : 0,
    asistente.nombre,
    asistente.numDoc,
    asistente.correo,
    asistente.telefono,
    transaccionData.estado,
    transaccionData.ejecutivo || 'N/A',
    index === 0 ? transaccionData.segmento : 0,
    index === 0 ? transaccionData.contratos : 0,
    index === 0 ? transaccionData.primas : 0
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'transaccionesForo2026!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

/**
 * Una fila por reserva en `Sala{n}Reservas`, desde A2.
 * Columnas: A id (UUID), B fecha (YYYY-MM-DD), C hora (HH:mm), D nombre, E documento, F correo.
 */
export async function agregarDatosClienteReservaSalaAlSheet(clienteReservaSalaData: ClienteReservaSalaData) {
  const { idSala, id, fecha, horaCharla, nombre, numDoc, correo } = clienteReservaSalaData;

  if (!IDS_SALA_RESERVA_ACTIVA.has(idSala)) {
    throw new Error("La sala debe ser 1, 2 o 4");
  }

  const pestaña = `Sala${idSala}Reservas`;
  const range = `${pestaña}!A2`;

  const serviceAccount = await accFireBaseConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const values = [
    [
      id,
      fechaSoloDiaParaSheet(fecha),
      normalizarHoraSheet(horaCharla),
      nombre.trim(),
      numDoc.trim(),
      correo.trim(),
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}

const PESTAÑA_PREGUNTAS_SPEAKERS = "PreguntasSpeakers";

export interface PreguntaSpeakerRow {
  nombreSpeaker: string;
  pregunta: string;
}

/**
 * Una fila por pregunta en la pestaña `PreguntasSpeakers`, append desde A2 (fila 1 libre para encabezados).
 * Columnas: A fecha/hora ISO (UTC), B nombre del speaker, C pregunta.
 */
export async function agregarPreguntaSpeakerAlSheet(row: PreguntaSpeakerRow): Promise<void> {
  const serviceAccount = await accFireBaseConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const values = [
    [
      new Date().toISOString(),
      row.nombreSpeaker.trim(),
      row.pregunta.trim(),
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${PESTAÑA_PREGUNTAS_SPEAKERS}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}

/**
 * Reservas para un turno concreto (misma fecha en B y misma hora en C).
 * Filas desde la 2; columnas A–F como en `agregarDatosClienteReservaSalaAlSheet`.
 */
export async function contarReservasPorSlot(
  idSala: number,
  fecha: string,
  horaCharla: string
): Promise<number> {
  if (!IDS_SALA_RESERVA_ACTIVA.has(idSala)) {
    throw new Error("La sala debe ser 1, 2 o 4");
  }

  const fechaNorm = fechaSoloDiaParaSheet(fecha);
  const horaNorm = normalizarHoraSheet(horaCharla);

  const serviceAccount = await accFireBaseConfig();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const pestaña = `Sala${idSala}Reservas`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${pestaña}!A2:F`,
  });

  const rows = response.data.values ?? [];
  let n = 0;
  for (const row of rows) {
    const celFecha = row[1] != null ? fechaSoloDiaParaSheet(String(row[1])) : "";
    const celHora =
      row[2] != null ? normalizarHoraSheet(String(row[2])) : "";
    if (celFecha === fechaNorm && celHora === horaNorm) {
      n++;
    }
  }
  return n;
}

export interface ReservaSalaEncontradaEnSheet {
  idSala: number;
  idReserva: string;
  fecha: string;
  horaCharla: string;
  nombre: string;
  numDoc: string;
  correo: string;
}

/** Busca la fila cuyo UUID (columna A) coincide, en las pestañas Sala1Reservas…Sala4Reservas. */
export async function buscarReservaSalaPorUuid(
  uuidBuscado: string
): Promise<ReservaSalaEncontradaEnSheet | null> {
  const needle = uuidBuscado.trim();
  if (!needle) {
    return null;
  }

  const serviceAccount = await accFireBaseConfig();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  for (let idSala = 1; idSala <= 4; idSala++) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `Sala${idSala}Reservas!A2:F`,
    });
    const rows = response.data.values ?? [];
    for (const row of rows) {
      const idCel = row[0] != null ? String(row[0]).trim() : "";
      if (idCel === needle) {
        return {
          idSala,
          idReserva: idCel,
          fecha: row[1] != null ? String(row[1]) : "",
          horaCharla: row[2] != null ? String(row[2]) : "",
          nombre: row[3] != null ? String(row[3]) : "",
          numDoc: row[4] != null ? String(row[4]) : "",
          correo: row[5] != null ? String(row[5]) : "",
        };
      }
    }
  }
  return null;
}
