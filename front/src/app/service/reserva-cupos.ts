/**
 * Cliente Angular → Firebase Callable para cupos de experiencias alternas
 * (listar salas, contar por turno, reservar, consultar por UUID del cupo).
 */
import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import type { SalaExperienciaPublica } from '../models/sala-experiencia';
import { CF_CUPO } from './reserva-cupos.callables';
import type { ClienteReservaSalaData, ResultadoCupoPorUuid } from './reserva-cupos.types';

export type { ClienteReservaSalaData, ResultadoCupoPorUuid } from './reserva-cupos.types';

@Injectable({
  providedIn: 'root',
})
export class ReservaCupos {
  private salasExperienciaCache: Promise<SalaExperienciaPublica[]> | null = null;

  constructor(private functions: Functions) {}

  /**
   * Cupos y nombres oficiales por sala (misma fuente que valida el callable en el back).
   */
  async listarSalasExperiencia(): Promise<SalaExperienciaPublica[]> {
    if (!this.salasExperienciaCache) {
      const callable = httpsCallable<
        Record<string, never>,
        SalaExperienciaPublica[]
      >(this.functions, CF_CUPO.listarSalas);
      this.salasExperienciaCache = callable({})
        .then((r) => r.data)
        .catch((e) => {
          this.salasExperienciaCache = null;
          throw e;
        });
    }
    return this.salasExperienciaCache;
  }

  /** Limpia caché de salas (error de red o tras deploy de functions). */
  invalidarCacheSalasExperiencia(): void {
    this.salasExperienciaCache = null;
  }

  /** Cantidad de reservas ya guardadas en Sheet para sala + fecha + hora. */
  async contarReservasSala(
    idSala: number,
    fecha: string,
    horaCharla: string,
  ): Promise<number> {
    const callable = httpsCallable<
      { idSala: number; fecha: string; horaCharla: string },
      number
    >(this.functions, CF_CUPO.contarReservas);
    const result = await callable({ idSala, fecha, horaCharla });
    return result.data;
  }

  /** Busca una reserva por el UUID del cupo (QR / enlace). */
  async obtenerCupoPorUuid(uuid: string): Promise<ResultadoCupoPorUuid> {
    const callable = httpsCallable<{ uuid: string }, ResultadoCupoPorUuid>(
      this.functions,
      CF_CUPO.obtenerPorUuid,
    );
    const result = await callable({ uuid });
    return result.data;
  }

  /** Registra una nueva reserva de cupo. */
  async reservaSalaCupo(data: ClienteReservaSalaData): Promise<void> {
    const callable = httpsCallable<ClienteReservaSalaData, { ok: boolean }>(
      this.functions,
      CF_CUPO.reservar,
    );
    await callable(data);
  }
}
