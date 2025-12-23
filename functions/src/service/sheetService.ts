import {google} from 'googleapis';
import * as serviceAccount from '../serviceAccount.json';

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
}

export async function agregarFilaAsheet(transaccionData: TransaccionData) {

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