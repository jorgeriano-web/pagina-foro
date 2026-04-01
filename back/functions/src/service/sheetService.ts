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
      horaCharla.trim(),
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

/** Cantidad de reservas: solo columna A desde la fila 2 (fila 1 = títulos; mismo criterio que el append en `A2`). */
export async function contarFilasReservasSala(idSala: number): Promise<number> {
  if (idSala !== 1 && idSala !== 2 && idSala !== 3 && idSala !== 4) {
    throw new Error("La sala debe ser 1, 2, 3 o 4");
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
  const pestaña = `Sala${idSala}Reservas`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${pestaña}!A2:A`,
  });

  return response.data.values?.length ?? 0;
}
