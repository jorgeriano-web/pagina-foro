import {google} from 'googleapis';
import { accFireBaseConfig } from '../configSecrets/firebaseConfigAccount';

const SHEET_ID = '1uon5WZ7e6Nr2Gg2sWLKUS9gExPbVhBwdpIIK1iV_HvE';

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
 * Columnas: A fecha (YYYY-MM-DD), B hora (HH:mm), C nombre, D documento, E correo.
 * Ajustá la fila 1 de cada pestaña con esos títulos si aún tenías el orden anterior.
 */
export async function agregarDatosClienteReservaSalaAlSheet(clienteReservaSalaData: ClienteReservaSalaData) {
  const { idSala, fecha, horaCharla, nombre, numDoc, correo } = clienteReservaSalaData;

  if (idSala !== 1 && idSala !== 2 && idSala !== 3 && idSala !== 4) {
    throw new Error("La sala debe ser 1, 2, 3 o 4");
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

/**
 * Reservas para un turno concreto (misma fecha en A y misma hora en B).
 * Filas desde la 2; columnas A–E como en `agregarDatosClienteReservaSalaAlSheet`.
 */
export async function contarReservasPorSlot(
  idSala: number,
  fecha: string,
  horaCharla: string
): Promise<number> {
  if (idSala !== 1 && idSala !== 2 && idSala !== 3 && idSala !== 4) {
    throw new Error("La sala debe ser 1, 2, 3 o 4");
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
    range: `${pestaña}!A2:E`,
  });

  const rows = response.data.values ?? [];
  let n = 0;
  for (const row of rows) {
    const celFecha = row[0] != null ? fechaSoloDiaParaSheet(String(row[0])) : "";
    const celHora =
      row[1] != null ? normalizarHoraSheet(String(row[1])) : "";
    if (celFecha === fechaNorm && celHora === horaNorm) {
      n++;
    }
  }
  return n;
}
