import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface ClienteReservaSalaData {
  idSala: number;
  fecha: string;
  horaCharla: string;
  nombre: string;
  numDoc: string;
  correo: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReservaCupos {
  constructor(private functions: Functions) {}

  /** Reservas ya registradas en el Sheet para ese turno (sala + fecha + hora). */
  async contarReservasSala(
    idSala: number,
    fecha: string,
    horaCharla: string,
  ): Promise<number> {
    const callable = httpsCallable<
      { idSala: number; fecha: string; horaCharla: string },
      number
    >(this.functions, 'contarReservasSalaProd');
    const result = await callable({ idSala, fecha, horaCharla });
    return result.data;
  }

  async reservaSalaCupo(data: ClienteReservaSalaData): Promise<void> {
    const callable = httpsCallable<ClienteReservaSalaData, { ok: boolean }>(
      this.functions,
      'reservarCupoSalaProd',
    );
    await callable(data);
  }
}
