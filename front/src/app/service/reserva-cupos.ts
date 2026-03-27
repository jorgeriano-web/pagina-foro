import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface ClienteReservaSalaData {
  idSala: number;
  fecha: string;
  nombre: string;
  numDoc: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReservaCupos {

  constructor(private functions : Functions){}


  async contarReservasSala(idSala: number): Promise<number> {
    const callable = httpsCallable<{ idSala: number }, number>(
      this.functions,
      'contarReservasSalaProd'
    );
    const result = await callable({ idSala });
    return result.data;
  }

  async reservaSalaCupo(clienteReservaSalaData: ClienteReservaSalaData): Promise<void> {
    const callable = httpsCallable<ClienteReservaSalaData, void>(this.functions, 'reservarCupoSalaProd');
    await callable(clienteReservaSalaData);
  }

}
