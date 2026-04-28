/**
 * Tipos del flujo “reserva de cupo por sala” compartidos entre el servicio y la UI (ver cupo).
 * Los callables validan en el back; aquí solo la forma de los datos.
 */

export interface ClienteReservaSalaData {
  idSala: number;
  fecha: string;
  horaCharla: string;
  nombre: string;
  numDoc: string;
  correo: string;
}

export type ResultadoCupoPorUuid =
  | { encontrada: false }
  | {
      encontrada: true;
      idSala: number;
      nombreSala: string;
      fecha: string;
      horaCharla: string;
      nombre: string;
      numDoc: string;
      correo: string;
    };
