import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import type { SalaExperienciaPublica } from '../models/sala-experiencia';

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
  private salasExperienciaCache: Promise<SalaExperienciaPublica[]> | null = null;

  constructor(private functions: Functions) {}

  /**
   * Cupos y nombres oficiales por sala (misma fuente que valida `reservarCupoSalaProd`).
   */
  async listarSalasExperiencia(): Promise<SalaExperienciaPublica[]> {
    if (!this.salasExperienciaCache) {
      const callable = httpsCallable<
        Record<string, never>,
        SalaExperienciaPublica[]
      >(this.functions, 'listarSalasExperienciaProd');
      this.salasExperienciaCache = callable({})
        .then((r) => r.data)
        .catch((e) => {
          this.salasExperienciaCache = null;
          throw e;
        });
    }
    return this.salasExperienciaCache;
  }

  /** Para reintentar tras un error de red o tras deploy de functions. */
  invalidarCacheSalasExperiencia(): void {
    this.salasExperienciaCache = null;
  }

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
